import { epochSecondsToUtcYear } from './epochTime';
import { ListSourceError, USER_AGENT, toYahooSymbol } from './sourceCommon';

/**
 * 야후 chart 의 **전기간 배당이력 + 현재가**. 무키 요청 **한 번**에 셋이 같이 온다:
 * `meta.regularMarketPrice`(현재가) · `events.dividends`(전 기간 배당 이벤트) · `meta.longName`(회사명).
 *
 * ## 🔴 `range=max` 를 쓰지 마라 — 배당 이벤트가 구멍난 채로 온다
 * KO 실측(2026-08-04): `interval=1d&range=max` 는 이벤트 168건에 **2004~2015이 통째로 비어 있다**.
 * `interval=1mo&period1=-315619200`(1960-01-01)은 257건에 결손 연도 0. 그래서 period1 을 명시한다.
 * 응답은 티커당 약 62KB 로, 64년치를 무키 요청 한 번에 받는다.
 *
 * ## 이 데이터로 무엇을 하고, 무엇을 하지 않는가
 * - ✅ **삭감 탐지**: 연배당이 전년 대비 뚜렷하게 줄면 신고한다. 실측으로 신뢰할 수 있는 유일한
 *   자동 판정이다(LEG 2023년 1.820 → 2024년 0.610, MMM 5.017 → 3.363 을 오차 없이 잡는다).
 * - ✅ **선행 배당률·5년 성장률**: `yahooQuoteMetrics.ts` 가 이 응답 하나로 계산한다.
 * - ❌ **연속 증배 연수 계산**: 하지 않는다. 배당귀족 69종에 돌려 보면 단순 합산 33종, 정교화해도
 *   58종만 25년 이상으로 나온다. 남는 오차는 분사·지급주기 변경이라 원리적으로 못 푼다.
 */
const YAHOO_CHART_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

/** 1960-01-01 UTC. 야후가 주는 가장 오래된 배당(1962년)보다 앞선다. */
const PERIOD_START_SECONDS = -315_619_200;

export type AnnualDividend = { year: number; total: number };

/** 배당 이벤트 한 건. `timestampSeconds` 는 **1970년 이전 음수**일 수 있다(KO 는 1962년부터). */
export type YahooDividendEvent = { amount: number; timestampSeconds: number };

/** chart 한 번으로 받아 온 전부. 여기서 파생되는 지표는 전부 이 값 하나에서 나온다. */
export type YahooDividendChart = {
  ticker: string;
  /** 정규장 가격. 응답에 없으면 `null`(0 으로 대체하지 않는다 — 0 은 배당률을 무한대로 만든다). */
  price: number | null;
  currency: string | null;
  /** 야후가 적어 준 회사명. 위키피디아에 없는 소형주의 이름 공급원이다. */
  longName: string | null;
  events: YahooDividendEvent[];
};

type YahooChartPayload = {
  chart?: {
    result?: Array<{
      meta?: { regularMarketPrice?: unknown; currency?: unknown; longName?: unknown; shortName?: unknown };
      events?: { dividends?: Record<string, { amount?: unknown; date?: unknown }> };
    }> | null;
    error?: { code?: string; description?: string } | null;
  };
};

const toFiniteNumber = (raw: unknown): number | null =>
  typeof raw === 'number' && Number.isFinite(raw) ? raw : null;

const toNonEmptyString = (raw: unknown): string | null =>
  typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : null;

/** 응답의 배당 맵을 **시간 오름차순** 배열로 편다. 값이 깨진 이벤트는 조용히 버린다(합계를 오염시킨다). */
export const toDividendEvents = (
  dividends: Record<string, { amount?: unknown; date?: unknown }> | undefined
): YahooDividendEvent[] => {
  if (!dividends) return [];
  const events: YahooDividendEvent[] = [];
  for (const event of Object.values(dividends)) {
    const amount = toFiniteNumber(event.amount);
    const timestampSeconds = toFiniteNumber(event.date);
    if (amount === null || timestampSeconds === null) continue;
    events.push({ amount, timestampSeconds });
  }
  return events.sort((left, right) => left.timestampSeconds - right.timestampSeconds);
};

/**
 * 달력연도별 배당 합계. **삭감 판정과 5년 성장률**에 쓴다.
 *
 * ⚠ 달력 합산에는 알려진 왜곡이 있다: 2012년 말 재정절벽 때 여러 기업이 배당을 앞당겨 지급했고
 * (ABT·GD·CAT·SPGI 등 2012년이 2013년보다 커진다), 특별배당도 섞인다. 그래서 삭감 임계값을
 * 넉넉히 잡는다(아래 `CUT_RATIO`).
 *
 * 🔴 연도는 `epochSecondsToUtcYear` 로 센다 — `Date` 를 쓰지 않는 이유는 `epochTime.ts` 머리말 참고.
 */
export const toAnnualDividends = (events: readonly YahooDividendEvent[]): AnnualDividend[] => {
  const byYear = new Map<number, number>();
  for (const event of events) {
    const year = epochSecondsToUtcYear(event.timestampSeconds);
    byYear.set(year, (byYear.get(year) ?? 0) + event.amount);
  }
  return [...byYear.entries()].map(([year, total]) => ({ year, total })).sort((a, b) => a.year - b.year);
};

