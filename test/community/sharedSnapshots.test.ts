import { describe, expect, it } from 'vitest';
import {
  buildSharedSnapshotEnvelope,
  createSharedSnapshot,
  fetchSharedSnapshot,
  isValidSharedSnapshotEnvelope
} from '@/shared/lib/supabase';
import type { CommunityClient, PersistedScenarioState, SharedSnapshotEnvelope } from '@/shared/lib/supabase';

/**
 * 공유 스냅샷 IO (트랙 E) — client를 인자로 받으므로 가짜 rpc 클라이언트를 주입해 조립을 검증한다.
 * (userAppStates.test / queries.test와 같은 패턴. 여기선 SECURITY DEFINER RPC 2개가 핵심.)
 *
 * ⚠ vitest.config가 커뮤니티 env를 비워 실제 getSupabaseClient()는 테스트에서 null이라
 *   실 DB 통합은 불가 — RPC 이름·인자·언랩만 순수하게 검증한다.
 */

type RpcResult = { data: unknown; error: { message: string } | null };

const makeRpcClient = (result: RpcResult) => {
  const calls: { name: string; args: unknown }[] = [];
  const client = {
    rpc(name: string, args: unknown) {
      calls.push({ name, args });
      return Promise.resolve(result);
    }
  };
  return { client: client as unknown as CommunityClient, calls };
};

const scenario: PersistedScenarioState = {
  id: 'tab-1',
  name: '내 시나리오',
  portfolio: {
    tickerProfiles: [],
    includedTickerIds: [],
    weightByTickerId: {},
    fixedByTickerId: {},
    selectedTickerId: null
  },
  investmentSettings: {
    initialInvestment: 10_000_000,
    monthlyContribution: 500_000,
    targetMonthlyDividend: 3_000_000,
    investmentStartDate: '2024-01-01',
    durationYears: 20,
    reinvestDividends: true,
    reinvestDividendPercent: 100,
    taxRate: 15.4,
    reinvestTiming: 'sameMonth',
    dpsGrowthMode: 'monthlySmooth',
    showQuickEstimate: false,
    showSplitGraphs: false,
    isResultCompact: false,
    isYearlyAreaFillOn: true,
    showPortfolioDividendCenter: false,
    visibleYearlySeries: {
      totalContribution: true,
      assetValue: true,
      annualDividend: true,
      monthlyDividend: true,
      cumulativeDividend: false
    }
  }
};

describe('buildSharedSnapshotEnvelope', () => {
  it('활성 시나리오를 v1 envelope로 감싼다 (payload 계약)', () => {
    const envelope = buildSharedSnapshotEnvelope(scenario);
    expect(envelope).toEqual({ v: 1, scenario });
  });
});

describe('createSharedSnapshot', () => {
  it('create_shared_snapshot RPC를 p_payload로 부르고 서버 key를 반환한다', async () => {
    const { client, calls } = makeRpcClient({ data: 'AbC123_xyz-KEY', error: null });

    const key = await createSharedSnapshot(client, buildSharedSnapshotEnvelope(scenario));

    expect(calls).toHaveLength(1);
    expect(calls[0].name).toBe('create_shared_snapshot');
    expect(calls[0].args).toEqual({ p_payload: { v: 1, scenario } });
    expect(key).toBe('AbC123_xyz-KEY');
  });

  it('RPC 에러면 던진다 (상위가 lz-string 폴백)', async () => {
    const { client } = makeRpcClient({ data: null, error: { message: 'boom' } });
    await expect(createSharedSnapshot(client, buildSharedSnapshotEnvelope(scenario))).rejects.toThrow('boom');
  });

  it('빈 문자열 응답이면 던진다', async () => {
    const { client } = makeRpcClient({ data: '', error: null });
    await expect(createSharedSnapshot(client, buildSharedSnapshotEnvelope(scenario))).rejects.toThrow();
  });

  it('문자열이 아닌 응답(스키마 드리프트·신뢰불가)이면 던진다', async () => {
    // 서버가 key(문자열) 대신 숫자/객체를 돌려주면 URL을 못 만든다 → 상위 lz-string 폴백으로 넘긴다.
    const { client } = makeRpcClient({ data: 42, error: null });
    await expect(createSharedSnapshot(client, buildSharedSnapshotEnvelope(scenario))).rejects.toThrow();
  });
});

describe('fetchSharedSnapshot', () => {
  it('get_shared_snapshot RPC를 p_key로 부르고 payload를 반환한다', async () => {
    const envelope: SharedSnapshotEnvelope = { v: 1, scenario };
    const { client, calls } = makeRpcClient({ data: envelope, error: null });

    const result = await fetchSharedSnapshot(client, 'KEY22');

    expect(calls[0].name).toBe('get_shared_snapshot');
    expect(calls[0].args).toEqual({ p_key: 'KEY22' });
    expect(result).toEqual(envelope);
  });

  it('부재/만료(null data)면 null을 반환한다 (에러 아님)', async () => {
    const { client } = makeRpcClient({ data: null, error: null });
    expect(await fetchSharedSnapshot(client, 'missing')).toBeNull();
  });

  it('undefined data도 null로 언랩한다 (?? null)', async () => {
    const { client } = makeRpcClient({ data: undefined, error: null });
    expect(await fetchSharedSnapshot(client, 'missing')).toBeNull();
  });

  it('RPC 에러면 던진다 (상위가 계측+쿼리 정리)', async () => {
    const { client } = makeRpcClient({ data: null, error: { message: 'network' } });
    await expect(fetchSharedSnapshot(client, 'KEY')).rejects.toThrow('network');
  });

  // 서버 CHECK는 "jsonb object + 크기"만 본다 → anon이 임의 객체 저장 가능. 형태 불일치는 null로 안전 폴백해야
  // 상위 hook의 normalizeSharedSnapshotScenario(undefined)가 TypeError를 던지지 않는다(reviewer Minor #2).
  it('결손/비-envelope payload는 null로 폴백한다 (정규화 경로로 새지 않음)', async () => {
    const cases: unknown[] = [{ foo: 1 }, { v: 2, scenario }, { v: 1 }, { v: 1, scenario: 'x' }, 42];
    for (const bad of cases) {
      const { client } = makeRpcClient({ data: bad, error: null });
      expect(await fetchSharedSnapshot(client, 'KEY')).toBeNull();
    }
  });
});

describe('isValidSharedSnapshotEnvelope (형태 가드)', () => {
  it('v===1 + scenario 객체만 유효', () => {
    expect(isValidSharedSnapshotEnvelope({ v: 1, scenario })).toBe(true);
  });

  it('결손/오형 payload는 무효', () => {
    expect(isValidSharedSnapshotEnvelope({ foo: 1 })).toBe(false); // scenario 없음
    expect(isValidSharedSnapshotEnvelope({ v: 2, scenario })).toBe(false); // 버전 불일치
    expect(isValidSharedSnapshotEnvelope({ v: 1 })).toBe(false); // scenario 없음
    expect(isValidSharedSnapshotEnvelope({ v: 1, scenario: null })).toBe(false); // scenario null
    expect(isValidSharedSnapshotEnvelope({ v: 1, scenario: 'x' })).toBe(false); // scenario 비객체
    expect(isValidSharedSnapshotEnvelope(null)).toBe(false);
    expect(isValidSharedSnapshotEnvelope(42)).toBe(false);
  });
});
