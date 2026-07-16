import { describe, expect, it, vi } from 'vitest';
import {
  createComment,
  fetchGalleryPage,
  fetchMyScenarioLikes,
  publishScenario
} from '@/shared/lib/supabase';
import type { CommunityClient, ScenarioListItem } from '@/shared/lib/supabase';

/**
 * queries는 client를 **인자로** 받으므로 가짜 query-builder를 주입해 조립 로직을 검증한다.
 * (실제 PostgREST 없이: is_public 고정, 검색/키셋 필터, 정렬, insert 기본값 등)
 */

type Calls = {
  from: string[];
  select: string[];
  eq: [string, unknown][];
  or: string[];
  order: [string, { ascending: boolean }][];
  limit: number[];
  insert: unknown[];
  in: [string, unknown][];
  single: number;
};

const makeBuilder = (result: { data: unknown; error: { message: string } | null }) => {
  const calls: Calls = {
    from: [],
    select: [],
    eq: [],
    or: [],
    order: [],
    limit: [],
    insert: [],
    in: [],
    single: 0
  };

  const builder: Record<string, unknown> = {
    from(table: string) {
      calls.from.push(table);
      return builder;
    },
    select(cols: string) {
      calls.select.push(cols);
      return builder;
    },
    eq(col: string, val: unknown) {
      calls.eq.push([col, val]);
      return builder;
    },
    or(filter: string) {
      calls.or.push(filter);
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
    in(col: string, vals: unknown) {
      calls.in.push([col, vals]);
      return builder;
    },
    single() {
      calls.single += 1;
      return builder;
    },
    returns() {
      return builder;
    },
    then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
      return Promise.resolve(result).then(resolve, reject);
    }
  };

  return { client: builder as unknown as CommunityClient, calls };
};

const listRow = (id: string, createdAt: string): ScenarioListItem => ({
  id,
  user_id: 'u1',
  title: `글 ${id}`,
  description: null,
  is_public: true,
  has_payload: false,
  like_count: 0,
  view_count: 0,
  comment_count: 0,
  created_at: createdAt,
  updated_at: createdAt,
  author: null
});

describe('fetchGalleryPage', () => {
  it('is_public=true 로 고정하고 recent 정렬 키(created_at,id)를 건다', async () => {
    const { client, calls } = makeBuilder({
      data: [listRow('a', '2026-01-02T00:00:00Z'), listRow('b', '2026-01-01T00:00:00Z')],
      error: null
    });

    const page = await fetchGalleryPage(client, { sort: 'recent' });

    expect(calls.from).toEqual(['scenarios']);
    expect(calls.eq).toContainEqual(['is_public', true]);
    expect(calls.order.map(([col]) => col)).toEqual(['created_at', 'id']);
    // 검색어/커서가 없으면 or 필터를 걸지 않는다
    expect(calls.or).toEqual([]);
    // 다음 페이지 판별을 위해 pageSize+1 을 요청한다 (기본 12 → 13)
    expect(calls.limit).toEqual([13]);
    expect(page.items.map((i) => i.id)).toEqual(['a', 'b']);
    expect(page.nextCursor).toBeNull();
  });

  it('검색어가 있으면 title/description ILIKE or 필터를 얹는다', async () => {
    const { client, calls } = makeBuilder({ data: [], error: null });

    await fetchGalleryPage(client, { sort: 'recent', query: '배당' });

    expect(calls.or).toContain('title.ilike.%배당%,description.ilike.%배당%');
  });

  it('popular 정렬은 like_count,created_at,id 순으로 정렬한다', async () => {
    const { client, calls } = makeBuilder({ data: [], error: null });

    await fetchGalleryPage(client, { sort: 'popular' });

    expect(calls.order.map(([col]) => col)).toEqual(['like_count', 'created_at', 'id']);
  });

  it('error가 오면 던진다 (조용히 삼키지 않는다)', async () => {
    const { client } = makeBuilder({ data: null, error: { message: 'boom' } });

    await expect(fetchGalleryPage(client, {})).rejects.toThrow('boom');
  });
});

describe('publishScenario — 하이브리드 모델 기본값', () => {
  const saved = { id: 'new-id' };

  it('자유 글(payload 없음)을 그대로 insert하고 공개 기본값은 비공개(false)', async () => {
    const { client, calls } = makeBuilder({ data: saved, error: null });

    await publishScenario(client, { title: '제목만/본문', body: '<p>hi</p>' });

    const inserted = calls.insert[0] as Record<string, unknown>;
    expect(inserted.title).toBe('제목만/본문');
    expect(inserted.body).toBe('<p>hi</p>');
    expect(inserted.payload).toBeNull();
    expect(inserted.is_public).toBe(false);
    expect(calls.single).toBe(1);
  });

  it('isPublic=true를 명시하면 공개로 insert한다', async () => {
    const { client, calls } = makeBuilder({ data: saved, error: null });

    await publishScenario(client, { title: 't', body: 'b', isPublic: true });

    expect((calls.insert[0] as Record<string, unknown>).is_public).toBe(true);
  });
});

describe('createComment — 대댓글 parent_id', () => {
  it('parentId를 안 주면 최상위 댓글(parent_id null)', async () => {
    const { client, calls } = makeBuilder({ data: { id: 'c1' }, error: null });

    await createComment(client, { scenarioId: 's1', body: '댓글' });

    const inserted = calls.insert[0] as Record<string, unknown>;
    expect(inserted.parent_id).toBeNull();
    expect(inserted.scenario_id).toBe('s1');
  });

  it('parentId를 주면 대댓글', async () => {
    const { client, calls } = makeBuilder({ data: { id: 'c2' }, error: null });

    await createComment(client, { scenarioId: 's1', body: '답글', parentId: 'r1' });

    expect((calls.insert[0] as Record<string, unknown>).parent_id).toBe('r1');
  });
});

describe('fetchMyScenarioLikes', () => {
  it('빈 id 목록이면 client를 건드리지 않고 빈 Set을 준다', async () => {
    const from = vi.fn(() => {
      throw new Error('client should not be called');
    });
    const client = { from } as unknown as CommunityClient;

    const result = await fetchMyScenarioLikes(client, 'u1', []);

    expect(result.size).toBe(0);
    expect(from).not.toHaveBeenCalled();
  });

  it('행을 Set으로 모은다', async () => {
    const { client } = makeBuilder({
      data: [{ scenario_id: 'a' }, { scenario_id: 'b' }],
      error: null
    });

    const result = await fetchMyScenarioLikes(client, 'u1', ['a', 'b', 'c']);

    expect(result.has('a')).toBe(true);
    expect(result.has('b')).toBe(true);
    expect(result.has('c')).toBe(false);
  });
});
