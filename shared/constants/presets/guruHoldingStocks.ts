/**
 * 2026-08-02 확충분(대가 13F 보유 개별주 중 나머지 50종): `initialPrice`·`dividendYield`·`frequency`는
 * 갱신 파이프라인과 같은 경로(Yahoo chart API → `scripts/tickerRefresh/derive`)로 2026-08-02 에
 * 실측했다. `expectedTotalReturn`만 큐레이터의 가정이고 `dividendGrowth`는 파생값이다.
 *
 * 13F 대상 13명(버핏·피셔·게이츠 재단·달리오·애크먼·우드·테퍼·클라만·드러켄밀러·버리·리루·왓사·
 * 데일리 저널) 중 여럿이 보유한 종목 위주. 에너지(OXY)·소비재(KHC·KR·STZ·TAP)·항공(DAL)·미디어(SIRI·
 * NYT)·주택건설(LEN)·유통(M)·금융(JEF)·철강(NUE)·철도/운송(UNP·CNI·CSX·PCAR)·중장비(DE)·헬스케어
 * (ELV·CVS·MRK·PFE·LLY·HUM)·기술(ORCL·QCOM·APH)·방산(RTX)·유통(COST)·광산(FCX·NEM·B)·산업재(GLW·WHR·
 * BALL)·에너지 인프라(ET·MPLX)·보험중개(WTW)·유통업(FERG)·자동차(GM)·은행(EWBC)·세무(HRB)·데이터(MSCI)·
 * 해외 ADR(SAP·NVS·AZN·BP·SHEL·JCI)까지 폭넓게 걸쳐 있다.
 *
 * ⚠ 배릭(`B`): 2025-05-09 부로 NYSE 티커가 `GOLD` → `B`로 바뀌었다(회사명도 Barrick Mining
 * Corporation으로 변경). 옛 티커 `GOLD`는 현재 무관한 다른 회사로 넘어가 있어 후보에서 제외했다
 * (WebSearch로 확인, 근거는 barrick.com 공식 발표).
 *
 * ⚠ SAP·NVS(연 1회 지급)는 `inferFrequency`의 트레일링 365일 창이 두 지급 간격(357~370일) 경계에서
 * 2회로 잡혀 'semiannual'로 오분류하는 것을 확인해(2026-08-02 실측 원자료, 10년치 이력이 정확히
 * 1회/년) `'annual'`로 수기 보정했다. AZN(연 2회 지급)도 같은 경계 버그로 3회 잡혀 'quarterly'로
 * 오분류돼 `'semiannual'`로 보정했다. 세 경우 모두 `dividendYield`는 "오늘" 기준 TTM 창이라 이 버그의
 * 영향을 받지 않는다.
 *
 * ⚠ 제외한 후보: BNS(Bank of Nova Scotia)는 Yahoo 배당 이력에 2025-07~2026-07 사이 설명되지 않는
 * 공백이 있어(분기 배당사가 1년 가까이 지급 기록이 없음) 배당률·주기를 신뢰할 수 없어 뺐다. AON(Aon
 * plc)도 2025-08~2026-05 사이 유사한 공백(분기 중 2회 누락)이 있어 제외했다 — 둘 다 원래 13F 후보였다.
 */
