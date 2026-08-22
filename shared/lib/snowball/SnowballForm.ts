import { z } from 'zod';
import type { SimulationInput, YieldFormValues } from '@/shared/types';
import type { YieldValidation } from '@/shared/types/snowball';
import { isCalendarDateInput } from './SnowballCalendar';
import { toExpectedTotalReturnPercent } from './SnowballRates';

/**
 * ⚠ 하위 호환: `'none'`(무배당)은 **나중에 추가된 값**이고, 유니온을 넓히기만 했다.
 * 이미 저장·공유된 페이로드의 네 값(`monthly`/`quarterly`/`semiannual`/`annual`)은 그대로 통과한다.
 * 좁히는 방향(값 제거·이름 변경)은 저장 데이터를 못 열게 만들므로 금지.
 */
const frequencySchema = z.enum(['monthly', 'quarterly', 'semiannual', 'annual', 'none']);
/* 계좌 유형. 값이 늘어날 때 여기와 `shared/constants/tax/accountType` 의 유니온을 함께 고친다. */
const accountTypeSchema = z.enum(['taxable', 'isa']);
const reinvestTimingSchema = z.enum(['sameMonth', 'nextMonth']);
const dpsGrowthModeSchema = z.enum(['annualStep', 'monthlySmooth']);
// 정규식만으로는 2026-02-31 / 2026-13-01 같은 "형식은 맞지만 실재하지 않는" 날짜가 통과한다.
// 달력 유효성까지 봐야 엔진이 잘못된 날짜를 받지 않는다.
const dateInputSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '투자 시작 날짜를 선택하세요.')
  .refine(isCalendarDateInput, '존재하지 않는 날짜입니다.');

// z.number() 는 Infinity 를 통과시킨다(NaN 만 막는다). 무한대가 엔진에 들어가면
// 주가·주식수가 전부 Infinity/NaN 으로 번지므로, 숫자 필드는 전부 .finite() 를 건다.
const formSchema = z.object({
  ticker: z.string().trim().min(1, '티커를 입력하세요.'),
  initialPrice: z.number().finite('현재 주가를 입력하세요.').positive('현재 주가는 0보다 커야 합니다.'),
  dividendYield: z.number().finite('배당률을 입력하세요.').min(0, '배당률은 0 이상이어야 합니다.').max(100, '배당률은 100 이하여야 합니다.'),
  // 음수 허용: 커버드콜 ETF의 NAV 침식/분배금 감소를 정직하게 표현하는 유일한 방법이다.
  // (정합 모델에서 dividendGrowth 는 주가 성장률이기도 하다.)
  dividendGrowth: z
    .number()
    .finite('배당 성장률을 입력하세요.')
    .min(-100, '배당 성장률은 -100 이상이어야 합니다.')
    .max(100, '배당 성장률은 100 이하여야 합니다.'),
  expectedTotalReturn: z
    .number()
    .finite('기대 총수익율 (CAGR)을 입력하세요.')
    .min(-100, '기대 총수익율 (CAGR)은 -100 이상이어야 합니다.')
    .max(100, '기대 총수익율 (CAGR)은 100 이하여야 합니다.'),
  frequency: frequencySchema,
  /**
   * 계좌 유형. **선택 입력**이라 기존 저장 페이로드·공유 링크가 그대로 통과한다(미지정 = 과세계좌).
   * 🔴 ISA 는 국내 상장 종목에만 고를 수 있다 — 그 제약은 화면(`isAccountTypeSelectable`)이 건다.
   *    스키마에서 막지 않는 이유: 이 스키마는 저장된 옛 데이터도 통과시켜야 하는 경계라,
   *    여기서 조합을 거절하면 남의 링크가 열리지 않는다.
   */
  accountType: accountTypeSchema.optional(),
  initialInvestment: z.number().finite('초기 투자금을 입력하세요.').min(0, '초기 투자금은 0 이상이어야 합니다.'),
  monthlyContribution: z.number().finite('월 투자금을 입력하세요.').min(0, '월 투자금은 0 이상이어야 합니다.'),
  targetMonthlyDividend: z.number().finite('목표 월배당을 입력하세요.').min(0, '목표 월배당은 0 이상이어야 합니다.'),
  investmentStartDate: dateInputSchema,
  durationYears: z.number().int('투자 기간은 정수여야 합니다.').min(1, '투자 기간은 1년 이상이어야 합니다.').max(60, '투자 기간은 60년 이하여야 합니다.'),
  reinvestDividends: z.boolean(),
  reinvestDividendPercent: z.number().min(0, '재투자 비율은 0 이상이어야 합니다.').max(100, '재투자 비율은 100 이하여야 합니다.'),
  taxRate: z.number().min(0, '세율은 0 이상이어야 합니다.').max(100, '세율은 100 이하여야 합니다.').optional(),
  reinvestTiming: reinvestTimingSchema,
  dpsGrowthMode: dpsGrowthModeSchema
});

