import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, OverflowTooltip } from '@/components/common';
import { MARKET_CALENDAR_COPY } from '../../copy';
import type { MonthGridProps } from './MonthGrid.types';
import {
  CalendarRoot,
  Chip,
  ChipLabel,
  ChipList,
  ChipMore,
  DayCell,
  DayLabel,
  DayNumber,
  Dot,
  Grid,
  Legend,
  LegendItem,
  LegendSwatch,
  MonthTitle,
  Toolbar,
  ToolbarButtons,
  WeekdayCell,
  WeekdayRow
} from './MonthGrid.styled';
import { chipsOf, labelOf, splitDayChips, summaryOf, toneOf } from './MonthGrid.utils';

const copy = MARKET_CALENDAR_COPY.month;

const isWeekendIndex = (index: number): boolean => index === 0 || index === 6;

/**
 * 월간 달력 격자.
 *
 * ## 🔴 왜 `<table>` 이 아닌가
 * 이 격자의 각 칸은 "행 머리 × 열 머리"의 교차값이 아니다 — 2주차 목요일 칸의 의미는
 * "2주차"와 "목요일"의 곱이 아니라 **그 날짜 하나**다. 표로 만들면 보조기술이 "2행 5열"을
 * 읽어 주는데 그건 사용자가 원한 정보가 아니다. 그래서 각 칸이 `<time datetime>` 으로
 * 자기 날짜를 스스로 말하는 그리드로 둔다(배당 캘린더와 같은 판단).
 *
 * ## 🔴 색이 유일한 채널이 되지 않게 하는 세 겹
 *  ① 칸 안에 상태 이름이 **글자로** 들어간다("휴장 · 추수감사절").
 *  ② 칸 전체에 `title` 로 그 날의 일정 요약이 붙는다.
 *  ③ 아래 범례가 면색·점색과 이름을 짝지어 보여 준다.
 */
export default function MonthGrid({
  month,
  onShift,
  onReset,
  canReset,
  onSelectDay,
  selectedDate
}: MonthGridProps) {
  return (
    <CalendarRoot>
      <Toolbar>
        <MonthTitle>{copy.title(month.year, month.month)}</MonthTitle>
        <ToolbarButtons>
          {canReset ? (
            <Button variant="ghost" size="sm" onClick={onReset}>
              {copy.thisMonth}
            </Button>
          ) : null}
          <Button
            variant="secondary"
            size="sm"
            iconOnly
            aria-label={copy.previous}
            onClick={() => onShift(-1)}
            startIcon={<ChevronLeft size={16} strokeWidth={1.8} aria-hidden focusable={false} />}
          />
          <Button
            variant="secondary"
            size="sm"
            iconOnly
            aria-label={copy.next}
            onClick={() => onShift(1)}
            startIcon={<ChevronRight size={16} strokeWidth={1.8} aria-hidden focusable={false} />}
          />
        </ToolbarButtons>
      </Toolbar>

      <WeekdayRow aria-hidden>
        {copy.weekdays.map((label, index) => (
          <WeekdayCell key={label} $weekend={isWeekendIndex(index)}>
            {label}
          </WeekdayCell>
        ))}
      </WeekdayRow>

      <Grid>
        {month.weeks.flat().map((cell, index) => {
          const { visible, hiddenCount } = splitDayChips(chipsOf(cell));
          const label = labelOf(cell);
          return (
            <DayCell
              key={cell.date}
              type="button"
              $tone={toneOf(cell)}
              $inMonth={cell.inMonth}
              $today={cell.isToday}
              title={summaryOf(cell)}
              /* 🔴 접근명은 **날짜와 그날의 요약**이다 — 숫자만 읽어 주면 "12"가 무슨 뜻인지 모른다.
                 title 과 같은 문장을 쓴다(둘이 갈리면 마우스 사용자와 스크린리더 사용자가 다른 말을 듣는다). */
              aria-label={summaryOf(cell)}
              aria-pressed={selectedDate === cell.date}
              onClick={() => onSelectDay(cell.date)}
            >
              {/* `<time>` 이 칸의 날짜를 기계에도 사람에게도 같은 값으로 말한다. */}
              <time dateTime={cell.date}>
                <DayNumber $weekend={isWeekendIndex(index % 7)}>{cell.day}</DayNumber>
              </time>
              {label ? <DayLabel>{label}</DayLabel> : null}
              {visible.length > 0 ? (
                <ChipList>
                  {visible.map((chip) => (
                    <Chip key={chip.key}>
                      <Dot $kind={chip.kind} aria-hidden />
                      {/* 지표 이름은 칸 폭을 넘기 쉽다 — 실제로 잘렸을 때만 전체 이름을 띄운다. */}
                      <OverflowTooltip text={chip.label}>
                        <ChipLabel />
                      </OverflowTooltip>
                    </Chip>
                  ))}
                  {hiddenCount > 0 ? <ChipMore>{copy.moreEvents(hiddenCount)}</ChipMore> : null}
                </ChipList>
              ) : null}
            </DayCell>
          );
        })}
      </Grid>

      <Legend>
        <LegendItem>
          <LegendSwatch $tone="closed" />
          {copy.legendHoliday}
        </LegendItem>
        <LegendItem>
          <LegendSwatch $tone="early" />
          {copy.legendEarly}
        </LegendItem>
        <LegendItem>
          <Dot $kind="fomc" />
          FOMC
        </LegendItem>
        <LegendItem>
          <Dot $kind="economic" />
          {copy.legendEvent}
        </LegendItem>
        <LegendItem>
          <Dot $kind="earnings" />
          {copy.legendEarnings}
        </LegendItem>
      </Legend>
    </CalendarRoot>
  );
}
