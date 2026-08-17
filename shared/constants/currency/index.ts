/**
 * 결과 **표시 통화** — 원화로 계산한 결과를 화면에서만 달러로 바꿔 보는 모드.
 *
 * ⚠ 계산과 무관하다: 입력 필드와 시뮬레이션 엔진은 항상 원화 기준이고, 이 값은 포맷터가
 *   마지막에 환율로 나누기만 한다(엔진에 아무것도 넘기지 않는다).
 * ⚠ 저장 payload·공유 URL 스키마에 절대 넣지 않는다 — 기기별 표시 취향이라
 *   팔레트(`hungryhippo:palette`)와 같은 성격의 로컬 개인 설정이다.
 */

/** 순서 = 토글 노출 순서. 기본(원화) 첫 항목. */
export const DISPLAY_CURRENCIES = ['KRW', 'USD'] as const;

export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];

/** 저장값이 없거나 잘못됐을 때의 기본 표시 통화. */
export const DEFAULT_DISPLAY_CURRENCY: DisplayCurrency = 'KRW';

export const isDisplayCurrency = (value: unknown): value is DisplayCurrency =>
  typeof value === 'string' && (DISPLAY_CURRENCIES as readonly string[]).includes(value);

/** 구버전·오타 저장값을 원화로 폴백시킨다 (하위 호환 — 절대 throw 하지 않는다). */
export const normalizeDisplayCurrency = (value: unknown): DisplayCurrency =>
  isDisplayCurrency(value) ? value : DEFAULT_DISPLAY_CURRENCY;

/**
 * 표시 통화 토글 주변 카피 정본.
 *
 * 축약형을 따로 두지 않는다 — 좁은 화면에서는 줄바꿈으로 흡수한다(카피 이중화 방지).
 * `{rate}`/`{asOf}` 는 환율 위젯과 **같은 표기**(원 단위 콤마 정수 / `YYYY-MM-DD`)로 치환한다.
 */
export const DISPLAY_CURRENCY_COPY = {
  /**
   * 토글의 시각 라벨.
   *
   * "표시 통화"가 아니라 **"달러로 표시"** 인 이유: 이 스위치는 투자 설정 카드의 다른 토글들과
   * 똑같은 기본 스위치라(트랙에 원/달러 글자가 없다) 라벨이 명사면 켜짐이 원인지 달러인지 알 수 없다.
   * 형제 토글("빠른 추정 보기"·"그래프 나누어 보기")과 같은 어법 — **켜면 그렇게 된다**.
   */
  label: '달러로 표시',
  /** 스위치의 접근명. 낭독 시 어느 결과를 말하는지까지 분명해지도록 라벨보다 한 겹 더 구체적이다. */
  toggleAccessibleName: '결과를 달러로 표시',
  /** {rate}=1,478 {asOf}=2026-07-23 */
  basisUsd: '달러 표시 · 1달러 = {rate}원 ({asOf} 기준)',
  basisUsdStale: '달러 표시 · 1달러 = {rate}원 ({asOf} 기준 · 최신 환율 업데이트 실패)',
  reasonLoading: '환율을 불러오는 중입니다 · 잠시 후 달러로 바꿀 수 있습니다',
  reasonUnavailable: '환율을 불러오지 못해 지금은 달러로 표시할 수 없습니다',
  reasonFallback: '환율을 불러오지 못해 원화로 표시하고 있습니다',
  /** 차트 `aria-label` 접미 — 시각적으로 안 보이는 통화 전환을 스크린리더에도 알린다. */
  chartSuffixUsd: ' (달러 표시)'
} as const;
