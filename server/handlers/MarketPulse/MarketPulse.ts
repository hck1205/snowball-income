import {
  type MarketPulseSnapshot,
  type PulseIndicator,
  type PulseSeriesPoint,
  fearGreedZone,
  latestOf,
  movingAverage,
  parseCboeCsv,
  parseFredCsv,
  percentileZone,
  tailOf,
  termStructureZone,
  vixZone,
  yieldCurveZone
} from '../../../shared/lib/marketPulse';
import { PULSE_SOURCE } from '../../../shared/lib/marketPulse';

/**
 * 시장 상황 계기판 데이터 — 세 기관의 원자료를 모아 한 응답으로 만든다.
 *
 * ## 왜 서버가 받아 오나 (브라우저에서 직접 못 부른다)
 *  · FRED·Cboe·CNN 어느 쪽도 CORS 를 열어 주지 않는다.
 *  · CNN 은 브라우저 헤더(Referer·Origin)를 요구한다 — 브라우저는 그 헤더를 스스로 못 위조한다.
 *  · 상류가 **연속 호출을 막는다**(실측: FRED 에 6건을 연달아 부르니 그다음부터 봇 차단 페이지).
 *    방문자마다 부르면 하루도 못 간다.
 *
 * ## 캐시 (Fx·MarketIndices 와 같은 규율)
 *  · **성공 `s-maxage=21600`(6시간)**: 여기 값들은 전부 **일 단위**로 갱신된다(장중에 안 움직인다).
 *    15분마다 받을 이유가 없고, 짧게 잡을수록 상류 차단에 가까워진다.
 *  · **부분 성공 `s-maxage=1800`(30분)**: 한 소스가 빠진 응답이 6시간 박제되면 안 된다.
 *  · `stale-while-revalidate=86400`: 상류가 흔들려도 하루는 마지막 성공본을 즉시 낸다.
 *
 * ## 🔴 못 받은 값을 만들어 내지 않는다
 * 소스 하나가 죽어도 나머지는 낸다. 죽은 것은 `observation: null` + `unavailableReason` 으로
 * 내보내고 화면이 "받지 못했다"를 말한다. 마지막 값을 그대로 오늘 값처럼 보여주거나 0 으로
 * 채우면, 오류가 아니라 **틀린 것이 그럴듯하게** 보인다.
 */

const CACHE_SUCCESS = 'public, max-age=0, s-maxage=21600, stale-while-revalidate=86400';
const CACHE_PARTIAL = 'public, max-age=0, s-maxage=1800, stale-while-revalidate=86400';

/** 그래프에 보내는 점 수. 1년 남짓이면 형태가 읽히고 응답도 가볍다. */
const SERIES_POINTS = 260;
/** 백분위 비교에 쓰는 과거 구간 — 약 10년(거래일 기준). */
const HISTORY_POINTS = 2600;

const FRED_CSV = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=';
const CBOE_CSV = 'https://cdn.cboe.com/api/global/us_indices/daily_prices/';
const CNN_FNG = 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata';

/**
 * CNN 은 **브라우저에서 온 요청만** 받는다. Referer·Origin 이 없으면 418 을 준다(실측).
 *
 * ⚠ 이건 공개 API 가 아니라 CNN 차트가 쓰는 내부 엔드포인트다. 예고 없이 바뀔 수 있고, 바뀌면
 *   이 지표만 조용히 빠진다 — 그래서 실패를 삼키지 않고 사유를 화면까지 올린다.
 */
const CNN_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  Referer: 'https://edition.cnn.com/',
  Origin: 'https://edition.cnn.com'
};

/** 상류 하나가 죽어도 전체가 죽지 않게 — 실패를 값이 아니라 사유로 바꾼다. */
type Fetched<T> = { ok: true; value: T } | { ok: false; reason: string };

const TIMEOUT_MS = 8000;

async function getText(url: string, headers?: Record<string, string>): Promise<Fetched<string>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    if (!response.ok) return { ok: false, reason: `상류 응답 ${response.status}` };
    return { ok: true, value: await response.text() };
  } catch (error) {
    const name = error instanceof Error ? error.name : '';
    return { ok: false, reason: name === 'AbortError' ? '상류 응답 지연' : '상류에 닿지 못함' };
  } finally {
    clearTimeout(timer);
  }
}

const fredSeries = async (id: string): Promise<Fetched<PulseSeriesPoint[]>> => {
  const text = await getText(`${FRED_CSV}${id}`);
  if (!text.ok) return text;
  const points = parseFredCsv(text.value);
  /* 봇 차단 페이지는 HTML 이라 파싱하면 0건이 된다 — 성공으로 넘기면 빈 그래프가 그려진다. */
  if (points.length === 0) return { ok: false, reason: '원자료를 읽지 못함' };
  return { ok: true, value: points };
};

