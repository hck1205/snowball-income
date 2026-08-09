// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import {
  CLASSIFY_RULE_HEADERS,
  classifyLedgerRow,
  formatClassifyRuleRow,
  isBackfillable,
  isCountable,
  parseClassifyRules,
  sortRulesBySpecificity
} from '@/shared/lib/ledger';
import type { LedgerClassifyRule } from '@/shared/lib/ledger';
import { LEDGER_CATEGORIES, LEDGER_FIXITY_LABEL } from '@/shared/constants/ledger';

/**
 * 분류 사다리 — **적지 않은 칸을 히포가 채우는** 규칙.
 *
 * 🔴 여기서 잠그는 것은 "얼마나 잘 맞추나"가 아니라 **"틀렸을 때 조용하지 않은가"** 다.
 *    잘못 채운 분류는 사용자 기록을 오염시키고, 오염된 사실이 안 보이면 영영 안 고쳐진다.
 */

const 카페 = LEDGER_CATEGORIES.flatMap((category) =>
  category.subcategories.map((sub) => ({ category, sub }))
).find(({ sub }) => sub.label.includes('카페') || sub.label.includes('외식'));

describe('사다리 0단 — 시트에 적혀 있으면 건드리지 않는다', () => {
  it('⭐ 적힌 분류를 그대로 쓰고 source 가 sheet 다', () => {
    const result = classifyLedgerRow({ category: '주거', subcategory: '월세', memo: '스타벅스' }, [
      /* 🔴 내용이 규칙에 걸리더라도 적힌 분류가 이긴다. */
      { contains: '스타벅스', categoryId: 'food' }
    ]);

    expect(result.source).toBe('sheet');
    expect(result.subcategory?.label).toBe('월세');
  });

  it('🔴 구분을 안 적어도 항목에서 따라온다 — 이게 "구분을 안 적어도 되는" 근거다', () => {
    const result = classifyLedgerRow({ category: '주거', subcategory: '월세' });

    expect(result.flow).toBe('expense');
    expect(isCountable(result)).toBe(true);
  });

  it('🔴 적힌 구분이 항목의 flow 보다 이긴다 — 사용자가 마지막에 고른 값이다', () => {
    const saving = LEDGER_CATEGORIES.find((category) => category.flow === 'transfer');
    expect(saving).toBeDefined();

    /* 저축 항목인데 사용자가 "지출"이라 적었다면 그 사람의 뜻을 따른다. */
    const result = classifyLedgerRow({ category: saving?.label, kind: '지출' });
    expect(result.flow).toBe('expense');
  });
});

describe('사다리 1단 — 사용자 규칙은 부분 일치다', () => {
  const rules: readonly LedgerClassifyRule[] = [{ contains: '스타벅스', categoryId: 'food' }];

  it('⭐ 내용 안에 규칙의 말이 들어 있으면 걸린다', () => {
    const result = classifyLedgerRow({ memo: '스타벅스 아메리카노 2잔' }, rules);

    expect(result.source).toBe('rule');
    expect(result.category?.id).toBe('food');
    expect(result.flow).toBe('expense');
  });

  it('🔴 긴 규칙이 먼저 걸린다 — 짧은 쪽이 먼저면 긴 규칙은 영영 안 쓰인다', () => {
    const sorted = sortRulesBySpecificity([
      { contains: '음식', categoryId: 'food' },
      { contains: '배달음식', categoryId: 'food', fixity: 'fixed' }
    ]);

    /* 정렬 결과가 곧 우선순위다. `배달음식` 이 앞이어야 한다. */
    expect(sorted[0].contains).toBe('배달음식');

    const result = classifyLedgerRow({ memo: '배달음식 주문' }, sorted);
    expect(result.fixity).toBe('fixed');
  });

  it('🔴 빈 규칙은 아무것에도 걸리지 않는다 — 모든 것에 걸리면 그건 사고다', () => {
    const result = classifyLedgerRow({ memo: '아무 내용' }, [{ contains: '   ', categoryId: 'food' }]);

    expect(result.source).toBe('none');
  });

  it('🔴 없어진 분류를 가리키는 규칙은 무시한다', () => {
    const result = classifyLedgerRow({ memo: '스타벅스' }, [
      { contains: '스타벅스', categoryId: 'no-such-category' as never }
    ]);

    expect(result.source).toBe('none');
  });
});

describe('사다리 2단 — 내장 사전은 정확 일치만', () => {
  it('내용 전체가 아는 이름이면 걸린다', () => {
    const result = classifyLedgerRow({ memo: '월세' });

    expect(result.source).toBe('dictionary');
    expect(result.flow).toBe('expense');
  });

  it('🔴 부분 일치는 안 한다 — `보험료`가 `보험(차) 갱신`에 걸리면 조용한 오분류가 된다', () => {
    /*
     * 사용자 규칙은 부분 일치를 쓰지만 내장 사전은 안 쓴다. 부분 일치의 위험은
     * "누가 그 말을 골랐나"에 달려 있다 — 우리가 고른 말로 틀리면 우리 책임이고,
     * 사용자는 자기 기록이 잘못 분류된 것도 모른다.
     */
    const result = classifyLedgerRow({ memo: '오늘 월세 계좌에서 빠졌나 확인' });

    expect(result.source).toBe('none');
  });
});

