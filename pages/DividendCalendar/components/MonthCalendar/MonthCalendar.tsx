import { Tooltip } from '@/components/common';
import { DIVIDEND_CALENDAR_COPY } from '../../copy';
import type { MonthCalendarProps } from './MonthCalendar.types';
import { splitDayChips } from './MonthCalendar.utils';
import {
  CalendarCaption,
  CalendarTable,
  ChipLabel,
  DayCellRoot,
  DayChip,
  DayChipItem,
  DayChipList,
  DayHead,
  DayJumpButton,
  DayNumber,
  MoreCount,
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
 *
 * `isPreview` 는 **예시** 렌더다(종목 미선택 화면). 같은 표를 그대로 쓰되 칩을 흐린 장식으로 낮추고,
 * 표의 이름·캡션이 "예시"임을 말한다 — 흐림은 시각 신호일 뿐이라 그것만으로는 계약이 성립하지 않는다.
 */
export default function MonthCalendar({
  weeks,
  monthLabel,
  labelledById,
  isPreview = false,
  onDayJump
}: MonthCalendarProps) {
  return (
    <CalendarTable
      aria-labelledby={isPreview ? undefined : labelledById}
      aria-label={isPreview ? copy.preview.tableLabel(monthLabel) : undefined}
    >
      <CalendarCaption>
        {isPreview ? copy.preview.caption(monthLabel) : copy.board.caption(monthLabel)}
      </CalendarCaption>
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
                    {/* "오늘"의 시각 신호는 칸 보더 링+틴트가 전담한다(사용자 결정 2026-07-26) —
                        말은 접근성 트리에 남긴다(aria-current="date"와 함께). */}
                    {cell.isToday ? <VisuallyHidden>{copy.board.today}</VisuallyHidden> : null}
                  </DayHead>

                  {cell.items.length > 0 ? (
                    <DayChipList $preview={isPreview}>
                      {visible.map((item) => (
                        <DayChipItem key={item.ticker}>
                          {/* 예시 칩은 버튼이 아니다 — 누를 실체(툴팁·아젠다)가 없는 컨트롤을
                              키보드 순서에 세우면 탭 이동만 늘고 아무 일도 일어나지 않는다. */}
                          {isPreview ? (
                            <DayChip as="span">
                              <ChipLabel>{item.ticker}</ChipLabel>
                            </DayChip>
                          ) : (
                            /* 넓은 폭: 칩(버튼)이 hover/클릭으로 커스텀 툴팁을 연다 — 잘린 티커의 전체
                               이름·예상 지급일을 말한다. 좁은 폭: 칩은 표시 전용(포인터 꺼짐, DayChipList)
                               이라 칸 전체를 덮는 이동 버튼의 title이 대신 말한다. */
                            <Tooltip
                              content={
                                item.day === null
                                  ? copy.board.chipTooltipUndated(item.ticker)
                                  : copy.board.chipTooltip(item.ticker, cellMonth, item.day)
                              }
                            >
                              <DayChip type="button">
                                <ChipLabel>{item.ticker}</ChipLabel>
                              </DayChip>
                            </Tooltip>
                          )}
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
