/**
 * 2026-08-02 확충분(RYLD·SPYI·QQQI): `initialPrice`·`dividendYield`·`frequency` 는 갱신 파이프라인과
 * 같은 경로(Yahoo chart API → `scripts/tickerRefresh/derive`)로 2026-08-02 에 실측했다.
 *
 * 옵션인컴 계열의 `expectedTotalReturn` 은 배당률보다 **낮게** 잡히는 것이 정상이다 — 정합 모델에서
 * `dividendGrowth = etr - dy` 는 곧 주가 성장률이고, 콜을 팔아 상방을 넘긴 대가로 분배금 일부가
 * 원금(NAV)에서 나오는 구조를 음(-)의 성장률로 정직하게 표현한 것이다(QYLD -3, XYLD -1.5 와 같은 규율).
 *
 * ## 2026-08-17 확충분 — 지수형 커버드콜/옵션인컴 13종
 *
 * GPIQ·GPIX·IWMI·IYRI·DJIA·FTQI·FTHI·KNG·BALI·ISPY·PBP·QQQT·SPYT.
 * `initialPrice`·`dividendYield`·`frequency` 는 위와 같은 경로로 **2026-08-17 에 실측**했다.
 * 13종 전부 월 분배이고, `name` 은 Yahoo `chart.meta.longName` 으로 확인했다(BALI 는 블랙록이 아니라
 * **iShares** 브랜드로 바뀌어 있다 — 기억이 아니라 실측한 이름을 쓴다).
 *
 * ### `expectedTotalReturn` 을 어떻게 정했나 — 기초지수 − 옵션 전략 차감
 *
 * 이 파일의 기존 규율을 그대로 이었다. **기초지수 총수익률은 새로 지어내지 않고 이 레포가 이미
 * 큐레이션한 값을 재사용**한다(레버리지 파일과 같은 원칙):
 *
 * | 기초 | 값 | 출처 |
 * |---|---|---|
 * | 나스닥100 | 11% | `CORE_INDEX_ETFS.QQQ` |
 * | S&P 500 | 9.5% | `CORE_INDEX_ETFS.VOO` |
 * | 다우30 | 8.5% | `CORE_INDEX_ETFS.DIA` |
 * | 미국 리츠 | 8% | `REIT_ETFS.VNQ` |
 * | 러셀2000 | 8% | `LEVERAGED_INDEX_ETFS` 머리말의 가정(대응 프리셋이 레포에 없다) |
 * | 배당귀족 | 9% | `US_DIVIDEND_GROWTH_ETFS.NOBL` |
 *
 * 여기서 차감폭은 **상방을 얼마나 팔았는가 + 보수**로 정했고, 기존 종목이 기준선이다 —
 * 전량 커버(QYLD 11→7, XYLD 9.5→7.5) > 부분 커버·스프레드(QQQI 11→9, SPYI 9.5→8.5).
 *
 * ### 🔴 배당률 20%대 종목의 성장률이 -13% 인 것은 오타가 아니다
 *
 * QQQT·SPYT 는 이름 그대로 **연 20% 분배를 목표**로 삼는다. 기초지수가 만들어 주는 총수익이
 * 6.5~7% 인데 20%를 꺼내 주면, 차액은 원금에서 나올 수밖에 없다 — 정합 모델은 그것을 `dividendGrowth`
 * -13% 로 드러낸다(30년이면 주가가 1% 수준으로 줄어든다는 뜻이다). 숨기는 것보다 보여 주는 것이
 * 이 모델의 목적이다.
 *
 * ### 일부러 뺀 것 (실측해 보고 제외)
 *
 * - **주(週) 배당 종목** — QDTE(TTM 44.25%, 12개월 **52회**) · XDTE(30.84%, 52회) · RDTE · YMAX · ULTY.
 *   `Frequency` 타입에 주 단위가 없어 `inferFrequency` 가 52회를 **월배당으로 오분류**한다. 연 총액은
 *   맞지만 주기가 틀린 채로 굳고, 갱신 파이프라인이 매번 같은 오분류를 덮어쓴다.
 * - **FEPI(26.04%) · AIPI(35.78%)** — 12개월 21회. 기간 중 월→주 배당으로 갈아탄 종목이라 위와 같은 문제.
 * - **QYLG(16.90%) · XYLG(12.81%)** — TTM 배당률의 절반 이상이 2025-12-30 **자본이득 분배금**이다
 *   (각 2.778·2.141 = 평월의 15배). 평월 기준 실질 배당률은 7.6%·5.6% 인데 갱신 파이프라인이
 *   덮어쓸 때마다 "고배당"으로 둔갑한다 — 레버리지 파일이 TECL·TSLL 을 뺀 것과 같은 이유.
 * - **단일 종목형(YieldMax MSTY·TSLY·NVDY·CONY 등)** — 지수형이 아니다(2026-08-17 사용자 지시).
 * - **NUSI**(NEOS Nasdaq-100 Hedged Equity Income, 실측 18.35%) — 여기까지 값을 다 뽑아 놓고 뺐다.
 *   Yahoo 는 NasdaqGM 상장으로 보고하고 2026-08-14 까지 시세도 있는데, **나스닥 공식 심볼 디렉터리
 *   (`nasdaqlisted.txt`, 5592종)에는 없다** — 같은 거래소로 보고되는 QQQI 는 들어 있으니 조회 실수가
 *   아니다. 상장 상태가 두 원천에서 어긋나는 종목을 프리셋에 넣으면 "살 수 없는 종목"을 권하게 된다.
 *   `utils/TickerParser/output/*.json` 에 NUSI 가 다시 나타나면 그때 넣는다.
 *
 * ⚠ DJIA·PBP 도 연말 정산 분배금이 있지만(2025-12-30 0.471 · 2025-12-22 0.574, 평월의 3배 정도)
 *   TTM 배당률에 1.4%p·1.6%p 만 얹는 수준이라 종목의 성격을 왜곡하지 않는다 — 위 QYLG·XYLG 와
 *   갈라놓는 기준은 "평월 분배금으로 설명되는 배당률인가"다.
 * ⚠ `expectedTotalReturn` 은 0 이상이어야 한다 — 프리셋 필터의 하한이 0 이라(`PresetFilterPanel.utils.ts`
 *   `derivePresetRanges`) 음수면 기본 화면에서 조용히 사라진다.
 */
