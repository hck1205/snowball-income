import { buildAgendaDays, buildMonthViewModel, filterCalendarUniverse, isSchedulableState } from '../utils';
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
 * 빈 상태에서 제안하는 시작 종목이자, 격자에 깔리는 **예시 미리보기**의 종목이다.
 * 두 목록을 같게 두는 이유: 칩을 누르면 방금 흐리게 보던 그 일정이 그 자리에서 선명해져야 한다
 * ("무엇이 여기 나타날지"를 보여주는 것이 미리보기의 목적이라, 보여준 것과 다른 게 나오면 거짓말이 된다).
 *
 * ⚠ **스냅샷에 실제 예상 지급'일'(`estimatedPayDayByMonth`)이 있는 종목만 넣는다** — 예시라도
 * 날짜를 지어내지 않는다. 지급'월'만 아는 종목(SCHD·O 등)은 격자에 놓일 날짜가 없어 미리보기가
 * 텅 비므로 뺐다(선택 자체는 목록에서 그대로 된다). 하드코딩하되 데이터가 없어지면 그 칩만
 * 렌더에서 빠진다(`selectQuickPickOptions`).
 */
export const CALENDAR_QUICK_PICK_TICKERS: string[] = ['JEPI', 'DGRO', 'KO', 'ABBV'];

/**
 * 로직 레이어(`../utils`)의 엔트리를 뷰 옵션으로 옮기는 **어댑터**.
 *
 * `source`는 로직 레이어가 이미 접어 둔 값을 그대로 쓴다 — 여기서 `?? 'pay'` 같은 보정을 하면
 * 검증되지 않은 값을 "실측"으로 올려 부르게 된다. 일정이 없는 종목은 그 **사유**까지 옮긴다:
 * 배당을 지급하지 않으면 `'nonDividend'`, 아직 갱신되지 않았으면 `null`.
 */
export const toCalendarTickerOption = (entry: CalendarTickerEntry): CalendarTickerOption => ({
  ticker: entry.ticker,
  koreanName: entry.name,
  // 캐시된 공유 배열이라 복사해서 넘긴다(호출부의 정렬·역순이 원본을 오염시키지 않게).
  months: entry.payoutMonths ? [...entry.payoutMonths] : [],
  source: entry.hasSchedule ? (entry.source ?? 'ex') : entry.isNonDividend ? 'nonDividend' : null
});

const toLegendRow = (option: CalendarTickerOption): ScheduleLegendRow | null =>
  isSchedulableState(option.source) ? { ...option, source: option.source } : null;

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

  /*
   * 🔴 **표현 전용 미리보기다.** 여기서 만든 값은 화면에 흐리게 깔릴 뿐 `selected` 에도, 저장소에도,
   * 주소에도 들어가지 않는다(선택은 사용자가 칩·목록을 눌렀을 때만 바뀐다).
   *
   * 선택이 하나라도 있으면 `null` — 예시가 실제 데이터를 밀어내는 일은 없다.
   * 실제 달력과 **같은 순수 함수**(`buildMonthViewModel`)로 만든다: 예시 전용 날짜 생성기를 따로 두면
   * 그 순간 스냅샷에 없는 날짜가 화면에 생긴다.
   */
  const previewMonth =
    selected.length === 0
      ? buildMonthViewModel({
          year,
          month,
          today,
          selected: CALENDAR_QUICK_PICK_TICKERS,
          entries: universe,
          resolveDay
        })
      : null;

  return {
    options,
    filtered,
    selected,
    selectedWithData: legendRows.length,
    // "지급 이력을 확보하는 대로 추가됩니다" 안내가 붙는 목록이라, 그 말이 참인 종목만 담는다 —
    // 배당을 지급하지 않는 종목은 기다린다고 데이터가 생기지 않는다.
    unavailable: options.filter((option) => option.source === null),
    legendRows,
    asOf,
    month: monthViewModel,
    previewMonth,
    agendaDays: buildAgendaDays(monthViewModel),
    monthLabel: copy.nav.monthLabel(year, month)
  };
};

/** 빈 상태 빠른 선택 칩 — 데이터가 있는 종목만 남긴다. */
export const selectQuickPickOptions = (options: CalendarTickerOption[]): CalendarTickerOption[] => {
  const byTicker = new Map(options.map((option) => [option.ticker, option]));

  return CALENDAR_QUICK_PICK_TICKERS.map((ticker) => byTicker.get(ticker)).filter(
    (option): option is CalendarTickerOption => option !== undefined && isSchedulableState(option.source)
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
