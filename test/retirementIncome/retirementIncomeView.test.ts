import { describe, expect, it } from 'vitest';
import { buildStageView, stageScale } from '@/pages/RetirementIncome/components';
import { DEFAULT_RETIREMENT_FORM, taxCalculatorHref, toRetirementInput } from '@/pages/RetirementIncome/RetirementIncomePage';
import { formFromSearch } from '@/shared/lib/dividendTax';
import { calculateRetirementIncome } from '@/shared/lib/retirementIncome';

/**
 * 은퇴 후 월 소득 화면 모델(2026-11-13 리팩터 — 페이지에서 순수 함수로 뺐다). 잠그는 것:
 * ① 입력 문자열 → 엔진 입력 단위(만원→원, %→소수) ② 세금 계산기로 넘기는 주소가 그쪽 정본으로 되읽힌다
 * ③ 구간 한 줄 — 모든 구간이 같은 자(scale)로 그려지고, 0 인 수입원은 막대·내역에서 빠진다
 */
describe('입력 → 엔진 입력', () => {
  it('기본값: 만원은 원으로, 수익률 % 는 소수로', () => {
    expect(toRetirementInput(DEFAULT_RETIREMENT_FORM)).toEqual({
      retireAge: 60,
      targetMonthly: 3_000_000,
      npsMonthly: 1_000_000,
      npsStartAge: 65,
      accountBalance: 100_000_000,
      accountStartAge: 60,
      accountYears: 20,
      accountReturn: 0.03,
      dividendMonthly: 1_000_000
    });
  });

  it('🔴 세금 계산기 주소 — 배당 월액 · 피부양자 · 국민연금 연액이 그쪽 정본(formFromSearch)으로 되읽힌다', () => {
    const href = taxCalculatorHref(DEFAULT_RETIREMENT_FORM);
    expect(href.startsWith('/dividend/tax?')).toBe(true);
    const form = formFromSearch(href.slice(href.indexOf('?')));
    expect(form).toMatchObject({ monthlyUs: '100', health: 'dependent', otherIncomeForDependent: '1200' });
  });
});

describe('구간 한 줄', () => {
  const result = calculateRetirementIncome({ ...toRetirementInput(DEFAULT_RETIREMENT_FORM), accountReturn: 0 });
  const target = 3_000_000;
  const scale = stageScale(result.stages, target);

  it('자 = max(목표, 가장 큰 합계) — 목표 300만원이 합계보다 크면 목표가 자다', () => {
    expect(scale).toBe(3_000_000);
    expect(stageScale([], 0)).toBe(1);
  });

  it('60~64세: 연금계좌 + 배당만 막대에, 내역에 세율, 목표 대비 모자람', () => {
    const view = buildStageView(result.stages[0]!, scale, target);
    expect(view.range).toBe('60~64세');
    expect(view.segments.map((s) => s.source)).toEqual(['account', 'dividend']);
    expect(view.segments[1]!.share).toBeCloseTo(850_000 / 3_000_000, 6);
    expect(view.breakdown).toBe('연금계좌 39만원 + 배당 85만원 · 연금소득세 5.5%');
    expect(view.gap).toEqual({ label: '목표보다 월 176만원 모자람', tone: 'short' });
    expect(view.targetAt).toBe(1);
  });

  it('마지막 구간은 "N세부터", 목표가 0이면 목표선·부족액을 말하지 않는다', () => {
    const last = buildStageView(result.stages.at(-1)!, scale, 0);
    expect(last.range).toBe('80세부터');
    expect(last.gap).toBeNull();
    expect(last.targetAt).toBeNull();
  });
});