export const GURU_HOLDING_STOCKS = {
  OXY: {
    ticker: 'OXY',
    name: 'Occidental Petroleum Corporation',
    initialPrice: 57.07,
    dividendYield: 1.75,
    dividendGrowth: 6.75,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  KHC: {
    ticker: 'KHC',
    name: 'The Kraft Heinz Company',
    initialPrice: 25.85,
    dividendYield: 6.19,
    dividendGrowth: 1.31,
    expectedTotalReturn: 7.5,
    frequency: 'quarterly' as const
  },
  KR: {
    ticker: 'KR',
    name: 'The Kroger Co.',
    initialPrice: 57.74,
    dividendYield: 2.42,
    dividendGrowth: 5.58,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  STZ: {
    ticker: 'STZ',
    name: 'Constellation Brands, Inc.',
    initialPrice: 130.23,
    dividendYield: 3.15,
    dividendGrowth: 5.35,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  DAL: {
    ticker: 'DAL',
    name: 'Delta Air Lines, Inc.',
    initialPrice: 87.44,
    dividendYield: 0.89,
    dividendGrowth: 8.61,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  SIRI: {
    ticker: 'SIRI',
    name: 'Sirius XM Holdings Inc.',
    initialPrice: 29.62,
    dividendYield: 3.65,
    dividendGrowth: 4.35,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  NYT: {
    ticker: 'NYT',
    name: 'The New York Times Company',
    initialPrice: 74.89,
    dividendYield: 1.09,
    dividendGrowth: 7.91,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  LEN: {
    ticker: 'LEN',
    name: 'Lennar Corporation',
    initialPrice: 82.35,
    dividendYield: 2.43,
    dividendGrowth: 7.07,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  M: {
    ticker: 'M',
    name: 'Macy’s, Inc.',
    initialPrice: 24.82,
    dividendYield: 3.01,
    dividendGrowth: 4.49,
    expectedTotalReturn: 7.5,
    frequency: 'quarterly' as const
  },
  JEF: {
    ticker: 'JEF',
    name: 'Jefferies Financial Group Inc.',
    initialPrice: 54.6,
    dividendYield: 2.93,
    dividendGrowth: 5.57,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  NUE: {
    ticker: 'NUE',
    name: 'Nucor Corporation',
    initialPrice: 257.29,
    dividendYield: 0.87,
    dividendGrowth: 8.13,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  UNP: {
    ticker: 'UNP',
    name: 'Union Pacific Corporation',
    initialPrice: 292.13,
    dividendYield: 1.89,
    dividendGrowth: 7.61,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  DE: {
    ticker: 'DE',
    name: 'Deere & Company',
    initialPrice: 592.67,
    dividendYield: 1.09,
    dividendGrowth: 8.41,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  WM: {
    ticker: 'WM',
    name: 'Waste Management, Inc.',
    initialPrice: 226.55,
    dividendYield: 1.56,
    dividendGrowth: 7.44,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  CNI: {
    ticker: 'CNI',
    name: 'Canadian National Railway Company',
    initialPrice: 127.21,
    dividendYield: 1.55,
    dividendGrowth: 6.95,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  PCAR: {
    ticker: 'PCAR',
    name: 'PACCAR Inc',
    initialPrice: 132.68,
    dividendYield: 2.07,
    dividendGrowth: 6.43,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  ELV: {
    ticker: 'ELV',
    name: 'Elevance Health, Inc.',
    initialPrice: 375.84,
    dividendYield: 1.83,
    dividendGrowth: 7.17,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  CVS: {
    ticker: 'CVS',
    name: 'CVS Health Corporation',
    initialPrice: 104.43,
    dividendYield: 2.55,
    dividendGrowth: 5.95,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  MRK: {
    ticker: 'MRK',
    name: 'Merck & Co., Inc.',
    initialPrice: 130.2,
    dividendYield: 2.58,
    dividendGrowth: 5.92,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  PFE: {
    ticker: 'PFE',
    name: 'Pfizer Inc.',
    initialPrice: 25.01,
    dividendYield: 6.88,
    dividendGrowth: 1.12,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  LLY: {
    ticker: 'LLY',
    name: 'Eli Lilly and Company',
    initialPrice: 1148.84,
    dividendYield: 0.56,
    dividendGrowth: 12.44,
    expectedTotalReturn: 13,
    frequency: 'quarterly' as const
  },
  HUM: {
    ticker: 'HUM',
    name: 'Humana Inc.',
    initialPrice: 363.86,
    dividendYield: 0.97,
    dividendGrowth: 7.53,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  ORCL: {
    ticker: 'ORCL',
    name: 'Oracle Corporation',
    initialPrice: 129.87,
    dividendYield: 1.54,
    dividendGrowth: 10.46,
    expectedTotalReturn: 12,
    frequency: 'quarterly' as const
  },
  QCOM: {
    ticker: 'QCOM',
    name: 'QUALCOMM Incorporated',
    initialPrice: 147.61,
    dividendYield: 2.43,
    dividendGrowth: 7.57,
    expectedTotalReturn: 10,
    frequency: 'quarterly' as const
  },
  TAP: {
    ticker: 'TAP',
    name: 'Molson Coors Beverage Company',
    initialPrice: 41.56,
    dividendYield: 4.57,
    dividendGrowth: 2.93,
    expectedTotalReturn: 7.5,
    frequency: 'quarterly' as const
  },
  WEN: {
    ticker: 'WEN',
    name: 'The Wendy’s Company',
    initialPrice: 7.36,
    dividendYield: 7.61,
    dividendGrowth: 0.39,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  RTX: {
    ticker: 'RTX',
    name: 'RTX Corporation',
    initialPrice: 215.22,
    dividendYield: 1.29,
    dividendGrowth: 8.21,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  COST: {
    ticker: 'COST',
    name: 'Costco Wholesale Corporation',
    initialPrice: 951.89,
    dividendYield: 0.58,
    dividendGrowth: 10.42,
    expectedTotalReturn: 11,
    frequency: 'quarterly' as const
  },
  FCX: {
    ticker: 'FCX',
    name: 'Freeport-McMoRan Inc.',
    initialPrice: 62.63,
    dividendYield: 0.96,
    dividendGrowth: 8.54,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  APH: {
    ticker: 'APH',
    name: 'Amphenol Corporation',
    initialPrice: 160.7,
    dividendYield: 0.57,
    dividendGrowth: 10.43,
    expectedTotalReturn: 11,
    frequency: 'quarterly' as const
  },
  CSX: {
    ticker: 'CSX',
    name: 'CSX Corporation',
    initialPrice: 50.4,
    dividendYield: 1.07,
    dividendGrowth: 7.93,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  NEM: {
    ticker: 'NEM',
    name: 'Newmont Corporation',
    initialPrice: 93.71,
    dividendYield: 1.09,
    dividendGrowth: 8.41,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  B: {
    ticker: 'B',
    name: 'Barrick Mining Corporation',
    initialPrice: 36.73,
    dividendYield: 2.5,
    dividendGrowth: 6.5,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  GLW: {
    ticker: 'GLW',
    name: 'Corning Incorporated',
    initialPrice: 138.25,
    dividendYield: 0.81,
    dividendGrowth: 8.19,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  WHR: {
    ticker: 'WHR',
    name: 'Whirlpool Corporation',
    initialPrice: 37.5,
    dividendYield: 7.2,
    dividendGrowth: 0.3,
    expectedTotalReturn: 7.5,
    frequency: 'quarterly' as const
  },
  BALL: {
    ticker: 'BALL',
    name: 'Ball Corporation',
    initialPrice: 64.9,
    dividendYield: 1.23,
    dividendGrowth: 7.77,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  ET: {
    ticker: 'ET',
    name: 'Energy Transfer LP',
    initialPrice: 20.36,
    dividendYield: 6.56,
    dividendGrowth: 1.44,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  MPLX: {
    ticker: 'MPLX',
    name: 'MPLX LP',
    initialPrice: 58.45,
    dividendYield: 7.17,
    dividendGrowth: 1.33,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  WTW: {
    ticker: 'WTW',
    name: 'Willis Towers Watson Public Limited Company',
    initialPrice: 335.92,
    dividendYield: 1.12,
    dividendGrowth: 8.88,
    expectedTotalReturn: 10,
    frequency: 'quarterly' as const
  },
  FERG: {
    ticker: 'FERG',
    name: 'Ferguson Enterprises Inc.',
    initialPrice: 234.33,
    dividendYield: 1.49,
    dividendGrowth: 7.51,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  GM: {
    ticker: 'GM',
    name: 'General Motors Company',
    initialPrice: 88.86,
    dividendYield: 0.74,
    dividendGrowth: 7.26,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  EWBC: {
    ticker: 'EWBC',
    name: 'East West Bancorp, Inc.',
    initialPrice: 131,
    dividendYield: 2.14,
    dividendGrowth: 6.86,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  HRB: {
    ticker: 'HRB',
    name: 'H&R Block, Inc.',
    initialPrice: 44.03,
    dividendYield: 3.82,
    dividendGrowth: 4.18,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  MSCI: {
    ticker: 'MSCI',
    name: 'MSCI Inc.',
    initialPrice: 572.24,
    dividendYield: 1.35,
    dividendGrowth: 11.15,
    expectedTotalReturn: 12.5,
    frequency: 'quarterly' as const
  },
  SAP: {
    ticker: 'SAP',
    name: 'SAP SE',
    initialPrice: 183.62,
    dividendYield: 1.6,
    dividendGrowth: 9.4,
    expectedTotalReturn: 11,
    frequency: 'annual' as const
  },
  NVS: {
    ticker: 'NVS',
    name: 'Novartis AG',
    initialPrice: 156.15,
    dividendYield: 3.06,
    dividendGrowth: 5.94,
    expectedTotalReturn: 9,
    frequency: 'annual' as const
  },
  AZN: {
    ticker: 'AZN',
    name: 'AstraZeneca PLC',
    initialPrice: 169.64,
    dividendYield: 1.88,
    dividendGrowth: 8.12,
    expectedTotalReturn: 10,
    frequency: 'semiannual' as const
  },
  BP: {
    ticker: 'BP',
    name: 'BP p.l.c.',
    initialPrice: 45.22,
    dividendYield: 4.41,
    dividendGrowth: 3.59,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  SHEL: {
    ticker: 'SHEL',
    name: 'Shell plc',
    initialPrice: 91.98,
    dividendYield: 3.22,
    dividendGrowth: 4.78,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  JCI: {
    ticker: 'JCI',
    name: 'Johnson Controls International plc',
    initialPrice: 146.66,
    dividendYield: 0.55,
    dividendGrowth: 8.45,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  }
} as const;
