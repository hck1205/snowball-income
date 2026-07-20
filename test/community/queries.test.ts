import { describe, expect, it, vi } from 'vitest';
import {
  createComment,
  fetchBoardPage,
  fetchCommentsPage,
  fetchGalleryPage,
  fetchMyPostLikes,
  fetchVisibleCommentCount,
  publishPost
} from '@/shared/lib/supabase';
import type { CommentWithAuthor, CommunityClient, PostListItem } from '@/shared/lib/supabase';

/**
 * queries는 client를 **인자로** 받으므로 가짜 query-builder를 주입해 조립 로직을 검증한다.
 * (실제 PostgREST 없이: is_public 고정, 검색/키셋 필터, 정렬, insert 기본값 등)
 */

type Calls = {
  from: string[];
  select: string[];
  selectOpts: unknown[];
  eq: [string, unknown][];
  is: [string, unknown][];
  or: string[];
  gte: [string, unknown][];
  lte: [string, unknown][];
  order: [string, { ascending: boolean }][];
  limit: number[];
  insert: unknown[];
  in: [string, unknown][];
  single: number;
};

type BuilderResult = { data: unknown; error: { message: string } | null; count?: number };

/** 결과 배열을 주면 await 순서대로 하나씩 소비한다 (한 함수가 여러 쿼리를 날리는 경우). */
const makeBuilder = (result: BuilderResult | BuilderResult[]) => {
  const queue = Array.isArray(result) ? [...result] : null;
  const calls: Calls = {
    from: [],
    select: [],
    selectOpts: [],
    eq: [],
    is: [],
    or: [],
    gte: [],
    lte: [],
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
    select(cols: string, opts?: unknown) {
      calls.select.push(cols);
      if (opts !== undefined) calls.selectOpts.push(opts);
      return builder;
    },
    eq(col: string, val: unknown) {
      calls.eq.push([col, val]);
      return builder;
    },
    is(col: string, val: unknown) {
      calls.is.push([col, val]);
      return builder;
    },
    or(filter: string) {
      calls.or.push(filter);
      return builder;
    },
    gte(col: string, val: unknown) {
      calls.gte.push([col, val]);
      return builder;
    },
    lte(col: string, val: unknown) {
      calls.lte.push([col, val]);
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
      const next = queue ? (queue.shift() ?? { data: null, error: null }) : (result as BuilderResult);
      return Promise.resolve(next).then(resolve, reject);
    }
  };

  return { client: builder as unknown as CommunityClient, calls };
};

const listRow = (id: string, createdAt: string): PostListItem => ({
  id,
  user_id: 'u1',
  kind: 'portfolio',
  category: 'free',
  title: `글 ${id}`,
  description: null,
  is_public: true,
  has_payload: false,
  sim_summary: null,
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

    expect(calls.from).toEqual(['posts']);
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

  it('facet 미지정이면 gte/lte를 하나도 걸지 않는다 (기존 동작 그대로)', async () => {
    const { client, calls } = makeBuilder({ data: [], error: null });

    await fetchGalleryPage(client, { sort: 'recent' });

    expect(calls.gte).toEqual([]);
    expect(calls.lte).toEqual([]);
  });

  it('정밀 검색 facet을 파생 컬럼 gte/lte로 얹는다 (월배당 range·목표 이상·기간 range)', async () => {
    const { client, calls } = makeBuilder({ data: [], error: null });

    await fetchGalleryPage(client, {
      sort: 'recent',
      facets: { monthlyMin: 3_000_000, monthlyMax: 5_000_000, targetMin: 2_000_000, durationMin: 10, durationMax: 20 }
    });

    // 월배당 range → final_monthly_dividend, 목표는 이상(gte)만, 기간 range → duration_years
    expect(calls.gte).toEqual([
      ['final_monthly_dividend', 3_000_000],
      ['target_monthly_dividend', 2_000_000],
      ['duration_years', 10]
    ]);
    expect(calls.lte).toEqual([
      ['final_monthly_dividend', 5_000_000],
      ['duration_years', 20]
    ]);
    // 정렬·is_public 규칙은 필터와 공존한다
    expect(calls.eq).toContainEqual(['is_public', true]);
    expect(calls.order.map(([col]) => col)).toEqual(['created_at', 'id']);
  });

  it('일부 facet만 주면 그 경계만 얹는다 (목표만 지정)', async () => {
    const { client, calls } = makeBuilder({ data: [], error: null });

    await fetchGalleryPage(client, { facets: { targetMin: 1_500_000 } });

    expect(calls.gte).toEqual([['target_monthly_dividend', 1_500_000]]);
    expect(calls.lte).toEqual([]);
  });

  it('facet과 검색어·커서가 함께 오면 모두 공존한다 (or 필터 + gte/lte)', async () => {
    const { client, calls } = makeBuilder({ data: [], error: null });

    await fetchGalleryPage(client, { sort: 'recent', query: '배당', facets: { monthlyMin: 1_000_000 } });

    expect(calls.or).toContain('title.ilike.%배당%,description.ilike.%배당%');
    expect(calls.gte).toEqual([['final_monthly_dividend', 1_000_000]]);
  });
});

