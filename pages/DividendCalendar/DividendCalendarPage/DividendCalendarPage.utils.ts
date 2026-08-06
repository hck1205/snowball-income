import {
  buildAgendaDays,
  buildMonthViewModel,
  filterCalendarUniverse,
  formatCalendarDate,
  isSchedulableState
} from '../utils';
import type { AgendaDay, CalendarTickerEntry, ExpectedPayoutDayResolver } from '../utils';
import { DIVIDEND_CALENDAR_COPY } from '../copy';
import type {
  CalendarLastAction,
  CalendarLoadStatus,
  CalendarNextPayout,
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

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * 로컬 자정 기준 날짜 차이. 🔴 `Date.getTime()` 차이를 그대로 나누지 않는다 — 시각이 섞이면
 * "오늘 23시 → 내일 01시"가 0일이 되고, DST 가 있는 지역에서는 23/25시간짜리 하루가 생긴다.
 * 두 값을 **로컬 자정으로 눌러서** 뺀 뒤 반올림하면 두 함정이 함께 사라진다.
 */
const daysBetween = (from: Date, to: Date): number => {
  const fromMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const toMidnight = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();

  return Math.round((toMidnight - fromMidnight) / MS_PER_DAY);
};

/**
 * **이 화면이 가장 먼저 답해야 하는 사실** — "다음은 언제인가".
 *
 * 근거는 이미 계산된 아젠다(그 달의 날짜순 지급 목록)뿐이다. 별도 데이터 소스를 만들지 않는다:
 * 달력·목록·데크가 서로 다른 계산을 하면 같은 화면이 세 가지 날짜를 말하게 된다.
 *
 * - 오늘 이후(오늘 포함)의 첫 지급이 있으면 그것이 답이다(`isPast: false`, `daysUntil >= 0`).
 * - 다 지났으면 **마지막 지급**을 돌려주고 지났다는 사실을 표시한다(`isPast: true`) —
 *   "없음"으로 뭉개면 지난 달을 열어 본 사람에게 화면이 텅 빈다.
 * - 그 달에 날짜가 잡힌 지급이 하나도 없으면 `null`(날짜 미정만 있는 달도 여기 해당한다).
 *
 * ⚠ 범위는 **표시 중인 달**이다. 달을 넘기면 그 달 기준으로 다시 계산된다 — 데크 위의 월 제목이
 *   그 범위를 말하므로 문구에 달 이름을 다시 넣지 않는다.
 */
export const selectNextPayout = (agendaDays: AgendaDay[], today: Date): CalendarNextPayout | null => {
  if (agendaDays.length === 0) return null;

  const todayDate = formatCalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const upcoming = agendaDays.find((day) => day.date >= todayDate);
  const target = upcoming ?? agendaDays[agendaDays.length - 1];
  const isPast = upcoming === undefined;
  /* 🔴 연도는 **`date` 문자열에서** 읽는다. `today.getFullYear()` 를 쓰면 2026년 12월에 2027년 1월을
     펼쳤을 때 D-day 가 한 해(365일)만큼 틀린다 — 눈으로는 그럴듯한 숫자라 조용히 지나간다. */
  const targetDate = new Date(Number(target.date.slice(0, 4)), target.month - 1, target.day);

  return {
    date: target.date,
    month: target.month,
    day: target.day,
    weekday: target.weekday,
    isPast,
    daysUntil: isPast ? null : daysBetween(today, targetDate),
    tickers: target.items.map((item) => item.ticker)
  };
};

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

  const agendaDays = buildAgendaDays(monthViewModel);

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
    agendaDays,
    /* 데크가 읽는 "다음은 언제인가". 아젠다와 **같은 배열**에서 뽑으므로 둘이 어긋날 수 없다. */
    nextPayout: selectNextPayout(agendaDays, today),
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
