// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import {
  COMPARE_PRESETS,
  MAX_COMPARE_TICKERS,
  MIN_COMPARE_TICKERS,
  UNKNOWN_TEXT,
  analyzePayoutCoverage,
  buildTickerCompareModel,
  formatMonthList,
  getCompareCandidates,
  normalizeCompareSelection
} from '@/pages/Ticker/utils';

/**
 * 종목 비교의 계약.
 *
 * 🔴 이 스위트가 지키는 단 하나의 큰 규칙: **가정을 사실처럼 보여주지 않는다.**
 * 비교표는 숫자를 나란히 놓는 순간 전부 같은 무게로 읽히는데, 이 앱의 티커 숫자는 출처가 셋이다
 * (실측 / 계산 가정 / 참고용 관측). 그 구분이 사라지면 우리가 정한 가정이 관측치로 둔갑한다.
 */

describe('선택 정규화', () => {
  it('중복을 없애고 대문자로 맞춘다', () => {
    expect(normalizeCompareSelection(['schd', 'SCHD', ' o '])).toEqual(['SCHD', 'O']);
  });

  it('유니버스에 없는 티커는 조용히 버린다 — 빈 열을 만들지 않는다', () => {
    expect(normalizeCompareSelection(['SCHD', 'NOT_A_TICKER', 'JEPI'])).toEqual(['SCHD', 'JEPI']);
  });

  it(`상한(${MAX_COMPARE_TICKERS}종)에서 자른다`, () => {
    const many = getCompareCandidates()
      .slice(0, MAX_COMPARE_TICKERS + 3)
      .map((candidate) => candidate.ticker);
    expect(normalizeCompareSelection(many)).toHaveLength(MAX_COMPARE_TICKERS);
  });

  it('빈 입력에도 빈 모델을 정상적으로 돌려준다 (화면이 빈 상태를 그린다)', () => {
    const model = buildTickerCompareModel([]);
    expect(model.columns).toEqual([]);
    expect(model.rows.length).toBeGreaterThan(0);
    expect(model.rows.every((row) => row.cells.length === 0)).toBe(true);
  });
});

describe('🔴 숫자의 출처를 표에서 감추지 않는다', () => {
  const model = buildTickerCompareModel(['SCHD', 'JEPI']);
  const rowOf = (key: string) => model.rows.find((row) => row.key === key);

  it('스냅샷이 실제로 덮어쓰는 값만 observed 다', () => {
    // applyMarketData 가 덮어쓰는 것: initialPrice · dividendYield · frequency (+ payoutMonths)
    expect(rowOf('price')?.basis).toBe('observed');
    expect(rowOf('dividendYield')?.basis).toBe('observed');
    expect(rowOf('frequency')?.basis).toBe('observed');
    expect(rowOf('payoutMonths')?.basis).toBe('observed');
  });

  it('🔴 큐레이션·파생값은 assumed 로 표시된다 — 관측치가 아니다', () => {
    expect(rowOf('expectedTotalReturn')?.basis).toBe('assumed');
    expect(rowOf('dividendGrowth')?.basis).toBe('assumed');
  });

  it('🔴 엔진이 쓰지 않는 관측 CAGR 은 reference 로 분리된다', () => {
    expect(rowOf('observedDividendCagr')?.basis).toBe('reference');
  });

  it('🔴 assumed·reference 행에는 오해를 막는 설명이 반드시 있다', () => {
    for (const row of model.rows) {
      if (row.basis === 'observed') continue;
      expect(row.note, `${row.key} 에 설명이 없다`).toBeTruthy();
    }
  });

  it('가정 행의 설명이 "관측이 아니다"를 실제로 말한다', () => {
    expect(rowOf('dividendGrowth')?.note).toContain('관측치가 아닙니다');
    expect(rowOf('expectedTotalReturn')?.note).toContain('예측한 값이 아닙니다');
    expect(rowOf('observedDividendCagr')?.note).toContain('계산에는 쓰이지 않습니다');
  });
});

