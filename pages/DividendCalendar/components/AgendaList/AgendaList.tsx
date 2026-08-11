import { DIVIDEND_CALENDAR_COPY } from '../../copy';
import { agendaDayElementId, tickerSeriesVar } from '../../utils';
import { OverflowTooltip } from '@/components/common';
import { ScheduleSourceBadge } from '../ScheduleSourceBadge';
import type { AgendaListProps } from './AgendaList.types';
import {
  AgendaDateBadge,
  AgendaDayItem,
  AgendaDayLabel,
  AgendaDayList,
  AgendaAmount,
  AgendaDot,
  AgendaEmpty,
  AgendaItem,
  AgendaItemList,
  AgendaName,
  AgendaNameSlot,
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
export default function AgendaList({
  days,
  hasUndated,
  amountLabelByTicker,
  highlightedDate = null,
  seriesOf = tickerSeriesVar
}: AgendaListProps) {
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
                    <AgendaDot aria-hidden style={{ background: seriesOf(item.ticker) }} />
                    {/* 티커에는 툴팁을 달지 않는다 — 잘리지 않기 때문이다. 실측(2026-08-04, uiprobe):
                        고정폭 열은 51.8px 이고 유니버스에서 가장 긴 심볼 GOOGL 이 48.8px 라 1280·390
                        어느 폭에서도 넘치지 않는다(206종 중 5글자는 GOOGL 하나뿐). 안 잘리는 글자에
                        툴팁을 다는 것은 소음이다. 더 긴 심볼이 유니버스에 들어오면 다시 재라. */}
                    <AgendaTicker>{item.ticker}</AgendaTicker>
                    {/* 이름이 남는 폭을 전부 먹고 근거 배지가 줄 끝에 선다 — 여러 줄이 쌓였을 때
                        배지가 오른쪽에 세로로 정렬돼 "무엇이 추정인가"를 훑어서 읽을 수 있다.
                        (구 순서는 티커 바로 뒤라 이름의 시작점이 종목마다 들쭉날쭉했다.)
                        이름은 이 열에서 자주 잘린다(1280 실측 133px 칸 / 161px 글자) — 잘린 경우에만
                        OverflowTooltip 이 전체 이름을 hover·클릭·포커스로 열어 준다. */}
                    <AgendaNameSlot>
                      <OverflowTooltip text={item.koreanName}>
                        <AgendaName />
                      </OverflowTooltip>
                    </AgendaNameSlot>
                    {/* 금액은 근거 배지 **앞**에 선다 — 눈이 먼저 찾는 것이 숫자다. 없으면 안 그린다. */}
                    {amountLabelByTicker?.[item.ticker] ? (
                      <AgendaAmount>{amountLabelByTicker[item.ticker]}</AgendaAmount>
                    ) : null}
                    <ScheduleSourceBadge source={item.source} />
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
