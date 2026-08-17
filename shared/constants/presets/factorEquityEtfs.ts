/**
 * 팩터·스크리닝 주식 ETF (2026-08-18 신설 — 사용자 요청 COWZ·ESGU).
 *
 * 왜 별도 파일인가: 이 레포의 ETF 묶음은 **고르는 기준**으로 갈라져 있다 — 코어 지수(시가총액),
 * 배당(배당률·증배), 섹터(산업 분류), 지역(상장국), 테마(이야기). 여기 둘은 그 어느 것도 아니다:
 *  - **COWZ** — 잉여현금흐름 수익률(FCF yield)이 높은 종목을 고른다. 배당을 보지 않는다.
 *  - **ESGU** — ESG 점수로 모지수에서 종목을 **덜어낸다**(negative screening).
 * 배당이 나온다는 이유로 배당 ETF 묶음에 넣으면 그 목록의 뜻이 "배당으로 고른 ETF"에서 "배당이 나오는
 * ETF"로 넓어진다. 반대로 코어 지수에 넣으면 "시가총액 그대로"라는 그 파일의 뜻이 깨진다.
 *
 * ## 값의 출처 — 2026-08-18 실측(`ticker:refresh`, Yahoo chart API)
 * `initialPrice`·`dividendYield`·`frequency` 는 갱신 파이프라인이 채우고 자동 갱신된다.
 *
 * 🔴 `expectedTotalReturn` 은 스크리닝의 성격에 맞춰 **모지수와 같은 대역**을 쓴다(둘 다 미국 대형주가
 *    모집단이다): ESGU 는 S&P 500 계열과 같은 9.5, COWZ 는 가치 쪽으로 기울어 9. 팩터가 **초과수익을
 *    낸다고 가정하지 않는다** — 백테스트의 팩터 프리미엄을 미래 가정으로 옮기는 것은 이 레포가 과거
 *    배당 CAGR 을 쓰지 않는 것과 같은 종류의 잘못이다(`wellKnownDividendStocks.ts` 머리말).
 */
export const FACTOR_EQUITY_ETFS = {
  COWZ: {
    ticker: 'COWZ',
    name: 'Pacer US Cash Cows 100 ETF',
    initialPrice: 70.07,
    dividendYield: 1.77,
    dividendGrowth: 7.23,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  ESGU: {
    ticker: 'ESGU',
    name: 'iShares ESG Aware MSCI USA ETF',
    initialPrice: 169.9,
    dividendYield: 0.9,
    dividendGrowth: 8.6,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  }
} as const;