describe('🔴 없는 값을 지어내지 않는다', () => {
  it('스냅샷에 관측 CAGR 이 없는 종목은 "자료 없음"이고 숫자가 null 이다', () => {
    // JEPI 는 실측 CAGR 이 없다(2026-07-29 스냅샷). 데이터가 생기면 이 단정은 다른 종목으로 옮긴다.
    const model = buildTickerCompareModel(['JEPI']);
    const cell = model.rows.find((row) => row.key === 'observedDividendCagr')?.cells[0];
    expect(cell?.isUnknown).toBe(true);
    expect(cell?.text).toBe(UNKNOWN_TEXT);
    expect(cell?.numeric).toBeNull();
  });

  it('값이 없는 칸은 최고·최저 비교에서 빠진다', () => {
    const model = buildTickerCompareModel(['SCHD', 'JEPI']);
    const row = model.rows.find((r) => r.key === 'observedDividendCagr');
    const unknownIndex = row?.cells.findIndex((cell) => cell.isUnknown) ?? -1;
    expect(unknownIndex).toBeGreaterThanOrEqual(0);
    expect(row?.highestIndexes).not.toContain(unknownIndex);
    expect(row?.lowestIndexes).not.toContain(unknownIndex);
  });
});

describe('최고·최저 표시', () => {
  it('비교 대상이 하나뿐이면 아무것도 표시하지 않는다 (비교가 성립하지 않는다)', () => {
    const model = buildTickerCompareModel(['SCHD']);
    expect(model.rows.every((row) => row.highestIndexes.length === 0 && row.lowestIndexes.length === 0)).toBe(true);
  });

  it('값이 전부 같으면 "가장 높다"를 말하지 않는다', () => {
    // 같은 티커를 두 번 넣으면 중복 제거로 1열이 되므로, 동점 판정은 실제 동점 데이터로 본다.
    const model = buildTickerCompareModel(['SCHD', 'SCHD']);
    expect(model.columns).toHaveLength(1);
  });

  it('숫자가 있는 행에서 최고·최저가 실제 값과 일치한다', () => {
    const model = buildTickerCompareModel(['SCHD', 'JEPI', 'O']);
    const row = model.rows.find((r) => r.key === 'dividendYield');
    const values = row?.cells.map((cell) => cell.numeric ?? Number.NaN) ?? [];
    const max = Math.max(...values);
    const min = Math.min(...values);
    for (const index of row?.highestIndexes ?? []) expect(values[index]).toBe(max);
    for (const index of row?.lowestIndexes ?? []) expect(values[index]).toBe(min);
  });
});

describe('지급월 겹침 — 이 화면의 차별점', () => {
  it('달마다 지급하는 종목을 모은다', () => {
    const coverage = analyzePayoutCoverage([
      { ticker: 'A', payoutMonths: [3, 6, 9, 12] },
      { ticker: 'B', payoutMonths: [1, 4, 7, 10] }
    ]);
    expect(coverage.tickersByMonth[2]).toEqual(['A']); // 3월
    expect(coverage.tickersByMonth[0]).toEqual(['B']); // 1월
    expect(coverage.coveredMonths).toEqual([1, 3, 4, 6, 7, 9, 10, 12]);
    expect(coverage.gapMonths).toEqual([2, 5, 8, 11]);
    expect(coverage.isEveryMonthCovered).toBe(false);
  });

  it('세 분기 종목을 엇갈리게 모으면 12개월이 덮인다', () => {
    const coverage = analyzePayoutCoverage([
      { ticker: 'A', payoutMonths: [1, 4, 7, 10] },
      { ticker: 'B', payoutMonths: [2, 5, 8, 11] },
      { ticker: 'C', payoutMonths: [3, 6, 9, 12] }
    ]);
    expect(coverage.isEveryMonthCovered).toBe(true);
    expect(coverage.gapMonths).toEqual([]);
  });

  it('🔴 지급월을 모르는 종목은 "지급 안 함"이 아니라 따로 보고된다', () => {
    const coverage = analyzePayoutCoverage([
      { ticker: 'A', payoutMonths: [6, 12] },
      { ticker: 'UNKNOWN', payoutMonths: undefined }
    ]);
    expect(coverage.unknownTickers).toEqual(['UNKNOWN']);
    // 모른다는 이유로 빈 달이 늘어나면 안 된다 — A 의 달만 덮인 것으로 센다.
    expect(coverage.coveredMonths).toEqual([6, 12]);
    expect(coverage.tickersByMonth.flat()).not.toContain('UNKNOWN');
  });

  it('범위 밖·중복 달은 정규화한다 (생성물을 그대로 믿지 않는다)', () => {
    const coverage = analyzePayoutCoverage([{ ticker: 'A', payoutMonths: [0, 1, 1, 13, 12, 6.5] }]);
    expect(coverage.coveredMonths).toEqual([1, 12]);
  });

  it('실제 데이터로 매월 지급 조합을 판정한다', () => {
    // O(리얼티 인컴)는 매월 지급이라 단독으로 12개월이 덮인다.
    const model = buildTickerCompareModel(['O']);
    expect(model.coverage.isEveryMonthCovered).toBe(true);
  });
});

