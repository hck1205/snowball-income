// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import type { LedgerEntry } from '@/shared/lib/googleSheets';
import { collectCarryOverCandidates } from '@/pages/Ledger/utils';

/**
 * **고정비 이어가기.**
 *
 * 고정비는 정의상 매달 같은데, 분석한 시트에서 사람들은 그것을 열두 번씩 손으로 다시 적고 있었다.
 * 이 기능이 그 반복을 접는다 — 헤비 유저 체감이 가장 큰 자리다.
 *
 * 🔴 시트에 여러 줄을 한 번에 쓰는 동작이라 **틀리면 되돌리기가 비싸다.** 그래서 규칙을 여기서
 *    빡빡하게 잠근다: 두 번 눌러도 두 줄이 되지 않는가, 앱이 추측해서 넣지는 않는가.
 */

const AUG = { year: 2026, month: 8 };

let seq = 0;
const entry = (overrides: Partial<LedgerEntry> = {}): LedgerEntry => {
  seq += 1;
  return {
    ref: { snapshotId: 'snap-1', rowNumber: seq },
    date: '2026-07-05',
    kind: 'expense',
    amount: 700_000,
    category: '주거',
    fixity: 'fixed',
    seen: {},
    ...overrides
  };
};

describe('무엇을 이어가는가', () => {
  it('⭐ 지난달 고정비가 이번 달 초안이 된다', () => {
    const candidates = collectCarryOverCandidates([entry({ subcategory: '월세' })], AUG);

    expect(candidates).toHaveLength(1);
    expect(candidates[0].draft).toMatchObject({
      date: '2026-08-05',
      amount: 700_000,
      category: '주거',
      subcategory: '월세',
      fixity: 'fixed'
    });
  });

  it('🔴 변동비는 이어가지 않는다 — 앱이 추측해서 넣지 않는다', () => {
    expect(collectCarryOverCandidates([entry({ fixity: 'variable' })], AUG)).toEqual([]);
  });

  it('수입·이체도 고정이면 이어간다 (급여·자동이체 저축은 사용자 판단이다)', () => {
    const candidates = collectCarryOverCandidates(
      [
        entry({ kind: 'income', category: '수입', subcategory: '급여', amount: 4_000_000 }),
        entry({ kind: 'transfer', category: '저축·투자', subcategory: '저축', amount: 500_000 })
      ],
      AUG
    );

    expect(candidates.map((candidate) => candidate.draft.kind).sort()).toEqual(['income', 'transfer']);
  });

  it('지지난달 것은 이어가지 않는다 (바로 지난달만 본다)', () => {
    expect(collectCarryOverCandidates([entry({ date: '2026-06-05' })], AUG)).toEqual([]);
  });

  it('큰 금액부터 온다 — 월세 같은 큰 고정비를 먼저 확인하게 된다', () => {
    const candidates = collectCarryOverCandidates(
      [
        entry({ category: '생활', subcategory: '통신/인터넷', amount: 43_890 }),
        entry({ category: '주거', subcategory: '월세', amount: 700_000 })
      ],
      AUG
    );

    expect(candidates[0].draft.subcategory).toBe('월세');
  });
});

describe('중복 방지 — 두 번 눌러도 두 줄이 되지 않는다', () => {
  it('⭐ 이번 달에 같은 청구가 이미 있으면 뺀다', () => {
    const candidates = collectCarryOverCandidates(
      [
        entry({ date: '2026-07-05', subcategory: '월세' }),
        entry({ date: '2026-08-05', subcategory: '월세' })
      ],
      AUG
    );

    expect(candidates).toEqual([]);
  });

  it('🔴 금액이 달라도 같은 청구로 본다 (관리비처럼 달마다 액수가 바뀐다)', () => {
    const candidates = collectCarryOverCandidates(
      [
        entry({ date: '2026-07-05', subcategory: '관리비/공과금', amount: 150_000 }),
        entry({ date: '2026-08-05', subcategory: '관리비/공과금', amount: 173_000 })
      ],
      AUG
    );

    expect(candidates).toEqual([]);
  });

  it('이번 달에 변동비로 적어 뒀어도 같은 청구면 뺀다 (손으로 먼저 넣었을 수 있다)', () => {
    const candidates = collectCarryOverCandidates(
      [
        entry({ date: '2026-07-05', subcategory: '월세' }),
        entry({ date: '2026-08-05', subcategory: '월세', fixity: 'variable' })
      ],
      AUG
    );

    expect(candidates).toEqual([]);
  });

  it('주체가 다르면 다른 청구다 (남편 교통비와 아내 교통비는 별개다)', () => {
    const candidates = collectCarryOverCandidates(
      [
        entry({ category: '교통·차량', subcategory: '대중교통', payer: '남편', amount: 55_000 }),
        entry({ category: '교통·차량', subcategory: '대중교통', payer: '아내', amount: 55_000 })
      ],
      AUG
    );

    expect(candidates).toHaveLength(2);
  });

  it('지난달에 같은 청구가 여러 건이면 한 건으로 접는다 (가장 마지막 금액)', () => {
    const candidates = collectCarryOverCandidates(
      [
        entry({ date: '2026-07-05', subcategory: '월세', amount: 700_000 }),
        entry({ date: '2026-07-20', subcategory: '월세', amount: 750_000 })
      ],
      AUG
    );

    expect(candidates).toHaveLength(1);
    expect(candidates[0].draft.amount).toBe(750_000);
  });
});

describe('날짜 옮기기', () => {
  it('같은 날로 간다', () => {
    expect(collectCarryOverCandidates([entry({ date: '2026-07-25' })], AUG)[0].draft.date).toBe('2026-08-25');
  });

  it('🔴 그 달에 없는 날짜는 말일로 접는다 (다음 달 1일로 밀면 그 달 합계에서 빠진다)', () => {
    const feb = { year: 2026, month: 2 };
    const candidates = collectCarryOverCandidates([entry({ date: '2026-01-31' })], feb);

    expect(candidates[0].draft.date).toBe('2026-02-28');
  });

  it('윤년 2월도 맞게 접는다', () => {
    const feb2028 = { year: 2028, month: 2 };
    const candidates = collectCarryOverCandidates([entry({ date: '2028-01-31' })], feb2028);

    expect(candidates[0].draft.date).toBe('2028-02-29');
  });

  it('해가 바뀌는 자리도 넘어간다 (12월 → 1월)', () => {
    const jan = { year: 2027, month: 1 };
    const candidates = collectCarryOverCandidates([entry({ date: '2026-12-05' })], jan);

    expect(candidates[0].draft.date).toBe('2027-01-05');
  });
});

describe('값 물려주기', () => {
  it('결제수단·내용도 함께 온다', () => {
    const candidates = collectCarryOverCandidates(
      [entry({ subcategory: '월세', method: '신한카드', memo: '오피스텔 월세' })],
      AUG
    );

    expect(candidates[0].draft).toMatchObject({ method: '신한카드', memo: '오피스텔 월세' });
  });

  it('빈 값은 키 자체를 만들지 않는다 (빈 문자열을 시트에 흘리지 않는다)', () => {
    const candidates = collectCarryOverCandidates([entry({ subcategory: undefined, memo: undefined })], AUG);

    expect(candidates[0].draft).not.toHaveProperty('subcategory');
    expect(candidates[0].draft).not.toHaveProperty('memo');
  });

  it('금액은 언제나 양수다', () => {
    expect(collectCarryOverCandidates([entry({ amount: -700_000 })], AUG)[0].draft.amount).toBe(700_000);
  });
});
