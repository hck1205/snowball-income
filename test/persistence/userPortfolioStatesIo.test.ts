import { describe, expect, it } from 'vitest';
import { fetchCloudPortfolio, pushCloudPortfolio } from '@/shared/lib/supabase';
import type { UserPortfolioCloudPayload } from '@/shared/lib/supabase';

/**
 * `user_portfolio_states` IO 계약 테스트.
 *
 * 왜 이 테스트가 있는가 — 2026-07-29 사고
 * ---------------------------------------------------------------------------
 * push 가 `{ user_id, payload }` 를 보냈다. 이 레포는 위조를 막으려고 **컬럼 단위로 GRANT** 하고
 * (`grant insert (payload)`), user_id 는 `default auth.uid()` 가 채운다. 그래서 user_id 를 실어
 * 보내면 `permission denied for column user_id` 로 **요청 전체가 실패**한다.
 *
 * 이 실패는 조용하다 — 타입도 맞고, 테스트도 통과하고, 빌드도 된다. 오직 로그인한 사용자의
 * 화면에서만 "클라우드와 맞추지 못했습니다"로 드러난다. 그래서 **나가는 요청의 모양**을 못박는다.
 */

/** upsert/select 호출 인자를 그대로 붙잡는 가짜 PostgREST 체인. */
const createSpyClient = (row: unknown) => {
  const calls: { table?: string; upsert?: unknown; options?: unknown; select?: string } = {};

  const chain = {
    select(columns: string) {
      calls.select = columns;
      return chain;
    },
    upsert(values: unknown, options?: unknown) {
      calls.upsert = values;
      calls.options = options;
      return chain;
    },
    limit() {
      return chain;
    },
    single() {
      return chain;
    },
    returns() {
      return Promise.resolve({ data: row, error: null });
    },
    then(resolve: (v: { data: unknown; error: null }) => unknown) {
      return Promise.resolve({ data: row, error: null }).then(resolve);
    }
  };

  const client = {
    from(table: string) {
      calls.table = table;
      return chain;
    }
  };

  return { client: client as never, calls };
};

const PAYLOAD: UserPortfolioCloudPayload = {
  version: 1,
  record: { holdings: [], taxPercent: 15, updatedAt: '2026-07-30T00:00:00.000Z' },
  calendarTickers: []
} as unknown as UserPortfolioCloudPayload;

describe('user_portfolio_states IO', () => {
  it('올릴 때 user_id 를 보내지 않는다 — 컬럼 GRANT 가 그 쓰기를 거부한다', async () => {
    const { client, calls } = createSpyClient({ user_id: 'u1', payload: PAYLOAD, updated_at: 'x' });

    await pushCloudPortfolio(client, PAYLOAD);

    expect(calls.table).toBe('user_portfolio_states');
    expect(calls.upsert).toEqual({ payload: PAYLOAD });
    expect(Object.keys(calls.upsert as object)).not.toContain('user_id');
  });

  it('1인 1행이므로 user_id 충돌로 upsert 한다', async () => {
    const { client, calls } = createSpyClient({ user_id: 'u1', payload: PAYLOAD, updated_at: 'x' });

    await pushCloudPortfolio(client, PAYLOAD);

    expect(calls.options).toEqual({ onConflict: 'user_id' });
  });

  it('읽을 때 행이 없으면 null 이다 — 첫 로그인은 실패가 아니다', async () => {
    const { client } = createSpyClient([]);

    await expect(fetchCloudPortfolio(client)).resolves.toBeNull();
  });

  it('읽기는 내 행 하나만 가져온다', async () => {
    const row = { user_id: 'u1', payload: PAYLOAD, updated_at: 'x' };
    const { client, calls } = createSpyClient([row]);

    await expect(fetchCloudPortfolio(client)).resolves.toEqual(row);
    expect(calls.select).toBe('user_id,payload,updated_at');
  });
});
