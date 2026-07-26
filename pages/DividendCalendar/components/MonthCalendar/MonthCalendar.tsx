import { DIVIDEND_CALENDAR_COPY } from '../../copy';
import { tickerSeriesVar } from '../../utils';
import type { MonthCalendarProps } from './MonthCalendar.types';
import { splitDayChips } from './MonthCalendar.utils';
import {
  CalendarCaption,
  CalendarTable,
  ChipDot,
  ChipLabel,
  CountBadge,
  DayCellRoot,
  DayChip,
  DayChipItem,
  DayChipList,
  DayHead,
  DayJumpButton,
  DayNumber,
  MoreCount,
  TodayBadge,
  VisuallyHidden,
  WeekdayHead
} from './MonthCalendar.styled';

const copy = DIVIDEND_CALENDAR_COPY;

/**
 * 월간 주 × 일 그리드.
 *
 * `<table>`을 쓰는 이유: 열=요일, 행=주가 **사실**이다(v1의 연간 12칸엔 요일 축이 없어 표가 거짓이었다).
 * 다만 `role="grid"`는 쓰지 않는다 — grid 롤은 로빙 tabindex + 화살표 키 이동 계약을 동반하는데
 * 이 날짜 칸은 선택 대상이 아니다(날짜 피커가 아니다). 지키지 않을 계약을 선언하는 건 무선언보다 나쁘다.
 *
 * 이월(앞뒤 달) 날짜는 비우지 않고 회색으로 렌더한다 — 빈 칸은 주 구조를 읽기 어렵게 만들고
 * "그날 아무 일 없음"으로 오독된다. 대신 칩은 놓지 않는다(그 달로 이동했을 때 보여주는 게 정확하다).
 *
 * DOM은 **뷰포트 폭과 무관하게 동일하다** — 좁은 폭의 밀도 조절(칩 → 색점, 개수 배지)은 전부 CSS다.
 */
export default function MonthCalendar({ weeks, monthLabel, labelledById, onDayJump }: MonthCalendarProps) {
  return (
    <CalendarTable aria-labelledby={labelledById}>
      <CalendarCaption>{copy.board.caption(monthLabel)}</CalendarCaption>
      <thead>
        <tr>
          {copy.board.weekdays.map((weekday, index) => (
            <WeekdayHead key={weekday} scope="col" $weekday={index}>
              <abbr title={copy.board.weekdayFull[index]}>{weekday}</abbr>
            </WeekdayHead>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week) => (
          <tr key={week[0].date}>
            {week.map((cell) => {
              const { visible, hiddenCount } = splitDayChips(cell.items);
              const cellMonth = Number(cell.date.slice(5, 7));

              return (
                <DayCellRoot
                  key={cell.date}
                  $inMonth={cell.inMonth}
                  $past={cell.isPast}
                  $hasPayout={cell.items.length > 0}
                  $today={cell.isToday}
                  aria-current={cell.isToday ? 'date' : undefined}
                >
                  <DayHead>
                    <DayNumber $muted={!cell.inMonth || cell.isPast}>
                      <time dateTime={cell.date}>
                        {cell.inMonth ? null : (
                          <VisuallyHidden>{copy.board.outOfMonthPrefix(cellMonth)}</VisuallyHidden>
                        )}
                        {cell.day}
                      </time>
                    </DayNumber>
                    {cell.isToday ? <TodayBadge>{copy.board.today}</TodayBadge> : null}
                    {cell.items.length > 0 ? (
                      <CountBadge aria-label={copy.board.dayCountAria(cell.items.length)}>
                        {cell.items.length}
                      </CountBadge>
                    ) : null}
                  </DayHead>

                  {cell.items.length > 0 ? (
                    <DayChipList>
                      {visible.map((item) => (
                        <DayChipItem key={item.ticker}>
                          {/* 칩별 title은 없다 — 좁은 폭에서 칩이 점으로 줄어 hover 대상이 되지 못한다.
                              대신 칸 전체를 덮는 버튼의 title(`board.dayTooltip`)이 그 날 종목을 말한다. */}
                          <DayChip>
                            <ChipDot aria-hidden style={{ background: tickerSeriesVar(item.ticker) }} />
                            <ChipLabel>{item.ticker}</ChipLabel>
                          </DayChip>
                        </DayChipItem>
                      ))}
                    </DayChipList>
                  ) : null}

                  {hiddenCount > 0 ? (
                    <MoreCount>
                      {copy.board.moreCount(hiddenCount)}
                      <VisuallyHidden> {copy.board.moreCountAria(hiddenCount)}</VisuallyHidden>
                    </MoreCount>
                  ) : null}

                  {/* 칸 전체를 덮는 이동 버튼은 **마지막 자식**이다 — 앞의 내용 위에 깔린다.
                      이월 칸은 items가 항상 비어 있어 자동으로 제외된다. */}
                  {onDayJump && cell.items.length > 0 ? (
                    <DayJumpButton
                      type="button"
                      aria-label={copy.board.dayJump(cellMonth, cell.day, cell.items.length)}
                      title={copy.board.dayTooltip(
                        cellMonth,
                        cell.day,
                        cell.items.map((item) => item.ticker)
                      )}
                      onClick={() => onDayJump(cell.date)}
                    />
                  ) : null}
                </DayCellRoot>
              );
            })}
          </tr>
        ))}
      </tbody>
    </CalendarTable>
  );
}
