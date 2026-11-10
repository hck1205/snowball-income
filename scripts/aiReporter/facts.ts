import { buildUpcoming, formatKst, formatMonthDay, formatWeekday } from '@/pages/MarketCalendar/utils';
import { DEFAULT_INFLATION_RATE } from '@/shared/constants/inflation';
import { MARKET_CALENDAR, toCalendarDate } from '@/shared/constants/marketCalendar';
import { DIVIDEND_TARGET_AMOUNT_PAGES_MAN, DIVIDEND_TARGET_PATH, dividendTargetAmountPath } from '@/shared/constants/routes';
import { TICKER_CONTENT_LIST } from '@/shared/constants/tickers';
import { buildDividendTargetModel } from '@/shared/lib/dividendTarget';
import { buildTickerIncomeAnswer, formatIncomeWon, formatPrincipalLabel } from '@/shared/lib/tickerIncome';
import { formatKoreanWon } from '@/shared/utils';
import { barGlyph, renderTable } from './html';
import type { ReporterFacts } from './types';

/**
 * 회차별 **사실** 만들기(순수) — 저장소 데이터와 계산 엔진에서만 숫자를 뽑는다(2026-11-10).
 *
 * 각 함수는 그 회차의 표 HTML · 본문에 써도 되는 숫자 · 글감 문장을 함께 돌려준다. LLM 은 표에 손대지
 * 않고, 본문에는 `numbers` 에 있는 숫자만 쓸 수 있다(`rules.ts` 가 대조한다).
 * 날짜는 인자로 받는다(`today`) — 함수 안에서 시계를 읽지 않아야 같은 입력에 같은 결과가 나온다.
 */

const WEEK_DAYS = 7;

const addDays = (date: Date, days: number): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

const SESSION_KO = { beforeOpen: '장 전', afterClose: '장 후', unknown: '시간 미정' } as const;

/** 이번 주(오늘부터 7일) 미국 증시 일정 — 휴장·조기폐장·FOMC·주요 지표·실적. 일정이 없으면 null. */
export const buildWeekAheadFacts = (today: Date): ReporterFacts | null => {
  const from = toCalendarDate(today);
  const until = toCalendarDate(addDays(today, WEEK_DAYS - 1));

  const events = buildUpcoming(today, 200).filter((item) => item.date <= until && (item.major || item.kind !== 'economic'));
  const earnings = MARKET_CALENDAR.earnings.filter((item) => item.date >= from && item.date <= until);
  if (events.length === 0 && earnings.length === 0) return null;

  const dayLabel = (date: string) => `${formatMonthDay(date)}(${formatWeekday(date)})`;

  const scheduleRows = events.map((item) => [dayLabel(item.date), item.labelKo, item.timeEt ? formatKst(item.timeKst) : '종일']);

  const earningsByDay = new Map<string, number>();
  for (const item of earnings) earningsByDay.set(item.date, (earningsByDay.get(item.date) ?? 0) + 1);
  const earningsDays = [...earningsByDay.entries()].sort(([a], [b]) => a.localeCompare(b));
  const maxPerDay = Math.max(0, ...earningsDays.map(([, count]) => count));

  const tables = [
    scheduleRows.length > 0
      ? renderTable({ caption: '이번 주 일정 (한국시간)', head: ['날짜', '일정', '한국시간'], rows: scheduleRows })
      : '',
    earningsDays.length >= 2
      ? renderTable({
          caption: '날짜별 실적 발표 기업 수',
          chart: 'bar',
          head: ['날짜', '발표 기업 수'],
          rows: earningsDays.map(([date, count]) => [dayLabel(date), `${barGlyph(count, maxPerDay)} ${count}`])
        })
      : '',
    earnings.length > 0
      ? renderTable({
          caption: '주요 실적 발표',
          head: ['날짜', '종목', '시점'],
          rows: earnings.slice(0, 12).map((item) => [dayLabel(item.date), item.ticker, SESSION_KO[item.session]])
        })
      : ''
  ].join('');

  const holidays = events.filter((item) => item.kind === 'holiday' || item.kind === 'earlyClose');
  const fomc = events.filter((item) => item.kind === 'fomc');
  const busiest = earningsDays.reduce<[string, number] | null>((acc, entry) => (!acc || entry[1] > acc[1] ? entry : acc), null);

  const highlights = [
    ...holidays.map((item) => `${dayLabel(item.date)} ${item.labelKo}`),
    ...fomc.map((item) => `${dayLabel(item.date)} ${item.labelKo}, 한국시간 ${formatKst(item.timeKst)}`),
    ...(busiest ? [`실적 발표가 가장 몰린 날은 ${dayLabel(busiest[0])}로 ${busiest[1]}곳`] : []),
    `이번 주 실적 발표 기업 ${earnings.length}곳`
  ];

  const numbers = [
    ...events.flatMap((item) => [formatMonthDay(item.date), formatKst(item.timeKst)]),
    ...earningsDays.flatMap(([date, count]) => [formatMonthDay(date), String(count)]),
    String(earnings.length),
    String(WEEK_DAYS)
  ];

  return {
    topic: 'week-ahead',
    factKey: `week-ahead:${from}`,
    asOf: from,
    sourceNote: `미국 증시 캘린더(휴장·FOMC는 거래소·연준 공시, 실적·지표는 주간 수집분) · ${formatMonthDay(from)} 기준`,
    numbers,
    highlights,
    tablesHtml: tables,
    links: [{ href: '/market/us-calendar', label: '미국 증시 캘린더 전체 보기' }],
    category: 'news'
  };
};

