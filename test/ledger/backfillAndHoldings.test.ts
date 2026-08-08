import { describe, expect, it } from 'vitest';
import {
  APP_SHEET_MAPPING,
  collectBackfillTargets,
  mergeByTicker,
  netWorthByMonth,
  netWorthOf,
  parseHoldingRows,
  parseInvestmentRows,
  parseLedgerRow,
  planBackfill
} from '@/shared/lib/googleSheets';
import type { LedgerEntry } from '@/shared/lib/googleSheets';
import { toPortfolioPrefillSource } from '@/shared/lib/portfolio';
import { buildPortfolioSimulationPrefillState } from '@/shared/constants';
import { LEDGER_HOLDING_LABEL } from '@/shared/constants/ledger';

/**
 * 되채워 쓰기 · 자산 · 투자 · 시뮬레이터 다리.
 *
 * 🔴 여기서 잠그는 것 셋:
 *    ① 적혀 있던 칸을 절대 덮지 않는다 (덮으면 원본이 사라져 되돌릴 수 없다)
 *    ② 안 적은 달의 순자산은 0 이 아니라 없음이다
 *    ③ 프리셋에 없는 티커의 숫자를 지어내지 않는다
 */

const asEntry = (rowNumber: number, cells: Record<string, string>): LedgerEntry => {
  const parsed = parseLedgerRow(cells, rowNumber);
  if (!parsed.ok) throw new Error(`해석 실패: ${parsed.unreadable.reasons.join(' ')}`);
  const { rowNumber: _row, ...rest } = parsed.entry;
  return { ...rest, ref: { snapshotId: 's1', rowNumber } };
};

describe('🔴 분류를 비워도 행이 살아난다', () => {
  it('⭐ 구분이 비어도 내용으로 분류가 서면 읽힌다 — 종전에는 이 행이 버려졌다', () => {
    const parsed = parseLedgerRow({ date: '2026-08-01', kind: '', amount: '780000', category: '', memo: '월세' }, 2);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.entry.kind).toBe('expense');
    expect(parsed.entry.category).toBe('주거');
    expect(parsed.entry.filledBy).toBe('dictionary');
  });

  it('🔴 사다리를 다 내려가도 구분을 못 정하면 그 행은 실패다 — 합계가 뒤집히는 것보다 낫다', () => {
    const parsed = parseLedgerRow({ date: '2026-08-01', kind: '', amount: '1000', category: '', memo: '???' }, 2);

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.unreadable.reasons.join(' ')).toContain('구분');
  });

  it('⭐ 적힌 말은 사전의 정규 이름으로 바꿔 적지 않는다 — 남의 어휘는 남의 것이다', () => {
    const parsed = parseLedgerRow(
      { date: '2026-08-01', kind: '지출', amount: '1000', category: '내맘대로분류', memo: '' },
      2
    );

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.entry.category).toBe('내맘대로분류');
    /* 사다리가 정하지 못했으므로 되적을 것도 없다. */
    expect(parsed.entry.filled).toBeUndefined();
  });

  it('🔴 알아볼 수 없는 구분이 적혀 있어도 항목에서 채운다', () => {
    const parsed = parseLedgerRow(
      { date: '2026-08-01', kind: '출금', amount: '1000', category: '주거', memo: '' },
      2
    );

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.entry.kind).toBe('expense');
  });
});

