import { describe, expect, it, vi } from 'vitest';
import {
  mergeWorkspaces,
  previewBlend,
  resolveWithBlend,
  resolveWithCloud,
  resolveWithDevice,
  summarizeReconciliation,
  type CloudWorkspaceConflict,
  type WorkspaceReconcileDeps
} from '@/jotai/snowball/cloud';
import { buildDefaultPayload, normalizePersistedAppState, type PersistedAppStatePayload } from '@/jotai';
import type { PersistedScenarioState } from '@/jotai/snowball/types';
import type { TickerProfile } from '@/shared/types/snowball';

/**
 * 디바이스↔클라우드 화해 순수 로직 — 블렌드 병합(합집합·비파괴·1라운드 수렴), 3-way 화해 부작용, 요약.
 * 저장 스키마는 무변경이라 병합 결과(>10 탭 포함)도 normalizePersistedAppState 왕복이 그대로 성립한다.
 */

const DEFAULT_SETTINGS = buildDefaultPayload().investmentSettings;

/** 내용(티커)이 있는 시나리오 하나. 같은 (id·name·ticker)면 isSameMeaningfulScenario가 같다고 본다. */
const makeScenario = (id: string, name: string, ticker: string): PersistedScenarioState => {
  const profile: TickerProfile = {
    id: `t-${ticker}`,
    ticker,
    name: ticker,
    initialPrice: 100,
    dividendYield: 3,
    dividendGrowth: 0,
    expectedTotalReturn: 3,
    frequency: 'quarterly'
  };
  return {
    id,
    name,
    portfolio: {
      tickerProfiles: [profile],
      includedTickerIds: [profile.id],
      weightByTickerId: {},
      fixedByTickerId: {},
      selectedTickerId: null
    },
    investmentSettings: DEFAULT_SETTINGS
  };
};

const makePayload = (scenarios: PersistedScenarioState[], activeId?: string): PersistedAppStatePayload => ({
  portfolio: scenarios[0].portfolio,
  investmentSettings: scenarios[0].investmentSettings,
  scenarios,
  activeScenarioId: activeId ?? scenarios[0].id
});

/** 결정론 id 생성기(발산본 id를 고정). */
const seqIds = () => {
  let n = 0;
  return () => `gen-${(n += 1)}`;
};

const ids = (payload: PersistedAppStatePayload) => payload.scenarios.map((s) => s.id);
const names = (payload: PersistedAppStatePayload) => payload.scenarios.map((s) => s.name);

