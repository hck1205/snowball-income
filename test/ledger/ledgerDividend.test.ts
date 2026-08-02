import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PortfolioHolding, PortfolioMarketInfo, PortfolioMarketInfoResolver } from '@/shared/lib/portfolio';
import type { LedgerRowModel } from '@/pages/Ledger/types';
import {
  LEDGER_DIVIDEND_OVERLAY_KEY,
  buildLedgerDividendModel,
  coveredExpenseCategories,
  expenseCoverageRatio,
  foldExpenseByCategory,
  formatCoveragePercent,
  parseLedgerDividendOverlay,
  readLedgerDividendOverlay,
  sumMonthExpense,
  writeLedgerDividendOverlay
} from '@/pages/Ledger/utils';

/**
 * B-4 **배당 겹쳐 보기**의 계산 계약.
 *
 * 여기서 잠그는 것은 화면이 아니라 **숫자를 만들지 않는 자리**다 — 지출 0, 배당 0, 환율 없음,
 * 보유 없음. 이 경계들이 무너지면 화면은 멀쩡히 그려지면서 없는 사실을 말한다(날조).
 *
 * ⚠ 시장 정보는 전부 **주입**한다. 실제 유니버스 스냅샷에 기대면 데이터가 갱신될 때마다 기대값이
 * 흔들리고, 그때 실패하는 것은 계약이 아니라 데이터다.
 */

const market = (price: number, dividendYield: number, payoutMonths: number[]): PortfolioMarketInfo => ({
  price,
  dividendYield,
  ...(payoutMonths.length > 0 ? { payoutMonths } : {}),
  freshness: 'snapshot',
  asOf: '2026-08-01'
});

const EVERY_MONTH = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** 연 120 USD 배당(월 10 USD) — 12개월 균등 지급. */
const MONTHLY: PortfolioHolding = { ticker: 'MONTHLY', quantity: 10 };
/** 3월에만 지급 — "보고 있는 달" 기준임을 확인하는 데 쓴다. */
const MARCH_ONLY: PortfolioHolding = { ticker: 'MARCH', quantity: 10 };
/** 지급월을 모르는 종목 — 값에는 들어가지만 이 달 계산에서는 빠진다. */
const UNKNOWN_SCHEDULE: PortfolioHolding = { ticker: 'UNKNOWN', quantity: 10 };

const resolve: PortfolioMarketInfoResolver = (holding) => {
  if (holding.ticker === 'MONTHLY') return market(100, 12, EVERY_MONTH);
  if (holding.ticker === 'MARCH') return market(100, 12, [3]);
  if (holding.ticker === 'UNKNOWN') return market(100, 12, []);
  return null;
};

const expenseRow = (category: string, amount: number, id = `${category}-${amount}`): LedgerRowModel => ({
  id,
  dateISO: '2026-08-03',
  dateText: '8월 3일 (월)',
  kind: 'expense',
  category,
  amount,
  amountText: `₩${amount.toLocaleString()}`,
  memo: '',
  failure: null
});

const incomeRow = (amount: number): LedgerRowModel => ({
  ...expenseRow('급여', amount, 'income'),
  kind: 'income'
});

/** 통신비 3,000 · 구독료 5,000 · 식비 50,000 = 지출 58,000원. */
const AUGUST_ROWS: LedgerRowModel[] = [
  expenseRow('식비', 50_000),
  expenseRow('통신비', 3_000),
  expenseRow('구독료', 5_000),
  incomeRow(3_200_000)
];

/** 1 USD = 1,000 KRW 로 고정 — 세후 10 USD = 10,000원이 되어 손으로 검산된다. */
const RATE = 1_000;

const baseInput = {
  isOn: true,
  portfolioStatus: 'ready' as const,
  holdings: [MONTHLY],
  taxRatePercent: 0,
  fxRateKrwPerUsd: RATE,
  cursor: { year: 2026, month: 8 },
  rows: AUGUST_ROWS,
  resolve
};

