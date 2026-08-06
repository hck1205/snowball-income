import type { NasdaqEarningsRow, NasdaqEconomicRow } from './sources/nasdaqCalendar';

/**
 * Nasdaq 응답 → 우리 형태. **순수 함수만** 있다(네트워크·시간 없음).
 *
 * ## 🔴 경제지표를 전부 싣지 않는다
 * 하루에 미국 항목만 15개가 오고 대부분은 이 앱의 사용자가 볼 이유가 없다(국채 입찰 4주물,
 * 천연가스 재고, IEA 월간보고…). 전부 실으면 캘린더가 소음이 되고 **정말 중요한 날이 묻힌다.**
 * 그래서 **아는 것만 싣는다** — 아래 표에 있는 것만 통과시키고, 나머지는 버린다.
 *
 * ⚠ 이 표에 없는 지표는 화면에 안 나온다. 그것이 의도다. 늘리고 싶으면 여기에 한글 이름과 함께
 *   더해라 — 이름을 영어 그대로 흘리면 화면의 다른 문구와 언어가 섞인다.
 */

/**
 * 실을 미국 경제지표와 그 한국어 이름.
 *
 * `major: true` 는 **시장 전체가 그날을 기다리는** 지표다. 화면이 이 값으로 굵기를 가른다 —
 * 전부 굵게 하면 아무것도 굵지 않은 것과 같다.
 */
const US_EVENTS: Record<string, { ko: string; major: boolean }> = {
  CPI: { ko: '소비자물가지수(CPI)', major: true },
  'Core CPI': { ko: '근원 소비자물가지수', major: true },
  PPI: { ko: '생산자물가지수(PPI)', major: true },
  'Core PPI': { ko: '근원 생산자물가지수', major: false },
  'Nonfarm Payrolls': { ko: '비농업 고용', major: true },
  'Unemployment Rate': { ko: '실업률', major: true },
  'Average Hourly Earnings': { ko: '시간당 평균임금', major: false },
  'Initial Jobless Claims': { ko: '신규 실업수당 청구', major: false },
  'Continuing Jobless Claims': { ko: '연속 실업수당 청구', major: false },
  'ADP Employment Change': { ko: 'ADP 민간고용', major: false },
  'JOLTS Job Openings': { ko: '구인·이직 보고서(JOLTS)', major: false },
  'Challenger Job Cuts': { ko: '챌린저 감원 발표', major: false },
  'Retail Sales': { ko: '소매판매', major: true },
  'Core Retail Sales': { ko: '근원 소매판매', major: false },
  GDP: { ko: '국내총생산(GDP)', major: true },
  'GDP Price Index': { ko: 'GDP 물가지수', major: false },
  'PCE Price Index': { ko: '개인소비지출(PCE) 물가', major: true },
  'Core PCE Price Index': { ko: '근원 PCE 물가', major: true },
  'Personal Income': { ko: '개인소득', major: false },
  'Personal Spending': { ko: '개인소비', major: false },
  'ISM Manufacturing PMI': { ko: 'ISM 제조업 PMI', major: true },
  'ISM Non-Manufacturing PMI': { ko: 'ISM 서비스업 PMI', major: true },
  'ISM Services PMI': { ko: 'ISM 서비스업 PMI', major: true },
  'Michigan Consumer Sentiment': { ko: '미시간대 소비자심리', major: false },
  'CB Consumer Confidence': { ko: '소비자신뢰지수', major: false },
  'Consumer Confidence': { ko: '소비자신뢰지수', major: false },
  'Durable Goods Orders': { ko: '내구재 주문', major: false },
  'Existing Home Sales': { ko: '기존주택 판매', major: false },
  'New Home Sales': { ko: '신규주택 판매', major: false },
  'Housing Starts': { ko: '주택착공', major: false },
  'Industrial Production': { ko: '산업생산', major: false },
  'Trade Balance': { ko: '무역수지', major: false },
  'Federal Budget Balance': { ko: '연방 재정수지', major: false },
  'FOMC Interest Rate Decision': { ko: 'FOMC 금리 결정', major: true },
  'FOMC Meeting Minutes': { ko: 'FOMC 의사록', major: true },
  'Fed Chair Powell Speaks': { ko: '연준 의장 발언', major: true }
};

export type NormalizedEconomic = {
  date: string;
  timeEt: string;
  nameKo: string;
  nameEn: string;
  major: boolean;
};

/** `HH:MM` 만 통과시킨다. 시각이 없으면 그 항목은 캘린더에 놓을 자리를 정할 수 없다. */
const asTime = (raw: string | undefined): string | null =>
  raw && /^\d{2}:\d{2}$/.test(raw.trim()) ? raw.trim() : null;

/**
 * 미국 항목 중 **아는 지표만** 남긴다. 같은 날 같은 지표가 두 번 오면(응답에 실제로 중복이 있다)
 * 하나로 접는다 — 키는 `날짜+시각+이름`이다.
 */
