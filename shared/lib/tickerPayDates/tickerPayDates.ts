import { MARKET_DATA, type MarketDataSnapshotEntry } from '@/shared/constants/marketData';

/**
 * 종목 배당 일정 — "SCHD 배당일", "JEPI 배당 지급일" 같은 검색어의 답(2026-11-12).
 *
 * 근거는 시장 데이터 스냅샷뿐이다(매일 갱신되는 `payoutMonths` + 지급일 갱신 `estimatedPayDayByMonth`).
 * 🔴 **날짜를 지어내지 않는다.** 근거 등급이 둘이다.
 *   - `pay`  : 실제 지급일 이력에서 나온 지급 월 + 그 달의 예상 지급일(중앙값). "N월 D일쯤".
 *   - `ex`   : 배당락일에서 추정한 월만 있다(지급은 보통 며칠 뒤, 월 경계면 한 달 어긋날 수 있다). "N월".
 * 둘 다 **예상**이다 — 실제 지급일은 주말·휴일로 며칠씩 움직인다. 화면과 서버 HTML 이 같은 함수를 쓴다.
 */

export type TickerPayRow = {
  readonly month: number;
  /** 예상 지급일(일). `ex` 근거거나 그 달 값이 없으면 null. */
  readonly payDay: number | null;
  /** "3월 31일쯤" / "3월". */
  readonly payLabel: string;
  /** 배당락 예상 "3월 27일쯤" — 지급일과 배당락→지급 간격이 둘 다 있을 때만. */
  readonly exLabel: string | null;
};

export type TickerPaySchedule = {
  readonly ticker: string;
  readonly source: 'pay' | 'ex';
  /** 연 지급 횟수(월 수). */
  readonly timesPerYear: number;
  /** "매월" / "분기(3·6·9·12월)" 같은 한 줄. */
  readonly cadenceLabel: string;
  readonly rows: readonly TickerPayRow[];
  /** 오늘 이후 첫 지급(이번 달이면 지급일이 지나지 않았을 때). */
  readonly next: { readonly year: number; readonly label: string } | null;
  /** 배당락 → 지급 간격(일). 없으면 null. */
  readonly exToPayLagDays: number | null;
  readonly asOf: string | null;
};

const DAYS_IN_MONTH_NON_LEAP = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

const exDateLabel = (month: number, payDay: number, lagDays: number): string => {
  let exDay = payDay - lagDays;
  let exMonth = month;
  while (exDay < 1) {
    exMonth = exMonth === 1 ? 12 : exMonth - 1;
    exDay += DAYS_IN_MONTH_NON_LEAP[exMonth - 1]!;
  }
  return `${exMonth}월 ${exDay}일쯤`;
};

const cadenceOf = (months: readonly number[]): string => {
  if (months.length === 12) return '매월';
  const list = months.map((month) => `${month}`).join('·');
  if (months.length === 4) return `분기 (${list}월)`;
  if (months.length === 2) return `반기 (${list}월)`;
  if (months.length === 1) return `연 1회 (${list}월)`;
  return `연 ${months.length}회 (${list}월)`;
};

/** 스냅샷 한 줄에서 일정. 지급 월이 없거나 배당이 없다고 확인된 종목은 null. */
export const buildTickerPaySchedule = (
  ticker: string,
  today: Date = new Date(),
  entries: Readonly<Record<string, MarketDataSnapshotEntry | undefined>> = MARKET_DATA.entries,
  asOf: string | null = MARKET_DATA.asOf
): TickerPaySchedule | null => {
  const entry = entries[ticker];
  const months = [...new Set((entry?.payoutMonths ?? []).filter((month) => Number.isInteger(month) && month >= 1 && month <= 12))].sort(
    (a, b) => a - b
  );
  if (!entry || months.length === 0 || entry.payoutMonthsSource === 'none') return null;

  const source = entry.payoutMonthsSource === 'pay' ? 'pay' : 'ex';
  const lag = typeof entry.exToPayLagDays === 'number' && entry.exToPayLagDays > 0 ? Math.round(entry.exToPayLagDays) : null;

  const rows: TickerPayRow[] = months.map((month) => {
    const raw = source === 'pay' ? entry.estimatedPayDayByMonth?.[String(month)] : undefined;
    const payDay = typeof raw === 'number' && Number.isFinite(raw) && raw >= 1 ? Math.min(Math.trunc(raw), DAYS_IN_MONTH_NON_LEAP[month - 1]!) : null;
    return {
      month,
      payDay,
      payLabel: payDay ? `${month}월 ${payDay}일쯤` : `${month}월`,
      exLabel: payDay && lag ? exDateLabel(month, payDay, lag) : null
    };
  });

  // 다음 지급 — 이번 달은 예상일이 아직 안 지났을 때만(예상일이 없으면 이번 달도 "아직"으로 본다).
  const thisMonth = today.getMonth() + 1;
  const thisDay = today.getDate();
  const upcoming =
    rows.find((row) => row.month > thisMonth || (row.month === thisMonth && (row.payDay === null || row.payDay >= thisDay))) ?? null;
  const next = upcoming
    ? { year: today.getFullYear(), label: upcoming.payLabel }
    : rows[0]
      ? { year: today.getFullYear() + 1, label: rows[0].payLabel }
      : null;

  return {
    ticker,
    source,
    timesPerYear: months.length,
    cadenceLabel: cadenceOf(months),
    rows,
    next,
    exToPayLagDays: lag,
    asOf
  };
};

/** 화면·서버 공용 문구 — 근거 등급에 따라 "추정"을 다르게 말한다. */
export const TICKER_PAY_COPY = {
  heading: (ticker: string) => `${ticker} 배당일 · 배당락일`,
  nextLabel: '다음 배당 지급 예상',
  cadenceLabel: '지급 주기',
  tableHead: ['지급 월', '예상 지급일', '예상 배당락일'] as const,
  sourceNote: (schedule: TickerPaySchedule) =>
    schedule.source === 'pay'
      ? `과거 실제 지급일에서 추정한 날짜입니다. 주말·휴일에 따라 며칠씩 달라질 수 있습니다.${schedule.asOf ? ` (${schedule.asOf} 기준)` : ''}`
      : `배당락일 이력에서 추정한 지급 월입니다. 지급은 보통 배당락 며칠 뒤이고, 월 경계에서는 한 달 어긋날 수 있습니다.${schedule.asOf ? ` (${schedule.asOf} 기준)` : ''}`,
  exNote: '배당을 받으려면 배당락일 전 거래일까지 보유하고 있어야 합니다.',
  calendarLink: '배당 캘린더에서 내 종목 지급일 모아 보기'
} as const;

/** 검색어 "{티커} 배당일" 을 제목에 싣는다 — 이미 들어 있으면 그대로. 일정이 없는 종목은 바꾸지 않는다. */
export const withPayDateTitle = (metaTitle: string, ticker: string, hasSchedule: boolean): string => {
  if (!hasSchedule || metaTitle.includes('배당일')) return metaTitle;
  return metaTitle.startsWith(`${ticker} `) ? `${ticker} 배당일·${metaTitle.slice(ticker.length + 1)}` : metaTitle;
};
