import type { ExpectedPayout, TickerSeriesResolver } from '../../utils';

export type UndatedSectionProps = {
  /** 그 달 지급 예정이지만 날짜를 추정할 수 없는 종목들. 0건이면 아무것도 렌더하지 않는다. */
  items: ExpectedPayout[];
  /** 화면 하나가 만든 색 사전(`tickerSeriesResolver`). 달력 칩·아젠다와 같은 값이어야 한다. */
  seriesOf?: TickerSeriesResolver;
};
