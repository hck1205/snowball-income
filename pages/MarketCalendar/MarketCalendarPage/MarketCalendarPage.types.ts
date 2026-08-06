import type {
  EarningsEvent,
  MarketCalendarSnapshot,
  MarketEarlyClose,
  MarketHoliday
} from '@/shared/constants/marketCalendar';

export type MarketCalendarViewModel = {
  /** 🔴 컨테이너가 만들어 넘긴다 — 계산·뷰가 스스로 `new Date()` 를 부르면 테스트가 실제 날짜에 매인다. */
  readonly today: Date;
  readonly year: number;
  readonly snapshot: MarketCalendarSnapshot;
  /**
   * 그 해의 휴장일과 조기폐장일을 **날짜순으로 섞은** 한 목록.
   *
   * 🔴 둘을 따로 두고 이어 붙이면 표가 `…11/26 · 12/25 · 11/27 · 12/24` 로 뒤엉킨다(실측).
   * 사용자가 이 표에서 찾는 것은 "다음에 언제 쉬나"라 **한 줄의 시간순**이어야 한다.
   * 구분(휴장/조기폐장)은 열 하나가 말한다.
   */
  readonly closures: readonly (MarketHoliday | MarketEarlyClose)[];
  /** 오늘 이후의 실적 발표만. 지난 것은 캘린더 칸에 남고 표에서는 뺀다. */
  readonly earnings: readonly EarningsEvent[];
};

export type MarketCalendarViewProps = {
  readonly viewModel: MarketCalendarViewModel;
};
