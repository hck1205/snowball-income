import type { Frequency, SimulationResult } from '@/shared/types';
import type { SnowballReport, SnowballReportCalendarMonth } from '@/shared/lib/snowball';
import { formatApproxKRW } from '@/shared/utils';

/**
 * PDF 리포트의 **문장 조립 계층** — 전부 순수 함수다.
 *
 * 규율 두 가지:
 *  1. 여기서 새 숫자를 만들지 않는다. 엔진(`buildSnowballReport`)이 준 값이거나, 그 값들끼리의 산술뿐이다.
 *  2. **목표(`target`) 관련 문구는 `hasTarget`이 true일 때만** 만든다. `findTargetYear(rows, 0)`은
 *     첫 행을 즉시 잡아 "1년차 달성"을 만들어 내므로, 목표 미설정 상태의 달성 문구는 거짓말이 된다
 *     (OG 카드·커뮤니티 카드에서 같은 함정이 두 번 잡혔다).
 *
 * 본문 축약 금액은 `formatApproxKRW`("약 9.2억"), 표 안의 정확한 금액은 `formatKRW`를 쓴다 — 역할 고정.
 */

/** 면책 정본. 문구를 바꾸지 말 것(법적 성격의 고정 카피). */
export const PDF_REPORT_DISCLAIMER = `이 리포트는 투자 조언이 아닙니다.

모든 숫자는 사용자가 입력한 가정(배당률, 배당 성장률, 세율, 투자 기간 등)을
그대로 적용해 계산한 추정치이며, 실제 수익·배당·세금과 다를 수 있습니다.
배당은 발행사의 결정에 따라 줄거나 중단될 수 있고, 주가는 하락할 수 있으며,
세법과 환율은 변동합니다. 과거 데이터가 미래를 보장하지 않습니다.

투자 판단과 그 결과에 대한 책임은 투자자 본인에게 있습니다.`;

/** 월평균과 실지급의 차이를 상시 고지하는 문구(차트 옆 고정). */
export const PDF_REPORT_MONTHLY_NOTE =
  "'월평균'은 연 배당을 12로 나눈 값이고, 아래 차트는 실제로 돈이 들어오는 달을 보여줍니다.";

export const DEFAULT_SCENARIO_NAME = '내 포트폴리오';

const FREQUENCY_LABEL: Record<Frequency, string> = {
  monthly: '월',
  quarterly: '분기',
  semiannual: '반기',
  annual: '연'
};

export const frequencyLabel = (frequency: Frequency): string => FREQUENCY_LABEL[frequency] ?? String(frequency);

/** 파일명에 쓸 수 없는 문자 — Windows 예약 문자. */
const FILE_NAME_FORBIDDEN = new RegExp('[\\\\/:*?"<>|]', 'g');
/** 제어문자 — 파일명에 섞이면 저장이 실패하거나 이름이 깨진다. */
const FILE_NAME_CONTROL = new RegExp('[\u0000-\u001f\u007f]', 'g');

/**
 * 시나리오 이름 → 파일명 조각. 공백은 `_`, 금지문자는 제거, 20자 초과는 절단.
 * 정제 후 빈 문자열이면 `내포트폴리오`.
 */
export const sanitizeScenarioNameForFile = (rawName: string): string => {
  const cleaned = rawName
    .replace(FILE_NAME_FORBIDDEN, '')
    .replace(FILE_NAME_CONTROL, '')
    .trim()
    .replace(/\s+/g, '_');

  const truncated = cleaned.slice(0, 20);
  return truncated.length > 0 ? truncated : '내포트폴리오';
};

const pad2 = (value: number): string => String(value).padStart(2, '0');

/** `스노우볼리포트_{시나리오명}_{YYYYMMDD}.pdf` */
export const buildPdfReportFileName = (scenarioName: string, generatedAt: Date): string => {
  const stamp = `${generatedAt.getFullYear()}${pad2(generatedAt.getMonth() + 1)}${pad2(generatedAt.getDate())}`;
  return `스노우볼리포트_${sanitizeScenarioNameForFile(scenarioName)}_${stamp}.pdf`;
};

/** `2026년 7월 20일 14:32 생성` */
export const formatGeneratedAt = (generatedAt: Date): string =>
  `${generatedAt.getFullYear()}년 ${generatedAt.getMonth() + 1}월 ${generatedAt.getDate()}일 ` +
  `${pad2(generatedAt.getHours())}:${pad2(generatedAt.getMinutes())} 생성`;

