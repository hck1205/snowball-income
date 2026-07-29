#!/usr/bin/env node
/**
 * Emotion 템플릿 리터럴 **안쪽 주석**의 백틱을 찾아내고(선택적으로) 고친다.
 *
 * 왜 있는가 — 이 레포의 단골 사고
 * ---------------------------------------------------------------------------
 * `styled.div` 의 백틱 템플릿 안에 주석을 쓰면서 `` `size` `` 처럼 백틱을 넣으면 **그 자리에서
 * 템플릿이 끝난다.** 그 뒤 CSS 가 통째로 TypeScript 코드로 해석돼 TS1005·TS1443 같은
 * 엉뚱한 구문 오류가 수십 줄 쏟아진다 — 오류 메시지가 원인을 안 가리켜서 매번 다시 헤맨다.
 * 실제로 이 레포에서 최소 4번 반복됐다(ScenarioTabsRow·Card·PageHero·2026-07-30 다수).
 *
 * 파일 맨 위 JSDoc 의 백틱은 **문제가 없다**(템플릿 밖이다). 그래서 단순 grep 으로는 못 가른다 —
 * 템플릿 안/밖을 실제로 추적해야 한다. 이 스크립트가 그걸 한다.
 *
 *   node tools/dev/styled-comment-backticks.mjs            # 검사만 (위반 있으면 exit 1)
 *   node tools/dev/styled-comment-backticks.mjs --fix      # 백틱을 작은따옴표로 바꾼다
 */

import fs from 'node:fs';
import path from 'node:path';

const FIX = process.argv.includes('--fix');
const ROOTS = ['components', 'pages', 'shared'];

/** 주석 줄인가 (`*`, `/*`, `//` 로 시작). */
const isCommentLine = (line) => /^\s*(\/\*|\*|\/\/)/.test(line);

const files = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.ts') || e.name.endsWith('.tsx')) files.push(p.split(path.sep).join('/'));
  }
};
for (const root of ROOTS) if (fs.existsSync(root)) walk(root);

const violations = [];

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes('`')) continue;

  const lines = src.split('\n');
  let inTemplate = false;
  let changed = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    /*
     * ⚠ 주석 줄의 백틱은 **절대 세지 않는다** — 상태와 무관하게.
     * 주석은 템플릿을 열지도 닫지도 못한다. 세면 JSDoc 안 코드펜스(백틱 3개 = 홀수)가
     * 상태를 뒤집어 그 뒤 파일 전체를 "템플릿 안"으로 오판한다(MarketIndexStrip 오탐으로 확인).
     */
    if (isCommentLine(line)) {
      if (inTemplate && line.includes('`')) {
        violations.push({ file, line: i + 1, text: line.trim().slice(0, 100) });
        if (FIX) {
          lines[i] = line.replace(/`/g, "'");
          changed = true;
        }
      }
      continue;
    }

    /* 홀수 개면 상태가 뒤집힌다 — 한 줄 안에서 열고 닫는 보간은 짝수라 그대로다. */
    const backticks = (line.match(/`/g) ?? []).length;
    if (backticks % 2 === 1) inTemplate = !inTemplate;
  }

  if (changed) fs.writeFileSync(file, lines.join('\n'));
}

if (violations.length === 0) {
  console.log(`검사한 파일 ${files.length}개 — 템플릿 안 주석에 백틱 없음 ✓`);
  process.exit(0);
}

for (const v of violations) console.log(`${v.file}:${v.line}  ${v.text}`);
console.log(`\n${violations.length}건${FIX ? ' — 작은따옴표로 고쳤다' : ' (--fix 로 고친다)'}`);
process.exit(FIX ? 0 : 1);
