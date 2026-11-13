import { DateBlock, DateDay, DateMonth, DateWeekday } from './DateBadge.styled';
import { dateParts } from './DateBadge.utils';

export type DateBadgeProps = {
  /** `YYYY-MM-DD` */
  readonly date: string;
};

/** 목록 한 줄 왼쪽의 날짜 블록. 같은 날짜는 줄 안의 글(dateLabel)이 이미 말하므로 읽기 도구에는 숨긴다. */
export default function DateBadge({ date }: DateBadgeProps) {
  const parts = dateParts(date);
  return (
    <DateBlock aria-hidden>
      <DateMonth>{parts.month}</DateMonth>
      <DateDay>{parts.day}</DateDay>
      <DateWeekday>{parts.weekday}</DateWeekday>
    </DateBlock>
  );
}