/**
 * 티커 한 종목의 입력 계약. 폼 스키마에서 티커 필드만 떼어낸 것이므로
 * 엔진이 받아들이는 값과 UI 가 허용하는 값이 갈라질 수 없다.
 *
 * (갈라져 있었을 때: 모달은 `Number.isFinite` 만 봐서 주가 0 을 통과시켰고,
 *  엔진은 `positive()` 를 요구해서, 티커는 만들어지는데 결과 화면이 통째로 죽었다.)
 */
export const tickerInputSchema = formSchema.pick({
  ticker: true,
  initialPrice: true,
  dividendYield: true,
  dividendGrowth: true,
  expectedTotalReturn: true,
  frequency: true,
  accountType: true
});

/** 이 티커 입력이 엔진에 넣어도 되는 값인가. */
export const isValidTickerInput = (input: unknown): boolean => tickerInputSchema.safeParse(input).success;

/**
 * `Date` 를 `YYYY-MM-DD` 로 포맷한다. **로컬 달력 기준**이다.
 *
 * 예전에는 `toISOString().slice(0, 10)` 을 썼는데, 그건 UTC 기준이라
 * KST(UTC+9)에서 오전 9시 이전에 열면 기본 시작일이 **어제**로 잡혔다.
 */
export const toDateInputValue = (date: Date): string => {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/** 기본 종목. 세율 기본값이 여기서 파생되므로(상장지 판정) 바꾸면 세율도 함께 바뀐다. */
const DEFAULT_TICKER = 'SCHD';

/**
 * 기본 폼 값 팩토리. `today` 를 주입할 수 있어 순수하게 테스트된다.
 *
 * `defaultYieldFormValues` 는 여전히 **모듈 로드 시각**을 캡처한다 (하위호환 유지 — atom 초기값과
 * 영속 계층 기본값이 안정적인 참조를 기대한다). 자정을 넘겨 열어 둔 탭에서 기본 시작일이 어제로
 * 남는 한계는 그대로지만, UTC 로 인한 **하루 밀림은 사라졌다**.
 */
export const createDefaultYieldFormValues = (today: Date = new Date()): YieldFormValues => ({
  ticker: DEFAULT_TICKER,
  initialPrice: 100000,
  dividendYield: 3.5,
  // 정합 모델 전환: 기존 기본값(dy 3.5 / dg 6 / etr 8.5)은 dy + dg !== etr 로 자기모순이었다.
  // 마이그레이션 규칙(dy·etr 보존, dg 재계산)을 그대로 적용해 dg = 8.5 - 3.5 = 5 로 맞춘다.
  dividendGrowth: 5,
  expectedTotalReturn: 8.5,
  frequency: 'quarterly',
  initialInvestment: 0,
  monthlyContribution: 1000000,
  targetMonthlyDividend: 2000000,
  investmentStartDate: toDateInputValue(today),
  durationYears: 20,
  reinvestDividends: false,
  reinvestDividendPercent: 100,
  /*
   * 🔴 **비워 둔다**(2026-08-18 사용자 결정). 세율은 종목의 상장지에서 파생돼야 하고, 그 파생은
   * 엔진이 **미입력일 때만** 한다(`SnowballSimulation`: `settings.taxRate ?? resolveDefault…(ticker)`).
   *
   * 종전에는 여기서 `resolveDefaultDividendTaxRatePercent(DEFAULT_TICKER)` 로 **15 를 박아 넣었다.**
   * 그러면 폼·새 탭·저장 기본값이 전부 "사용자가 15 를 입력한 상태"가 되어 파생이 영원히 발동하지
   * 않았다 — **국내 상장 종목(`.KS`/`.KQ`)을 담아도 15.4% 가 아니라 15% 로 계산됐고**, 화면에도 15 로
   * 보여 사용자가 틀렸다는 단서를 얻을 수 없었다(2026-08-18 사용자 신고로 발견).
   *
   * 비워 두면 엔진이 **종목마다** 판정한다. 시뮬레이션은 프로필별로 호출되므로
   * (`pages/Main/utils/simulation.ts`) 미국 종목은 15%, 국내 종목은 15.4% 로 **한 포트폴리오 안에서
   * 동시에** 정확해진다 — 단일 숫자로는 표현할 수 없던 일이다.
   *
   * ⚠ `0` 은 미입력이 아니라 "0%"다(ISA·연금 표현). `??` 를 `||` 로 바꾸면 그 구분이 깨진다.
   * ⚠ 이미 저장된 데이터에는 15 가 명시로 남아 있다 — 그것을 자동으로 지우지 않는다(사용자가 일부러
   *   15 를 넣은 것과 구별할 방법이 없다). 화면의 힌트가 그 사실을 드러내는 역할을 한다
   *   (`InvestmentSettings` 의 세율 필드).
   */
  taxRate: undefined,
  reinvestTiming: 'sameMonth',
  dpsGrowthMode: 'monthlySmooth'
});

export const defaultYieldFormValues: YieldFormValues = createDefaultYieldFormValues();

/**
 * 폼 검증.
 *
 * 🔴 `fields` 를 함께 낸다(2026-08-22). 전에는 zod 의 `issue.message` 만 남기고 `issue.path` 를
 * **버리고 있었다.** 그래서 `validation_error_view` 계측이 "몇 개 틀렸다"만 알고 "무엇이 틀렸다"는
 * 몰랐다 — GA4 실측에서 45건 전부 `field_name=(not set)` 이었고, 그 이벤트의 선언된 용도
 * ("이탈 유발 입력 항목 식별")를 달성할 수 없는 상태였다.
 *
 * ⚠ `errors` 의 모양은 **바꾸지 않았다.** 화면 여러 곳이 그 배열을 그대로 그리므로, 타입을 바꾸면
 *   계측 하나를 고치려고 렌더 경로 전체를 건드리게 된다. 그래서 가법적으로 더했다.
 * ⚠ `path[0]` 만 쓴다. 중첩 필드는 아직 없고, 생기면 그때 `join('.')` 로 넓혀라.
 */
export const validateFormValues = (values: YieldFormValues): YieldValidation => {
  const parsed = formSchema.safeParse(values);

  if (parsed.success) {
    return { isValid: true, errors: [], fields: [] };
  }

  return {
    isValid: false,
    errors: parsed.error.issues.map((issue) => issue.message),
    // 같은 필드에 규칙이 둘 이상 걸리면 이슈도 둘이 된다 — 계측에서는 한 번만 센다.
    fields: [...new Set(parsed.error.issues.map((issue) => String(issue.path[0] ?? 'unknown')))]
  };
};

export const toSimulationInput = (values: YieldFormValues): SimulationInput => ({
  ticker: {
    ticker: values.ticker,
    initialPrice: values.initialPrice,
    dividendYield: values.dividendYield,
    dividendGrowth: values.dividendGrowth,
    // 파생 표시값이므로 폼에 남아 있는 값을 믿지 않고 항상 다시 계산한다 (엔진은 쓰지 않는다).
    expectedTotalReturn: toExpectedTotalReturnPercent(values.dividendYield, values.dividendGrowth),
    frequency: values.frequency,
    accountType: values.accountType
  },
  settings: {
    initialInvestment: values.initialInvestment,
    monthlyContribution: values.monthlyContribution,
    targetMonthlyDividend: values.targetMonthlyDividend,
    investmentStartDate: values.investmentStartDate,
    durationYears: values.durationYears,
    reinvestDividends: values.reinvestDividends,
    reinvestDividendPercent: values.reinvestDividendPercent,
    taxRate: values.taxRate,
    reinvestTiming: values.reinvestTiming,
    dpsGrowthMode: values.dpsGrowthMode
  }
});
