import { Chip } from '@/components/common';
import { DIVIDEND_CALENDAR_COPY } from '../../copy';
import { ScheduleSourceBadge } from '../ScheduleSourceBadge';
import type { MonthBoardProps } from './MonthBoard.types';
import {
  BoardList,
  CurrentMonthBadge,
  MonthBody,
  MonthChipItem,
  MonthChipLabel,
  MonthChipList,
  MonthHead,
  MonthItem,
  MonthLabel,
  MonthSummary
} from './MonthBoard.styled';

const copy = DIVIDEND_CALENDAR_COPY;

/**
 * 연간 12칸 보드.
 *
 * `<table>`/`role="grid"`를 쓰지 않는다 — 요일 축이 없으므로 격자 시맨틱은 거짓이다.
 * 순서 있는 목록(`<ol>`)이 1월→12월이라는 유일한 축을 정확히 말한다.
 */
export default function MonthBoard({ months, currentMonth }: MonthBoardProps) {
  return (
    <BoardList>
      {months.map((cell) => {
        const paying = cell.items.length > 0;

        return (
          <MonthItem key={cell.month} $paying={paying} $current={cell.month === currentMonth}>
            <MonthHead>
              <MonthLabel>{copy.board.monthLabel(cell.month)}</MonthLabel>
              {cell.month === currentMonth ? (
                <CurrentMonthBadge>{copy.badge.currentMonth}</CurrentMonthBadge>
              ) : null}
            </MonthHead>
            <MonthBody>
              <MonthSummary $paying={paying}>
                {paying ? copy.board.payingCount(cell.items.length) : copy.board.noPayout}
              </MonthSummary>
              {paying ? (
                <MonthChipList>
                  {cell.items.map((item) => (
                    <MonthChipItem key={item.ticker}>
                      <Chip title={item.koreanName}>
                        <MonthChipLabel>
                          {item.ticker}
                          <ScheduleSourceBadge source={item.source} />
                        </MonthChipLabel>
                      </Chip>
                    </MonthChipItem>
                  ))}
                </MonthChipList>
              ) : null}
            </MonthBody>
          </MonthItem>
        );
      })}
    </BoardList>
  );
}