describe('publishPost — 하이브리드 모델 기본값', () => {
  const saved = { id: 'new-id' };

  it('자유 글(payload 없음)을 그대로 insert하고 공개 기본값은 비공개(false)', async () => {
    const { client, calls } = makeBuilder({ data: saved, error: null });

    await publishPost(client, { title: '제목만/본문', body: '<p>hi</p>' });

    const inserted = calls.insert[0] as Record<string, unknown>;
    expect(inserted.title).toBe('제목만/본문');
    expect(inserted.body).toBe('<p>hi</p>');
    expect(inserted.payload).toBeNull();
    expect(inserted.is_public).toBe(false);
    expect(calls.single).toBe(1);
  });

  it('isPublic=true를 명시하면 공개로 insert한다', async () => {
    const { client, calls } = makeBuilder({ data: saved, error: null });

    await publishPost(client, { title: 't', body: 'b', isPublic: true });

    expect((calls.insert[0] as Record<string, unknown>).is_public).toBe(true);
  });

  it('kind 미지정이면 kind 키를 보내지 않는다 (서버 default portfolio → 갤러리 하위호환)', async () => {
    const { client, calls } = makeBuilder({ data: saved, error: null });

    await publishPost(client, { title: 't', body: 'b' });

    expect('kind' in (calls.insert[0] as Record<string, unknown>)).toBe(false);
  });

  it('kind=board를 주면 게시판 글로 insert한다', async () => {
    const { client, calls } = makeBuilder({ data: saved, error: null });

    await publishPost(client, { title: '자유글', body: '<p>안녕</p>', kind: 'board' });

    expect((calls.insert[0] as Record<string, unknown>).kind).toBe('board');
  });
});

describe('글 종류 격리 — 갤러리(portfolio) vs 자유게시판(board)', () => {
  it('fetchGalleryPage는 kind=portfolio로 고정한다 (자유게시판 글이 갤러리로 새지 않게)', async () => {
    const { client, calls } = makeBuilder({ data: [], error: null });

    await fetchGalleryPage(client, {});

    expect(calls.eq).toContainEqual(['kind', 'portfolio']);
    expect(calls.eq).toContainEqual(['is_public', true]);
  });

  it('fetchBoardPage는 kind=board를 최신순으로 조회한다 (게시판 목록)', async () => {
    const { client, calls } = makeBuilder({ data: [listRow('a', '2026-01-02T00:00:00Z')], error: null });

    const page = await fetchBoardPage(client, {});

    expect(calls.from).toEqual(['posts']);
    expect(calls.eq).toContainEqual(['kind', 'board']);
    expect(calls.eq).toContainEqual(['is_public', true]);
    expect(calls.order.map(([col]) => col)).toEqual(['created_at', 'id']);
    expect(page.items.map((i) => i.id)).toEqual(['a']);
  });

  it('명시적 kind가 default를 덮어쓴다', async () => {
    const { client, calls } = makeBuilder({ data: [], error: null });

    await fetchGalleryPage(client, { kind: 'board' });

    expect(calls.eq).toContainEqual(['kind', 'board']);
    expect(calls.eq).not.toContainEqual(['kind', 'portfolio']);
  });
});

describe('createComment — 대댓글 parent_id', () => {
  it('parentId를 안 주면 최상위 댓글(parent_id null)', async () => {
    const { client, calls } = makeBuilder({ data: { id: 'c1' }, error: null });

    await createComment(client, { postId: 's1', body: '댓글' });

    const inserted = calls.insert[0] as Record<string, unknown>;
    expect(inserted.parent_id).toBeNull();
    expect(inserted.post_id).toBe('s1');
  });

  it('parentId를 주면 대댓글', async () => {
    const { client, calls } = makeBuilder({ data: { id: 'c2' }, error: null });

    await createComment(client, { postId: 's1', body: '답글', parentId: 'r1' });

    expect((calls.insert[0] as Record<string, unknown>).parent_id).toBe('r1');
  });
});

