import type { AgendaDay } from '../../utils';

export type AgendaListProps = {
  /** 항목이 있는 날짜만, 날짜 오름차순. */
  days: AgendaDay[];
  /** 날짜는 없지만 그 달 지급 예정인 종목이 있는가 — 비었을 때 문구를 가른다. */
  hasUndated: boolean;
};