describe('mergeWorkspaces — 합집합·비파괴 블렌드', () => {
  it('{A,B,C}+{A,B,D}(A·B same) → {A,B,C,D} (디바이스 → 클라우드 고유 순서)', () => {
    const device = makePayload([
      makeScenario('a', '탭A', 'AAA'),
      makeScenario('b', '탭B', 'BBB'),
      makeScenario('c', '탭C', 'CCC')
    ]);
    const cloud = makePayload([
      makeScenario('a', '탭A', 'AAA'), // same id·내용
      makeScenario('b', '탭B', 'BBB'), // same id·내용
      makeScenario('d', '탭D', 'DDD') // 클라우드 고유
    ]);

    const merged = mergeWorkspaces(device, cloud, seqIds());

    expect(ids(merged)).toEqual(['a', 'b', 'c', 'd']);
    expect(names(merged)).toEqual(['탭A', '탭B', '탭C', '탭D']);
  });

  it('같은 id·내용 다름 → 원본 + "(클라우드)" 둘 다 보존(새 id)', () => {
    const device = makePayload([makeScenario('x', '내 전략', 'AAA')]);
    const cloud = makePayload([makeScenario('x', '내 전략', 'BBB')]); // 같은 id, 다른 티커

    const merged = mergeWorkspaces(device, cloud, seqIds());

    expect(merged.scenarios).toHaveLength(2);
    expect(merged.scenarios[0]).toEqual(device.scenarios[0]); // 디바이스 원본 그대로
    expect(merged.scenarios[1].id).toBe('gen-1'); // 새 id
    expect(merged.scenarios[1].name).toBe('내 전략 (클라우드)');
    expect(merged.scenarios[1].portfolio.tickerProfiles[0].ticker).toBe('BBB'); // 클라우드 내용 보존
  });

  it('같은 id·이름만 다름(내용 동일)도 발산으로 취급해 둘 다 보존(비파괴 — 이름을 조용히 버리지 않음)', () => {
    const device = makePayload([makeScenario('x', '내 전략', 'AAA')]);
    const cloud = makePayload([makeScenario('x', '은퇴 계획', 'AAA')]); // 같은 티커, 다른 이름

    const merged = mergeWorkspaces(device, cloud, seqIds());

    expect(merged.scenarios).toHaveLength(2);
    expect(names(merged)).toEqual(['내 전략', '은퇴 계획 (클라우드)']);
  });

  it('순서: 디바이스 → 클라우드 고유 → 클라우드 발산본', () => {
    const device = makePayload([makeScenario('a', 'A', 'AAA')]);
    const cloud = makePayload([
      makeScenario('a', 'A', 'ZZZ'), // 같은 id, 다른 내용 → 발산본
      makeScenario('e', 'E', 'EEE') // 고유
    ]);

    const merged = mergeWorkspaces(device, cloud, seqIds());

    expect(ids(merged)).toEqual(['a', 'e', 'gen-1']); // device, cloud-unique, cloud-divergent
    expect(names(merged)).toEqual(['A', 'E', 'A (클라우드)']);
  });

  it('활성 탭은 디바이스 활성을 따르고 최상위 미러도 그 탭으로 재합성한다', () => {
    const device = makePayload([makeScenario('a', 'A', 'AAA'), makeScenario('b', 'B', 'BBB')], 'b');
    const cloud = makePayload([makeScenario('c', 'C', 'CCC')]);

    const merged = mergeWorkspaces(device, cloud, seqIds());

    expect(merged.activeScenarioId).toBe('b');
    expect(merged.portfolio).toEqual(device.scenarios[1].portfolio);
  });

  it('기본 id 생성기도 기존 id와 겹치지 않는 새 id를 발산본에 부여한다', () => {
    const device = makePayload([makeScenario('x', 'X', 'AAA')]);
    const cloud = makePayload([makeScenario('x', 'X', 'BBB')]);

    const merged = mergeWorkspaces(device, cloud); // 주입 없이 실제 생성기

    expect(merged.scenarios).toHaveLength(2);
    expect(merged.scenarios[1].id).not.toBe('x');
    expect(new Set(ids(merged)).size).toBe(2); // 중복 없음
  });

  it('1라운드 수렴: 블렌드 결과를 다시 블렌드해도 증식하지 않는다(merge(M,M) === M)', () => {
    const device = makePayload([makeScenario('a', 'A', 'AAA'), makeScenario('x', 'X', 'AAA')]);
    const cloud = makePayload([makeScenario('a', 'A', 'AAA'), makeScenario('x', 'X', 'BBB')]);

    const merged = mergeWorkspaces(device, cloud, seqIds());
    // 다음 세션: 로컬·클라우드 둘 다 merged를 정본으로 갖는다 → 재병합해도 그대로.
    const reMerged = mergeWorkspaces(merged, merged, seqIds());

    expect(ids(reMerged)).toEqual(ids(merged));
    expect(reMerged.scenarios).toEqual(merged.scenarios);
  });

  it('>10 탭 블렌드 결과도 절단 없이 저장·정규화 왕복이 성립한다', () => {
    const device = makePayload(
      Array.from({ length: 6 }, (_, i) => makeScenario(`d${i}`, `D${i}`, `DV${i}`))
    );
    const cloud = makePayload(
      Array.from({ length: 6 }, (_, i) => makeScenario(`c${i}`, `C${i}`, `CV${i}`))
    );

    const merged = mergeWorkspaces(device, cloud, seqIds());
    expect(merged.scenarios).toHaveLength(12); // 모두 고유 → 12개

    const roundTripped = normalizePersistedAppState(JSON.parse(JSON.stringify(merged)));
    expect(roundTripped.scenarios).toHaveLength(12); // 개수 미절단(왕복 안전)
    expect(ids(roundTripped)).toEqual(ids(merged));
  });
});

