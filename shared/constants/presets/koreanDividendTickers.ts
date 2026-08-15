/**
 * ── 한국 상장 배당 종목 (1차 12종, 2026-08-06 신설) ───────────────────────────
 *
 * `docs/site-assessment-2026-08-06.md` 의 P0-① 처방이다. 국내 사용자의 계좌에는 국내 상장 종목이
 * 들어 있는데 그걸 넣을 수 없어서 "내 포트폴리오"가 성립하지 않았다 — 진입 장벽 하나가 여기서 걷힌다.
 * 타당성 검토는 [docs/korea-listing-feasibility.md](../../../docs/korea-listing-feasibility.md) 가 이미 끝냈다.
 *
 * ## 🔴 이 파일의 숫자는 전부 **실측**이다 (2026-08-06)
 * `initialPrice`·`dividendYield`·`frequency` 는 미국 파이프라인과 **같은 경로**로 뽑았다 —
 * 야후 chart API(`.KS`) → TTM 배당 합 ÷ 현재가, 지급 간격 중앙값으로 주기 판정
 * (`scripts/koreaTickers/probe.mjs`). 짐작으로 적은 값은 하나도 없다.
 * `expectedTotalReturn` 만 **큐레이터의 가정**이고(관측값이 아니다), `dividendGrowth` 는 거기서
 * 파생된다 — 이 레포의 정합 모델 불변식 `dividendYield + dividendGrowth === expectedTotalReturn`.
 *
 * ## 🔴 이름은 손으로 적는다 — 야후 이름을 믿지 마라
 * 실측에서 확인한 것: `161510` 은 2026년에 ARIRANG → PLUS 로 개명했는데 야후는 옛 이름을 주고,
 * `466920` 은 아예 다른 상품 이름("Sol Shipbuilding Top3")이 붙어 있었다. 그래서 **숫자는 야후,
 * 이름은 사람**이다(korea-listing-feasibility §1·§3-1과 같은 결론).
 *
 * ## 🔴 티커 표기 = `종목코드.KS`
 * 야후 심볼을 그대로 쓴다. `.KS`(유가증권) / `.KQ`(코스닥)를 **큐레이션에 못 박는다** — 야후는
 * 틀린 접미사도 200 으로 답하기 때문에(005930.KQ 실측) 자동 판정에 맡기면 오타가 조용히 통과한다.
 *
 * ## ⚠ 세금은 아직 종목별로 갈리지 않는다
 * 국내주식 / 국내상장 해외ETF / 해외상장은 세 갈래로 과세가 다르다(feasibility §3-2). 그 구분은
 * `shared/constants/tax` 의 `KOREAN_TICKER_TAX_CATEGORY` 가 **사실로서 들고 있고**, 화면·엔진 반영은
 * 다음 단계다 — 세율은 지금도 사용자가 폼에서 하나로 넣는다(계산 정확성 영역이라 테스트가 먼저다).
 * 🔴 이 파일은 **프리셋 객체 하나만** export 한다(test/presets 의 단일 원천 가드).
 */

/**
 * 1차 12종. 고른 기준은 **"이 앱을 쓰는 이유와 겹치는가"** 다 — 월배당·고배당이 먼저고,
 * 지수 추종(KODEX 200)이나 성장주 ETF 는 배당 화면의 후보가 아니라서 넣지 않았다.
 *
 * ⚠ `expectedTotalReturn` 은 국내 종목이라고 후하게 잡지 않았다. 커버드콜(483290)은 배당률이
 *   11.8% 로 높지만 총수익 가정은 그만큼 올리지 않는다 — 프리미엄 수취는 주가 상승분을 깎는다.
 */
