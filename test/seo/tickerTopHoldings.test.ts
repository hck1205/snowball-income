import { describe, expect, it } from 'vitest';
import { TICKER_CONTENT_LIST } from '@/shared/constants/tickers';

/**
 * 상위 보유 종목(`reference.topHoldings`) 데이터 규율.
 *
 * 이 필드는 **발행사 공시를 옮긴 값**이고, 옮기는 과정은 사람이 한다 — 그래서 "숫자가 맞는가"는
 * 테스트로 증명할 수 없다(원본이 여기 없다). 대신 **옮긴 값이 자기모순인가**는 전부 잡을 수 있고,
 * 실제로 이 데이터가 틀리는 방식은 대부분 자기모순이다: 합계가 행들과 안 맞음, 정렬이 깨짐,
 * 기준일이 빠짐, 출처가 발행사가 아님.
 *
 * 🔴 개수를 하드코딩하지 않는다 — 채워진 종목이 몇 개인지는 목록에서 파생한다(종목을 더 채우거나
 * 발행사 접근이 막혀 비우게 돼도 이 파일을 고칠 일이 없어야 한다).
 */

const entriesWithHoldings = TICKER_CONTENT_LIST.filter((content) => content.reference.topHoldings !== undefined);

/**
 * `it.each` 에는 **티커 문자열만** 넘긴다 — 콘텐츠 객체를 넘기면 실패 메시지에 서사 전문이 통째로
 * 찍혀 정작 어긋난 숫자가 안 보인다(실제로 한 번 그렇게 됐다).
 */
const tickersWithHoldings = entriesWithHoldings.map((content) => content.ticker);

const holdingsOf = (ticker: string) => {
  const found = entriesWithHoldings.find((content) => content.ticker === ticker)?.reference.topHoldings;
  if (!found) throw new Error(`${ticker} 에 topHoldings 가 없다`);
  return found;
};

describe('티커 상위 보유 종목 데이터', () => {
  it('최소한 몇 종목에는 채워져 있다 (전부 비면 이 아래 검사가 전부 무음 통과한다)', () => {
    expect(entriesWithHoldings.length).toBeGreaterThan(0);
  });

  it.each(tickersWithHoldings)('%s: 비중 합계가 실제 행 합계와 일치하고, 100%%가 아니다', (ticker) => {
    const topHoldings = holdingsOf(ticker);
    const summed = topHoldings.holdings.reduce((total, holding) => total + holding.weightPercent, 0);

    // 화면이 각 행을 그대로 더해도 합계 표기와 어긋나지 않아야 한다(부동소수 오차만 허용).
    expect(topHoldings.coveredWeightPercent).toBeCloseTo(summed, 2);
    // 상위 N종만 담으므로 전체를 덮을 수 없다 — 덮었다면 "상위"라는 전제가 깨진 것이다.
    expect(topHoldings.coveredWeightPercent).toBeLessThan(100);
    expect(topHoldings.coveredWeightPercent).toBeGreaterThan(0);
  });

  it.each(tickersWithHoldings)('%s: 비중 내림차순이고 심볼 중복이 없다', (ticker) => {
    const { holdings } = holdingsOf(ticker);

    const weights = holdings.map((holding) => holding.weightPercent);
    expect(weights).toEqual([...weights].sort((a, b) => b - a));

    const symbols = holdings.map((holding) => holding.symbol);
    expect(new Set(symbols).size).toBe(symbols.length);
  });

  it.each(tickersWithHoldings)('%s: 모든 행에 심볼·이름·양의 비중이 있다', (ticker) => {
    const { holdings } = holdingsOf(ticker);
    expect(holdings.length).toBeGreaterThan(0);

    holdings.forEach((holding) => {
      expect(holding.symbol.trim()).not.toBe('');
      expect(holding.name.trim()).not.toBe('');
      expect(holding.weightPercent).toBeGreaterThan(0);
    });
  });

  /**
   * 기준일이 없거나 미래면 "언제 낡았는지"를 아무도 알 수 없다 — 이 데이터의 유일한 신선도 단서다.
   * 미래 날짜 금지는 실제 사고 방지책이다(한 발행사가 조회일보다 뒤인 날짜를 표기하고 있었다).
   */
  it.each(tickersWithHoldings)('%s: 기준일이 ISO date 이고 미래가 아니다', (ticker) => {
    const { asOfDate } = holdingsOf(ticker);
    expect(asOfDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Date.parse(asOfDate)).toBeLessThanOrEqual(Date.now());
  });

  it.each(tickersWithHoldings)('%s: 출처가 발행사 공식 https URL 이고 라벨이 비어 있지 않다', (ticker) => {
    const topHoldings = holdingsOf(ticker);
    expect(topHoldings.sourceLabel.trim()).not.toBe('');
    expect(topHoldings.sourceUrl).toMatch(/^https:\/\//);
  });

  /**
   * 커버드콜 ETF의 공시 목록에는 주식과 숏 콜옵션이 섞여 있다. 옵션 라인을 주식처럼 한 조각으로
   * 그리면 오해가 되므로 주식만 담기로 했고, **무엇을 왜 뺐는지 데이터가 스스로 말해야** 한다.
   */
  it('커버드콜 종목에 보유 종목을 채웠다면 제외 사유(excludedNote)가 반드시 있다', () => {
    const coveredCallWithHoldings = entriesWithHoldings.filter((content) => content.categoryIds.includes('covered-call'));

    coveredCallWithHoldings.forEach((content) => {
      expect(content.reference.topHoldings?.excludedNote ?? '').not.toBe('');
    });
  });

  /**
   * 개별 종목(주식·리츠)에는 "구성 종목"이라는 개념이 없다 — 필드를 채우면 그 자체가 거짓이다.
   * 카테고리로 판정한다(`dividend-stock` = 이 레포에서 개별 종목을 뜻하는 분류).
   */
  it('개별 종목 엔트리에는 보유 종목을 채우지 않는다', () => {
    const individualStocks = TICKER_CONTENT_LIST.filter((content) => content.categoryIds.includes('dividend-stock'));

    expect(individualStocks.length).toBeGreaterThan(0);
    individualStocks.forEach((content) => {
      expect(content.reference.topHoldings).toBeUndefined();
    });
  });

  /**
   * 보유 종목을 채웠으면 `asOfNote`(전 엔트리 필수 고지문)도 그 사실을 말해야 한다 — 고지문이
   * "대표 보유 종목은 다루지 않았습니다"라고 적힌 채 표가 렌더되면 페이지가 스스로를 반박한다.
   */
  it('보유 종목을 채운 엔트리의 asOfNote 는 "다루지 않았습니다"라고 말하지 않는다', () => {
    entriesWithHoldings.forEach((content) => {
      expect(content.reference.asOfNote).not.toMatch(/대표 보유 종목[^.]*다루지 않았습니다/);
      expect(content.reference.asOfNote).toContain('대표 보유 종목과 비중은');
    });
  });
});
