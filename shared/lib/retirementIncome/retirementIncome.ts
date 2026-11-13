import { DIVIDEND_TAX_RULES } from '../dividendTax';

/**
 * 은퇴 후 월 소득 — **순수 함수**(2026-11-13).
 *
 * 40~50대가 묻는 것은 "얼마나 불어나나"가 아니라 "은퇴하면 매달 얼마가 들어오나"다. 그 돈은 보통 세 갈래다 —
 * 국민연금(65세 전후부터, 평생) · 연금저축·IRP(55세 이후, 정한 기간) · 배당(일반계좌, 계속). 셋은 시작 나이가
 * 달라서 **나이 구간마다 합이 바뀐다**. 이 함수는 그 구간을 나눠 각 구간의 월 소득과 목표 대비 차이를 낸다.
 *
 * 🔴 세율·건보 기준은 세금 계산기 정본(`shared/lib/dividendTax/RULES.md`)의 상수를 그대로 쓴다 — 두 계산기가
 *    다른 숫자를 말하면 안 된다.
 *  - 국민연금은 **세전** 그대로 둔다(공적연금 원천징수는 간이세액표라 이 계산기 범위 밖 — 화면이 "세전"을 밝힌다).
 *  - 연금계좌: 연 수령액 ≤ 1,500만원이면 나이별 연금소득세(5.5/4.4/3.3%), 넘으면 16.5%(분리과세 선택, 보수).
 *    세액공제를 안 받은 원금 부분의 비과세는 반영하지 않는다(보수).
 *  - 배당: 미국 원천징수 15% 뒤 금액. 연 금융소득 2,000만원을 넘으면 종합과세 가능성을 따로 알린다.
 *  - 건보(국민연금이 나온 뒤): 피부양자 = 공적연금 100% + 금융소득 전액 > 2,000만원이면 탈락(보수).
 *    지역 소득분 = 공적연금 50% + 금융소득(1,000만원 넘으면 전액). **재산 점수는 뺀다**(화면이 밝힌다).
 *    사적연금(연금저축·IRP) 수령액은 건보 계산에 넣지 않는다(⚠ RULES.md §5 — 2차 자료).
 * 금액 단위는 원. 나이는 만 나이 정수.
 */

const R = DIVIDEND_TAX_RULES;
export const RETIREMENT_PLAN_END_AGE = 90;
/** 연금계좌에서 연금으로 받을 수 있는 최소 나이. */
export const PENSION_ACCOUNT_MIN_AGE = 55;

export type RetirementIncomeInput = {
  readonly retireAge: number;
  /** 목표 월 생활비(원). */
  readonly targetMonthly: number;
  /** 국민연금 예상 월액(세전, 원). */
  readonly npsMonthly: number;
  readonly npsStartAge: number;
  /** 연금계좌(연금저축·IRP) — 연금 받기 시작할 때의 예상 적립금(원). */
  readonly accountBalance: number;
  readonly accountStartAge: number;
  /** 나눠 받는 기간(년). */
  readonly accountYears: number;
  /** 받는 동안 남은 돈의 연 수익률(소수, 0.03 = 3%). */
  readonly accountReturn: number;
  /** 일반계좌 배당 월액(세전, 원). */
  readonly dividendMonthly: number;
};

export type RetirementStage = {
  readonly fromAge: number;
  /** 구간의 마지막 나이. null 이면 "이후 계속". */
  readonly toAge: number | null;
  readonly nps: number;
  /** 연금계좌 월 수령액(세후). */
  readonly account: number;
  /** 배당 월액(미국 원천징수 뒤). */
  readonly dividend: number;
  readonly total: number;
  /** 목표 대비(양수 = 남음, 음수 = 모자람). */
  readonly gap: number;
  /** 이 구간의 연금계좌 세율(받지 않으면 null). */
  readonly accountTaxRate: number | null;
};

export type RetirementIncomeResult = {
  readonly stages: readonly RetirementStage[];
  /** 연금계좌 월 수령액(세전). */
  readonly accountMonthlyGross: number;
  /** 연금계좌를 실제로 받기 시작하는 나이(55세 미만이면 55세로 당긴다). */
  readonly accountStartAge: number;
  /** 배당만으로 연 금융소득 2,000만원을 넘는가 — 종합과세 가능성. */
  readonly dividendComprehensive: boolean;
  /** 국민연금이 나온 뒤의 건강보험. 국민연금이 0 이고 배당도 0 이면 null. */
  readonly health: {
    readonly fromAge: number;
    /** 피부양자 소득요건(공적연금 + 금융소득 연 2,000만원)을 넘는가. */
    readonly dependentLost: boolean;
    /** 판정에 쓴 연 소득(공적연금 100% + 금융소득). */
    readonly dependentIncome: number;
    /** 지역가입자 소득분 월 보험료(건강+장기요양, 재산 제외, 원). */
    readonly regionalMonthly: number;
  } | null;
};

