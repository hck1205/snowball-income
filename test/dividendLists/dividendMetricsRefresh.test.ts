import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { DividendUniverseMetrics } from '@/shared/constants/dividendLists';
import {
  assembleDividendMetrics,
  collectMeasureTargets,
  MAX_FETCH_FAILURE_RATIO,
  type CandidateAudit
} from '@/scripts/dividendLists';

/**
 * 목록 지표 파일 갱신(2026-11-05)의 계약.
 *
 * 이 파일을 쓰는 코드가 **없어서** 화면 배당률이 8월 4일 값에 석 달 멈춰 있었다. 다시 멈추지 않게
 * ① 조립 규칙(정상·검산 실패·조회 실패)과 ② 워크플로 배선을 잠근다.
 */

const metricsOf = (forwardYieldPercent: number, fiveYearGrowthPercent: number | null): DividendUniverseMetrics => ({
  price: 100,
  currency: 'USD',
  latestDividend: 1,
  latestDividendDate: '2026-10-15',
  paymentsPerYear: 4,
  forwardAnnualDividend: 4,
  forwardYieldPercent,
  fiveYearGrowthPercent,
  recentCut: null,
  firstDividendYear: 1990,
  measuredAt: '2026-11-05'
});

const audit = (
  ticker: string,
  metrics: DividendUniverseMetrics | null,
  issueKind?: CandidateAudit['issues'][number]['kind']
): CandidateAudit => ({
  entry: {
    ticker,
    name: ticker,
    sector: null,
    sourceSectorLabel: null,
    sourceEtfs: [],
    minimumStreakYears: 25,
    metrics
  } as CandidateAudit['entry'],
  issues: issueKind ? [{ ticker, kind: issueKind, detail: 'x', blocking: true }] : []
});

const ok = (count: number, prefix = 'T'): CandidateAudit[] =>
  Array.from({ length: count }, (_, index) => audit(`${prefix}${String(index).padStart(2, '0')}`, metricsOf(3, 5)));

describe('지표 파일 조립', () => {
  it('정상 측정값을 소수 넷째 자리로 쓴다', () => {
    const result = assembleDividendMetrics([audit('ABBV', metricsOf(2.3957900567788397, 6.8051927565147885))], {}, '2026-11-05');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.file.asOf).toBe('2026-11-05');
    expect(result.file.metrics.ABBV).toEqual({ forwardYieldPercent: 2.3958, fiveYearGrowthPercent: 6.8052 });
  });

  it('5년 성장률을 못 구한 종목은 그 필드만 null 이다', () => {
    const result = assembleDividendMetrics([audit('AMCR', metricsOf(5.6, null))], {}, '2026-11-05');
    expect(result.ok && result.file.metrics.AMCR).toEqual({ forwardYieldPercent: 5.6, fiveYearGrowthPercent: null });
  });

  it('🔴 검산에 걸린 종목은 두 필드 다 null — 틀릴 수 있는 숫자를 내보내지 않는다', () => {
    const result = assembleDividendMetrics(
      [audit('WRB', null, 'abnormalLatestPayment'), ...ok(9)],
      { WRB: { forwardYieldPercent: 0.5, fiveYearGrowthPercent: 7 } },
      '2026-11-05'
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.file.metrics.WRB).toEqual({ forwardYieldPercent: null, fiveYearGrowthPercent: null });
    expect(result.blocked).toEqual(['WRB']);
  });

  it('🔴 조회 실패는 지난 값을 남긴다 — 일시 오류로 종목이 화면에서 깜빡이지 않는다', () => {
    const previous = { MO: { forwardYieldPercent: 7.1, fiveYearGrowthPercent: 4 } };
    const result = assembleDividendMetrics([audit('MO', null, 'fetchFailed'), ...ok(9)], previous, '2026-11-05');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.file.metrics.MO).toEqual(previous.MO);
    expect(result.kept).toEqual(['MO']);
  });

  it('조회 실패에 지난 값도 없으면 항목을 만들지 않는다(= 아직 실측 없음)', () => {
    const result = assembleDividendMetrics([audit('NEW', null, 'fetchFailed'), ...ok(9)], {}, '2026-11-05');
    expect(result.ok && 'NEW' in result.file.metrics).toBe(false);
  });

  it('🔴 조회 실패가 허용 비율을 넘으면 조립을 거부한다 — 반쯤 지난달 값인 파일을 쓰지 않는다', () => {
    const failures = Math.floor(10 * MAX_FETCH_FAILURE_RATIO) + 1;
    const audits = [...ok(10 - failures), ...Array.from({ length: failures }, (_, i) => audit(`F${i}`, null, 'fetchFailed'))];
    const result = assembleDividendMetrics(audits, {}, '2026-11-05');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failed).toHaveLength(failures);
  });

  it('목록에서 빠진 종목의 지난 값은 남기지 않는다', () => {
    const result = assembleDividendMetrics(ok(3), { KVUE: { forwardYieldPercent: 3, fiveYearGrowthPercent: 1 } }, '2026-11-05');
    expect(result.ok && 'KVUE' in result.file.metrics).toBe(false);
  });

  it('아무것도 재지 않았으면 빈 파일을 쓰지 않는다', () => {
    expect(assembleDividendMetrics([], {}, '2026-11-05').ok).toBe(false);
  });
});

describe('잴 종목', () => {
  it('여러 목록에 실린 종목은 한 번만, 가장 엄한 하한으로 잰다', () => {
    const targets = collectMeasureTargets([
      { minimumStreakYears: 25, members: [{ ticker: 'KO', name: 'Coca-Cola' }, { ticker: 'ABBV', name: 'AbbVie' }] },
      { minimumStreakYears: 50, members: [{ ticker: 'KO', name: 'Coca-Cola' }] }
    ]);
    expect(targets).toEqual([
      { ticker: 'ABBV', name: 'AbbVie', minimumStreakYears: 25 },
      { ticker: 'KO', name: 'Coca-Cola', minimumStreakYears: 50 }
    ]);
  });
});

describe('워크플로 배선', () => {
  const workflow = readFileSync(resolve(__dirname, '../../.github/workflows/refresh-dividend-lists.yml'), 'utf8').replace(/\r\n/g, '\n');
  const packageJson = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf8')) as { scripts: Record<string, string> };

  it('🔴 월간 갱신이 지표를 다시 잰다 — 이 줄이 없어서 석 달 멈췄다', () => {
    expect(packageJson.scripts['dividend:metrics']).toContain('scripts/dividendLists/metricsCli.ts');
    expect(workflow).toMatch(/npm run dividend:metrics -- \$args/);
    expect(workflow).toMatch(/args="--write"[\s\S]*npm run dividend:metrics/);
  });

  it('🔴 목록을 먼저 만들고 그다음 잰다 — 이번 달 구성으로 재야 한다', () => {
    expect(workflow.indexOf('npm run dividend:lists')).toBeLessThan(workflow.indexOf('npm run dividend:metrics'));
  });

  it('잰 결과가 커밋 대상에 들어 있다', () => {
    expect(workflow).toContain('METRICS_JSON: shared/constants/dividendLists/dividendLists.metrics.generated.json');
    expect(workflow).toMatch(/git add [^\n]*"\$METRICS_JSON"/);
  });
});
