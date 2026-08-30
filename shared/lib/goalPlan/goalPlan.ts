/**
 * 목표에서 **거꾸로 세는** 계산 — 랜딩 첫 화면의 여섯 버튼이 쓴다.
 *
 * ## 🔴 계산 엔진(`shared/lib/snowball`)이 아니다
 * 그쪽은 포트폴리오·지급주기·재투자 타이밍까지 시뮬레이션한다. 여기는 **연금 미래가치 공식 하나**뿐이고
 * 종목을 모른다. 첫 화면에서 "얼마를 원하는가"에 즉답하는 것이 목적이라, 정밀도보다 **즉시성과
 * 설명 가능성**을 택했다.
 * ⚠ 그래서 이 값은 **어림**이다. 화면은 반드시 "가정"임을 함께 말해야 한다(투자 권유 금지 규율).
 *
 * ## 왜 월 복리인가
 * 사람은 월 단위로 넣는다. 연 복리로 계산하면 같은 조건에서 도달이 몇 달씩 늦게 나오는데,
 * 그 차이가 "10년이냐 11년이냐"를 가르기도 한다. 입금 주기와 복리 주기를 맞추는 편이 정직하다.
 */

/** 목표 자산까지 걸리는 **개월 수**. 도달할 수 없으면 `null`. */
export const monthsToReachAmount = (input: {
  /** 목표 금액(원). */
  target: number;
  /** 매달 넣는 금액(원). */
  monthlyContribution: number;
  /** 연 기대수익률(0.07 = 7%). */
  annualReturnRate: number;
  /** 이미 가진 금액(원). 기본 0. */
  initialAmount?: number;
}): number | null => {
  const { target, monthlyContribution, annualReturnRate, initialAmount = 0 } = input;

  if (!Number.isFinite(target) || target <= 0) return null;
  if (initialAmount >= target) return 0;
  if (!Number.isFinite(monthlyContribution) || monthlyContribution <= 0) return null;

  const monthlyRate = annualReturnRate / 12;

  /*
   * 🔴 수익률 0 을 따로 다룬다. 아래 로그 공식은 분모에 `ln(1+i)` 가 있어 i=0 이면 0으로 나눈다.
   *    이 경우는 단순 나눗셈이 정답이라 굳이 근사하지 않는다.
   */
  if (monthlyRate === 0) return (target - initialAmount) / monthlyContribution;

  /*
   * FV = initial·(1+i)^N + monthly·((1+i)^N − 1)/i  를 N 에 대해 푼 것.
   *
   *        ln( (target·i + monthly) / (initial·i + monthly) )
   *   N =  ────────────────────────────────────────────────
   *                        ln(1 + i)
   *
   * ⚠ 분모(`initial·i + monthly`)는 monthly > 0 이므로 항상 양수다 — 0으로 나눌 일이 없다.
   */
  const numerator = target * monthlyRate + monthlyContribution;
  const denominator = initialAmount * monthlyRate + monthlyContribution;

  const months = Math.log(numerator / denominator) / Math.log(1 + monthlyRate);
  return Number.isFinite(months) && months >= 0 ? months : null;
};

/**
 * 목표 **월 배당**을 받으려면 필요한 원금(원).
 *
 * 손에 쥐는 돈에서 세금을 되돌려 세전 배당을 구하고, 배당률로 나눈다.
 * ⚠ 세율은 호출부가 준다 — 일반 계좌(배당소득세 + 건보료)와 연금 계좌가 크게 다르고,
 *   그 선택은 계산이 아니라 **사용자의 상황**이다.
 */
export const principalForMonthlyDividend = (input: {
  /** 세후 목표 월 배당(원). */
  monthlyDividend: number;
  /** 배당률(0.04 = 4%). */
  dividendYield: number;
  /** 실효세율(0.154 = 15.4%). */
  taxRate: number;
}): number | null => {
  const { monthlyDividend, dividendYield, taxRate } = input;

  if (!Number.isFinite(monthlyDividend) || monthlyDividend <= 0) return null;
  if (!Number.isFinite(dividendYield) || dividendYield <= 0) return null;
  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate >= 1) return null;

  const annualPreTax = (monthlyDividend * 12) / (1 - taxRate);
  return annualPreTax / dividendYield;
};

/** 개월 수를 "N년 M개월"로. 화면이 그대로 쓴다. */
export const formatMonths = (months: number): string => {
  const rounded = Math.max(0, Math.round(months));
  const years = Math.floor(rounded / 12);
  const rest = rounded % 12;

  if (years === 0) return `${rest}개월`;
  if (rest === 0) return `${years}년`;
  return `${years}년 ${rest}개월`;
};
