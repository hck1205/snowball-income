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
   * 믹스인이 전환을 안 갖게 됐으므로 이제 소비처가 `scale` 을 자기 목록에 넣어야 한다.
   * 안 넣으면 누름이 애니메이션 없이 즉시 튄다(기능은 살아 있어 렌더 테스트로는 안 잡힌다).
   */
  it('pressable 을 쓰는 파일은 transition 목록에 pressTransition 을 끼운다', () => {
    const offenders = styledFiles
      .map((file) => ({ file, source: readFileSync(file, 'utf8') }))
      .filter(({ source }) => /\$\{pressable(Subtle)?\}/.test(source))
      .filter(({ source }) => !source.includes('${pressTransition}'))
      .map(({ file }) => rel(file));

    expect(offenders).toEqual([]);
  });
});
