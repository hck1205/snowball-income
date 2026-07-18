/**
 * 프리미티브 토큰 — 디자인 시스템의 1계층.
 *
 * 여기에는 "의미"가 없다. 순수한 색 램프와 스케일만 있다.
 * 화면에서 이 값을 직접 쓰면 안 된다. 반드시 `semantic.ts`를 거쳐서 쓴다.
 * (예: `palette.brand[600]`이 아니라 `color.brandSolid`)
 *
 * 램프는 50(가장 밝음) → 900(가장 어두움) 순서다.
 */

/* -------------------------------------------------------------------------- */
/* 색 램프                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * 브랜드 — "글레이셔 애저(glacier azure)".
 *
 * 스노우볼(눈덩이) 메타포 + 금융 신뢰감을 동시에 만족시키는 지점으로 hue ~200을 골랐다.
 * - 순수 네이비(#1d4ed8 류)는 은행·보험 UI에서 너무 흔하고 차갑기만 하다.
 * - 청록으로 더 가면(teal) 핀테크보다 헬스케어처럼 읽힌다.
 * hue 200은 얼음/눈의 차가움을 가지면서도 파랑의 신뢰감을 잃지 않는다.
 *
 * "빙하 위의 오로라" 리스타일에서 채도를 한 단계 증폭했다(HSL 채도 ~68% → ~87%).
 * 구 brand[500](#1f7ba5) 대비 ΔE 7.8 — 정체성은 이어지고 선명해진다.
 */
const brand = {
  50: '#eaf6fd',
  100: '#d3ecf9',
  200: '#aadcf2',
  /** 다크 포커스 링 / 다크 brand-text — 다크 서피스 대비 8.60:1 */
  300: '#79c5e6',
  /** 다크 brand-hover, 다크 리본 stop-1 — 다크 서피스 대비 5.90:1 */
  400: '#3ba5d3',
  /**
   * 다크 brand solid + 라이트 포커스 링 + 차트 시리즈 0.
   * 흰 라벨 4.61:1, 라이트 surface 4.61:1, 다크 surface 3.57:1.
   */
  500: '#0c7cb3',
  /** 라이트 brand solid, 리본/CTA stop-1. 흰 라벨 대비 5.63:1 */
  600: '#0a6da3',
  /** 라이트 brand-text·brand-hover. 흰 배경 7.42:1, brand-subtle 위 6.75:1 */
  700: '#085a88',
  800: '#0a4a6e',
  900: '#0d3d5a'
} as const;

/**
 * 오로라 teal — 성장·복리·상승 "흐름"의 크롬 색. hue ~172. (신규)
 *
 * 데이터 상승색이 **아니다** — 상승/하락 숫자는 계속 up/down 램프(한국 관례 적색/청색).
 * 이 램프는 오로라 리본·액센트 배지 같은 크롬(장식)에만 쓴다. 숫자 데이터에 금지.
 */
const auroraTeal = {
  /** 라이트 accent-subtle — text 위 14.74:1, accent-text 위 5.72:1 */
  50: '#e0f7f1',
  /** 라이트 accent-border(장식) */
  200: '#93ddcd',
  /** 다크 accent(표시)·accent-text·다크 리본 stop-2 — 다크 surface 8.87:1 */
  400: '#2dd4bf',
  /** 라이트 accent(표시)·라이트 리본 stop-2 — 라이트 surface 3.74:1(비텍스트) */
  600: '#0d9488',
  /** CTA 그라데이션 중간 stop(양 테마 공용) — 흰 라벨 4.83:1. 1도 못 움직인다. */
  650: '#0e8070',
  /** 라이트 accent-text — 흰 배경 6.41:1 */
  700: '#0b6b5d',
  /** 다크 accent-border(장식) */
  800: '#1f5a52',
  /** 다크 accent-subtle — text 위 12.89:1 */
  900: '#0e2b2a'
} as const;

/**
 * 오로라 violet — 목표·하이라이트의 크롬 색. hue ~243. (신규)
 *
 * 차트 시리즈 4의 보라(#8b6fc9)와는 별개 — 시리즈 팔레트는 불변이다.
 * auroraTeal과 마찬가지로 크롬 전용, 숫자 데이터에 금지.
 */
const auroraViolet = {
  /** 라이트 accent-alt-subtle — text 위 14.47:1 */
  50: '#eeeffd',
  /** 라이트 accent-alt-border(장식) */
  200: '#c8cdf8',
  /** 다크 accent-alt-text — 다크 surface 8.05:1 */
  300: '#a7b0fb',
  /** 다크 accent-alt(표시)·다크 리본 stop-3 — 다크 surface 5.53:1 */
  400: '#818cf8',
  /** 라이트 accent-alt(표시)·라이트 리본 stop-3 — 라이트 surface 4.93:1 */
  500: '#6d5ae6',
  /** 다크 CTA stop-3 — 흰 라벨 5.18:1 */
  550: '#6259e2',
  /** 라이트 CTA stop-3 — 흰 라벨 5.69:1 */
  600: '#5a51e0',
  /** 라이트 accent-alt-text — 흰 배경 6.75:1 */
  700: '#4f46cf',
  /** 다크 accent-alt-border(장식) */
  800: '#454e8f',
  /** 다크 accent-alt-subtle — text 위 11.93:1 */
  900: '#232a4d'
} as const;

