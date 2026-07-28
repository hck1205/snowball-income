/**
 * 팔레트 프리셋 레지스트리 — "이름은 역할, 값은 프리셋".
 *
 * CSS 변수 이름(`--sb-*`)과 `color.*` 파사드는 **역할**이다. `gradient-aurora`, `bg-glow`,
 * `surface-glass` 같은 이름도 그대로 두고 프리셋이 **값만** 바꾼다 — velog에서 `gradient-aurora`는
 * "오로라"가 아니라 미묘한 틸그린 duotone이고, `bg-glow`는 사실상 단색이다. 이름을
 * 역할("표시용 시그니처 그라데이션", "페이지 배경", "유리 서피스")로 읽으면 모순이 없다.
 * **컴포넌트는 한 줄도 수정하지 않는 것**이 이 아키텍처의 성공 기준이다.
 *
 * 배선:
 *  - id 계약(`PalettePresetId`)은 `@/shared/constants/palette` — 상태 계층(jotai)과 공유하는 최소 계약.
 *    (배럴 `@/shared/constants` 대신 폴더 직접 import — constants/allocation → styles 역방향 참조와의
 *    순환 평가(TDZ)를 끊기 위함이다.)
 *  - `globalStyles.ts`가 이 레지스트리로 `:root[data-palette='<id>']` 변수 스코프를 생성한다.
 *  - `contrast.test.ts`가 전 프리셋(8종) × light/dark 전체를 WCAG 수치로 강제한다.
 *
 * 모든 hex는 확정 스펙 값이다(스펙: theme-presets-spec v1.0 + theme-variation-spec v1.0 —
 * 8종 확장판 검증 로그 1,276건 전 PASS).
 * **임의로 바꾸지 마라** — 바꾸면 contrast.test.ts가 떨어지고, 통과하더라도 실측 근거가 사라진다.
 */

import { DEFAULT_PALETTE_PRESET_ID, PALETTE_PRESET_IDS } from '@/shared/constants/palette';
import type { PalettePresetId } from '@/shared/constants/palette';
import { palette } from './primitives';
import type { ThemeTokens } from './semantic';

const { brand, auroraTeal, auroraViolet, auroraGreen, neutral, up, down, positive, warning, danger } = palette;

export type ThemePreset = {
  /** 스위처에 노출되는 한국어 이름 */
  label: string;
  /** 스위처 미리보기 스와치 3색 (bg 틴트 / 시그니처 / 보조) — 표시 전용 */
  swatch: readonly [string, string, string];
  light: ThemeTokens;
  dark: ThemeTokens;
};

/* -------------------------------------------------------------------------- */
/* 그라데이션 조립 — 스칼라 stop이 진실 공급원                                     */
/* -------------------------------------------------------------------------- */

/*
 * ⚠ 이 블록은 아래 COMMON_* 보다 **먼저** 와야 한다 — `const` 는 호이스팅되지 않아
 * (TDZ) 워드마크 토큰이 빌더보다 위에 있으면 모듈 평가 시 ReferenceError 로 죽는다.
 */

type GradientStops = readonly [string, string, string];

/** 표시용 시그니처 리본 — hero 액센트 바, 진행률 채움, 탭 인디케이터, BrandMark. 서피스 대비 3:1 기준. */
const buildAuroraGradient = ([stop1, stop2, stop3]: GradientStops): string =>
  `linear-gradient(135deg, ${stop1} 0%, ${stop2} 52%, ${stop3} 100%)`;

/** CTA 리본 — primary 버튼 채움. 모든 stop이 흰 라벨 ≥ 4.5:1 기준. */
const buildCtaGradient = ([stop1, stop2, stop3]: GradientStops): string =>
  `linear-gradient(135deg, ${stop1} 0%, ${stop2} 55%, ${stop3} 100%)`;

/** duotone — velog·navy-gold처럼 그라데이션이 "거의 안 보이는" 프리셋의 시그니처. */
const buildDuotoneGradient = (from: string, to: string): string =>
  `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;

/**
 * 워드마크 텍스트 그라데이션 — `background-clip: text` 전용. 글자가 가로로 흐르므로 각도를 눕힌다.
 *
 * 라이트 헤더 표면(brand-subtle) 위 실측은 stop-1 2.28~2.61 / stop-2 1.56~1.79 로 얇다.
 * WCAG 2.1 SC 1.4.3은 로고·브랜드명 텍스트를 명시적으로 면제하므로 **실패가 아니지만**,
 * 소비 컴포넌트에서 더 옅어 보이면 **hex를 바꾸지 말고** 끝 stop 위치를 100% 밖(예: 135%)으로
 * 밀어 렌더되는 최연색만 제한하라(선언 hex 불변 → 회귀 플로어 테스트도 그대로 통과한다).
 */
const buildWordmarkGradient = (from: string, to: string): string =>
  `linear-gradient(100deg, ${from} 0%, ${to} 100%)`;

/**
 * 파스텔 히어로 면 — PageHero 배경·EmptyState 카드·프로모/CTA 카드 **전용**. 콘텐츠 카드 금지.
 *
 * `gradient-cta`(버튼 채움) ↔ `gradient-aurora`(리본·장식) 교차 금지 규칙은 그대로이고,
 * 이 계열은 **면 배경 전용의 세 번째 계열**이다 — 버튼·리본에 쓰면 안 된다.
 * stop은 임의의 파스텔이 아니라 각 프리셋의 surface(라이트)·bg(다크)에
 * 쿨 캐스트(blue 205° / teal-green 158°)를 섞어 파생한 값이다.
 */
const buildHeroGradient = (from: string, to: string): string =>
  `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;

/* -------------------------------------------------------------------------- */
/* 전 프리셋 공통 토큰 — 데이터·상태 어휘 (변경 금지)                              */
/* -------------------------------------------------------------------------- */

/**
 * 워드마크("스노우볼 인컴")도 **전 프리셋 공통**이다 — 프리셋은 사용자가 고르는 피부고
 * 워드마크는 제품의 이름이라, 스킨을 따라 색이 바뀌면 안 된다. 더 실제적인 이유:
 * OG 이미지·파비콘·webmanifest는 `data-palette`를 모르는 표면이라 프리셋별로 갈리면
 * **어떤 값을 구울지 결정 불가**가 된다.
 *
 * 2색 구성: "스노우볼" = 브랜드 램프(아이스블루), "인컴" = 틸→그린(액센트 축).
 * 단색 폴백(`wordmark-*-solid`)은 **라이트/다크 동일 1쌍** — 다크 헤더 위에서도
 * 3.57~5.14:1로 살아 있어 테마별로 가를 이유가 없고, 표면마다 브랜드 색이 갈리지 않는다.
 * 소비처에서 `background-clip: text`를 쓸 때 폴백(@supports·forced-colors·print)을 반드시 깔 것.
 */
const WORDMARK_LIGHT: ThemeTokens = {
  'gradient-wordmark-snow': buildWordmarkGradient(brand[400], brand[300]),
  'gradient-wordmark-income': buildWordmarkGradient(auroraTeal[600], auroraGreen[600]),
  'wordmark-snow-solid': brand[400],
  'wordmark-income-solid': auroraTeal[600]
};

const WORDMARK_DARK: ThemeTokens = {
  'gradient-wordmark-snow': buildWordmarkGradient(brand[300], brand[200]),
  'gradient-wordmark-income': buildWordmarkGradient(auroraTeal[400], auroraGreen[400]),
  /* 단색 폴백은 라이트와 동일 값 — 위 주석 참조 */
  'wordmark-snow-solid': brand[400],
  'wordmark-income-solid': auroraTeal[600]
};

/**
 * up/down(상승 적색/하락 청색)·success/warning/danger는 **전 프리셋 공통 동일값**이다.
 * 숫자 옆의 색은 학습된 반사신경이라 프리셋이 바꾸면 오독을 유발한다.
 *
 * 하한 근거: 공통 `data-positive`(#d92d20)는 각 프리셋 `surface-muted` 위에서 빠듯하다 —
 * 최저는 **ink 라이트 4.50(knife-edge, AA 턱걸이)**, 나머지도 4.5x대.
 * **어느 프리셋도 surface-muted를 지금보다 어둡게 내릴 수 없고, 이 공통값도 조정 여지가 없다.**
 */