describe('표시 포맷', () => {
  it('지급월 목록은 가운뎃점으로 잇고 "월"을 한 번만 붙인다', () => {
    expect(formatMonthList([3, 6, 9, 12])).toBe('3·6·9·12월');
  });

  it('빈 목록은 빈 문자열이다 (호출부가 그리지 않는다)', () => {
    expect(formatMonthList([])).toBe('');
  });
});

/**
 * 예시 조합은 **첫인상**이다. 처음 온 사람이 이 화면에서 처음 누르는 것이라, 여기서 빈 열이나
 * "자료 없음"이 나오면 화면이 고장 난 것으로 읽힌다. 그리고 라벨이 사실과 어긋나면 그건 날조다.
 */
describe('예시 조합', () => {
  it('모든 조합이 정규화를 그대로 통과한다 — 예시를 눌렀는데 열이 비지 않는다', () => {
    for (const preset of COMPARE_PRESETS) {
      const normalized = normalizeCompareSelection(preset.tickers);
      // 유니버스에 없거나 중복이거나 상한을 넘으면 여기서 개수가 줄어든다.
      expect(normalized, preset.id).toEqual([...preset.tickers]);
      expect(normalized.length, preset.id).toBeGreaterThanOrEqual(MIN_COMPARE_TICKERS);
      expect(normalized.length, preset.id).toBeLessThanOrEqual(MAX_COMPARE_TICKERS);
    }
  });

  it('모든 조합이 지급월 스냅샷을 가진 종목으로만 이뤄진다 (예시에 "자료 없음" 금지)', () => {
    const withSchedule = new Set(
      getCompareCandidates()
        .filter((candidate) => candidate.hasPayoutMonths)
        .map((candidate) => candidate.ticker)
    );

    for (const preset of COMPARE_PRESETS) {
      for (const ticker of preset.tickers) {
        expect(withSchedule.has(ticker), `${preset.id} / ${ticker}`).toBe(true);
      }
    }
  });

  it('id 와 조합이 중복되지 않는다 — 같은 화면에 같은 예시가 두 번 뜨지 않는다', () => {
    const ids = COMPARE_PRESETS.map((preset) => preset.id);
    const combos = COMPARE_PRESETS.map((preset) => [...preset.tickers].sort().join(','));
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(combos).size).toBe(combos.length);
  });

  /**
   * 🔴 이 조합의 라벨은 "매달 받기"라고 **주장**한다. 주장은 데이터가 져야 한다 —
   * 스냅샷이 바뀌어 12칸이 깨지면 라벨이 거짓이 되므로, 라벨보다 이 테스트가 먼저 깨져야 한다.
   */
  it('"분기 3종을 엇갈려 매달 받기"는 실제로 12칸을 채운다', () => {
    const preset = COMPARE_PRESETS.find((item) => item.id === 'quarterly-monthly');
    expect(preset).toBeDefined();

    const model = buildTickerCompareModel(preset!.tickers);
    expect(model.coverage.gapMonths).toEqual([]);
    expect(model.coverage.isEveryMonthCovered).toBe(true);
    // 매월 지급 종목을 몰래 끼워 넣어 12칸을 채우는 것은 이 예시의 취지가 아니다.
    expect(model.rows.find((row) => row.key === 'frequency')?.cells.map((cell) => cell.text)).toEqual([
      '분기',
      '분기',
      '분기'
    ]);
  });
});

describe('기준일', () => {
  it('실측값의 기준일을 함께 준다 — 언제 값인지 없이 숫자만 보여주지 않는다', () => {
    const model = buildTickerCompareModel(['SCHD']);
    expect(model.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