/**
 * 중립 — ice-white / polar-night. 파랑 틴트를 증폭한 쿨 슬레이트.
 * 완전 무채색 회색은 브랜드 블루 옆에서 누렇게(따뜻하게) 보인다.
 * 950이 #0a1220으로 깊어지면서 850/900과 다크 서피스 사다리를 전부 재계산했다.
 */
const neutral = {
  0: '#ffffff',
  25: '#f9fbfd',
  /** ice-white — 라이트 bg·surface-hover */
  50: '#edf4fa',
  100: '#e6eef7',
  /** 라이트 border(장식) — surface 대비 1.26:1 (>1.05) */
  150: '#dbe6f0',
  200: '#cfdcea',
  300: '#b7c7d9',
  400: '#91a2b6',
  /**
   * 컨트롤 경계선(input/select/버튼). 흰 배경 3.76:1, ice-white 3.39:1 로
   * WCAG 1.4.11(비텍스트 3:1)을 만족한다. 구 값(#828f9c)은 새 ice-white 위에서
   * 2.97:1로 탈락해 어둡게 조정했다.
   */
  450: '#75859a',
  /**
   * 보조 텍스트(캡션/힌트). 흰 5.92:1, sunken 5.06:1,
   * 배경 오로라 글로우 최악 지점(#dae7f2) 위 4.70:1 — 작은 글씨라 4.5:1을 넘겨야 한다.
   */
  500: '#536679',
  /** 2차 텍스트(라벨). 흰 배경 7.63:1 */
  600: '#43556b',
  700: '#38495e',
  800: '#253243',
  /** 다크 surface-raised */
  850: '#1b2a44',
  /** 다크 surface = 라이트 text (이중 용도 유지) */
  900: '#131f33',
  /** polar-night — 다크 bg */
  950: '#0a1220'
} as const;

/**
 * 데이터 상승/하락 — 한국 증권 관례(상승=적색, 하락=청색)를 따른다.
 *
 * 서구권 관례(상승=녹색)와 반대라 의도적인 결정임을 밝혀둔다.
 * 이 앱의 사용자는 한국 배당 투자자이고, 국내 증권사 앱(토스·미래에셋 등)이 모두 적색 상승이다.
 * 숫자 옆의 색은 학습된 반사신경이라 여기서 뒤집으면 오독을 유발한다.
 *
 * 중요: 이 램프는 **숫자(데이터)에만** 쓴다. 버튼·에러 같은 크롬에는 절대 쓰지 않는다.
 * 그래서 `danger`(파괴적 액션/에러)와 적색이 겹쳐도 맥락이 충돌하지 않는다.
 */
const up = {
  soft: '#fdeceb',
  softDark: '#33191a',
  light: '#d92d20',
  dark: '#f4776a'
} as const;

const down = {
  soft: '#e9f1fd',
  softDark: '#15243a',
  light: '#1668c9',
  dark: '#71aaf0'
} as const;

const positive = {
  soft: '#e7f6ef',
  softDark: '#10291f',
  light: '#0f7a52',
  dark: '#42bd8b'
} as const;

const warning = {
  soft: '#fdf3e7',
  softDark: '#2e2113',
  light: '#a4590a',
  dark: '#e2a458'
} as const;

const danger = {
  soft: '#fdeeec',
  softBorder: '#f3c3bd',
  softDark: '#2a1917',
  softDarkBorder: '#5b302b',
  light: '#b42318',
  dark: '#f0776a'
} as const;

export const palette = { brand, auroraTeal, auroraViolet, neutral, up, down, positive, warning, danger } as const;

/* -------------------------------------------------------------------------- */
/* 스케일                                                                       */
/* -------------------------------------------------------------------------- */

/** 4px 베이스라인 그리드. */
export const SPACE_SCALE = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px'
} as const;

export const RADIUS_SCALE = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  pill: '999px'
} as const;

/**
 * 타이포 스케일. 금융 대시보드는 정보 밀도가 높아서 본문을 키우면 화면이 금방 터진다.
 * 본문(base=14)은 유지하고, 대신 **지표 값 쪽에 큰 단계(4xl/5xl)를 새로 열어** 위계를 만든다.
 * 기존 화면이 쓰던 2xs~3xl 단계는 값 그대로 보존한다(리스타일 중 레이아웃 흔들림 방지).
 */
export const FONT_SIZE_SCALE = {
  '2xs': '11px',
  xs: '12px',
  sm: '13px',
  base: '14px',
  md: '15px',
  lg: '16px',
  xl: '18px',
  '2xl': '20px',
  '3xl': '24px',
  '4xl': '30px',
  '5xl': '38px',
  /** hero 지표 값 상한 (clamp 상한으로 쓴다) */
  '6xl': '44px'
} as const;

export const FONT_WEIGHT_SCALE = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  /** hero 지표 값 전용. Pretendard Variable이 800을 지원한다. */
  extrabold: 800
} as const;

export const LEADING_SCALE = {
  tight: 1.25,
  snug: 1.4,
  normal: 1.5,
  relaxed: 1.6
} as const;
