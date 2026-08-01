export type LedgerMonthNavProps = {
  /** `2026년 8월`. */
  monthLabel: string;
  /** 접근명에 들어갈 이전·다음·이번 달 라벨(버튼은 아이콘 전용이다). */
  prevLabel: string;
  nextLabel: string;
  todayLabel: string;
  isCurrentMonth: boolean;
  /** 월 제목의 id — 주역 요약 카드가 `aria-labelledby` 로 가리킨다. */
  titleId: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};
