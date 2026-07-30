import { MARKET_DATA } from '@/shared/constants/marketData';
import { DIVIDEND_UNIVERSE, PRESET_TICKER_KOREAN_NAME_BY_TICKER } from '@/shared/constants/presets';

/**
 * 지급월의 **근거**. 캘린더는 이 값을 그대로 사용자에게 보여줘야 한다.
 *
 * - `pay`: 실제 입금일 이력에서 관측 — 그대로 믿어도 된다.
 * - `ex` : 배당락일에서 추정 — 월말 배당락이면 실제 입금은 다음 달일 수 있다.
 *
 * 스냅샷에 `payoutMonthsSource` 가 없는 (구) 항목은 배당락 기반이므로 `ex` 로 본다
 * (`components/MonthlyCashflow` 와 동일한 의미론).
 */
export type CalendarScheduleSource = 'pay' | 'ex';

/**
 * 목록의 한 종목이 캘린더에 대해 갖는 상태. **"아직 모른다"와 "해당 없다"를 가르는 것**이 요점이다.
 *
 * - `'pay'` / `'ex'` : 지급월을 안다(위 `CalendarScheduleSource` 참고).
 * - `'nonDividend'` : **배당을 지급하지 않는 종목**. 지급월 데이터가 들어올 일이 없으므로
 *   "준비 중"이 아니다. 판정 근거는 유니버스의 `frequency === 'none'`(= 관측된 배당률 0에서
 *   파생 — `shared/constants/presets` 의 `buildDividendUniverse`).
 * - `null` : 지급월 데이터가 **아직** 없다("데이터 준비 중"). 갱신되면 `pay`/`ex` 가 된다.
 */
export type CalendarScheduleState = CalendarScheduleSource | 'nonDividend' | null;

/**
 * 이 상태의 종목을 캘린더에 놓을 수 있는가. **선택 가능 여부의 단일 판정**이라
 * 목록 버튼(비활성)·범례 행·요약 집계가 전부 이 함수를 통해서만 묻는다 — 판정이 흩어지면
 * "고를 수는 있는데 달력엔 안 뜨는" 종목이 생긴다.
 */
export const isSchedulableState = (state: CalendarScheduleState): state is CalendarScheduleSource =>
  state === 'pay' || state === 'ex';

export type CalendarTickerEntry = {
  /** 대문자 심볼. */
  ticker: string;
  /** 한글명(있으면) 또는 영문명. */
  name: string;
  /** 관측된 지급월 데이터가 있는가. false 면 이 종목은 캘린더에 놓을 수 없다. */
  hasSchedule: boolean;
  /**
   * 배당을 지급하지 않는 종목인가. `hasSchedule: false` 의 **사유**를 가른다 —
   * 캘린더에 놓을 수 없다는 결과는 같지만 사용자에게 할 말이 다르다.
   */
  isNonDividend: boolean;
  /** 1-12 오름차순. `hasSchedule` 이 true 일 때만 있다. */
  payoutMonths?: number[];
  source?: CalendarScheduleSource;
};

const isCalendarMonth = (month: number): boolean => Number.isInteger(month) && month >= 1 && month <= 12;

/** 생성물(스냅샷)에서 온 값이라 방어적으로 정규화한다: 1-12 정수만, 중복 제거, 오름차순. */
const normalizePayoutMonths = (months: readonly number[] | undefined): number[] =>
  [...new Set((months ?? []).filter(isCalendarMonth))].sort((left, right) => left - right);

const KOREAN_NAME_BY_TICKER: Record<string, string> = PRESET_TICKER_KOREAN_NAME_BY_TICKER;

