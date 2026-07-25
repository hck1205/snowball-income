import { useId } from 'react';
import { DIVIDEND_CALENDAR_COPY } from '../../copy';
import { ScheduleSourceBadge } from '../ScheduleSourceBadge';
import type { UndatedSectionProps } from './UndatedSection.types';
import {
  UndatedCount,
  UndatedHeading,
  UndatedHint,
  UndatedItem,
  UndatedList,
  UndatedRoot,
  UndatedTicker
} from './UndatedSection.styled';

const copy = DIVIDEND_CALENDAR_COPY;

/**
 * "이 달에 주긴 하는데 며칠인지 모르는" 종목들.
 *
 * 날짜를 모르는 종목을 1일이나 말일에 놓지 않는 대신, 그 사실을 화면에 드러내는 장치다.
 * 0건이면 섹션 자체를 렌더하지 않는다(빈 제목만 남기지 않는다). 칩마다 "날짜 미정"을 반복하지
 * 않고 섹션 제목이 컨텍스트를 준다 — 개별 배지는 지급'월'의 출처(실측/추정)를 계속 말한다.
 */
export default function UndatedSection({ items }: UndatedSectionProps) {
  const headingId = useId();

  if (items.length === 0) return null;

  return (
    <UndatedRoot aria-labelledby={headingId}>
      <UndatedHeading id={headingId}>
        {copy.undated.heading}
        <UndatedCount>{copy.undated.count(items.length)}</UndatedCount>
      </UndatedHeading>
      <UndatedHint>{copy.undated.hint}</UndatedHint>
      <UndatedList>
        {items.map((item) => (
          <UndatedItem key={item.ticker}>
            <UndatedTicker>{item.ticker}</UndatedTicker>
            <ScheduleSourceBadge source={item.source} />
            {item.koreanName}
          </UndatedItem>
        ))}
      </UndatedList>
    </UndatedRoot>
  );
}
