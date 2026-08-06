import { assignSeries, seriesVarFor } from '@/shared/lib/tickerSeries';

/**
 * 티커 → 시리즈 색 CSS 변수.
 *
 * 🔴 **배정 규칙은 여기 있지 않다** — `shared/lib/tickerSeries` 가 단일 원천이다(2026-08-03 D4).
 * 종전에는 이 파일이 자체 해시를 갖고 있었고, 파이 차트·대가 카드는 각자 `index % 8` 을 써서
 * **같은 종목이 화면마다 다른 색**이었다. 구현을 세 벌 두면 언젠가 갈린다.
 *
 * ⚠ 두 함수의 성질이 다르다:
 *  - `tickerSeriesVar`  — 1겹(해시만). 집합을 모르는 자리의 탈출구이고 **충돌을 허용**한다.
 *  - `tickerSeriesMap`  — 2겹(해시 + 충돌 회피). 그릴 종목 목록을 아는 자리에서 쓴다. 이쪽이 기본이다.
 */
export const tickerSeriesVar = (ticker: string): string => seriesVarFor(ticker);

/**
 * 한 화면이 그릴 종목 전체에 색을 배정한다. 같은 색이 두 번 나오지 않는다.
 * ⚠ 캘린더는 달을 넘기며 같은 종목을 눈으로 좇는 화면이라, **집합이 바뀌면 색이 움직일 수 있다**는
 *   D4 의 대가가 가장 크게 체감되는 곳이다. 그 대신 한 화면 안에서는 절대 겹치지 않는다.
 */
export const tickerSeriesMap = (tickers: readonly string[]): ReadonlyMap<string, string> =>
  assignSeries(tickers);

/** 티커 하나를 색 변수로 바꾸는 함수. 부품들은 색 규칙이 아니라 **이 함수**를 받는다. */
export type TickerSeriesResolver = (ticker: string) => string;

/**
 * 화면 하나가 쓸 **색 사전**을 만든다. 달력 칩·아젠다 막대·미정 점·범례 점이 전부 이 하나를 공유해야
 * "같은 종목 = 같은 색"이 성립한다 — 부품마다 각자 `tickerSeriesVar` 를 부르면 2겹 배정이 무너져
 * 같은 화면에서 두 종목이 같은 색을 갖는 순간이 생긴다(그러면 색이 길찾기 단서가 아니라 거짓말이 된다).
 *
 * 집합 밖 티커(예: 예시 미리보기가 잠깐 그리는 종목)는 1겹 해시로 떨어진다 — 없는 색을 지어내는 것보다
 * 겹칠 수 있어도 **결정적인 값**을 주는 편이 낫다.
 */
export const tickerSeriesResolver = (tickers: readonly string[]): TickerSeriesResolver => {
  const map = tickerSeriesMap(tickers);
  return (ticker: string) => map.get(ticker) ?? seriesVarFor(ticker);
};
