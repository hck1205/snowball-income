// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import { CHART_SERIES } from './tokens';
import { THEME_PRESETS } from './presets';
import { compositeOver, contrastRatio, deltaE, hexToRgb, roundRatio } from './contrast';
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

/* -------------------------------------------------------------------------- */
/* 그라데이션 문자열 검증                                                        */
/* -------------------------------------------------------------------------- */

/**
 * `linear-gradient(...)` 문자열에서 hex stop을 선언 순서대로 뽑는다.
 *
 * ⚠ 스칼라 stop 토큰을 **따로 두지 않는 이유**: 그러면 CSS 변수가 6개 → 14개로 늘고,
 * 무엇보다 "실제로 배포되는 문자열"이 아니라 그 옆의 사본을 검사하게 된다.
 * 여기서는 gradient-aurora/cta 처럼 스칼라를 병기하지 않고 **배포되는 값 자체**를 판다.
 */
const parseGradientStops = (token: string): string[] => token.match(/#[0-9a-fA-F]{6}/g) ?? [];

/** sRGB 선형 보간. CSS 그라데이션의 기본 보간 공간과 같다(`in oklab` 미지정 시). */
const mixSrgb = (a: string, b: string, t: number): string => {
  const from = hexToRgb(a);
  const to = hexToRgb(b);
  const channel = (f: number, g: number): string =>
    Math.round(f + (g - f) * t)
      .toString(16)
      .padStart(2, '0');

  return `#${channel(from.r, to.r)}${channel(from.g, to.g)}${channel(from.b, to.b)}`;
};

/**
 * 그라데이션 위 전경색의 **최악 지점** 대비.
 *
 * 끝점만 재면 안 된다 — sRGB 보간의 중간 지점 휘도는 두 끝점 사이에 갇히지 않는다
 * (채널별 선형 보간 + 채널 감마의 볼록성 때문에 색상이 다른 두 stop 사이에서 아래로 처질 수 있다).
 * 그래서 인접 stop 쌍마다 여러 지점을 샘플링해 최솟값을 취한다.
 */
const worstGradientRatio = (foreground: string, gradient: string, samples = 9): number => {
  const stops = parseGradientStops(gradient);
  if (stops.length === 0) throw new Error(`그라데이션에서 hex stop을 못 찾았습니다: ${gradient}`);
  if (stops.length === 1) return contrastRatio(foreground, stops[0]);

  let worst = Number.POSITIVE_INFINITY;

  stops.slice(0, -1).forEach((stop, index) => {
    const next = stops[index + 1];

    for (let sample = 0; sample < samples; sample += 1) {
      const ratio = contrastRatio(foreground, mixSrgb(stop, next, sample / (samples - 1)));
      if (ratio < worst) worst = ratio;
    }
  });

  return worst;
};

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
  // 액센트 텍스트 (accent = 프리셋별 틸/민트/골드… , accent-alt = 전 프리셋 그린 축)
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

/** 파스텔 히어로 면 — 이 위에 본문 3단 위계가 그대로 올라간다(PageHero·EmptyState·프로모 카드). */
const HERO_GRADIENTS = ['gradient-hero', 'gradient-hero-soft'] as const;
const HERO_TEXTS = ['text', 'text-secondary', 'text-muted'] as const;

/**
 * 두 액센트(teal ↔ green)가 하나로 뭉치지 않는 최소 지각 거리.
 * 대비비로는 잴 수 없는 축이다(contrast.ts의 ΔE 주석 참조).
 * 실측 최저 16.0(velog/dark) — 여유 1.0을 남긴 값으로 못 박는다.
 */
const MIN_ACCENT_SEPARATION = 15;

/**
 * 워드마크 회귀 플로어 (**AA가 아니다**).
 *
 * ⚠ WCAG 2.1 SC 1.4.3은 **로고·브랜드명 텍스트를 명시적으로 면제**한다
 *   ("Text that is part of a logo or brand name has no contrast requirement").
 *   그래서 여기서 4.5:1을 요구하지 않는다 — 요구하면 사용자 확정 hex가 CI에서 떨어진다.
 * 대신 **확정값의 실측 최저치를 플로어로** 잡아, 헤더 표면(brand-subtle)이나 워드마크 토큰을
 * 바꿔 지금보다 **더 묻히게 만드는** 변경을 잡는다.
 * 실측 최저: 라이트 첫 stop 2.28 / 끝 stop 1.56(둘 다 ink), 다크 6.97(velog), 단색 폴백 2.28 / 3.57.
 */
const WORDMARK_FLOOR = {
  light: { firstStop: 2.2, anyStop: 1.5, solid: 2.2 },
  dark: { firstStop: 6.9, anyStop: 6.9, solid: 3.5 }
} as const;

const WORDMARK_GRADIENTS = ['gradient-wordmark-snow', 'gradient-wordmark-income'] as const;
const WORDMARK_SOLIDS = ['wordmark-snow-solid', 'wordmark-income-solid'] as const;

/** 테마 이름 `${presetId}/${mode}` 에서 모드만. */
const modeOf = (themeName: string): 'light' | 'dark' => (themeName.endsWith('/dark') ? 'dark' : 'light');

/* -------------------------------------------------------------------------- */
/* 게이트 헬퍼 자체 검증 (vacuity 방지)                                          */
/* -------------------------------------------------------------------------- */

/**
 * 🔴 **게이트가 헬퍼 때문에 조용히 무력화되는 것**을 막는다.
 *
 * 실측(QA 뮤테이션): `parseGradientStops` 가 stop 을 **하나만** 돌려주도록 망가뜨려도
 * 아래 히어로·워드마크 게이트 1,129건이 **한 건도 실패하지 않았다**(끝 stop·중간 지점이
 * 검사 대상에서 통째로 빠지는데도). 게이트가 "무엇을 실제로 보고 있는지"를 여기서 못 박아,
 * 헬퍼가 약해지면 토큰이 아니라 **헬퍼 쪽에서** 빨개지게 한다.
 */
describe('그라데이션 게이트 헬퍼', () => {
  it('parseGradientStops 는 선언된 stop 을 전부·선언 순서대로 뽑는다', () => {
    expect(parseGradientStops('linear-gradient(100deg, #112233 0%, #445566 100%)')).toEqual([
      '#112233',
      '#445566'
    ]);
    expect(parseGradientStops('linear-gradient(135deg, #aabbcc 0%, #ddeeff 50%, #010203 100%)')).toEqual([
      '#aabbcc',
      '#ddeeff',
      '#010203'
    ]);
  });

  it('parseGradientStops 는 hex 가 없으면 빈 배열이다 (게이트가 throw 로 알아채도록)', () => {
    expect(parseGradientStops('linear-gradient(90deg, red 0%, blue 100%)')).toEqual([]);
    expect(() => worstGradientRatio('#ffffff', 'linear-gradient(90deg, red, blue)')).toThrow();
  });

  /**
   * 끝점만 재면 놓치는 구간이 실제로 존재한다는 증거.
   *
   * 어두운 전경에서는 **배경이 어두워질수록** 대비가 나빠진다. 그런데 sRGB 채널을 선형 보간하면
   * 감마 디코딩이 볼록(convex)이라 중간 지점의 휘도가 **두 끝점 모두보다 낮아질 수 있다**
   * (#ff0000 L=0.2126 · #0000ff L=0.0722 · 중간 #800080 L≈0.061). 그래서 끝점만 재는 구현은
   * 이 구간을 통째로 놓친다 — 아래 단정이 그 차이를 고정한다.
   */
  it('worstGradientRatio 는 끝점이 아니라 경로 전체의 최악 지점을 잡는다', () => {
    const foreground = '#000000';
    const gradient = 'linear-gradient(90deg, #ff0000 0%, #0000ff 100%)';

    const endpointsOnly = Math.min(contrastRatio(foreground, '#ff0000'), contrastRatio(foreground, '#0000ff'));
    const worst = worstGradientRatio(foreground, gradient);

    // 중간 지점이 두 끝점 중 어느 쪽보다도 나쁘다 — 그래서 샘플링이 필요하다.
    expect(worst).toBeLessThan(endpointsOnly);
  });

  it('worstGradientRatio 는 stop 이 하나뿐이면 그 색의 대비를 그대로 쓴다', () => {
    expect(worstGradientRatio('#ffffff', 'linear-gradient(90deg, #000000 0%)')).toBeCloseTo(
      contrastRatio('#ffffff', '#000000'),
      5
    );
  });
});

describe('디자인 토큰 대비 (WCAG AA)', () => {
  describe.each(THEMES)('%s 테마', (themeName, theme) => {
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

    /**
     * 히어로 면은 **그라데이션 문자열**이라 위 쌍 순회로는 못 잰다.
     * 끝점이 아니라 경로 전체를 샘플링해 **최악 지점**을 본다(worstGradientRatio 주석 참조).
     */
    it.each(HERO_GRADIENTS.flatMap((gradient) => HERO_TEXTS.map((text) => [gradient, text] as const)))(
      '히어로 면 %s 위 %s ≥ 4.5:1 (그라데이션 최악 지점)',
      (gradientKey, textKey) => {
        const ratio = roundRatio(worstGradientRatio(theme[textKey], theme[gradientKey]));

        expect(
          ratio,
          `${textKey}(${theme[textKey]}) on ${gradientKey}(${theme[gradientKey]}) 최악 = ${ratio}:1`
        ).toBeGreaterThanOrEqual(AA_TEXT);
      }
    );

    it('accent 와 accent-alt 는 지각적으로 갈린다 (ΔE ≥ 15)', () => {
      const distance = deltaE(theme.accent, theme['accent-alt']);

      expect(
        distance,
        `accent(${theme.accent}) vs accent-alt(${theme['accent-alt']}) = ΔE ${distance.toFixed(1)}`
      ).toBeGreaterThanOrEqual(MIN_ACCENT_SEPARATION);
    });

    it.each(WORDMARK_GRADIENTS)('워드마크 %s 는 헤더 표면(brand-subtle) 위에서 회귀 플로어를 지킨다', (key) => {
      const floor = WORDMARK_FLOOR[modeOf(themeName)];
      const stops = parseGradientStops(theme[key]);

      expect(stops.length, `${key} 에서 hex stop 을 못 찾았다: ${theme[key]}`).toBeGreaterThan(0);

      stops.forEach((stop, index) => {
        const ratio = roundRatio(contrastRatio(stop, theme['brand-subtle']));
        const minimum = index === 0 ? floor.firstStop : floor.anyStop;

        expect(
          ratio,
          `${key} stop${index}(${stop}) on brand-subtle(${theme['brand-subtle']}) = ${ratio}:1 (플로어 ${minimum})`
        ).toBeGreaterThanOrEqual(minimum);
      });
    });

    it.each(WORDMARK_SOLIDS)('워드마크 단색 폴백 %s 도 헤더 표면 위에서 플로어를 지킨다', (key) => {
      const floor = WORDMARK_FLOOR[modeOf(themeName)];
      const ratio = roundRatio(contrastRatio(theme[key], theme['brand-subtle']));

      expect(
        ratio,
        `${key}(${theme[key]}) on brand-subtle(${theme['brand-subtle']}) = ${ratio}:1 (플로어 ${floor.solid})`
      ).toBeGreaterThanOrEqual(floor.solid);
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
