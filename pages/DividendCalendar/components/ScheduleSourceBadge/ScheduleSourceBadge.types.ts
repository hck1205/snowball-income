import type { CalendarScheduleSource } from '../../utils';

export type ScheduleSourceBadgeProps = {
  /**
   * `null` = 지급월 데이터가 아직 없는 종목("데이터 준비 중").
   * 운용사 공시로 확정된 일정('확정')은 v1 데이터에 없어 이 유니온에 넣지 않았다 —
   * 값이 생기는 날 타입부터 넓히면 표시되지 않는 배지를 미리 만들게 된다.
   */
  source: CalendarScheduleSource | null;
};
