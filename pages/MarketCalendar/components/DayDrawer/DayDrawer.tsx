import { SideDrawer } from '@/components/common';
import { MARKET_CALENDAR_COPY } from '../../copy';
import {
  TRADING_STATUS_KO,
  describeFomc,
  formatDaylightSaving,
  formatSessionKst,
  formatWeekday
} from '../../utils';
import type { DayDrawerProps } from './DayDrawer.types';
import {
  Block,
  BlockTitle,
  EmptyNote,
  Item,
  ItemBody,
  ItemList,
  ItemNote,
  ItemTime,
  MajorTag,
  Stack,
  StatusLine,
  StatusNote,
  TickerLink,
  TickerPlain
} from './DayDrawer.styled';

const copy = MARKET_CALENDAR_COPY.day;
const earningsCopy = MARKET_CALENDAR_COPY.earnings;

/**
 * 날짜 칸을 눌렀을 때 열리는 **하루치 상세**(2026-08-05 신설, 사용자 지시).
 *
 * ## 왜 필요한가
 * 달력 칸은 좁아서 일정을 접는다("+2건 더"). 접힌 것을 펼 자리가 없으면 그 칸은 "무언가 더 있다"만
 * 말하고 끝난다. 이 드로어가 그 답이고, **접는 규칙(칸)과 펴는 자리(드로어)가 한 벌**이다.
 *
 * ## 순서 — 거래 → FOMC → 주요 발표 → 실적
 * 🔴 거래 상태가 맨 위다. "그날 장이 서는가"는 나머지 모든 일정의 전제이고, 휴장이면 아래 일정들의
 * 의미가 달라진다(예: 조기 폐장일의 실적 발표).
 * ⚠ 빈 블록은 **그리지 않는다.** 자리만 있고 내용이 없는 머리글은 "자료가 빠졌다"로 읽힌다.
 *   대신 셋 다 없으면 한 문장으로 "표시할 일정이 없다"고 말한다.
 * ⚠ 큐레이션 구간 밖(`trading === null`)은 "일정이 없다"가 **아니라** "아직 모른다"다. 두 문장을
 *   같은 말로 쓰면 화면이 거짓말을 한다.
 */
export default function DayDrawer({ id, isOpen, cell, onClose }: DayDrawerProps) {
  /* 닫힌 상태에서도 드로어 자체는 마운트된 채로 둔다(열림 애니메이션·포커스 관리가 그 안에 있다). */
  const title = cell
    ? copy.title(Number(cell.date.slice(5, 7)), cell.day, formatWeekday(cell.date))
    : copy.closeLabel;

  const events = cell?.events;
  const hasAny =
    Boolean(events?.fomc) || (events?.economic.length ?? 0) > 0 || (events?.earnings.length ?? 0) > 0;
  const daylight = cell ? formatDaylightSaving(cell.trading) : '';

  return (
    <SideDrawer
      id={id}
      side="right"
      isOpen={isOpen}
      title={title}
      closeLabel={copy.closeLabel}
      onClose={onClose}
      width="min(460px, 94vw)"
      dimBelow="always"
    >
      {cell ? (
        <Stack>
          <Block>
            <BlockTitle>{copy.statusHeading}</BlockTitle>
            <StatusLine>
              {cell.trading ? TRADING_STATUS_KO[cell.trading.status] : copy.unknown}
            </StatusLine>
            {cell.trading ? (
              <>
                <StatusNote>{`${copy.sessionLabel} · ${formatSessionKst(cell.trading)}`}</StatusNote>
                {daylight ? <StatusNote>{daylight}</StatusNote> : null}
              </>
            ) : null}
          </Block>

          {events?.fomc ? (
            <Block>
              <BlockTitle>{copy.fomcHeading}</BlockTitle>
              <ItemList>
                <Item>
                  {/* 문장·시각은 `describeFomc` 한 곳에서 온다 — 다가오는 일정 표와 같은 값이다. */}
                  <ItemTime>{`${describeFomc(events.fomc).timeEt} ET`}</ItemTime>
                  <ItemBody>
                    {describeFomc(events.fomc).labelKo}
                    <ItemNote>{copy.fomcNote}</ItemNote>
                  </ItemBody>
                </Item>
              </ItemList>
            </Block>
          ) : null}

          {events && events.economic.length > 0 ? (
            <Block>
              <BlockTitle>{copy.economicHeading}</BlockTitle>
              <ItemList>
                {events.economic.map((event) => (
                  <Item key={`${event.date}-${event.nameEn}`}>
                    <ItemTime>{`${event.timeEt} ET`}</ItemTime>
                    <ItemBody>
                      <span>
                        {event.nameKo}
                        {/* 색이 아니라 글자가 "주요"를 진다 — 회색조에서도 남는다. */}
                        {event.major ? <MajorTag>{copy.majorTag}</MajorTag> : null}
                      </span>
                      <ItemNote>{event.nameEn}</ItemNote>
                    </ItemBody>
                  </Item>
                ))}
              </ItemList>
            </Block>
          ) : null}

          {events && events.earnings.length > 0 ? (
            <Block>
              <BlockTitle>{copy.earningsHeading}</BlockTitle>
              <ItemList>
                {events.earnings.map((event) => (
                  <Item key={`${event.date}-${event.ticker}`}>
                    <ItemTime>{earningsCopy.session[event.session]}</ItemTime>
                    <ItemBody>
                      {event.hasTickerPage ? (
                        <TickerLink to={`/ticker/${event.ticker.toLowerCase()}`}>{event.ticker}</TickerLink>
                      ) : (
                        <TickerPlain>{event.ticker}</TickerPlain>
                      )}
                      <ItemNote>{event.nameEn}</ItemNote>
                    </ItemBody>
                  </Item>
                ))}
              </ItemList>
            </Block>
          ) : null}

          {/* 셋 다 없을 때만. 거래 상태 블록은 위에 이미 있으므로 "아무것도 없는 화면"은 되지 않는다. */}
          {!hasAny ? <EmptyNote>{cell.trading ? copy.empty : copy.unknown}</EmptyNote> : null}
        </Stack>
      ) : null}
    </SideDrawer>
  );
}