/** 표지 제목 아래 부제. */
export const buildCoverSubtitle = (report: SnowballReport): string => {
  const startYear = report.yearly[0]?.year ?? new Date(report.inputs.investmentStartDate).getFullYear();
  return `${startYear}년 시작 · ${report.inputs.durationYears}년 시뮬레이션 · 종목 ${report.portfolio.tickerCount}개`;
};

export const formatMultiple = (ratio: number): string => `${ratio.toFixed(1)}배`;

export const formatPercentValue = (value: number, fractionDigits = 1): string => `${value.toFixed(fractionDigits)}%`;

/** 부호를 문자로도 병기한다 — 색만으로 방향을 말하지 않기 위해서다. */
export const formatSignedApproxKRW = (value: number): string =>
  `${value >= 0 ? '+' : '-'}${formatApproxKRW(Math.abs(value))}`;

/** `월 지급 2종 · 분기 지급 1종` */
export const buildFrequencyMixSummary = (report: SnowballReport): string =>
  report.portfolio.frequencyMix
    .map((item) => `${frequencyLabel(item.frequency)} 지급 ${item.tickerCount}종`)
    .join(' · ');

/** 마지막 12개월 중 실제로 배당이 들어온 달의 수. */
export const countPayingMonths = (calendar: SnowballReportCalendarMonth[]): number =>
  calendar.filter((item) => item.amount > 0).length;

export const sumCalendar = (calendar: SnowballReportCalendarMonth[]): number =>
  calendar.reduce((sum, item) => sum + item.amount, 0);

/**
 * 캘린더 12칸이 덮는 기간 라벨.
 *
 * 캘린더는 달력 1~12월이 아니라 **"투자 시작 후 마지막 12개월"** 이라 시작월에 따라 두 해에 걸친다
 * (예: 8월 시작 → 2035-09 ~ 2036-08). 캡션과 해설이 **반드시 같은 문자열**을 쓰도록 여기 한 곳에서만
 * 만든다 — 예전엔 캡션은 span으로, 해설은 마지막 달의 연도만으로 말해서 같은 페이지의 두 문장이
 * 서로 다른 연도를 가리켰다.
 */
export const buildCalendarSpanLabel = (calendar: SnowballReportCalendarMonth[]): string => {
  const first = calendar[0];
  const last = calendar[calendar.length - 1];
  if (!first || !last) return '';

  return first.year === last.year
    ? `${first.year}년`
    : `${first.year}년 ${first.month}월 ~ ${last.year}년 ${last.month}월`;
};

/** 해설 문장의 기간 도입부. 한 해 안이면 `2036년에는`, 두 해에 걸치면 창(window)으로 말한다. */
export const buildCalendarPeriodPhrase = (calendar: SnowballReportCalendarMonth[]): string => {
  const first = calendar[0];
  const last = calendar[calendar.length - 1];
  if (!first || !last) return '';

  return first.year === last.year
    ? `${first.year}년에는`
    : `마지막 12개월(${buildCalendarSpanLabel(calendar)}) 동안은`;
};

/**
 * 월별 차트 캡션 — **연도를 반드시 명기한다**. 차트 축에는 `9월`처럼 월만 있어서
 * 종이에서는 어느 해인지 알 수 없다.
 */
export const buildMonthlyCaption = (calendar: SnowballReportCalendarMonth[]): string => {
  const span = buildCalendarSpanLabel(calendar);
  if (span.length === 0) return '';

  return `${span} 실지급 기준 · 배당 합계 ${formatApproxKRW(sumCalendar(calendar))}`;
};

/* ── 해설 문구 (T1~T5) ──────────────────────────────────────────────────────── */