describe('B-4 토글 저장 — 관용 파서 · 새 키 하나', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("'on' 만 켜짐이고 없음·불량 값은 조용히 꺼짐이다", () => {
    expect(parseLedgerDividendOverlay('on')).toBe(true);
    for (const raw of [null, '', 'off', 'ON', 'true', '1', '{"on":true}']) {
      expect(parseLedgerDividendOverlay(raw)).toBe(false);
    }
  });

  it('저장 → 재방문 왕복으로 상태가 유지된다 (AC4-1)', () => {
    expect(readLedgerDividendOverlay()).toBe(false);

    writeLedgerDividendOverlay(true);
    expect(window.localStorage.getItem(LEDGER_DIVIDEND_OVERLAY_KEY)).toBe('on');
    expect(readLedgerDividendOverlay()).toBe(true);

    writeLedgerDividendOverlay(false);
    expect(readLedgerDividendOverlay()).toBe(false);
  });

  it('🔴 시트 연결·블렌딩 키를 건드리지 않는다', () => {
    const links = '[{"spreadsheetId":"abc","sheetId":0,"mapping":{}}]';
    const blend = '{"version":1}';
    window.localStorage.setItem('snowball:ledger:links', links);
    window.localStorage.setItem('snowball:ledger:blend', blend);

    writeLedgerDividendOverlay(true);
    writeLedgerDividendOverlay(false);

    expect(window.localStorage.getItem('snowball:ledger:links')).toBe(links);
    expect(window.localStorage.getItem('snowball:ledger:blend')).toBe(blend);
  });
});

describe('B-4 지출 접기 — 분류별 소계', () => {
  it('지출만 세고, 같은 분류는 합치고, 작은 것부터 정렬한다', () => {
    expect(foldExpenseByCategory([...AUGUST_ROWS, expenseRow('통신비', 1_000, 'extra')])).toEqual([
      { category: '통신비', amount: 4_000 },
      { category: '구독료', amount: 5_000 },
      { category: '식비', amount: 50_000 }
    ]);
  });

  it('동점 분류는 이름 사전순으로 고정된다 (시트 행 순서가 결과를 흔들지 않게)', () => {
    const folded = foldExpenseByCategory([
      expenseRow('통신비', 5_000),
      expenseRow('구독료', 5_000),
      expenseRow('교통비', 5_000)
    ]);
    expect(folded.map((entry) => entry.category)).toEqual(['교통비', '구독료', '통신비']);
  });

  it('분류가 비어 있는 지출은 이름을 말할 수 없어 목록에서 빠지되, 합계에는 그대로 들어간다', () => {
    const rows = [expenseRow('', 7_000), expenseRow('식비', 3_000)];
    expect(foldExpenseByCategory(rows)).toEqual([{ category: '식비', amount: 3_000 }]);
    expect(sumMonthExpense(rows)).toBe(10_000);
  });

  it('수입은 지출 합계에 들어가지 않는다', () => {
    expect(sumMonthExpense(AUGUST_ROWS)).toBe(58_000);
  });
});

describe('B-4 덮는 분류 — 작은 것부터 누적하고 처음 넘치면 멈춘다', () => {
  it('예산 안에 들어오는 분류만 나열한다', () => {
    expect(coveredExpenseCategories(AUGUST_ROWS, 10_000)).toEqual(['통신비', '구독료']);
  });

  it('딱 맞게 들어오는 분류는 포함한다 (경계값)', () => {
    expect(coveredExpenseCategories(AUGUST_ROWS, 8_000)).toEqual(['통신비', '구독료']);
    expect(coveredExpenseCategories(AUGUST_ROWS, 7_999)).toEqual(['통신비']);
  });

  it('예산이 전부를 덮으면 모든 분류를 나열한다', () => {
    expect(coveredExpenseCategories(AUGUST_ROWS, 999_999)).toEqual(['통신비', '구독료', '식비']);
  });

  it('분류가 하나뿐이어도, 예산이 0·음수여도 무너지지 않는다', () => {
    expect(coveredExpenseCategories([expenseRow('식비', 1_000)], 1_000)).toEqual(['식비']);
    expect(coveredExpenseCategories(AUGUST_ROWS, 0)).toEqual([]);
    expect(coveredExpenseCategories(AUGUST_ROWS, -1)).toEqual([]);
    expect(coveredExpenseCategories([], 10_000)).toEqual([]);
  });
});

describe('B-4 커버율', () => {
  it('🔴 지출이 0 이면 비율을 만들지 않는다 (0 나눗셈을 100% 로 위장 금지)', () => {
    expect(expenseCoverageRatio(10_000, 0)).toBeNull();
  });

  it('반올림해서 0% 가 되는 구간은 "1% 미만"으로 쓴다', () => {
    expect(formatCoveragePercent(0.001)).toBe('1% 미만');
    expect(formatCoveragePercent(0.005)).toBe('1% 미만');
    expect(formatCoveragePercent(0.0172)).toBe('2%');
    expect(formatCoveragePercent(1.5)).toBe('150%');
  });
});