const COMMON_LIGHT: ThemeTokens = {
  'data-positive': up.light,
  'data-positive-surface': up.soft,
  'data-negative': down.light,
  'data-negative-surface': down.soft,
  success: positive.light,
  'success-surface': positive.soft,
  warning: warning.light,
  'warning-surface': warning.soft,
  danger: danger.light,
  'danger-surface': danger.soft,
  'danger-border': danger.softBorder,

  ...WORDMARK_LIGHT
};

const COMMON_DARK: ThemeTokens = {
  'data-positive': up.dark,
  'data-positive-surface': up.softDark,
  'data-negative': down.dark,
  'data-negative-surface': down.softDark,
  success: positive.dark,
  'success-surface': positive.softDark,
  warning: warning.dark,
  'warning-surface': warning.softDark,
  danger: danger.dark,
  'danger-surface': danger.softDark,
  'danger-border': danger.softDarkBorder,

  ...WORDMARK_DARK
};

/* -------------------------------------------------------------------------- */
/* 차트 시리즈 — 시맨틱 토큰 승격 (chart-series-0..7)                             */
/* -------------------------------------------------------------------------- */

/**
 * 캔버스는 테마별 색 교체가 안 되므로 프리셋마다 **한 세트가 light/dark 양쪽**에서
 * 3:1(WCAG 1.4.11)을 만족해야 한다 — 그래서 light/dark 맵에 같은 값이 들어간다.
 * 세트 내 모든 쌍 ΔE ≥ 20 (contrast.test.ts가 강제).
 */
type ChartSeries = readonly [string, string, string, string, string, string, string, string];

const chartSeriesTokens = (series: ChartSeries): ThemeTokens =>
  Object.fromEntries(series.map((hex, index) => [`chart-series-${index}`, hex] as const));

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

/** vivid: 시리즈 0 = 일렉트릭 블루(vs violet ΔE 39.94), green → 민트 #00997e(vs olive ΔE 66.16). */
const VIVID_CHART_SERIES: ChartSeries = [
  '#2d5bf5',
  '#c26d22',
  '#00997e',
  '#cf5f7d',
  '#8b6fc9',
  '#9a7b14',
  '#9c4f92',
  '#6b7785'
];

/**
 * navy-gold: 시리즈 0 = 스틸 네이비(vs slate ΔE 25.64), olive → 골드 #b08a24
 * (배당=금화 메타포를 데이터에도). 골드↔오렌지 ΔE 24.51이 세트 최저 — 인덱스 1·5로 이미 거리를 벌려 뒀다.
 */
const NAVY_GOLD_CHART_SERIES: ChartSeries = [
  '#4d6ca4',
  '#c26d22',
  '#47955e',
  '#cf5f7d',
  '#8b6fc9',
  '#b08a24',
  '#9c4f92',
  '#6b7785'
];

/**
 * sunset: 시리즈 0 = 코랄(주인공). 기존 orange(#c26d22)는 코랄과 ΔE 충돌이라
 * azure(#1f7ba5, 구 브랜드색)로 교체. 코랄 vs rose 49.12 / vs olive 40.65, 다크 surface 3.19(실측).
 */
const SUNSET_CHART_SERIES: ChartSeries = [
  '#bc4c0f',
  '#1f7ba5',
  '#47955e',
  '#cf5f7d',
  '#8b6fc9',
  '#9a7b14',
  '#9c4f92',
  '#6b7785'
];

/**
 * forest: 시리즈 0 = 포레스트 그린. 기존 green(#47955e)은 브랜드와 ΔE 충돌이라 azure로 교체.
 * 그린 vs olive 53.99 / vs slate 44.49, 다크 surface 3.32(실측).
 */
const FOREST_CHART_SERIES: ChartSeries = [
  '#2b8052',
  '#c26d22',
  '#1f7ba5',
  '#cf5f7d',
  '#8b6fc9',
  '#9a7b14',
  '#9c4f92',
  '#6b7785'
];

/**
 * grape: 시리즈 0 = 퍼플. 기존 violet(#8b6fc9)은 브랜드와 ΔE 충돌이라 azure로 교체(인덱스 4).
 * 퍼플 vs plum 41.33 / vs azure 67.48 / vs rose 69.34(실측).
 */
const GRAPE_CHART_SERIES: ChartSeries = [
  '#7a53da',
  '#c26d22',
  '#47955e',
  '#cf5f7d',
  '#1f7ba5',
  '#9a7b14',
  '#9c4f92',
  '#6b7785'
];

/*
 * ink: 차트는 aurora 8색 그대로 재사용. 크롬은 완전 무채지만 데이터 구분은 ΔE가 필수라
 * 모노 8색은 물리적으로 불가 — "흑백 신문 위 컬러 인포그래픽" 정합(ink 다크 surface
 * #1a1a1a에서 전 시리즈 3:1 재검증 완료).
 */

/* -------------------------------------------------------------------------- */
/* aurora — 기존 LIGHT_THEME/DARK_THEME 값 그대로 이동 (단 한 값도 재설계 없음)     */
/* -------------------------------------------------------------------------- */

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