/** T1 — 표지 해설. 목표 유무·달성 여부로 3분기. */
export const buildCoverNarrative = (report: SnowballReport): string => {
  const head =
    `${report.inputs.durationYears}년 뒤 자산은 ${formatApproxKRW(report.outcome.finalAssetValue)}, ` +
    `마지막 해 기준 매달 ${formatApproxKRW(report.outcome.finalMonthlyAverageDividend)}이 세후로 들어옵니다.`;

  if (!report.target.hasTarget) return head;

  const targetLabel = formatApproxKRW(report.target.targetMonthlyDividend);
  if (report.target.reachedInYears !== null) {
    return `${head} 목표했던 월 ${targetLabel}에는 ${report.target.reachedInYears}년차에 도달합니다.`;
  }

  const progress = report.target.finalProgressRatio === null ? 0 : Math.round(report.target.finalProgressRatio * 100);
  return (
    `${head} 목표했던 월 ${targetLabel}에는 ${report.inputs.durationYears}년 안에 도달하지 못하고, ` +
    `마지막 해 기준 ${progress}% 수준에 머뭅니다.`
  );
};

/** T2 — 포트폴리오 구성 해설. */
export const buildPortfolioNarrative = (report: SnowballReport): string => {
  const top = [...report.portfolio.holdings].sort((left, right) => right.weight - left.weight)[0];
  const head = top
    ? `${report.portfolio.tickerCount}개 종목에 나눠 담았고, 비중이 가장 큰 종목은 ${top.ticker}(${(top.weight * 100).toFixed(1)}%)입니다.`
    : `${report.portfolio.tickerCount}개 종목에 나눠 담았습니다.`;

  const dryMonths = 12 - countPayingMonths(report.finalYearCalendar);
  const tail =
    dryMonths === 0
      ? '매달 배당이 들어오는 구성입니다.'
      : `지급 주기는 ${buildFrequencyMixSummary(report)}이라, 배당이 들어오지 않는 달이 ${dryMonths}개월 있습니다.`;

  return `${head} ${tail}`;
};

/** T3-a — 원금 대비 자산 배수. 원금 0이면 문장 자체를 만들지 않는다(0 나눗셈 방어). */
export const buildAssetGrowthNarrative = (report: SnowballReport): string | null => {
  const ratio = report.outcome.assetToContributionRatio;
  if (ratio === null) return null;

  return (
    `투입한 원금은 ${formatApproxKRW(report.outcome.totalContribution)}인데 ` +
    `최종 자산은 ${formatApproxKRW(report.outcome.finalAssetValue)}로, 넣은 돈의 ${formatMultiple(ratio)}가 됐습니다.`
  );
};

/** T3-b — 누적 배당과 배당세, 재투자 비율. */
export const buildDividendNarrative = (report: SnowballReport): string => {
  const head =
    `그 사이 받은 배당은 세후 누계 ${formatApproxKRW(report.outcome.cumulativeNetDividend)}이고, ` +
    `배당세로 ${formatApproxKRW(report.taxes.cumulativeDividendTax)}를 냈습니다.`;

  if (!report.inputs.reinvestDividends) return head;

  return `${head} 이 배당 중 ${report.inputs.reinvestDividendPercent}%가 다시 주식을 사는 데 쓰여 자산 성장을 밀어올렸습니다.`;
};

/** T3-c — 월평균 배당의 성장. 1년차 배당이 0이면 "첫 지급 연차"로 문장을 바꾼다. */
export const buildMonthlyGrowthNarrative = (report: SnowballReport): string | null => {
  const rows = report.yearly;
  const firstRow = rows[0];
  const finalRow = rows[rows.length - 1];
  if (!firstRow || !finalRow) return null;

  if (firstRow.monthlyDividend > 0) {
    const ratio = finalRow.monthlyDividend / firstRow.monthlyDividend;
    return (
      `월평균 배당은 1년차 ${formatApproxKRW(firstRow.monthlyDividend)}에서 ` +
      `${rows.length}년차 ${formatApproxKRW(finalRow.monthlyDividend)}로, ${formatMultiple(ratio)} 늘어납니다.`
    );
  }

  const firstPayingIndex = rows.findIndex((row) => row.monthlyDividend > 0);
  if (firstPayingIndex === -1) return null;

  return (
    `1년차에는 배당이 아직 지급되지 않고, ${firstPayingIndex + 1}년차부터 ` +
    `월평균 ${formatApproxKRW(rows[firstPayingIndex].monthlyDividend)}이 들어오기 시작합니다.`
  );
};

