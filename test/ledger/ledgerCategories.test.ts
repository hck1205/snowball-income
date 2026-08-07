import { describe, expect, it } from 'vitest';
import {
  categoriesByFlow,
  formatPayerCell,
  isFixityToken,
  isSharedPayer,
  LEDGER_CATEGORIES,
  normalizeCategoryToken,
  parseFixity,
  parseMethodKind,
  resolveCategoryName,
  resolveCategoryPair
} from '@/shared/constants/ledger';

/**
 * 가계부 v2 **어휘**의 계약.
 *
 * 이 사전은 "남의 가계부를 우리 분류로 옮기는" 일의 정답지다. 여기가 틀리면 매핑·집계·카드 추천이
 * 전부 조용히 어긋난다 — 그래서 실측에서 나온 이름들을 그대로 케이스로 박는다
 * (널리 쓰이는 시트 템플릿 2종의 `dropdown` 탭 전수, docs/ledger-v2-design.md §1.2).
 */

describe('분류 사전 — 실측 별칭 흡수', () => {
  it('⭐ 1인 템플릿의 이름이 전부 해석된다', () => {
    const names = [
      '주거비', '주담대이자', '전월세보증금이자', '월세', '관리비/가스비',
      '생활비', '식료/생필품비', '배달음식비', '통신/인터넷', '구독료', '병원비', '반려동물비',
      '교통비', '차량유지비',
      '의류/미용비', '취미/자기계발비', '개인소비', '데이트비',
      '보험료', '신용/마통이자', '경조사비', '계모임비', '기타'
    ];

    const unresolved = names.filter((name) => resolveCategoryName(name) === null);
    expect(unresolved).toEqual([]);
  });

  it('⭐ 2인 템플릿의 이름도 전부 해석된다 (같은 개념의 다른 이름)', () => {
    const names = [
      '대출이자', '식료품비', '외식비', '생필품비', '자녀양육비', '공과금', '차량유지비', '저축'
    ];

    const unresolved = names.filter((name) => resolveCategoryName(name) === null);
    expect(unresolved).toEqual([]);
  });

  it('두 템플릿이 다르게 부르던 이름이 같은 항목으로 모인다', () => {
    // `배달음식비`(1인) 와 `외식비`(2인) 는 둘 다 식비로 간다 — 합계가 갈리지 않는다.
    expect(resolveCategoryName('배달음식비')?.category.id).toBe('food');
    expect(resolveCategoryName('외식비')?.category.id).toBe('food');
    // 상세항목까지는 갈라 둔다(배달 ≠ 외식) — 뭉개는 것이 목적이 아니다.
    expect(resolveCategoryName('배달음식비')?.subcategory?.id).toBe('food.delivery');
    expect(resolveCategoryName('외식비')?.subcategory?.id).toBe('food.dining');
  });

  it('🔴 모르는 이름은 기타로 뭉개지 않고 null 을 준다', () => {
    expect(resolveCategoryName('은하수여행경비')).toBeNull();
    expect(resolveCategoryName('')).toBeNull();
    expect(resolveCategoryName(undefined)).toBeNull();
  });

  it('정규화가 구분기호 차이를 흡수한다', () => {
    expect(normalizeCategoryToken('식료/생필품비')).toBe(normalizeCategoryToken('식료 생필품비'));
    expect(resolveCategoryName('관리비 / 가스비')?.subcategory?.id).toBe('housing.utility');
  });

  it('🔴 부분일치로 잇지 않는다 (보험료가 차량 항목에 끌려가지 않는다)', () => {
    expect(resolveCategoryName('보험료')?.category.id).toBe('finance');
  });

  it('두 칸이 어긋나면 상세항목을 믿는다 (사람이 마지막에 고른 칸)', () => {
    // 원본 예시에 실제로 있던 조합: 항목은 `생활비`인데 상세항목은 `외식비`.
    expect(resolveCategoryPair('생활비', '외식비')?.category.id).toBe('food');
    // 상세항목이 비면 항목으로 떨어진다.
    expect(resolveCategoryPair('생활비', '')?.category.id).toBe('living');
  });
});

describe('저축은 지출이 아니다', () => {
  it('⭐ 저축·투자 항목의 flow 가 transfer 다', () => {
    const saving = LEDGER_CATEGORIES.find((category) => category.id === 'saving');

    expect(saving?.flow).toBe('transfer');
  });

  it('지출 항목 목록에 저축이 들어가지 않는다', () => {
    const expenseIds = categoriesByFlow('expense').map((category) => category.id);

    expect(expenseIds).not.toContain('saving');
  });

  it("원본 템플릿의 '저축' 이름도 이체 항목으로 해석된다", () => {
    expect(resolveCategoryName('저축')?.category.flow).toBe('transfer');
  });
});

describe('주체(payer) — 공동은 값이 아니라 기본값', () => {
  it('빈 칸도 공동으로 읽는다 (1인 가구가 영영 비워 두는 칸이다)', () => {
    expect(isSharedPayer(undefined)).toBe(true);
    expect(isSharedPayer('')).toBe(true);
    expect(isSharedPayer('   ')).toBe(true);
    expect(isSharedPayer('공동')).toBe(true);
  });

  it('구성원 이름은 그대로 산다', () => {
    expect(isSharedPayer('남편')).toBe(false);
    expect(formatPayerCell('남편')).toBe('남편');
  });

  it('⭐ 공동은 시트에 빈 칸으로 쓴다 (같은 글자가 천 줄 반복되지 않게)', () => {
    expect(formatPayerCell('공동')).toBe('');
    expect(formatPayerCell(undefined)).toBe('');
  });
});

describe('고정/변동', () => {
  it('🔴 명시된 것만 고정비다 (모르면 변동)', () => {
    expect(parseFixity('고정')).toBe('fixed');
    expect(parseFixity('고정지출')).toBe('fixed');
    expect(parseFixity('')).toBe('variable');
    expect(parseFixity(undefined)).toBe('variable');
    expect(parseFixity('매달')).toBe('variable');
  });

  it('원본 템플릿이 날짜 칸에 쓰던 고정지출 토큰을 알아본다', () => {
    expect(isFixityToken('고정지출')).toBe(true);
    expect(isFixityToken('1일')).toBe(false);
    expect(isFixityToken('2026-08-03')).toBe(false);
  });
});

describe('결제수단', () => {
  it('아는 낱말은 종류로 접힌다', () => {
    expect(parseMethodKind('신용카드')).toBe('credit');
    expect(parseMethodKind('체크')).toBe('debit');
    expect(parseMethodKind('현금')).toBe('cash');
    expect(parseMethodKind('계좌이체')).toBe('transfer');
  });

  it('🔴 사용자 별칭은 종류를 알 수 없고, 그것이 정상이다', () => {
    expect(parseMethodKind('신한 딥드림')).toBeNull();
    expect(parseMethodKind('')).toBeNull();
  });
});

describe('사전 자체의 무결성', () => {
  it('상세항목 id 가 중복되지 않는다', () => {
    const ids = LEDGER_CATEGORIES.flatMap((category) => category.subcategories.map((sub) => sub.id));

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('모든 항목·상세항목의 표시 이름이 스스로 해석된다 (사전이 자기 자신을 왕복한다)', () => {
    for (const category of LEDGER_CATEGORIES) {
      expect(resolveCategoryName(category.label)?.category.id, category.label).toBe(category.id);
      for (const sub of category.subcategories) {
        expect(resolveCategoryName(sub.label)?.subcategory?.id, sub.label).toBe(sub.id);
      }
    }
  });
});
