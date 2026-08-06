import { ChevronRight } from 'lucide-react';
import { DIVIDEND_CALENDAR_COPY } from '../../copy';
import { tickerSeriesVar } from '../../utils';
import { ScheduleSourceBadge } from '../ScheduleSourceBadge';
import type { ScheduleLegendTableProps } from './ScheduleLegendTable.types';
import {
  LegendDetails,
  LegendScroll,
  LegendSummary,
  LegendTable,
  LegendTickerCell,
  LegendTickerLabel,
  LegendTickerText,
  ScheduleDot
} from './ScheduleLegendTable.styled';

const copy = DIVIDEND_CALENDAR_COPY;

const MONTHS: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/**
 * 선택 종목 × 12개월 점 표. 달력이 "이 달에 누가 주나"를 답한다면 이 표는 "이 종목이 언제 주나"를
 * 답한다 — 같은 데이터의 전치(transpose)라 기본은 접어 둔다(네이티브 `details`, JS 상태 없음).
 */
export default function ScheduleLegendTable({
  rows,
  seriesOf = tickerSeriesVar
}: ScheduleLegendTableProps) {
  if (rows.length === 0) return null;

  return (
    <LegendDetails>
      <LegendSummary>
        <ChevronRight size={14} strokeWidth={1.8} aria-hidden focusable={false} />
        {copy.legend.summary}
      </LegendSummary>
      {/*
       * 스크롤 상자에 **이름과 포커스**를 준다 — 좁은 폭에서는 이 표를 옆으로 밀어야만 12개월이 다 보인다.
       *
       * 🔴 `tabIndex={0}` 은 생략할 수 없다. Chrome 127+ 만 스크롤 컨테이너를 기본 포커서블로 만들고
       * Safari 전 버전·구 Chrome 은 그렇지 않은데, 이 표 안에는 대화형 자손이 **하나도 없다**
       * (`th`/`td` 와 점뿐). 그러면 키보드 전용 사용자는 320px 에서 344px 짜리 표의 220px 만 보고
       * 나머지 4~6개월에 영영 닿지 못한다(WCAG 2.1.1). 근거는 우리 가드에도 적혀 있다 —
       * tools/dev/overflowprobe.mjs 의 "이 도구가 보지 않는 것" 절.
       *
       * 이름 규칙은 형제인 법무 고지문 표(pages/Legal/.../LegalDocument.tsx)와 같다: 가로 스크롤 상자는
       * `role="region"` + 접근명 + `tabIndex={0}`. 여기만 `aria-label` 인 이유는 이 표엔 보이는
       * `<caption>` 이 없기 때문이다(제목 역할은 바깥 `summary` 가 한다).
       */}
      <LegendScroll tabIndex={0} role="region" aria-label={copy.legend.regionLabel}>
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
                    <LegendTickerText>{row.ticker}</LegendTickerText>
                    <ScheduleSourceBadge source={row.source} />
                  </LegendTickerLabel>
                </LegendTickerCell>
                {MONTHS.map((month) => {
                  const paying = row.months.includes(month);

                  return (
                    <td key={month} aria-label={paying ? copy.legend.payingCell(month) : undefined}>
                      {/* 지급 달 점은 달력 칩·아젠다와 같은 티커 색이다 — 네 자리가 한 색으로 이어진다.
                          미지급 칸은 **속이 빈 링**이라 색이 아니라 모양이 먼저 가른다. */}
                      <ScheduleDot
                        $paying={paying}
                        aria-hidden={paying ? undefined : true}
                        style={paying ? { background: seriesOf(row.ticker) } : undefined}
                      />
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
