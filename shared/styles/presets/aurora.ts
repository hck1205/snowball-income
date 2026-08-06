/* -------------------------------------------------------------------------- */
/* aurora — 기존 LIGHT_THEME/DARK_THEME 값 그대로 이동 (단 한 값도 재설계 없음)     */
/* -------------------------------------------------------------------------- */

import { palette } from '../primitives';
import type { ThemeTokens } from '../semantic';
import { chartSeriesTokens, type ChartSeries } from './chartSeriesTokens';
import { buildAuroraGradient, buildCtaGradient, type GradientStops } from './gradients';
import { COMMON_DARK, COMMON_LIGHT } from './sharedTokens';

const { brand, auroraTeal, auroraViolet, auroraGreen, neutral } = palette;

/**
 * aurora 세트 = 기존 `CHART_SERIES` 값 그대로 (tokens.ts가 하위 호환 이름으로 re-export).
 * 시리즈 0은 브랜드 램프(자산 가치 = 주인공), 7은 중립 슬레이트(누적 투자금 = 기준선).
 */
export const AURORA_CHART_SERIES: ChartSeries = [
  brand[500], // #0c7cb3 azure — 자산 가치(주인공)
  '#c26d22', // orange
  '#47955e', // green
  '#cf5f7d', // rose
  '#8b6fc9', // violet
  '#9a7b14', // olive
  '#9c4f92', // plum
  '#6b7785' // slate — 기준선(누적 투자금)
];

/**
 * 리본이 2종인 이유:
 *  - **표시용(ribbon)** — 그 자체가 보이는 요소(액센트 바·진행률 채움·탭 인디케이터).
 *    기준은 놓이는 서피스 대비 3:1(WCAG 1.4.11).
 *  - **CTA용(cta)** — 위에 흰 라벨이 얹히는 요소(primary 버튼).
 *    기준은 모든 stop이 흰색 대비 4.5:1(WCAG 1.4.3).
 * teal의 물리 특성상 두 조건을 한 색으로 만족 못 한다(#2dd4bf는 흰 라벨 1.9:1).
 */
const AURORA_LIGHT_RIBBON: GradientStops = [brand[600], auroraTeal[600], auroraViolet[500]];
const AURORA_LIGHT_CTA: GradientStops = [brand[600], auroraTeal[650], auroraViolet[600]];
const AURORA_DARK_RIBBON: GradientStops = [brand[400], auroraTeal[400], auroraViolet[400]];
const AURORA_DARK_CTA: GradientStops = [brand[500], auroraTeal[650], auroraViolet[550]];