const won = (value: number): number => Math.max(0, Math.round(value));

/** 원리금 균등 — 적립금을 n 개월에 나눠 받되 남은 돈은 월 복리로 굴린다. */
export const monthlyPayout = (balance: number, years: number, annualReturn: number): number => {
  const months = Math.round(years * 12);
  if (!(balance > 0) || months <= 0) return 0;
  const r = Math.pow(1 + Math.max(0, annualReturn), 1 / 12) - 1;
  return r === 0 ? balance / months : (balance * r) / (1 - Math.pow(1 + r, -months));
};

const accountRateAt = (age: number, annualGross: number): number => {
  if (annualGross > R.pensionSeparateThreshold) return R.pensionSeparateRate;
  return age >= 80 ? R.pensionRates.from80 : age >= 70 ? R.pensionRates.from70 : R.pensionRates.under70;
};

export const calculateRetirementIncome = (input: RetirementIncomeInput): RetirementIncomeResult => {
  const retireAge = Math.max(0, Math.round(input.retireAge));
  const npsStart = Math.round(input.npsStartAge);
  const accountStart = Math.max(PENSION_ACCOUNT_MIN_AGE, Math.round(input.accountStartAge));
  const accountGross = monthlyPayout(input.accountBalance, input.accountYears, input.accountReturn);
  const accountEnd = accountGross > 0 ? accountStart + Math.round(input.accountYears) : accountStart; // 이 나이부터 끊긴다
  const npsMonthly = Math.max(0, input.npsMonthly);
  const dividendGross = Math.max(0, input.dividendMonthly);
  const dividendNet = dividendGross * (1 - R.usWithholding);

  // 구간 경계 — 수입원이 켜지거나 꺼지는 나이, 연금계좌 세율이 바뀌는 70·80세.
  const cuts = new Set<number>([retireAge]);
  const addCut = (age: number) => {
    if (age > retireAge && age < RETIREMENT_PLAN_END_AGE) cuts.add(age);
  };
  if (npsMonthly > 0) addCut(npsStart);
  if (accountGross > 0) {
    addCut(accountStart);
    addCut(accountEnd);
    for (const age of [70, 80]) if (age > accountStart && age < accountEnd) addCut(age);
  }
  const starts = [...cuts].sort((a, b) => a - b);

  const stages: RetirementStage[] = starts.map((fromAge, index) => {
    const next = starts[index + 1];
    const nps = npsMonthly > 0 && fromAge >= npsStart ? npsMonthly : 0;
    const accountOn = accountGross > 0 && fromAge >= accountStart && fromAge < accountEnd;
    const rate = accountOn ? accountRateAt(fromAge, accountGross * 12) : null;
    const account = accountOn ? accountGross * (1 - rate!) : 0;
    const total = nps + account + dividendNet;
    return {
      fromAge,
      toAge: next === undefined ? null : next - 1,
      nps: won(nps),
      account: won(account),
      dividend: won(dividendNet),
      total: won(total),
      gap: Math.round(total - Math.max(0, input.targetMonthly)),
      accountTaxRate: rate
    };
  });

  const dividendAnnual = dividendGross * 12;
  const npsAnnual = npsMonthly * 12;
  const healthFrom = npsMonthly > 0 ? Math.max(retireAge, npsStart) : retireAge;
  const health =
    npsAnnual + dividendAnnual > 0
      ? (() => {
          const dependentIncome = npsAnnual + dividendAnnual;
          const financialCounted = dividendAnnual > R.nhiLocalFinancialExclude ? dividendAnnual : 0;
          const counted = npsAnnual * R.nhiWagePensionRatio + financialCounted;
          return {
            fromAge: healthFrom,
            dependentLost: dependentIncome > R.nhiDependentIncomeLimit,
            dependentIncome: won(dependentIncome),
            regionalMonthly: won((counted / 12) * R.nhiRate * (1 + R.ltcRatioOfNhi))
          };
        })()
      : null;

  return {
    stages,
    accountMonthlyGross: won(accountGross),
    accountStartAge: accountStart,
    dividendComprehensive: dividendAnnual > R.financialIncomeThreshold,
    health
  };
};
