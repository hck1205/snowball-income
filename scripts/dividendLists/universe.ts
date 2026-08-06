import { normalizeSectorLabel } from '@/shared/constants/dividendLists';
import { DIVIDEND_UNIVERSE_STREAK_FLOOR, MAX_PLAUSIBLE_YIELD_PERCENT } from '@/shared/constants/dividendLists';
import type {
  DividendListSectorId,
  DividendUniverseEntry,
  DividendUniverseIssue,
  DividendUniverseIssueKind,
  DividendUniverseMetrics,
  DividendUniverseSnapshot,
  DividendUniverseSourceEtf
} from '@/shared/constants/dividendLists';

import {
  computeTickerMetrics,
  fetchYahooDividendChart,
  isBlockingMetricsProblem,
  ListSourceError,
  sleep
} from './sources';
import type {
  MetricsProblemKind,
  ProSharesDividendFund,
  ProSharesHolding,
  SdyHolding,
  TickerMetricsResult,
  WikipediaSectorDictionary
} from './sources';

/**
 * 후보 유니버스의 **순수 조립부와 교차검증 가드**. IO(파일 쓰기·콘솔)는 `universeCli.ts` 가 한다.
 *
 * ## 🔴 이 모듈의 존재 이유는 조립이 아니라 **검산**이다
 * 수집기는 매 실행마다 자기가 만든 숫자를 스스로 반증해야 한다. 실제로 그 검산이 없던 동안
 * "작년+올해 배당 누적" 방식의 배당률 버그가 **평균 1.47pp 과대**(최대 +3.44pp)로 조용히 살아 있었다.
 * 화면은 아무 에러도 내지 않았다 — 숫자가 그럴듯했기 때문이다. 그래서 여기서 네 가지를 본다.
 *
 * | 가드 | 무엇을 반증하나 | 막는가 |
 * |---|---|---|
 * | 하한 모순 | "25년 연속 증배 ETF 에 든 종목이 최근 삭감했다" — 둘 중 하나는 거짓이다 | ✅ |
 * | 배당률 범위 | 0% 이하·20% 초과는 실제 배당률이 아니라 계산 사고다 | ✅ |
 * | 특별배당 이상치 | 최신 지급액에 특별배당이 섞이면 선행 배당률이 10배로 튄다(RLI 14.2%) | ✅ |
 * | 성장률 결측 | 완결 6개 연도가 없으면 성장률은 **없는 것**이지 0%가 아니다 | ❌(기록만) |
 *
 * ✅ 인 가드에 걸린 종목은 `metrics` 를 **비운다**. 후보에서 빼지는 않는다 — "이 ETF 가 들고 있다"는
 * 편입 사실은 여전히 참이고, 못 믿을 것은 우리가 계산한 숫자뿐이기 때문이다.
 */

/** SDY 를 포함한, 후보를 공급하는 ETF → 그 ETF 가 보장하는 연속 증배 연수 하한. */
const ETF_OF_PROSHARES_FUND: Record<ProSharesDividendFund, DividendUniverseSourceEtf> = {
  NOBL: 'NOBL',
  REGL: 'REGL',
  SMDV: 'SMDV'
};

export type UniverseSources = {
  proShares: { byFund: Record<ProSharesDividendFund, ProSharesHolding[]>; fileAsOf: string | null };
  sdy: { holdings: readonly SdyHolding[]; fileAsOf: string | null };
  sectors: WikipediaSectorDictionary;
};

/** 지표를 붙이기 전의 후보 한 줄. 여기까지는 네트워크가 필요 없다. */
export type UniverseCandidate = {
  ticker: string;
  name: string;
  /** 이름이 어디서 왔는지. 위키피디아 표기가 가장 사람이 읽기 좋아 그 경우만 야후 이름으로 덮지 않는다. */
  nameSource: 'wikipedia' | 'sdy' | 'proShares';
  sector: DividendListSectorId | null;
  sourceSectorLabel: string | null;
  sourceEtfs: DividendUniverseSourceEtf[];
  minimumStreakYears: number;
};

const ETF_ORDER: DividendUniverseSourceEtf[] = ['NOBL', 'SDY', 'REGL', 'SMDV'];

/**
 * 섹터 문자열을 정규화한다. 🔴 **모르는 문자열은 조용히 버리지 않고 실패로 올린다** — 소스가 분류를
 * 늘렸는데 우리가 모른 채 전부 null 로 뭉개면 대응표가 낡은 것을 아무도 모른다
 * (`dividendLists.sectors.ts` 가 이미 갖고 있는 규율을 그대로 따른다).
 *
 * ⚠ "모르는 문자열"과 "안 적혀 있음"은 다르다. 후자(빈 값·`-`)는 소스 단계에서 이미 `null` 로 오고,
 * 그건 에러가 아니라 `sectorMissing` 기록 대상이다.
 */
const requireSector = (label: string, ticker: string, source: string): DividendListSectorId => {
  const sector = normalizeSectorLabel(label);
  if (!sector) {
    throw new ListSourceError(`모르는 섹터 문자열: "${label}" (${ticker}, ${source}). 대응표를 갱신하라.`);
  }
  return sector;
};

