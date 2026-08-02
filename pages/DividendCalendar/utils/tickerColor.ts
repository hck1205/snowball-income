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
