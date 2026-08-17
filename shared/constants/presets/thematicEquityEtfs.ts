/**
 * 테마 주식 ETF (2026-08-18 신설 — 사용자 요청 PAVE·DTCR·CARZ·CHAT·QTUM·ARKK·WELD).
 *
 * 왜 `sectorEquityEtfs` 가 아닌가: 섹터 ETF 는 **정해진 산업 분류**(GICS 필수소비재·헬스케어…) 안의
 * 종목을 시가총액 비중으로 담는다. 테마 ETF 는 분류가 아니라 **이야기**로 종목을 모은다 — "리쇼어링",
 * "생성형 AI", "양자컴퓨팅" 은 표준 산업 분류에 없고, 그래서 같은 이름을 건 두 펀드가 전혀 다른 종목을
 * 담을 수 있다. 고르는 기준이 다르므로 파일을 나눈다.
 *
 * 🔴 `expectedTotalReturn` 은 **9% 균일**이고, 테마별로 다르게 잡지 않는다.
 *
 *    이 묶음에서 그 규칙이 가장 중요하다. 테마 펀드는 **역사가 짧고**(CHAT·QTUM·WELD 는 몇 년),
 *    출시 시점이 그 테마가 이미 뜨거운 때라 초기 수익률이 구조적으로 과대하다. 과거 수익률을 미래
 *    가정으로 옮기면 "양자컴퓨팅 40%" 같은 숫자가 사용자 화면에 들어간다 — 이 앱이 절대 하지 말아야
 *    할 일이다(같은 함정의 근거는 `wellKnownDividendStocks.ts` 머리말).
 *    ⚠ 9% 는 코어 지수(9.5)보다 **낮다.** 테마 집중은 분산을 포기하는 대가로 변동성을 키우는데,
 *      기대값까지 더 높다고 가정하면 두 번 유리하게 세는 것이 된다.
 *
 * ⚠ 배당은 **부수 효과이고 없는 것도 있다**(실측 결과 무배당은 ARKK 하나뿐이고, 나머지는 0.2~1.8%
 *   사이에 흩어져 있다 — 테마 이름으로는 배당 유무를 짐작할 수 없다는 뜻이다). 배당률 0 이면 유니버스가
 *   지급 주기를 자동으로 `none` 으로 접는다(`presets/index.ts` 의 `withCoherentPayoutFrequency`) —
 *   그래야 캘린더가 "일정 미확인"과 "지급 없음"을 혼동하지 않는다.
 * ⚠ 지급 주기도 짐작이 여러 번 틀렸다(CARZ·QTUM 은 연 1회로 뒀는데 실측 분기, CHAT 은 반대). 주기는
 *   재투자 복리 횟수를 바꾸는 입력이라 `inferFrequency` 실측값만 쓴다.
 *
 * ## 값의 출처 — 2026-08-18 실측(`ticker:refresh`, Yahoo chart API)
 * `initialPrice`·`dividendYield`·`frequency` 는 갱신 파이프라인이 채우고 자동 갱신된다.
 */
export const THEMATIC_EQUITY_ETFS = {
  PAVE: {
    ticker: 'PAVE',
    name: 'Global X U.S. Infrastructure Development ETF',
    initialPrice: 58.56,
    dividendYield: 0.74,
    dividendGrowth: 8.26,
    expectedTotalReturn: 9,
    frequency: 'semiannual' as const
  },
  DTCR: {
    ticker: 'DTCR',
    name: 'Global X Data Center & Digital Infrastructure ETF',
    initialPrice: 29.32,
    dividendYield: 0.84,
    dividendGrowth: 8.16,
    expectedTotalReturn: 9,
    frequency: 'semiannual' as const
  },
  CARZ: {
    ticker: 'CARZ',
    name: 'First Trust S-Network Future Vehicles & Technology ETF',
    initialPrice: 111.58,
    dividendYield: 1.22,
    dividendGrowth: 7.78,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  /* ⚠ "생성형 AI 라 무배당"이라 짐작했다가 실측에서 뒤집혔다 — **연 1회 분배가 있고 배당률 1.76%** 다
     (이 파일에서 CARZ 다음으로 높다). 무배당은 아래 ARKK 뿐이다. */
  CHAT: {
    ticker: 'CHAT',
    name: 'Roundhill Generative AI & Technology ETF',
    initialPrice: 95.29,
    dividendYield: 1.76,
    dividendGrowth: 7.24,
    expectedTotalReturn: 9,
    frequency: 'annual' as const
  },
  QTUM: {
    ticker: 'QTUM',
    name: 'Defiance Quantum ETF',
    initialPrice: 159.21,
    dividendYield: 0.74,
    dividendGrowth: 8.26,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  /*
   * 🔴 배당률 0 이면 주기도 **반드시 `'none'`** 이다. 갱신 파이프라인이 스냅샷에 남겨 둔 `'annual'` 을
   * 그대로 옮겼다가 `test/tickerRefresh/applyMarketData.test.ts` 의 "빈 스냅샷은 무연산" 불변식이
   * 깨졌다 — 유니버스 합성이 배당률 0 을 보고 주기를 `'none'` 으로 접기 때문에(`withCoherentPayoutFrequency`)
   * 큐레이션 값이 그와 어긋나면 "입력 = 출력"이 성립하지 않는다.
   * ⚠ 지급이 없는데 주기를 적어 두면 캘린더가 "일정 미확인"으로 읽는다 — 그 혼동을 막는 것이
   *   그 파생 규칙의 존재 이유다(`presets/index.ts` 주석).
   */
  ARKK: {
    ticker: 'ARKK',
    name: 'ARK Innovation ETF',
    initialPrice: 81.9,
    dividendYield: 0,
    dividendGrowth: 9,
    expectedTotalReturn: 9,
    frequency: 'none' as const
  },
  /*
   * WELD — 2026-08-18 실측으로 확인했다. 🔴 이 레포의 상장 티커 데이터셋
   * (`utils/TickerParser/output/`)에는 **없다** — 최근 상장분이라 그 생성물이 아직 모른다.
   * 야후 chart API 로 이름·시세를 대조한 뒤에만 넣었다(짐작으로 넣지 않는다).
   */
  WELD: {
    ticker: 'WELD',
    name: 'Tema U.S. Manufacturing & Reshoring ETF',
    initialPrice: 59.26,
    dividendYield: 0.22,
    dividendGrowth: 8.78,
    expectedTotalReturn: 9,
    frequency: 'semiannual' as const
  }
} as const;
