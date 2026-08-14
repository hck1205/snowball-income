/**
 * 2026-08-02 확충분(PEP 이하 14종): `initialPrice`·`dividendYield`·`frequency` 는 갱신 파이프라인과
 * 같은 경로(Yahoo chart API → `scripts/tickerRefresh/derive` 의 `computeTtmYield`·`inferFrequency`)로
 * 2026-08-02 에 실측했다. `expectedTotalReturn` 만 큐레이터의 가정이고 `dividendGrowth` 는 파생값이다.
 *
 * ⚠ "배당성장주"는 **배당률이 낮고 성장 여력에 무게가 실린 대형주**라는 뜻이지, 매년 인상을 보장한다는
 * 뜻이 아니다. MMM 처럼 사업 분할 과정에서 배당이 재설정된 이력이 있는 종목도 이 묶음에 있다.
 */
/**
 * 2026-08-14 확충분: `expectedTotalReturn` 을 **실측에서 유도했다** — 앞선 확충분과 규칙이 다르다.
 *
 *     expectedTotalReturn = 실측 TTM 배당률 + 실측 5년 배당 CAGR
 *
 * 갱신 파이프라인이 `implied etr` 이라는 이름으로 계산해 주는 값이다(`scripts/tickerRefresh` 의
 * `CagrReview`). 큐레이터가 미래 수익률을 새로 가정하는 대신 **시장의 자기 배당 이력이 함의하는
 * 총수익**을 그대로 쓴 것이라, 지어낸 숫자가 들어가지 않는다.
 *
 * 🔴 **이 규칙은 여기까지만 유효하다.** 같은 날 유명 대형주 85종에 그대로 적용해 봤다가 접었다 —
 *    5년 배당 CAGR 은 **스핀오프·배당 재개·삭감·특별배당에서 구조적으로 깨진다**. 실측 결과
 *    GE 49%, ODFL 30%, 인텔 14%(실제로는 삭감한 해에도 양수), 도미니언 -1%, PPL -5% 가 나왔다.
 *    음수 ETR 은 **손실이 확정된 프리셋**이 된다. 이 16종은 값을 하나씩 눈으로 확인해 넣은 것이고,
 *    규모를 늘리려면 다른 규칙이 필요하다(회고: 종목당 검토 없이 이 규칙을 확대하지 마라).
 * ⚠ TJX 는 뺐다 — 배당 시계열이 끊겨 5년 CAGR 이 산출되지 않아 규칙을 적용할 근거가 없다.
 */
