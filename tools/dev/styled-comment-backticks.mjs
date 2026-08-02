#!/usr/bin/env node
/**
 * Emotion 템플릿 리터럴 **안쪽 CSS 주석**의 백틱을 찾아내고(선택적으로) 고친다.
 *
 * 왜 있는가 — 이 레포의 단골 사고
 * ---------------------------------------------------------------------------
 * styled.div 의 백틱 템플릿 안에 CSS 주석을 쓰면서 «size» 처럼 백틱을 넣으면 **그 자리에서
 * 템플릿이 끝난다.** 그 뒤 CSS 가 통째로 TypeScript 코드로 해석돼 TS1005·TS1443 같은
 * 엉뚱한 구문 오류가 수십 줄 쏟아진다 — 오류 메시지가 원인을 안 가리켜서 매번 다시 헤맨다.
 * 실제로 이 레포에서 최소 5번 반복됐다(ScenarioTabsRow·Card·PageHero·ConceptLadder·LandingSearch).
 *
 * 핵심 통찰 — 왜 단순 스캔으로는 못 잡나
 * ---------------------------------------------------------------------------
 * 템플릿 리터럴 **안**에서는 CSS 주석이 "주석"이 아니다. JS 렉서에게 그건 그냥 문자열이고,
 * 백틱 하나면 즉시 템플릿이 닫힌다. 반대로 템플릿 **밖** JSDoc 의 백틱은 완전히 안전하다
 * (코드펜스 3개도 무해). 즉 같은 «/* ... `x` ... *[/]» 이 위치에 따라 치명적이거나 무해하다.
 * 그래서 grep 도, 줄 단위 휴리스틱도 못 가른다 — **문자 단위로 렉싱**해야 한다.
 *
 * 어떻게 하나 — 2층 렉서
 * ---------------------------------------------------------------------------
 *  ① 바깥층: JS/TS 렉서. 코드 / 줄주석 / 블록주석 / 작은따옴표·큰따옴표 문자열 /
 *     정규식 리터럴 / 템플릿 리터럴 + «${}» 중첩을 문자 단위로 추적한다. 이스케이프도 본다.
 *     → "지금 위치가 템플릿 안인가"를 **정확히** 안다. 템플릿 밖 주석의 백틱은 아예 보지 않는다.
 *  ② 안쪽층: 템플릿 안에서만 도는 CSS 주석 추적기(블록 «/* *[/]» · 줄 «//» · CSS 문자열).
 *     → 템플릿 안에서 백틱을 만났을 때 "그게 CSS 주석 안이었나"를 안다. 그렇다면 위반이다.
 *
 * 위반을 만나면 **저자의 의도대로**(= 그 백틱은 주석 텍스트) 읽기를 이어간다. 그래야 한 파일에
 * 여러 건이 있어도 전부 잡히고, 그 뒤 파일 상태가 어긋나지 않는다. --fix 는 그 백틱 한 글자만
 * 작은따옴표로 바꿔 의도와 실제를 일치시킨다.
 *
 *   node tools/dev/styled-comment-backticks.mjs            # 검사만 (위반 있으면 exit 1)
 *   node tools/dev/styled-comment-backticks.mjs --fix      # 백틱을 작은따옴표로 바꾼다
 *   node tools/dev/styled-comment-backticks.mjs <경로...>  # 특정 파일/폴더만 (기본: components pages shared)
 *
 * 설계 관례: 순수 Node ESM, **외부 의존성 0**(node: 빌트인만). tools/ 는 앱 코드가 아니라
 * 도구라 .cursor/rules 의 폴더/index.ts 규칙 대상이 아니다.
 */

import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const FIX = argv.includes('--fix');
const VERBOSE = argv.includes('--verbose');
const TARGETS = argv.filter((a) => !a.startsWith('-'));
const ROOTS = TARGETS.length > 0 ? TARGETS : ['components', 'pages', 'shared'];

// ─────────────────────────────────────────────────────────────────────────────
// 렉서
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 이 문자 뒤의 «/» 는 나눗셈이 아니라 **정규식 리터럴**의 시작이다.
 * ⚠ «<»·«>»·«{»·«}» 는 일부러 뺐다 — .tsx 에서 «</div>»·«<Foo bar={x} />» 를
 *   정규식 시작으로 오인하면 그 뒤를 통째로 삼킨다. («=>» 만 예외적으로 따로 인정한다.)
 */
const REGEX_PREV_CHARS = new Set(['=', '(', ',', ':', '[', '!', '&', '|', '?', ';', '+', '-', '*', '%', '^', '~']);
const REGEX_PREV_WORDS = new Set([
  'return', 'typeof', 'case', 'in', 'of', 'do', 'else', 'void', 'delete', 'instanceof', 'new', 'yield', 'await'
]);

