/**
 * WCAG 2.1 대비비 계산.
 *
 * 디자인 토큰이 "예뻐 보인다"가 아니라 **숫자로** 접근성을 만족하는지 검증하기 위해 존재한다.
 * `contrast.test.ts`가 라이트/다크 양쪽의 모든 핵심 색 쌍을 이걸로 검사한다.
 *
 * 기준:
 *  - 본문 텍스트   4.5:1 (WCAG 1.4.3 AA)
 *  - 큰 텍스트     3:1   (18.66px+bold 또는 24px+)
 *  - UI 컴포넌트   3:1   (WCAG 1.4.11 non-text contrast — 경계선, 아이콘, 차트 시리즈)
 */

export type Rgb = { r: number; g: number; b: number };

/** `#rrggbb` → RGB. 축약형(#abc)도 받는다. */
export const hexToRgb = (hex: string): Rgb => {
  const normalized = hex.trim().replace('#', '');
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`hex 색이 아닙니다: ${hex}`);
  }

  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16)
  };
};

/** sRGB 상대 휘도 (WCAG 정의). */
export const relativeLuminance = ({ r, g, b }: Rgb): number => {
  const channel = (value: number): number => {
    const srgb = value / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

/** 두 색의 대비비. 1(같은 색) ~ 21(검정 대 흰색). 인자 순서는 무관하다. */
export const contrastRatio = (foreground: string, background: string): number => {
  const lighter = Math.max(relativeLuminance(hexToRgb(foreground)), relativeLuminance(hexToRgb(background)));
  const darker = Math.min(relativeLuminance(hexToRgb(foreground)), relativeLuminance(hexToRgb(background)));

  return (lighter + 0.05) / (darker + 0.05);
};

/** 보고용 반올림(내림). 4.499 → 4.49 로 내려서 기준을 넉넉하게 잡지 않는다. */
export const roundRatio = (ratio: number): number => Math.floor(ratio * 100) / 100;

/**
 * 반투명 전경(fgHex, alpha)을 불투명 배경(baseHex) 위에 알파 합성한 결과 색.
 *
 * `contrastRatio()`는 불투명 hex 두 개만 받는다. 서리유리(rgba 서피스)나 오버레이처럼
 * 반투명 레이어 위 텍스트의 **실제 화면 대비**를 검증하려면, 먼저 이 함수로 사용자가
 * 실제로 보게 되는 합성 색을 만든 뒤 그 hex를 contrastRatio에 넣는다.
 * 채널별 `round(fg·α + base·(1−α))` — 검증 스크립트(aurora-verify.mjs)와 동일 공식.
 */
export const compositeOver = (fgHex: string, alpha: number, baseHex: string): string => {
  const fg = hexToRgb(fgHex);
  const base = hexToRgb(baseHex);

  const blend = (f: number, b: number): string =>
    Math.round(f * alpha + b * (1 - alpha))
      .toString(16)
      .padStart(2, '0');

  return `#${blend(fg.r, base.r)}${blend(fg.g, base.g)}${blend(fg.b, base.b)}`;
};

/* -------------------------------------------------------------------------- */
/* 지각적 색 거리 (카테고리 팔레트용)                                            */
/* -------------------------------------------------------------------------- */

/**
 * 대비비(contrast ratio)는 **휘도만** 본다. 그래서 보라(#8b6fc9)와 올리브(#9a7b14)처럼
 * 밝기가 같고 색상만 다른 두 색은 대비비가 1.0으로 나온다 — "구분 안 됨"이 아니라
 * "이 지표로는 잴 수 없음"이다.
 *
 * 카테고리 차트 팔레트의 시리즈끼리 구분되는지는 **지각적 거리(ΔE)** 로 재야 한다.
 * CIE76 ΔE(Lab 유클리드 거리)를 쓴다: 대략 ΔE 2.3 = 겨우 구분, 20+ = 확실히 다른 색.
 */

type Lab = { l: number; a: number; b: number };

const srgbToLinear = (value: number): number => {
  const srgb = value / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
};

/** sRGB → CIE L*a*b* (D65 백색점). */
export const hexToLab = (hex: string): Lab => {
  const { r, g, b } = hexToRgb(hex);
  const [lr, lg, lb] = [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];

  // linear sRGB → XYZ (D65), 그리고 D65 백색점으로 정규화
  const x = (0.4124 * lr + 0.3576 * lg + 0.1805 * lb) / 0.95047;
  const y = (0.2126 * lr + 0.7152 * lg + 0.0722 * lb) / 1.0;
  const z = (0.0193 * lr + 0.1192 * lg + 0.9505 * lb) / 1.08883;

  const f = (value: number): number => (value > 0.008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116);
  const [fx, fy, fz] = [f(x), f(y), f(z)];

  return { l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
};

/** CIE76 ΔE. 두 색이 사람 눈에 얼마나 다른가. */
export const deltaE = (hexA: string, hexB: string): number => {
  const a = hexToLab(hexA);
  const b = hexToLab(hexB);

  return Math.sqrt((a.l - b.l) ** 2 + (a.a - b.a) ** 2 + (a.b - b.b) ** 2);
};
