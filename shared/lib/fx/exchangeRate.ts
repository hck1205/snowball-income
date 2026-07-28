/**
 * `/api/fx` 조회 계약 — **표시 전용**.
 *
 * 위젯(`components/ExchangeRateWidget`)과 표시 통화 모드(`jotai/snowball/atoms/fx`)가 **하나의 값**을
 * 공유하려고 컴포넌트 밖으로 끌어올린 계약이다. 조회는 상태 계층의 드라이버 훅(`useFxRateSync`)이
 * 앱에서 딱 한 번 수행하고, 소비자는 atom을 구독만 한다(중복 fetch 없음).
 *
 * ⚠ 이 값은 **참고용**이라 시뮬레이션 입력·저장 payload·공유 URL 어디에도 들어가지 않는다.
 */

/** 서버 프록시 경로. 엣지 공유 캐시(6h/24h)라 클라이언트는 매 조회를 그냥 때려도 된다. */
export const FX_ENDPOINT = '/api/fx';

/** `/api/fx` 성공 응답 — `server/handlers/Fx/Fx.ts` 의 `FxSuccess` 와 형태가 같다. */
export type FxRate = {
  rate: number;
  base: 'USD';
  quote: 'KRW';
  /** API 가 준 실제 갱신 시각(ISO). 오늘 날짜로 위장하지 않는다. */
  asOf: string;
  /**
   * 전일 종가. **없을 수 있다** — ①전일 종가를 주지 않는 폴백 공급자가 이겼거나 ②엣지 캐시에 이 필드가 없던
   * 구버전 응답이 최대 24시간(`stale-while-revalidate`) 남아 있는 경우. 부재는 **정상**이고, 소비자는 전일 대비
   * 변동률만 생략한다(`computeFxChange` 가 `null` 을 돌려준다). `rate` 와 **같은 스냅샷**의 값이라야 하므로
   * 다른 출처의 전일값으로 채워 넣지 않는다.
   */
  previousClose?: number;
};

/**
 * 환율 조회의 화면 상태 4종.
 * - `loading`: 첫 조회 중 — 스켈레톤 + `aria-busy`.
 * - `success`: 최신 환율(신선).
 * - `stale`:   직전 성공값은 있으나 최근 갱신이 실패 — 값 + **실제** as-of + 옅은 '업데이트 실패' 표식.
 * - `error`:   보여줄 값이 없음 — 중립 안내(가짜 환율 금지).
 *
 * ⚠ `rate` 가 있는 상태(`success`/`stale`)에서만 달러 표시가 가능하다 — 표시 통화의 안전장치
 *   (`canUseUsdAtom`)가 이 판정을 단일 지점으로 쓴다.
 */
export type ExchangeRateView =
  | { status: 'loading' }
  | { status: 'success'; rate: FxRate }
  | { status: 'stale'; rate: FxRate }
  | { status: 'error' };

const isFinitePositive = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

/**
 * 신뢰할 수 없는 `/api/fx` 응답을 `FxRate` 로 정규화한다. 형태가 어긋나면 `null`(가짜 값을 지어내지 않는다).
 * `rate` 는 유한한 양수여야 하고 `asOf` 는 비어 있지 않은 문자열이어야 한다.
 *
 * ⚠ `previousClose` 는 **선택 필드**다 — 없어도 실패가 아니고(구버전 캐시 응답·전일값 없는 폴백 공급자),
 * 유한한 양수가 아니면 조용히 **키를 빼고** 나머지를 정상 파싱한다(환율 자체는 멀쩡하므로 버리지 않는다).
 */
export const parseFxRate = (data: unknown): FxRate | null => {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;

  const rate = record.rate;
  const asOf = record.asOf;
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) return null;
  if (typeof asOf !== 'string' || asOf.length === 0) return null;

  const parsed: FxRate = { rate, base: 'USD', quote: 'KRW', asOf };
  const previousClose = record.previousClose;

  return isFinitePositive(previousClose) ? { ...parsed, previousClose } : parsed;
};
