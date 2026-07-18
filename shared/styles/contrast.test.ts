import { describe, expect, it } from 'vitest';
import { CHART_SERIES } from './tokens';
import { THEME_PRESETS } from './presets';
import { compositeOver, contrastRatio, deltaE, roundRatio } from './contrast';
import type { ThemeTokens } from './semantic';

/**
 * 디자인 토큰의 접근성을 **숫자로** 강제한다.
 *
 * 이 테스트가 있는 이유: 색을 "감으로" 고르면 라이트에서 예쁜 값이 다크에서 대비 3:1도 안 나오는 일이
 * 반복된다. 토큰을 바꾸면 여기서 바로 실패해야 한다.
 *
 * 팔레트 프리셋 도입 후 순회 대상은 **전 프리셋(현재 8종) × light/dark = 16테마**다 — 어느
 * 프리셋도 다른 프리셋보다 약한 기준을 적용받지 않는다(검증 강도 약화 금지). 값의 실측 근거는
 * theme-presets-spec v1.0 / theme-variation-spec v1.0 (8종 확장판 검증 1,276건 전 PASS).
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

const PRESETS = Object.entries(THEME_PRESETS) as ReadonlyArray<
  [string, (typeof THEME_PRESETS)[keyof typeof THEME_PRESETS]]
>;

/** 전 프리셋 × light/dark — 레지스트리에 프리셋을 추가하면 순회가 자동으로 늘어난다. */
const THEMES: ReadonlyArray<[string, ThemeTokens]> = PRESETS.flatMap(
  ([id, preset]) =>
    [
      [`${id}/light`, preset.light],
      [`${id}/dark`, preset.dark]
    ] as const
);

/** 프리셋의 chart-series-0..7 토큰을 배열로. */
const chartSeriesOf = (tokens: ThemeTokens): string[] =>
  Array.from({ length: 8 }, (_, index) => tokens[`chart-series-${index}`]);

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
  // 솔리드 브랜드 버튼: 라벨 대 배경 (velog 다크는 어두운 라벨 #121212 — 방향 무관하게 4.5:1)
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
  ['data-negative', 'surface-muted'],
  // 액센트 텍스트 (프리셋별 크롬 — aurora teal/violet, velog 틸/회색, vivid 민트/퍼플, navy-gold 골드/버건디)
  ['accent-text', 'surface'],
  ['accent-text', 'accent-subtle'],
  ['text', 'accent-subtle'],
  ['accent-alt-text', 'surface'],
  ['accent-alt-text', 'accent-alt-subtle'],
  ['text', 'accent-alt-subtle'],
  // CTA 리본: 라벨(on-brand) vs 각 stop — 그라데이션의 가장 밝은 구간 포함 전 구간
  ['on-brand', 'cta-stop-1'],
  ['on-brand', 'cta-stop-2'],
  ['on-brand', 'cta-stop-3']
];

/**
 * 경계선·아이콘 등 비텍스트 요소(3:1).
 * 주의: 그라데이션/글로우/글래스 **문자열 토큰**(gradient-aurora 등)은 contrastRatio가
 * hex가 아니라며 throw 한다 — 여기에는 스칼라 stop 토큰만 넣는다.
 */
