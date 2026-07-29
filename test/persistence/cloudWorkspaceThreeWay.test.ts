import { describe, expect, it } from 'vitest';
import {
  mergeWorkspacesThreeWay,
  parseTabBase,
  serializeTabBase,
  toScenarioHashMap
} from '@/jotai/snowball/cloud';
import { buildDefaultPayload, type PersistedAppStatePayload } from '@/jotai';
import type { PersistedScenarioState } from '@/jotai/snowball/types';
import type { TickerProfile } from '@/shared/types/snowball';

/**
 * 탭 단위 3-way 병합 — **이 파일이 지키는 것은 "다른 탭을 고친 편집은 사라지지 않는다"** 이다.
 *
 * 종전 판정은 payload 전체 문자열 하나를 base 와 비교해서, A 기기가 탭1만 B 기기가 탭2만 고쳐도
 * "양쪽 다 변함"이 되어 충돌 모달이 떴고 선택지가 전체↔전체라 반대편 편집이 통째로 사라졌다.
 */

const DEFAULT_SETTINGS = buildDefaultPayload().investmentSettings;

/** 같은 (id·name·ticker)면 의미상 같은 시나리오다. ticker 를 바꾸면 "그 탭을 편집"한 것이 된다. */
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

const tickersOf = (payload: PersistedAppStatePayload): Record<string, string> =>
  Object.fromEntries(payload.scenarios.map((s) => [s.id, s.portfolio.tickerProfiles[0]?.ticker ?? '']));

describe('탭 단위 3-way 병합', () => {
  const baseTabs = [makeScenario('a', '탭A', 'AAA'), makeScenario('b', '탭B', 'BBB')];
  const basePayload = makePayload(baseTabs);
  const base = toScenarioHashMap(basePayload);

  it('서로 다른 탭을 고치면 충돌이 아니라 **양쪽 다 살아남는다** (핵심 계약)', () => {
    // 이 기기는 탭A 를, 다른 기기는 탭B 를 고쳤다.
    const local = makePayload([makeScenario('a', '탭A', 'ZZZ'), makeScenario('b', '탭B', 'BBB')]);
    const cloud = makePayload([makeScenario('a', '탭A', 'AAA'), makeScenario('b', '탭B', 'YYY')]);

    const result = mergeWorkspacesThreeWay(base, local, cloud);

    expect(result.type).toBe('merged');
    if (result.type !== 'merged') return;
    // 두 편집이 모두 남는다 — 어느 쪽도 상대를 덮지 않는다.
    expect(tickersOf(result.payload)).toEqual({ a: 'ZZZ', b: 'YYY' });
    // 탭이 늘지 않는다(블렌드처럼 "(클라우드)" 복제본을 만들지 않는다).
    expect(result.payload.scenarios).toHaveLength(2);
  });

  it('같은 탭을 양쪽에서 다르게 고치면 충돌로 남긴다 — 자동 병합하지 않는다', () => {
    const local = makePayload([makeScenario('a', '탭A', 'ZZZ'), baseTabs[1]]);
    const cloud = makePayload([makeScenario('a', '탭A', 'YYY'), baseTabs[1]]);

    const result = mergeWorkspacesThreeWay(base, local, cloud);

    expect(result.type).toBe('conflict');
    if (result.type !== 'conflict') return;
    expect(result.conflictingIds).toEqual(['a']);
  });

  it('같은 탭을 양쪽이 **같게** 고쳤으면 충돌이 아니다', () => {
    const edited = makeScenario('a', '탭A', 'ZZZ');
    const result = mergeWorkspacesThreeWay(base, makePayload([edited, baseTabs[1]]), makePayload([edited, baseTabs[1]]));

    expect(result.type).toBe('merged');
  });

  it('한쪽 추가 · 다른 쪽 무편집 → 추가가 살아남는다', () => {
    const local = makePayload([...baseTabs, makeScenario('c', '탭C', 'CCC')]);
    const result = mergeWorkspacesThreeWay(base, local, basePayload);

    expect(result.type).toBe('merged');
    if (result.type !== 'merged') return;
    expect(result.payload.scenarios.map((s) => s.id)).toEqual(['a', 'b', 'c']);
  });

  it('한쪽 삭제 · 다른 쪽 무편집 → 삭제가 반영된다(되살아나지 않는다)', () => {
    const local = makePayload([baseTabs[0]]); // 탭B 삭제
    const result = mergeWorkspacesThreeWay(base, local, basePayload);

    expect(result.type).toBe('merged');
    if (result.type !== 'merged') return;
    expect(result.payload.scenarios.map((s) => s.id)).toEqual(['a']);
  });

  it('한쪽 삭제 · 다른 쪽 편집 → 충돌(조용히 지우지 않는다)', () => {
    const local = makePayload([baseTabs[0]]); // 탭B 삭제
    const cloud = makePayload([baseTabs[0], makeScenario('b', '탭B', 'YYY')]); // 탭B 편집

    const result = mergeWorkspacesThreeWay(base, local, cloud);

    expect(result.type).toBe('conflict');
    if (result.type !== 'conflict') return;
    expect(result.conflictingIds).toEqual(['b']);
  });

  it('탭 순서는 로컬 기준을 유지하고 클라우드 고유 탭을 뒤에 붙인다', () => {
    const local = makePayload([baseTabs[1], baseTabs[0]]); // 사용자가 순서를 바꿔 둔 상태
    const cloud = makePayload([...baseTabs, makeScenario('z', '탭Z', 'ZZZ')]);

    const result = mergeWorkspacesThreeWay(base, local, cloud);

    expect(result.type).toBe('merged');
    if (result.type !== 'merged') return;
    expect(result.payload.scenarios.map((s) => s.id)).toEqual(['b', 'a', 'z']);
  });

  it('활성 탭이 살아남으면 유지, 사라졌으면 첫 탭으로 떨어진다', () => {
    const local = makePayload(baseTabs, 'b');
    expect(mergeWorkspacesThreeWay(base, local, basePayload)).toMatchObject({
      payload: { activeScenarioId: 'b' }
    });

    // 클라우드가 활성 탭(b)을 지웠고 이 기기는 b 를 안 건드렸다 → 삭제 반영, 활성은 남은 첫 탭.
    const cloudDeleted = makePayload([baseTabs[0]]);
    const result = mergeWorkspacesThreeWay(base, local, cloudDeleted);
    expect(result.type).toBe('merged');
    if (result.type !== 'merged') return;
    expect(result.payload.activeScenarioId).toBe('a');
  });
});

describe('base 저장 형식', () => {
  it('왕복한다', () => {
    const payload = makePayload([makeScenario('a', '탭A', 'AAA')]);
    expect(parseTabBase(serializeTabBase(payload))).toEqual(toScenarioHashMap(payload));
  });

  it('구 형식(payload 전체 문자열)·손상된 값은 null 로 폴백한다 — 하위호환', () => {
    // 접두사가 없는 구 base: 종전 전체 비교 경로로 가야 한다.
    expect(parseTabBase('{"scenarios":[]}')).toBeNull();
    expect(parseTabBase(undefined)).toBeNull();
    expect(parseTabBase('v2:{broken')).toBeNull();
    expect(parseTabBase('v2:[]')).toBeNull();
    // 값이 문자열이 아니면 신뢰하지 않는다(잘못된 "안 바뀜" 판정 = 편집 유실).
    expect(parseTabBase('v2:{"a":123}')).toBeNull();
  });
});
