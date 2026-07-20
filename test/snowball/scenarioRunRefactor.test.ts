import legacyGolden from './scenarioSummaryLegacy.golden.json';
import { SCENARIO_PAYLOAD_MATRIX, buildMatrixPayload, MATRIX_JEPI, MATRIX_SCHD, MATRIX_VIG } from './scenarioPayloadMatrix';
import { buildNormalizedAllocation, buildSimulationBundle, getIncludedProfiles } from '@/pages/Main/utils';
import { buildScenarioSimSummary, buildSnowballReport, defaultYieldFormValues, runScenarioPayload } from '@/shared/lib/snowball';

/**
 * `runScenarioPayload` 추출(SnowballScenarioSummary → SnowballScenarioRun) **회귀 방어**.
 *
 * `sim_summary`는 게시 시점에 값이 굳는다 — 계산 경로 리팩터링으로 숫자가 1원이라도 달라지면
 * 이미 게시된 커뮤니티 카드/상세/OG와 새 글이 어긋난다. 그래서 리팩터링 **이전 구현**(HEAD의
 * SnowballScenarioSummary.ts)으로 뽑아 둔 골든과 현재 구현을 payload 행렬 전체에서 대조한다.
 *
 * 골든 재생성은 원칙적으로 금지다. 값이 달라졌다면 리팩터링이 계산을 바꾼 것이므로,
 * 기대값을 고치지 말고 구현을 되돌려라.
 */

type GoldenEntry = { name: string; summary: unknown };

describe('runScenarioPayload 추출 — buildScenarioSimSummary 출력 불변', () => {
  it('골든 항목 수가 payload 행렬과 일치한다 (케이스 누락 방지)', () => {
    expect((legacyGolden as GoldenEntry[]).map((item) => item.name)).toEqual(
      SCENARIO_PAYLOAD_MATRIX.map((item) => item.name)
    );
  });

  it.each(SCENARIO_PAYLOAD_MATRIX.map((item, index) => [item.name, index] as const))(
    '%s — 리팩터링 전 숫자와 완전히 같다',
    (_name, index) => {
      const expected = (legacyGolden as GoldenEntry[])[index];
      expect(buildScenarioSimSummary(SCENARIO_PAYLOAD_MATRIX[index].payload)).toEqual(expected.summary);
    }
  );

  it('골든에 실제 숫자가 들어 있다 (전부 null이면 대조가 무의미하다)', () => {
    const nonNull = (legacyGolden as GoldenEntry[]).filter((item) => item.summary !== null);
    expect(nonNull.length).toBe(SCENARIO_PAYLOAD_MATRIX.length);
  });
});

describe('runScenarioPayload — 앱 화면 경로(buildSimulationBundle)와 같은 숫자', () => {
  it.each(SCENARIO_PAYLOAD_MATRIX.map((item, index) => [item.name, index] as const))(
    '%s — 연도별 행이 앱 표와 동일하다',
    (_name, index) => {
      const { payload } = SCENARIO_PAYLOAD_MATRIX[index];
      const run = runScenarioPayload(payload)!;
      expect(run).not.toBeNull();

      const includedProfiles = getIncludedProfiles(
        payload.portfolio.tickerProfiles,
        payload.portfolio.includedTickerIds
      );
      const { simulation } = buildSimulationBundle({
        isValid: true,
        includedProfiles,
        normalizedAllocation: buildNormalizedAllocation(includedProfiles, payload.portfolio.weightByTickerId),
        values: { ...defaultYieldFormValues, ...payload.investmentSettings }
      });

      expect(run.yearly).toEqual(simulation!.yearly);
    }
  );

  it('요약과 리포트는 같은 실행을 공유한다 — 최종 자산이 반올림 단위까지 같다', () => {
    SCENARIO_PAYLOAD_MATRIX.forEach(({ payload }) => {
      const summary = buildScenarioSimSummary(payload)!;
      const report = buildSnowballReport(payload)!;

      expect(Math.round(report.outcome.finalAssetValue)).toBe(summary.finalAssetValue);
      expect(Math.round(report.outcome.totalContribution)).toBe(summary.totalContribution);
      expect(Math.round(report.outcome.finalMonthlyAverageDividend)).toBe(summary.finalMonthlyDividend);
    });
  });
});

describe('runScenarioPayload — 계약(구조·순서·비중)', () => {
  it('포함된 티커만 payload 순서대로 실행하고, 비중 합은 1이다', () => {
    const payload = buildMatrixPayload([MATRIX_SCHD, MATRIX_JEPI, MATRIX_VIG], { t1: 50, t2: 30, t3: 20 });
    const run = runScenarioPayload({
      ...payload,
      portfolio: { ...payload.portfolio, includedTickerIds: ['t3', 't1'] }
    })!;

    // includedTickerIds 순서가 아니라 tickerProfiles 순서를 보존한다.
    expect(run.profiles.map((item) => item.ticker)).toEqual(['SCHD', 'VIG']);
    expect(run.weights.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 12);
    expect(run.outputs).toHaveLength(2);
    expect(run.yearly).toHaveLength(20);
  });

  it('계산 불가 payload는 throw 없이 null이고, 요약·리포트가 같은 판단을 내린다', () => {
    const broken: unknown[] = [
      null,
      undefined,
      {},
      'garbage',
      buildMatrixPayload([{ ...MATRIX_SCHD, initialPrice: 0 }], { t1: 100 }),
      buildMatrixPayload([MATRIX_SCHD], { t1: 100 }, { investmentStartDate: '2026-02-31' }),
      buildMatrixPayload([MATRIX_SCHD], { t1: 100 }, { reinvestTiming: 'yesterday' as never }),
      buildMatrixPayload([MATRIX_SCHD], { t1: 100 }, { dpsGrowthMode: 'quantum' as never })
    ];

    broken.forEach((payload) => {
      expect(runScenarioPayload(payload)).toBeNull();
      expect(buildScenarioSimSummary(payload)).toBeNull();
      expect(buildSnowballReport(payload)).toBeNull();
    });
  });

  it('포함된 티커가 0개면 null이다', () => {
    const payload = buildMatrixPayload([MATRIX_SCHD], { t1: 100 });
    expect(
      runScenarioPayload({ ...payload, portfolio: { ...payload.portfolio, includedTickerIds: [] } })
    ).toBeNull();
  });

  it('포함되지 않은 티커가 손상돼 있어도 계산은 성립한다', () => {
    const payload = buildMatrixPayload([MATRIX_SCHD], { t1: 100 });
    const withGarbage = {
      ...payload,
      portfolio: {
        ...payload.portfolio,
        tickerProfiles: [...payload.portfolio.tickerProfiles, { id: 'zz', broken: true }],
        includedTickerIds: ['t1']
      }
    };

    expect(runScenarioPayload(withGarbage)?.profiles).toHaveLength(1);
    expect(buildScenarioSimSummary(withGarbage)).toEqual(buildScenarioSimSummary(payload));
  });
});