export const DIVIDEND_GROWTH_STOCKS = {
  SBUX: {
    ticker: 'SBUX',
    name: 'Starbucks',
    initialPrice: 107.85,
    dividendYield: 2.29,
    dividendGrowth: 7.81,
    expectedTotalReturn: 10.1,
    frequency: 'quarterly' as const
  },
  NKE: {
    ticker: 'NKE',
    name: 'Nike',
    initialPrice: 40.92,
    dividendYield: 3.98,
    dividendGrowth: 9.82,
    expectedTotalReturn: 13.8,
    frequency: 'quarterly' as const
  },
  HON: {
    ticker: 'HON',
    name: 'Honeywell',
    initialPrice: 233.09,
    dividendYield: 2.09,
    dividendGrowth: 5.11,
    expectedTotalReturn: 7.2,
    frequency: 'quarterly' as const
  },
  LMT: {
    ticker: 'LMT',
    name: 'Lockheed Martin',
    initialPrice: 605.23,
    dividendYield: 2.26,
    dividendGrowth: 6.34,
    expectedTotalReturn: 8.6,
    frequency: 'quarterly' as const
  },
  ACN: {
    ticker: 'ACN',
    name: 'Accenture',
    initialPrice: 176.56,
    dividendYield: 1.85,
    dividendGrowth: 6.25,
    expectedTotalReturn: 8.1,
    frequency: 'quarterly' as const
  },
  ABT: {
    ticker: 'ABT',
    name: 'Abbott Laboratories',
    initialPrice: 111.25,
    dividendYield: 2.23,
    dividendGrowth: 10.37,
    expectedTotalReturn: 12.6,
    frequency: 'quarterly' as const
  },
  MDLZ: {
    ticker: 'MDLZ',
    name: 'Mondelez International',
    initialPrice: 63.38,
    dividendYield: 3.16,
    dividendGrowth: 10.04,
    expectedTotalReturn: 13.2,
    frequency: 'quarterly' as const
  },
  HSY: {
    ticker: 'HSY',
    name: 'Hershey',
    initialPrice: 183.74,
    dividendYield: 3.07,
    dividendGrowth: 11.63,
    expectedTotalReturn: 14.7,
    frequency: 'quarterly' as const
  },
  YUM: {
    ticker: 'YUM',
    name: 'Yum! Brands',
    initialPrice: 149.71,
    dividendYield: 1.95,
    dividendGrowth: 8.65,
    expectedTotalReturn: 10.6,
    frequency: 'quarterly' as const
  },
  PG: {
    ticker: 'PG',
    name: 'Procter & Gamble',
    initialPrice: 160,
    dividendYield: 2.4,
    dividendGrowth: 6.6,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  KO: {
    ticker: 'KO',
    name: 'Coca-Cola',
    initialPrice: 60,
    dividendYield: 3.1,
    dividendGrowth: 4.9,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  JNJ: {
    ticker: 'JNJ',
    name: 'Johnson & Johnson',
    initialPrice: 160,
    dividendYield: 3.0,
    dividendGrowth: 5.5,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  LOW: {
    ticker: 'LOW',
    name: 'Lowe’s',
    initialPrice: 220,
    dividendYield: 1.8,
    dividendGrowth: 9.2,
    expectedTotalReturn: 11,
    frequency: 'quarterly' as const
  },
  ABBV: {
    ticker: 'ABBV',
    name: 'AbbVie',
    initialPrice: 170,
    dividendYield: 3.7,
    dividendGrowth: 6.3,
    expectedTotalReturn: 10,
    frequency: 'quarterly' as const
  },
  PEP: {
    ticker: 'PEP',
    name: 'PepsiCo',
    initialPrice: 139.56,
    dividendYield: 4.12,
    dividendGrowth: 4.38,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  MCD: {
    ticker: 'MCD',
    name: "McDonald's",
    initialPrice: 270.64,
    dividendYield: 2.72,
    dividendGrowth: 6.28,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  HD: {
    ticker: 'HD',
    name: 'The Home Depot',
    initialPrice: 331.96,
    dividendYield: 2.79,
    dividendGrowth: 6.21,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  TGT: {
    ticker: 'TGT',
    name: 'Target',
    initialPrice: 144.49,
    dividendYield: 3.16,
    dividendGrowth: 5.34,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  WMT: {
    ticker: 'WMT',
    name: 'Walmart',
    initialPrice: 111.2,
    dividendYield: 0.87,
    dividendGrowth: 8.13,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  XOM: {
    ticker: 'XOM',
    name: 'Exxon Mobil',
    initialPrice: 155.44,
    dividendYield: 2.62,
    dividendGrowth: 5.38,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  CVX: {
    ticker: 'CVX',
    name: 'Chevron',
    initialPrice: 196.83,
    dividendYield: 3.55,
    dividendGrowth: 4.95,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  CAT: {
    ticker: 'CAT',
    name: 'Caterpillar',
    initialPrice: 814.81,
    dividendYield: 0.76,
    dividendGrowth: 8.24,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  MMM: {
    ticker: 'MMM',
    name: '3M',
    initialPrice: 176.28,
    dividendYield: 1.71,
    dividendGrowth: 6.29,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  IBM: {
    ticker: 'IBM',
    name: 'International Business Machines',
    initialPrice: 223.65,
    dividendYield: 3.01,
    dividendGrowth: 4.99,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  CSCO: {
    ticker: 'CSCO',
    name: 'Cisco Systems',
    initialPrice: 115.99,
    dividendYield: 1.43,
    dividendGrowth: 7.07,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  AMGN: {
    ticker: 'AMGN',
    name: 'Amgen',
    initialPrice: 385.16,
    dividendYield: 2.54,
    dividendGrowth: 6.46,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  UNH: {
    ticker: 'UNH',
    name: 'UnitedHealth Group',
    initialPrice: 414.4,
    dividendYield: 2.16,
    dividendGrowth: 7.34,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  PLD: {
    ticker: 'PLD',
    name: 'Prologis',
    initialPrice: 144.61,
    dividendYield: 2.88,
    dividendGrowth: 5.62,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  }
} as const;