describe('🔴 되채워 쓰기 — 남의 기록을 덮지 않는다', () => {
  it('⭐ 빈 칸이던 자리만 채운다', () => {
    const entry = asEntry(5, { date: '2026-08-01', kind: '', amount: '780000', category: '', memo: '월세' });
    const targets = collectBackfillTargets([entry], APP_SHEET_MAPPING);

    expect(targets).toHaveLength(1);
    /* `월세` 는 상세항목까지 정해지는 말이라 세 칸이 채워진다. */
    expect(Object.keys(targets[0].cells).sort()).toEqual(['category', 'kind', 'subcategory']);
    expect(targets[0].rowNumber).toBe(5);
  });

  it('⭐ 적혀 있던 칸은 대상에 들어가지 않는다', () => {
    const entry = asEntry(5, { date: '2026-08-01', kind: '지출', amount: '780000', category: '', memo: '월세' });
    const targets = collectBackfillTargets([entry], APP_SHEET_MAPPING);

    /* 구분이 적혀 있었으니 그 칸은 대상에서 빠지고, 분류 두 칸만 채운다. */
    expect(Object.keys(targets[0].cells).sort()).toEqual(['category', 'subcategory']);
    expect(targets[0].cells).not.toHaveProperty('kind');
  });

  it('🔴 `seen` 이 비어 있지 않으면 filled 를 무시한다 — 두 겹으로 막는 자리다', () => {
    const entry = asEntry(5, { date: '2026-08-01', kind: '', amount: '780000', category: '', memo: '월세' });
    /* 파서를 우회해 filled 에 이미 적힌 칸이 섞인 상황을 만든다. */
    const tampered: LedgerEntry = {
      ...entry,
      filled: { ...entry.filled, memo: '덮어쓰기 시도' }
    };

    const targets = collectBackfillTargets([tampered], APP_SHEET_MAPPING);
    expect(targets[0].cells).not.toHaveProperty('memo');
  });

  it('🔴 매핑되지 않은 열에는 쓰지 않는다', () => {
    const entry = asEntry(5, { date: '2026-08-01', kind: '', amount: '780000', category: '', memo: '월세' });
    /* 항목 열만 있는 시트(구분 열이 없다고 가정) — 매핑에서 kind 를 뺀다. */
    const { kind: _kind, ...withoutKind } = APP_SHEET_MAPPING;

    const targets = collectBackfillTargets([entry], withoutKind as typeof APP_SHEET_MAPPING);
    expect(targets[0].cells).not.toHaveProperty('kind');
  });

  it('지운 행은 되적지 않는다', () => {
    const entry = asEntry(5, {
      date: '2026-08-01',
      kind: '',
      amount: '780000',
      category: '',
      memo: '월세',
      status: '삭제됨'
    });

    expect(collectBackfillTargets([entry], APP_SHEET_MAPPING)).toHaveLength(0);
  });

  it('🔴 쓸 것이 없으면 계획을 만들지 않는다 — 빈 요청은 "저장했습니다"라는 거짓 신호가 된다', () => {
    const plan = planBackfill({ sheetTitle: '가계부', mapping: APP_SHEET_MAPPING, targets: [] });

    expect(plan.ok).toBe(false);
  });

  it('계획은 셀 단위 범위를 만든다 — 행 통째로 덮어쓰는 경로는 없다', () => {
    const entry = asEntry(5, { date: '2026-08-01', kind: '', amount: '780000', category: '', memo: '월세' });
    const targets = collectBackfillTargets([entry], APP_SHEET_MAPPING);
    const plan = planBackfill({ sheetTitle: '가계부', mapping: APP_SHEET_MAPPING, targets });

    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.value.rowCount).toBe(1);
    expect(plan.value.cellCount).toBe(3);
    /* 각 범위가 한 칸이다. */
    for (const range of plan.value.data) expect(range.values).toEqual([[expect.any(String)]]);
  });
});

