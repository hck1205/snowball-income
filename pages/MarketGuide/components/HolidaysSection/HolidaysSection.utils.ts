import type { HolidayGuideRow } from '@/shared/lib/marketGuide';
import type { RowState } from '../GuideList';

export type HolidayRowView = {
  readonly key: string;
  readonly date: string;
  readonly state: RowState;
  readonly title: string;
  readonly sub: string;
  readonly kind: HolidayGuideRow['kind'];
};

/**
 * 휴장일 목록 한 줄씩 — 오늘 이후 첫 날짜가 "다음", 오늘 전은 "지남"(흐리게).
 * 조기 폐장의 마감 시각은 **제목 아래 줄**에 둔다 — 오른쪽 열에 두면 좁은 폭에서 제목이 한 글자씩 꺾였다.
 */
export const buildHolidayRowViews = (rows: readonly HolidayGuideRow[], todayKey: string): HolidayRowView[] => {
  const nextDate = rows.find((row) => row.date >= todayKey)?.date;
  return rows.map((row) => ({
    key: `${row.date}-${row.kind}`,
    date: row.date,
    state: row.date === nextDate ? 'next' : row.date < todayKey ? 'past' : 'normal',
    title: row.name,
    sub: row.kind === 'holiday' ? row.dateLabel : `${row.dateLabel} · ${row.note.replace(/^미국 13:00 조기 마감 /, '13:00 마감 ')}`,
    kind: row.kind
  }));
};
