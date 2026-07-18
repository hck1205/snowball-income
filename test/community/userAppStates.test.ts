import { describe, expect, it } from 'vitest';
import { fetchCloudAutosave, pushCloudAutosave } from '@/shared/lib/supabase';
import type { CommunityClient } from '@/shared/lib/supabase';
import { buildDefaultPayload } from '@/jotai';

/**
 * user_app_states IO — client를 인자로 받으므로 가짜 query-builder를 주입해 조립을 검증한다.
 * (queries.test.ts와 같은 패턴. autosave upsert의 select→update/insert 분기가 핵심.)
 */

type BuilderResult = { data: unknown; error: { message: string } | null };

type Calls = {
  from: string[];
  select: string[];
  is: [string, unknown][];
  not: [string, string, unknown][];
  eq: [string, unknown][];
  order: [string, { ascending: boolean }][];
  limit: number[];
  insert: unknown[];
  update: unknown[];
  delete: number;
};

/** await 순서대로 결과를 하나씩 소비한다(한 함수가 여러 쿼리를 날리는 경우). */
const makeBuilder = (results: BuilderResult | BuilderResult[]) => {
  const queue = Array.isArray(results) ? [...results] : null;
  const calls: Calls = { from: [], select: [], is: [], not: [], eq: [], order: [], limit: [], insert: [], update: [], delete: 0 };

  const builder: Record<string, unknown> = {
    from(table: string) {
      calls.from.push(table);
      return builder;
    },
    select(cols: string) {
      calls.select.push(cols);
      return builder;
    },
    is(col: string, val: unknown) {
      calls.is.push([col, val]);
      return builder;
    },
    not(col: string, op: string, val: unknown) {
      calls.not.push([col, op, val]);
      return builder;
    },
    eq(col: string, val: unknown) {
      calls.eq.push([col, val]);
      return builder;
    },
    order(col: string, opt: { ascending: boolean }) {
      calls.order.push([col, opt]);
      return builder;
    },
    limit(n: number) {
      calls.limit.push(n);
      return builder;
    },
    insert(value: unknown) {
      calls.insert.push(value);
      return builder;
    },
    update(value: unknown) {
      calls.update.push(value);
      return builder;
    },
    delete() {
      calls.delete += 1;
      return builder;
    },
    single() {
      return builder;
    },
    returns() {
      return builder;
    },
    then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
      const next = queue ? (queue.shift() ?? { data: null, error: null }) : (results as BuilderResult);
      return Promise.resolve(next).then(resolve, reject);
    }
  };

  return { client: builder as unknown as CommunityClient, calls };
};

const row = (over: Record<string, unknown> = {}) => ({
  id: 'r1',
  user_id: 'u1',
  name: null,
  payload: buildDefaultPayload(),
  created_at: '2026-07-18T00:00:00Z',
  updated_at: '2026-07-18T00:00:00Z',
  ...over
});

describe('pushCloudAutosave — 자동 슬롯 upsert', () => {
  it('기존 자동 슬롯이 있으면 그 id로 update한다 (insert 아님)', async () => {
    const payload = buildDefaultPayload();
    const { client, calls } = makeBuilder([
      { data: [{ id: 'existing' }], error: null }, // select id (name is null)
      { data: row({ id: 'existing' }), error: null } // update ... returning
    ]);

    await pushCloudAutosave(client, payload);

    // 자동 슬롯 조회는 name is null
    expect(calls.is).toContainEqual(['name', null]);
    expect(calls.update[0]).toEqual({ payload });
    expect(calls.eq).toContainEqual(['id', 'existing']);
    expect(calls.insert).toEqual([]);
  });

  it('자동 슬롯이 없으면 name:null로 insert한다', async () => {
    const payload = buildDefaultPayload();
    const { client, calls } = makeBuilder([
      { data: [], error: null }, // select id → 없음
      { data: row(), error: null } // insert ... returning
    ]);

    await pushCloudAutosave(client, payload);

    expect(calls.update).toEqual([]);
    expect(calls.insert[0]).toEqual({ payload, name: null });
  });

  it('payload를 변형 없이 그대로 저장한다 (직렬화 왕복 안전)', async () => {
    const payload = buildDefaultPayload();
    payload.savedName = '내 워크스페이스';
    const { client, calls } = makeBuilder([
      { data: [], error: null },
      { data: row(), error: null }
    ]);

    await pushCloudAutosave(client, payload);

    const inserted = calls.insert[0] as { payload: unknown };
    // jsonb 저장은 JSON 왕복과 같다 — 값이 동등해야 로컬↔클라우드가 하나의 스키마다.
    expect(JSON.parse(JSON.stringify(inserted.payload))).toEqual(payload);
  });
});

describe('fetchCloudAutosave', () => {
  it('자동 슬롯이 없으면 null을 준다', async () => {
    const { client } = makeBuilder({ data: [], error: null });
    expect(await fetchCloudAutosave(client)).toBeNull();
  });
});
