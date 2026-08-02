/* -------------------------------------------------------------------------- */
/* velog — 기본 프리셋. open-color 기반, 플랫·미니멀·콘텐츠 우선                    */
/* -------------------------------------------------------------------------- */

import { palette } from '../primitives';
import type { ThemeTokens } from '../semantic';
import { chartSeriesTokens, type ChartSeries } from './chartSeriesTokens';
import { buildDuotoneGradient, buildHeroGradient } from './gradients';
import { COMMON_DARK, COMMON_LIGHT } from './sharedTokens';

const { brand } = palette;

/**
 * velog: 시리즈 0 = teal-7(#0ca678: 흰 3.11 / #1e1e1e 5.35). 기존 green(#47955e)은
 * teal과 ΔE 충돌 위험 → open-color indigo-7(#4263eb, vs violet ΔE 29.87)로 교체.
 */
const VELOG_CHART_SERIES: ChartSeries = [
  '#0ca678',
  '#c26d22',
  '#4263eb',
  '#cf5f7d',
  '#8b6fc9',
  '#9a7b14',
  '#9c4f92',
  '#6b7785'
];

/**
 * 근거: velog.io의 open-color 팔레트 — gray 0~9(#f8f9fa~#212529) + 시그니처 teal.
 * AA 조정 2건(참조값이 미달이라 의도적으로 바꾼 곳):
 *  ① 라이트 text-muted: gray-6(#868e96)은 흰 배경 3.21:1 → #5f6975(흰 5.58, sunken 4.99).
 *    #868e96은 border-strong(비텍스트 3:1)으로만 쓴다.
 *  ② 라이트 브랜드 솔리드: #12b886은 흰 라벨 2.55:1 → teal-9 #087f5b(5.0:1).
 *    밝은 틸(#20c997)은 다크에서 **어두운 라벨(on-brand=#121212, 8.79:1)** 과 함께 본색으로 산다.
 *
 * 라이트 border-strong(#868e96)은 bg(#f8f9fa) 대비 3.15로 빠듯 — bg를 더 어둡게 내리면 즉시 탈락.
 * accent-alt는 구 회색에서 **open-color green 계열**로 옮겼다(2026-07-28 아이덴티티 패스) —
 * 원본 팔레트 충실성은 유지되고, brand 틸과는 ΔE 22.1로 갈린다.
 *
 * 🔵 **accent = 브랜드 램프(글레이셔 애저)** (2026-07-31). 구 velog는 accent가 brand의 사본이었다
 * (라이트 ΔE 8.2 + subtle/border/text 3토큰 문자열 동일, **다크는 ΔE 0 = 완전 동일**).
 * 8프리셋 중 역할 분리가 없던 것은 velog뿐이었고(실측: 나머지 7종 ΔE 19.6~120.2), velog가
 * 기본 프리셋이라 "앱이 단색으로 보인다"는 인상의 물리적 원인이 여기였다.
 * 새 hex를 만들지 않고 `palette.brand`(primitives.ts) 램프를 그대로 꺼내 쓴다 — 그 파랑은
 * 이미 전 프리셋 공통 워드마크 앞 낱말이 헤더에서 쓰는 색이라, 화면에 없던 색을 들이는 게
 * 아니라 **헤더에만 있던 색을 토큰 계층으로 내리는** 것이다.
 * 역할: brand(틸) = 액션·인터랙션(버튼·탭·포커스링) / accent(애저) = 정보 크롬(배지·아이콘·레일).
 * ⚠ focus-ring/focus-shadow는 **일부러 틸 그대로** 뒀다 — 포커스는 액션 축이다.
 */
export const VELOG_LIGHT: ThemeTokens = {
  /*
   * 의도적 무틴트 — 라이트 bg 틴트 강화(2차 배리에이션)에서 velog만 제외했다.
   * open-color gray-0(#f8f9fa) 참조 충실성이 이 프리셋의 정체성이다. 틴트를 넣지 마라.
   */
  bg: '#f8f9fa',
  surface: '#ffffff',
  'surface-raised': '#ffffff',
  'surface-muted': '#f8f9fa',
  'surface-sunken': '#f1f3f5',
  'surface-hover': '#f8f9fa',

  border: '#e9ecef',
  'border-strong': '#868e96',

  text: '#212529',
  'text-secondary': '#495057',
  'text-muted': '#5f6975',
  'text-inverse': '#ffffff',

  brand: '#087f5b',
  'brand-hover': '#066649',
  'brand-subtle': '#e6fcf5',
  'brand-subtle-hover': '#c3fae8',
  'brand-border': '#96f2d7',
  'brand-text': '#087f5b',
  'on-brand': '#ffffff',

  /* 액센트 = 글레이셔 애저 램프 그대로. 흰 서피스 위 accent 5.63:1 / accent-text 7.42:1(실측). */
  accent: brand[600],
  'accent-text': brand[700],
  'accent-subtle': brand[50],
  'accent-border': brand[200],
  'accent-alt': '#26a14f',
  'accent-alt-text': '#13762a',
  'accent-alt-subtle': '#e7f5ec',
  'accent-alt-border': '#a8d9b9',

  ...COMMON_LIGHT,

  overlay: 'rgba(33, 37, 41, 0.5)',
  'focus-ring': '#099268',
  'focus-shadow': 'rgba(9, 146, 104, 0.22)',

  /* 플랫 그림자 — 은은하게. velog다움은 그림자 절제가 만든다. */
  'shadow-1': '0 1px 3px rgba(0, 0, 0, 0.05)',
  'shadow-2': '0 2px 8px rgba(0, 0, 0, 0.06)',
  'shadow-3': '0 8px 24px rgba(0, 0, 0, 0.12)',

  'ribbon-stop-1': '#087f5b',
  'ribbon-stop-2': '#099268',
  'ribbon-stop-3': '#099268',
  'cta-stop-1': '#087f5b',
  'cta-stop-2': '#076c50',
  'cta-stop-3': '#066649',
  'progress-track': '#f8f9fa',

  /* 시그니처는 duotone — 그라데이션이 거의 안 보이는 것이 velog다움 */
  'gradient-aurora': buildDuotoneGradient('#087f5b', '#099268'),
  'gradient-cta': buildDuotoneGradient('#087f5b', '#066649'),
  /* 히어로 면 — 라이트 최악 지점(blue stop) text-muted 4.63:1 / soft 5.05:1(실측). */
  'gradient-hero': buildHeroGradient('#deecf6', '#e6f5ef'),
  'gradient-hero-soft': buildHeroGradient('#edf5fa', '#f1f9f6'),
  /* 글로우 없음 = 단색 (역할: 페이지 배경) */
  'bg-glow': '#f8f9fa',
  /* 사실상 불투명한 유리 */
  'surface-glass': 'rgba(255, 255, 255, 0.96)',
  'surface-glass-fallback': '#ffffff',

  'chart-axis-line': '#dee2e6',
  'chart-split-line': '#f1f3f5',
  'chart-label': '#495057',
  'chart-slice-border': '#ffffff',

  ...chartSeriesTokens(VELOG_CHART_SERIES),

  'picker-filter': 'none'
};

