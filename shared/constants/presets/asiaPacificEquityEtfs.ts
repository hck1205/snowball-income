/**
 * 아시아태평양 광역 주식 ETF (2026-08-18 신설 — 사용자 요청 VPL·BBAX·ASEA).
 *
 * 왜 `japanEquityEtfs` 와 갈라 놓았나: 그 파일은 **일본 한 나라**에 거는 묶음이고, 여기는 **여러 나라를
 * 한 바구니에 담는** 광역 ETF다. 겹침 관계가 정반대다 — VPL 은 일본을 **포함**하고(비중이 가장 크다),
 * BBAX·ASEA 는 일본을 **제외**한다. 한 파일에 섞으면 "일본에 걸린 것"과 "일본을 뺀 것"이 뒤섞여,
 * 목록만 보고는 자기가 일본에 얼마나 노출되는지 알 수 없다.
 *
 * ⚠ **VPL 과 일본 ETF 를 함께 담으면 일본 비중이 겹친다**(VPL 의 절반 가까이가 일본이다). 프리셋은
 *   선택지를 주는 것이고 겹침의 책임은 사용자에게 있지만, 이 사실은 여기 적어 둔다.
 *
 * ## 값의 출처 — 2026-08-18 실측(`ticker:refresh`, Yahoo chart API)
 * `initialPrice`·`dividendYield`·`frequency` 는 갱신 파이프라인이 채우고 자동 갱신된다.
 * ⚠ 지급 주기를 짐작하지 마라 — 이 지역 ETF 들은 분기·반기·연이 섞여 있고, 주기는 재투자 복리
 *   횟수를 바꾸는 입력이다(`paymentsPerYearMap`). `inferFrequency` 실측값만 쓴다
 *   (일본 3종에서 짐작 셋 중 둘이 틀렸다 — `japanEquityEtfs.ts` 머리말).
 *
 * 🔴 `expectedTotalReturn` 은 **8% 균일**이다 — 이 레포가 선진국 국제 주식에 쓰는 값(VXUS·VYMI 도 8)과
 *    같다. 종목마다 다르게 잡지 않는 이유는 `wellKnownDividendStocks.ts` 머리말에 있다.
 *    `dividendGrowth = ETR - 배당률` 이라 배당률이 높은 쪽이 자동으로 낮은 성장 가정을 받는다.
 */
export const ASIA_PACIFIC_EQUITY_ETFS = {
  VPL: {
    ticker: 'VPL',
    name: 'Vanguard FTSE Pacific ETF',
    initialPrice: 118.07,
    dividendYield: 2.56,
    dividendGrowth: 5.44,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  BBAX: {
    ticker: 'BBAX',
    name: 'JPMorgan BetaBuilders Developed Asia Pacific ex-Japan ETF',
    initialPrice: 64.05,
    dividendYield: 3.51,
    dividendGrowth: 4.49,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  ASEA: {
    ticker: 'ASEA',
    name: 'Global X FTSE Southeast Asia ETF',
    initialPrice: 21.65,
    dividendYield: 3.58,
    dividendGrowth: 4.42,
    expectedTotalReturn: 8,
    frequency: 'semiannual' as const
  }
} as const;
