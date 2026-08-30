import type { MonthlySnapshot, SimulationOutput, SimulationResult, SimulationSummary } from '@/shared/types';
import { sumBy } from '@/shared/lib/numeric';
import { computeCapitalGains, findFinancialIncomeThresholdYear } from './SnowballCapitalGains';

/**
 * 목표 월배당에 처음 도달하는 **연도 라벨**. 도달하지 않으면 `undefined`.
 *
 * 🔴 **연 해상도 목표 판정의 유일한 정의다.** 앱의 여러 표면(단일 종목 요약·포트폴리오 합산·
 * 필요 적립금 역산)이 전부 이 함수를 부른다 — 한 곳이라도 `rows.find(...)` 로 다시 구현하면
 * 같은 화면 안에서 "도달"과 "미도달"이 동시에 나올 수 있다(실제로 포트폴리오 합산 쪽이 그렇게
 * 인라인 재구현돼 있었다).
 *
 * ⚠ `monthlyTarget = 0`(목표 미설정)이면 첫 행에서 즉시 성립한다 — 호출부가 "미설정"을 따로 분기한다.
 */
export const findTargetYear = (rows: readonly SimulationResult[], monthlyTarget: number): number | undefined => {
  return rows.find((row) => row.monthlyDividend >= monthlyTarget)?.year;
};

/**
 * **목표 자산**에 처음 닿는 연도 라벨. 닿지 않으면 `undefined`.
 *
 * 🔴 `findTargetYear` 와 **완전 대칭**이다 — 보는 열만 다르다(월배당 vs 자산). 첫 화면의 목표
 * 여섯 중 자산 셋(1억·3억·5억)이 계산기에서 답을 받으려면 이 판정이 필요한데, 엔진에는
 * **목표 자산 입력 필드가 없다**(폼의 목표는 `targetMonthlyDividend` 하나뿐).
 *
 * ⚠ 그래서 이것은 **입력이 아니라 판독**이다. 엔진이 이미 만들어 둔 연간 행의 `assetValue` 를
 *   훑을 뿐이라 시뮬레이션 결과를 한 글자도 바꾸지 않는다 — 목표 자산을 엔진 입력으로 넣는 것과
 *   혼동하지 마라. 그쪽은 재투자·지급주기와 얽히는 진짜 엔진 변경이고, 이쪽은 순수 스캔이다.
 * ⚠ `assetTarget <= 0` 이면 첫 행에서 즉시 성립한다 — 호출부가 "미설정"을 따로 분기한다
 *   (`findTargetYear` 와 같은 계약).
 */
export const findAssetTargetYear = (
  rows: readonly SimulationResult[],
  assetTarget: number
): number | undefined => {
  return rows.find((row) => row.assetValue >= assetTarget)?.year;
};

/**
 * 종목별 연간 행을 **포트폴리오 한 줄로 합산**한다.
 *
 * 🔴 이 구현은 원래 **두 곳에 글자 그대로 복붙돼 있었다** — `SnowballScenarioRun`(커뮤니티 요약·
 * PDF 리포트 경로)과 `pages/Main/utils/simulation`(앱 화면 경로). 둘이 "같은 순서·같은 수식이라
 * 부동소수까지 동일하다"는 것을 **주석으로만** 보장하고 있었는데, 그건 한쪽을 고치는 순간 깨진다.
 * 같은 시나리오가 화면과 공유 카드에서 다른 숫자를 내는 종류의 버그라 구조로 막는다.
 *
 * 합산 규칙: 금액 항목은 단순 합, `monthlyDividend` 는 합산된 `annualDividend / 12`.
 * `year` 라벨은 첫 종목 것을 쓴다(모든 종목이 같은 시작일·기간을 공유한다).
 * ⚠ `price`/`shares`/`dividendPerShare` 는 종목 간 단위가 달라 여기서 다루지 않는다 — 그 항목까지
 *   필요한 월 해상도 합산은 `aggregateMonthly`(SnowballGoal)와 호출부가 따로 맡는다.
 */
export const aggregateYearly = (outputs: readonly SimulationOutput[]): SimulationResult[] =>
  outputs[0].yearly.map((baseRow, index) => {
    const merged = outputs.map((output) => output.yearly[index]);
    const annualDividend = sumBy(merged, (row) => row.annualDividend);

    return {
      year: baseRow.year,
      totalContribution: sumBy(merged, (row) => row.totalContribution),
      assetValue: sumBy(merged, (row) => row.assetValue),
      annualDividend,
      cumulativeDividend: sumBy(merged, (row) => row.cumulativeDividend),
      monthlyDividend: annualDividend / 12
    };
  });

