import { DIVIDEND_CALENDAR_COPY } from '../../copy';
import type { ScheduleSourceBadgeProps } from './ScheduleSourceBadge.types';
import { SourceBadgeRoot } from './ScheduleSourceBadge.styled';

const copy = DIVIDEND_CALENDAR_COPY;

/**
 * 지급월의 근거를 한 단어로 말한다. `pay`=실측(입금 이력 관측), `ex`=추정(배당락일 기반),
 * `null`=데이터 준비 중. 배당락 기반을 "실측"으로 올려 부르지 않는 것이 이 배지의 존재 이유다.
 */
export default function ScheduleSourceBadge({ source }: ScheduleSourceBadgeProps) {
  if (source === null) {
    return <SourceBadgeRoot $tone="unavailable">{copy.badge.unavailable}</SourceBadgeRoot>;
  }

  return (
    <SourceBadgeRoot $tone={source}>{source === 'pay' ? copy.badge.pay : copy.badge.ex}</SourceBadgeRoot>
  );
}