export const VELOG_DARK: ThemeTokens = {
  bg: '#121212',
  surface: '#1e1e1e',
  'surface-raised': '#2a2a2a',
  'surface-muted': '#242424',
  'surface-sunken': '#191919',
  'surface-hover': '#313131',

  border: '#343434',
  'border-strong': '#7b828a',

  text: '#ececec',
  'text-secondary': '#adb5bd',
  'text-muted': '#868e96',
  'text-inverse': '#121212',

  brand: '#20c997',
  'brand-hover': '#38d9a9',
  'brand-subtle': '#12352a',
  'brand-subtle-hover': '#1a4634',
  'brand-border': '#2f7d5f',
  'brand-text': '#20c997',
  /** 어두운 라벨 — 밝은 틸(#20c997) 위 #121212 = 8.79:1. 라벨 색을 흰색으로 하드코딩하면 여기서 깨진다. */
  'on-brand': '#121212',

  /*
   * 액센트 = 글레이셔 애저(라이트와 같은 램프의 다크 슬롯). brand[300]은 밝기가 velog 다크 brand
   * (#20c997, surface 대비 7.82)와 맞물린다(8.68) — 더 어두운 brand[400]을 쓰면 민트 옆에서 탁해진다.
   * subtle/border 2값만 velog 로컬 파생이다(램프에 다크 서피스용 틴트가 없다). 파생 규칙은
   * **명도 이식**: 각각 brand-subtle/brand-border가 이 프리셋에서 내는 대비를 그대로 맞춘다
   * (text on subtle 11.37 vs brand-subtle 11.33 / border on surface 3.31 vs brand-border 3.34).
   * HSL 명도를 그대로 복사하면 파랑이 초록보다 어둡게 보여 액센트 칩만 죽는다.
   */
  accent: brand[300],
  'accent-text': brand[300],
  'accent-subtle': '#123243',
  'accent-border': '#3a7690',
  'accent-alt': '#75df98',
  'accent-alt-text': '#75df98',
  'accent-alt-subtle': '#142419',
  'accent-alt-border': '#295437',

  ...COMMON_DARK,

  overlay: 'rgba(0, 0, 0, 0.6)',
  'focus-ring': '#20c997',
  'focus-shadow': 'rgba(32, 201, 151, 0.3)',

  'shadow-1': '0 1px 2px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3)',
  'shadow-2': '0 2px 4px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.4)',
  'shadow-3': '0 2px 6px rgba(0, 0, 0, 0.44), 0 12px 32px rgba(0, 0, 0, 0.52)',

  'ribbon-stop-1': '#20c997',
  'ribbon-stop-2': '#12b886',
  'ribbon-stop-3': '#12b886',
  'cta-stop-1': '#20c997',
  'cta-stop-2': '#19c18f',
  'cta-stop-3': '#12b886',
  'progress-track': '#191919',

  'gradient-aurora': buildDuotoneGradient('#20c997', '#12b886'),
  'gradient-cta': buildDuotoneGradient('#20c997', '#12b886'),
  /*
   * 🔴 knife-edge — 다크 히어로 최악 지점(t≈0.88) text-muted 4.58:1. 16테마 32그라디언트 중 전역 최저다.
   * 이 두 stop 을 더 밝게 올리거나 text-muted(#868e96)를 더 어둡게 내리면 즉시 AA 탈락한다.
   */
  'gradient-hero': buildHeroGradient('#192630', '#172923'),
  'gradient-hero-soft': buildHeroGradient('#161d23', '#151f1b'),
  'bg-glow': '#121212',
  'surface-glass': 'rgba(30, 30, 30, 0.96)',
  'surface-glass-fallback': '#1e1e1e',

  'chart-axis-line': '#3a3a3a',
  'chart-split-line': '#2c2c2c',
  'chart-label': '#adb5bd',
  'chart-slice-border': '#1e1e1e',

  ...chartSeriesTokens(VELOG_CHART_SERIES),

  'picker-filter': 'invert(0.86)'
};
