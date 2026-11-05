/**
 * 배당 목록 지표 파일(`dividendLists.metrics.generated.json`) 조립 — 순수 함수(네트워크·파일 없음).
 *
 * ## 🔴 왜 생겼나 (2026-11-05)
 * 킹·귀족·챔피언 화면의 선행 배당률·5년 성장률은 이 파일에서 온다. 그런데 **이 파일을 쓰는 코드가
 * 없었다** — 2026-08-04 에 한 번 만들어 커밋한 뒤 저장소 어디에서도 다시 생성하지 않았다.
 * `refresh-dividend-lists.yml` 은 이 파일을 `git add` 했지만 아무도 바꾸지 않으니 그 줄은 매번
 * 아무 일도 하지 않았고, 화면은 석 달째 8월 가격의 배당률을 보여 주고 있었다
 * (실측: ABBV 화면 2.82% / 11월 2.40%).
 *
 * ## 🔴 왜 유니버스에서 옮겨 적지 않고 직접 재나
 * ① 유니버스(`dividendLists.universe.generated.json`)는 구성 변화가 있으면 **사람 확인 전까지
 *   머지되지 않는다** — 실제로 9·10·11월 PR 이 석 달 쌓였다. 거기에 기대면 지표가 다시 같이 멈춘다.
 * ② 유니버스는 ETF 넷(NOBL·SDY·SMDV·REGL)의 보유 종목이다. 목록 종목 중 21종(MO·RTX·SYK…)은
 *   그 어디에도 없다.
 * 그래서 목록 종목을 **매달 직접** 잰다. 재는 방법과 검산(배당률 범위·삭감 모순·이상 지급)은
 * 유니버스 수집기의 `collectUniverseMetrics`·`auditCandidate` 를 그대로 쓴다 — 기준이 두 벌이 되면
 * 같은 종목의 배당률이 화면마다 달라진다.
 */
import type { DividendUniverseMetrics } from '@/shared/constants/dividendLists';
import type { CandidateAudit } from './universe';

/** 화면이 읽는 두 필드. `null` = 재 봤지만 이 종목은 계산할 수 없다(화면이 그 문장을 따로 쓴다). */
export type DividendMetricsEntry = {
  forwardYieldPercent: number | null;
  fiveYearGrowthPercent: number | null;
};

export type DividendMetricsFile = {
  asOf: string;
  note: string;
  metrics: Record<string, DividendMetricsEntry>;
};

export const DIVIDEND_METRICS_NOTE =
  '수집기(npm run dividend:metrics)가 킹·귀족·챔피언 종목을 야후로 직접 재서 만든다. 손으로 고치지 마라. 재는 방법은 scripts/dividendLists/metrics.ts 머리말.';

/**
 * 조회 실패 허용 비율. 넘으면 파일을 **쓰지 않는다** — 야후가 통째로 막힌 날 목록 절반의 배당률이
 * 지난달 값과 섞여 나가는 것보다, 한 달 더 지난 값이 한 벌로 남는 편이 낫다(유니버스와 같은 10%).
 */
export const MAX_FETCH_FAILURE_RATIO = 0.1;

/** 저장 자릿수. 화면은 소수 둘째 자리까지 쓰고, 파일 diff 가 부동소수 잡음으로 뒤덮이지 않게 한다. */
const round4 = (value: number | null): number | null => (value === null ? null : Math.round(value * 10_000) / 10_000);

const toEntry = (metrics: DividendUniverseMetrics | null): DividendMetricsEntry =>
  metrics
    ? { forwardYieldPercent: round4(metrics.forwardYieldPercent), fiveYearGrowthPercent: round4(metrics.fiveYearGrowthPercent) }
    : { forwardYieldPercent: null, fiveYearGrowthPercent: null };

export type AssembleResult =
  | {
      ok: true;
      file: DividendMetricsFile;
      /** 조회에 실패해 지난 값을 남긴 종목. */
      kept: string[];
      /** 검산에 걸려 `null` 로 쓴 종목(이유는 audit 의 issues). */
      blocked: string[];
    }
  | { ok: false; reason: string; failed: string[] };

/**
 * 측정 결과를 파일로 조립한다.
 *
 * - 정상 측정 → 그 값.
 * - **막는 검산**(특별배당·삭감 모순 등)에 걸림 → 두 필드 `null`. 틀릴 수 있는 숫자를 내보내지 않는다.
 * - **조회 실패**(네트워크) → 지난 값을 그대로 둔다. 일시 오류 한 번에 종목 하나가 화면에서 빠졌다
 *   돌아오는 깜빡임을 막는다. 지난 값도 없으면 항목을 만들지 않는다(= 아직 실측 없음).
 * - 실패가 `MAX_FETCH_FAILURE_RATIO` 를 넘으면 조립 자체를 거부한다.
 *
 * 🔴 목록에서 빠진 종목의 지난 값은 **버린다** — 파일은 "지금 목록에 있는 종목"의 지표다.
 */
export const assembleDividendMetrics = (
  audits: readonly CandidateAudit[],
  previous: Readonly<Record<string, DividendMetricsEntry>>,
  asOf: string
): AssembleResult => {
  const failed = audits
    .filter((audit) => audit.issues.some((issue) => issue.kind === 'fetchFailed'))
    .map((audit) => audit.entry.ticker);

  if (audits.length === 0 || failed.length / audits.length > MAX_FETCH_FAILURE_RATIO) {
    return {
      ok: false,
      reason: `조회 실패 ${failed.length}/${audits.length}종 — 허용 ${MAX_FETCH_FAILURE_RATIO * 100}% 를 넘었다`,
      failed
    };
  }

  const metrics: Record<string, DividendMetricsEntry> = {};
  const kept: string[] = [];
  const blocked: string[] = [];

  for (const audit of [...audits].sort((left, right) => left.entry.ticker.localeCompare(right.entry.ticker))) {
    const { ticker } = audit.entry;
    if (failed.includes(ticker)) {
      if (previous[ticker]) {
        metrics[ticker] = previous[ticker];
        kept.push(ticker);
      }
      continue;
    }
    if (audit.entry.metrics === null) blocked.push(ticker);
    metrics[ticker] = toEntry(audit.entry.metrics);
  }

  return { ok: true, file: { asOf, note: DIVIDEND_METRICS_NOTE, metrics }, kept, blocked };
};

/**
 * 잴 종목 — 목록 여럿에 실린 종목은 **가장 엄한 하한**(연속 증배 연수)으로 한 번만 잰다.
 * 하한은 검산 ②(삭감 모순)에만 쓰이고, 엄한 쪽이 모순을 더 잘 잡는다.
 */
export const collectMeasureTargets = (
  lists: readonly { minimumStreakYears: number; members: readonly { ticker: string; name: string }[] }[]
): { ticker: string; name: string; minimumStreakYears: number }[] => {
  const byTicker = new Map<string, { ticker: string; name: string; minimumStreakYears: number }>();
  for (const list of lists) {
    for (const member of list.members) {
      const seen = byTicker.get(member.ticker);
      if (!seen || seen.minimumStreakYears < list.minimumStreakYears) {
        byTicker.set(member.ticker, { ticker: member.ticker, name: member.name, minimumStreakYears: list.minimumStreakYears });
      }
    }
  }
  return [...byTicker.values()].sort((left, right) => left.ticker.localeCompare(right.ticker));
};
