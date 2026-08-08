import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import type { LedgerEntry } from '@/shared/lib/googleSheets';
import { LedgerAnalysisCard } from '@/pages/Ledger/components';
import { buildLedgerAnalysisModel } from '@/pages/Ledger/utils';
import { LEDGER_COPY } from '@/pages/Ledger/copy';

/**
 * P4·P5 **이 달 살펴보기** 카드.
 *
 * 화면 테스트는 사용자가 보는 것으로만 판정한다 — 구획이 서는가, 없는 구획이 조용히 사라지는가,
 * 잴 수 없는 값을 0 으로 위장하지 않는가.
 *
 * 🔴 이 카드가 지켜야 할 것 셋(코드 주석과 짝):
 *   ① 1인 가구에는 주체 구획이 **없다**(`공동 100%` 한 줄은 소음이다)
 *   ② 수입이 없는 달의 저축률은 **0% 가 아니라 "잴 수 없음"**이다
 *   ③ 이체는 지출 구획 어디에도 들어가지 않는다
 */

const copy = LEDGER_COPY.analysis;
const CURSOR = { year: 2026, month: 8 };

let seq = 0;
const entry = (overrides: Partial<LedgerEntry> = {}): LedgerEntry => {
  seq += 1;
  return {
    ref: { snapshotId: 'snap-1', rowNumber: seq },
    date: '2026-08-03',
    kind: 'expense',
    amount: 10_000,
    category: '식비',
    fixity: 'variable',
    seen: {},
    ...overrides
  };
};

const renderCard = (entries: readonly LedgerEntry[]) =>
  render(<LedgerAnalysisCard model={buildLedgerAnalysisModel(entries, CURSOR)} monthLabel="2026년 8월" />);

describe('빈 상태', () => {
  it('기록이 없으면 한 문장으로 접힌다', () => {
    renderCard([]);

    expect(screen.getByText(copy.empty)).toBeInTheDocument();
    expect(screen.queryByText(copy.topHeading)).not.toBeInTheDocument();
  });
});

describe('고정비와 변동비', () => {
  it('두 숫자와 비중 문장이 함께 선다', () => {
    renderCard([
      entry({ fixity: 'fixed', amount: 700_000 }),
      entry({ fixity: 'variable', amount: 300_000 })
    ]);

    const section = screen.getByRole('region', { name: copy.fixityHeading });
    expect(within(section).getByText('₩700,000')).toBeInTheDocument();
    expect(within(section).getByText('₩300,000')).toBeInTheDocument();
    expect(within(section).getByText('지출의 70%가 고정비입니다')).toBeInTheDocument();
  });
});

describe('많이 쓴 항목', () => {
  it('상세항목과 금액이 함께 읽힌다', () => {
    renderCard([
      entry({ subcategory: '외식', amount: 50_000 }),
      entry({ subcategory: '배달', amount: 20_000 })
    ]);

    const section = screen.getByRole('region', { name: copy.topHeading });
    expect(within(section).getByText('외식')).toBeInTheDocument();
    expect(within(section).getByText('₩50,000')).toBeInTheDocument();
  });

  it('🔴 막대만 남지 않는다 — 값이 언제나 글자로 보인다', () => {
    renderCard([entry({ subcategory: '외식', amount: 50_000 })]);

    /* 같은 금액이 최근 흐름의 지출로도 나오므로 구획 안에서 본다. */
    const section = screen.getByRole('region', { name: copy.topHeading });
    expect(within(section).getByText('₩50,000')).toBeVisible();
  });
});

describe('주체 구획 — 1인 가구에는 없다', () => {
  it('🔴 주체를 아무도 안 적었으면 구획 자체가 없다', () => {
    renderCard([entry({ amount: 10_000 }), entry({ amount: 20_000 })]);

    expect(screen.queryByRole('region', { name: copy.payerHeading })).not.toBeInTheDocument();
  });

  it('⭐ 여러 사람이 쓴 가계부에서는 사람별로 선다', () => {
    renderCard([
      entry({ payer: '남편', amount: 40_000 }),
      entry({ payer: '아내', amount: 20_000 })
    ]);

    const section = screen.getByRole('region', { name: copy.payerHeading });
    expect(within(section).getByText('남편')).toBeInTheDocument();
    expect(within(section).getByText('아내')).toBeInTheDocument();
  });
});

describe('최근 흐름', () => {
  it('저축률을 말한다', () => {
    renderCard([
      entry({ date: '2026-08-01', kind: 'income', amount: 4_000_000 }),
      entry({ date: '2026-08-05', kind: 'expense', amount: 1_000_000 })
    ]);

    const section = screen.getByRole('region', { name: copy.trendHeading });
    expect(within(section).getByText('저축률 75%')).toBeInTheDocument();
  });

  it('🔴 수입이 없는 달은 0% 가 아니라 "잴 수 없음"이다', () => {
    renderCard([entry({ date: '2026-08-05', kind: 'expense', amount: 10_000 })]);

    const section = screen.getByRole('region', { name: copy.trendHeading });
    expect(within(section).getByText(copy.savingRateUnknown)).toBeInTheDocument();
    expect(within(section).queryByText('저축률 0%')).not.toBeInTheDocument();
  });

  it('⭐ 이체는 지출로 읽히지 않는다', () => {
    renderCard([
      entry({ date: '2026-08-01', kind: 'income', amount: 1_000_000 }),
      entry({ date: '2026-08-05', kind: 'expense', amount: 300_000 }),
      entry({ date: '2026-08-10', kind: 'transfer', amount: 400_000 })
    ]);

    const section = screen.getByRole('region', { name: copy.trendHeading });
    // 지출은 30만원 그대로 — 이체 40만원이 섞이지 않는다.
    expect(within(section).getByText(/지출\s*₩300,000/)).toBeInTheDocument();
    expect(within(section).getByText('저축률 70%')).toBeInTheDocument();
  });
});
