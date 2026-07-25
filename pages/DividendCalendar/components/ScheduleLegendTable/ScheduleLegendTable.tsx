import { ChevronRight } from 'lucide-react';
import { DIVIDEND_CALENDAR_COPY } from '../../copy';
import { ScheduleSourceBadge } from '../ScheduleSourceBadge';
import type { ScheduleLegendTableProps } from './ScheduleLegendTable.types';
import {
  LegendDetails,
  LegendScroll,
  LegendSummary,
  LegendTable,
  LegendTickerCell,
  LegendTickerLabel,
  ScheduleDot
} from './ScheduleLegendTable.styled';

const copy = DIVIDEND_CALENDAR_COPY;

const MONTHS: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/**
 * 선택 종목 × 12개월 점 표. 달력이 "이 달에 누가 주나"를 답한다면 이 표는 "이 종목이 언제 주나"를
 * 답한다 — 같은 데이터의 전치(transpose)라 기본은 접어 둔다(네이티브 `details`, JS 상태 없음).
 */
export default function ScheduleLegendTable({ rows }: ScheduleLegendTableProps) {
  if (rows.length === 0) return null;

  return (
    <LegendDetails>
      <LegendSummary>
        <ChevronRight size={14} strokeWidth={1.8} aria-hidden focusable={false} />
        {copy.legend.summary}
      </LegendSummary>
      <LegendScroll>
        <LegendTable>
          <thead>
            <tr>
              <LegendTickerCell scope="col">{copy.legend.tickerColumn}</LegendTickerCell>
              {MONTHS.map((month) => (
                <th key={month} scope="col">
                  {copy.board.monthLabel(month)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.ticker}>
                <LegendTickerCell scope="row">
                  <LegendTickerLabel>
                    {row.ticker}
                    <ScheduleSourceBadge source={row.source} />
                  </LegendTickerLabel>
                </LegendTickerCell>
                {MONTHS.map((month) => {
                  const paying = row.months.includes(month);

                  return (
                    <td key={month} aria-label={paying ? copy.legend.payingCell(month) : undefined}>
                      <ScheduleDot $paying={paying} aria-hidden={paying ? undefined : true} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </LegendTable>
      </LegendScroll>
    </LegendDetails>
  );
}