describe('fetchCommentsPage — 루트 keyset + 대댓글 동반 로드', () => {
  const commentRow = (id: string, parentId: string | null, createdAt: string): CommentWithAuthor => ({
    id,
    post_id: 's1',
    user_id: 'u1',
    parent_id: parentId,
    body: `본문 ${id}`,
    like_count: 0,
    created_at: createdAt,
    updated_at: createdAt,
    deleted_at: null,
    author: null
  });

  it('루트를 (created_at,id) 오름차순으로 pageSize+1개 요청하고, 로드된 루트의 대댓글을 in 조회로 붙인다', async () => {
    const roots = [
      commentRow('a', null, '2026-07-01T00:00:00Z'),
      commentRow('b', null, '2026-07-02T00:00:00Z'),
      commentRow('c', null, '2026-07-03T00:00:00Z') // limit+1번째 → 다음 페이지 존재 신호
    ];
    const replies = [commentRow('a-1', 'a', '2026-07-01T01:00:00Z')];
    const { client, calls } = makeBuilder([
      { data: roots, error: null },
      { data: replies, error: null }
    ]);

    const page = await fetchCommentsPage(client, 's1', { pageSize: 2 });

    expect(calls.from).toEqual(['comments', 'comments']);
    expect(calls.eq).toContainEqual(['post_id', 's1']);
    expect(calls.is).toContainEqual(['parent_id', null]);
    expect(calls.or).toEqual([]); // 첫 페이지엔 keyset 필터 없음
    expect(calls.order.map(([col, opt]) => [col, opt.ascending])).toEqual([
      ['created_at', true],
      ['id', true],
      ['created_at', true] // 대댓글 조회의 정렬
    ]);
    expect(calls.limit).toEqual([3]);
    expect(calls.in).toContainEqual(['parent_id', ['a', 'b']]);

    expect(page.comments.map((row) => row.id)).toEqual(['a', 'b', 'a-1']);
    expect(page.nextCursor).toEqual({ createdAt: '2026-07-02T00:00:00Z', id: 'b' });
  });

  it('커서를 주면 keyset or 필터를 얹는다', async () => {
    const { client, calls } = makeBuilder([{ data: [], error: null }]);

    await fetchCommentsPage(client, 's1', {
      cursor: { createdAt: '2026-07-02T00:00:00Z', id: 'b' },
      pageSize: 2
    });

    expect(calls.or).toEqual([
      'created_at.gt."2026-07-02T00:00:00Z",and(created_at.eq."2026-07-02T00:00:00Z",id.gt."b")'
    ]);
  });

  it('루트가 없으면 대댓글 조회를 생략한다 (빈 마지막 페이지)', async () => {
    const { client, calls } = makeBuilder([{ data: [], error: null }]);

    const page = await fetchCommentsPage(client, 's1', { pageSize: 2 });

    expect(calls.from).toEqual(['comments']); // 두 번째 쿼리 없음
    expect(page.comments).toEqual([]);
    expect(page.nextCursor).toBeNull();
  });
});

describe('fetchVisibleCommentCount', () => {
  it('삭제 제외 head 카운트를 요청한다', async () => {
    const { client, calls } = makeBuilder({ data: null, error: null, count: 7 });

    const total = await fetchVisibleCommentCount(client, 's1');

    expect(total).toBe(7);
    expect(calls.eq).toContainEqual(['post_id', 's1']);
    expect(calls.is).toContainEqual(['deleted_at', null]);
    expect(calls.selectOpts).toContainEqual({ count: 'exact', head: true });
  });

  it('error가 오면 던진다', async () => {
    const { client } = makeBuilder({ data: null, error: { message: 'boom' } });

    await expect(fetchVisibleCommentCount(client, 's1')).rejects.toThrow('boom');
  });
});

describe('fetchMyPostLikes', () => {
  it('빈 id 목록이면 client를 건드리지 않고 빈 Set을 준다', async () => {
    const from = vi.fn(() => {
      throw new Error('client should not be called');
    });
    const client = { from } as unknown as CommunityClient;

    const result = await fetchMyPostLikes(client, 'u1', []);

    expect(result.size).toBe(0);
    expect(from).not.toHaveBeenCalled();
  });

  it('행을 Set으로 모은다', async () => {
    const { client } = makeBuilder({
      data: [{ post_id: 'a' }, { post_id: 'b' }],
      error: null
    });

    const result = await fetchMyPostLikes(client, 'u1', ['a', 'b', 'c']);

    expect(result.has('a')).toBe(true);
    expect(result.has('b')).toBe(true);
    expect(result.has('c')).toBe(false);
  });
});
