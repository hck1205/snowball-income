import { DIVIDEND_CALENDAR_COPY } from '../../copy';
import {
  CalendarCaption,
  CalendarTable,
  DayCellRoot,
  SkeletonBlock,
  WeekdayHead
} from './MonthCalendar.styled';

const copy = DIVIDEND_CALENDAR_COPY;

const WEEKS = [0, 1, 2, 3, 4, 5];
const DAYS = [0, 1, 2, 3, 4, 5, 6];

export type MonthCalendarSkeletonProps = {
  monthLabel: string;
};

/**
 * 저장된 선택을 불러오는 동안의 골격. 툴바·요일 헤더는 실제 값이라 그대로 두고 **칸 안만** 펄스 블록이다
 * (6주 고정이라 로딩이 끝나도 표 높이가 튀지 않는다). 상태 안내는 라이브 리전이 읽으므로 블록은 감춘다.
 */
export default function MonthCalendarSkeleton({ monthLabel }: MonthCalendarSkeletonProps) {
  return (
    <CalendarTable aria-hidden>
      <CalendarCaption>{copy.board.caption(monthLabel)}</CalendarCaption>
      <thead>
        <tr>
          {copy.board.weekdays.map((weekday) => (
            <WeekdayHead key={weekday} scope="col">
              {weekday}
            </WeekdayHead>
          ))}
        </tr>
      </thead>
      <tbody>
        {WEEKS.map((week) => (
          <tr key={week}>
            {DAYS.map((day) => (
              <DayCellRoot key={day} $inMonth $past={false} $hasPayout={false} $today={false}>
                <SkeletonBlock />
              </DayCellRoot>
            ))}
          </tr>
        ))}
      </tbody>
    </CalendarTable>
  );
}