const AURORA_LIGHT: ThemeTokens = {
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

const AURORA_DARK: ThemeTokens = {
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

/* -------------------------------------------------------------------------- */
/* velog — 기본 프리셋. open-color 기반, 플랫·미니멀·콘텐츠 우선                    */
/* -------------------------------------------------------------------------- */

/**
 * 근거: velog.io의 open-color 팔레트 — gray 0~9(#f8f9fa~#212529) + 시그니처 teal.
 * AA 조정 2건(참조값이 미달이라 의도적으로 바꾼 곳):
 *  ① 라이트 text-muted: gray-6(#868e96)은 흰 배경 3.21:1 → #5f6975(흰 5.58, sunken 4.99).
 *    #868e96은 border-strong(비텍스트 3:1)으로만 쓴다.
 *  ② 라이트 브랜드 솔리드: #12b886은 흰 라벨 2.55:1 → teal-9 #087f5b(5.0:1).
 *    밝은 틸(#20c997)은 다크에서 **어두운 라벨(on-brand=#121212, 8.79:1)** 과 함께 본색으로 산다.
 *
 * 라이트 border-strong(#868e96)은 bg(#f8f9fa) 대비 3.15로 빠듯 — bg를 더 어둡게 내리면 즉시 탈락.
 * velog는 accent==brand(단일 색상계)다. accent-alt는 구 회색에서 **open-color green 계열**로
 * 옮겼다(2026-07-28 아이덴티티 패스) — 원본 팔레트 충실성은 유지되고, brand 틸과는 ΔE 22.1로 갈린다.
 */
const VELOG_LIGHT: ThemeTokens = {
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

  accent: '#099268',
  'accent-text': '#087f5b',
  'accent-subtle': '#e6fcf5',
  'accent-border': '#96f2d7',
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

const VELOG_DARK: ThemeTokens = {
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

  accent: '#20c997',
  'accent-text': '#20c997',
  'accent-subtle': '#12352a',
  'accent-border': '#2f7d5f',
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

/* -------------------------------------------------------------------------- */
/* vivid — 비비드 핀테크 (경쾌·활기)                                              */
/* -------------------------------------------------------------------------- */

/**
 * 라벤더 화이트 + 일렉트릭 블루 + 민트/퍼플. AA 조정:
 *  - #3d6bff는 흰 라벨 4.43:1 미달 → 라이트 brand #2d5bf5(5.35:1).
 *  - #00c9a7·#7c5cff는 라이트에서 미달 → 라이트용 #00997e(표시 3.58)/#007a64(텍스트 5.29),
 *    #7c5cff는 표시(4.34≥3)로만, 텍스트는 #5b3de6(6.44).
 * 다크 글로우 알파는 **0.12/0.10 상한** — 0.16/0.14에서 text-muted가 글로우 최악 지점
 * 4.27:1로 탈락했다(실측). 현 값 기준 4.92:1.
 */
const VIVID_LIGHT: ThemeTokens = {
  /* 라벤더 틴트 강화(구 #f5f7ff → #eef0ff) — border-strong on bg 3.56, 글로우 최악 4.72(실측). hover=bg 동기. */
  bg: '#eef0ff',
  surface: '#ffffff',
  'surface-raised': '#ffffff',
  'surface-muted': '#fafbff',
  'surface-sunken': '#e9edfc',
  'surface-hover': '#eef0ff',

  border: '#dbe1f5',
  'border-strong': '#737e9d',

  text: '#171c33',
  'text-secondary': '#454f6e',
  'text-muted': '#57627f',
  'text-inverse': '#ffffff',

  brand: '#2d5bf5',
  'brand-hover': '#1e46d6',
  'brand-subtle': '#e8eeff',
  'brand-subtle-hover': '#d6e0ff',
  'brand-border': '#b3c6ff',
  'brand-text': '#2447cf',
  'on-brand': '#ffffff',

  accent: '#00997e',
  'accent-text': '#007a64',
  'accent-subtle': '#dcfaf3',
  'accent-border': '#86e8d3',
  'accent-alt': '#0aa155',
  'accent-alt-text': '#03772c',
  'accent-alt-subtle': '#e4f5ec',
  'accent-alt-border': '#9dd9bb',

  ...COMMON_LIGHT,

  overlay: 'rgba(23, 26, 51, 0.5)',
  'focus-ring': '#2d5bf5',
  'focus-shadow': 'rgba(45, 91, 245, 0.25)',

  /* 살짝 컬러 섀도 — 경쾌함의 디테일 */
  'shadow-1': '0 1px 2px rgba(23, 26, 51, 0.06), 0 1px 3px rgba(23, 26, 51, 0.08)',
  'shadow-2': '0 2px 4px rgba(45, 91, 245, 0.06), 0 4px 12px rgba(23, 26, 51, 0.10)',
  'shadow-3': '0 4px 10px rgba(45, 91, 245, 0.08), 0 12px 32px rgba(23, 26, 51, 0.18)',

  'ribbon-stop-1': '#2d5bf5',
  'ribbon-stop-2': '#00997e',
  'ribbon-stop-3': '#7c5cff',
  'cta-stop-1': '#2d5bf5',
  'cta-stop-2': '#007a64',
  'cta-stop-3': '#5b3de6',
  'progress-track': '#e9edfc',

  'gradient-aurora': buildAuroraGradient(['#2d5bf5', '#00997e', '#7c5cff']),
  'gradient-cta': buildCtaGradient(['#2d5bf5', '#007a64', '#5b3de6']),
  /* 히어로 면 — 채도 강한 프리셋이라 캐스트를 라이트 0.16/0.13 으로 잡았다. 최악 text-muted 4.98:1. */
  'gradient-hero': buildHeroGradient('#dcebf6', '#e3f4ee'),
  'gradient-hero-soft': buildHeroGradient('#ecf4fa', '#f0f9f6'),
  /* 단색층만 새 bg(#eef0ff)로 — 알파 0.07/0.06은 유지 가능(글로우 최악 4.72 실측) */
  'bg-glow':
    'radial-gradient(1200px 640px at 16% -10%, rgba(0, 201, 167, 0.07), transparent 60%), radial-gradient(1000px 560px at 84% -12%, rgba(124, 92, 255, 0.06), transparent 55%), #eef0ff',
  'surface-glass': 'rgba(255, 255, 255, 0.8)',
  'surface-glass-fallback': '#ffffff',

  'chart-axis-line': '#d6ddf2',
  'chart-split-line': '#e9edfc',
  'chart-label': '#454f6e',
  'chart-slice-border': '#ffffff',

  ...chartSeriesTokens(VIVID_CHART_SERIES),

  'picker-filter': 'none'
};

const VIVID_DARK: ThemeTokens = {
  /* 딥 인디고 */
  bg: '#101223',
  surface: '#1a1e38',
  'surface-raised': '#262b4f',
  'surface-muted': '#202544',
  'surface-sunken': '#151831',
  'surface-hover': '#2d335c',

  border: '#313a63',
  'border-strong': '#6d7aa8',

  text: '#eaedfb',
  'text-secondary': '#aeb6d9',
  'text-muted': '#929cc4',
  'text-inverse': '#101223',

  brand: '#3d63f2',
  'brand-hover': '#2e51d8',
  'brand-subtle': '#1b2a5c',
  'brand-subtle-hover': '#223471',
  'brand-border': '#3a4d99',
  'brand-text': '#9db4ff',
  'on-brand': '#ffffff',

  accent: '#00c9a7',
  'accent-text': '#00c9a7',
  'accent-subtle': '#0e3330',
  'accent-border': '#16665a',
  'accent-alt': '#61f299',
  'accent-alt-text': '#61f299',
  'accent-alt-subtle': '#132423',
  'accent-alt-border': '#285441',

  ...COMMON_DARK,

  overlay: 'rgba(5, 7, 20, 0.68)',
  'focus-ring': '#9db4ff',
  'focus-shadow': 'rgba(157, 180, 255, 0.3)',

  /* aurora 다크 값 재사용 — 다크 그림자는 프리셋 개성 요소가 아니다 */
  'shadow-1': '0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.24)',
  'shadow-2': '0 2px 4px rgba(0, 0, 0, 0.32), 0 4px 12px rgba(0, 0, 0, 0.36)',
  'shadow-3': '0 2px 6px rgba(0, 0, 0, 0.36), 0 12px 32px rgba(0, 0, 0, 0.48)',

  'ribbon-stop-1': '#6a8aff',
  'ribbon-stop-2': '#00c9a7',
  'ribbon-stop-3': '#9d86ff',
  'cta-stop-1': '#3d63f2',
  'cta-stop-2': '#00806a',
  'cta-stop-3': '#6a4df0',
  'progress-track': '#151831',

  'gradient-aurora': buildAuroraGradient(['#6a8aff', '#00c9a7', '#9d86ff']),
  'gradient-cta': buildCtaGradient(['#3d63f2', '#00806a', '#6a4df0']),
  /* 히어로 면 — 다크 최악 text-muted 5.43:1 / soft 6.10:1(실측). */
  'gradient-hero': buildHeroGradient('#172840', '#162b33'),
  'gradient-hero-soft': buildHeroGradient('#141e33', '#13202c'),
  /* 알파 0.12/0.10 상한 — 0.16에서 text-muted 4.27:1 탈락 실측. 올리지 마라. */
  'bg-glow':
    'radial-gradient(1100px 600px at 18% -10%, rgba(0, 201, 167, 0.12), transparent 60%), radial-gradient(900px 520px at 82% -14%, rgba(157, 134, 255, 0.10), transparent 55%), #101223',
  'surface-glass': 'rgba(38, 43, 79, 0.85)',
  'surface-glass-fallback': '#262b4f',

  'chart-axis-line': '#343c68',
  'chart-split-line': '#232849',
  'chart-label': '#aeb6d9',
  'chart-slice-border': '#1a1e38',

  ...chartSeriesTokens(VIVID_CHART_SERIES),

  'picker-filter': 'invert(0.86)'
};

/* -------------------------------------------------------------------------- */
/* navy-gold — 프리미엄 (딥 네이비 + 골드, 배당=금화)                              */
/* -------------------------------------------------------------------------- */

/**
 * 라이트는 아이보리(#f7f4ec) 위 딥 네이비. 골드는 **장신구(액센트·리본·배지)에만** —
 * 골드는 흰 라벨 4.5:1을 만족하는 밝기가 없어서(예: #a07617=4.14) CTA 채움에서 배제했다
 * ("금은 장신구, 버튼은 정장"). 다크 brand는 스틸 블루 #4d6ca4(서피스 3.25:1, 흰 라벨 5.4:1)
 * — 더 어두운 "진짜 네이비"는 다크 서피스와 2.2:1로 침몰해 탈락(실측). 욕심내지 마라.
 */
const NAVY_GOLD_LIGHT: ThemeTokens = {
  /*
   * 아이보리→크림 골드 틴트 강화(구 #f7f4ec → #f5efdd) — border-strong on bg 4.08,
   * 글로우 최악 4.52(8종 중 가장 타이트 — 실측). 더 진하게 하려면 text-muted부터 어둡게. hover=bg 동기.
   */
  bg: '#f5efdd',
  surface: '#fffcf5',
  'surface-raised': '#fffcf5',
  'surface-muted': '#fbf9f2',
  'surface-sunken': '#efeadd',
  'surface-hover': '#f5efdd',

  border: '#e3dcc9',
  'border-strong': '#7c7360',

  text: '#1f2430',
  'text-secondary': '#475063',
  'text-muted': '#5c6373',
  'text-inverse': '#ffffff',

  brand: '#1f3a68',
  'brand-hover': '#16294b',
  'brand-subtle': '#edf0f8',
  'brand-subtle-hover': '#dce3f0',
  'brand-border': '#b9c7de',
  'brand-text': '#274672',
  'on-brand': '#ffffff',

  /* 골드 = 장신구 전용 액센트 */
  accent: '#a07617',
  'accent-text': '#7a5a0f',
  'accent-subtle': '#f7efd8',
  'accent-border': '#dfc98e',
  /* 버건디 */
  'accent-alt': '#1c9e61',
  'accent-alt-text': '#0b7432',
  /* 틴트는 이 프리셋의 surface(아이보리)에서 파생 — 그래서 subtle 이 아이보리 기운을 갖는다 */
  'accent-alt-subtle': '#e6f2e5',
  'accent-alt-border': '#a4d6ba',

  ...COMMON_LIGHT,

  overlay: 'rgba(24, 22, 16, 0.5)',
  'focus-ring': '#1f3a68',
  'focus-shadow': 'rgba(31, 58, 104, 0.22)',

  /* 웜 섀도 — 아이보리 지면과 어울리는 갈색 틴트 */
  'shadow-1': '0 1px 2px rgba(46, 40, 24, 0.06), 0 1px 3px rgba(46, 40, 24, 0.08)',
  'shadow-2': '0 2px 4px rgba(46, 40, 24, 0.06), 0 4px 12px rgba(46, 40, 24, 0.10)',
  'shadow-3': '0 2px 6px rgba(46, 40, 24, 0.08), 0 12px 32px rgba(46, 40, 24, 0.18)',

  'ribbon-stop-1': '#1f3a68',
  'ribbon-stop-2': '#a07617',
  'ribbon-stop-3': '#8e3b52',
  'cta-stop-1': '#1f3a68',
  'cta-stop-2': '#1b3159',
  'cta-stop-3': '#16294b',
  'progress-track': '#efeadd',

  /* 네이비→골드→버건디 (표시용) / CTA는 네이비 duotone — 골드는 CTA 채움 금지 */
  'gradient-aurora': buildAuroraGradient(['#1f3a68', '#a07617', '#8e3b52']),
  'gradient-cta': buildDuotoneGradient('#1f3a68', '#16294b'),
  /*
   * 히어로 면 — 웜(아이보리) 프리셋이라 쿨 캐스트를 0.12/0.09 로 낮췄다("차가운 빛"이 스민 정도).
   * brand 자체가 네이비(쿨)라 블루 캐스트가 정체성과 충돌하지 않는다. 최악 text-muted 5.07:1.
   */
  'gradient-hero': buildHeroGradient('#e5edef', '#ecf5ea'),
  'gradient-hero-soft': buildHeroGradient('#f1f4f2', '#f5f8ef'),
  /* 단색층만 새 bg(#f5efdd)로 — 알파 0.06/0.05 유지(글로우 최악 4.52 실측, 상한) */
  'bg-glow':
    'radial-gradient(1200px 640px at 16% -10%, rgba(160, 118, 23, 0.06), transparent 60%), radial-gradient(1000px 560px at 84% -12%, rgba(31, 58, 104, 0.05), transparent 55%), #f5efdd',
  'surface-glass': 'rgba(255, 252, 245, 0.8)',
  'surface-glass-fallback': '#fffcf5',

  'chart-axis-line': '#ded6c1',
  'chart-split-line': '#efeadd',
  'chart-label': '#475063',
  'chart-slice-border': '#fffcf5',

  ...chartSeriesTokens(NAVY_GOLD_CHART_SERIES),

  'picker-filter': 'none'
};

const NAVY_GOLD_DARK: ThemeTokens = {
  bg: '#0a0f1e',
  surface: '#141b30',
  'surface-raised': '#1f2942',
  'surface-muted': '#182138',
  'surface-sunken': '#0f1526',
  'surface-hover': '#263250',

  border: '#2a3450',
  'border-strong': '#62708f',

  text: '#e8e9ef',
  'text-secondary': '#acb2c4',
  'text-muted': '#8e97ad',
  'text-inverse': '#0a0f1e',

  /* 스틸 블루 — 서피스 3.25:1, 흰 라벨 5.4:1 */
  brand: '#4d6ca4',
  'brand-hover': '#6283b8',
  'brand-subtle': '#1c2b4f',
  'brand-subtle-hover': '#233459',
  'brand-border': '#38517f',
  'brand-text': '#a9c0e8',
  'on-brand': '#ffffff',

  accent: '#d8b04a',
  'accent-text': '#d8b04a',
  'accent-subtle': '#2f2711',
  'accent-border': '#6e5a1e',
  'accent-alt': '#75dfa6',
  'accent-alt-text': '#75dfa6',
  'accent-alt-subtle': '#112322',
  'accent-alt-border': '#265342',

  ...COMMON_DARK,

  overlay: 'rgba(3, 6, 14, 0.68)',
  'focus-ring': '#a9c0e8',
  'focus-shadow': 'rgba(169, 192, 232, 0.3)',

  /* aurora 다크 값 재사용 */
  'shadow-1': '0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.24)',
  'shadow-2': '0 2px 4px rgba(0, 0, 0, 0.32), 0 4px 12px rgba(0, 0, 0, 0.36)',
  'shadow-3': '0 2px 6px rgba(0, 0, 0, 0.36), 0 12px 32px rgba(0, 0, 0, 0.48)',

  'ribbon-stop-1': '#6f8fc7',
  'ribbon-stop-2': '#d8b04a',
  'ribbon-stop-3': '#cf8fa4',
  'cta-stop-1': '#4d6ca4',
  'cta-stop-2': '#435d97',
  'cta-stop-3': '#3a5488',
  'progress-track': '#0f1526',

  'gradient-aurora': buildAuroraGradient(['#6f8fc7', '#d8b04a', '#cf8fa4']),
  'gradient-cta': buildDuotoneGradient('#4d6ca4', '#3a5488'),
  /* 히어로 면 — 다크 최악 text-muted 5.40:1 / soft 5.93:1(실측). */
  'gradient-hero': buildHeroGradient('#112338', '#10252c'),
  'gradient-hero-soft': buildHeroGradient('#0e1a2d', '#0d1b26'),
  'bg-glow':
    'radial-gradient(1100px 600px at 18% -10%, rgba(216, 176, 74, 0.10), transparent 60%), radial-gradient(900px 520px at 82% -14%, rgba(111, 143, 199, 0.10), transparent 55%), #0a0f1e',
  'surface-glass': 'rgba(31, 41, 66, 0.85)',
  'surface-glass-fallback': '#1f2942',

  'chart-axis-line': '#2f3b5c',
  'chart-split-line': '#1e2740',
  'chart-label': '#acb2c4',
  'chart-slice-border': '#141b30',

  ...chartSeriesTokens(NAVY_GOLD_CHART_SERIES),

  'picker-filter': 'invert(0.86)'
};

/* -------------------------------------------------------------------------- */
/* forest — 딥 그린/세이지 (차분한 숲)                                            */
/* -------------------------------------------------------------------------- */

/**
 * 그린 brand는 success(#0f7a52)와 색상군이 겹친다 — success는 배너/상태 서피스 전용,
 * brand는 컨트롤 채움이라 사용처가 분리된다(QA 시 상태 배너·데이터 숫자 화면 우선 확인).
 * 보조는 클리셰(테라코타)를 피해 우디 브라운(#7d5a3c). 다크 brand는 흰 라벨 4.5를 만족하는
 * #2b8052(4.87)까지만 밝힌다 — #2e8757은 4.45로 탈락(실측).
 */
const FOREST_LIGHT: ThemeTokens = {
  bg: '#eef3ec',
  surface: '#ffffff',
  'surface-raised': '#ffffff',
  'surface-muted': '#f8faf7',
  'surface-sunken': '#e4ece1',
  'surface-hover': '#eef3ec',

  border: '#d8e2d4',
  'border-strong': '#71836d',

  text: '#182218',
  'text-secondary': '#435449',
  'text-muted': '#5a6b5c',
  'text-inverse': '#ffffff',

  brand: '#2f7d4f',
  'brand-hover': '#256540',
  'brand-subtle': '#e7f3e9',
  'brand-subtle-hover': '#d4ead9',
  'brand-border': '#a9d4b4',
  'brand-text': '#256540',
  'on-brand': '#ffffff',

  /* 라임 그린 */
  accent: '#4c8b2e',
  'accent-text': '#3d7222',
  'accent-subtle': '#ecf6e3',
  'accent-border': '#bfe0a4',
  /* 우디 브라운 */
  /* brand(그린 145°)·accent(라임 95°)와 3중 그린이 되지 않게 축의 **틸 끝(174°)** 을 골랐다 */
  'accent-alt': '#129e90',
  'accent-alt-text': '#06726b',
  'accent-alt-subtle': '#e5f4f3',
  'accent-alt-border': '#a0d8d3',

  ...COMMON_LIGHT,

  overlay: 'rgba(16, 26, 18, 0.5)',
  'focus-ring': '#2f7d4f',
  'focus-shadow': 'rgba(47, 125, 79, 0.25)',

  /* 그린 틴트 섀도 */
  'shadow-1': '0 1px 2px rgba(24, 40, 26, 0.06), 0 1px 3px rgba(24, 40, 26, 0.08)',
  'shadow-2': '0 2px 4px rgba(24, 40, 26, 0.06), 0 4px 12px rgba(24, 40, 26, 0.10)',
  'shadow-3': '0 2px 6px rgba(24, 40, 26, 0.08), 0 12px 32px rgba(24, 40, 26, 0.18)',

  'ribbon-stop-1': '#2f7d4f',
  'ribbon-stop-2': '#4c8b2e',
  'ribbon-stop-3': '#7d5a3c',
  'cta-stop-1': '#2f7d4f',
  'cta-stop-2': '#2a7147',
  'cta-stop-3': '#256540',
  'progress-track': '#f8faf7',

  /* 숲의 빛: 그린→라임→우디 / CTA는 그린 duotone */
  'gradient-aurora': buildAuroraGradient(['#2f7d4f', '#4c8b2e', '#7d5a3c']),
  'gradient-cta': buildDuotoneGradient('#2f7d4f', '#256540'),
  /* 히어로 면 — 최악 text-muted 4.81:1 / soft 5.16:1(실측). */
  'gradient-hero': buildHeroGradient('#e1eef7', '#e6f5ef'),
  'gradient-hero-soft': buildHeroGradient('#eef5fb', '#f1f9f6'),
  'bg-glow':
    'radial-gradient(1200px 640px at 16% -10%, rgba(47, 125, 79, 0.05), transparent 60%), radial-gradient(1000px 560px at 84% -12%, rgba(76, 139, 46, 0.04), transparent 55%), #eef3ec',
  'surface-glass': 'rgba(255, 255, 255, 0.8)',
  'surface-glass-fallback': '#ffffff',

  'chart-axis-line': '#d3ded0',
  'chart-split-line': '#e4ece1',
  'chart-label': '#435449',
  'chart-slice-border': '#ffffff',

  ...chartSeriesTokens(FOREST_CHART_SERIES),

  'picker-filter': 'none'
};

const FOREST_DARK: ThemeTokens = {
  /* 그린 블랙 */
  bg: '#0f1712',
  surface: '#18231b',
  'surface-raised': '#233227',
  'surface-muted': '#1d2a20',
  'surface-sunken': '#131c16',
  'surface-hover': '#2a3b2f',

  border: '#2e4033',
  'border-strong': '#64796a',

  text: '#e7efe8',
  'text-secondary': '#a9bbac',
  'text-muted': '#8ba18f',
  'text-inverse': '#0f1712',

  brand: '#2b8052',
  'brand-hover': '#3fa06a',
  'brand-subtle': '#143526',
  'brand-subtle-hover': '#1a4230',
  'brand-border': '#2f6647',
  'brand-text': '#7fd4a5',
  'on-brand': '#ffffff',

  accent: '#55c17e',
  'accent-text': '#55c17e',
  'accent-subtle': '#12301d',
  'accent-border': '#29603c',
  'accent-alt': '#6ce7d7',
  'accent-alt-text': '#6ce7d7',
  'accent-alt-subtle': '#122621',
  'accent-alt-border': '#27554d',

  ...COMMON_DARK,

  overlay: 'rgba(4, 10, 6, 0.7)',
  'focus-ring': '#7fd4a5',
  'focus-shadow': 'rgba(127, 212, 165, 0.3)',

  /* aurora 다크 값 재사용 */
  'shadow-1': '0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.24)',
  'shadow-2': '0 2px 4px rgba(0, 0, 0, 0.32), 0 4px 12px rgba(0, 0, 0, 0.36)',
  'shadow-3': '0 2px 6px rgba(0, 0, 0, 0.36), 0 12px 32px rgba(0, 0, 0, 0.48)',

  'ribbon-stop-1': '#55c17e',
  'ribbon-stop-2': '#8fd14f',
  'ribbon-stop-3': '#c9a978',
  'cta-stop-1': '#2b8052',
  'cta-stop-2': '#27754b',
  'cta-stop-3': '#236a44',
  'progress-track': '#131c16',

  'gradient-aurora': buildAuroraGradient(['#55c17e', '#8fd14f', '#c9a978']),
  'gradient-cta': buildDuotoneGradient('#2b8052', '#236a44'),
  /* 히어로 면 — 다크 최악 text-muted 5.25:1 / soft 5.86:1(실측). */
  'gradient-hero': buildHeroGradient('#16292e', '#142e23'),
  'gradient-hero-soft': buildHeroGradient('#132122', '#12241b'),
  /* 알파 0.10/0.08 상한 — 0.12/0.10에서 text-muted 4.35로 탈락(실측, 유일한 1차 실패). 올리지 마라. */
  'bg-glow':
    'radial-gradient(1100px 600px at 18% -10%, rgba(85, 193, 126, 0.10), transparent 60%), radial-gradient(900px 520px at 82% -14%, rgba(143, 209, 79, 0.08), transparent 55%), #0f1712',
  'surface-glass': 'rgba(35, 50, 39, 0.85)',
  'surface-glass-fallback': '#233227',

  'chart-axis-line': '#33473a',
  'chart-split-line': '#223026',
  'chart-label': '#a9bbac',
  'chart-slice-border': '#18231b',

  ...chartSeriesTokens(FOREST_CHART_SERIES),

  'picker-filter': 'invert(0.86)'
};

/* -------------------------------------------------------------------------- */
/* grape — 퍼플/라일락 (포도알 모노크로매틱)                                       */
/* -------------------------------------------------------------------------- */

/**
 * 퍼플(brand) + 오키드(accent) + 인디고(accent-alt)의 인접색 조화.
 * 다크 brand #7a53da는 흰 라벨 5.15와 surface 3.19를 동시에 만족하는 지점 —
 * #8a68e8은 라벨 4.01로 탈락(실측). knife-edge라 더 어둡게 조정 금지.
 */
const GRAPE_LIGHT: ThemeTokens = {
  bg: '#f3effa',
  surface: '#ffffff',
  'surface-raised': '#ffffff',
  'surface-muted': '#faf8fd',
  'surface-sunken': '#eae3f5',
  'surface-hover': '#f3effa',

  border: '#e0d7ef',
  'border-strong': '#7f7694',

  text: '#221c33',
  'text-secondary': '#4f4768',
  'text-muted': '#635b7a',
  'text-inverse': '#ffffff',

  brand: '#7048c8',
  'brand-hover': '#5c39ab',
  'brand-subtle': '#f1ecfc',
  'brand-subtle-hover': '#e5dcf8',
  'brand-border': '#cbb8ef',
  'brand-text': '#5c39ab',
  'on-brand': '#ffffff',

  /* 오키드 */
  accent: '#a136b8',
  'accent-text': '#872d99',
  'accent-subtle': '#f9ecfb',
  'accent-border': '#e3b8ea',
  /* 인디고 */
  'accent-alt': '#1ca063',
  'accent-alt-text': '#0c7633',
  'accent-alt-subtle': '#e6f5ee',
  'accent-alt-border': '#a4d9c1',

  ...COMMON_LIGHT,

  overlay: 'rgba(28, 19, 41, 0.5)',
  'focus-ring': '#7048c8',
  'focus-shadow': 'rgba(112, 72, 200, 0.25)',

  /* 퍼플 틴트 섀도 */
  'shadow-1': '0 1px 2px rgba(34, 24, 58, 0.06), 0 1px 3px rgba(34, 24, 58, 0.08)',
  'shadow-2': '0 2px 4px rgba(34, 24, 58, 0.06), 0 4px 12px rgba(34, 24, 58, 0.10)',
  'shadow-3': '0 2px 6px rgba(34, 24, 58, 0.08), 0 12px 32px rgba(34, 24, 58, 0.18)',

  'ribbon-stop-1': '#7048c8',
  'ribbon-stop-2': '#a136b8',
  'ribbon-stop-3': '#4956d4',
  'cta-stop-1': '#7048c8',
  'cta-stop-2': '#653fbb',
  'cta-stop-3': '#5c39ab',
  'progress-track': '#eae3f5',

  'gradient-aurora': buildAuroraGradient(['#7048c8', '#a136b8', '#4956d4']),
  'gradient-cta': buildDuotoneGradient('#7048c8', '#5c39ab'),
  /* 히어로 면 — 최악 text-muted 5.27:1 / soft 5.75:1(실측). */
  'gradient-hero': buildHeroGradient('#deecf6', '#e6f5ef'),
  'gradient-hero-soft': buildHeroGradient('#edf5fa', '#f1f9f6'),
  'bg-glow':
    'radial-gradient(1200px 640px at 16% -10%, rgba(112, 72, 200, 0.05), transparent 60%), radial-gradient(1000px 560px at 84% -12%, rgba(161, 54, 184, 0.05), transparent 55%), #f3effa',
  'surface-glass': 'rgba(255, 255, 255, 0.8)',
  'surface-glass-fallback': '#ffffff',

  'chart-axis-line': '#ddd3ee',
  'chart-split-line': '#eae3f5',
  'chart-label': '#4f4768',
  'chart-slice-border': '#ffffff',

  ...chartSeriesTokens(GRAPE_CHART_SERIES),

  'picker-filter': 'none'
};

const GRAPE_DARK: ThemeTokens = {
  /* 딥 바이올렛 */
  bg: '#171126',
  surface: '#221a3a',
  'surface-raised': '#2f2551',
  'surface-muted': '#281f45',
  'surface-sunken': '#1c1530',
  'surface-hover': '#372c5e',

  border: '#3a2f60',
  'border-strong': '#7a6fa0',

  text: '#ece8f8',
  'text-secondary': '#b4abd1',
  'text-muted': '#9a90bc',
  'text-inverse': '#171126',

  brand: '#7a53da',
  'brand-hover': '#8f6cf0',
  'brand-subtle': '#2c2156',
  'brand-subtle-hover': '#352966',
  'brand-border': '#4d3f8a',
  'brand-text': '#bba8f5',
  'on-brand': '#ffffff',

  accent: '#d478e8',
  'accent-text': '#d478e8',
  'accent-subtle': '#3a1f42',
  'accent-border': '#713d80',
  'accent-alt': '#6fe4a6',
  'accent-alt-text': '#6fe4a6',
  'accent-alt-subtle': '#162225',
  'accent-alt-border': '#2a5345',

  ...COMMON_DARK,

  overlay: 'rgba(10, 6, 20, 0.7)',
  'focus-ring': '#bba8f5',
  'focus-shadow': 'rgba(187, 168, 245, 0.3)',

  /* aurora 다크 값 재사용 */
  'shadow-1': '0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.24)',
  'shadow-2': '0 2px 4px rgba(0, 0, 0, 0.32), 0 4px 12px rgba(0, 0, 0, 0.36)',
  'shadow-3': '0 2px 6px rgba(0, 0, 0, 0.36), 0 12px 32px rgba(0, 0, 0, 0.48)',

  'ribbon-stop-1': '#a184f2',
  'ribbon-stop-2': '#d478e8',
  'ribbon-stop-3': '#8f9bff',
  'cta-stop-1': '#7a53da',
  'cta-stop-2': '#714cd0',
  'cta-stop-3': '#6845c6',
  'progress-track': '#1c1530',

  'gradient-aurora': buildAuroraGradient(['#a184f2', '#d478e8', '#8f9bff']),
  'gradient-cta': buildDuotoneGradient('#7a53da', '#6845c6'),
  /* 히어로 면 — 다크 최악 text-muted 5.00:1 / soft 5.58:1(실측). velog 다크 다음으로 얇다. */
  'gradient-hero': buildHeroGradient('#1d2541', '#1b2934'),
  'gradient-hero-soft': buildHeroGradient('#1a1c35', '#191e2e'),
  /* 다크 글로우 알파 0.10/0.08 상한(사전 계산으로 0.12에서 감쇄) */
  'bg-glow':
    'radial-gradient(1100px 600px at 18% -10%, rgba(161, 132, 242, 0.10), transparent 60%), radial-gradient(900px 520px at 82% -14%, rgba(212, 120, 232, 0.08), transparent 55%), #171126',
  'surface-glass': 'rgba(47, 37, 81, 0.85)',
  'surface-glass-fallback': '#2f2551',

  'chart-axis-line': '#423767',
  'chart-split-line': '#2b2150',
  'chart-label': '#b4abd1',
  'chart-slice-border': '#221a3a',

  ...chartSeriesTokens(GRAPE_CHART_SERIES),

  'picker-filter': 'invert(0.86)'
};

/* -------------------------------------------------------------------------- */
/* sunset — 웜 코랄/앰버 (노을)                                                  */
/* -------------------------------------------------------------------------- */

/**
 * 코랄은 상승 적색(#d92d20)과 인접한 난색 — brand를 주황 쪽(#bc4c0f)으로 밀어 hue를 분리했고,
 * 숫자에는 data-positive/negative 토큰만 쓰는 기존 규율이 방어한다. **CTA는 코랄 duotone** —
 * 로즈마젠타를 넣으면 danger 버튼과 혼동될 리본이 된다. 다크는 밝은 코랄이 흰 라벨을 못 이기므로
 * (#e05c2a도 3.66) velog 다크와 같은 어두운 라벨 반전(on-brand #1e1410, 7.77:1).
 */
const SUNSET_LIGHT: ThemeTokens = {
  /* 웜 크림 */
  bg: '#fbf1e8',
  surface: '#ffffff',
  'surface-raised': '#ffffff',
  'surface-muted': '#fdf8f3',
  'surface-sunken': '#f6e9dd',
  'surface-hover': '#fbf1e8',

  border: '#f0dcc9',
  'border-strong': '#8a7a68',

  text: '#2b2118',
  'text-secondary': '#5c4c3d',
  'text-muted': '#6d5c4a',
  'text-inverse': '#ffffff',

  brand: '#bc4c0f',
  'brand-hover': '#9c3f0c',
  'brand-subtle': '#fdf0e3',
  'brand-subtle-hover': '#fbe3cd',
  'brand-border': '#f3c9a4',
  'brand-text': '#a03f0c',
  'on-brand': '#ffffff',

  /* 앰버 */
  accent: '#b06a05',
  'accent-text': '#96610a',
  'accent-subtle': '#fdeed6',
  'accent-border': '#edcb92',
  /* 로즈마젠타 — B채널로 상승 적색과 분리 */
  /* 웜 크림 위에서 튀지 않게 축의 채도를 8종 중 가장 낮게(0.48) 잡았다 */
  'accent-alt': '#389f6b',
  'accent-alt-text': '#1e7640',
  'accent-alt-subtle': '#e9f4ef',
  'accent-alt-border': '#afd9c4',

  ...COMMON_LIGHT,

  overlay: 'rgba(30, 20, 16, 0.5)',
  'focus-ring': '#bc4c0f',
  'focus-shadow': 'rgba(188, 76, 15, 0.25)',

  /* 웜 섀도 */
  'shadow-1': '0 1px 2px rgba(58, 38, 20, 0.06), 0 1px 3px rgba(58, 38, 20, 0.08)',
  'shadow-2': '0 2px 4px rgba(58, 38, 20, 0.06), 0 4px 12px rgba(58, 38, 20, 0.10)',
  'shadow-3': '0 2px 6px rgba(58, 38, 20, 0.08), 0 12px 32px rgba(58, 38, 20, 0.18)',

  'ribbon-stop-1': '#bc4c0f',
  'ribbon-stop-2': '#b06a05',
  'ribbon-stop-3': '#b83280',
  'cta-stop-1': '#bc4c0f',
  'cta-stop-2': '#ae470f',
  'cta-stop-3': '#a04a10',
  /* sunken이 아니라 muted — sunken(#f6e9dd) 위에서는 리본 stop 3:1이 무너져 승격(실측) */
  'progress-track': '#fdf8f3',

  'gradient-aurora': buildAuroraGradient(['#bc4c0f', '#b06a05', '#b83280']),
  'gradient-cta': buildDuotoneGradient('#bc4c0f', '#a04a10'),
  /*
   * 히어로 면 — 8종 중 쿨 캐스트가 가장 약하다(0.10/0.08). 웜 크림이 정체성이라
   * 여기서 캐스트를 올리면 프리셋이 다른 프리셋처럼 보인다. 최악 text-muted 5.68:1.
   */
  'gradient-hero': buildHeroGradient('#e9f3f9', '#eef8f5'),
  'gradient-hero-soft': buildHeroGradient('#f3f8fc', '#f6fbf9'),
  'bg-glow':
    'radial-gradient(1200px 640px at 16% -10%, rgba(188, 76, 15, 0.05), transparent 60%), radial-gradient(1000px 560px at 84% -12%, rgba(201, 123, 6, 0.05), transparent 55%), #fbf1e8',
  'surface-glass': 'rgba(255, 255, 255, 0.8)',
  'surface-glass-fallback': '#ffffff',

  'chart-axis-line': '#ecdcc8',
  'chart-split-line': '#f6e9dd',
  'chart-label': '#5c4c3d',
  'chart-slice-border': '#ffffff',

  ...chartSeriesTokens(SUNSET_CHART_SERIES),

  'picker-filter': 'none'
};

const SUNSET_DARK: ThemeTokens = {
  /* 딥 웜 브라운 */
  bg: '#1e1410',
  surface: '#2a1f19',
  'surface-raised': '#372b23',
  'surface-muted': '#30251e',
  'surface-sunken': '#241a15',
  'surface-hover': '#3f322a',

  border: '#45362c',
  'border-strong': '#8a7a6c',

  text: '#f2ebe4',
  'text-secondary': '#cbbcae',
  'text-muted': '#a8988a',
  'text-inverse': '#1e1410',

  brand: '#ff8a5c',
  'brand-hover': '#ffa075',
  'brand-subtle': '#40251c',
  'brand-subtle-hover': '#4b2d22',
  'brand-border': '#7a4630',
  'brand-text': '#ffb08e',
  /** 어두운 라벨 반전 — 밝은 코랄(#ff8a5c) 위 #1e1410 = 7.77:1 (velog 다크와 같은 패턴) */
  'on-brand': '#1e1410',

  accent: '#f5b942',
  'accent-text': '#f5b942',
  'accent-subtle': '#3b2c12',
  'accent-border': '#7d5f24',
  'accent-alt': '#7bd9a2',
  'accent-alt-text': '#7bd9a2',
  'accent-alt-subtle': '#182419',
  'accent-alt-border': '#2d5439',

  ...COMMON_DARK,

  overlay: 'rgba(12, 6, 4, 0.7)',
  'focus-ring': '#ffb08e',
  'focus-shadow': 'rgba(255, 176, 142, 0.3)',

  /* aurora 다크 값 재사용 */
  'shadow-1': '0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.24)',
  'shadow-2': '0 2px 4px rgba(0, 0, 0, 0.32), 0 4px 12px rgba(0, 0, 0, 0.36)',
  'shadow-3': '0 2px 6px rgba(0, 0, 0, 0.36), 0 12px 32px rgba(0, 0, 0, 0.48)',

  'ribbon-stop-1': '#ff8a5c',
  'ribbon-stop-2': '#f5b942',
  'ribbon-stop-3': '#ee85a8',
  'cta-stop-1': '#ff8a5c',
  'cta-stop-2': '#f6a04b',
  'cta-stop-3': '#f5b942',
  'progress-track': '#241a15',

  'gradient-aurora': buildAuroraGradient(['#ff8a5c', '#f5b942', '#ee85a8']),
  /* 어두운 라벨(on-brand #1e1410) 전제의 밝은 CTA duotone */
  'gradient-cta': buildDuotoneGradient('#ff8a5c', '#f5b942'),
  /* 히어로 면 — 웜 다크 위 최소 캐스트. 최악 text-muted 5.42:1 / soft 5.91:1(실측). */
  'gradient-hero': buildHeroGradient('#222429', '#21281e'),
  'gradient-hero-soft': buildHeroGradient('#201d1e', '#201f18'),
  /* 다크 글로우 알파 0.10/0.08 상한(사전 계산으로 0.12에서 감쇄). 글로우 최악 위 text-muted 4.63. */
  'bg-glow':
    'radial-gradient(1100px 600px at 18% -10%, rgba(255, 138, 92, 0.10), transparent 60%), radial-gradient(900px 520px at 82% -14%, rgba(245, 185, 66, 0.08), transparent 55%), #1e1410',
  'surface-glass': 'rgba(55, 43, 35, 0.85)',
  'surface-glass-fallback': '#372b23',

  'chart-axis-line': '#4a3a2e',
  'chart-split-line': '#362a21',
  'chart-label': '#cbbcae',
  'chart-slice-border': '#2a1f19',

  ...chartSeriesTokens(SUNSET_CHART_SERIES),

  'picker-filter': 'invert(0.86)'
};

/* -------------------------------------------------------------------------- */
/* ink — 고대비 모노크롬 (잉크)                                                  */
/* -------------------------------------------------------------------------- */

/**
 * 8종 중 유일한 무채 — 고대비·저자극 선호와 인쇄물 감성을 커버하고, 스위처에서 "색 자체를 거의 끄는"
 * 선택지를 제공한다. **크롬은 무채**(그라데이션 = 잉크 번짐 그레이 duotone, 히어로 면도 캐스트 0,
 * 글로우 없음, 유리 거의 불투명), **차트만 유채색**(aurora 8색 재사용 — 데이터 구분은 ΔE가 필수라
 * 모노 8색은 물리적으로 불가; "흑백 신문 위 컬러 인포그래픽" 정합). 다크는 velog식 반전:
 * brand #f2f2f2 + on-brand #111111(15.9:1).
 *
 * ⚠ 유일한 유채 크롬 = `accent-alt`(그린, 2026-07-28 아이덴티티 패스). 세컨더리 액센트는
 * 제품 아이덴티티 축이라 8프리셋 공통으로 그린을 채택했다 — "완전 무채"가 아니라
 * "**그린 배지 하나를 제외하면** 무채"가 지금의 정확한 서술이다.
 */
const INK_LIGHT: ThemeTokens = {
  /* 무틴트 — 정체성 */
  bg: '#f1f1f1',
  surface: '#ffffff',
  'surface-raised': '#ffffff',
  'surface-muted': '#f7f7f7',
  'surface-sunken': '#e8e8e8',
  'surface-hover': '#f1f1f1',

  border: '#dcdcdc',
  'border-strong': '#767676',

  text: '#111111',
  'text-secondary': '#3d3d3d',
  'text-muted': '#595959',
  'text-inverse': '#ffffff',

  brand: '#1a1a1a',
  'brand-hover': '#000000',
  'brand-subtle': '#e8e8e8',
  'brand-subtle-hover': '#dedede',
  'brand-border': '#bdbdbd',
  'brand-text': '#1a1a1a',
  'on-brand': '#ffffff',

  accent: '#444444',
  'accent-text': '#333333',
  'accent-subtle': '#ededed',
  'accent-border': '#cfcfcf',
  'accent-alt': '#359f6d',
  'accent-alt-text': '#1c763d',
  'accent-alt-subtle': '#e9f4ef',
  'accent-alt-border': '#aed9c5',

  ...COMMON_LIGHT,

  overlay: 'rgba(17, 17, 17, 0.5)',
  'focus-ring': '#1a1a1a',
  'focus-shadow': 'rgba(17, 17, 17, 0.22)',

  /* 무채 섀도 — velog 라이트 3종 재사용 */
  'shadow-1': '0 1px 3px rgba(0, 0, 0, 0.05)',
  'shadow-2': '0 2px 8px rgba(0, 0, 0, 0.06)',
  'shadow-3': '0 8px 24px rgba(0, 0, 0, 0.12)',

  'ribbon-stop-1': '#1a1a1a',
  'ribbon-stop-2': '#444444',
  'ribbon-stop-3': '#6b6b6b',
  'cta-stop-1': '#1a1a1a',
  'cta-stop-2': '#141414',
  'cta-stop-3': '#0d0d0d',
  'progress-track': '#e8e8e8',

  /* 잉크 번짐 */
  'gradient-aurora': buildAuroraGradient(['#1a1a1a', '#444444', '#6b6b6b']),
  'gradient-cta': buildDuotoneGradient('#1a1a1a', '#0d0d0d'),
  /*
   * 히어로 면 — **캐스트 0(무채)**. 다른 7프리셋과 달리 쿨 파스텔을 섞지 않는다:
   * 무채는 "웜톤 금지" 제약을 위반하지 않으면서 ink 정체성을 지키는 유일한 해다.
   * 대가로 bg 와의 ΔE 가 2.8 밖에 안 되니 **밴드를 fill 단독으로 세우지 말고**
   * 1px `color.border` + radius 로 경계를 함께 그려라. 최악 text-muted 5.76:1.
   */
  'gradient-hero': buildHeroGradient('#e9e9e9', '#f4f4f4'),
  'gradient-hero-soft': buildHeroGradient('#f7f7f7', '#fcfcfc'),
  /* 글로우 없음 = 단색 */
  'bg-glow': '#f1f1f1',
  'surface-glass': 'rgba(255, 255, 255, 0.92)',
  'surface-glass-fallback': '#ffffff',

  'chart-axis-line': '#d9d9d9',
  'chart-split-line': '#e8e8e8',
  'chart-label': '#3d3d3d',
  'chart-slice-border': '#ffffff',

  /* 차트만 유채 — aurora 세트 재사용 */
  ...chartSeriesTokens(AURORA_CHART_SERIES),

  'picker-filter': 'none'
};

const INK_DARK: ThemeTokens = {
  bg: '#0d0d0d',
  surface: '#1a1a1a',
  'surface-raised': '#262626',
  'surface-muted': '#202020',
  'surface-sunken': '#131313',
  'surface-hover': '#2e2e2e',

  border: '#333333',
  'border-strong': '#7d7d7d',

  text: '#f2f2f2',
  'text-secondary': '#b5b5b5',
  'text-muted': '#8f8f8f',
  'text-inverse': '#0d0d0d',

  brand: '#f2f2f2',
  'brand-hover': '#ffffff',
  'brand-subtle': '#2b2b2b',
  'brand-subtle-hover': '#333333',
  'brand-border': '#555555',
  'brand-text': '#f2f2f2',
  /** 반전 라벨 — 밝은 brand(#f2f2f2) 위 #111111 = 15.9:1 */
  'on-brand': '#111111',

  accent: '#d4d4d4',
  'accent-text': '#d4d4d4',
  'accent-subtle': '#262626',
  'accent-border': '#4d4d4d',
  'accent-alt': '#7fd4a7',
  'accent-alt-text': '#7fd4a7',
  'accent-alt-subtle': '#13221a',
  'accent-alt-border': '#28533c',

  ...COMMON_DARK,

  overlay: 'rgba(0, 0, 0, 0.65)',
  'focus-ring': '#f2f2f2',
  'focus-shadow': 'rgba(242, 242, 242, 0.3)',

  /* velog 다크 3종 재사용 */
  'shadow-1': '0 1px 2px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3)',
  'shadow-2': '0 2px 4px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.4)',
  'shadow-3': '0 2px 6px rgba(0, 0, 0, 0.44), 0 12px 32px rgba(0, 0, 0, 0.52)',

  'ribbon-stop-1': '#f2f2f2',
  'ribbon-stop-2': '#d4d4d4',
  'ribbon-stop-3': '#a3a3a3',
  'cta-stop-1': '#f2f2f2',
  'cta-stop-2': '#e8e8e8',
  'cta-stop-3': '#dedede',
  'progress-track': '#131313',

  'gradient-aurora': buildAuroraGradient(['#f2f2f2', '#d4d4d4', '#a3a3a3']),
  'gradient-cta': buildDuotoneGradient('#f2f2f2', '#dedede'),
  /* 히어로 면 — 라이트와 같이 캐스트 0. bg 와 ΔE 3.6 이라 경계선 필수. 최악 text-muted 5.59:1. */
  'gradient-hero': buildHeroGradient('#161616', '#101010'),
  'gradient-hero-soft': buildHeroGradient('#141414', '#191919'),
  'bg-glow': '#0d0d0d',
  'surface-glass': 'rgba(38, 38, 38, 0.92)',
  'surface-glass-fallback': '#262626',

  'chart-axis-line': '#3a3a3a',
  'chart-split-line': '#2a2a2a',
  'chart-label': '#b5b5b5',
  'chart-slice-border': '#1a1a1a',

  ...chartSeriesTokens(AURORA_CHART_SERIES),

  'picker-filter': 'invert(0.86)'
};

/* -------------------------------------------------------------------------- */
/* 레지스트리                                                                    */
/* -------------------------------------------------------------------------- */

/* 키 순서 = PALETTE_PRESET_IDS(스위처 노출 순서)와 동일하게 유지한다. */
export const THEME_PRESETS: Record<PalettePresetId, ThemePreset> = {
  velog: {
    /** id는 내부 식별자(velog 유지) — 표시명은 타사 서비스명을 피해 "미니멀 그린". */
    label: '미니멀 그린',
    swatch: ['#f8f9fa', '#12b886', '#212529'],
    light: VELOG_LIGHT,
    dark: VELOG_DARK
  },
  forest: {
    label: '포레스트',
    swatch: ['#eef3ec', '#2f7d4f', '#c9a978'],
    light: FOREST_LIGHT,
    dark: FOREST_DARK
  },
  aurora: {
    label: '오로라',
    swatch: ['#e4f0fc', '#0c7cb3', '#818cf8'],
    light: AURORA_LIGHT,
    dark: AURORA_DARK
  },
  vivid: {
    label: '비비드',
    swatch: ['#eef0ff', '#2d5bf5', '#00c9a7'],
    light: VIVID_LIGHT,
    dark: VIVID_DARK
  },
  'navy-gold': {
    label: '네이비 골드',
    swatch: ['#f5efdd', '#1f3a68', '#d8b04a'],
    light: NAVY_GOLD_LIGHT,
    dark: NAVY_GOLD_DARK
  },
  grape: {
    label: '그레이프',
    swatch: ['#f3effa', '#7048c8', '#d478e8'],
    light: GRAPE_LIGHT,
    dark: GRAPE_DARK
  },
  sunset: {
    label: '선셋',
    swatch: ['#fbf1e8', '#bc4c0f', '#f5b942'],
    light: SUNSET_LIGHT,
    dark: SUNSET_DARK
  },
  ink: {
    label: '잉크',
    swatch: ['#f1f1f1', '#1a1a1a', '#767676'],
    light: INK_LIGHT,
    dark: INK_DARK
  }
};

/** 기본 프리셋(velog)의 테마 맵 — globalStyles의 무스코프 `:root` 블록과 jsdom/SSR 폴백이 쓴다. */
export const DEFAULT_THEME_PRESET: ThemePreset = THEME_PRESETS[DEFAULT_PALETTE_PRESET_ID];

/** 레지스트리 순회용 id 목록 (constants/palette와 동일 소스). */
export { PALETTE_PRESET_IDS };
export type { PalettePresetId };
