import { DIVIDEND_UNIVERSE } from '@/shared/constants/presets';
import { MAX_COMPARE_TICKERS, MIN_COMPARE_TICKERS, normalizeCompareSelection } from './tickerCompare';

/**
 * 유입 화면 → `/ticker/compare` 로 넘기는 **선택 규칙**(순수 함수만).
 *
 * ## 왜 이 파일이 `pages/Ticker/utils` 에 있나
 * 상한(`MAX_COMPARE_TICKERS`)·유니버스(`DIVIDEND_UNIVERSE`)·정규화(`normalizeCompareSelection`)가
 * 전부 `tickerCompare.ts` 에 이미 있다. 보내는 쪽에서 그 값을 다시 정의하면 **두 정본이 생기고**,
 * 상한이 4에서 바뀌는 날 한쪽만 고쳐져 "5개 골랐는데 4개만 열리는" 화면이 된다.
 * 다른 화면(의원거래 등)이 여기를 가져다 쓰는 것은 이미 있는 의존 방향이다 —
 * 그 화면들은 `@/pages/Ticker/components` 의 셸과 `@/pages/Ticker/hooks` 의 메타 훅을 쓰고 있다.
 *
 * ⚠ 이 파일은 **컴포넌트를 모른다.** UI(체크박스·하단 바)는 `components/common/TickerSelector` 이고,
 *   그쪽은 반대로 유니버스를 모른다(공용 배럴이 프리셋 218종을 물면 모든 화면이 함께 싣는다).
 */

export { MAX_COMPARE_TICKERS, MIN_COMPARE_TICKERS };

/**
 * 어느 화면에서 비교로 넘어왔는가. `?from=` 으로 실려 간다.
 *
 * 🔴 **측정이 목적이다.** 여섯 유입 화면 중 어디가 비교로 가장 많이 보내는지 모르면 다음에 어디를
 * 손볼지도 정할 수 없다. 값은 짧고 안정적인 슬러그로 고정한다 — 라우트 경로를 그대로 쓰면
 * 경로가 바뀌는 날 과거 데이터와 이어지지 않는다.
 */
export type CompareEntryPoint =
  | 'congress'
  | 'korea-assembly'
  | 'investors'
  | 'nps'
  | 'stats'
  | 'dividend-list'
  | 'ticker-hub';

/**
 * 비교 표가 이 티커를 열 수 있는가.
 *
 * 🔴 **이 검사 없이 체크박스를 달면 안 된다.** `normalizeCompareSelection` 은 유니버스에 없는 티커를
 * **조용히 버린다**(빈 열을 만들지 않으려는 의도적 설계). 그래서 의원거래에서 무배당 종목 넷을
 * 고르고 "비교하기"를 누르면 **빈 화면**이 열린다 — 사용자에게는 기능이 고장 난 것으로 보인다.
 *
 * 실측(2026-08-13): 의원거래 종목 표 상위 20종 중 18종은 유니버스에 있으나(90%),
 * 최근 거래 30건의 종목은 7종뿐이다(23%). 즉 **표마다 답이 다르다** — 화면 단위로 켜고 끌 것이
 * 아니라 행 단위로 판정해야 하는 이유다.
 */
export const isComparableTicker = (ticker: string): boolean =>
  ticker.trim().toUpperCase() in DIVIDEND_UNIVERSE;

/**
 * 고른 순서를 유지하며 티커를 더한다. **상한을 넘으면 가장 오래된 것을 버린다.**
 *
 * 🔴 상한에서 "더 못 고릅니다"로 막지 않는 이유: 넷을 채운 사용자가 다섯 번째를 누르는 것은
 * 대개 "이걸로 바꾸겠다"는 뜻이다. 거기서 막으면 먼저 하나를 지우고 다시 눌러야 한다(두 번 일한다).
 * 버리는 쪽을 **가장 오래된 것**으로 고정해야 어느 것이 사라질지 예측 가능하다.
 *
 * 이미 있는 티커를 다시 넣으면 **순서를 바꾸지 않는다** — 스크롤하다 같은 행을 두 번 누른 것만으로
 * 방금 고른 다른 종목이 밀려나면 안 된다.
 */
export const addTickerWithEviction = (selected: readonly string[], ticker: string): string[] => {
  const next = ticker.trim().toUpperCase();
  if (next.length === 0) return [...selected];
  if (selected.includes(next)) return [...selected];

  const appended = [...selected, next];
  return appended.length > MAX_COMPARE_TICKERS ? appended.slice(appended.length - MAX_COMPARE_TICKERS) : appended;
};

/** 선택 해제. 없는 티커를 지워도 그냥 같은 목록을 돌려준다(호출부가 존재를 먼저 확인하지 않아도 된다). */
export const removeTicker = (selected: readonly string[], ticker: string): string[] => {
  const target = ticker.trim().toUpperCase();
  return selected.filter((item) => item !== target);
};

/**
 * 비교 화면 주소. 🔴 실제 경로는 **`/ticker/compare?t=`** 다(`/compare?tickers=` 가 아니다) —
 * 그 화면이 선택을 URL 로 소유하는 파라미터 이름이 `t` 이고, 다른 이름으로 보내면 빈 비교가 열린다.
 *
 * 넘기기 직전에 `normalizeCompareSelection` 을 한 번 더 통과시킨다. 보내는 쪽에서 걸렀더라도
 * sessionStorage 에 남아 있던 옛 선택(그 사이 유니버스에서 빠진 티커)이 섞일 수 있다.
 */
export const buildCompareHref = (tickers: readonly string[], from: CompareEntryPoint): string => {
  const normalized = normalizeCompareSelection(tickers);
  if (normalized.length === 0) return '/ticker/compare';
  const params = new URLSearchParams({ t: normalized.join(','), from });
  return `/ticker/compare?${params.toString()}`;
};

/** 비교를 열 수 있는 최소 개수를 채웠는가. 하단 바의 CTA 활성 조건. */
export const canOpenCompare = (tickers: readonly string[]): boolean =>
  normalizeCompareSelection(tickers).length >= MIN_COMPARE_TICKERS;
