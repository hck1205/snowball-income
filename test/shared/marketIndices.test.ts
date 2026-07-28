import { describe, expect, it } from 'vitest';
import {
  computeIndexChange,
  findMarketIndex,
  findMissingSymbols,
  isMarketIndexSymbol,
  MARKET_INDEX_SYMBOLS,
  MARKET_INDICES,
  parseMarketIndicesSnapshot
} from '@/shared/lib/marketIndices';

/**
 * `shared/lib/marketIndices` — 레지스트리 · 순수 변동률 계산 · 클라이언트 파서.
 * (서버 핸들러 계약은 `test/api/marketIndices.test.ts` 가 본다.)
 */

const snapshotBody = (overrides: Record<string, unknown> = {}) => ({
  asOf: '2026-07-27T09:00:00.000Z',
  requested: [...MARKET_INDEX_SYMBOLS],
  indices: [
    { symbol: '^GSPC', price: 7419.65, previousClose: 7408.3, currency: 'USD' },
    { symbol: '^KS11', price: 6755.75, previousClose: 7096.89, currency: 'KRW' }
  ],
  ...overrides
});

describe('marketIndices 레지스트리', () => {
  it('심볼 목록과 표시 순서가 정의 배열과 같다', () => {
    expect(MARKET_INDEX_SYMBOLS).toEqual(['^GSPC', '^IXIC', '^KS11', '^KQ11', '^N225']);
    expect(MARKET_INDICES.map((definition) => definition.symbol)).toEqual([...MARKET_INDEX_SYMBOLS]);
    expect(MARKET_INDICES.every((definition) => definition.label.length > 0)).toBe(true);
  });

  it('모르는 심볼은 레지스트리 밖으로 판정한다', () => {
    expect(isMarketIndexSymbol('^GSPC')).toBe(true);
    expect(isMarketIndexSymbol('^DJI')).toBe(false);
    expect(isMarketIndexSymbol(42)).toBe(false);
    expect(isMarketIndexSymbol(null)).toBe(false);
    expect(findMarketIndex('^KS11')?.label).toBe('코스피');
    expect(findMarketIndex('^DJI')).toBeUndefined();
  });
});

describe('computeIndexChange', () => {
  it('상승·하락을 부호와 방향으로 함께 준다', () => {
    const up = computeIndexChange(7419.65, 7408.3);
    expect(up?.direction).toBe('up');
    expect(up?.percent).toBeCloseTo(0.1532, 4);

    const down = computeIndexChange(6755.75, 7096.89);
    expect(down?.direction).toBe('down');
    expect(down?.percent).toBeCloseTo(-4.8069, 4);
  });

  it('소수 2자리로 반올림해 0.00 이면 보합으로 본다(표시와 방향을 같은 기준으로)', () => {
    expect(computeIndexChange(100, 100)).toEqual({ percent: 0, direction: 'flat' });
    // +0.001% — 화면엔 0.00% 로 찍히므로 방향을 말하면 거짓말이 된다.
    expect(computeIndexChange(100.001, 100)?.direction).toBe('flat');
    expect(computeIndexChange(99.999, 100)?.direction).toBe('flat');
    // 0.006% 는 0.01% 로 찍히므로 보합이 아니다.
    expect(computeIndexChange(100.006, 100)?.direction).toBe('up');
  });

  it('전일 종가가 없거나 유한 양수가 아니면 변동률을 생략한다(0% 로 위장하지 않는다)', () => {
    expect(computeIndexChange(100, undefined)).toBeNull();
    expect(computeIndexChange(100, 0)).toBeNull();
    expect(computeIndexChange(100, -10)).toBeNull();
    expect(computeIndexChange(100, Number.NaN)).toBeNull();
    expect(computeIndexChange(100, Number.POSITIVE_INFINITY)).toBeNull();
    expect(computeIndexChange(Number.NaN, 100)).toBeNull();
  });
});

describe('parseMarketIndicesSnapshot', () => {
  it('정상 응답을 그대로 정규화한다', () => {
    const parsed = parseMarketIndicesSnapshot(snapshotBody());

    expect(parsed?.asOf).toBe('2026-07-27T09:00:00.000Z');
    expect(parsed?.indices.map((quote) => quote.symbol)).toEqual(['^GSPC', '^KS11']);
    expect(parsed?.indices[0]).toEqual({
      symbol: '^GSPC',
      price: 7419.65,
      previousClose: 7408.3,
      currency: 'USD'
    });
  });

  it('신뢰할 수 없는 응답은 값을 지어내지 않고 null 로 떨어진다', () => {
    expect(parseMarketIndicesSnapshot(undefined)).toBeNull();
    expect(parseMarketIndicesSnapshot({})).toBeNull();
    expect(parseMarketIndicesSnapshot('nope')).toBeNull();
    expect(parseMarketIndicesSnapshot({ asOf: '', indices: [] })).toBeNull();
    expect(parseMarketIndicesSnapshot(snapshotBody({ indices: 'nope' }))).toBeNull();
    expect(parseMarketIndicesSnapshot(snapshotBody({ indices: [] }))).toBeNull();
    // 쓸 수 있는 항목이 하나도 없으면(가격 없음·모르는 심볼) 실패로 본다.
    expect(
      parseMarketIndicesSnapshot(snapshotBody({ indices: [{ symbol: '^GSPC' }, { symbol: '^DJI', price: 100 }] }))
    ).toBeNull();
  });

  it('망가진 항목만 버리고 나머지 지수는 살린다', () => {
    const parsed = parseMarketIndicesSnapshot(
      snapshotBody({
        indices: [
          { symbol: '^GSPC', price: 7419.65 },
          { symbol: '^IXIC', price: 0 },
          { symbol: '^KQ11', price: 764.86, previousClose: -1, currency: 42 },
          null,
          { symbol: '^GSPC', price: 999 }
        ]
      })
    );

    expect(parsed?.indices.map((quote) => quote.symbol)).toEqual(['^GSPC', '^KQ11']);
    // 유한 양수가 아닌 전일 종가·문자열이 아닌 통화는 키 자체를 남기지 않는다.
    expect(parsed?.indices[1]).toEqual({ symbol: '^KQ11', price: 764.86 });
    // 같은 심볼이 중복으로 오면 첫 항목만 남는다.
    expect(parsed?.indices[0]?.price).toBe(7419.65);
  });

  it('requested 와 indices 의 차이로 부분 실패를 알 수 있다', () => {
    const parsed = parseMarketIndicesSnapshot(snapshotBody());
    expect(parsed && findMissingSymbols(parsed)).toEqual(['^IXIC', '^KQ11', '^N225']);

    const complete = parseMarketIndicesSnapshot(
      snapshotBody({ requested: ['^GSPC', '^KS11'] })
    );
    expect(complete && findMissingSymbols(complete)).toEqual([]);
  });

  it('requested 가 없거나 알아볼 수 없으면 받아온 심볼로 대체한다(없는 결손을 지어내지 않는다)', () => {
    const parsed = parseMarketIndicesSnapshot(snapshotBody({ requested: undefined }));

    expect(parsed?.requested).toEqual(['^GSPC', '^KS11']);
    expect(parsed && findMissingSymbols(parsed)).toEqual([]);
  });
});
