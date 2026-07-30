// @vitest-environment node — 파일시스템만 읽는 순수 테스트 (기준: vitest.config.ts)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { describe, expect, it } from 'vitest';

import { pressable, pressableSubtle } from '@/shared/styles';

/*
 * 누름 믹스인이 소비처의 `transition` 을 덮지 않는지 잠근다.
 *
 * 2026-07-31 실측 사고: 믹스인이 `transition: scale …` 을 스스로 선언했는데, `transition` 은
 * **단축 속성**이라 뒤에 오는 선언이 앞의 것을 통째로 덮는다. 소비처가 자기 전환을 먼저 쓰고
 * 그 뒤에 믹스인을 얹은 네 곳(`Button`·`Chip`·`TickerPicker`·`PortfolioPresetBoard`)에서
 * **색·테두리·그림자 hover 전환이 전부 사라져 있었다.** 헤더 '글쓰기' 버튼의 computed
 * `transition-property` 가 `scale` 하나뿐인 것으로 확인됐다.
 *
 * 소스만 읽으면 두 선언이 다 보이기 때문에 리뷰로는 잡히지 않는다 — 렌더를 재야 보인다.
 * 그래서 "재야 보이는 것"을 **구조 불변식**으로 바꿔 소스에서 잡는다.
 */

const REPO_ROOT = process.cwd();
const ROOTS = ['components', 'pages', 'shared'] as const;
const SKIP_DIRS = new Set(['node_modules', '__snapshots__', '.git']);

function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listFiles(full));
    else if (/\.styled\.ts$/.test(entry)) out.push(full);
  }
  return out;
}

const styledFiles = ROOTS.flatMap((root) => listFiles(join(REPO_ROOT, root)));
const rel = (p: string) => relative(REPO_ROOT, p).split(sep).join('/');

/*
 * ── 스타일드 **블록 단위**로 세는 이유 (2026-07-31 감사) ─────────────────────────────
 * 종전 가드는 `source.includes('${pressTransition}')` 로 **파일에 한 번이라도** 있으면 통과했다.
 * 한 `.styled.ts` 에 누름 소비처가 둘인데 한쪽만 전환 목록에 넣으면 가드는 초록인 채로 그 한쪽의
 * 누름이 애니메이션 없이 튄다. 더 얄궂은 구멍도 이미 레포에 있다 — `ScrollTopButton.styled.ts` 는
 * **CSS 주석 안에** '${pressTransition}' 을 적어 두는데(주석도 템플릿 리터럴이라 실제로 보간된다),
 * 파일 단위 검사에서는 그 주석 한 줄만으로 진짜 선언을 통째로 지워도 통과한다.
 *
 * 그래서 (1) 최상위 템플릿 리터럴 = styled 블록 하나로 잘라 짝을 세고, (2) 세기 전에 CSS 주석을
 * 걷어낸다. 블록을 정규식으로 자르지 않는 이유는 보간 안에 **중첩 템플릿**이 들어가기 때문이다
 * (`PrimaryNav.styled.ts` 의 `${({ $scrollRow }) => …}`) — 백틱을 세는 스캐너라야 안 틀린다.
 */

/** `source[start]` 의 백틱에서 시작하는 템플릿 리터럴의 **닫는 백틱 다음** 인덱스. */
function endOfTemplate(source: string, start: number): number {
  let i = start + 1;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === '`') return i + 1;
    if (ch === '$' && source[i + 1] === '{') {
      i = endOfInterpolation(source, i + 2);
      continue;
    }
    i += 1;
  }
  return i;
}

/** `${` 바로 뒤에서 시작해 짝이 맞는 `}` **다음** 인덱스. 객체 리터럴·중첩 템플릿을 통과한다. */
function endOfInterpolation(source: string, start: number): number {
  let i = start;
  let depth = 1;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '`') {
      i = endOfTemplate(source, i);
      continue;
    }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
    i += 1;
  }
  return i;
}

/** 따옴표 문자열의 **닫는 따옴표 다음** 인덱스. 줄을 넘지 않는다(안 닫혔으면 거기서 멈춘다). */
function endOfQuoted(source: string, start: number): number {
  const quote = source[start];
  let i = start + 1;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === quote || ch === '\n') return i + 1;
    i += 1;
  }
  return i;
}