describe('🔴 자산 — 안 적은 달과 0원은 다르다', () => {
  it('⭐ 기록이 없으면 순자산은 null 이다 (0 이 아니다)', () => {
    expect(netWorthOf([])).toBeNull();
  });

  it('⭐ 부채를 뺀다', () => {
    const { records, skipped } = parseHoldingRows([
      ['2026-08-31', LEDGER_HOLDING_LABEL.deposit, '주거래통장', '10000000', ''],
      ['2026-08-31', LEDGER_HOLDING_LABEL.debt, '주택담보대출', '4000000', '']
    ]);

    expect(skipped).toBe(0);
    expect(netWorthOf(records)).toBe(6000000);
  });

  it('달별로 모은다 — 한 달에 여러 줄이면 더한다', () => {
    const { records } = parseHoldingRows([
      ['2026-07-31', LEDGER_HOLDING_LABEL.cash, '현금', '500000', ''],
      ['2026-08-31', LEDGER_HOLDING_LABEL.cash, '현금', '300000', ''],
      ['2026-08-31', LEDGER_HOLDING_LABEL.saving, '적금', '2000000', '']
    ]);
    const byMonth = netWorthByMonth(records);

    expect(byMonth.get('2026-07')).toBe(500000);
    expect(byMonth.get('2026-08')).toBe(2300000);
    /* 적지 않은 달은 아예 없다 — 0 으로 만들지 않는다. */
    expect(byMonth.has('2026-06')).toBe(false);
  });

  it('🔴 완전히 빈 줄은 "알아보지 못한 줄"로 세지 않는다', () => {
    const { records, skipped } = parseHoldingRows([['', '', '', '', ''], []]);

    expect(records).toHaveLength(0);
    expect(skipped).toBe(0);
  });

  it('알아보지 못한 줄은 세어서 알린다', () => {
    const { records, skipped } = parseHoldingRows([['2026-08-31', '없는종류', '통장', '100', '']]);

    expect(records).toHaveLength(0);
    expect(skipped).toBe(1);
  });
});

describe('투자 기록', () => {
  it('티커를 대문자로 모으고 수량 0 은 버린다', () => {
    const { records, skipped } = parseInvestmentRows([
      ['연금저축', 'schd', '10', '25.5', 'USD', ''],
      ['ISA', 'JEPI', '0', '55', 'USD', '']
    ]);

    expect(records.map((record) => record.ticker)).toEqual(['SCHD']);
    expect(skipped).toBe(1);
  });

  it('⭐ 같은 티커는 합치고 매입단가는 수량 가중 평균이다 — 단순 평균이면 1주와 100주가 같은 무게가 된다', () => {
    const { records } = parseInvestmentRows([
      ['연금저축', 'SCHD', '1', '10', 'USD', ''],
      ['ISA', 'SCHD', '99', '20', 'USD', '']
    ]);
    const merged = mergeByTicker(records);

    expect(merged).toHaveLength(1);
    expect(merged[0].shares).toBe(100);
    /* (1×10 + 99×20) / 100 = 19.9 — 단순 평균이면 15 가 나온다. */
    expect(merged[0].unitCost).toBeCloseTo(19.9, 6);
  });

  it('통화가 다른 같은 티커는 합치지 않는다', () => {
    const { records } = parseInvestmentRows([
      ['A', 'SCHD', '10', '25', 'USD', ''],
      ['B', 'SCHD', '10', '35000', 'KRW', '']
    ]);

    expect(mergeByTicker(records)).toHaveLength(2);
  });

  it('매입단가를 안 적으면 null 이다 — 0 으로 위장하지 않는다', () => {
    const { records } = parseInvestmentRows([['연금저축', 'SCHD', '10', '', 'USD', '']]);

    expect(records[0].unitCost).toBeNull();
  });
});