export const AURORA_LIGHT: ThemeTokens = {
  /* 서피스 — 낮은 곳(sunken) → 기본(base) → 떠 있는 곳(raised) */
  /*
   * 🔴 **순백 캔버스**(2026-08-03 사용자 결정). 구 값은 아이스블루 틴트(#e4f0fc)였다.
   * 프리셋의 얼굴색은 이제 캔버스가 아니라 **경계·액센트·차트**가 말한다 — 아이스블루는
   * `surface-hover`(아래)와 `brand`·`accent` 축에 그대로 남는다.
   * 부수 효과: 이 프리셋에서 가장 빠듯하던 `border-strong on bg`(3.25:1)와 글로우 최악 지점
   * 4.5:1 제약이 **함께 풀렸다** — 흰 배경은 그 위 모든 어두운 잉크의 대비를 올린다.
   */
  bg: neutral[0],
  surface: neutral[0],
  'surface-raised': neutral[0],
  'surface-muted': neutral[25],
  'surface-sunken': neutral[100],
  /* 아이스블루는 여기 남는다 — 흰 서피스 위 1.15:1 이라 hover 가 오히려 또렷해졌다. */
  'surface-hover': '#e4f0fc',

  /* 🔴 경계 — border 는 이제 **카드의 격을 말하는 주역**이다(primitives.ts neutral[150] 주석). */
  border: neutral[150],
  'border-strong': neutral[450],

  /* 텍스트 — 3단 위계. 셋 다 모든 서피스 위에서 4.5:1을 넘긴다. */
  text: neutral[900],
  'text-secondary': neutral[600],
  'text-muted': neutral[500],
  'text-inverse': neutral[0],

  /* 브랜드 */
  brand: brand[600],
  'brand-hover': brand[700],
  'brand-subtle': brand[50],
  'brand-subtle-hover': brand[100],
  'brand-border': brand[200],
  'brand-text': brand[700],
  'on-brand': neutral[0],

  /*
   * 오로라 액센트 — 크롬 전용. **숫자 데이터에 금지** (숫자는 up/down 램프만).
   * accent(teal) = 성장·복리·달성 / accent-alt(green) = 목표·추천·프로모.
   * 두 액센트는 같은 틸/그린 축의 양 끝이라 ΔE 15 이상으로 벌려 둔다(contrast.test가 강제).
   */
  accent: auroraTeal[600],
  'accent-text': auroraTeal[700],
  'accent-subtle': auroraTeal[50],
  'accent-border': auroraTeal[200],
  'accent-alt': auroraGreen[600],
  'accent-alt-text': auroraGreen[700],
  'accent-alt-subtle': auroraGreen[50],
  'accent-alt-border': auroraGreen[200],

  ...COMMON_LIGHT,

  /* 크롬 */
  overlay: 'rgba(13, 27, 46, 0.45)',
  'focus-ring': brand[500],
  'focus-shadow': 'rgba(12, 124, 179, 0.28)',

  /* 엘리베이션 — 라이트는 그림자가 위계를 만든다. 틴트는 polar-night 계열(쿨). */
  'shadow-1': '0 1px 2px rgba(13, 32, 58, 0.05), 0 1px 3px rgba(13, 32, 58, 0.07)',
  /* ⚠ e2 만 올렸다 — `cardElevation('raised')` 는 테두리 없이 이 그림자 하나로 주역을 세운다. */
  'shadow-2': '0 1px 2px rgba(13, 32, 58, 0.05), 0 6px 18px rgba(13, 32, 58, 0.13)',
  'shadow-3': '0 2px 6px rgba(13, 32, 58, 0.07), 0 12px 32px rgba(13, 32, 58, 0.16)',

  /* 시그니처 — 스칼라 stop (대비 검증 가능해야 하므로 순수 hex) */
  'ribbon-stop-1': AURORA_LIGHT_RIBBON[0],
  'ribbon-stop-2': AURORA_LIGHT_RIBBON[1],
  'ribbon-stop-3': AURORA_LIGHT_RIBBON[2],
  'cta-stop-1': AURORA_LIGHT_CTA[0],
  'cta-stop-2': AURORA_LIGHT_CTA[1],
  'cta-stop-3': AURORA_LIGHT_CTA[2],
  /** 진행률 트랙 (= surface-sunken 값) */
  'progress-track': neutral[100],

  /* 시그니처 — CSS 값 문자열 (위 스칼라에서 조립) */
  'gradient-aurora': buildAuroraGradient(AURORA_LIGHT_RIBBON),
  'gradient-cta': buildCtaGradient(AURORA_LIGHT_CTA),
  /* 히어로 면 — 단색(gradients.ts 머리말 참고). hero = surface / soft = surface-muted. */
  'gradient-hero': neutral[0],
  'gradient-hero-soft': neutral[25],
  /*
   * 🔴 페이지 상단 오로라 글로우를 **걷었다**(2026-08-03). 사용자 지시는 "페이지 전체 배경색이
   * 흰색"이고, 두 radial 이 상단 640px 을 물들이면 그건 흰 배경이 아니다. 이 글로우가 만들던
   * 최악 지점(#d5e5f5 위 text-muted 4.61:1)도 함께 사라진다.
   * ⚠ 다크 글로우는 남긴다 — 어두운 캔버스는 완전히 평평하면 깊이가 죽는다(아래 DARK 참고).
   */
  'bg-glow': neutral[0],
  /* 서리유리 — 모달 등 raised 서피스. 알파 0.78은 최악 배경(오버레이+최암부) 합성 검증값. */
  'surface-glass': 'rgba(255, 255, 255, 0.78)',
  /* 서리유리 불투명 폴백 (backdrop-filter 미지원 브라우저) */
  'surface-glass-fallback': neutral[0],

  /* 차트 크롬 (chartTheme.ts가 읽어간다) */
  'chart-axis-line': neutral[200],
  'chart-split-line': neutral[100],
  'chart-label': neutral[600],
  'chart-slice-border': neutral[0],

  ...chartSeriesTokens(AURORA_CHART_SERIES),

  /* input[type=date] 피커 아이콘 */
  'picker-filter': 'none'
};