/** T4 — 마지막 12개월 실지급 해설. 지급 달이 하나도 없으면 null. */
export const buildCalendarNarrative = (report: SnowballReport): string | null => {
  const paying = report.finalYearCalendar.filter((item) => item.amount > 0);
  if (paying.length === 0) return null;

  const sorted = [...paying].sort((left, right) => right.amount - left.amount);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];

  // 기간 표현은 캡션과 **같은 소스**를 쓴다 — 마지막 달의 연도만 뽑으면 두 해에 걸친 창에서
  // 캡션("2035년 9월 ~ 2036년 8월")과 해설("2036년에는")이 서로 다른 연도를 말하게 된다.
  const period = buildCalendarPeriodPhrase(report.finalYearCalendar);
  const head = `${period} 배당이 ${paying.length}개월에 나눠 총 ${formatApproxKRW(sumCalendar(report.finalYearCalendar))}가 들어옵니다.`;
  if (paying.length === 1) return `${head} 지급되는 달은 ${top.month}월(${formatApproxKRW(top.amount)}) 한 번입니다.`;

  return (
    `${head} 가장 많이 들어오는 달은 ${top.month}월(${formatApproxKRW(top.amount)}), ` +
    `가장 적은 달은 ${bottom.month}월(${formatApproxKRW(bottom.amount)})입니다.`
  );
};

/**
 * T5 — 전량 매도 가정 해설 + 금융소득종합과세 경고 문장.
 *
 * 평가손실(음수)일 때는 **"평가이익"이라는 단어 자체가 틀리므로** 문장을 갈아 끼운다. 이익일 때는
 * 부호를 문자로 병기(`formatSignedApproxKRW`)해 같은 페이지의 지표 타일과 표기 규율을 맞춘다
 * (색만으로 방향을 말하지 않는다는 규율의 문장판).
 */
export const buildTaxNarrative = (report: SnowballReport): string => {
  const { unrealizedGain, estimatedCapitalGainsTax, afterCapitalGainsTaxValue } = report.taxes;
  const lead = `${report.inputs.durationYears}년 뒤 전량 매도한다고 가정하면`;

  const head =
    unrealizedGain < 0
      ? `${lead} 평가손실이 ${formatApproxKRW(Math.abs(unrealizedGain))} 발생해 양도세는 없고, ` +
        `손에 남는 금액은 ${formatApproxKRW(afterCapitalGainsTaxValue)}입니다.`
      : `${lead} 평가이익 ${formatSignedApproxKRW(unrealizedGain)}에 대해 ` +
        `양도세 ${formatApproxKRW(estimatedCapitalGainsTax)}가 발생하고, ` +
        `손에 남는 금액은 ${formatApproxKRW(afterCapitalGainsTaxValue)}입니다. ` +
        '계속 보유하면 내지 않는 세금입니다.';

  if (report.taxes.financialIncomeThresholdYear === null) return head;

  return (
    `${head} 또한 ${report.taxes.financialIncomeThresholdYear}년차부터 세전 연 배당이 ` +
    '금융소득종합과세 기준(2,000만원)을 넘어, 실제 세율이 입력값보다 높아질 수 있습니다.'
  );
};

/**
 * 전제표용 — 항목 목록을 **2개씩** 묶어 표의 한 행으로 만든다(홀수면 마지막 묶음은 1개).
 *
 * 조건부 항목이 늘어도 항목은 목록에 한 번만 담기므로, 조건 조합에 따라 중복·누락이 생기지 않는다.
 */
export const chunkIntoPairs = <T>(items: T[]): T[][] =>
  items.reduce<T[][]>((rows, item, index) => {
    if (index % 2 === 0) rows.push([item]);
    else rows[rows.length - 1].push(item);
    return rows;
  }, []);

/* ── 페이지 분할 ────────────────────────────────────────────────────────────── */

/**
 * 연도별 표를 페이지 단위로 나눈다.
 *
 * 한 장짜리 긴 캔버스를 잘라내면 표 행·문장 중간이 잘리므로, **처음부터 페이지 div 단위**로
 * 문서를 만들고 각 페이지를 개별 캡처한다. 첫 페이지는 섹션 제목이 들어가 행 수가 더 적다.
 */
export const chunkYearlyRows = (
  rows: SimulationResult[],
  firstPageSize: number,
  nextPageSize: number
): SimulationResult[][] => {
  if (rows.length === 0) return [];

  const chunks: SimulationResult[][] = [rows.slice(0, firstPageSize)];
  let cursor = firstPageSize;

  while (cursor < rows.length) {
    chunks.push(rows.slice(cursor, cursor + nextPageSize));
    cursor += nextPageSize;
  }

  return chunks;
};