describe('3-way 화해 부작용(IO 주입)', () => {
  const makeDeps = () => {
    const calls = {
      apply: [] as PersistedAppStatePayload[],
      mirror: [] as PersistedAppStatePayload[],
      push: [] as { payload: PersistedAppStatePayload; savedAt: number }[]
    };
    const deps: WorkspaceReconcileDeps = {
      applyPayload: (p) => calls.apply.push(p),
      writeLocalAutosave: vi.fn(async (p: PersistedAppStatePayload) => {
        calls.mirror.push(p);
      }),
      pushCloudAutosave: vi.fn(async (p: PersistedAppStatePayload, savedAt: number) => {
        calls.push.push({ payload: p, savedAt });
      }),
      now: () => 42_000
    };
    return { calls, deps };
  };

  const device = makePayload([makeScenario('a', 'A', 'AAA')]);
  const cloud = makePayload([makeScenario('b', 'B', 'BBB')]);

  it('resolveWithDevice: 로컬을 클라우드에 push만(앱·로컬은 이미 정본)', async () => {
    const { calls, deps } = makeDeps();

    const resolved = await resolveWithDevice(device, deps);

    expect(resolved).toBe(device);
    expect(calls.push).toEqual([{ payload: device, savedAt: 42_000 }]);
    expect(calls.apply).toEqual([]);
    expect(calls.mirror).toEqual([]);
  });

  it('resolveWithCloud: 앱 적용 + 로컬 미러(클라우드는 이미 정본, push 없음)', async () => {
    const { calls, deps } = makeDeps();

    const resolved = await resolveWithCloud(cloud, deps);

    expect(resolved).toBe(cloud);
    expect(calls.apply).toEqual([cloud]);
    expect(calls.mirror).toEqual([cloud]);
    expect(calls.push).toEqual([]);
  });

  it('resolveWithBlend: 병합본을 앱·로컬·클라우드 양쪽에 동일 반영', async () => {
    const { calls, deps } = makeDeps();
    const expectedMerged = mergeWorkspaces(device, cloud, seqIds());

    const resolved = await resolveWithBlend(device, cloud, { ...deps, makeId: seqIds() });

    expect(resolved.scenarios).toEqual(expectedMerged.scenarios);
    expect(calls.apply).toEqual([resolved]);
    expect(calls.mirror).toEqual([resolved]);
    expect(calls.push).toEqual([{ payload: resolved, savedAt: 42_000 }]);
  });
});

describe('충돌 요약', () => {
  const conflict: CloudWorkspaceConflict = {
    device: makePayload([makeScenario('a', '내 전략', 'AAA'), makeScenario('b', '공격형', 'BBB')]),
    cloud: makePayload([makeScenario('a', '내 전략', 'AAA')]),
    deviceUpdatedAt: 1000,
    cloudSavedAt: undefined
  };

  it('좌/우 각각 탭 개수·이름 목록·마지막 편집시각을 낸다(시각 없으면 null)', () => {
    const summary = summarizeReconciliation(conflict);

    expect(summary.device).toEqual({ tabCount: 2, tabNames: ['내 전략', '공격형'], lastEditedAt: 1000 });
    expect(summary.cloud).toEqual({ tabCount: 1, tabNames: ['내 전략'], lastEditedAt: null });
  });

  it('previewBlend는 병합 결과 탭 개수·이름을 미리 보여준다', () => {
    const preview = previewBlend({
      device: makePayload([makeScenario('a', 'A', 'AAA')]),
      cloud: makePayload([makeScenario('a', 'A', 'BBB'), makeScenario('e', 'E', 'EEE')]),
      deviceUpdatedAt: undefined,
      cloudSavedAt: undefined
    });

    expect(preview.tabCount).toBe(3); // A(디바이스) + E(고유) + A 발산본
    expect(preview.tabNames).toEqual(['A', 'E', 'A (클라우드)']);
  });
});
