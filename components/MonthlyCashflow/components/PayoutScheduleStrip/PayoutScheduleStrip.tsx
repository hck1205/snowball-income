import { ChevronRight } from 'lucide-react';
import { HintText } from '@/components/common';
import type { PayoutScheduleStripProps } from './PayoutScheduleStrip.types';
import {
  ScheduleBody,
  ScheduleDetails,
  ScheduleDot,
  ScheduleScroll,
  ScheduleSourceBadge,
  ScheduleSummary,
  ScheduleTable,
  ScheduleTickerCell
} from './PayoutScheduleStrip.styled';

const MONTH_HEADERS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

/**
 * 스트립 하단 고지. 두 사실을 정직하게 말한다:
 * 1) "추정" 종목은 배당락일 기반이라 실제 입금 달이 다를 수 있다(월말 배당락 → 다음 달 입금).
 * 2) "실측"도 과거 이력이다 — 운용사가 일정을 바꾸면 달라질 수 있다.
 * 위 차트(시뮬레이션 분배)와 이 표(관측 이력)가 다를 수 있는 이유도 여기서 설명된다.
 */
const SCHEDULE_DISCLAIMER =
  '지급 월은 과거 지급 이력에서 관측한 값입니다. "추정" 표시는 배당락일 기준이라 실제 입금 달과 다를 수 있고, ' +
  '"실측"이라도 운용사 사정에 따라 일정이 바뀔 수 있습니다. 위 차트는 시뮬레이션의 분배 가정이라 이 표와 다를 수 있습니다.';

/** 종목 × 12개월 점 표. 네이티브 `<details>` 라 JS 상태 없이 접힘/펼침이 동작한다. */
function PayoutScheduleStrip({ rows }: PayoutScheduleStripProps) {
  return (
    <ScheduleDetails>
      <ScheduleSummary>
        <ChevronRight size={14} aria-hidden focusable={false} />
        종목별 실제 지급 월 (지급 이력 기준)
      </ScheduleSummary>
      <ScheduleBody>
        <ScheduleScroll>
          <ScheduleTable>
            <thead>
              <tr>
                <ScheduleTickerCell scope="col">종목</ScheduleTickerCell>
                {MONTH_HEADERS.map((label) => (
                  <th key={label} scope="col">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.ticker}>
                  <ScheduleTickerCell scope="row">
                    {row.displayName}
                    <ScheduleSourceBadge $estimated={row.source === 'ex'}>
                      {row.source === 'pay' ? '실측' : '추정'}
                    </ScheduleSourceBadge>
                  </ScheduleTickerCell>
                  {MONTH_HEADERS.map((label, monthIndex) => {
                    const paying = row.months.includes(monthIndex + 1);
                    return (
                      <td key={label} aria-label={paying ? `${label} 지급` : undefined}>
                        <ScheduleDot $paying={paying} aria-hidden={paying ? undefined : true} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </ScheduleTable>
        </ScheduleScroll>
        <HintText>{SCHEDULE_DISCLAIMER}</HintText>
      </ScheduleBody>
    </ScheduleDetails>
  );
}

export default PayoutScheduleStrip;