/**
 * 삭감으로 볼 하락 비율. 0.85 = 전년 대비 15% 넘게 줄어든 해만 신고한다.
 *
 * 왜 15%인가: 지급 앞당김으로 인한 흔들림은 대개 한 자릿수~10%대이고, 실제 삭감은 훨씬 크다
 * (LEG 66% 감소, MMM 33% 감소). 임계를 5%로 좁히면 정상 종목이 매달 신고에 뜬다.
 *
 * ⚠ **특별배당은 이 임계로도 못 거른다.** 2026-08-03 실측(배당킹 46종): 신고 3건이 전부 오탐이었다 —
 * RLI 2022년 4.015 → 2023년 1.535(2022년에 주당 2.00 특별배당), FRT·NDSN 도 전년의 추가 지급 때문이다.
 * 그래서 이 가드는 **판정자가 아니라 신고자**여야 한다: 목록을 자동으로 고치지 않고, 사람이 그 3건을
 * 눈으로 확인해 넘긴다. 임계를 더 올려 오탐을 줄이려 하면 진짜 삭감을 놓친다.
 */
const CUT_RATIO = 0.85;

/** 최근 몇 개 연도만 본다. 20년 전의 삭감은 목록 자격 판정에 이미 반영돼 있다. */
const CUT_LOOKBACK_YEARS = 6;

export type DividendCut = { fromYear: number; toYear: number; fromTotal: number; toTotal: number };

/**
 * 최근 구간에서 **가장 최근의** 배당 삭감을 찾는다. 없으면 `null`.
 * 진행 중인 해(마지막 연도)는 아직 지급이 남아 있어 무조건 작으므로 **제외**한다 — 이걸 빼먹으면
 * 매년 1월에 전 종목이 삭감으로 신고된다.
 *
 * ⚠ **이 방식(연간 합계)에는 실측된 오탐률이 있다.** 후보 유니버스 25종에 돌렸을 때 4종이 삭감으로
 * 신고됐고 4종 전부 오탐이었다(지급일이 연말·연초를 넘나들어 그 해 지급 건수가 줄었을 뿐, 1회
 * 지급액은 한 번도 줄지 않았다 — ACN·APD·AMCR·ANDE). 더 나은 판정자는
 * `yahooQuoteMetrics.ts` 의 `findRecentRateCut`(1회 지급액 기준)이다.
 * 여기를 그대로 두는 이유는 이 함수가 **큐레이션 목록 가드**(`collect.ts` 의 `verifyLists`)의 입력이라
 * 판정 기준을 바꾸면 기존 생성물의 신고 목록이 함께 바뀌기 때문이다 — 그 교체는 별도 작업으로 한다.
 */
export const findRecentDividendCut = (annual: readonly AnnualDividend[], currentYear: number): DividendCut | null => {
  const complete = annual.filter((entry) => entry.year < currentYear);
  const window = complete.slice(-CUT_LOOKBACK_YEARS);
  let latest: DividendCut | null = null;
  for (let index = 1; index < window.length; index += 1) {
    const previous = window[index - 1];
    const current = window[index];
    if (previous.total <= 0) continue;
    if (current.total < previous.total * CUT_RATIO) {
      latest = { fromYear: previous.year, toYear: current.year, fromTotal: previous.total, toTotal: current.total };
    }
  }
  return latest;
};

/** 가격·회사명·전기간 배당을 한 번에 받는다. 이 함수 위에 모든 야후 파생 지표가 얹힌다. */
export const fetchYahooDividendChart = async (
  ticker: string,
  fetchImpl: typeof fetch = fetch
): Promise<YahooDividendChart> => {
  const now = Math.floor(Date.now() / 1000);
  const url =
    `${YAHOO_CHART_BASE}/${encodeURIComponent(toYahooSymbol(ticker))}` +
    `?interval=1mo&period1=${PERIOD_START_SECONDS}&period2=${now}&events=div`;

  let response: Response;
  try {
    response = await fetchImpl(url, { headers: { 'user-agent': USER_AGENT } });
  } catch (error) {
    throw new ListSourceError(`${ticker} 배당이력 요청 실패: ${String(error)}`);
  }
  if (!response.ok) throw new ListSourceError(`${ticker} 배당이력 HTTP ${response.status}`);

  const payload = (await response.json()) as YahooChartPayload;
  if (payload.chart?.error) {
    throw new ListSourceError(`${ticker} 배당이력 오류: ${payload.chart.error.description ?? 'unknown'}`);
  }
  const result = payload.chart?.result?.[0];
  if (!result) throw new ListSourceError(`${ticker} 배당이력 응답이 비어 있다`);

  return {
    ticker,
    price: toFiniteNumber(result.meta?.regularMarketPrice),
    currency: toNonEmptyString(result.meta?.currency),
    longName: toNonEmptyString(result.meta?.longName) ?? toNonEmptyString(result.meta?.shortName),
    events: toDividendEvents(result.events?.dividends)
  };
};

export const fetchAnnualDividends = async (
  ticker: string,
  fetchImpl: typeof fetch = fetch
): Promise<AnnualDividend[]> => toAnnualDividends((await fetchYahooDividendChart(ticker, fetchImpl)).events);
