import type { KstMoment, TradingDay } from '@/shared/constants/marketCalendar';

/** 화면용 포맷 — 전부 순수 함수. */

/** `2026-08-13` → `8월 13일`. 연도는 달력 머리가 이미 말한다. */
export const formatMonthDay = (date: string): string => {
  const match = /^\d{4}-(\d{2})-(\d{2})$/.exec(date);
  return match ? `${Number(match[1])}월 ${Number(match[2])}일` : date;
};

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** ⚠ 로컬 생성자로 요일을 구한다 — `new Date('2026-08-13')` 은 UTC 해석이라 KST 에서 하루 밀린다. */
export const formatWeekday = (date: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return '';
  const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return WEEKDAY_KO[parsed.getDay()];
};

/**
 * 한국시각 한 점. 날짜를 넘겼으면 그 사실을 **글자로** 말한다.
 * 🔴 "05:00" 만 쓰면 사용자는 그날 아침 5시로 읽는다 — 실제로는 **다음 날** 새벽이다.
 */
export const formatKst = (moment: KstMoment | null): string => {
  if (!moment) return '—';
  return moment.dayOffset === 1 ? `다음 날 ${moment.time}` : moment.time;
};

/** 거래일 상태의 한국어 이름. */
export const TRADING_STATUS_KO: Record<TradingDay['status'], string> = {
  open: '정상 거래',
  early: '조기 폐장',
  closed: '휴장',
  weekend: '주말'
};

/**
 * 그 날 장이 서는 시간을 한국시각 한 줄로.
 * 휴장·주말이면 이유(또는 "주말")를 그대로 돌려준다 — 시간을 비워 두고 끝내지 않는다.
 */
export const formatSessionKst = (day: TradingDay | null): string => {
  if (!day) return '자료 없음';
  if (day.status === 'weekend') return '주말이라 장이 서지 않습니다';
  if (day.status === 'closed') return `휴장 (${day.labelKo ?? '휴일'})`;
  if (!day.openKst || !day.closeKst) return '자료 없음';
  return `${formatKst(day.openKst)} ~ ${formatKst(day.closeKst)}`;
};

/** 서머타임 여부를 한 줄로. 개장 시각이 한 시간 당겨지는 이유를 사용자가 알아야 한다. */
export const formatDaylightSaving = (day: TradingDay | null): string => {
  if (!day) return '';
  return day.daylightSaving ? '서머타임 적용 중' : '서머타임 해제 기간';
};
