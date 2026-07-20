import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CommunityClient } from '@/shared/lib/supabase';

/**
 * `posts.category` 마이그레이션이 **아직 실행되지 않은 DB**에서도 조회가 죽지 않아야 한다.
 *
 * PostgREST 는 없는 컬럼을 select 목록에서 만나면 42703(undefined_column)으로 **조회 전체**를
 * 실패시킨다. queries.ts 는 낙관적으로 category 를 붙여 보내고, 42703 이면 그 컬럼을 뺀 컬럼셋으로
 * 1회 재시도한 뒤 세션 동안 "없는 것"으로 기억한다.
 *
 * 모듈 스코프 캐시(1회 학습)를 검증해야 하므로 각 테스트마다 `vi.resetModules()` 로 새 인스턴스를 받는다.
 */

type Result = { data: unknown; error: { code?: string; message: string } | null };

const UNDEFINED_COLUMN: Result['error'] = {
  code: '42703',
  message: 'column posts.category does not exist'
};

/**
 * **category 와 무관한** 42703. posts 에는 부분 배포 가능한 컬럼이 또 있다 —
 * 정밀 검색 facet generated column(마이그레이션 20260717000001). facet 만 빠진 DB 에서
 * 정밀 검색을 걸면 이 에러가 난다.
 */
const UNDEFINED_FACET_COLUMN: Result['error'] = {
  code: '42703',
  message: 'column posts.final_monthly_dividend does not exist'
};

/** 호출될 때마다 큐에서 결과를 하나씩 꺼내는 가짜 query builder. select 컬럼 문자열을 기록한다. */
const makeClient = (results: Result[]) => {
  const queue = [...results];
  const selects: string[] = [];

  const builder: Record<string, unknown> = {
    from: () => builder,
    select(cols: string) {
      selects.push(cols);
      return builder;
    },
    eq: () => builder,
    or: () => builder,
    gte: () => builder,
    lte: () => builder,
    order: () => builder,
    limit: () => builder,
    single: () => builder,
    returns: () => builder,
    then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
      const next = queue.shift() ?? { data: null, error: null };
      return Promise.resolve(next).then(resolve, reject);
    }
  };

  return { client: builder as unknown as CommunityClient, selects };
};

const freshQueries = async () => {
  vi.resetModules();
  return import('@/shared/lib/supabase');
};

beforeEach(() => {
  vi.resetModules();
});