export const OPTION_INCOME_ETFS = {
  JEPI: {
    ticker: 'JEPI',
    name: 'JPMorgan Equity Premium Income ETF',
    initialPrice: 59,
    dividendYield: 8.0,
    dividendGrowth: 0,
    expectedTotalReturn: 8,
    frequency: 'monthly' as const
  },
  JEPQ: {
    ticker: 'JEPQ',
    name: 'JPMorgan Nasdaq Equity Premium Income ETF',
    initialPrice: 51,
    dividendYield: 8.2,
    dividendGrowth: 0.8,
    expectedTotalReturn: 9,
    frequency: 'monthly' as const
  },
  DIVO: {
    ticker: 'DIVO',
    name: 'Amplify CWP Enhanced Dividend Income ETF',
    initialPrice: 47,
    dividendYield: 5.5,
    dividendGrowth: 4,
    expectedTotalReturn: 9.5,
    frequency: 'monthly' as const
  },
  IDVO: {
    ticker: 'IDVO',
    name: 'Amplify International Enhanced Dividend ETF',
    initialPrice: 29,
    dividendYield: 7.0,
    dividendGrowth: 1,
    expectedTotalReturn: 8,
    frequency: 'monthly' as const
  },
  QDVO: {
    ticker: 'QDVO',
    /* 2026-08-17 정정: 'QRAFT AI-Enhanced U.S. Dividend ETF' 로 적혀 있었으나 그런 종목이 아니다.
       QDVO 는 2024-09 상장한 앰플리파이의 성장·인컴 ETF(DIVO 의 성장주 버전)다 — Yahoo
       `chart.meta.longName` 과 첫 분배일(2024-09-27)이 모두 이 이름을 가리킨다. */
    name: 'Amplify CWP Growth & Income ETF',
    initialPrice: 27,
    dividendYield: 6.5,
    dividendGrowth: 2.5,
    expectedTotalReturn: 9,
    frequency: 'monthly' as const
  },
  QYLD: {
    ticker: 'QYLD',
    name: 'Global X Nasdaq 100 Covered Call ETF',
    initialPrice: 18,
    dividendYield: 10,
    dividendGrowth: -3,
    expectedTotalReturn: 7,
    frequency: 'monthly' as const
  },
  XYLD: {
    ticker: 'XYLD',
    name: 'Global X S&P 500 Covered Call ETF',
    initialPrice: 40,
    dividendYield: 9,
    dividendGrowth: -1.5,
    expectedTotalReturn: 7.5,
    frequency: 'monthly' as const
  },
  RYLD: {
    ticker: 'RYLD',
    name: 'Global X Russell 2000 Covered Call ETF',
    initialPrice: 16.01,
    dividendYield: 11.64,
    dividendGrowth: -4.64,
    expectedTotalReturn: 7,
    frequency: 'monthly' as const
  },
  SPYI: {
    ticker: 'SPYI',
    name: 'NEOS S&P 500 High Income ETF',
    initialPrice: 52.86,
    dividendYield: 11.94,
    dividendGrowth: -3.44,
    expectedTotalReturn: 8.5,
    frequency: 'monthly' as const
  },
  QQQI: {
    ticker: 'QQQI',
    name: 'NEOS Nasdaq-100 High Income ETF',
    initialPrice: 53.04,
    dividendYield: 14.38,
    dividendGrowth: -5.38,
    expectedTotalReturn: 9,
    frequency: 'monthly' as const
  },

  /* ── 2026-08-17 확충분 (실측일 2026-08-17, 근거는 파일 머리말) ───────────────────────── */

  GPIQ: {
    ticker: 'GPIQ',
    name: 'Goldman Sachs Nasdaq-100 Premium Income ETF',
    initialPrice: 57.66,
    dividendYield: 9.82,
    /* 나스닥100 11% − 1.5. 같은 지수의 QQQI(9)보다 높게 잡은 이유: 콜을 일부에만 쓰는 액티브
       운용이라 분배율이 9.8%(QQQI 14.4%)로 낮고, 보수 0.29% 는 이 묶음에서 가장 싸다. */
    dividendGrowth: -0.32,
    expectedTotalReturn: 9.5,
    frequency: 'monthly' as const
  },
  GPIX: {
    ticker: 'GPIX',
    name: 'Goldman Sachs S&P 500 Premium Income ETF',
    initialPrice: 56.61,
    dividendYield: 7.99,
    /* S&P 500 9.5% − 1. 같은 지수·같은 성격인 SPYI(8.5)와 같은 값이다. */
    dividendGrowth: 0.51,
    expectedTotalReturn: 8.5,
    frequency: 'monthly' as const
  },
  IWMI: {
    ticker: 'IWMI',
    name: 'NEOS Russell 2000 High Income ETF',
    initialPrice: 53.65,
    dividendYield: 13.35,
    /* 러셀2000 8% − 1. 같은 지수의 RYLD(7)와 같은 값 — 기초지수가 낮은 것이 차감폭보다 먼저 온다. */
    dividendGrowth: -6.35,
    expectedTotalReturn: 7,
    frequency: 'monthly' as const
  },
  IYRI: {
    ticker: 'IYRI',
    name: 'NEOS Real Estate High Income ETF',
    initialPrice: 49.98,
    dividendYield: 10.83,
    /* 미국 리츠 8%(VNQ) − 1. */
    dividendGrowth: -3.83,
    expectedTotalReturn: 7,
    frequency: 'monthly' as const
  },
  DJIA: {
    ticker: 'DJIA',
    name: 'Global X Dow 30 Covered Call ETF',
    initialPrice: 22.81,
    dividendYield: 10.3,
    /* 다우30 8.5%(DIA) − 2. 전량 커버라 차감폭은 형제 종목 XYLD(9.5→7.5)와 같다. */
    dividendGrowth: -3.8,
    expectedTotalReturn: 6.5,
    frequency: 'monthly' as const
  },
  FTQI: {
    ticker: 'FTQI',
    name: 'First Trust Nasdaq BuyWrite Income ETF',
    initialPrice: 22.4,
    dividendYield: 10.92,
    /* 나스닥100 11% − 2.5. 부분 커버 액티브(QQQI 급)지만 보수 0.75% 가 붙어 반 칸 더 깎았다. */
    dividendGrowth: -2.42,
    expectedTotalReturn: 8.5,
    frequency: 'monthly' as const
  },
  FTHI: {
    ticker: 'FTHI',
    name: 'First Trust BuyWrite Income ETF',
    initialPrice: 24.33,
    dividendYield: 8.63,
    /* S&P 500 9.5% − 1.5. 보수 0.85% 를 감안해 GPIX·SPYI(8.5)보다 반 칸 아래. */
    dividendGrowth: -0.63,
    expectedTotalReturn: 8,
    frequency: 'monthly' as const
  },
  KNG: {
    ticker: 'KNG',
    name: 'FT Cboe Vest S&P 500 Dividend Aristocrats Target Income ETF',
    initialPrice: 52.07,
    dividendYield: 8.08,
    /* 배당귀족 9%(NOBL) − 1. 이 묶음에서 유일하게 기초가 지수가 아니라 **배당귀족 바스켓**이고,
       콜은 보유 종목의 일부에만 쓴다. */
    dividendGrowth: -0.08,
    expectedTotalReturn: 8,
    frequency: 'monthly' as const
  },
  BALI: {
    ticker: 'BALI',
    name: 'iShares U.S. Large Cap Premium Income Active ETF',
    initialPrice: 35.18,
    dividendYield: 7.55,
    /* S&P 500 9.5% − 1. 보수 0.35% 의 액티브 부분 커버 — SPYI·GPIX 와 같은 자리. */
    dividendGrowth: 0.95,
    expectedTotalReturn: 8.5,
    frequency: 'monthly' as const
  },
  ISPY: {
    ticker: 'ISPY',
    name: 'ProShares S&P 500 High Income ETF',
    initialPrice: 49.12,
    dividendYield: 4.95,
    /* S&P 500 9.5% − 1. 이 묶음에서 배당률이 가장 낮은(4.95%) 대신 **성장률이 유일하게 3%대로
       양수**다 — 만기 1일 콜을 매일 새로 팔아 상방을 덜 넘기는 구조라, "커버드콜은 다 NAV 가
       깎인다"가 아니라 분배율과 성장의 교환이라는 것을 이 종목이 보여 준다. */
    dividendGrowth: 3.55,
    expectedTotalReturn: 8.5,
    frequency: 'monthly' as const
  },
  PBP: {
    ticker: 'PBP',
    name: 'Invesco S&P 500 BuyWrite ETF',
    initialPrice: 23.38,
    dividendYield: 12.02,
    /* S&P 500 9.5% − 2. 전량 커버라 XYLD(7.5)와 같은 값 — 같은 지수·같은 전략이므로 겹치는 것이
       정상이다. 두 종목을 모두 두는 이유는 "내가 가진 티커"로 찾기 위함이다. */
    dividendGrowth: -4.52,
    expectedTotalReturn: 7.5,
    frequency: 'monthly' as const
  },
  QQQT: {
    ticker: 'QQQT',
    name: 'Defiance Nasdaq 100 Income Target ETF',
    initialPrice: 18.37,
    dividendYield: 19.86,
    /* 나스닥100 11% − 4. 연 20% 분배를 목표로 스프레드를 굴리고 보수도 0.99% 로 가장 비싸다.
       🔴 성장률 -12.86 은 오타가 아니다 — 7% 를 벌어 20% 를 꺼내면 차액이 원금에서 나온다(머리말). */
    dividendGrowth: -12.86,
    expectedTotalReturn: 7,
    frequency: 'monthly' as const
  },
  SPYT: {
    ticker: 'SPYT',
    name: 'Defiance S&P 500 Target Income ETF',
    initialPrice: 17.65,
    dividendYield: 20.44,
    /* S&P 500 9.5% − 3. QQQT 와 같은 구조를 변동성이 낮은 지수에 얹은 것이라 목표 분배율 20% 를
       채우려면 더 많은 상방을 팔아야 한다. 🔴 성장률 -13.94 도 같은 이유다(머리말). */
    dividendGrowth: -13.94,
    expectedTotalReturn: 6.5,
    frequency: 'monthly' as const
  }
} as const;
