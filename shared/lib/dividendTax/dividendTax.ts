/**
 * 미국 배당 세금·건강보험료 계산 — **순수 함수**(2026-11-12).
 *
 * 🔴 상수의 정본은 `docs/tax-health-rules-2026.md` 다. 여기 숫자를 바꾸려면 그 문서를 먼저 고친다.
 * 확인하지 못한 규칙은 **불리한 쪽(보수적)** 으로 계산하고, 결과에 `estimated` 로 표시한다 — 화면이 "추정"을
 * 붙여 말한다(2026-11-12 사용자 승인 방침).
 *
 * 다루는 범위(1차): 미국 원천징수 15% · 금융소득종합과세(비교과세) · 건강보험(피부양자 / 지역 / 직장) ·
 * 일반계좌 vs ISA 세금. 계산 예시이며 세무 자문이 아니다.
 */

// ── 상수 (docs/tax-health-rules-2026.md) ─────────────────────────────────────
export const DIVIDEND_TAX_RULES = {
  basisDate: '2026-11-11',
  usWithholding: 0.15,
  krNationalRate: 0.14,
  krLocalMultiplier: 0.1,
  krWithholdingTotal: 0.154,
  financialIncomeThreshold: 20_000_000,
  /** 종합소득세 누진세율 — [과세표준 상한, 세율, 누진공제]. 마지막 상한은 무한. */
  brackets: [
    [14_000_000, 0.06, 0],
    [50_000_000, 0.15, 1_260_000],
    [88_000_000, 0.24, 5_760_000],
    [150_000_000, 0.35, 15_440_000],
    [300_000_000, 0.38, 19_940_000],
    [500_000_000, 0.4, 25_940_000],
    [1_000_000_000, 0.42, 35_940_000],
    [Number.POSITIVE_INFINITY, 0.45, 65_940_000]
  ] as const,
  isaTaxFreeGeneral: 2_000_000,
  isaTaxFreeSeomin: 4_000_000,
  isaExcessRate: 0.099,
  nhiRate: 0.0719,
  ltcRatioOfNhi: 0.1314,
  nhiLocalFinancialExclude: 10_000_000,
  nhiDependentIncomeLimit: 20_000_000,
  nhiEmployeeExtraIncomeDeduct: 20_000_000
} as const;

const R = DIVIDEND_TAX_RULES;

/** 종합소득 과세표준 → 산출세액(누진). 음수·0 은 0. */
export const progressiveTax = (taxBase: number): number => {
  if (!(taxBase > 0)) return 0;
  for (const [ceiling, rate, deduction] of R.brackets) {
    if (taxBase <= ceiling) return Math.max(0, taxBase * rate - deduction);
  }
  return 0;
};

export type HealthInsuranceStatus = 'employee' | 'regional' | 'dependent';

export type DividendTaxInput = {
  /** 미국 주식·ETF 배당, 연간 세전(원). 국내 증권사 일반계좌. */
  readonly usDividendAnnual: number;
  /** 그 밖의 금융소득(예금 이자·국내 배당 등), 연간 세전(원). */
  readonly otherFinancialAnnual: number;
  /** 다른 종합소득의 과세표준(근로·사업 등 공제 후, 원). 모르면 0. */
  readonly otherTaxBase: number;
  readonly health: HealthInsuranceStatus;
  /** 피부양자 판정에 더할 다른 소득(공적연금 100%·근로·사업 등, 연간 원). */
  readonly otherIncomeForDependent: number;
  /** ISA 비교에서 서민형(비과세 400만원)인가. */
  readonly isaSeomin: boolean;
};

export type DividendTaxResult = {
  readonly financialIncome: number;
  readonly usWithheld: number;
  readonly usNetAfterWithholding: number;
  /** 금융소득종합과세 대상인가(연 2,000만원 초과). */
  readonly comprehensive: boolean;
  /** 종합과세로 더 낼 세금(국세+지방세, 추정). 대상이 아니면 0. */
  readonly extraIncomeTax: number;
  readonly health: {
    readonly status: HealthInsuranceStatus;
    /** 피부양자일 때: 소득요건(연 2,000만원)을 넘는가. 다른 상태면 null. */
    readonly dependentLost: boolean | null;
    /** 배당 때문에 늘어나는 월 보험료(건강+장기요양, 원). */
    readonly monthlyIncrease: number;
    /** 보험료에 반영되는 연 금융소득(원). */
    readonly countedIncome: number;
  };
  readonly isa: {
    /** 같은 배당을 일반계좌(국내 상장 미국 ETF)에서 받을 때 세금(15.4%, 보수 가정). */
    readonly generalTax: number;
    /** ISA 안에서 받을 때 세금(비과세 한도 초과분 9.9%). */
    readonly isaTax: number;
    readonly taxFreeLimit: number;
  };
  /** 확인 못 한 규칙을 보수적으로 쓴 항목들 — 화면이 "추정"을 붙인다. */
  readonly estimated: readonly ('comprehensive' | 'dependent' | 'isa')[];
};