/**
 * 네 소스를 합쳐 후보를 만든다.
 *
 * ## 섹터가 충돌하면 **위키피디아가 이긴다** — 근거
 * ① 위키피디아 표는 열 이름부터 `GICS Sector` 라 우리 11종 분류와 **같은 체계**다. SDY 파일의
 *    `Sector` 는 체계를 밝히지 않는다. ② 커버리지가 압도적이다(위키 1,506종 vs SDY 155종).
 * ③ 결정적으로, 2026-08-04 실측에서 **SDY 의 `Sector` 열은 158행 전부 `-`** 였다 — 오늘 기준 이 소스가
 *    공급하는 섹터는 0종이다. 그래도 SDY 를 폴백으로 남긴 이유는 그 열이 채워진 날 자동으로 쓰기 위해서다.
 */
export const buildUniverseCandidates = (sources: UniverseSources): UniverseCandidate[] => {
  const byTicker = new Map<string, UniverseCandidate>();

  const upsert = (
    ticker: string,
    etf: DividendUniverseSourceEtf,
    fallbackName: string,
    fallbackNameSource: 'sdy' | 'proShares',
    sdySectorLabel: string | null
  ): void => {
    const wikipedia = sources.sectors.byTicker.get(ticker);
    const existing = byTicker.get(ticker);
    if (existing) {
      if (!existing.sourceEtfs.includes(etf)) existing.sourceEtfs.push(etf);
      existing.minimumStreakYears = Math.max(existing.minimumStreakYears, DIVIDEND_UNIVERSE_STREAK_FLOOR[etf]);
      // 위키피디아에 없어 섹터가 비어 있던 종목은 SDY 가 적어 줬다면 그때 채운다.
      if (existing.sector === null && sdySectorLabel) {
        existing.sector = requireSector(sdySectorLabel, ticker, 'SDY');
        existing.sourceSectorLabel = sdySectorLabel;
      }
      return;
    }

    const sectorLabel = wikipedia?.sectorLabel ?? sdySectorLabel;
    byTicker.set(ticker, {
      ticker,
      name: wikipedia?.name ?? fallbackName,
      nameSource: wikipedia ? 'wikipedia' : fallbackNameSource,
      sector: sectorLabel
        ? requireSector(sectorLabel, ticker, wikipedia ? 'Wikipedia' : 'SDY')
        : null,
      sourceSectorLabel: sectorLabel ?? null,
      sourceEtfs: [etf],
      minimumStreakYears: DIVIDEND_UNIVERSE_STREAK_FLOOR[etf]
    });
  };

  for (const [fund, holdings] of Object.entries(sources.proShares.byFund) as Array<
    [ProSharesDividendFund, ProSharesHolding[]]
  >) {
    for (const holding of holdings) {
      upsert(holding.ticker, ETF_OF_PROSHARES_FUND[fund], holding.description, 'proShares', null);
    }
  }
  for (const holding of sources.sdy.holdings) {
    upsert(holding.ticker, 'SDY', holding.name, 'sdy', holding.sectorLabel);
  }

  const candidates = [...byTicker.values()];
  for (const candidate of candidates) {
    candidate.sourceEtfs.sort((left, right) => ETF_ORDER.indexOf(left) - ETF_ORDER.indexOf(right));
  }
  return candidates.sort((left, right) => left.ticker.localeCompare(right.ticker));
};

/* ────────────────────────────── 교차검증 가드 ────────────────────────────── */

/** 지표 계산 단계의 실패 → 스냅샷 신고 종류. 계산이 안 된 이유를 뭉개지 않는다. */
const ISSUE_OF_METRICS_PROBLEM: Record<MetricsProblemKind, DividendUniverseIssueKind> = {
  noPrice: 'metricsUnavailable',
  noDividends: 'metricsUnavailable',
  noFrequency: 'metricsUnavailable',
  abnormalLatestPayment: 'abnormalLatestPayment',
  staleDividend: 'staleDividend',
  growthUnavailable: 'growthUnavailable'
};

export type MetricsOutcome =
  | { ok: true; result: TickerMetricsResult }
  | { ok: false; error: string };

export type CandidateAudit = { entry: DividendUniverseEntry; issues: DividendUniverseIssue[] };

/**
 * 후보 하나를 검산해 최종 엔트리와 신고 줄을 만든다. **여기가 수집기의 자기 반증 지점이다.**
 * 네트워크를 타지 않으므로 고정 입력으로 그대로 테스트할 수 있다.
 */
