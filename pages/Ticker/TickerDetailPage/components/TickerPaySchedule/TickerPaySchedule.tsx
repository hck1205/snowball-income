import { DataTable } from '@/components/common';
import { TICKER_PAY_COPY, type TickerPayRow } from '@/shared/lib/tickerPayDates';
import {
  AnswerHeading,
  AnswerLead,
  AnswerLeadItem,
  AnswerLeadLabel,
  AnswerLeadValue,
  AnswerNote,
  AnswerSection
} from './TickerPaySchedule.styled';
import type { TickerPayScheduleProps } from './TickerPaySchedule.types';

const copy = TICKER_PAY_COPY;

/** 화면에 펼칠 최대 줄 — 매월 지급 종목은 카드 12장이 이어져 너무 길다. 다가오는 몇 번만 보인다(서버 HTML 은 전부). */
const VISIBLE_ROWS = 4;

const visibleRows = (rows: readonly TickerPayRow[], nextLabel: string | undefined): TickerPayRow[] => {
  if (rows.length <= VISIBLE_ROWS) return [...rows];
  const start = Math.max(0, rows.findIndex((row) => row.payLabel === nextLabel));
  return Array.from({ length: 3 }, (_, offset) => rows[(start + offset) % rows.length]!);
};

/**
 * "{티커} 배당일" 답 상자(2026-11-12) — 다음 지급 예상, 지급 주기, 월별 예상 지급일·배당락일.
 * 숫자는 `buildTickerPaySchedule`(서버 HTML 과 같은 함수)에서 온다. 근거 등급(실제 지급일 / 배당락일 추정)을
 * 아래 주석 문장이 그대로 밝힌다 — 추정을 사실처럼 보이지 않게.
 */
const TickerPaySchedule = ({ schedule }: TickerPayScheduleProps) => (
  <AnswerSection id="pay-schedule" aria-labelledby="pay-schedule-heading">
    <AnswerHeading id="pay-schedule-heading">{copy.heading(schedule.ticker)}</AnswerHeading>
    <AnswerLead>
      <AnswerLeadItem>
        <AnswerLeadLabel>{copy.nextLabel}</AnswerLeadLabel>
        <AnswerLeadValue>{schedule.next ? `${schedule.next.year}년 ${schedule.next.label}` : '—'}</AnswerLeadValue>
      </AnswerLeadItem>
      <AnswerLeadItem>
        <AnswerLeadLabel>{copy.cadenceLabel}</AnswerLeadLabel>
        <AnswerLeadValue>{schedule.cadenceLabel}</AnswerLeadValue>
      </AnswerLeadItem>
    </AnswerLead>
    {schedule.source === 'pay' ? (
      <DataTable<TickerPayRow>
        rows={visibleRows(schedule.rows, schedule.next?.label)}
        columns={[
          { key: 'month', header: copy.tableHead[0], render: (row) => `${row.month}월` },
          { key: 'pay', header: copy.tableHead[1], render: (row) => row.payLabel },
          { key: 'ex', header: copy.tableHead[2], render: (row) => row.exLabel ?? '—' }
        ]}
      />
    ) : null}
    <AnswerNote>{copy.sourceNote(schedule)}</AnswerNote>
    <AnswerNote>{copy.exNote}</AnswerNote>
  </AnswerSection>
);

export default TickerPaySchedule;