/** 월 N만원(세후)에 필요한 원금 — 12개 종목. `monthlyMan` 은 금액별 주소 목록 중 하나. */
export const buildIncomeTargetFacts = (monthlyMan: number, asOf: string): ReporterFacts | null => {
  if (!(DIVIDEND_TARGET_AMOUNT_PAGES_MAN as readonly number[]).includes(monthlyMan)) return null;
  const model = buildDividendTargetModel(monthlyMan * 10_000, DEFAULT_INFLATION_RATE);
  const rows = model.all
    .filter((item) => item.requirement !== null)
    .map((item) => ({ ticker: item.ticker, yieldPercent: item.dividendYieldPercent, principal: item.requirement!.requiredPrincipal }))
    .sort((a, b) => a.principal - b.principal);
  if (rows.length < 3) return null;

  const max = Math.max(...rows.map((row) => row.principal));
  const amountLabel = formatKoreanWon(monthlyMan * 10_000);
  const smallest = rows[0]!;
  const largest = rows[rows.length - 1]!;
  const yieldText = (value: number) => `${Number(value.toFixed(2))}%`;

  const tablesHtml = renderTable({
    caption: `세후 월 ${amountLabel}에 필요한 원금`,
    chart: 'bar',
    head: ['종목(배당률)', '필요 원금'],
    rows: rows.map((row) => [`${row.ticker} (${yieldText(row.yieldPercent)})`, `${barGlyph(row.principal, max)} ${formatKoreanWon(row.principal)}`])
  });

  const ratio = largest.principal / smallest.principal;
  return {
    topic: 'income-target',
    factKey: `income-target:${monthlyMan}:${asOf}`,
    asOf,
    sourceNote: `종목별 배당률은 ${asOf} 시세 기준, 배당소득세 15% 반영. 배당률이 그대로라는 가정의 계산 예시`,
    numbers: [
      amountLabel,
      ...rows.flatMap((row) => [yieldText(row.yieldPercent), formatKoreanWon(row.principal)]),
      `${Number(ratio.toFixed(1))}배`,
      '15%'
    ],
    highlights: [
      `세후 월 ${amountLabel}에 필요한 원금은 ${smallest.ticker} ${formatKoreanWon(smallest.principal)}부터 ${largest.ticker} ${formatKoreanWon(largest.principal)}까지`,
      `가장 적게 드는 종목과 가장 많이 드는 종목의 차이는 ${Number(ratio.toFixed(1))}배`,
      `배당률이 가장 높은 ${smallest.ticker}(${yieldText(smallest.yieldPercent)})가 원금은 가장 적다 — 대신 배당 성장은 따로 봐야 한다`
    ],
    tablesHtml,
    links: [
      { href: dividendTargetAmountPath(monthlyMan), label: `월 ${amountLabel} 필요 원금 자세히 보기` },
      { href: DIVIDEND_TARGET_PATH, label: '다른 금액으로 계산하기' }
    ],
    category: 'insight'
  };
};