export const KOREAN_DIVIDEND_TICKERS = {
  '458730.KS': {
    ticker: '458730.KS',
    name: 'TIGER 미국배당다우존스',
    initialPrice: 15175,
    dividendYield: 2.89,
    dividendGrowth: 5.61,
    expectedTotalReturn: 8.5,
    frequency: 'monthly' as const
  },
  '402970.KS': {
    ticker: '402970.KS',
    name: 'ACE 미국배당다우존스',
    initialPrice: 15460,
    dividendYield: 2.88,
    dividendGrowth: 5.62,
    expectedTotalReturn: 8.5,
    frequency: 'monthly' as const
  },
  '483290.KS': {
    ticker: '483290.KS',
    name: 'KODEX 미국배당다우존스타겟커버드콜',
    initialPrice: 10470,
    dividendYield: 11.8,
    dividendGrowth: -3.3,
    expectedTotalReturn: 8.5,
    frequency: 'monthly' as const
  },
  '161510.KS': {
    ticker: '161510.KS',
    name: 'PLUS 고배당주',
    initialPrice: 24960,
    dividendYield: 4.04,
    dividendGrowth: 3.46,
    expectedTotalReturn: 7.5,
    frequency: 'monthly' as const
  },
  '279530.KS': {
    ticker: '279530.KS',
    name: 'KODEX 고배당',
    initialPrice: 17390,
    dividendYield: 4.09,
    dividendGrowth: 3.41,
    expectedTotalReturn: 7.5,
    frequency: 'monthly' as const
  },
  '104530.KS': {
    ticker: '104530.KS',
    name: 'KOSEF 고배당',
    initialPrice: 17725,
    dividendYield: 4.15,
    dividendGrowth: 3.35,
    expectedTotalReturn: 7.5,
    frequency: 'monthly' as const
  },
  '210780.KS': {
    ticker: '210780.KS',
    name: 'TIGER 코스피고배당',
    initialPrice: 23010,
    dividendYield: 4.78,
    dividendGrowth: 2.72,
    expectedTotalReturn: 7.5,
    frequency: 'quarterly' as const
  },
  '211560.KS': {
    ticker: '211560.KS',
    name: 'TIGER 배당성장',
    initialPrice: 35300,
    dividendYield: 2.57,
    dividendGrowth: 5.43,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  '088980.KS': {
    ticker: '088980.KS',
    name: '맥쿼리인프라',
    initialPrice: 10020,
    dividendYield: 7.29,
    dividendGrowth: -0.29,
    expectedTotalReturn: 7,
    frequency: 'semiannual' as const
  },
  '033780.KS': {
    ticker: '033780.KS',
    name: 'KT&G',
    initialPrice: 181300,
    dividendYield: 3.31,
    dividendGrowth: 3.69,
    expectedTotalReturn: 7,
    frequency: 'semiannual' as const
  },
  '316140.KS': {
    ticker: '316140.KS',
    name: '우리금융지주',
    initialPrice: 33600,
    dividendYield: 4.11,
    dividendGrowth: 2.89,
    expectedTotalReturn: 7,
    frequency: 'quarterly' as const
  },
  '105560.KS': {
    ticker: '105560.KS',
    name: 'KB금융',
    initialPrice: 170500,
    dividendYield: 3.37,
    dividendGrowth: 3.63,
    expectedTotalReturn: 7,
    frequency: 'quarterly' as const
  },
  '489250.KS': {
    ticker: '489250.KS',
    name: 'KODEX 미국배당다우존스',
    initialPrice: 13295,
    dividendYield: 2.8,
    dividendGrowth: 5.7,
    expectedTotalReturn: 8.5,
    frequency: 'monthly' as const
  },
  '476850.KS': {
    ticker: '476850.KS',
    name: 'KoAct 배당성장액티브',
    initialPrice: 21770,
    dividendYield: 6.27,
    dividendGrowth: 1.73,
    expectedTotalReturn: 8.0,
    frequency: 'monthly' as const
  },
  '322410.KS': {
    ticker: '322410.KS',
    name: 'HANARO 고배당',
    initialPrice: 23350,
    dividendYield: 2.63,
    dividendGrowth: 4.87,
    expectedTotalReturn: 7.5,
    frequency: 'monthly' as const
  },
  '266160.KS': {
    ticker: '266160.KS',
    name: 'KBSTAR 고배당',
    initialPrice: 33350,
    dividendYield: 1.87,
    dividendGrowth: 5.63,
    expectedTotalReturn: 7.5,
    frequency: 'quarterly' as const
  },
  '446720.KS': {
    ticker: '446720.KS',
    name: 'SOL 미국배당미국채혼합50',
    initialPrice: 14165,
    dividendYield: 2.9,
    dividendGrowth: 4.1,
    expectedTotalReturn: 7.0,
    frequency: 'monthly' as const
  },
  '458760.KS': {
    ticker: '458760.KS',
    name: 'TIGER 미국배당+7%프리미엄다우존스',
    initialPrice: 11340,
    dividendYield: 9.56,
    dividendGrowth: -1.06,
    expectedTotalReturn: 8.5,
    frequency: 'monthly' as const
  },
  '441640.KS': {
    ticker: '441640.KS',
    name: 'KODEX 미국배당프리미엄액티브',
    initialPrice: 13055,
    dividendYield: 9.04,
    dividendGrowth: -0.54,
    expectedTotalReturn: 8.5,
    frequency: 'monthly' as const
  },
} as const;