const won = (value: number): number => Math.max(0, Math.round(value));

export const calculateDividendTax = (input: DividendTaxInput): DividendTaxResult => {
  const us = Math.max(0, input.usDividendAnnual);
  const other = Math.max(0, input.otherFinancialAnnual);
  const otherBase = Math.max(0, input.otherTaxBase);
  const financialIncome = us + other;

  const usWithheld = us * R.usWithholding;
  const comprehensive = financialIncome > R.financialIncomeThreshold;

  // 비교과세(소득세법 §62): max(① 2천만×14% + 누진(다른 과표 + 초과분), ② 전액×14% + 누진(다른 과표)).
  // 금융소득 몫의 산출세액 = 위 값 − 누진(다른 과표). 이미 낸 세금(미국 15% + 국내 14%)을 빼고 남는 것이 추가분.
  // ⚠ 외국납부세액공제 한도 산식은 미확인 — 미국 원천세를 그 몫 산출세액 안에서 전액 공제한다고 보면
  //   과소 추정이 될 수 있어 "추정"으로 표시한다.
  let extraIncomeTax = 0;
  if (comprehensive) {
    const baseTax = progressiveTax(otherBase);
    const methodA = R.financialIncomeThreshold * R.krNationalRate + progressiveTax(otherBase + financialIncome - R.financialIncomeThreshold);
    const methodB = financialIncome * R.krNationalRate + baseTax;
    const financialShare = Math.max(methodA, methodB) - baseTax;
    const alreadyPaid = usWithheld + other * R.krNationalRate;
    const extraNational = Math.max(0, financialShare - alreadyPaid);
    extraIncomeTax = extraNational * (1 + R.krLocalMultiplier);
  }

  // 건강보험 — 보험료율 × (1 + 장기요양 비율).
  const premiumRate = R.nhiRate * (1 + R.ltcRatioOfNhi);
  let dependentLost: boolean | null = null;
  let countedIncome = 0;
  if (input.health === 'dependent') {
    // ⚠ 금융소득 1,000만원 이하 제외 여부 미확인 → 전액 합산(보수).
    dependentLost = financialIncome + Math.max(0, input.otherIncomeForDependent) > R.nhiDependentIncomeLimit;
  } else if (input.health === 'regional') {
    // 시행규칙 §44: 분리과세 금융소득 1,000만원 이하면 미반영, 넘으면 전액. 종합과세 대상이면 당연히 전액.
    countedIncome = financialIncome > R.nhiLocalFinancialExclude ? financialIncome : 0;
  } else {
    // 직장가입자 소득월액보험료: 보수 외 소득 − 2,000만원.
    countedIncome = Math.max(0, financialIncome - R.nhiEmployeeExtraIncomeDeduct);
  }
  const monthlyIncrease = input.health === 'dependent' ? 0 : (countedIncome / 12) * premiumRate;

  const taxFreeLimit = input.isaSeomin ? R.isaTaxFreeSeomin : R.isaTaxFreeGeneral;

  return {
    financialIncome: won(financialIncome),
    usWithheld: won(usWithheld),
    usNetAfterWithholding: won(us - usWithheld),
    comprehensive,
    extraIncomeTax: won(extraIncomeTax),
    health: {
      status: input.health,
      dependentLost,
      monthlyIncrease: won(monthlyIncrease),
      countedIncome: won(countedIncome)
    },
    isa: {
      generalTax: won(us * R.krWithholdingTotal),
      isaTax: won(Math.max(0, us - taxFreeLimit) * R.isaExcessRate),
      taxFreeLimit
    },
    estimated: [...(comprehensive ? (['comprehensive'] as const) : []), ...(input.health === 'dependent' ? (['dependent'] as const) : []), 'isa']
  };
};