type StyledBlock = { name: string; css: string };

/**
 * 파일에서 최상위 템플릿 리터럴을 뽑고, 바로 앞 선언의 이름을 붙인다. CSS 주석은 걷어낸다.
 *
 * ⚠ 템플릿 **밖**의 주석·문자열을 먼저 건너뛴다. 이 레포의 JSDoc 은 백틱을 아주 흔하게 쓰는데
 * (`PrimaryNav.styled.ts` 한 파일에만 수십 개), 안 건너뛰면 그 백틱이 가짜 블록을 열어 뒤따르는
 * 진짜 styled 블록을 통째로 삼킨다 — 그러면 짝 검사가 조용히 무력해진다(실측으로 확인했다).
 */
function styledBlocks(source: string): StyledBlock[] {
  const blocks: StyledBlock[] = [];
  let i = 0;
  let previousEnd = 0;

  while (i < source.length) {
    const ch = source[i];

    if (ch === '/' && source[i + 1] === '*') {
      const close = source.indexOf('*/', i + 2);
      i = close === -1 ? source.length : close + 2;
      continue;
    }
    if (ch === '/' && source[i + 1] === '/') {
      const newline = source.indexOf('\n', i);
      i = newline === -1 ? source.length : newline + 1;
      continue;
    }
    if (ch === "'" || ch === '"') {
      i = endOfQuoted(source, i);
      continue;
    }
    if (ch !== '`') {
      i += 1;
      continue;
    }
    const end = endOfTemplate(source, i);
    const declaration = source.slice(previousEnd, i);
    const name = /(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=[^=]*$/.exec(declaration)?.[1] ?? '(익명)';
    blocks.push({ name, css: source.slice(i, end).replace(/\/\*[\s\S]*?\*\//g, '') });
    previousEnd = end;
    i = end;
  }

  return blocks;
}

const PRESSABLE_USE = /\$\{pressable(?:Subtle)?\}/;

const pressableBlocks = styledFiles.flatMap((file) =>
  styledBlocks(readFileSync(file, 'utf8'))
    .filter((block) => PRESSABLE_USE.test(block.css))
    .map((block) => ({ ...block, file: rel(file) }))
);

describe('누름 믹스인은 소비처의 transition 을 덮지 않는다', () => {
  /*
   * 이게 **근본 불변식**이다. 믹스인이 `transition` 을 선언하는 순간, 얹는 위치에 따라
   * 소비처의 전환이 조용히 사라진다 — 순서 규칙을 문서로 두면 반드시 어긋난다.
   */
  it('믹스인 자체가 transition 을 선언하지 않는다', () => {
    expect(pressable).not.toMatch(/transition\s*:/);
    expect(pressableSubtle).not.toMatch(/transition\s*:/);
  });

  /*
   * 스캐너가 죽으면(백틱 세기가 틀어지거나 믹스인 이름이 바뀌면) 아래 계약이 **소비처 0개**로
   * 조용히 통과한다. 감사 대상이 실제로 잡히는지부터 확인한다. 오늘 소비처는 5곳이다 —
   * 늘어나는 건 정상이고, 줄어들면 스캐너를 의심하라.
   */
  it('감사 대상이 실제로 잡힌다', () => {
    expect(pressableBlocks.length).toBeGreaterThanOrEqual(5);
  });

  /*
   * 믹스인이 전환을 안 갖게 됐으므로 이제 소비처가 `scale` 을 자기 목록에 넣어야 한다.
   * 안 넣으면 누름이 애니메이션 없이 즉시 튄다(기능은 살아 있어 렌더 테스트로는 안 잡힌다).
   *
   * **블록 단위**로 센다 — 같은 파일의 다른 블록(또는 주석 한 줄)이 대신 통과시키면 안 된다.
   */
  it('pressable 을 쓰는 스타일드 블록은 자기 transition 목록에 pressTransition 을 끼운다', () => {
    const offenders = pressableBlocks
      .filter((block) => !block.css.includes('${pressTransition}'))
      .map((block) => `${block.file} → ${block.name}`);

    expect(offenders).toEqual([]);
  });
});