const isWordChar = (ch) => ch !== undefined && /[A-Za-z0-9_$]/.test(ch);

/** src[0..i) 에서 뒤로 훑어 마지막 "의미 있는" 문자 두 개를 구한다(공백만 건너뛴다). */
const lastTwoSignificant = (src, i) => {
  let j = i - 1;
  while (j >= 0 && /\s/.test(src[j])) j -= 1;
  const a = j >= 0 ? src[j] : null;
  let k = j - 1;
  while (k >= 0 && /\s/.test(src[k])) k -= 1;
  const b = k >= 0 ? src[k] : null;
  return { a, b, aIndex: j };
};

/** 지금 자리의 «/» 가 정규식 리터럴을 여는가. */
const startsRegex = (src, i) => {
  const { a, b, aIndex } = lastTwoSignificant(src, i);
  if (a === null) return true; // 파일 첫 토큰
  if (a === '>' && b === '=') return true; // 화살표 함수 «=> /re/»
  if (REGEX_PREV_CHARS.has(a)) return true;
  if (isWordChar(a)) {
    // 식별자면 나눗셈(«w / 2»), 키워드면 정규식(«return /re/»).
    let s = aIndex;
    while (s >= 0 && isWordChar(src[s])) s -= 1;
    return REGEX_PREV_WORDS.has(src.slice(s + 1, aIndex + 1));
  }
  return false;
};

/**
 * 한 파일을 렉싱해 "템플릿 안 CSS 주석의 백틱" 위치를 모두 돌려준다.
 *
 * @returns {{ violations: number[], balanced: boolean }}
 *   violations = 백틱의 문자 인덱스 배열, balanced = EOF 에서 렉서가 코드 문맥으로 돌아왔는가
 *   (false 면 파일이 실제로 깨졌거나 렉서가 길을 잃은 것 — 자기검사용).
 */
const scanSource = (src) => {
  const violations = [];
  const n = src.length;
  /** 문맥 스택. code = 일반 코드(«${}» 안 포함), template = 백틱 템플릿 본문. */
  const stack = [{ kind: 'code', brace: 0 }];
  let i = 0;

  while (i < n) {
    const top = stack[stack.length - 1];
    const ch = src[i];
    const next = src[i + 1];

    if (top.kind === 'code') {
      if (ch === '/' && next === '/') {                       // 줄주석 — 백틱을 봐도 무해
        while (i < n && src[i] !== '\n') i += 1;
        continue;
      }
      if (ch === '/' && next === '*') {                       // 블록주석(JSDoc 코드펜스 포함) — 무해
        i += 2;
        while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i += 1;
        i += 2;
        continue;
      }
      if (ch === "'" || ch === '"') {                         // 문자열 — 백틱이 들어 있어도 그냥 글자
        i += 1;
        while (i < n && src[i] !== ch) {
          if (src[i] === '\\') i += 1;
          if (src[i] === '\n') break;                         // 미종결 문자열 방어
          i += 1;
        }
        i += 1;
        continue;
      }
      if (ch === '/' && startsRegex(src, i)) {                // 정규식 리터럴
        i += 1;
        let inClass = false;
        while (i < n && src[i] !== '\n') {
          if (src[i] === '\\') { i += 2; continue; }
          if (src[i] === '[') inClass = true;
          else if (src[i] === ']') inClass = false;
          else if (src[i] === '/' && !inClass) break;
          i += 1;
        }
        i += 1;
        continue;
      }
      if (ch === '`') {                                       // 템플릿 시작
        stack.push({ kind: 'template', cssComment: null, cssString: null });
        i += 1;
        continue;
      }
      if (ch === '{') { top.brace += 1; i += 1; continue; }
      if (ch === '}') {
        if (top.brace === 0 && stack.length > 1) stack.pop();  // «${}» 닫힘 → 템플릿으로 복귀
        else top.brace -= 1;
        i += 1;
        continue;
      }
      i += 1;
      continue;
    }

    // ── 템플릿 본문 ────────────────────────────────────────────────────────
    if (ch === '\\') { i += 2; continue; }                    // 이스케이프(«\`» 는 템플릿을 안 닫는다)

    if (ch === '$' && next === '{') {                         // 보간 — 안쪽은 진짜 코드다
      stack.push({ kind: 'code', brace: 0 });
      i += 2;
      continue;
    }

    if (ch === '`') {
      if (top.cssComment) {
        // 🔴 여기가 사고 지점: 저자는 주석을 쓴 줄 알지만 TS 는 템플릿을 닫는다.
        violations.push(i);
        i += 1;                                               // 의도대로(주석 텍스트로) 읽기를 이어간다
        continue;
      }
      stack.pop();                                            // 정상 종료
      i += 1;
      continue;
    }

    // CSS 층 — 템플릿 본문 안에서만 의미가 있다.
    if (top.cssComment === 'block') {
      if (ch === '*' && next === '/') { top.cssComment = null; i += 2; continue; }
      i += 1;
      continue;
    }
    if (top.cssComment === 'line') {
      if (ch === '\n') top.cssComment = null;
      i += 1;
      continue;
    }
    if (top.cssString) {
      if (ch === top.cssString || ch === '\n') top.cssString = null;
      i += 1;
      continue;
    }
    if (ch === '/' && next === '*') { top.cssComment = 'block'; i += 2; continue; }
    if (ch === '/' && next === '/' && src[i - 1] !== ':') {    // «https://» 는 주석이 아니다
      top.cssComment = 'line';
      i += 2;
      continue;
    }
    if (ch === "'" || ch === '"') { top.cssString = ch; i += 1; continue; }
    i += 1;
  }

  const balanced = stack.length === 1 && stack[0].kind === 'code';
  return { violations, balanced };
};