describe('posts 조회 — category 컬럼 낙관적 요청', () => {
  it('컬럼이 있으면 select 목록에 category가 실린다', async () => {
    const { fetchBoardPage } = await freshQueries();
    const { client, selects } = makeClient([{ data: [], error: null }]);

    await fetchBoardPage(client);

    expect(selects).toHaveLength(1);
    expect(selects[0]).toContain(',category');
  });

  it('⭐ 42703이면 category를 뺀 컬럼셋으로 재시도해 목록이 살아난다', async () => {
    const { fetchBoardPage } = await freshQueries();
    const row = { id: 'p1', title: '글' };
    const { client, selects } = makeClient([
      { data: null, error: UNDEFINED_COLUMN },
      { data: [row], error: null }
    ]);

    const page = await fetchBoardPage(client);

    expect(selects).toHaveLength(2);
    expect(selects[0]).toContain(',category');
    expect(selects[1]).not.toContain(',category');
    expect(page.items).toEqual([row]);
  });

  it('한 번 42703을 보면 이후 조회는 처음부터 category 없이 나간다(왕복 낭비 방지)', async () => {
    const { fetchBoardPage } = await freshQueries();
    const first = makeClient([{ data: null, error: UNDEFINED_COLUMN }, { data: [], error: null }]);
    await fetchBoardPage(first.client);

    const second = makeClient([{ data: [], error: null }]);
    await fetchBoardPage(second.client);

    expect(second.selects).toHaveLength(1);
    expect(second.selects[0]).not.toContain(',category');
  });

  it('상세 조회도 같은 폴백을 탄다', async () => {
    const { fetchPostDetail } = await freshQueries();
    const detail = { id: 'p1', title: '글' };
    const { client, selects } = makeClient([
      { data: null, error: UNDEFINED_COLUMN },
      { data: detail, error: null }
    ]);

    await expect(fetchPostDetail(client, 'p1')).resolves.toEqual(detail);
    expect(selects).toHaveLength(2);
  });

  /**
   * ⭐ 회귀 가드: category 는 배포됐고 facet 마이그레이션만 빠진 DB 에서 정밀 검색을 걸면
   * 42703 이 난다. 이걸 category 탓으로 오인해 플래그를 굳히면 **그 세션 내내 게시판 배지가
   * 조용히 사라진다**(원인이 전혀 다른 화면이라 추적 불가).
   */
  it('⭐ 42703이지만 category와 무관한 컬럼이면 재시도하지 않고 그대로 던진다', async () => {
    const { fetchGalleryPage } = await freshQueries();
    const { client, selects } = makeClient([{ data: null, error: UNDEFINED_FACET_COLUMN }]);

    await expect(fetchGalleryPage(client, { facets: { monthlyMin: 1000 } })).rejects.toThrow(
      /final_monthly_dividend/
    );
    // 폴백해도 어차피 같은 에러다 — 재시도 왕복 없이 즉시 표면화한다.
    expect(selects).toHaveLength(1);
  });

  it('⭐ 무관한 42703은 플래그를 오염시키지 않는다 — 이후 조회에 category가 계속 실린다', async () => {
    const { fetchGalleryPage, fetchBoardPage } = await freshQueries();

    const broken = makeClient([{ data: null, error: UNDEFINED_FACET_COLUMN }]);
    await expect(fetchGalleryPage(broken.client, { facets: { monthlyMin: 1000 } })).rejects.toThrow();

    const later = makeClient([{ data: [], error: null }]);
    await fetchBoardPage(later.client);

    expect(later.selects[0]).toContain(',category');
  });

  /**
   * 플래그는 **폴백이 실제로 성공한 뒤에만** 굳힌다. 재시도까지 실패하면 "컬럼이 없다"는
   * 학습이 틀렸을 수 있으므로 다음 조회는 다시 낙관적으로 시도해야 한다(2차 방어).
   */
  it('⭐ 폴백까지 실패하면 플래그가 굳지 않는다', async () => {
    const { fetchBoardPage } = await freshQueries();

    const failing = makeClient([
      { data: null, error: UNDEFINED_COLUMN },
      { data: null, error: { code: '57014', message: 'canceling statement due to statement timeout' } }
    ]);
    await expect(fetchBoardPage(failing.client)).rejects.toThrow(/statement timeout/);

    const later = makeClient([{ data: [], error: null }]);
    await fetchBoardPage(later.client);

    expect(later.selects[0]).toContain(',category');
  });

  it('42703이 아닌 에러는 폴백하지 않고 그대로 던진다 (진짜 장애를 숨기지 않는다)', async () => {
    const { fetchBoardPage } = await freshQueries();
    const { client, selects } = makeClient([
      { data: null, error: { code: '57014', message: 'canceling statement due to statement timeout' } }
    ]);

    await expect(fetchBoardPage(client)).rejects.toThrow(/statement timeout/);
    expect(selects).toHaveLength(1);
  });
});

describe('isUndefinedColumnError', () => {
  it('42703 코드를 잡는다', async () => {
    const { isUndefinedColumnError } = await freshQueries();
    expect(isUndefinedColumnError(UNDEFINED_COLUMN)).toBe(true);
  });

  it('메시지만으로도 잡는다(코드 누락 대비)', async () => {
    const { isUndefinedColumnError } = await freshQueries();
    expect(isUndefinedColumnError({ message: 'column posts.category does not exist' })).toBe(true);
  });

  it('다른 에러와 null은 false', async () => {
    const { isUndefinedColumnError } = await freshQueries();
    expect(isUndefinedColumnError({ code: '23505', message: 'duplicate key' })).toBe(false);
    expect(isUndefinedColumnError(null)).toBe(false);
  });

  it('컬럼을 지정하면 그 컬럼에 대한 42703만 true', async () => {
    const { isUndefinedColumnError } = await freshQueries();
    expect(isUndefinedColumnError(UNDEFINED_COLUMN, 'category')).toBe(true);
    expect(isUndefinedColumnError(UNDEFINED_FACET_COLUMN, 'category')).toBe(false);
  });

  it('부분 문자열이 아니라 단어 경계로 대조한다 (category_id 같은 이름에 안 걸린다)', async () => {
    const { isUndefinedColumnError } = await freshQueries();
    expect(
      isUndefinedColumnError({ code: '42703', message: 'column posts.category_id does not exist' }, 'category')
    ).toBe(false);
  });
});