export const AURORA_DARK: ThemeTokens = {
  /**
   * 다크에서는 그림자가 거의 안 보인다. 대신 **서피스가 밝아질수록 위로 뜬다**는
   * 머티리얼 규칙으로 위계를 만든다. 휘도 실측:
   * bg(950) < sunken < surface(900) < muted < raised(850) < hover.
   */
  bg: neutral[950],
  surface: neutral[900],
  'surface-raised': neutral[850],
  /* 아래 서피스/경계 hex는 램프 밖 전용 값 — 다크 사다리의 중간 계단이라 별도 유지 */
  'surface-muted': '#17253c',
  'surface-sunken': '#0e1727',
  'surface-hover': '#213250',

  border: '#26354e',
  /** 다크 컨트롤 경계 — 다크 surface 대비 3.38:1, bg 대비 3.84:1 (WCAG 1.4.11) */
  'border-strong': '#5f7291',

  text: '#e8eef8',
  'text-secondary': '#a9b7cc',
  'text-muted': '#8fa0b8',
  'text-inverse': neutral[950],

  /**
   * 다크의 brand는 라이트보다 밝게 올린다. brand[600]을 어두운 배경에 그대로 쓰면
   * 배경과 붙어버려서 버튼이 눌리는 물건으로 안 보인다.
   * brand[500](#0c7cb3)은 흰 라벨 대비 4.61:1 로 AA를 넘긴다.
   */
  brand: brand[500],
  'brand-hover': brand[400],
  'brand-subtle': '#0d3049',
  'brand-subtle-hover': '#123c5a',
  'brand-border': '#2e5f7d',
  'brand-text': brand[300],
  'on-brand': neutral[0],

  /* 오로라 액센트 — 라이트와 같은 역할. 숫자 데이터에 금지. */
  accent: auroraTeal[400],
  'accent-text': auroraTeal[400],
  'accent-subtle': auroraTeal[900],
  'accent-border': auroraTeal[800],
  /* 다크는 accent-alt == accent-alt-text (다크 프리셋 8종 공통 관례) */
  'accent-alt': auroraGreen[400],
  'accent-alt-text': auroraGreen[400],
  'accent-alt-subtle': auroraGreen[900],
  'accent-alt-border': auroraGreen[800],

  ...COMMON_DARK,

  overlay: 'rgba(2, 6, 12, 0.68)',
  'focus-ring': brand[300],
  'focus-shadow': 'rgba(121, 197, 230, 0.3)',

  'shadow-1': '0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.24)',
  'shadow-2': '0 2px 4px rgba(0, 0, 0, 0.32), 0 4px 12px rgba(0, 0, 0, 0.36)',
  'shadow-3': '0 2px 6px rgba(0, 0, 0, 0.36), 0 12px 32px rgba(0, 0, 0, 0.48)',

  /* 시그니처 — 스칼라 stop */
  'ribbon-stop-1': AURORA_DARK_RIBBON[0],
  'ribbon-stop-2': AURORA_DARK_RIBBON[1],
  'ribbon-stop-3': AURORA_DARK_RIBBON[2],
  'cta-stop-1': AURORA_DARK_CTA[0],
  'cta-stop-2': AURORA_DARK_CTA[1],
  'cta-stop-3': AURORA_DARK_CTA[2],
  /** 진행률 트랙 (= surface-sunken 값) */
  'progress-track': '#0e1727',

  /* 시그니처 — CSS 값 문자열 (위 스칼라에서 조립) */
  'gradient-aurora': buildAuroraGradient(AURORA_DARK_RIBBON),
  'gradient-cta': buildCtaGradient(AURORA_DARK_CTA),
  /* 히어로 면 — 라이트와 같은 처방(단색). 다크는 흰 캔버스로 가지 않고 면 밝기 위계를 지킨다. */
  'gradient-hero': neutral[900],
  'gradient-hero-soft': '#17253c',
  /* 다크 글로우 — 뚜렷하되 절제. 알파 상한 0.14/0.12 (최악 지점 text-muted 4.57:1 실측). */
  'bg-glow': `radial-gradient(1100px 600px at 18% -10%, rgba(45, 212, 191, 0.14), transparent 60%), radial-gradient(900px 520px at 82% -14%, rgba(129, 140, 248, 0.12), transparent 55%), ${neutral[950]}`,
  /*
   * 서리유리 — 알파 0.85 미만 금지. 0.78에서는 밝은 teal(#2dd4bf) 위
   * text-secondary가 4.41:1로 탈락했다(실측). rgb(27,42,68) = neutral[850].
   */
  'surface-glass': 'rgba(27, 42, 68, 0.85)',
  /* 서리유리 불투명 폴백 (= surface-raised) */
  'surface-glass-fallback': neutral[850],

  'chart-axis-line': '#2c3d59',
  'chart-split-line': '#1c2942',
  'chart-label': '#a9b7cc',
  'chart-slice-border': neutral[900],

  ...chartSeriesTokens(AURORA_CHART_SERIES),

  'picker-filter': 'invert(0.86)'
};
