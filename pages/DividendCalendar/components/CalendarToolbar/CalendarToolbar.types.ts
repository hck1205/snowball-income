export type CalendarToolbarProps = {
  /** '2026년 7월' — 표시 중인 달. */
  monthLabel: string;
  /** 이전/다음 달 라벨(버튼 접근명에 들어간다 — "이전 달로 이동, 2026년 6월"). */
  prevLabel: string;
  nextLabel: string;
  /** 오늘이 속한 달의 라벨("이번 달" 버튼 접근명). */
  todayLabel: string;
  /** 표시 중인 달이 이미 이번 달이면 "이번 달" 버튼은 조작 결과가 없다 → `disabled`. */
  isCurrentMonth: boolean;
  /** 월 제목 `<h2>` 의 id — 달력 표가 `aria-labelledby` 로 묶는다. */
  titleId: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};
