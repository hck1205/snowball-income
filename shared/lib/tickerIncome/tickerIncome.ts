import { DIVIDEND_UNIVERSE, type PresetTickerKey } from '@/shared/constants/presets';
import { resolveDefaultDividendTaxRatePercent } from '@/shared/constants/tax';
import { monthlyDividendForPrincipal } from '@/shared/lib/goalPlan';
import { defaultYieldFormValues, runSimulation, toSimulationInput } from '@/shared/lib/snowball';

/**
 * 티커 페이지의 **"이 종목에 N 원을 넣으면 매달 얼마?"** — 검색 질문에 숫자로 답하는 계산 계층(순수).
 *
 * ## 왜 (2026-11-09)
 * 사람들이 실제로 검색하는 것은 "SCHD 1억 투자하면 월 배당금", "SCHD 10년 투자하면" 이다. 티커 페이지는
 * 배당률·성장률 같은 **재료**만 보여 주고 그 질문의 **답**은 시뮬레이터로 가야 나왔다. 이 모듈은 그 답을
 * 페이지 맨 위에 바로 놓기 위한 것이다 — 같은 숫자를 SPA 화면과 크롤러 HTML 이 함께 쓴다.
 *
 * ## 🔴 식을 새로 만들지 않는다
 * - 지금 받는 월 배당: `monthlyDividendForPrincipal`(`/dividend/how-much` 의 원금 식의 역함수, 같은 파일).
 * - 10년 재투자 뒤: **계산 엔진(`runSimulation`) 그대로**의 `finalRunRateMonthlyDividend`.
 * 여기서 산수를 따로 적으면 같은 질문에 화면마다 다른 답이 나온다.
 *
 * ## 🔴 통화가 없다
 * 배당률·성장률이 비율이라 원금을 원으로 넣으면 결과도 원이다(환율 불필요 — `dividendRequirement` 와
 * 같은 이유). 엔진의 주가(USD)는 주식 수를 정하는 데만 쓰이고, 결과는 원금에 **선형**이다(테스트가 잠근다).
 */

/** 보여 줄 원금 구간(원). 검색어가 실제로 이 단위로 들어온다("1000만원", "1억", "3억"). */
export const TICKER_INCOME_PRINCIPALS = [10_000_000, 50_000_000, 100_000_000, 300_000_000] as const;

/** 대표 원금 — 제목 문장에 쓰는 값. */
export const TICKER_INCOME_HEADLINE_PRINCIPAL = 100_000_000;

/** 재투자 시나리오 기간(년). "10년 투자하면"이 가장 흔한 검색 단위다. */
export const TICKER_INCOME_REINVEST_YEARS = 10;

/**
 * 시뮬레이션 시작일. **고정값**이다 — 오늘 날짜를 쓰면 서버 HTML 과 화면, 그리고 날마다 숫자가
 * 지급 월 정렬에 따라 조금씩 흔들린다. 이 답은 "언제 시작하느냐"가 아니라 "얼마를 넣느냐"의 답이다.
 */
const SIMULATION_START_DATE = '2026-01-15';

export type TickerIncomeRow = {
  readonly principal: number;
  /** 지금 배당률로 받는 세후 월 배당(원). */
  readonly monthlyAfterTax: number;
  /** 세후 연 배당(원). */
  readonly annualAfterTax: number;
  /** 배당을 전부 재투자하며 `years` 년 보유한 뒤의 세후 월 배당(원, 엔진의 종료 시점 보유 기준). */
  readonly monthlyAfterReinvest: number;
};

export type TickerIncomeAnswer = {
  readonly ticker: PresetTickerKey;
  readonly dividendYieldPercent: number;
  readonly dividendGrowthPercent: number;
  /** 적용 배당소득세율(%). 상장지에서 파생(미국 15 / 국내 15.4). */
  readonly taxRatePercent: number;
  readonly years: number;
  readonly rows: readonly TickerIncomeRow[];
  /** `TICKER_INCOME_HEADLINE_PRINCIPAL` 의 행. */
  readonly headline: TickerIncomeRow;
};

const isPresetTicker = (ticker: string): ticker is PresetTickerKey =>
  Object.prototype.hasOwnProperty.call(DIVIDEND_UNIVERSE, ticker);

/**
 * 티커 하나의 답. **배당이 없거나 계산이 성립하지 않으면 `null`** — 화면은 섹션을 그리지 않는다
 * ("월 0원"을 답이라고 보여 주지 않는다).
 */
