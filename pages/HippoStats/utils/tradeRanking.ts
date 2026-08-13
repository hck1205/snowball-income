import { CONGRESS_TRADES } from '@/shared/constants/congressTrades';

/**
 * 외부 포트폴리오에서 **매수·매도 상위 종목**을 뽑는다.
 *
 * ## 🔴 네 자료 중 매수/매도를 아는 것은 하나뿐이다
 *
 * "외부 포트폴리오의 모든 데이터를 통계 낸다"가 이 화면의 목표였지만, 열어 보니 그렇게 할 수
 * 없었다. 넷이 **서로 다른 종류의 증거**이기 때문이다:
 *
 * | 자료 | 실제로 담긴 것 | 매수/매도 |
 * |---|---|---|
 * | 미국 의원 (STOCK Act) | 매수·매도 **거래 신고 건수** | ✅ 진짜 거래다 |
 * | 국민연금 13F | 보유 스냅샷 + 전분기 대비 비중 증감 | △ "보유가 늘었다"이지 "샀다"가 아니다 |
 * | 대가들 13F | **보유 스냅샷만** (전분기 비교 없음) | ❌ 유도할 수 없다 |
 * | 한국 국회의원 | 연 1회 보유 주식 수 | ❌ 개념 자체가 없다 |
 *
 * 이 넷을 한 파이에 더하면 **거래 건수 + 비중 증감 + 보유 주식 수**를 합산하는 셈이다.
 * 단위가 다른 것을 더한 숫자는 무엇도 뜻하지 않는다 — 그래서 **미국 의원 거래만** 쓰고,
 * 화면이 그 범위를 이름과 문구로 분명히 말한다(지어낸 숫자 0).
 *
 * ⚠ 대가들 수집기가 직전 분기 13F 를 함께 받아 CUSIP 으로 대조하게 되면, "몇 곳이 늘렸나"를
 *   같은 단위로 셀 수 있어 그때 축을 하나 더 붙일 수 있다. 지금은 그 데이터가 없다.
 */

export type TradeRank = {
  ticker: string;
  name: string;
  /** 신고된 거래 **건수**다. 금액이 아니다 — 신고서가 금액을 구간으로만 적는다. */
  count: number;
};

/** 파이 조각 수. 10을 넘기면 조각이 실처럼 얇아져 이름이 안 붙는다. */
const TOP_N = 10;

const rank = (pick: (row: { buys: number; sells: number }) => number): TradeRank[] =>
  CONGRESS_TRADES.topTickers
    .map((row) => ({ ticker: row.ticker, name: row.name, count: pick(row) }))
    /* 0건짜리는 뺀다 — 파이에 0 조각을 넣으면 라벨만 떠다닌다. */
    .filter((row) => row.count > 0)
    .sort((left, right) => right.count - left.count || left.ticker.localeCompare(right.ticker))
    .slice(0, TOP_N);

export const topBuys = (): TradeRank[] => rank((row) => row.buys);
export const topSells = (): TradeRank[] => rank((row) => row.sells);

/** 비교 담기 목록의 한 줄 — 공시된 거래 종목 중 비교로 보낼 수 있는 것. */
export type TradeHolding = {
  ticker: string;
  name: string;
  /** 🔴 매수·매도를 **합친** 신고 건수다. 이 목록의 관심은 방향이 아니라 "얼마나 자주 오르내렸나"다. */
  count: number;
};

/**
 * 공시된 거래 종목을 신고 건수 내림차순으로(연결① 의 비교 담기 원천).
 *
 * 🔴 위 도넛(`topBuys`·`topSells`)과 **다른 목록**이다. 도넛은 매수·매도를 갈라 세지만 여기서는
 *    둘을 합친다 — 담아서 견줄 대상은 "많이 사고팔린 종목"이지 방향이 아니고, 같은 종목이
 *    양쪽 도넛에 나오면 목록에서 두 줄이 되어 체크박스가 둘로 갈린다.
 * 🔴 대가 목록(`topComparableGuruHoldings`)과 달리 **티커 변환이 필요 없다** — 의원 신고는
 *    처음부터 티커로 온다. 유니버스 소속 최종 판정은 화면(`useCompareSelection.isDisabled`)이 한다.
 */
export const topComparableTradeTickers = (limit = 12): TradeHolding[] =>
  CONGRESS_TRADES.topTickers
    .map((row) => ({ ticker: row.ticker, name: row.name, count: row.buys + row.sells }))
    .filter((row) => row.count > 0)
    .sort((left, right) => right.count - left.count || left.ticker.localeCompare(right.ticker))
    .slice(0, limit);

/** 집계가 덮는 기간 — 화면이 반드시 함께 보여 준다(자료마다 시점이 다르다). */
export const tradeWindow = () => CONGRESS_TRADES.window;

/** 종목명이 길어 파이 라벨에 안 들어간다 — 티커만 쓰고 전체 이름은 툴팁이 맡는다. */
export const shortNameOf = (row: TradeRank): string => row.ticker;
