// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import {
  NET_WORTH_TREND_LIMIT,
  buildHoldingsModel,
  buildInvestmentsModel,
  buildRulesModel
} from '@/pages/Ledger/utils';
import { parseHoldingRows, parseInvestmentRows } from '@/shared/lib/googleSheets';
import { LEDGER_HOLDING_LABEL } from '@/shared/constants/ledger';

const holdingsOf = (rows: string[][]) => {
  const { records, skipped } = parseHoldingRows(rows);
  return buildHoldingsModel(records, skipped);
};

describe('자산 뷰 모델', () => {
  it('⭐ 최근 달의 순자산을 말한다', () => {
    const model = holdingsOf([
      ['2026-07-31', LEDGER_HOLDING_LABEL.deposit, '통장', '1000000', ''],
      ['2026-08-31', LEDGER_HOLDING_LABEL.deposit, '통장', '1500000', '']
    ]);

    expect(model.latestMonthLabel).toBe('2026년 8월');
    expect(model.latestNetWorthText).toBe('1,500,000원');
  });

  it('🔴 기록이 없으면 순자산이 null 이다 — 0원이라 적으면 빈털터리로 읽힌다', () => {
    const model = holdingsOf([]);

    expect(model.latestNetWorthText).toBeNull();
    expect(model.latestMonthLabel).toBeNull();
    expect(model.trend).toHaveLength(0);
  });

  it('⭐ 순자산이 음수여도 막대가 사라지지 않는다 — 절댓값 최대로 나눈다', () => {
    /*
     * 부채가 자산보다 많은 달이다. 최댓값으로만 나누면 그 달의 막대 비율이 0 이 되어
     * "부채가 더 많다"는 사실이 화면에서 사라진다.
     */
    const model = holdingsOf([
      ['2026-07-31', LEDGER_HOLDING_LABEL.deposit, '통장', '1000000', ''],
      ['2026-08-31', LEDGER_HOLDING_LABEL.debt, '대출', '3000000', '']
    ]);

    const august = model.trend.find((point) => point.month === '2026-08');
    expect(august?.isNegative).toBe(true);
    expect(august?.ratio).toBeCloseTo(1, 6);
    expect(august?.valueText).toBe('-3,000,000원');

    const july = model.trend.find((point) => point.month === '2026-07');
    /* 7월(+100만)은 8월(-300만)의 3분의 1 길이다. */
    expect(july?.ratio).toBeCloseTo(1 / 3, 6);
    expect(july?.isNegative).toBe(false);
  });

  it('추이는 최근 열두 달까지다 — 표에는 다 남는다', () => {
    const rows = Array.from({ length: 20 }, (_unused, index) => {
      const month = String((index % 12) + 1).padStart(2, '0');
      const year = 2025 + Math.floor(index / 12);
      return [`${year}-${month}-28`, LEDGER_HOLDING_LABEL.cash, '현금', '1000', ''];
    });
    const model = holdingsOf(rows);

    expect(model.trend.length).toBeLessThanOrEqual(NET_WORTH_TREND_LIMIT);
    expect(model.rows).toHaveLength(20);
  });

  it('부채는 글자로 표시한다 — 색 단독 채널 금지', () => {
    const model = holdingsOf([['2026-08-31', LEDGER_HOLDING_LABEL.debt, '대출', '100', '']]);

    expect(model.rows[0].isDebt).toBe(true);
    expect(model.rows[0].kindLabel).toBe(LEDGER_HOLDING_LABEL.debt);
  });
});

describe('투자 뷰 모델', () => {
  it('🔴 매입단가를 안 적으면 null 이다 — `0원` 으로 위장하지 않는다', () => {
    const { records, skipped } = parseInvestmentRows([['연금저축', 'SCHD', '10', '', 'USD', '']]);
    const model = buildInvestmentsModel(records, skipped);

    expect(model.rows[0].unitCostText).toBeNull();
  });

  it('⭐ 소수 수량을 자르지 않는다 — 자르면 사용자가 자기 수량을 의심한다', () => {
    const { records, skipped } = parseInvestmentRows([['ISA', 'SCHD', '1.2345', '25', 'USD', '']]);
    const model = buildInvestmentsModel(records, skipped);

    expect(model.rows[0].sharesText).toBe('1.2345');
  });

  it('통화를 단가와 함께 적는다', () => {
    const { records, skipped } = parseInvestmentRows([['ISA', 'SCHD', '10', '25.5', 'USD', '']]);
    const model = buildInvestmentsModel(records, skipped);

    expect(model.rows[0].unitCostText).toBe('25.5 USD');
  });
});

describe('분류 규칙 뷰 모델', () => {
  it('규칙을 라벨로 편다', () => {
    const model = buildRulesModel([{ contains: '스타벅스', categoryId: 'food', fixity: 'fixed' }], 0);

    expect(model.rows[0].contains).toBe('스타벅스');
    expect(model.rows[0].categoryLabel).toBe('식비');
    expect(model.rows[0].fixityLabel).toBe('고정');
  });

  it('🔴 고정이 아니면 빈 칸이다 — `변동` 이라 적지 않는다', () => {
    const model = buildRulesModel([{ contains: '스타벅스', categoryId: 'food' }], 0);

    expect(model.rows[0].fixityLabel).toBe('');
  });

  it('알아보지 못한 줄 수를 그대로 들고 온다', () => {
    expect(buildRulesModel([], 3).skipped).toBe(3);
  });
});
