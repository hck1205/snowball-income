import { DIVIDEND_CALENDAR_COPY } from '../../copy';
import { agendaDayElementId, tickerSeriesVar } from '../../utils';
import { ScheduleSourceBadge } from '../ScheduleSourceBadge';
import type { AgendaListProps } from './AgendaList.types';
import {
  AgendaDateBadge,
  AgendaDayItem,
  AgendaDayLabel,
  AgendaDayList,
  AgendaDot,
  AgendaEmpty,
  AgendaItem,
  AgendaItemList,
  AgendaName,
  AgendaRoot,
  AgendaTicker
} from './AgendaList.styled';

const copy = DIVIDEND_CALENDAR_COPY;

/**
 * 날짜순 지급 일정 목록 — **모든 폭에서 렌더한다**(데스크톱에서도 숨기지 않는다).
 *
 * 세 가지 이유로 표와 공존한다: ①폭에 따라 DOM을 바꾸지 않기 위해(jsdom은 `@media`를 안 본다),
 * ②표 칸에서 밀도 때문에 잘린 정보(`+N`, 좁은 폭의 감춰진 칩)의 **완전한 원본**이 항상 화면에
 * 있어야 하고, ③스크린리더·검색엔진에 선형 텍스트가 하나 필요하다.
 * 그래서 여기서는 표 셀이 생략한 한글명과 실측/추정 배지를 모두 노출한다.
 *
 * 달력 칸을 누르면 여기 같은 날짜로 온다 — 그 착지점이 되기 위해 날짜 블록은 **항상**
 * id와 `tabIndex={-1}`(프로그램 포커스 전용)을 갖는다. 폭에 따라 DOM이 달라지면 안 되므로 조건부가 아니다.
 */
export default function AgendaList({ days, hasUndated, highlightedDate = null }: AgendaListProps) {
  return (
    <AgendaRoot aria-label={copy.agenda.heading}>
      {days.length === 0 ? (
        <AgendaEmpty>{hasUndated ? copy.agenda.undatedOnly : copy.agenda.empty}</AgendaEmpty>
      ) : (
        <AgendaDayList>
          {days.map((day) => (
            <AgendaDayItem
              key={day.date}
              id={agendaDayElementId(day.date)}
              tabIndex={-1}
              $highlighted={day.date === highlightedDate}
              aria-current={day.date === highlightedDate ? 'true' : undefined}
            >
              <AgendaDayLabel>
                {/* 날짜 문자열은 한 텍스트 노드로 유지한다 — 배지는 그것을 감싸기만 한다. */}
                <AgendaDateBadge>
                  <time dateTime={day.date}>
                    {copy.agenda.dayLabel(day.month, day.day, copy.board.weekdays[day.weekday])}
                  </time>
                </AgendaDateBadge>
              </AgendaDayLabel>
              <AgendaItemList>
                {day.items.map((item) => (
                  <AgendaItem key={item.ticker}>
                    <AgendaDot aria-hidden style={{ background: tickerSeriesVar(item.ticker) }} />
                    <AgendaTicker>{item.ticker}</AgendaTicker>
                    <ScheduleSourceBadge source={item.source} />
                    <AgendaName>{item.koreanName}</AgendaName>
                  </AgendaItem>
                ))}
              </AgendaItemList>
            </AgendaDayItem>
          ))}
        </AgendaDayList>
      )}
    </AgendaRoot>
  );
}
