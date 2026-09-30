import { describe, expect, it } from 'vitest';
import { buildEtfMixViewModel } from '@/pages/Ticker/EtfMixPage/EtfMixPage.utils';
import type { BuildEtfMixViewModelInput } from '@/pages/Ticker/EtfMixPage/EtfMixPage.utils';
import { analyzeBasket } from '@/shared/lib/etfOverlap';
import type { EtfHoldingsSnapshot } from '@/shared/lib/etfOverlap';

const snap = (ticker: string, holdings: Record<string, number>): EtfHoldingsSnapshot => ({
  ticker,
  name: ticker,
  seriesId: 'S0',
  asOfDate: '2026-06-30',
  filingDate: '2026-08-28',
  accessionNumber: 'x',
  sourceUrl: 'https://www.sec.gov/',
  totalHoldings: 1,
  coveredWeightPercent: 100,
  holdings: Object.entries(holdings).map(([key, weight]) => ({ key, symbol: key, name: key, weight }))
});

const A = snap('A', { X: 100 });
const B = snap('B', { X: 50, Z: 50 });

const input = (overrides: Partial<BuildEtfMixViewModelInput> = {}): BuildEtfMixViewModelInput => ({
  listStatus: 'ready',
  query: '',
  isSearching: false,
  listed: [
    { ticker: 'A', name: 'A', hasHoldings: true },
    { ticker: 'B', name: 'B', hasHoldings: true },
    { ticker: 'C', name: 'C', hasHoldings: true },
    { ticker: 'G', name: 'Gold', hasHoldings: false }
  ],
  basket: { tickers: ['A'], weights: [50] },
  snapshots: new Map([
    ['A', { status: 'ready', data: A }],
    ['B', { status: 'ready', data: B }],
    ['C', { status: 'loading' }]
  ]),
  basketSnapshots: [A],
  basketWeights: [50],
  analysis: analyzeBasket([A]),
  change: null,
  simulation: { canSimulate: true, excluded: [] },
  ...overrides
});

describe('buildEtfMixViewModel', () => {
  it('미리보기는 보유 종목을 이미 받은 후보에만 붙는다 — 받는 중이거나 담긴 ETF 는 null', () => {
    const { candidates } = buildEtfMixViewModel(input());
    const preview = Object.fromEntries(candidates.map((candidate) => [candidate.ticker, candidate.preview]));
    expect(preview.A).toBeNull(); // 이미 담김
    expect(preview.B).toBe(75); // A 에 B 를 반반 담으면 X = 75
    expect(preview.C).toBeNull(); // 받는 중
    expect(preview.G).toBeNull(); // 보유 종목 없음
  });

  it('슬롯은 상태·기준일·비중·몫을 싣는다(몫의 합은 100.0)', () => {
    const vm = buildEtfMixViewModel(
      input({
        basket: { tickers: ['A', 'B', 'C'], weights: [50, 50, 50] },
        basketSnapshots: [A, B],
        basketWeights: [50, 50],
        analysis: analyzeBasket([A, B])
      })
    );
    expect(vm.slots.map((slot) => [slot.ticker, slot.status, slot.share])).toEqual([
      ['A', 'ready', 33.4],
      ['B', 'ready', 33.3],
      ['C', 'loading', 33.3]
    ]);
    expect(vm.analyzedCount).toBe(2);
    expect(vm.isEqualWeight).toBe(true);
    expect(vm.asOfItems).toEqual(['A 2026-06-30', 'B 2026-06-30']);
  });

  it('비중을 하나라도 바꾸면 균등이 아니다', () => {
    expect(buildEtfMixViewModel(input({ basket: { tickers: ['A'], weights: [60] } })).isEqualWeight).toBe(false);
  });
});
