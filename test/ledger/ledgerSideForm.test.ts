// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import {
  LEDGER_SIDE_FIELDS,
  LEDGER_SIDE_HEADERS,
  emptySideDraft,
  sideFormRow,
  validateSideDraft
} from '@/pages/Ledger/utils';
import { parseHoldingRows, parseInvestmentRows } from '@/shared/lib/googleSheets';
import { LEDGER_HOLDING_LABEL } from '@/shared/constants/ledger';

/**
 * 자산·투자 직접 입력.
 *
 * 🔴 여기서 잠그는 것 둘:
 *    ① **열 순서** — 어긋나면 금액이 이름 칸에 들어가고, 시트를 열어 보기 전에는 아무도 모른다.
 *    ② **적었다 다시 읽기** — 폼이 만든 행을 파서가 못 읽으면 방금 적은 것이 표에서 사라진다.
 */

describe('🔴 열 순서 = 시트 머리', () => {
  it('⭐ 자산 폼의 칸 수와 순서가 시트 머리와 같다', () => {
    expect(LEDGER_SIDE_FIELDS.holdings).toHaveLength(LEDGER_SIDE_HEADERS.holdings.length);
    expect(LEDGER_SIDE_FIELDS.holdings.map((field) => field.label)).toEqual([
      ...LEDGER_SIDE_HEADERS.holdings
    ]);
  });

  it('⭐ 투자 폼도 같다', () => {
    expect(LEDGER_SIDE_FIELDS.investments).toHaveLength(LEDGER_SIDE_HEADERS.investments.length);
    expect(LEDGER_SIDE_FIELDS.investments.map((field) => field.label)).toEqual([
      ...LEDGER_SIDE_HEADERS.investments
    ]);
  });
});

describe('🔴 적었다 다시 읽기 — 방금 적은 것이 표에서 사라지지 않는다', () => {
  it('⭐ 자산 폼이 만든 행을 파서가 그대로 읽는다', () => {
    const row = sideFormRow('holdings', {
      date: '2026-08-31',
      kind: LEDGER_HOLDING_LABEL.deposit,
      name: '주거래통장',
      amount: '10,000,000',
      memo: '월말'
    });
    const { records, skipped } = parseHoldingRows([[...row]]);

    expect(skipped).toBe(0);
    expect(records[0]).toMatchObject({
      date: '2026-08-31',
      kind: 'deposit',
      name: '주거래통장',
      amount: 10000000,
      isDebt: false
    });
  });

  it('⭐ 투자 폼이 만든 행도 그대로 읽힌다', () => {
    const row = sideFormRow('investments', {
      account: '연금저축',
      ticker: 'schd',
      shares: '10.5',
      unitCost: '25.5',
      currency: 'USD',
      memo: ''
    });
    const { records, skipped } = parseInvestmentRows([[...row]]);

    expect(skipped).toBe(0);
    expect(records[0]).toMatchObject({ ticker: 'SCHD', shares: 10.5, unitCost: 25.5, currency: 'USD' });
  });

  it('🔴 숫자의 쉼표를 걷어 낸다 — 안 걷으면 로케일에 따라 글자로 앉는다', () => {
    const row = sideFormRow('holdings', { date: '2026-08-31', kind: '현금', name: '', amount: '1,234,567', memo: '' });

    expect(row[3]).toBe('1234567');
  });
});

describe('검증', () => {
  it('빈 초안은 필수 칸을 전부 짚는다', () => {
    const errors = validateSideDraft('holdings', emptySideDraft('holdings'));

    expect(errors.date).toBeTruthy();
    expect(errors.amount).toBeTruthy();
    /* 이름·내용은 선택이라 조용하다. */
    expect(errors.name).toBeUndefined();
    expect(errors.memo).toBeUndefined();
  });

  it('⭐ 종류는 첫 선택지로 시작한다 — 고르지 않고 저장하는 실수를 줄인다', () => {
    expect(emptySideDraft('holdings').kind).toBe(LEDGER_HOLDING_LABEL.cash);
    expect(validateSideDraft('holdings', emptySideDraft('holdings')).kind).toBeUndefined();
  });

  it('🔴 부채도 양수로 적는다 — 음수를 받으면 순자산에서 두 번 뺀다', () => {
    const errors = validateSideDraft('holdings', {
      date: '2026-08-31',
      kind: LEDGER_HOLDING_LABEL.debt,
      name: '대출',
      amount: '-3000000',
      memo: ''
    });

    expect(errors.amount).toBeTruthy();
  });

  it('🔴 수량 0 은 막는다 — 안 가진 것이다', () => {
    const errors = validateSideDraft('investments', {
      account: '',
      ticker: 'SCHD',
      shares: '0',
      unitCost: '',
      currency: 'USD',
      memo: ''
    });

    expect(errors.shares).toBeTruthy();
  });

  it('날짜 형식이 아니면 막는다', () => {
    const errors = validateSideDraft('holdings', {
      date: '8/31',
      kind: '현금',
      name: '',
      amount: '1000',
      memo: ''
    });

    expect(errors.date).toBeTruthy();
  });

  it('제대로 채우면 통과한다', () => {
    expect(
      validateSideDraft('holdings', {
        date: '2026-08-31',
        kind: '현금',
        name: '지갑',
        amount: '50000',
        memo: ''
      })
    ).toEqual({});
  });
});
