// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * **얇은 요소(≤8px)에 한쪽만 다른 반경을 주지 마라** — 소스 레벨로 잠근다.
 *
 * 왜 렌더 테스트로 못 잡나: jsdom 은 레이아웃을 계산하지 않고, 실브라우저에서도 `getComputedStyle`
 * 은 **선언값을 그대로** 돌려준다. 그런데 브라우저는 한 변의 두 반경 합이 그 변보다 크면 반경 전체를
 * 비례 축소한다(CSS Backgrounds "overlapping curves"). 즉 **선언값과 렌더가 다르고, 그 차이를
 * 읽을 API 가 없다.** 사람 눈으로만 보이고, 코드 리뷰로는 정상으로 읽힌다.
 *
 * 2026-07-30 실측 2건(둘 다 사용자·감사에서 발견):
 *  - `StatTile` hero 좌측 리본 — 폭 4px 에 `0 pill pill 0` → 실효 `0/4/4/0`. 왼쪽이 완전히 각져
 *    12px 로 둥근 타일 위에 **직사각형**이 붙은 것처럼 보였다(사용자 신고 원문: "라인 보더가 직사각형").
 *  - `TourGuide` 상단 오로라 리본 — 높이 2px 에 `lg lg 0 0` → 실효 `2/2/0/0`. 카드의 15px 안쪽
 *    모서리 밖으로 **5.4px 삐져나와** 있었다.
 *
 * 핵심은 취향이 아니라 **원리**다: 높이 2px 인 막대는 어떤 값을 적어도 실효 반경이 1px 을 넘지
 * 못하므로 부모의 라운드와 맞출 방법이 없다. 그래서 해법은 둘 중 하나뿐이다 —
 *  ① 네 모서리 **균일**하게(pill = 캡슐. `StatTile`·`PortfolioPage`·`DividendCalendarPage` 리본)
 *  ② 반경을 **아예 주지 않고** 부모의 `overflow: hidden` 으로 잘라낸다
 *     (`Banner`·`PortfolioPresetBoard`·`TickerDetailPage` 의 좌측 액센트 바, `TourGuide` 상단 리본)
 *
 * 오탐이 원리적으로 없는 규칙이다 — 얇은 요소의 비균일 반경은 **브라우저가 그려주지 않는다.**
 */

const REPO_ROOT = resolve(__dirname, '../..');
const ROOTS = ['components', 'pages', 'shared'];

/** 이 폭·높이 아래에서는 큰 반경이 통째로 클램프되어 비균일 선언이 의미를 잃는다. */
const THIN_PX = 8;

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
 * 토큰 보간(`${radius.pill}`)을 한 글자로 접는다. **중괄호를 품은 보간은 건드리지 않는다** —
 * 이 레포의 조건부 스타일(`${({ emphasis }) => ... }`)은 그 안에 CSS 블록을 통째로 담고 있어서
 * 통째로 지우면 감사가 바로 그것을 못 본다(`StatTile` 의 hero 리본이 정확히 그 안에 있다).
 */
const collapseInterpolations = (source: string): string => {
  let out = source;
  for (let round = 0; round < 8; round += 1) {
    const next = out.replace(/\$\{[^{}`$]*\}/g, 'T');
    if (next === out) return next;
    out = next;
  }
  return out;
};

/**
 * 한 규칙 안의 선언 묶음으로 자른다.
 *
 * 남은 중괄호를 경계로 쪼개면 **선언들이 흩어질 수는 있어도 서로 다른 규칙의 선언이 한 조각에
 * 섞이지는 않는다** — 즉 놓칠 수는 있어도 없는 위반을 만들지는 않는다. 가드로서 옳은 방향의 오차다.
 */
const runs = (source: string): string[] => collapseInterpolations(source).split(/[{}]/);

/** 값의 **개수**만 센다(접힌 뒤 `0 T T 0` → 4개, `T` → 1개). */
const valueCount = (value: string): number =>
  value
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length;

const SHORTHAND = /(?:^|[\s;])border-radius:\s*([^;]*);/g;
const LONGHAND = /(?:^|[\s;])border-(?:top|bottom)-(?:left|right)-radius:\s*[^;]*;/;
const THIN_SIZE = /(?:^|[\s;])(?:width|height):\s*(\d+(?:\.\d+)?)px/g;

type Violation = { path: string; detail: string };

const scan = (): { violations: Violation[]; radiusDeclarations: number } => {
  const violations: Violation[] = [];
  let radiusDeclarations = 0;

  for (const { path, source } of FILES) {
    for (const run of runs(source)) {
      const shorthands = [...run.matchAll(SHORTHAND)];
      radiusDeclarations += shorthands.length;

      const nonUniform = shorthands.filter((match) => valueCount(match[1]) > 1);
      const hasLonghand = LONGHAND.test(run);
      if (nonUniform.length === 0 && !hasLonghand) continue;

      const thin = [...run.matchAll(THIN_SIZE)].filter((match) => Number(match[1]) <= THIN_PX);
      if (thin.length === 0) continue;

      const declared = nonUniform.length > 0 ? `border-radius: ${nonUniform[0][1].replace(/\s+/g, ' ').trim()}` : 'border-*-*-radius 롱핸드';
      violations.push({ path, detail: `${thin[0][0].trim()} + ${declared}` });
    }
  }

  return { violations, radiusDeclarations };
};

const RESULT = scan();

describe('얇은 요소의 반경 형태', () => {
  it('감사 대상이 실제로 잡힌다 (정규식이 죽으면 아래 계약이 조용히 통과한다)', () => {
    expect(RESULT.radiusDeclarations).toBeGreaterThan(50);
  });

  it(`폭·높이 ${THIN_PX}px 이하 요소에 비균일 반경이 없다 — 브라우저가 그대로 그려주지 않는다`, () => {
    expect(RESULT.violations.map((violation) => `${violation.path}: ${violation.detail}`)).toEqual([]);
  });
});