describe('🔴 시뮬레이터 다리 — 이미 있는 프리필 경로를 그대로 쓴다', () => {
  /*
   * 🔴 비중·정규화·유니버스 판정은 `buildPortfolioSimulationPrefillState` 가 정본이다.
   *    가계부가 별도 규칙을 만들면(처음에 그랬다) 두 곳의 반올림이 갈려
   *    "화면 안내와 실제 프리필이 다르다"가 된다. 그래서 왕복으로 검사한다.
   */
  const prefillOf = (holdings: Parameters<typeof toPortfolioPrefillSource>[0], fx: number | null = 1400) => {
    const { source, ...report } = toPortfolioPrefillSource(holdings, fx);
    const state = buildPortfolioSimulationPrefillState({ summary: source, fxRateKrwPerUsd: fx });
    return { state, report, source };
  };

  it('⭐ 시트에 적은 종목이 프리필이 된다', () => {
    const { state } = prefillOf([
      { ticker: 'SCHD', shares: 10, unitCost: 25, currency: 'USD' },
      { ticker: 'JEPI', shares: 10, unitCost: 55, currency: 'USD' }
    ]);

    expect(state).not.toBeNull();
    const holdings = state?.portfolioSimulationPrefill.holdings ?? [];
    expect(holdings.map((holding) => holding.ticker).sort()).toEqual(['JEPI', 'SCHD']);
    /* 250 : 550 → 31.25% : 68.75% */
    const schd = holdings.find((holding) => holding.ticker === 'SCHD');
    expect(schd?.weightPercent).toBeCloseTo(31.25, 6);
  });

  it('⭐ 비중 합은 정본 함수가 100 으로 닫는다', () => {
    const { state } = prefillOf([
      { ticker: 'SCHD', shares: 3, unitCost: 25, currency: 'USD' },
      { ticker: 'JEPI', shares: 7, unitCost: 55, currency: 'USD' },
      { ticker: 'VOO', shares: 1, unitCost: 480, currency: 'USD' }
    ]);

    const sum = (state?.portfolioSimulationPrefill.holdings ?? []).reduce(
      (total, holding) => total + holding.weightPercent,
      0
    );
    expect(sum).toBeCloseTo(100, 6);
  });

  it('🔴 프리셋에 없는 티커는 넣지 않고 목록으로 알린다 — 조용히 빼면 무음 왜곡이다', () => {
    const { state, report } = prefillOf([
      { ticker: 'SCHD', shares: 10, unitCost: 25, currency: 'USD' },
      { ticker: 'ZZZZ', shares: 10, unitCost: 25, currency: 'USD' }
    ]);

    expect(report.unknownTickers).toContain('ZZZZ');
    expect((state?.portfolioSimulationPrefill.holdings ?? []).map((holding) => holding.ticker)).toEqual(['SCHD']);
  });

  it('🔴 못 들어간 종목의 금액도 초기 투자금에는 들어간다 — 그래서 화면이 그 목록을 보여 줘야 한다', () => {
    const { state, source } = prefillOf([
      { ticker: 'SCHD', shares: 10, unitCost: 25, currency: 'USD' },
      { ticker: 'ZZZZ', shares: 10, unitCost: 25, currency: 'USD' }
    ]);

    /* 총액은 둘을 합한 500 USD 다(프리필 계약의 정의). */
    expect(source.totalValueUsd).toBeCloseTo(500, 6);
    expect(state?.portfolioSimulationPrefill.initialInvestmentKrw).toBeCloseTo(500 * 1400, 3);
  });

  it('🔴 환율을 모르면 KRW 보유를 섞지 않고 알린다 — 그냥 더하면 값이 1,400배 어긋난다', () => {
    const result = toPortfolioPrefillSource(
      [
        { ticker: 'SCHD', shares: 10, unitCost: 25, currency: 'USD' },
        { ticker: 'VOO', shares: 1, unitCost: 700000, currency: 'KRW' }
      ],
      null
    );

    expect(result.unconvertible).toContain('VOO');
    /* 못 잰 종목은 합계에서 빠지되 목록에는 남는다 — 조용히 사라지지 않게. */
    expect(result.source.holdings.find((holding) => holding.ticker === 'VOO')?.includedInTotals).toBe(false);
    expect(result.source.totalValueUsd).toBeCloseTo(250, 6);
  });

  it('환율을 주면 KRW 보유도 함께 잰다', () => {
    const result = toPortfolioPrefillSource(
      [
        { ticker: 'SCHD', shares: 10, unitCost: 25, currency: 'USD' },
        { ticker: 'VOO', shares: 1, unitCost: 700000, currency: 'KRW' }
      ],
      1400
    );

    expect(result.unconvertible).toHaveLength(0);
    /* 700,000원 / 1,400 = 500 USD, + 250 USD = 750 */
    expect(result.source.totalValueUsd).toBeCloseTo(750, 6);
  });

  it('매입단가가 없으면 프리셋 기준가로 재고 그 사실을 밝힌다', () => {
    const result = toPortfolioPrefillSource([{ ticker: 'SCHD', shares: 10, unitCost: null, currency: 'USD' }], 1400);

    expect(result.valuedByPresetPrice).toContain('SCHD');
    expect(result.source.totalValueUsd).toBeGreaterThan(0);
  });

  it('보유가 없으면 프리필을 만들지 않는다', () => {
    const { state } = prefillOf([]);

    expect(state).toBeNull();
  });
});