// ─────────────────────────────────────────────────────────────────────────────
// 파일 수집 · 실행
// ─────────────────────────────────────────────────────────────────────────────

const files = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.ts') || e.name.endsWith('.tsx')) files.push(p.split(path.sep).join('/'));
  }
};
for (const root of ROOTS) {
  if (!fs.existsSync(root)) continue;
  if (fs.statSync(root).isDirectory()) walk(root);
  else files.push(root.split(path.sep).join('/'));
}

/** 문자 인덱스 → 1-based 줄 번호 · 열 번호 · 그 줄의 원문. */
const locate = (src, index) => {
  const before = src.slice(0, index);
  const line = before.split('\n').length;
  const lineStart = before.lastIndexOf('\n') + 1;
  const lineEnd = src.indexOf('\n', index);
  return {
    line,
    column: index - lineStart + 1,
    text: src.slice(lineStart, lineEnd === -1 ? src.length : lineEnd).trim().slice(0, 100)
  };
};

const violations = [];
const unbalanced = [];

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes('`')) continue;

  const { violations: hits, balanced } = scanSource(src);
  if (!balanced) unbalanced.push(file);
  if (hits.length === 0) continue;

  for (const index of hits) violations.push({ file, ...locate(src, index) });

  if (FIX) {
    // 뒤에서부터 한 글자씩 — 인덱스가 밀리지 않는다(줄 전체를 건드리지 않아 원문 의미가 보존된다).
    // ⚠ [...src] 로 배열화하면 안 된다 — 스프레드는 코드포인트 단위라 서로게이트 쌍(🔴 같은 이모지)을
    //   한 칸으로 접어 렉서가 준 **코드유닛** 인덱스와 어긋난다(실측: 🔴 하나당 한 칸씩 밀려 엉뚱한
    //   글자가 바뀌었다). 문자열 slice 는 코드유닛 기준이라 그대로 맞는다.
    let out = src;
    for (const index of [...hits].reverse()) out = out.slice(0, index) + "'" + out.slice(index + 1);
    fs.writeFileSync(file, out);
  }
}

if (unbalanced.length > 0) {
  // 렉서가 EOF 에서 코드 문맥으로 못 돌아왔다 = 파일이 실제로 깨졌거나 렉서가 길을 잃었다.
  // 검사 실패로 취급하지는 않는다(오탐으로 커밋을 막지 않는다) — 대신 눈에 띄게 알린다.
  console.error(`⚠ 렉서가 문맥을 닫지 못한 파일 ${unbalanced.length}개 — 파일이 깨졌거나 이 도구의 한계다:`);
  for (const f of unbalanced.slice(0, 10)) console.error(`   ${f}`);
}

if (violations.length === 0) {
  console.log(`검사한 파일 ${files.length}개 — 템플릿 안 주석에 백틱 없음 ✓`);
  if (VERBOSE) console.log(`(백틱을 포함한 파일만 렉싱했고, 문맥 불균형 ${unbalanced.length}건)`);
  process.exit(0);
}

for (const v of violations) console.log(`${v.file}:${v.line}:${v.column}  ${v.text}`);
console.log(`\n${violations.length}건${FIX ? ' — 작은따옴표로 고쳤다' : ' (--fix 로 고친다)'}`);
process.exit(FIX ? 0 : 1);