describe('B-4 카드 모델 — 갈래마다 다른 사실을 말한다', () => {
  it('토글이 꺼져 있으면 본문을 만들지 않는다 (기본값 = 꺼짐)', () => {
    expect(buildLedgerDividendModel({ ...baseInput, isOn: false })).toEqual({ isOn: false, body: null });
  });

  it('포트폴리오를 아직 못 읽었으면 로딩, 읽기에 실패했으면 사유를 말한다 (숫자를 지어내지 않는다)', () => {
    expect(buildLedgerDividendModel({ ...baseInput, portfolioStatus: 'loading' }).body).toEqual({
      kind: 'loading'
    });
    expect(buildLedgerDividendModel({ ...baseInput, portfolioStatus: 'read-error' }).body).toEqual({
      kind: 'unavailable'
    });
  });

  it('보유가 없으면 지표 대신 안내 갈래다 (AC4-4)', () => {
    expect(buildLedgerDividendModel({ ...baseInput, holdings: [] }).body).toEqual({ kind: 'no-holdings' });
    // 수량 미입력도 "보유 없음"이다 — 0 원이라고 말하지 않는다.
    expect(
      buildLedgerDividendModel({ ...baseInput, holdings: [{ ticker: 'MONTHLY', quantity: 0 }] }).body
    ).toEqual({ kind: 'no-holdings' });
  });

  it('🔴 환율이 없으면 원화·커버율을 만들지 않고 달러 원값만 남긴다 (AC4-5)', () => {
    const body = buildLedgerDividendModel({ ...baseInput, fxRateKrwPerUsd: null }).body;
    expect(body).toEqual({ kind: 'fx-unavailable', usdText: '$10', unknownScheduleCount: 0 });
  });

  it('정상 경로 — 세후·원화 환산과 커버율·덮는 분류를 만든다', () => {
    const body = buildLedgerDividendModel(baseInput).body;
    expect(body).toEqual({
      kind: 'metrics',
      // 10주 × $100 × 12% = 연 $120 → 8월 $10 → 세율 0% → ×1,000원
      amountText: '₩10,000',
      // 10,000 / 58,000 = 17.24%
      coverageText: '17%',
      coveredCategories: ['통신비', '구독료'],
      unknownScheduleCount: 0
    });
  });

  it('세율은 포트폴리오가 쥔 값을 그대로 반영한다', () => {
    const body = buildLedgerDividendModel({ ...baseInput, taxRatePercent: 15.4 }).body;
    expect(body).toMatchObject({ kind: 'metrics', amountText: '₩8,460' });
  });

  it('🔴 지출이 0 인 달에는 커버율도 덮는 분류도 만들지 않는다 (AC4-6)', () => {
    const body = buildLedgerDividendModel({ ...baseInput, rows: [incomeRow(3_200_000)] }).body;
    expect(body).toEqual({
      kind: 'metrics',
      amountText: '₩10,000',
      coverageText: null,
      coveredCategories: [],
      unknownScheduleCount: 0
    });
  });

  it('🔴 "이번 달"이 아니라 **보고 있는 달** 기준이다', () => {
    const marchOnly = { ...baseInput, holdings: [MARCH_ONLY] };
    expect(buildLedgerDividendModel({ ...marchOnly, cursor: { year: 2026, month: 8 } }).body).toEqual({
      kind: 'no-payout'
    });
    expect(
      buildLedgerDividendModel({ ...marchOnly, cursor: { year: 2026, month: 3 } }).body
    ).toMatchObject({ kind: 'metrics', amountText: '₩120,000' });
  });

  it('지급월을 모르는 종목은 빠지고, 빠졌다는 사실이 숫자로 남는다 (AC4-7)', () => {
    const body = buildLedgerDividendModel({ ...baseInput, holdings: [MONTHLY, UNKNOWN_SCHEDULE] }).body;
    expect(body).toMatchObject({ kind: 'metrics', amountText: '₩10,000', unknownScheduleCount: 1 });
  });

  it('보유가 지급월 미상뿐이면 이 달 지급이 없다고 말한다 (0 원으로 위장하지 않는다)', () => {
    expect(buildLedgerDividendModel({ ...baseInput, holdings: [UNKNOWN_SCHEDULE] }).body).toEqual({
      kind: 'no-payout'
    });
  });
});