const cboeSeries = async (file: string): Promise<Fetched<PulseSeriesPoint[]>> => {
  const text = await getText(`${CBOE_CSV}${file}.csv`);
  if (!text.ok) return text;
  const points = parseCboeCsv(text.value);
  if (points.length === 0) return { ok: false, reason: '원자료를 읽지 못함' };
  return { ok: true, value: points };
};

/** 값을 못 받은 지표도 **자리는 지킨다** — 카드가 사라지면 사용자는 그 지표의 존재를 모른다. */
const missing = (base: Omit<PulseIndicator, 'observation' | 'zone' | 'series'>, reason: string): PulseIndicator => ({
  ...base,
  observation: null,
  zone: 'unknown',
  series: [],
  unavailableReason: reason
});

export async function buildMarketPulse(): Promise<{ snapshot: MarketPulseSnapshot; complete: boolean }> {
  /*
   * 🔴 **동시에 받는다.** 순차로 부르면 8개 × 최대 8초라 함수 타임아웃에 닿는다.
   * ⚠ 그런데 FRED 는 연속 호출을 싫어한다(실측). 동시 6건은 통과했지만, 늘릴 때는 반드시
   *   다시 재 보고 늘려라 — 차단되면 파싱이 0건이 되어 위 `reason` 으로 떨어진다.
   */
  const [vix, vix3m, vix9d, hyOas, curve10y2y, curve10y3m, dgs10, sp500, fng] = await Promise.all([
    cboeSeries('VIX_History'),
    cboeSeries('VIX3M_History'),
    cboeSeries('VIX9D_History'),
    fredSeries('BAMLH0A0HYM2'),
    fredSeries('T10Y2Y'),
    fredSeries('T10Y3M'),
    fredSeries('DGS10'),
    fredSeries('SP500'),
    getText(CNN_FNG, CNN_HEADERS)
  ]);

  const indicators: PulseIndicator[] = [];

  // ── 변동성 ────────────────────────────────────────────────────────────────
  const vixBase = {
    id: 'vix',
    axis: 'volatility' as const,
    label: 'VIX',
    meaning: '옵션시장이 앞으로 30일 동안 예상하는 S&P 500 의 변동 폭',
    cadence: 'daily' as const,
    direction: 'higher-is-tense' as const,
    unit: '',
    precision: 2,
    source: PULSE_SOURCE.cboe
  };
  if (vix.ok) {
    const last = latestOf(vix.value);
    indicators.push({
      ...vixBase,
      observation: last ? { value: last.value, asOf: last.date } : null,
      zone: last ? vixZone(last.value) : 'unknown',
      series: tailOf(vix.value, SERIES_POINTS)
    });
  } else {
    indicators.push(missing(vixBase, vix.reason));
  }

  const termBase = {
    id: 'vix-term',
    axis: 'volatility' as const,
    label: 'VIX 기간구조',
    meaning: '30일 VIX ÷ 3개월 VIX. 1을 넘으면 단기 불안이 장기보다 커진 상태',
    cadence: 'daily' as const,
    direction: 'higher-is-tense' as const,
    unit: '배',
    /* 🔴 소수점 두 자리까지만 — 세 자리는 읽는 사람에게 아무 정보를 더 주지 않는다(사용자 결정). */
    precision: 2,
    source: PULSE_SOURCE.cboe
  };
  if (vix.ok && vix3m.ok) {
    /*
     * 🔴 두 시계열을 **날짜로 맞춘다.** 각자의 마지막 값을 나누면, 한쪽이 하루 늦게 올라온 날
     *    서로 다른 날짜의 값을 나눈 비율이 나온다 — 그래프가 하루짜리 가짜 급등을 그린다.
     */
    const threeMonth = new Map(vix3m.value.map((point) => [point.date, point.value]));
    const ratios: PulseSeriesPoint[] = [];
    for (const point of vix.value) {
      const long = threeMonth.get(point.date);
      if (long !== undefined && long > 0) ratios.push({ date: point.date, value: point.value / long });
    }
    const last = latestOf(ratios);
    indicators.push({
      ...termBase,
      observation: last ? { value: last.value, asOf: last.date } : null,
      zone: last ? termStructureZone(last.value) : 'unknown',
      series: tailOf(ratios, SERIES_POINTS)
    });
  } else {
    indicators.push(missing(termBase, (vix.ok ? vix3m : vix).ok ? '원자료를 읽지 못함' : '상류에 닿지 못함'));
  }

  // ── 신용 ──────────────────────────────────────────────────────────────────
  const hyBase = {
    id: 'hy-spread',
    axis: 'credit' as const,
    label: '하이일드 스프레드',
    meaning: '투기등급 회사채가 국채보다 더 요구하는 금리. 신용시장이 보는 위험의 크기',
    cadence: 'daily' as const,
    direction: 'higher-is-tense' as const,
    unit: '%p',
    precision: 2,
    source: PULSE_SOURCE.fred
  };
  if (hyOas.ok) {
    const last = latestOf(hyOas.value);
    indicators.push({
      ...hyBase,
      observation: last ? { value: last.value, asOf: last.date } : null,
      /* 고정 경계가 관습으로 확립돼 있지 않아 **자기 10년 분포**로 판정한다. */
      zone: last ? percentileZone(tailOf(hyOas.value, HISTORY_POINTS), last.value, 'higher-is-tense') : 'unknown',
      series: tailOf(hyOas.value, SERIES_POINTS)
    });
  } else {
    indicators.push(missing(hyBase, hyOas.reason));
  }

  // ── 거시 ──────────────────────────────────────────────────────────────────
  const curves: [string, string, Fetched<PulseSeriesPoint[]>][] = [
    ['curve-10y2y', '장단기 금리차 (10년-2년)', curve10y2y],
    ['curve-10y3m', '장단기 금리차 (10년-3개월)', curve10y3m]
  ];
  for (const [id, label, fetched] of curves) {
    const base = {
      id,
      axis: 'macro' as const,
      label,
      meaning: '음수면 역전 — 장기 금리가 단기보다 낮은 상태',
      cadence: 'daily' as const,
      direction: 'lower-is-tense' as const,
      unit: '%p',
      precision: 2,
      source: PULSE_SOURCE.fred
    };
    if (!fetched.ok) {
      indicators.push(missing(base, fetched.reason));
      continue;
    }
    const last = latestOf(fetched.value);
    indicators.push({
      ...base,
      observation: last ? { value: last.value, asOf: last.date } : null,
      zone: last ? yieldCurveZone(last.value) : 'unknown',
      series: tailOf(fetched.value, SERIES_POINTS)
    });
  }

  const tenBase = {
    id: 'dgs10',
    axis: 'macro' as const,
    label: '미국 10년물 금리',
    meaning: '주식의 기회비용이자 할인율의 기준이 되는 금리',
    cadence: 'daily' as const,
    direction: 'higher-is-tense' as const,
    unit: '%',
    precision: 2,
    source: PULSE_SOURCE.fred
  };
  if (dgs10.ok) {
    const last = latestOf(dgs10.value);
    indicators.push({
      ...tenBase,
      observation: last ? { value: last.value, asOf: last.date } : null,
      /*
       * 🔴 백분위로 긴장도를 매기지 않는다. 첫 실행에서 10년물이 10년 분포 상단이라 `stressed`
       *    로 찍혔는데, **금리가 높은 것은 시장 긴장이 아니다**(할인율이 높아진 것이다).
       *    판정할 근거가 없으면 판정하지 않는다 — 근거는 PulseZone 의 `context` 주석.
       */
      zone: last ? 'context' : 'unknown',
      series: tailOf(dgs10.value, SERIES_POINTS)
    });
  } else {
    indicators.push(missing(tenBase, dgs10.reason));
  }

  // ── 심리 ──────────────────────────────────────────────────────────────────
  const fngBase = {
    id: 'fear-greed',
    axis: 'sentiment' as const,
    label: '공포탐욕지수',
    meaning: '7가지 시장 지표를 묶은 참여자 심리. 0이 극단적 공포, 100이 극단적 탐욕',
    cadence: 'daily' as const,
    direction: 'extremes-are-tense' as const,
    unit: '',
    precision: 0,
    source: PULSE_SOURCE.cnn
  };
  if (fng.ok) {
    const parsed = parseFearGreed(fng.value);
    if (parsed) {
      indicators.push({
        ...fngBase,
        observation: { value: parsed.score, asOf: parsed.asOf },
        zone: fearGreedZone(parsed.score),
        comparisons: parsed.comparisons,
        series: tailOf(parsed.series, SERIES_POINTS)
      });
    } else {
      /* 응답은 왔는데 모양이 달라졌다 — 비공식 엔드포인트라 **언젠가 반드시 온다**. */
      indicators.push(missing(fngBase, '응답 형식이 바뀜'));
    }
  } else {
    indicators.push(missing(fngBase, fng.reason));
  }

  // ── 참고: 지수 수준 ────────────────────────────────────────────────────────
  const spBase = {
    id: 'sp500',
    axis: 'valuation' as const,
    label: 'S&P 500',
    meaning: '지수 수준. 다른 지표를 읽을 때의 배경',
    cadence: 'daily' as const,
    direction: 'higher-is-tense' as const,
    unit: '',
    precision: 0,
    source: PULSE_SOURCE.fred
  };
  if (sp500.ok) {
    const last = latestOf(sp500.value);
    const ma200 = movingAverage(sp500.value, 200);
    indicators.push({
      ...spBase,
      observation: last ? { value: last.value, asOf: last.date } : null,
      /* 지수 수준 자체에는 긴장도가 없다 — 200일선 위/아래는 사실로만 덧붙인다. */
      zone: last ? 'context' : 'unknown',
      note:
        last && ma200 !== null
          ? `200일 이동평균(${Math.round(ma200).toLocaleString('ko-KR')}) ${last.value >= ma200 ? '위' : '아래'}`
          : undefined,
      series: tailOf(sp500.value, SERIES_POINTS)
    });
  } else {
    indicators.push(missing(spBase, sp500.reason));
  }

  /* 9일물은 지금 카드로 쓰지 않지만, 기간구조 곡선을 그릴 때 쓰려고 받아 둔다. */
  void vix9d;

  const complete = indicators.every((indicator) => indicator.observation !== null);
  return { snapshot: { fetchedAt: new Date().toISOString(), indicators }, complete };
}

