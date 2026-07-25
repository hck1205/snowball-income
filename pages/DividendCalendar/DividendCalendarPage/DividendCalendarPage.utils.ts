import { filterCalendarUniverse, getMonthEvents } from '../utils';
import type { CalendarTickerEntry } from '../utils';
import { DIVIDEND_CALENDAR_COPY } from '../copy';
import type {
  CalendarLastAction,
  CalendarLoadStatus,
  CalendarMonthCell,
  CalendarTickerOption,
  DividendCalendarViewModel,
  ScheduleLegendRow
} from './DividendCalendarPage.types';

const copy = DIVIDEND_CALENDAR_COPY;

export const CALENDAR_MONTHS: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/**
 * 빈 상태에서 제안하는 시작 종목. 하드코딩하되 **데이터가 없으면 그 칩만 렌더에서 빠진다**
 * (`selectQuickPickOptions`) — 스냅샷이 바뀌어도 "선택은 되는데 달력엔 안 뜨는" 칩이 생기지 않는다.
 */
export const CALENDAR_QUICK_PICK_TICKERS: string[] = ['SCHD', 'JEPI', 'O', 'VICI', 'ABBV', 'KO'];

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
};

export const buildDividendCalendarViewModel = ({
  universe,
  keyword,
  selected,
  asOf
}: CalendarViewModelInput): DividendCalendarViewModel => {
  const options = universe.map(toCalendarTickerOption);
  const filtered = filterCalendarUniverse(universe, keyword).map(toCalendarTickerOption);

  const months: CalendarMonthCell[] = CALENDAR_MONTHS.map((month) => ({
    month,
    items: getMonthEvents(universe, selected, month).map((event) => ({
      ticker: event.ticker,
      koreanName: event.name,
      source: event.source
    }))
  }));

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
    months,
    legendRows,
    selectedWithData: legendRows.length,
    payingMonthCount: months.filter((cell) => cell.items.length > 0).length,
    emptyMonths: months.filter((cell) => cell.items.length === 0).map((cell) => cell.month),
    unavailable: options.filter((option) => option.source === null),
    asOf
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
  payingMonthCount: number;
  lastAction: CalendarLastAction;
};

/**
 * 라이브 리전 텍스트. 노드는 항상 마운트돼 있고 **텍스트만** 바뀐다(빈 문자열도 유효한 상태).
 * 검색 결과 없음이 선택 요약보다 우선한다 — 지금 사용자가 기다리는 답이 그쪽이다.
 */
export const buildCalendarLiveMessage = ({
  status,
  keyword,
  filteredCount,
  selectedCount,
  payingMonthCount,
  lastAction
}: CalendarLiveMessageInput): string => {
  if (status === 'loading') return copy.status.loading;
  if (keyword.trim().length > 0 && filteredCount === 0) return copy.picker.noResultLive;
  if (selectedCount === 0) return lastAction === 'cleared' ? copy.status.cleared : '';

  return copy.status.selectionSummary(selectedCount, payingMonthCount);
};
