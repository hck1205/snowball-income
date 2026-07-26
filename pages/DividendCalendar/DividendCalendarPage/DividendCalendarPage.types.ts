import type { AgendaDay, CalendarScheduleSource, MonthViewModel } from '../utils';

/** 저장된 선택을 불러오는 중인지. 불러오기 실패도 `ready`(빈 선택)로 수렴한다 — 화면을 막지 않는다. */
export type CalendarLoadStatus = 'loading' | 'ready';

/** 라이브 리전이 무엇을 읽어야 하는지 가르는 마지막 조작. */
export type CalendarLastAction = 'none' | 'cleared' | 'month';

/** 달력 아래 상세 영역에서 지금 보고 있는 것. 기본은 날짜순 목록('agenda'). */
export type CalendarDetailTab = 'agenda' | 'undated';

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

/** 종목별 12개월 점 표의 한 행. 월간 달력이 답하지 못하는 "연간 리듬"을 저비용으로 흡수한다. */
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
  /** 지급월 데이터가 있는 선택 종목 수. */
  selectedWithData: number;
  /** 지급월 데이터가 아직 없는 종목들. */
  unavailable: CalendarTickerOption[];
  legendRows: ScheduleLegendRow[];
  asOf: string | null;
  /** 표시 중인 달의 주 × 일 그리드(6주 고정). */
  month: MonthViewModel;
  /** 표에서 밀도 때문에 잘린 정보의 원본(날짜순 목록). */
  agendaDays: AgendaDay[];
  /** '2026년 7월'. */
  monthLabel: string;
};

export type DividendCalendarViewProps = {
  viewModel: DividendCalendarViewModel;
  status: CalendarLoadStatus;
  /** 컨테이너가 만든 '오늘'(로컬 기준). 테스트에서 주입해 결정적으로 검증한다. */
  today: Date;
  /** 표시 중인 달이 '오늘의 달'인가 — "이번 달" 버튼 비활성 판정. */
  isCurrentMonth: boolean;
  keyword: string;
  /** 상세 영역에서 선택된 탭. 미정 0건이면 뷰가 'agenda'로 접어 읽는다. */
  detailTab: CalendarDetailTab;
  /** 종목 선택 드로어가 열려 있는가. */
  isPickerOpen: boolean;
  /** 라이브 리전 텍스트. 빈 문자열이어도 노드는 항상 마운트된다. */
  liveMessage: string;
  /** 공유 주소에 있었지만 유니버스에 없어 제외한 심볼들. */
  unknownTickers: string[];
  /** 달력 칸에서 눌러 들어온 아젠다 날짜(ISO). 없으면 null. */
  highlightedAgendaDate: string | null;
  onKeywordChange: (keyword: string) => void;
  onDetailTabChange: (tab: CalendarDetailTab) => void;
  onOpenPicker: () => void;
  onClosePicker: () => void;
  /** 지급이 있는 날짜 칸을 눌렀을 때(ISO). 아젠다 탭으로 전환하고 그 날짜로 보낸다. */
  onDayJump: (isoDate: string) => void;
  onToggleTicker: (ticker: string) => void;
  onClearSelection: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
};

export type DividendCalendarPageProps = {
  /** 로컬 기준 '오늘'. 미지정이면 마운트 시점에 한 번 만든다(테스트 주입용). */
  today?: Date;
};