describe('🔴 사다리 3단 — 지어내지 않는다', () => {
  it('⭐ 모르면 미분류다 — `기타`로 떨어뜨리지 않는다', () => {
    const result = classifyLedgerRow({ memo: '알 수 없는 무언가 zzz' });

    expect(result.source).toBe('none');
    expect(result.category).toBeNull();
    expect(result.flow).toBeNull();
  });

  it('⭐ 미분류는 계산에 들어가지 않는다 — 0 으로 세면 합계가 조용히 틀린다', () => {
    expect(isCountable(classifyLedgerRow({ memo: '???' }))).toBe(false);
  });

  it('분류는 못 정해도 적힌 구분·고정은 살린다', () => {
    const result = classifyLedgerRow({ memo: '???', kind: '이체', fixity: '고정' });

    expect(result.category).toBeNull();
    expect(result.flow).toBe('transfer');
    expect(result.fixity).toBe('fixed');
    /* 구분이 있으니 계산에는 들어간다 — 분류를 못 정한 것과 셀 수 없는 것은 다르다. */
    expect(isCountable(result)).toBe(true);
  });
});

describe('🔴 되적을 것 고르기 — 남의 기록을 덮지 않는다', () => {
  it('⭐ 이미 적혀 있던 것은 되적지 않는다', () => {
    expect(isBackfillable(classifyLedgerRow({ category: '주거', subcategory: '월세' }))).toBe(false);
  });

  it('⭐ 못 정한 것도 되적지 않는다', () => {
    expect(isBackfillable(classifyLedgerRow({ memo: '???' }))).toBe(false);
  });

  it('규칙·사전으로 정한 것만 되적는다', () => {
    expect(isBackfillable(classifyLedgerRow({ memo: '월세' }))).toBe(true);
    expect(
      isBackfillable(classifyLedgerRow({ memo: '스타벅스' }, [{ contains: '스타벅스', categoryId: 'food' }]))
    ).toBe(true);
  });
});

describe('분류 규칙 탭 왕복', () => {
  it('⭐ 적었다 다시 읽으면 같은 규칙이다 — 라벨/id 를 섞으면 여기서 깨진다', () => {
    expect(카페).toBeDefined();
    const rule: LedgerClassifyRule = {
      contains: '스타벅스',
      categoryId: 카페!.category.id,
      subcategoryId: 카페!.sub.id,
      fixity: 'fixed'
    };

    const row = formatClassifyRuleRow(rule);
    const { rules, skipped } = parseClassifyRules([row]);

    expect(skipped).toBe(0);
    expect(rules).toEqual([rule]);
  });

  it('머리 행이 파서의 열 순서와 같다', () => {
    expect([...CLASSIFY_RULE_HEADERS]).toEqual(['포함하는 말', '항목', '상세항목', '고정']);
  });

  it('🔴 완전히 빈 줄은 "알아보지 못한 줄"로 세지 않는다 — 시트 아래 빈 행 수백 개를 탓하면 거짓말이다', () => {
    const { rules, skipped } = parseClassifyRules([['', '', '', ''], [], ['  ']]);

    expect(rules).toHaveLength(0);
    expect(skipped).toBe(0);
  });

  it('알아보지 못한 줄은 버리되 개수를 알린다', () => {
    const { rules, skipped } = parseClassifyRules([
      ['스타벅스', '없는항목XYZ', '', ''],
      ['', '주거', '월세', '']
    ]);

    expect(rules).toHaveLength(0);
    /* 첫 줄은 분류를 못 찾아서, 둘째 줄은 포함하는 말이 없어서 — 둘 다 내용이 있으니 센다. */
    expect(skipped).toBe(2);
  });

  it('🔴 고정 칸이 비어 있으면 "변동비"가 아니라 "정하지 않았다"다', () => {
    const { rules } = parseClassifyRules([['스타벅스', '주거', '월세', '']]);

    expect(rules[0].fixity).toBeUndefined();
  });

  it('🔴 "변동"을 말하는 규칙은 표현할 수 없다 — 빈 칸이 되어 안 쓴 것과 같아진다', () => {
    /*
     * 이 레포에서 변동비는 `고정` 열의 빈 칸이다(LEDGER_FIXITY_LABEL.variable === '').
     * 그래서 fixity 는 'fixed' 만 받는다. 이 검사가 그 계약이다 —
     * 빈 문자열이 아니게 바뀌면 여기가 먼저 빨개지고, 그때 타입을 다시 넓혀야 한다.
     */
    expect(LEDGER_FIXITY_LABEL.variable).toBe('');
  });
});
