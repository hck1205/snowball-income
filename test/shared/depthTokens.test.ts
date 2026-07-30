// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 깊이(그림자) 토큰 계약 — **소스 레벨**로 잠근다.
 *
 * 렌더 테스트로는 못 잡는다. 생 `box-shadow` 리터럴은 라이트에서 **정상으로 보이고**, 어긋난다는
 * 사실은 다크에서만 드러난다(어두운 면 위의 어두운 그림자 = 아무 것도 안 보임). 팔레트 16종 ×
 * 라이트/다크를 사람이 눈으로 훑을 수는 없다.
 *
 * 2026-07-30 실측: 어젯밤 폴리시 작업이 지나간 뒤에도 3건이 남아 있었다 —
 * `Toggle` 썸(`0 1px 2px rgba(15,25,35,0.32)`)과 `PortfolioAllocation` 슬라이더 손잡이 2건
 * (`0 1px 3px rgba(15,25,35,0.3)`, webkit·moz 각 1). 셋 다 다크에서 그림자가 사라졌다.
 *
 * 규칙(DESIGN.md §6 · §2): 엘리베이션은 `shadow.e1..e3`(= `var(--sb-shadow-*)`) 토큰만.
 * 색은 세만틱 토큰만 — 그림자 값 안에 **하드코딩된 색**이 있으면 그 그림자는 테마를 못 따라간다.
 *
 * ⚠ 이 테스트는 "그림자 값에 생 색이 없다"만 본다. `0 0 0 3px ${color.focusShadow}` 처럼
 * 토큰 색을 쓰는 링(포커스·선택 표시)은 높이가 아니라 **상태**를 말하므로 통과한다.
 */

const REPO_ROOT = resolve(__dirname, '../..');
const ROOTS = ['components', 'pages', 'shared'];

/** 하드코딩된 색: `rgb()`/`rgba()`/`hsl()`/`#hex`/자주 쓰이는 색 이름. */
const RAW_COLOR = /\brgba?\(|\bhsla?\(|#[0-9a-fA-F]{3,8}\b|\b(?:black|white|gray|grey)\b/;

const collect = (dir: string, out: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue;
      collect(full, out);
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
};

const FILES = ROOTS.flatMap((root) => collect(resolve(REPO_ROOT, root))).map((file) => ({
  path: relative(REPO_ROOT, file).split(sep).join('/'),
  source: readFileSync(file, 'utf-8')
}));

/**
 * `box-shadow: <값>;` 선언 하나. 여러 줄에 걸친 값도 잡는다(그림자는 겹쳐 쓰는 경우가 많다).
 * `-webkit-box-shadow` 같은 접두어도 함께 받는다.
 */
const BOX_SHADOW = /(?:^|[\s{;])-?(?:webkit-|moz-)?box-shadow:\s*([^;]*);/g;

type ShadowUse = { path: string; value: string };

const SHADOWS: ShadowUse[] = FILES.flatMap(({ path, source }) =>
  [...source.matchAll(BOX_SHADOW)].map((match) => ({
    path,
    value: match[1].replace(/\s+/g, ' ').trim()
  }))
);

/**
 * 프리셋 파일은 **토큰 자체의 정의**다 — `--sb-shadow-*` 값이 여기 말고 어디에 있을 수는 없다.
 * (`globalStyles.ts` 는 프리셋 레지스트리에서 변수를 생성하므로 함께 제외 대상이 아니다 —
 * 거기엔 하드코딩 그림자가 없어야 맞다.)
 */
const TOKEN_DEFINITION = /^shared\/styles\/presets\//;

describe('깊이 토큰', () => {
  it('감사 대상이 실제로 잡힌다 (정규식이 죽으면 아래 계약이 조용히 통과한다)', () => {
    expect(SHADOWS.length).toBeGreaterThan(20);
  });

  it('box-shadow 값에 하드코딩된 색이 없다 — 그러면 다크 테마를 따라가지 못한다', () => {
    const violations = SHADOWS.filter(
      (use) => !TOKEN_DEFINITION.test(use.path) && RAW_COLOR.test(use.value)
    ).map((use) => `${use.path}: box-shadow: ${use.value}`);

    expect(violations).toEqual([]);
  });
});
