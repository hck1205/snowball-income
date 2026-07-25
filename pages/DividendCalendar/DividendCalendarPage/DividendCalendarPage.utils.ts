import { buildAgendaDays, buildMonthViewModel, filterCalendarUniverse } from '../utils';
import type { CalendarTickerEntry, ExpectedPayoutDayResolver } from '../utils';
import { DIVIDEND_CALENDAR_COPY } from '../copy';
import type {
  CalendarLastAction,
  CalendarLoadStatus,
  CalendarTickerOption,
  DividendCalendarViewModel,
  ScheduleLegendRow
} from './DividendCalendarPage.types';

const copy = DIVIDEND_CALENDAR_COPY;

/**
 * 빈 상태에서 제안하는 시작 종목. 하드코딩하되 **데이터가 없으면 그 칩만 렌더에서 빠진다**
 * (`selectQuickPickOptions`) — 스냅샷이 바뀌어도 "선택은 되는데 달력엔 안 뜨는" 칩이 생기지 않는다.
 */
export const CALENDAR_QUICK_PICK_TICKERS: string[] = ['JEPI', 'KO', 'ABBV', 'SCHD', 'O', 'DGRO'];

/**
 * 로직 레이어(`../utils`)의 엔트리를 뷰 옵션으로 옮기는 **어댑터**.
 *
 * `source`는 로직 레이어가 이미 접어 둔 값을 그대로 쓴다 — 여기서 `?? 'pay'` 같은 보정을 하면
 * 검증되지 않은 값을 "실측"으로 올려 부르게 된다.
 */
export const toCalendarTickerOption = (entry: CalendarTickerEntry): CalendarTickerOption => ({
  ticker: entry.ticker,
  koreanName: entry.name,
  // 캐시된 공유 배열이라 복사해서 넘긴다(호출부의 정렬·역순이 원본을 오염시키지 않게).
  months: entry.payoutMonths ? [...entry.payoutMonths] : [],
  source: entry.hasSchedule ? (entry.source ?? 'ex') : null
});

const toLegendRow = (option: CalendarTickerOption): ScheduleLegendRow | null =>
  option.source === null ? null : { ...option, source: option.source };

export type CalendarViewModelInput = {
  universe: CalendarTickerEntry[];
  keyword: string;
  selected: string[];
  asOf: string | null;
  /** 표시 중인 달. */
  year: number;
  month: number;
  /** 컨테이너가 만든 '오늘'. 유틸이 스스로 `new Date()` 를 부르면 테스트가 실제 날짜에 매인다. */
  today: Date;
  /** 테스트 주입용 예상일 해석기. 미지정이면 스냅샷 기반 실물. */
  resolveDay?: ExpectedPayoutDayResolver;
};

export const buildDividendCalendarViewModel = ({
  universe,
  keyword,
  selected,
  asOf,
  year,
  month,
  today,
  resolveDay
}: CalendarViewModelInput): DividendCalendarViewModel => {
  const options = universe.map(toCalendarTickerOption);
  const filtered = filterCalendarUniverse(universe, keyword).map(toCalendarTickerOption);

  const monthViewModel = buildMonthViewModel({
    year,
    month,
    today,
    selected,
    entries: universe,
    resolveDay
  });

  const optionByTicker = new Map(options.map((option) => [option.ticker, option]));
  const selectedOptions = selected
    .map((ticker) => optionByTicker.get(ticker))
    .filter((option): option is CalendarTickerOption => option !== undefined);

  const legendRows = selectedOptions
    .map(toLegendRow)
    .filter((row): row is ScheduleLegendRow => row !== null)
    .sort((left, right) => (left.ticker < right.ticker ? -1 : left.ticker > right.ticker ? 1 : 0));

  return {
    options,
    filtered,
    selected,
    selectedWithData: legendRows.length,
    unavailable: options.filter((option) => option.source === null),
    legendRows,
    asOf,
    month: monthViewModel,
    agendaDays: buildAgendaDays(monthViewModel),
    monthLabel: copy.nav.monthLabel(year, month)
  };
};

/** 빈 상태 빠른 선택 칩 — 데이터가 있는 종목만 남긴다. */
export const selectQuickPickOptions = (options: CalendarTickerOption[]): CalendarTickerOption[] => {
  const byTicker = new Map(options.map((option) => [option.ticker, option]));

  return CALENDAR_QUICK_PICK_TICKERS.map((ticker) => byTicker.get(ticker)).filter(
    (option): option is CalendarTickerOption => option !== undefined && option.source !== null
  );
};

export type CalendarLiveMessageInput = {
  status: CalendarLoadStatus;
  keyword: string;
  filteredCount: number;
  selectedCount: number;
  monthLabel: string;
  datedCount: number;
  undatedCount: number;
  lastAction: CalendarLastAction;
};

/**
 * 라이브 리전 텍스트. 노드는 항상 마운트돼 있고 **텍스트만** 바뀐다(빈 문자열도 유효한 상태).
 * 검색 결과 없음이 선택 요약보다 우선한다 — 지금 사용자가 기다리는 답이 그쪽이다.
 * 월을 막 옮겼다면 그 달의 결과를 먼저 알린다(화면이 통째로 바뀐 직후라 방향을 잡아줘야 한다).
 */
export const buildCalendarLiveMessage = ({
  status,
  keyword,
  filteredCount,
  selectedCount,
  monthLabel,
  datedCount,
  undatedCount,
  lastAction
}: CalendarLiveMessageInput): string => {
  if (status === 'loading') return copy.status.loading;
  if (keyword.trim().length > 0 && filteredCount === 0) return copy.picker.noResultLive;
  if (lastAction === 'month') return copy.status.monthChanged(monthLabel, datedCount, undatedCount);
  if (selectedCount === 0) return lastAction === 'cleared' ? copy.status.cleared : '';

  return copy.status.selectionSummary(selectedCount, datedCount);
};
