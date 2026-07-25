import type { CalendarScheduleSource } from '../utils';

/** 저장된 선택을 불러오는 중인지. 불러오기 실패도 `ready`(빈 선택)로 수렴한다 — 화면을 막지 않는다. */
export type CalendarLoadStatus = 'loading' | 'ready';

/** 라이브 리전이 "선택을 모두 해제했습니다"를 읽어야 하는 순간을 구분하기 위한 마지막 조작. */
export type CalendarLastAction = 'none' | 'cleared';

/**
 * 검색 목록의 한 줄. **지급월 데이터가 없는 종목도 목록에 남긴다** — 조용히 빼면 "왜 없지?"가 된다.
 * `source: null` 이 곧 "데이터 준비 중"(선택 불가)이다.
 */
export type CalendarTickerOption = {
  ticker: string;
  koreanName: string;
  /** 1-12 오름차순. 데이터가 없으면 빈 배열. */
  months: number[];
  source: CalendarScheduleSource | null;
};

/** 달력 셀 한 칸에 놓이는 종목. */
export type CalendarMonthItem = {
  ticker: string;
  koreanName: string;
  source: CalendarScheduleSource;
};

/** 달력 셀 한 칸. `items`는 티커 오름차순(테스트 결정성). */
export type CalendarMonthCell = {
  month: number;
  items: CalendarMonthItem[];
};

/** 종목별 12칸 표의 한 행. 지급월 데이터가 있는 선택 종목만 들어온다. */
export type ScheduleLegendRow = {
  ticker: string;
  koreanName: string;
  months: number[];
  source: CalendarScheduleSource;
};

export type DividendCalendarViewModel = {
  /** 유니버스 전체(검색어 미적용), 티커 오름차순. */
  options: CalendarTickerOption[];
  /** 검색어 적용 결과. */
  filtered: CalendarTickerOption[];
  /** 선택 순서 유지 — 칩 표시 순서가 곧 선택 순서다. */
  selected: string[];
  /** 길이 12 고정, month 1..12. */
  months: CalendarMonthCell[];
  legendRows: ScheduleLegendRow[];
  /** 지급월 데이터가 있는 선택 종목 수. */
  selectedWithData: number;
  /** 한 종목이라도 지급하는 달의 수. */
  payingMonthCount: number;
  /** 지급이 없는 달(오름차순). */
  emptyMonths: number[];
  /** 지급월 데이터가 아직 없는 종목들. */
  unavailable: CalendarTickerOption[];
  asOf: string | null;
};

export type DividendCalendarViewProps = {
  viewModel: DividendCalendarViewModel;
  status: CalendarLoadStatus;
  /** 1-12. 컨테이너가 계산해 내려준다(테스트에서 주입 가능). */
  currentMonth: number;
  keyword: string;
  /** 라이브 리전 텍스트. 빈 문자열이어도 노드는 항상 마운트된다. */
  liveMessage: string;
  /** 공유 주소에 있었지만 유니버스에 없어 제외한 심볼들. */
  unknownTickers: string[];
  onKeywordChange: (keyword: string) => void;
  onToggleTicker: (ticker: string) => void;
  onClearSelection: () => void;
  onSimulatorLinkClick: () => void;
};

export type DividendCalendarPageProps = {
  /** 1-12. 미지정이면 렌더 시점의 로컬 시간 기준으로 계산한다. */
  currentMonth?: number;
};
