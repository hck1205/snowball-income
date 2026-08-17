/**
 * 인지도 높은 배당 지급 대형주 (2026-08-14 신설).
 *
 * 왜 별도 그룹인가: 기존 그룹은 **배당귀족·챔피언 유니버스**(연속 증배 25년/10년 이상)에서 골라
 * 왔는데 그 유니버스에는 남은 대형주가 거의 없다 — 미등록 172종 중 S&P 500 배당귀족은 넷뿐이고
 * 나머지는 중소형 지역은행·소형 유틸리티다. 사용자가 찾는 이름(디즈니·코노코필립스·블랙록…)은
 * **증배 연수가 짧아 그 유니버스 밖**에 있다.
 * 🔴 그래서 선정 기준이 "연속 증배 연수"가 아니라 **인지도 + 배당 지급 사실**이다. 배당 이력이
 *    얕거나 끊긴 종목이 섞일 수 있다 — 배당귀족 그룹과 같은 것으로 읽지 마라.
 *
 * ## 값의 출처
 * `initialPrice`·`dividendYield`·`frequency` 는 갱신 파이프라인(Yahoo chart API)이 채우고
 * **매월 1일 자동 갱신**된다(`.github/workflows/refresh-tickers.yml`).
 *
 * 🔴 `expectedTotalReturn` 은 **8% 균일**이다. 파이프라인이 절대 건드리지 않는 유일한 값이라
 *    (그 워크플로: "Curated values are never touched") 사람이 정해야 하는데, **종목마다 다르게
 *    잡지 않는다.**
 *
 *    같은 날 `실측 배당률 + 실측 5년 배당 CAGR` 로 종목별 ETR 을 넣어 봤다가 접었다 — 5년 배당
 *    CAGR 은 스핀오프·배당 재개·삭감·특별배당에서 **구조적으로 깨진다**: GE 49%, ODFL 30%,
 *    인텔 14%(삭감한 해에도 양수), 도미니언 -1%, PPL -5%. **음수 ETR 은 손실이 확정된 프리셋**이다.
 *
 *    균일값이 오히려 정직하다: 특정 회사의 미래를 주장하지 않는 **모델링 가정**이고, 사용자가
 *    화면에서 바로 고칠 수 있다. `dividendGrowth = ETR - 배당률` 이라 고배당주는 낮은 성장,
 *    저배당주는 높은 성장으로 자동 보정된다.
 */
