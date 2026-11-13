import { describe, expect, it } from 'vitest';
import { calculateRetirementIncome, monthlyPayout, type RetirementIncomeInput } from '@/shared/lib/retirementIncome';

/**
 * 은퇴 후 월 소득(2026-11-13). 숫자는 손으로 계산해 적었다(주석). 잠그는 것:
 * ① 수입원이 켜지고 꺼지는 나이마다 구간이 나뉜다 ② 연금계좌는 55세 전에 못 받는다
 * ③ 연금계좌 세율은 나이(70·80)와 연 1,500만원 기준을 따른다 ④ 건보는 공적연금 + 금융소득(세금 계산기와 같은 규칙)
 */
const base: RetirementIncomeInput = {
  retireAge: 60,
  targetMonthly: 3_000_000,
  npsMonthly: 1_000_000,
  npsStartAge: 65,
  accountBalance: 100_000_000,
  accountStartAge: 60,
  accountYears: 20,
  accountReturn: 0,
  dividendMonthly: 1_000_000
};

describe('은퇴 후 월 소득', () => {
  it('🔴 구간: 60~64 (연금계좌+배당) → 65~69 (+국민연금) → 70~79 (연금계좌 세율 4.4%) → 80~ (연금계좌 끝)', () => {
    const { stages, accountMonthlyGross } = calculateRetirementIncome(base);
    expect(accountMonthlyGross).toBe(416_667); // 1억 ÷ 240개월
    expect(stages.map((s) => [s.fromAge, s.toAge])).toEqual([
      [60, 64],
      [65, 69],
      [70, 79],
      [80, null]
    ]);
    // 60~64: 연금계좌 416,666.67 × 0.945 = 393,750 · 배당 100만 × 0.85 = 850,000
    expect(stages[0]).toMatchObject({ nps: 0, account: 393_750, dividend: 850_000, total: 1_243_750, gap: -1_756_250, accountTaxRate: 0.055 });
    expect(stages[1]).toMatchObject({ nps: 1_000_000, total: 2_243_750, gap: -756_250 });
    // 70~79: 416,666.67 × 0.956 = 398,333.33
    expect(stages[2]).toMatchObject({ account: 398_333, total: 2_248_333, gap: -751_667, accountTaxRate: 0.044 });
    expect(stages[3]).toMatchObject({ account: 0, total: 1_850_000, gap: -1_150_000, accountTaxRate: null });
  });

  it('🔴 건보: 국민연금 연 1,200만 + 배당 연 1,200만 = 2,400만 > 2,000만 → 피부양자 탈락, 지역 소득분 월 122,021원', () => {
    // 지역: 600만(공적연금 50%) + 1,200만(금융소득 1,000만 초과 → 전액) = 1,800만 → 150만 × 7.19% × 1.1314
    expect(calculateRetirementIncome(base).health).toEqual({
      fromAge: 65,
      dependentLost: true,
      dependentIncome: 24_000_000,
      regionalMonthly: 122_021
    });
    // 배당 월 80만(연 960만, 1,000만 이하 → 지역 미반영) + 국민연금 1,200만 = 2,160만 → 여전히 탈락, 지역은 600만만
    const small = calculateRetirementIncome({ ...base, dividendMonthly: 800_000 }).health!;
    expect(small.dependentLost).toBe(true);
    expect(small.regionalMonthly).toBe(40_674); // 50만 × 0.0719 × 1.1314 = 40,673.83
    expect(calculateRetirementIncome({ ...base, dividendMonthly: 600_000 }).health!.dependentLost).toBe(false); // 1,200 + 720 = 1,920만
  });

  it('연금계좌는 55세 전에 받지 못한다 — 50세 은퇴면 50~54는 배당만', () => {
    const { stages, accountStartAge } = calculateRetirementIncome({ ...base, retireAge: 50, accountStartAge: 50 });
    expect(accountStartAge).toBe(55);
    expect(stages[0]).toMatchObject({ fromAge: 50, toAge: 54, account: 0, nps: 0, total: 850_000 });
    expect(stages[1]).toMatchObject({ fromAge: 55, accountTaxRate: 0.055 });
  });

  it('연금계좌 연 수령액이 1,500만원을 넘으면 모든 구간 16.5%', () => {
    // 3억 ÷ 240 = 125만/월 = 연 1,500만 → 딱 기준이면 나이별. 3억 1,200만이면 연 1,560만 → 16.5%
    expect(calculateRetirementIncome({ ...base, accountBalance: 300_000_000 }).stages[0]!.accountTaxRate).toBe(0.055);
    const over = calculateRetirementIncome({ ...base, accountBalance: 312_000_000 }).stages;
    expect(over.filter((s) => s.accountTaxRate !== null).every((s) => s.accountTaxRate === 0.165)).toBe(true);
  });

  it('원리금 균등 — 받는 돈의 현재가치 합 = 적립금(수익률 3%, 10년)', () => {
    const pmt = monthlyPayout(100_000_000, 10, 0.03);
    const r = Math.pow(1.03, 1 / 12) - 1;
    let pv = 0;
    for (let m = 1; m <= 120; m += 1) pv += pmt / Math.pow(1 + r, m);
    expect(pv).toBeCloseTo(100_000_000, 0);
    expect(monthlyPayout(100_000_000, 10, 0)).toBeCloseTo(833_333.33, 1);
  });

  it('수입원이 없으면 건보 판정도 없다, 배당 연 2,000만원 초과는 종합과세 가능성을 알린다', () => {
    expect(calculateRetirementIncome({ ...base, npsMonthly: 0, dividendMonthly: 0 }).health).toBeNull();
    expect(calculateRetirementIncome({ ...base, dividendMonthly: 1_700_000 }).dividendComprehensive).toBe(true);
    expect(calculateRetirementIncome(base).dividendComprehensive).toBe(false);
  });
});
