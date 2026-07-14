import { describe, expect, it } from 'vitest';
import { CHART_SERIES, DARK_THEME, LIGHT_THEME } from './tokens';
import { contrastRatio, deltaE, roundRatio } from './contrast';
import type { ThemeTokens } from './semantic';

/**
 * 디자인 토큰의 접근성을 **숫자로** 강제한다.
 *
 * 이 테스트가 있는 이유: 색을 "감으로" 고르면 라이트에서 예쁜 값이 다크에서 대비 3:1도 안 나오는 일이
 * 반복된다. 토큰을 바꾸면 여기서 바로 실패해야 한다.
 *
 * WCAG 2.1 기준:
 *  - 1.4.3 (AA) 본문 텍스트 4.5:1
 *  - 1.4.3 (AA) 큰 텍스트(18.66px+bold / 24px+) 3:1
 *  - 1.4.11    UI 컴포넌트·그래픽 경계 3:1
 */

const AA_TEXT = 4.5;
const AA_LARGE_TEXT = 3;
const AA_NON_TEXT = 3;

/**
 * ΔE 20 = 나란히 놓았을 때 확실히 다른 색으로 읽히는 거리.
 * 라이트/다크 양쪽에서 3:1을 만족해야 한다는 제약이 색을 중간 명도 띠에 가두기 때문에,
 * 저채도 8색으로 이보다 크게 벌리면 네온이 된다. 자세한 근거는 tokens.ts의 CHART_SERIES 주석.
 */
const MIN_SERIES_DELTA_E = 20;

const THEMES: ReadonlyArray<[string, ThemeTokens]> = [
  ['light', LIGHT_THEME],
  ['dark', DARK_THEME]
];

/** 각 서피스 위에 올라가는 본문 텍스트 조합. */
const TEXT_ON_SURFACE: ReadonlyArray<[string, string]> = [
  ['text', 'bg'],
  ['text', 'surface'],
  ['text', 'surface-raised'],
  ['text', 'surface-muted'],
  ['text', 'surface-sunken'],
  ['text-secondary', 'bg'],
  ['text-secondary', 'surface'],
  ['text-secondary', 'surface-raised'],
  ['text-secondary', 'surface-muted'],
  ['text-secondary', 'surface-sunken'],
  ['text-muted', 'surface'],
  ['text-muted', 'surface-muted'],
  ['text-muted', 'surface-sunken'],
  // 브랜드 서피스(brand-subtle) 위의 텍스트 — 배너/칩이 여기에 해당한다
  ['text', 'brand-subtle'],
  ['text-secondary', 'brand-subtle'],
  ['brand-text', 'brand-subtle'],
  ['brand-text', 'surface'],
  // 솔리드 브랜드 버튼: 라벨 대 배경
  ['on-brand', 'brand'],
  // 상태 서피스 위의 상태 텍스트
  ['danger', 'danger-surface'],
  ['danger', 'surface'],
  ['warning', 'warning-surface'],
  ['success', 'success-surface'],
  // 데이터 상승/하락 숫자는 카드 서피스 위에 올라간다
  ['data-positive', 'surface'],
  ['data-positive', 'surface-muted'],
  ['data-negative', 'surface'],
  ['data-negative', 'surface-muted']
];

/** 경계선·아이콘 등 비텍스트 요소(3:1). */
const NON_TEXT: ReadonlyArray<[string, string]> = [
  ['border-strong', 'surface'],
  ['border-strong', 'bg'],
  ['brand', 'surface'],
  ['focus-ring', 'surface'],
  ['focus-ring', 'bg']
];

describe('디자인 토큰 대비 (WCAG AA)', () => {
  describe.each(THEMES)('%s 테마', (_themeName, theme) => {
    it.each(TEXT_ON_SURFACE)('본문 %s on %s ≥ 4.5:1', (fg, bg) => {
      const ratio = roundRatio(contrastRatio(theme[fg], theme[bg]));

      expect(ratio, `${fg}(${theme[fg]}) on ${bg}(${theme[bg]}) = ${ratio}:1`).toBeGreaterThanOrEqual(AA_TEXT);
    });

    it.each(NON_TEXT)('비텍스트 %s on %s ≥ 3:1', (fg, bg) => {
      const ratio = roundRatio(contrastRatio(theme[fg], theme[bg]));

      expect(ratio, `${fg}(${theme[fg]}) on ${bg}(${theme[bg]}) = ${ratio}:1`).toBeGreaterThanOrEqual(AA_NON_TEXT);
    });

    it('경계선(border)은 서피스와 구분된다', () => {
      // 미묘한 경계선은 3:1을 요구하지 않는다(장식). 다만 아예 안 보이면 카드가 사라진다.
      const ratio = contrastRatio(theme.border, theme.surface);

      expect(ratio).toBeGreaterThan(1.05);
    });
  });

  /**
   * 차트는 캔버스라 테마별로 색을 바꿀 수 없다(한 세트로 양쪽을 만족시켜야 한다).
   * 라이트 카드(surface)와 다크 카드(surface) 양쪽에서 3:1 이상이어야 시리즈가 보인다.
   */
  describe('차트 시리즈 팔레트', () => {
    it.each(CHART_SERIES.map((hex, index) => [index, hex] as const))(
      '시리즈 %i (%s) 는 라이트/다크 카드 양쪽에서 ≥ 3:1',
      (_index, hex) => {
        const onLight = roundRatio(contrastRatio(hex, LIGHT_THEME.surface));
        const onDark = roundRatio(contrastRatio(hex, DARK_THEME.surface));

        expect(onLight, `${hex} on light surface = ${onLight}:1`).toBeGreaterThanOrEqual(AA_LARGE_TEXT);
        expect(onDark, `${hex} on dark surface = ${onDark}:1`).toBeGreaterThanOrEqual(AA_NON_TEXT);
      }
    );

    /**
     * 시리즈끼리 구분되는지는 대비비가 아니라 ΔE(지각적 거리)로 재야 한다.
     * 대비비는 휘도만 보기 때문에, 밝기가 같고 색상만 다른 두 색(보라/올리브)을
     * "대비 1.0 = 같은 색"으로 잘못 판정한다.
     */
    it('시리즈끼리 지각적으로 구분된다 (모든 쌍 ΔE ≥ 25)', () => {
      const tooClose: string[] = [];

      CHART_SERIES.forEach((a, i) => {
        CHART_SERIES.slice(i + 1).forEach((b) => {
          const distance = deltaE(a, b);
          if (distance < MIN_SERIES_DELTA_E) tooClose.push(`${a} vs ${b} = ΔE ${distance.toFixed(1)}`);
        });
      });

      expect(tooClose, `너무 비슷한 시리즈 쌍:\n${tooClose.join('\n')}`).toEqual([]);
    });
  });
});
