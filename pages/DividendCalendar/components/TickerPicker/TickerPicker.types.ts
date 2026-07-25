import type { CalendarTickerOption } from '../../DividendCalendarPage';

export type TickerPickerProps = {
  /** 검색어가 적용된 결과 목록. 데이터 없는 종목도 포함된다(선택만 불가). */
  options: CalendarTickerOption[];
  /** 선택 순서를 유지한 티커 목록 — 칩 표시 순서가 곧 선택 순서다. */
  selected: string[];
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  onToggle: (ticker: string) => void;
  onClear: () => void;
};