export const buildTickerIncomeAnswer = (ticker: string): TickerIncomeAnswer | null => {
  if (!isPresetTicker(ticker)) return null;
  const preset = DIVIDEND_UNIVERSE[ticker];
  if (preset.frequency === 'none' || !(preset.dividendYield > 0)) return null;

  const taxRatePercent = resolveDefaultDividendTaxRatePercent(ticker);

  const rows: TickerIncomeRow[] = [];
  for (const principal of TICKER_INCOME_PRINCIPALS) {
    const monthlyAfterTax = monthlyDividendForPrincipal({
      principal,
      dividendYield: preset.dividendYield / 100,
      taxRate: taxRatePercent / 100
    });
    if (monthlyAfterTax === null) return null;

    const { summary } = runSimulation(
      toSimulationInput({
        ...defaultYieldFormValues,
        ticker,
        initialPrice: preset.initialPrice,
        dividendYield: preset.dividendYield,
        dividendGrowth: preset.dividendGrowth,
        expectedTotalReturn: preset.expectedTotalReturn,
        frequency: preset.frequency,
        investmentStartDate: SIMULATION_START_DATE,
        initialInvestment: principal,
        monthlyContribution: 0,
        durationYears: TICKER_INCOME_REINVEST_YEARS,
        reinvestDividends: true,
        reinvestDividendPercent: 100
      })
    );
    const monthlyAfterReinvest = summary.finalRunRateMonthlyDividend;
    if (!Number.isFinite(monthlyAfterReinvest) || monthlyAfterReinvest <= 0) return null;

    rows.push({ principal, monthlyAfterTax, annualAfterTax: monthlyAfterTax * 12, monthlyAfterReinvest });
  }

  const headline = rows.find((row) => row.principal === TICKER_INCOME_HEADLINE_PRINCIPAL);
  if (!headline) return null;

  return {
    ticker,
    dividendYieldPercent: preset.dividendYield,
    dividendGrowthPercent: preset.dividendGrowth,
    taxRatePercent,
    years: TICKER_INCOME_REINVEST_YEARS,
    rows,
    headline
  };
};

/**
 * 답의 금액 표기. 만원 이상은 "21만원"·"1억 2,345만원"(`formatKoreanWon` 과 같은 꼴),
 * 만원 미만은 원 단위("8,333원") — 저배당 종목에 1천만원을 넣은 행이 "0만원"으로 보이지 않게 한다.
 */
export const formatIncomeWon = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) return '-';
  if (value < 10_000) return `${Math.round(value).toLocaleString('ko-KR')}원`;

  const totalMan = Math.round(value / 10_000);
  const eok = Math.floor(totalMan / 10_000);
  const man = totalMan % 10_000;
  if (eok === 0) return `${man.toLocaleString('ko-KR')}만원`;
  if (man === 0) return `${eok.toLocaleString('ko-KR')}억원`;
  return `${eok.toLocaleString('ko-KR')}억 ${man.toLocaleString('ko-KR')}만원`;
};

/** 원금 라벨 — "1,000만원" · "1억원" · "3억원". */
export const formatPrincipalLabel = (principal: number): string => formatIncomeWon(principal);

const percentLabel = (value: number): string => `${Number(value.toFixed(2))}%`;

/**
 * 답 상자의 문장 — **SPA 화면과 크롤러 HTML 이 같이 쓴다.** 한쪽만 고치면 사람이 보는 질문과 검색엔진이
 * 읽는 질문이 갈린다(`TickerHtml` 의 `renderHero` 주석과 같은 이유).
 */
export const TICKER_INCOME_COPY = {
  heading: (ticker: string, principal: number): string => `${ticker}에 ${formatPrincipalLabel(principal)}을 넣으면 매달 얼마?`,
  nowLabel: '지금 배당률로 받는 돈(세후)',
  reinvestLabel: (years: number): string => `배당을 ${years}년 재투자하면(세후)`,
  reinvestCaption: (years: number): string => `추가 납입 없이 ${years}년 뒤 보유분 기준`,
  tableCaption: '투자금별 세후 월 배당',
  tableHead: (years: number): readonly [string, string, string] => ['투자금', '지금 월 배당', `${years}년 재투자 뒤`],
  assumption: (answer: Pick<TickerIncomeAnswer, 'dividendYieldPercent' | 'taxRatePercent' | 'dividendGrowthPercent'>): string =>
    `가정: 배당률 ${percentLabel(answer.dividendYieldPercent)} · 배당소득세 ${percentLabel(answer.taxRatePercent)} · ` +
    `연 배당성장 ${percentLabel(answer.dividendGrowthPercent)}. 주가와 배당은 바뀌고 환율·수수료는 넣지 않았습니다. ` +
    '투자 권유가 아닌 계산 예시입니다.',
  toTarget: '원하는 월 배당에 필요한 원금 계산하기'
} as const;