export const auditCandidate = (
  candidate: UniverseCandidate,
  outcome: MetricsOutcome,
  measuredAt: string,
  yahooName: string | null = null
): CandidateAudit => {
  const issues: DividendUniverseIssue[] = [];
  const report = (kind: DividendUniverseIssueKind, detail: string, blocking: boolean): void => {
    issues.push({ ticker: candidate.ticker, kind, detail, blocking });
  };

  if (candidate.sector === null) {
    report('sectorMissing', '위키피디아·SDY 어느 쪽에도 섹터가 없다 — 사람이 채워야 한다', false);
  }

  let metrics: DividendUniverseMetrics | null = null;
  if (!outcome.ok) {
    report('fetchFailed', outcome.error, true);
  } else {
    for (const problem of outcome.result.problems) {
      report(
        ISSUE_OF_METRICS_PROBLEM[problem.kind],
        problem.detail,
        isBlockingMetricsProblem(problem.kind)
      );
    }
    const computed = outcome.result.metrics;
    if (computed) {
      /* 가드 ① 배당률 범위 — 0% 이하·20% 초과는 실제 배당률이 아니라 계산 사고다. */
      if (computed.forwardYieldPercent <= 0 || computed.forwardYieldPercent > MAX_PLAUSIBLE_YIELD_PERCENT) {
        report(
          'implausibleYield',
          `선행 배당률 ${computed.forwardYieldPercent.toFixed(2)}% 가 비상식 범위다 ` +
            `(최신 지급 ${computed.latestDividend} × 연 ${computed.paymentsPerYear}회 ÷ ${computed.price})`,
          true
        );
      }
      /* 가드 ② 하한 모순 — 편입 사실과 배당이력이 서로를 부정한다. */
      if (computed.recentCut) {
        const { fromYear, toYear, fromRate, toRate } = computed.recentCut;
        report(
          'streakContradiction',
          `${candidate.sourceEtfs.join('+')} 편입(연속 증배 하한 ${candidate.minimumStreakYears}년)인데 ` +
            `1회 지급액이 줄었다(${fromYear}년 ${fromRate.toFixed(4)} → ${toYear}년 ${toRate.toFixed(4)}). ` +
            '편입 사실과 배당이력 중 하나가 틀렸다.',
          true
        );
      }
      if (!issues.some((issue) => issue.blocking)) {
        metrics = { ...computed, measuredAt };
      }
    }
  }

  return {
    entry: {
      ticker: candidate.ticker,
      // 위키피디아 표기가 아니면 야후 회사명이 더 읽기 좋다(SDY 는 `VERIZON COMMUNICATIONS INC` 처럼 전부 대문자다).
      name: candidate.nameSource === 'wikipedia' ? candidate.name : (yahooName ?? candidate.name),
      sector: candidate.sector,
      sourceSectorLabel: candidate.sourceSectorLabel,
      sourceEtfs: candidate.sourceEtfs,
      minimumStreakYears: candidate.minimumStreakYears,
      metrics
    },
    issues
  };
};

export const buildUniverseSnapshot = (
  audits: readonly CandidateAudit[],
  context: {
    asOf: string;
    sourceAsOf: { proShares: string | null; sdy: string | null };
    memberCountByEtf: Record<DividendUniverseSourceEtf, number>;
  }
): DividendUniverseSnapshot => {
  const entries = audits.map((audit) => audit.entry);
  return {
    asOf: context.asOf,
    sourceAsOf: context.sourceAsOf,
    memberCountByEtf: context.memberCountByEtf,
    entries,
    issues: audits.flatMap((audit) => audit.issues),
    coverage: {
      total: entries.length,
      withMetrics: entries.filter((entry) => entry.metrics !== null).length,
      withSector: entries.filter((entry) => entry.sector !== null).length,
      withGrowth: entries.filter((entry) => entry.metrics?.fiveYearGrowthPercent != null).length
    }
  };
};

/* ────────────────────────────── 수집 루프 ────────────────────────────── */

export type CollectMetricsOptions = {
  /** 요청 사이 간격(ms). 비공식 공개 API 를 연달아 두드리지 않는다. */
  delayMs: number;
  currentYear: number;
  nowEpochSeconds: number;
  measuredAt: string;
  onProgress?: (message: string) => void;
};

/**
 * 후보마다 야후 chart 를 **한 번** 부르고 그 자리에서 검산한다.
 * 실패는 던지지 않고 `fetchFailed` 로 접는다 — 한 종목의 장애로 260종을 잃지 않기 위해서다.
 */
export const collectUniverseMetrics = async (
  candidates: readonly UniverseCandidate[],
  options: CollectMetricsOptions,
  fetchImpl: typeof fetch = fetch
): Promise<CandidateAudit[]> => {
  const audits: CandidateAudit[] = [];
  for (const [index, candidate] of candidates.entries()) {
    if (index > 0) await sleep(options.delayMs);
    options.onProgress?.(`[${index + 1}/${candidates.length}] ${candidate.ticker}`);
    try {
      const chart = await fetchYahooDividendChart(candidate.ticker, fetchImpl);
      const result = computeTickerMetrics(chart, {
        currentYear: options.currentYear,
        nowEpochSeconds: options.nowEpochSeconds
      });
      audits.push(auditCandidate(candidate, { ok: true, result }, options.measuredAt, chart.longName));
    } catch (error) {
      audits.push(auditCandidate(candidate, { ok: false, error: String(error) }, options.measuredAt));
    }
  }
  return audits;
};