/**
 * 유니버스 + 관측 지급월 조인.
 *
 * 지급월 데이터가 없는 종목(배당을 지급하지 않는 ANET, 아직 갱신되지 않은 종목)은 **빼지 않고
 * `hasSchedule: false`** 로 남긴다 — 검색 결과에서 조용히 사라지면 "왜 없지?" 가 되고, `frequency`
 * 로 아무 달이나 채우면 거짓이 된다. 모른다는 사실을 그대로 들고 다니는 게 유일하게 정직하다.
 *
 * **판정 순서가 중요하다**: 관측된 지급월이 있으면 그것이 이긴다. 지급 이력이 있는데 배당률만
 * 일시적으로 0 으로 들어온 종목(공급자 이상치)을 "배당 없음"으로 낙인찍지 않기 위해서다.
 * 무배당 판정은 **지급월이 하나도 없을 때만** 내린다.
 */
const buildCalendarUniverse = (): CalendarTickerEntry[] =>
  Object.keys(DIVIDEND_UNIVERSE)
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))
    .map((ticker) => {
      const preset = DIVIDEND_UNIVERSE[ticker as keyof typeof DIVIDEND_UNIVERSE];
      const months = normalizePayoutMonths(MARKET_DATA.entries[ticker]?.payoutMonths);
      const name = KOREAN_NAME_BY_TICKER[ticker] ?? preset.name ?? ticker;

      if (months.length === 0) {
        return { ticker, name, hasSchedule: false, isNonDividend: preset.frequency === 'none' };
      }

      return {
        ticker,
        name,
        hasSchedule: true,
        isNonDividend: false,
        payoutMonths: months,
        source: MARKET_DATA.entries[ticker]?.payoutMonthsSource === 'pay' ? 'pay' : 'ex'
      };
    });

/**
 * 빌드 시점에 고정된 데이터라 한 번만 만든다(호출자마다 새 배열을 만들면 참조가 매번 바뀌어
 * memo 가 무의미해진다). **호출자는 이 배열을 제자리에서 변형하지 않는다** — 정렬·필터는
 * 새 배열로 한다(`filterCalendarUniverse` 가 그렇게 한다).
 */
let cachedUniverse: CalendarTickerEntry[] | null = null;

/** 티커 알파벳 오름차순으로 안정 정렬된 전체 유니버스. */
export const getCalendarUniverse = (): CalendarTickerEntry[] => {
  cachedUniverse ??= buildCalendarUniverse();
  return cachedUniverse;
};

/** 티커·이름 부분일치(대소문자 무시). 빈 질의는 전체를 그대로 돌려준다. */
export const filterCalendarUniverse = (entries: CalendarTickerEntry[], query: string): CalendarTickerEntry[] => {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return entries;

  return entries.filter(
    (entry) => entry.ticker.toLowerCase().includes(needle) || entry.name.toLowerCase().includes(needle)
  );
};

/** 한 달 셀에 들어가는 한 줄. 금액은 없다 — 이 화면은 "언제 주는가"만 답한다. */
export type CalendarMonthEvent = {
  ticker: string;
  name: string;
  source: CalendarScheduleSource;
};

/**
 * 선택한 티커 중 `month`(1-12)에 지급 예정인 것만, 티커 알파벳순으로.
 *
 * 선택했지만 지급월 데이터가 없는 종목은 제외된다(그 사실은 목록 UI 가 `hasSchedule` 로 알린다).
 * 선택 목록의 중복·소문자 입력은 흡수한다.
 */
export const getMonthEvents = (
  entries: CalendarTickerEntry[],
  selectedTickers: string[],
  month: number
): CalendarMonthEvent[] => {
  if (!isCalendarMonth(month) || selectedTickers.length === 0) return [];

  const selected = new Set(selectedTickers.map((ticker) => ticker.trim().toUpperCase()));

  return entries
    .filter((entry) => selected.has(entry.ticker) && (entry.payoutMonths?.includes(month) ?? false))
    .map((entry) => ({ ticker: entry.ticker, name: entry.name, source: entry.source ?? 'ex' }))
    .sort((left, right) => (left.ticker < right.ticker ? -1 : left.ticker > right.ticker ? 1 : 0));
};
