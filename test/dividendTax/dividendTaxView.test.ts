import { describe, expect, it } from 'vitest';
import { buildAccountComparison, buildResultCards } from '@/pages/DividendTax/components';
import { calculateDividendTax, type DividendTaxInput } from '@/shared/lib/dividendTax';

/**
 * 세금 계산기 화면 모델(2026-11-13 리팩터 — 페이지에서 순수 함수로 뺐다). 잠그는 것:
 * ① 계좌 비교 — 일반계좌보다 싼 계좌만 강조, 절감액 = 일반 − 최저
 * ② 연금계좌가 피하는 부담은 위 결과 카드에서 실제로 생긴 것만 이름으로
 * ③ 결과 카드 3장의 순서·상태(배지 색은 tone 이 정한다)
 */
const base: DividendTaxInput = {
  usDividendAnnual: 0,
  otherFinancialAnnual: 0,
  otherTaxBase: 0,
  health: 'regional',
  otherIncomeForDependent: 0,
  isaSeomin: false
};
const at = (overrides: Partial<DividendTaxInput>) => calculateDividendTax({ ...base, ...overrides });

describe('계좌 비교 모델', () => {
  it('🔴 연 1,000만원: 일반 154만 · ISA 79.2만 · 연금 55만 → 연금계좌가 최저, 99만원 절감', () => {
    const c = buildAccountComparison(at({ usDividendAnnual: 10_000_000 }));
    expect(c.rows.map((row) => [row.id, row.tax])).toEqual([
      ['general', 1_540_000],
      ['isa', 792_000],
      ['pension', 550_000]
    ]);
    expect(c.best?.id).toBe('pension');
    expect(c.saving).toBe(990_000);
    expect(c.rows[2]!.label).toContain('5.5%');
  });

  it('배당이 0이면 강조할 계좌도 피하는 부담도 없다', () => {
    const c = buildAccountComparison(at({}));
    expect(c.best).toBeNull();
    expect(c.saving).toBe(0);
    expect(c.pensionAvoids).toEqual([]);
  });

  it('🔴 연금계좌가 피하는 부담 — 지역 보험료 증가 · 종합과세(연 2,400만원), 피부양자 탈락(피부양자일 때)', () => {
    expect(buildAccountComparison(at({ usDividendAnnual: 24_000_000 })).pensionAvoids).toEqual([
      '건강보험료 증가(월 162,695원)',
      '금융소득종합과세'
    ]);
    expect(buildAccountComparison(at({ usDividendAnnual: 24_000_000, health: 'dependent' })).pensionAvoids).toEqual([
      '피부양자 탈락',
      '금융소득종합과세'
    ]);
  });

  it('연 1,500만원 초과면 연금계좌 칸 라벨이 16.5% 로 바뀐다', () => {
    expect(buildAccountComparison(at({ usDividendAnnual: 24_000_000 })).rows[2]!.label).toContain('16.5%');
  });
});

describe('결과 카드 모델', () => {
  it('세 장 — 원천징수 뒤 · 종합과세 · 건강보험 순서', () => {
    const cards = buildResultCards(at({ usDividendAnnual: 18_000_000 }));
    expect(cards.map((card) => card.eyebrow)).toEqual([
      '미국 원천징수 15% 뒤 손에 쥐는 배당',
      '금융소득종합과세',
      '늘어나는 월 건강보험료'
    ]);
    expect(cards[0]!.value).toBe('월 128만원');
    expect(cards[1]).toMatchObject({ value: '대상 아님', tone: 'ok' });
    expect(cards[2]).toMatchObject({ value: '월 +122,021원', tone: 'warn', badge: '지역가입자' });
  });

  it('피부양자면 건강보험 카드가 자격 판정으로 바뀐다', () => {
    const card = buildResultCards(at({ usDividendAnnual: 36_000_000, health: 'dependent' }))[2]!;
    expect(card).toMatchObject({ eyebrow: '건강보험 피부양자', value: '탈락 가능', tone: 'warn', badge: '소득요건 초과' });
  });

  it('보수 외 소득 2,000만원 이하 직장가입자는 "변화 없음"', () => {
    expect(buildResultCards(at({ usDividendAnnual: 12_000_000, health: 'employee' }))[2]).toMatchObject({
      value: '변화 없음',
      tone: 'ok'
    });
  });
});
