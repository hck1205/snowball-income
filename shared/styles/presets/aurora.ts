/* -------------------------------------------------------------------------- */
/* aurora — 기존 LIGHT_THEME/DARK_THEME 값 그대로 이동 (단 한 값도 재설계 없음)     */
/* -------------------------------------------------------------------------- */

import { palette } from '../primitives';
import type { ThemeTokens } from '../semantic';
import { chartSeriesTokens, type ChartSeries } from './chartSeriesTokens';
import { buildAuroraGradient, buildCtaGradient, buildHeroGradient, type GradientStops } from './gradients';
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
   * 아이스블루 틴트 강화(구 neutral[50] #edf4fa → #e4f0fc, B-R 채널차 13→24).
   * 명도가 아니라 채도로 색을 준다 — 더 어둡게 내리면 border-strong 3:1(현 3.25)과
   * 글로우 최악 지점 4.5:1이 연쇄로 무너진다(실측). surface-hover는 bg와 동기(설계 관례).
   */
  bg: '#e4f0fc',
  surface: neutral[0],
  'surface-raised': neutral[0],
  'surface-muted': neutral[25],
  'surface-sunken': neutral[100],
  'surface-hover': '#e4f0fc',

  /* 경계 — border는 장식(카드 윤곽), border-strong은 컨트롤 경계(3:1 필요) */
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
  'shadow-2': '0 2px 4px rgba(13, 32, 58, 0.05), 0 4px 12px rgba(13, 32, 58, 0.09)',
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
  /* 히어로 면 — 라이트는 blue stop(t=0)이 최악 지점. text-muted 4.86:1 / soft 5.32:1(실측). */
  'gradient-hero': buildHeroGradient('#dcebf6', '#e6f5ef'),
  'gradient-hero-soft': buildHeroGradient('#ecf4fa', '#f1f9f6'),
  /*
   * 페이지 상단 오로라 글로우 — body 배경. 마지막 레이어가 bg 단색이라 폴백 겸용.
   * 알파 상한 0.05/0.04 — bg 틴트 강화(#e4f0fc)의 필수 연쇄 감쇄다. 구 0.06/0.05를 유지하면
   * 두 radial 완전 중첩 최악 지점에서 text-muted가 ~4.37로 탈락(실측). 현 최악 #d5e5f5 위 4.61:1.
   */
  'bg-glow':
    'radial-gradient(1200px 640px at 16% -10%, rgba(13, 148, 136, 0.05), transparent 60%), radial-gradient(1000px 560px at 84% -12%, rgba(109, 90, 230, 0.04), transparent 55%), #e4f0fc',
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
  /* 히어로 면 — 다크는 green stop 근처(t≈0.75~1)가 최악. text-muted 5.63:1 / soft 6.30:1(실측). */
  'gradient-hero': buildHeroGradient('#12283e', '#10292f'),
  'gradient-hero-soft': buildHeroGradient('#0f1e30', '#0d1f28'),
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
