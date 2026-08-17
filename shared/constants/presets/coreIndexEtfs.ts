export const CORE_INDEX_ETFS = {
  VOO: {
    ticker: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    initialPrice: 480,
    dividendYield: 1.3,
    dividendGrowth: 8.2,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  IVV: {
    ticker: 'IVV',
    name: 'iShares Core S&P 500 ETF',
    initialPrice: 520,
    dividendYield: 1.3,
    dividendGrowth: 8.2,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  SPY: {
    ticker: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    initialPrice: 500,
    dividendYield: 1.3,
    dividendGrowth: 8.2,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  VTI: {
    ticker: 'VTI',
    name: 'Vanguard Total Stock Market ETF',
    initialPrice: 250,
    dividendYield: 1.4,
    dividendGrowth: 8.1,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  QQQ: {
    ticker: 'QQQ',
    name: 'Invesco QQQ Trust',
    initialPrice: 430,
    dividendYield: 0.6,
    dividendGrowth: 10.4,
    expectedTotalReturn: 11,
    frequency: 'quarterly' as const
  },
  VUG: {
    ticker: 'VUG',
    name: 'Vanguard Growth ETF',
    initialPrice: 360,
    dividendYield: 0.5,
    dividendGrowth: 10,
    expectedTotalReturn: 10.5,
    frequency: 'quarterly' as const
  },
  VT: {
    ticker: 'VT',
    name: 'Vanguard Total World Stock ETF',
    initialPrice: 110,
    dividendYield: 1.8,
    dividendGrowth: 6.7,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  VXUS: {
    ticker: 'VXUS',
    name: 'Vanguard Total International Stock ETF',
    initialPrice: 60,
    dividendYield: 2.5,
    dividendGrowth: 5.5,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  DIA: {
    ticker: 'DIA',
    name: 'SPDR Dow Jones Industrial Average ETF',
    initialPrice: 390,
    dividendYield: 1.8,
    dividendGrowth: 6.7,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  /*
   * ── 2026-08-18 사용자 요청 3종. 셋 다 **시가총액 그대로 담는 코어 자리**라 이 파일 소속이다. ──
   * QQQM 은 QQQ 와 같은 지수(나스닥 100)를 더 낮은 보수로 담는 형제 상품이라 ETR 도 QQQ 와 같은 11 이다.
   * MGK·SCHG 는 대형 성장주 묶음이라 VUG(10.5)와 같은 대역에 둔다.
   * ⚠ 이 셋과 QQQ·VUG 를 함께 담으면 **같은 대형 기술주가 여러 번 계산된다**(구성이 크게 겹친다).
   */
  QQQM: {
    ticker: 'QQQM',
    name: 'Invesco NASDAQ 100 ETF',
    initialPrice: 302.34,
    dividendYield: 0.43,
    dividendGrowth: 10.57,
    expectedTotalReturn: 11,
    frequency: 'quarterly' as const
  },
  /*
   * 🔴 이름과 주가 둘 다 2026-08-18 실측으로 고쳤다.
   *  ① 공식명이 **"Vanguard Morningstar Mega Cap Growth ETF"** 다 — 이 레포가 VUG·VTI 에서 이미 겪은
   *     CRSP → 모닝스타 지수 개명이 이 펀드에도 왔다(방법론은 그대로다).
   *  ② **2026-04-21 에 5:1 분할했다**(야후 split 이벤트로 확인 — 비율을 짐작하지 않고 조회했다).
   *     갱신 파이프라인의 ±50% 가드가 380 → 90.7 을 "분할 또는 오류"로 막아 준 덕에 알았다 —
   *     가드가 조용히 통과하지 않는다는 것이 그 값의 존재 이유다. 같은 날 VGT 도 8:1 로 쪼갰다.
   */
  MGK: {
    ticker: 'MGK',
    name: 'Vanguard Morningstar Mega Cap Growth ETF',
    initialPrice: 90.68,
    dividendYield: 0.32,
    dividendGrowth: 10.18,
    expectedTotalReturn: 10.5,
    frequency: 'quarterly' as const
  },
  SCHG: {
    ticker: 'SCHG',
    name: 'Schwab U.S. Large-Cap Growth ETF',
    initialPrice: 35.63,
    dividendYield: 0.37,
    dividendGrowth: 10.13,
    expectedTotalReturn: 10.5,
    frequency: 'quarterly' as const
  }
} as const;