export const normalizeEconomic = (date: string, rows: readonly NasdaqEconomicRow[]): NormalizedEconomic[] => {
  const byKey = new Map<string, NormalizedEconomic>();

  for (const row of rows) {
    if (row.country !== 'United States') continue;
    const nameEn = (row.eventName ?? '').trim();
    const known = US_EVENTS[nameEn];
    if (!known) continue;
    /* ⚠ `gmt` 라는 이름이지만 값은 미 동부시각이다(sources/nasdaqCalendar.ts 실측 3번). */
    const timeEt = asTime(row.gmt);
    if (!timeEt) continue;

    const key = `${date}|${timeEt}|${nameEn}`;
    if (!byKey.has(key)) byKey.set(key, { date, timeEt, nameKo: known.ko, nameEn, major: known.major });
  }

  return [...byKey.values()];
};

export type NormalizedEarnings = {
  date: string;
  ticker: string;
  nameEn: string;
  session: 'beforeOpen' | 'afterClose' | 'unknown';
  hasTickerPage: boolean;
};

/**
 * Nasdaq 의 `time` 은 `time-pre-market` · `time-after-hours` · `time-not-supplied` 형태다.
 * 🔴 모르면 `unknown` 으로 남긴다 — "장 마감 후"로 넘겨짚으면 한국 사용자가 새벽에 헛되이 기다린다.
 */
const asSession = (raw: string | undefined): NormalizedEarnings['session'] => {
  const value = (raw ?? '').toLowerCase();
  if (value.includes('pre-market')) return 'beforeOpen';
  if (value.includes('after-hours')) return 'afterClose';
  return 'unknown';
};

/** `$1,081,910,196,869` → 숫자. 못 읽으면 0 — 시가총액은 거르는 기준일 뿐이라 0 이 안전한 기본값이다. */
export const parseMarketCap = (raw: string | undefined): number => {
  const digits = (raw ?? '').replace(/[^0-9]/g, '');
  return digits ? Number(digits) : 0;
};

export type EarningsFilter = {
  /** 우리 앱이 다루는 종목(프리셋·소개 페이지). 여기 있으면 시가총액과 무관하게 싣는다. */
  readonly universe: ReadonlySet<string>;
  /** 유니버스 밖에서도 실을 최소 시가총액. 이 밑은 버린다. */
  readonly minMarketCapUsd: number;
  /** 소개 페이지가 있는 종목. 화면이 링크를 걸 수 있는지 판정한다. */
  readonly tickerPages: ReadonlySet<string>;
};

/**
 * 하루 577건이 오는 실적 발표를 **읽을 만한 수**로 줄인다.
 *
 * 🔴 두 갈래로만 남긴다: **우리가 다루는 종목**이거나 **시장이 다 보는 대형주**거나.
 * 전부 실으면 한 달치가 수천 건이 되어 화면도 파일도 감당하지 못하고, 무엇보다 사용자가
 * 자기와 상관있는 줄을 찾지 못한다.
 */
export const normalizeEarnings = (
  date: string,
  rows: readonly NasdaqEarningsRow[],
  filter: EarningsFilter
): NormalizedEarnings[] => {
  const seen = new Set<string>();
  const out: NormalizedEarnings[] = [];

  for (const row of rows) {
    const ticker = (row.symbol ?? '').trim().toUpperCase();
    if (!ticker || seen.has(ticker)) continue;

    const inUniverse = filter.universe.has(ticker);
    if (!inUniverse && parseMarketCap(row.marketCap) < filter.minMarketCapUsd) continue;

    seen.add(ticker);
    out.push({
      date,
      ticker,
      nameEn: (row.name ?? '').trim(),
      session: asSession(row.time),
      hasTickerPage: filter.tickerPages.has(ticker)
    });
  }

  /* 우리 종목이 먼저, 그다음 티커 순 — 사용자가 자기 종목을 맨 위에서 본다. */
  return out.sort((left, right) => {
    const leftMine = filter.universe.has(left.ticker) ? 0 : 1;
    const rightMine = filter.universe.has(right.ticker) ? 0 : 1;
    return leftMine - rightMine || left.ticker.localeCompare(right.ticker);
  });
};

/** 수집할 날짜 목록. 주말은 건너뛴다 — 미국 시장도 경제지표도 주말에는 없다. */
export const businessDaysBetween = (start: Date, days: number): string[] => {
  const out: string[] = [];
  for (let step = 0; step < days; step += 1) {
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate() + step);
    const weekday = cursor.getDay();
    if (weekday === 0 || weekday === 6) continue;
    const month = String(cursor.getMonth() + 1).padStart(2, '0');
    const day = String(cursor.getDate()).padStart(2, '0');
    out.push(`${cursor.getFullYear()}-${month}-${day}`);
  }
  return out;
};