export const sumDividendPaid = (rows: MonthlySnapshot[]): number => sumBy(rows, (row) => row.dividendPaid);

export const findLastPayoutMonth = (monthly: MonthlySnapshot[]): MonthlySnapshot | undefined =>
  [...monthly].reverse().find((row) => row.dividendPaid > 0);

export type YearlyRowParams = {
  /** 연간 행 라벨 (시작 연도 기준) */
  year: number;
  /** 해당 시점까지 경과한 월 수 */
  monthIndex: number;
  initialInvestment: number;
  monthlyContribution: number;
  assetValue: number;
  cumulativeDividend: number;
  /** 직전 12개월 스냅샷 (현재 월 포함) */
  recentMonths: MonthlySnapshot[];
};

export const buildYearlyRow = ({
  year,
  monthIndex,
  initialInvestment,
  monthlyContribution,
  assetValue,
  cumulativeDividend,
  recentMonths
}: YearlyRowParams): SimulationResult => {
  const annualDividend = sumDividendPaid(recentMonths);

  return {
    year,
    totalContribution: initialInvestment + (monthlyContribution * monthIndex),
    assetValue,
    annualDividend,
    cumulativeDividend,
    monthlyDividend: annualDividend / 12
  };
};

export type SummaryParams = {
  monthly: MonthlySnapshot[];
  yearly: SimulationResult[];
  totalTaxPaid: number;
  targetMonthlyDividend: number;
  /**
   * 배당금 중 **실제로 주식 재매수에 투입된** 누적 금액. 세후 배당으로 주식을 산 것이므로
   * 취득원가에 포함된다(이미 배당소득세를 낸 돈이라 양도세 계산에서 다시 이익으로 잡히면 안 된다).
   */
  totalReinvestedAmount: number;
  /**
   * 종료 시점 보유 기준 월 배당(세후). 🔴 **호출부가 계산해 넘긴다** — 이 함수는 월별 스냅샷만
   * 받는데 스냅샷에 세율이 없기 때문이다(세율은 종목마다 다르고 `runSimulation` 만 안다).
   * 정의와 다른 두 지표와의 차이는 `SimulationSummary.finalRunRateMonthlyDividend` 주석에 있다.
   */
  finalRunRateMonthlyDividend: number;
  /** ISA 종료 정산세. 호출부가 계좌 유형을 알고 계산해 넘긴다(요약은 계좌를 모른다). */
  isaSettlementTax: number;
};

/**
 * 단일 종목 시뮬레이션과 포트폴리오 합산 결과 양쪽에서 재사용 가능한 summary 조립기.
 * (합산 쪽은 종목별 totalTaxPaid 를 미리 더해서 넘기면 된다.)
 */
export const buildSummary = ({
  monthly,
  yearly,
  totalTaxPaid,
  targetMonthlyDividend,
  totalReinvestedAmount,
  finalRunRateMonthlyDividend,
  isaSettlementTax
}: SummaryParams): SimulationSummary => {
  const finalYear = yearly[yearly.length - 1];
  const lastPayoutRow = findLastPayoutMonth(monthly);

  const finalAssetValue = finalYear?.assetValue ?? 0;
  const totalContribution = finalYear?.totalContribution ?? 0;
  // 취득원가 = 내 돈으로 넣은 원금(초기 + 월 적립 누적) + 배당으로 다시 산 금액.
  const totalCostBasis = totalContribution + totalReinvestedAmount;

  return {
    finalAssetValue,
    finalAnnualDividend: finalYear?.annualDividend ?? 0,
    // finalMonthlyAverageDividend = 마지막 해 연 배당 / 12. (예전에는 같은 값이 finalMonthlyDividend
    // 라는 이름으로 한 번 더 들어 있었으나, 어떤 화면도 읽지 않는 중복 필드라 제거했다.)
    finalMonthlyAverageDividend: finalYear?.monthlyDividend ?? 0,
    finalPayoutMonthDividend: lastPayoutRow?.dividendPaid ?? 0,
    finalRunRateMonthlyDividend,
    isaSettlementTax,
    totalContribution,
    totalNetDividend: finalYear?.cumulativeDividend ?? 0,
    totalTaxPaid,
    targetMonthDividendReachedYear: findTargetYear(yearly, targetMonthlyDividend),
    totalCostBasis,
    ...computeCapitalGains({ finalAssetValue, totalCostBasis }),
    financialIncomeThresholdYear: findFinancialIncomeThresholdYear(monthly)
  };
};