/**
 * CNN 페이로드에서 점수와 시계열을 꺼낸다.
 *
 * ⚠ 비공식 엔드포인트라 **모양을 믿지 않는다.** 필드가 하나라도 어긋나면 `null` 을 돌려주고
 *   화면이 "형식이 바뀜"이라고 말한다 — 조용히 0점을 그리는 것보다 낫다.
 */
function parseFearGreed(
  raw: string
): { score: number; asOf: string; series: PulseSeriesPoint[]; comparisons: { label: string; value: number }[] } | null {
  try {
    const json = JSON.parse(raw) as {
      fear_and_greed?: {
        score?: unknown;
        timestamp?: unknown;
        previous_close?: unknown;
        previous_1_week?: unknown;
        previous_1_month?: unknown;
        previous_1_year?: unknown;
      };
      fear_and_greed_historical?: { data?: { x?: unknown; y?: unknown }[] };
    };

    const score = Number(json.fear_and_greed?.score);
    const stamp = json.fear_and_greed?.timestamp;
    if (!Number.isFinite(score) || typeof stamp !== 'string') return null;

    const series: PulseSeriesPoint[] = [];
    for (const point of json.fear_and_greed_historical?.data ?? []) {
      const time = Number(point.x);
      const value = Number(point.y);
      if (!Number.isFinite(time) || !Number.isFinite(value)) continue;
      series.push({ date: new Date(time).toISOString().slice(0, 10), value });
    }

    /*
     * CNN 화면이 다이얼 아래에 보여주는 그 값들이다. 🔴 **우리가 시계열에서 뽑지 않는다** —
     * 구성 요소가 매일 재계산돼서 같은 이름의 두 숫자가 갈릴 수 있다.
     */
    const head = json.fear_and_greed ?? {};
    const comparisons = (
      [
        ['전일', head.previous_close],
        ['1주 전', head.previous_1_week],
        ['1개월 전', head.previous_1_month],
        ['1년 전', head.previous_1_year]
      ] as const
    ).flatMap(([label, raw2]) => {
      const value = Number(raw2);
      return Number.isFinite(value) ? [{ label, value }] : [];
    });

    return { score, asOf: stamp.slice(0, 10), series, comparisons };
  } catch {
    return null;
  }
}

/**
 * 웹 표준 핸들러.
 *
 * 🔴 **자기 이름의 서버리스 함수를 갖지 않는다.** Vercel Hobby 는 배포 함수 12개가 상한인데
 *    이 레포는 이미 12개를 쓰고 있다(`test/api/functionBudget` 이 그 상한을 잠근다).
 *    그래서 `MarketIndices` 가 `?surface=pulse` 로 이리 위임한다 — 매니페스트 머리말이
 *    "JSON 응답이 하나 더 필요하면 프록시들을 묶어라"고 예고한 바로 그 수순이다.
 * ⚠ 두 화면이 한 함수를 공유하지만 **캐시 수명은 서로 다르다**(지수 15분 / 여기 6시간).
 *   응답마다 헤더를 따로 붙이므로 섞이지 않는다.
 */
export async function handler(_request: Request): Promise<Response> {
  const { snapshot, complete } = await buildMarketPulse();

  return new Response(JSON.stringify(snapshot), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': complete ? CACHE_SUCCESS : CACHE_PARTIAL
    }
  });
}

export default handler;