const NON_TEXT: ReadonlyArray<[string, string]> = [
  ['border-strong', 'surface'],
  ['border-strong', 'bg'],
  ['brand', 'surface'],
  ['focus-ring', 'surface'],
  ['focus-ring', 'bg'],
  // 액센트 표시색
  ['accent', 'surface'],
  ['accent-alt', 'surface'],
  // 표시용 리본: 놓이는 세 배경(카드·hero 타일·진행률 트랙) 전부
  ['ribbon-stop-1', 'surface'],
  ['ribbon-stop-2', 'surface'],
  ['ribbon-stop-3', 'surface'],
  ['ribbon-stop-1', 'brand-subtle'],
  ['ribbon-stop-2', 'brand-subtle'],
  ['ribbon-stop-3', 'brand-subtle'],
  ['ribbon-stop-1', 'progress-track'],
  ['ribbon-stop-2', 'progress-track'],
  ['ribbon-stop-3', 'progress-track']
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
   * 프리셋 간 키 집합 동등성 — 키가 하나라도 빠지면 그 프리셋에서 `var()`가 미정의로
   * 조용히 깨진다(콘솔 에러도 없다). 그래서 테스트로 강제한다.
   */
  it('전 프리셋 × light/dark 의 토큰 키 집합이 전부 동일하다', () => {
    const [referenceName, referenceTokens] = THEMES[0];
    const referenceKeys = Object.keys(referenceTokens).sort();

    THEMES.slice(1).forEach(([name, tokens]) => {
      expect(Object.keys(tokens).sort(), `${name} 키 집합 ≠ ${referenceName}`).toEqual(referenceKeys);
    });
  });

  /**
   * 차트는 캔버스라 테마별로 색을 바꿀 수 없다(한 세트로 양쪽을 만족시켜야 한다).
   * 각 프리셋의 라이트 카드(surface)와 다크 카드(surface) 양쪽에서 3:1 이상이어야 시리즈가 보인다.
   */
  describe('차트 시리즈 팔레트', () => {
    /** 하위 호환 상수 `CHART_SERIES`(aurora 세트) — 기존 검증 유지. */
    it.each(CHART_SERIES.map((hex, index) => [index, hex] as const))(
      '(레거시 CHART_SERIES) 시리즈 %i (%s) 는 aurora 라이트/다크 카드 양쪽에서 ≥ 3:1',
      (_index, hex) => {
        const onLight = roundRatio(contrastRatio(hex, THEME_PRESETS.aurora.light.surface));
        const onDark = roundRatio(contrastRatio(hex, THEME_PRESETS.aurora.dark.surface));

        expect(onLight, `${hex} on light surface = ${onLight}:1`).toBeGreaterThanOrEqual(AA_LARGE_TEXT);
        expect(onDark, `${hex} on dark surface = ${onDark}:1`).toBeGreaterThanOrEqual(AA_NON_TEXT);
      }
    );

    describe.each(PRESETS)('%s 프리셋', (_presetId, preset) => {
      const series = chartSeriesOf(preset.light);

      it('light/dark 맵의 chart-series 값이 동일하다 (캔버스는 테마별 색 교체 불가)', () => {
        expect(chartSeriesOf(preset.dark)).toEqual(series);
      });

      it.each(series.map((hex, index) => [index, hex] as const))(
        '시리즈 %i (%s) 는 이 프리셋의 라이트/다크 카드 양쪽에서 ≥ 3:1',
        (_index, hex) => {
          const onLight = roundRatio(contrastRatio(hex, preset.light.surface));
          const onDark = roundRatio(contrastRatio(hex, preset.dark.surface));

          expect(onLight, `${hex} on light surface(${preset.light.surface}) = ${onLight}:1`).toBeGreaterThanOrEqual(
            AA_LARGE_TEXT
          );
          expect(onDark, `${hex} on dark surface(${preset.dark.surface}) = ${onDark}:1`).toBeGreaterThanOrEqual(
            AA_NON_TEXT
          );
        }
      );

      /**
       * 시리즈끼리 구분되는지는 대비비가 아니라 ΔE(지각적 거리)로 재야 한다.
       * 대비비는 휘도만 보기 때문에, 밝기가 같고 색상만 다른 두 색(보라/올리브)을
       * "대비 1.0 = 같은 색"으로 잘못 판정한다.
       */
      it('시리즈끼리 지각적으로 구분된다 (모든 쌍 ΔE ≥ 20)', () => {
        const tooClose: string[] = [];

        series.forEach((a, i) => {
          series.slice(i + 1).forEach((b) => {
            const distance = deltaE(a, b);
            if (distance < MIN_SERIES_DELTA_E) tooClose.push(`${a} vs ${b} = ΔE ${distance.toFixed(1)}`);
          });
        });

        expect(tooClose, `너무 비슷한 시리즈 쌍:\n${tooClose.join('\n')}`).toEqual([]);
      });
    });
  });

  /**
   * 서리유리(surface-glass)는 rgba 반투명 토큰이라 위 쌍 순회로는 검증할 수 없다.
   * 사용자가 실제로 보는 색은 "글래스가 최악의 배경 위에 알파 합성된 색"이므로,
   * 스펙에서 실측한 최악 배경 4건(L1/L2/D1/D2)을 compositeOver로 재현해 **프리셋별로** 고정한다.
   * → 글래스 알파를 낮추는 회귀가 여기서 숫자로 잡힌다 (예: aurora 다크 0.85 → 0.78이면 D1이 4.41:1로 탈락).
   */
  describe('서리유리(글래스) 최악 배경 합성', () => {
    /** `rgba(r, g, b, a)` 토큰 → 합성용 { hex, alpha }. 토큰 값이 바뀌면 테스트도 따라간다. */
    const parseRgba = (token: string): { hex: string; alpha: number } => {
      const match = token.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*(0|1|0?\.\d+)\)$/);
      if (!match) throw new Error(`rgba 토큰이 아닙니다: ${token}`);

      const toHex = (channel: string): string => Number(channel).toString(16).padStart(2, '0');
      return { hex: `#${toHex(match[1])}${toHex(match[2])}${toHex(match[3])}`, alpha: Number(match[4]) };
    };

    describe.each(PRESETS)('%s 프리셋', (_presetId, preset) => {
      const light = preset.light;
      const dark = preset.dark;
      const lightGlass = parseRgba(light['surface-glass']);
      const darkGlass = parseRgba(dark['surface-glass']);

      it('L1: 라이트 모달 글래스 — 오버레이+최암부 위에서 본문 텍스트 ≥ 4.5:1', () => {
        // 모달 아래 최악: 페이지의 가장 어두운 지점(text 색 영역) 위에 overlay가 깔린 상태
        const overlay = parseRgba(light.overlay);
        const behindGlass = compositeOver(overlay.hex, overlay.alpha, light.text);
        const seen = compositeOver(lightGlass.hex, lightGlass.alpha, behindGlass);
        const ratio = roundRatio(contrastRatio(light.text, seen));

        expect(ratio, `text on 라이트 모달글래스(합성 ${seen}) = ${ratio}:1`).toBeGreaterThanOrEqual(AA_TEXT);
      });

      it('L2: 라이트 글래스 — 차트 시리즈 0 위에서 본문·보조 텍스트 ≥ 4.5:1', () => {
        const seen = compositeOver(lightGlass.hex, lightGlass.alpha, light['chart-series-0']);
        const text = roundRatio(contrastRatio(light.text, seen));
        const secondary = roundRatio(contrastRatio(light['text-secondary'], seen));

        expect(text, `text on 라이트 글래스(합성 ${seen}) = ${text}:1`).toBeGreaterThanOrEqual(AA_TEXT);
        expect(secondary, `text-secondary on 라이트 글래스(합성 ${seen}) = ${secondary}:1`).toBeGreaterThanOrEqual(
          AA_TEXT
        );
      });

      it('D1: 다크 글래스 — 밝은 액센트 위에서 본문·보조 텍스트 ≥ 4.5:1', () => {
        const seen = compositeOver(darkGlass.hex, darkGlass.alpha, dark.accent);
        const text = roundRatio(contrastRatio(dark.text, seen));
        const secondary = roundRatio(contrastRatio(dark['text-secondary'], seen));

        expect(text, `text on 다크 글래스(합성 ${seen}) = ${text}:1`).toBeGreaterThanOrEqual(AA_TEXT);
        expect(secondary, `text-secondary on 다크 글래스(합성 ${seen}) = ${secondary}:1`).toBeGreaterThanOrEqual(
          AA_TEXT
        );
      });

      it('D2: 다크 글래스 — 흰 텍스트 영역 위에서 본문 텍스트 ≥ 4.5:1', () => {
        const seen = compositeOver(darkGlass.hex, darkGlass.alpha, dark.text);
        const ratio = roundRatio(contrastRatio(dark.text, seen));

        expect(ratio, `text on 다크 글래스(합성 ${seen}) = ${ratio}:1`).toBeGreaterThanOrEqual(AA_TEXT);
      });
    });
  });
});
