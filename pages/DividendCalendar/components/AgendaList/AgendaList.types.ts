import type { AgendaDay, TickerSeriesResolver } from '../../utils';

export type AgendaListProps = {
  /**
   * 티커 → 그 달의 예상 금액 문자열. **내 배당 탭에서만** 온다(전체 탭은 금액 개념이 없다).
   * 키가 없는 종목은 금액을 그리지 않는다 — 0 원으로 위장하지 않는다.
   */
  amountLabelByTicker?: Record<string, string>;
  /** 항목이 있는 날짜만, 날짜 오름차순. */
  days: AgendaDay[];
  /** 화면 하나가 만든 색 사전(`tickerSeriesResolver`). 달력 칩·범례와 같은 값이어야 한다. */
  seriesOf?: TickerSeriesResolver;
  /** 날짜는 없지만 그 달 지급 예정인 종목이 있는가 — 비었을 때 문구를 가른다. */
  hasUndated: boolean;
  /**
   * 달력 칸에서 눌러 들어온 날짜(ISO). 그 날짜 블록을 강조한다.
   * 타이머로 흐려지지 않는다 — 다른 날짜를 누르거나 달을 옮길 때까지 "방금 여기로 왔다"가 남아야 한다.
   */
  highlightedDate?: string | null;
};