/** 소개 페이지가 있는 배당 종목 하나 — 투자금별 세후 월 배당과 10년 재투자 뒤. */
export const buildTickerSpotlightFacts = (ticker: string, asOf: string): ReporterFacts | null => {
  const content = TICKER_CONTENT_LIST.find((entry) => entry.ticker === ticker);
  const answer = buildTickerIncomeAnswer(ticker);
  if (!content || !answer) return null;

  const max = Math.max(...answer.rows.map((row) => row.monthlyAfterReinvest));
  const tablesHtml =
    renderTable({
      caption: `${ticker} 투자금별 세후 월 배당`,
      chart: 'bar',
      head: ['투자금', '지금 월 배당'],
      rows: answer.rows.map((row) => [formatPrincipalLabel(row.principal), `${barGlyph(row.monthlyAfterTax, max)} ${formatIncomeWon(row.monthlyAfterTax)}`])
    }) +
    renderTable({
      caption: `배당을 ${answer.years}년 재투자하면`,
      chart: 'bar',
      head: ['투자금', `${answer.years}년 뒤 월 배당`],
      rows: answer.rows.map((row) => [
        formatPrincipalLabel(row.principal),
        `${barGlyph(row.monthlyAfterReinvest, max)} ${formatIncomeWon(row.monthlyAfterReinvest)}`
      ])
    });

  const head = answer.headline;
  const multiple = head.monthlyAfterReinvest / head.monthlyAfterTax;
  const pct = (value: number) => `${Number(value.toFixed(2))}%`;

  return {
    topic: 'ticker-spotlight',
    factKey: `ticker-spotlight:${ticker}:${asOf}`,
    asOf,
    sourceNote: `배당률 ${pct(answer.dividendYieldPercent)}·연 배당성장 ${pct(answer.dividendGrowthPercent)}(${asOf} 시세 기준 가정), 배당소득세 ${pct(answer.taxRatePercent)}. 주가·환율 변동과 수수료는 넣지 않은 계산 예시`,
    numbers: [
      ...answer.rows.flatMap((row) => [formatPrincipalLabel(row.principal), formatIncomeWon(row.monthlyAfterTax), formatIncomeWon(row.monthlyAfterReinvest), formatIncomeWon(row.annualAfterTax)]),
      pct(answer.dividendYieldPercent),
      pct(answer.dividendGrowthPercent),
      pct(answer.taxRatePercent),
      `${answer.years}년`,
      `${Number(multiple.toFixed(1))}배`
    ],
    highlights: [
      `${ticker}에 1억원을 넣으면 세후 월 ${formatIncomeWon(head.monthlyAfterTax)}(연 ${formatIncomeWon(head.annualAfterTax)})`,
      `배당을 ${answer.years}년 재투자하면 같은 1억원이 월 ${formatIncomeWon(head.monthlyAfterReinvest)}, 지금의 ${Number(multiple.toFixed(1))}배`,
      `배당률 ${pct(answer.dividendYieldPercent)}, 연 배당성장 ${pct(answer.dividendGrowthPercent)} 가정`
    ],
    tablesHtml,
    links: [{ href: `/ticker/${content.slug}`, label: `${ticker} 자세히 보기` }],
    category: 'insight'
  };
};

/** 아직 다루지 않은 다음 종목 — 소개 페이지 순서대로, 배당이 있는 종목만. */
export const pickNextSpotlightTicker = (usedFactKeys: readonly string[]): string | null => {
  const usedTickers = new Set(
    usedFactKeys.filter((key) => key.startsWith('ticker-spotlight:')).map((key) => key.split(':')[1])
  );
  return (
    TICKER_CONTENT_LIST.map((entry) => entry.ticker).find((ticker) => !usedTickers.has(ticker) && buildTickerIncomeAnswer(ticker) !== null) ??
    null
  );
};

/** 아직 다루지 않은(또는 가장 오래전에 다룬) 월 배당 목표 금액. */
export const pickNextIncomeTarget = (usedFactKeys: readonly string[]): number => {
  const used = usedFactKeys.filter((key) => key.startsWith('income-target:')).map((key) => Number(key.split(':')[1]));
  return DIVIDEND_TARGET_AMOUNT_PAGES_MAN.find((man) => !used.includes(man)) ?? DIVIDEND_TARGET_AMOUNT_PAGES_MAN[used.length % DIVIDEND_TARGET_AMOUNT_PAGES_MAN.length]!;
};
