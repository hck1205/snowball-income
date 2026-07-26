import { DIVIDEND_CALENDAR_COPY } from '../../copy';
import type { ScheduleSourceBadgeProps } from './ScheduleSourceBadge.types';
import { SourceBadgeRoot } from './ScheduleSourceBadge.styled';

const copy = DIVIDEND_CALENDAR_COPY;

/**
 * 지급월 근거가 **기본값(실측)에서 벗어날 때만** 배지를 단다 — `ex`=추정(배당락일 기반),
 * `null`=데이터 준비 중. `pay`(실측)는 정상 상태라 아무것도 그리지 않는다(사용자 결정 2026-07-26:
 * 기본값에 배지를 달면 소음이다). 배당락 기반을 무표기로 올려 부르지 않는 것이 이 배지의 존재 이유다.
 */
export default function ScheduleSourceBadge({ source }: ScheduleSourceBadgeProps) {
  if (source === 'pay') return null;

  if (source === null) {
    return <SourceBadgeRoot $tone="unavailable">{copy.badge.unavailable}</SourceBadgeRoot>;
  }

  return <SourceBadgeRoot $tone={source}>{copy.badge.ex}</SourceBadgeRoot>;
}