export const WELL_KNOWN_DIVIDEND_STOCKS = {
  /*
   * BNY (BNY Mellon) — 2026-08-15 합류. 🔴 **티커가 `BK` 에서 바뀌었다.** 옛 심볼로는 야후가 404 를
   * 답한다(그래서 첫 확충에서 빠졌다). 미국 티커도 개명한다는 사실을 여기 남긴다.
   * ⚠ 실측 5년 배당 CAGR 은 10.03% 지만 이 묶음의 균일 규칙대로 `expectedTotalReturn` 은 8% 다 —
   *   그래서 파생 성장률이 6.64% 로 **실측보다 보수적**이다. 과거 성장률을 미래 가정으로 쓰지 않는
   *   것이 이 파일의 규칙이고(머리말), 개별 종목에서 예외를 두지 않는다.
   */
  BNY: {
    ticker: 'BNY',
    name: 'BNY Mellon',
    initialPrice: 163.24,
    dividendYield: 1.36,
    dividendGrowth: 6.64,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  DIS: {
    ticker: 'DIS',
    name: 'Walt Disney',
    initialPrice: 106.57,
    dividendYield: 1.41,
    dividendGrowth: 6.59,
    expectedTotalReturn: 8,
    frequency: 'semiannual' as const
  },
  CMCSA: {
    ticker: 'CMCSA',
    name: 'Comcast',
    initialPrice: 26.38,
    dividendYield: 4.93,
    dividendGrowth: 3.07,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  TMUS: {
    ticker: 'TMUS',
    name: 'T-Mobile US',
    initialPrice: 182.3,
    dividendYield: 2.16,
    dividendGrowth: 5.84,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  MU: {
    ticker: 'MU',
    name: 'Micron Technology',
    initialPrice: 971.64,
    dividendYield: 0.05,
    dividendGrowth: 7.95,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  HPQ: {
    ticker: 'HPQ',
    name: 'HP Inc.',
    initialPrice: 30.57,
    dividendYield: 3.89,
    dividendGrowth: 4.11,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  DELL: {
    ticker: 'DELL',
    name: 'Dell Technologies',
    initialPrice: 496.53,
    dividendYield: 0.47,
    dividendGrowth: 7.53,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  PAYX: {
    ticker: 'PAYX',
    name: 'Paychex',
    initialPrice: 122.16,
    dividendYield: 3.72,
    dividendGrowth: 4.28,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  SYK: {
    ticker: 'SYK',
    name: 'Stryker',
    initialPrice: 338.45,
    dividendYield: 1.03,
    dividendGrowth: 6.97,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  BMY: {
    ticker: 'BMY',
    name: 'Bristol-Myers Squibb',
    initialPrice: 63.7,
    dividendYield: 3.94,
    dividendGrowth: 4.06,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  GILD: {
    ticker: 'GILD',
    name: 'Gilead Sciences',
    initialPrice: 137.16,
    dividendYield: 2.35,
    dividendGrowth: 5.65,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  CI: {
    ticker: 'CI',
    name: 'Cigna Group',
    initialPrice: 279.74,
    dividendYield: 2.19,
    dividendGrowth: 5.81,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  MCK: {
    ticker: 'MCK',
    name: 'McKesson',
    initialPrice: 862.31,
    dividendYield: 0.38,
    dividendGrowth: 7.62,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  ZTS: {
    ticker: 'ZTS',
    name: 'Zoetis',
    initialPrice: 74.58,
    dividendYield: 2.8,
    dividendGrowth: 5.2,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  DHR: {
    ticker: 'DHR',
    name: 'Danaher',
    initialPrice: 203.5,
    dividendYield: 0.71,
    dividendGrowth: 7.29,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  TMO: {
    ticker: 'TMO',
    name: 'Thermo Fisher Scientific',
    initialPrice: 592.86,
    dividendYield: 0.3,
    dividendGrowth: 7.7,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  A: {
    ticker: 'A',
    name: 'Agilent Technologies',
    initialPrice: 148.48,
    dividendYield: 0.68,
    dividendGrowth: 7.32,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  GIS: {
    ticker: 'GIS',
    name: 'General Mills',
    initialPrice: 39.01,
    dividendYield: 6.25,
    dividendGrowth: 1.75,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  KDP: {
    ticker: 'KDP',
    name: 'Keurig Dr Pepper',
    initialPrice: 31.55,
    dividendYield: 2.92,
    dividendGrowth: 5.08,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  CAG: {
    ticker: 'CAG',
    name: 'Conagra Brands',
    initialPrice: 15.5,
    dividendYield: 7.91,
    dividendGrowth: 0.09,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  CPB: {
    ticker: 'CPB',
    name: 'Campbell Soup',
    initialPrice: 23.16,
    dividendYield: 6.74,
    dividendGrowth: 1.26,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  TSN: {
    ticker: 'TSN',
    name: 'Tyson Foods',
    initialPrice: 58.47,
    dividendYield: 3.47,
    dividendGrowth: 4.53,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  EL: {
    ticker: 'EL',
    name: 'Estée Lauder',
    initialPrice: 86.91,
    dividendYield: 1.61,
    dividendGrowth: 6.39,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  ROST: {
    ticker: 'ROST',
    name: 'Ross Stores',
    initialPrice: 246.29,
    dividendYield: 0.69,
    dividendGrowth: 7.31,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  DG: {
    ticker: 'DG',
    name: 'Dollar General',
    initialPrice: 123.32,
    dividendYield: 1.91,
    dividendGrowth: 6.09,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  DPZ: {
    ticker: 'DPZ',
    name: 'Domino\'s Pizza',
    initialPrice: 349.37,
    dividendYield: 2.14,
    dividendGrowth: 5.86,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  F: {
    ticker: 'F',
    name: 'Ford Motor',
    initialPrice: 14.1,
    dividendYield: 4.26,
    dividendGrowth: 3.74,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  ROK: {
    ticker: 'ROK',
    name: 'Rockwell Automation',
    initialPrice: 448.66,
    dividendYield: 1.21,
    dividendGrowth: 6.79,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  GE: {
    ticker: 'GE',
    name: 'GE Aerospace',
    initialPrice: 364.69,
    dividendYield: 0.46,
    dividendGrowth: 7.54,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  FDX: {
    ticker: 'FDX',
    name: 'FedEx',
    initialPrice: 338.14,
    dividendYield: 1.4,
    dividendGrowth: 6.6,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  NSC: {
    ticker: 'NSC',
    name: 'Norfolk Southern',
    initialPrice: 338.48,
    dividendYield: 1.6,
    dividendGrowth: 6.4,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  ODFL: {
    ticker: 'ODFL',
    name: 'Old Dominion Freight Line',
    initialPrice: 213.68,
    dividendYield: 0.53,
    dividendGrowth: 7.47,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  LUV: {
    ticker: 'LUV',
    name: 'Southwest Airlines',
    initialPrice: 44.83,
    dividendYield: 1.61,
    dividendGrowth: 6.39,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  TT: {
    ticker: 'TT',
    name: 'Trane Technologies',
    initialPrice: 478.91,
    dividendYield: 0.63,
    dividendGrowth: 7.37,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  COP: {
    ticker: 'COP',
    name: 'ConocoPhillips',
    initialPrice: 126.64,
    dividendYield: 2.61,
    dividendGrowth: 5.39,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  EOG: {
    ticker: 'EOG',
    name: 'EOG Resources',
    initialPrice: 143.05,
    dividendYield: 2.85,
    dividendGrowth: 5.15,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  PSX: {
    ticker: 'PSX',
    name: 'Phillips 66',
    initialPrice: 233.86,
    dividendYield: 2.11,
    dividendGrowth: 5.89,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  VLO: {
    ticker: 'VLO',
    name: 'Valero Energy',
    initialPrice: 344.43,
    dividendYield: 1.37,
    dividendGrowth: 6.63,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  MPC: {
    ticker: 'MPC',
    name: 'Marathon Petroleum',
    initialPrice: 358.77,
    dividendYield: 1.09,
    dividendGrowth: 6.91,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  SLB: {
    ticker: 'SLB',
    name: 'SLB',
    initialPrice: 53.55,
    dividendYield: 2.17,
    dividendGrowth: 5.83,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  KMI: {
    ticker: 'KMI',
    name: 'Kinder Morgan',
    initialPrice: 32.43,
    dividendYield: 3.65,
    dividendGrowth: 4.35,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  WMB: {
    ticker: 'WMB',
    name: 'Williams Companies',
    initialPrice: 73.89,
    dividendYield: 2.77,
    dividendGrowth: 5.23,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  OKE: {
    ticker: 'OKE',
    name: 'ONEOK',
    initialPrice: 94.31,
    dividendYield: 4.5,
    dividendGrowth: 3.5,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  EPD: {
    ticker: 'EPD',
    name: 'Enterprise Products Partners',
    initialPrice: 38.46,
    dividendYield: 5.73,
    dividendGrowth: 2.27,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  DUK: {
    ticker: 'DUK',
    name: 'Duke Energy',
    initialPrice: 123.2,
    dividendYield: 3.46,
    dividendGrowth: 4.54,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  SO: {
    ticker: 'SO',
    name: 'Southern Company',
    initialPrice: 92.77,
    dividendYield: 3.21,
    dividendGrowth: 4.79,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  D: {
    ticker: 'D',
    name: 'Dominion Energy',
    initialPrice: 68.49,
    dividendYield: 3.9,
    dividendGrowth: 4.1,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  AEP: {
    ticker: 'AEP',
    name: 'American Electric Power',
    initialPrice: 124.99,
    dividendYield: 3.04,
    dividendGrowth: 4.96,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  EXC: {
    ticker: 'EXC',
    name: 'Exelon',
    initialPrice: 45.59,
    dividendYield: 2.72,
    dividendGrowth: 5.28,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  XEL: {
    ticker: 'XEL',
    name: 'Xcel Energy',
    initialPrice: 78.93,
    dividendYield: 2.95,
    dividendGrowth: 5.05,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  WEC: {
    ticker: 'WEC',
    name: 'WEC Energy Group',
    initialPrice: 109.63,
    dividendYield: 2.55,
    dividendGrowth: 5.45,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  ES: {
    ticker: 'ES',
    name: 'Eversource Energy',
    initialPrice: 72.22,
    dividendYield: 4.27,
    dividendGrowth: 3.73,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  PEG: {
    ticker: 'PEG',
    name: 'Public Service Enterprise Group',
    initialPrice: 76.13,
    dividendYield: 3.42,
    dividendGrowth: 4.58,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  SRE: {
    ticker: 'SRE',
    name: 'Sempra',
    initialPrice: 86.8,
    dividendYield: 3.0,
    dividendGrowth: 5.0,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  DTE: {
    ticker: 'DTE',
    name: 'DTE Energy',
    initialPrice: 140.29,
    dividendYield: 3.27,
    dividendGrowth: 4.73,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  AEE: {
    ticker: 'AEE',
    name: 'Ameren',
    initialPrice: 109.22,
    dividendYield: 2.67,
    dividendGrowth: 5.33,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  PPL: {
    ticker: 'PPL',
    name: 'PPL Corporation',
    initialPrice: 35.64,
    dividendYield: 3.13,
    dividendGrowth: 4.87,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  PNC: {
    ticker: 'PNC',
    name: 'PNC Financial Services',
    initialPrice: 256.5,
    dividendYield: 2.77,
    dividendGrowth: 5.23,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  TFC: {
    ticker: 'TFC',
    name: 'Truist Financial',
    initialPrice: 53.11,
    dividendYield: 2.94,
    dividendGrowth: 5.06,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  SCHW: {
    ticker: 'SCHW',
    name: 'Charles Schwab',
    initialPrice: 110.61,
    dividendYield: 0.82,
    dividendGrowth: 7.18,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  BLK: {
    ticker: 'BLK',
    name: 'BlackRock',
    initialPrice: 1172.46,
    dividendYield: 1.87,
    dividendGrowth: 6.13,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  STT: {
    ticker: 'STT',
    name: 'State Street',
    initialPrice: 190.89,
    dividendYield: 1.76,
    dividendGrowth: 6.24,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  AMP: {
    ticker: 'AMP',
    name: 'Ameriprise Financial',
    initialPrice: 571.2,
    dividendYield: 1.16,
    dividendGrowth: 6.84,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  MET: {
    ticker: 'MET',
    name: 'MetLife',
    initialPrice: 97.86,
    dividendYield: 2.37,
    dividendGrowth: 5.63,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  PRU: {
    ticker: 'PRU',
    name: 'Prudential Financial',
    initialPrice: 124.93,
    dividendYield: 4.4,
    dividendGrowth: 3.6,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  ALL: {
    ticker: 'ALL',
    name: 'Allstate',
    initialPrice: 259.83,
    dividendYield: 1.6,
    dividendGrowth: 6.4,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  PGR: {
    ticker: 'PGR',
    name: 'Progressive',
    initialPrice: 208.15,
    dividendYield: 6.68,
    dividendGrowth: 1.32,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  AIG: {
    ticker: 'AIG',
    name: 'American International Group',
    initialPrice: 76.59,
    dividendYield: 2.42,
    dividendGrowth: 5.58,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  HIG: {
    ticker: 'HIG',
    name: 'Hartford Insurance Group',
    initialPrice: 137.78,
    dividendYield: 1.68,
    dividendGrowth: 6.32,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  SPG: {
    ticker: 'SPG',
    name: 'Simon Property Group',
    initialPrice: 219.78,
    dividendYield: 4.0,
    dividendGrowth: 4.0,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  PSA: {
    ticker: 'PSA',
    name: 'Public Storage',
    initialPrice: 326.11,
    dividendYield: 3.68,
    dividendGrowth: 4.32,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  EXR: {
    ticker: 'EXR',
    name: 'Extra Space Storage',
    initialPrice: 148.61,
    dividendYield: 4.36,
    dividendGrowth: 3.64,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  AVB: {
    ticker: 'AVB',
    name: 'AvalonBay Communities',
    initialPrice: 183.94,
    dividendYield: 3.84,
    dividendGrowth: 4.16,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  EQR: {
    ticker: 'EQR',
    name: 'Equity Residential',
    initialPrice: 65.93,
    dividendYield: 4.23,
    dividendGrowth: 3.77,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  MAA: {
    ticker: 'MAA',
    name: 'Mid-America Apartment',
    initialPrice: 133.72,
    dividendYield: 4.57,
    dividendGrowth: 3.43,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  WELL: {
    ticker: 'WELL',
    name: 'Welltower',
    initialPrice: 234.03,
    dividendYield: 1.31,
    dividendGrowth: 6.69,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  VTR: {
    ticker: 'VTR',
    name: 'Ventas',
    initialPrice: 90.58,
    dividendYield: 2.21,
    dividendGrowth: 5.79,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  DLR: {
    ticker: 'DLR',
    name: 'Digital Realty Trust',
    initialPrice: 199.73,
    dividendYield: 2.44,
    dividendGrowth: 5.56,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  EQIX: {
    ticker: 'EQIX',
    name: 'Equinix',
    initialPrice: 1086.02,
    dividendYield: 1.81,
    dividendGrowth: 6.19,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  IRM: {
    ticker: 'IRM',
    name: 'Iron Mountain',
    initialPrice: 126.74,
    dividendYield: 2.66,
    dividendGrowth: 5.34,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  NNN: {
    ticker: 'NNN',
    name: 'NNN REIT',
    initialPrice: 46.21,
    dividendYield: 5.24,
    dividendGrowth: 2.76,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  ADC: {
    ticker: 'ADC',
    name: 'Agree Realty',
    initialPrice: 74.85,
    dividendYield: 4.21,
    dividendGrowth: 3.79,
    expectedTotalReturn: 8,
    frequency: 'monthly' as const
  },
  KIM: {
    ticker: 'KIM',
    name: 'Kimco Realty',
    initialPrice: 24.41,
    dividendYield: 4.22,
    dividendGrowth: 3.78,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  /* ── 2026-08-18 사용자 요청 3종. 이 파일의 규칙대로 ETR 은 8% 균일이다(머리말). ── */
  CDW: {
    ticker: 'CDW',
    name: 'CDW Corporation',
    initialPrice: 134.82,
    dividendYield: 1.87,
    dividendGrowth: 6.13,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  MAS: {
    ticker: 'MAS',
    name: 'Masco Corporation',
    initialPrice: 73.1,
    dividendYield: 1.3,
    dividendGrowth: 6.7,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  TSCO: {
    ticker: 'TSCO',
    name: 'Tractor Supply Company',
    initialPrice: 35.1,
    dividendYield: 2.68,
    dividendGrowth: 5.32,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
} as const;
