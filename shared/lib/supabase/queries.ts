import type { SupabaseClient } from '@supabase/supabase-js';
import { buildScenarioSimSummary } from '@/shared/lib/snowball';
import {
  buildCommentKeysetFilter,
  buildGalleryFacetFilters,
  buildKeysetFilter,
  buildSearchFilter,
  COMMENTS_PAGE_SIZE,
  decodeGalleryCursor,
  GALLERY_PAGE_SIZE,
  getGalleryOrderKeys,
  splitCommentRootsPage,
  splitPage,
  type CommentCursor
} from './pagination';
import type {
  CommentWithAuthor,
  Database,
  GalleryFacetFilters,
  GalleryPage,
  GallerySort,
  PostCategory,
  PostKind,
  PostListItem,
  PostPayload,
  PostWithAuthor
} from './types';

/**
 * IO 레이어 — 여기엔 로직을 두지 않는다.
 *
 * 정렬·커서·트리 구성 같은 "생각이 필요한 부분"은 전부 pagination.ts / comments.ts의
 * 순수 함수로 빼서 테스트했다. 이 파일은 그걸 조립해 네트워크에 던지기만 한다.
 *
 * 모든 함수가 client를 **인자로** 받는다 (모듈 목킹 없이 가짜 클라이언트로 테스트 가능).
 * UI에서는 `const client = await getSupabaseClient(); if (!client) return;` 로 쓴다.
 */

export type CommunityClient = SupabaseClient<Database>;

/**
 * 갤러리 카드에 필요한 컬럼만. payload/body는 목록에서 제외한다 (행당 수십 KB → 대역폭 낭비).
 * sim_summary는 포함한다 — 카드 프리뷰용 10필드 요약(~300B)이라 목록에 실어도 가볍고,
 * payload 없이 시뮬 숫자를 그리는 것이 이 컬럼의 존재 이유다.
 */
const LIST_COLUMNS = 'id,user_id,kind,title,description,is_public,has_payload,sim_summary,like_count,view_count,comment_count,created_at,updated_at,author:profiles(id,display_name,avatar_url)';

/** 상세는 본문(body)과 시나리오 첨부(payload)까지 내려온다. */
const DETAIL_COLUMNS = `${LIST_COLUMNS},payload,body`;

/**
 * **아직 배포되지 않았을 수 있는** posts 컬럼들.
 *
 * PostgREST 는 없는 컬럼을 select 목록에서 만나면 42703(undefined_column)으로 **조회 전체**를
 * 실패시킨다 — 즉 컬럼을 그냥 추가하면 "마이그레이션 먼저, 배포 나중" 순서에 종속되고, 순서가
 * 뒤집히면 목록/상세가 통째로 죽는다. profiles 는 좁은 테이블이라 `select('*')` 로 피했지만
 * posts 는 payload/body 가 수십 KB 라 `*` 를 쓸 수 없다(목록 대역폭).
 *
 * 그래서 **낙관적 요청 + 42703 1회 폴백**을 쓴다. 아래 `selectPosts` 참고.
 */
const OPTIONAL_POST_COLUMNS = 'category';

/**
 * 이 세션에서 낙관적 컬럼(OPTIONAL_POST_COLUMNS)이 실재하는가.
 * 폴백이 **실제로 성공**하면 false 로 굳어 이후 요청은 폴백 컬럼셋으로 바로 나간다(왕복 낭비 방지).
 * 마이그레이션 후 새로고침하면 다시 true 로 시작한다.
 */
let optionalPostColumnsAvailable = true;

/**
 * PostgREST 의 "그런 컬럼 없음"(42703) **중 특정 컬럼에 대한 것인가**.
 *
 * ⚠ 컬럼명 대조가 핵심이다. posts 에는 category 말고도 **부분 배포 가능한 컬럼**이 또 있다 —
 *   정밀 검색 facet generated column(20260717000001, `buildGalleryFacetFilters` 가 .gte/.lte 로
 *   건다). facet 마이그레이션만 빠진 DB 에서 정밀 검색을 걸면 42703 이 나는데, 코드만 보고
 *   "category 탓"으로 오인하면 폴백 플래그가 굳어 **그 세션 내내 게시판 배지가 조용히 사라진다**
 *   (원인이 전혀 다른 화면이라 추적 불가). 그래서 코드 + 컬럼명을 함께 본다.
 *
 * 코드가 비어 있는 응답도 있으므로 메시지의 "column … does not exist" 형태를 보조로 인정한다.
 */
export const isUndefinedColumnError = (
  error: { code?: string | null; message?: string | null } | null | undefined,
  column?: string
): boolean => {
  if (!error) return false;
  const message = error.message ?? '';
  const isUndefinedColumn = error.code === '42703' || /column .* does not exist/i.test(message);
  if (!isUndefinedColumn) return false;
  // 컬럼을 지정하지 않으면 "42703 인가"만 답한다(범용 판정).
  if (!column) return true;
  return new RegExp(`\\b${column}\\b`, 'i').test(message);
};

/**
 * posts **조회** 실행기 — 낙관적으로 `OPTIONAL_POST_COLUMNS` 를 붙여 보내고,
 * **그 컬럼 때문에** 42703 이 나면 컬럼을 뺀 컬럼셋으로 1회 재시도한다.
 *
 * `build`는 컬럼 문자열만 받아 쿼리를 새로 조립한다(재시도는 새 쿼리여야 한다 — PostgREST 빌더는
 * 재사용할 수 없다). 다른 원인의 42703(위 facet 컬럼 등)이나 그 밖의 에러는 **폴백하지 않고 그대로
 * 던진다** — 진짜 장애를 숨기지 않고, 플래그도 오염되지 않는다.
 *
 * 플래그는 **폴백이 성공한 뒤에만** 굳힌다. 재시도까지 실패하는 상황(원인이 category 가 아니었던
 * 경우)에서 "컬럼이 없다"고 잘못 학습하지 않기 위한 2차 방어다.
 *
 * ⚠ 쓰기(insert/update)의 representation select 에는 이 함수를 쓰지 않는다 — 아래 주석 참고.
 */
const selectPosts = async <T>(
  build: (columns: string) => PromiseLike<{ data: T | null; error: { code?: string | null; message: string } | null }>,
  baseColumns: string
): Promise<T> => {
  if (optionalPostColumnsAvailable) {
    const result = await build(`${baseColumns},${OPTIONAL_POST_COLUMNS}`);
    if (!isUndefinedColumnError(result.error, OPTIONAL_POST_COLUMNS)) return unwrap(result);

    const fallback = unwrap(await build(baseColumns));
    // 여기 도달 = 폴백이 실제로 성공했다 → 이제서야 "컬럼 없음"을 확정한다.
    optionalPostColumnsAvailable = false;
    return fallback;
  }
  return unwrap(await build(baseColumns));
};

const COMMENT_COLUMNS = 'id,post_id,user_id,parent_id,body,like_count,created_at,updated_at,deleted_at,author:profiles(id,display_name,avatar_url)';

const unwrap = <T>(result: { data: T | null; error: { message: string } | null }): T => {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error('Supabase 응답이 비어 있습니다');
  return result.data;
};

// ── 갤러리 ──────────────────────────────────────────────────────────────────

/**
 * 공개 시나리오/글 목록 (keyset 페이지네이션 + 선택적 제목/설명 검색).
 * RLS가 비공개를 걸러주지만, 인덱스(partial index)를 타도록 is_public 조건을 명시한다.
 *
 * 검색(`query`)은 정렬/커서를 **그대로 재사용**한다 — WHERE 필터만 얹을 뿐 정렬 규칙은 그대로다.
 * 검색 `.or(...)` 와 키셋 `.or(...)` 는 각각 별개의 top-level 조건이라 PostgREST가 AND로 묶는다:
 *   is_public = true  AND  (제목 ILIKE OR 설명 ILIKE)  AND  (키셋 튜플 비교)
 * 빈/무효 검색어는 buildSearchFilter가 null을 주므로 검색 없이 일반 목록으로 폴백한다.
 *
 * 정밀 검색(`facets`)은 sim_summary 파생 컬럼(final_monthly_dividend/target_monthly_dividend/
 * duration_years)에 `.gte()/.lte()` 범위 경계를 얹는다 — 이 역시 별개의 top-level 조건이라
 * 위 AND 사슬에 그대로 합류한다(정렬·키셋·검색과 공존). facet이 NULL인 글(자유 글 등)은
 * range 비교에서 자동 제외된다. 필터가 하나도 없으면 경계 목록이 비어 기존 동작 그대로다.
 *
 * ⚠ 글 종류 격리: `kind`(기본 'portfolio')를 별개 top-level `.eq`로 얹어 갤러리와 게시판을 섞지
 *   않는다. 기본값이 'portfolio'라 기존 호출부(갤러리)는 그대로 포트폴리오 글만 본다(자유게시판
 *   글이 갤러리로 새지 않는다). 게시판은 fetchBoardPage(=kind:'board')로 조회한다.
 */
export const fetchGalleryPage = async (
  client: CommunityClient,
  options: {
    sort?: GallerySort;
    cursor?: string | null;
    pageSize?: number;
    query?: string;
    queryFilter?: string;
    facets?: GalleryFacetFilters;
    /** 글 종류 필터. 기본 'portfolio'(갤러리). 게시판은 'board'. */
    kind?: PostKind;
  } = {}
): Promise<GalleryPage> => {
  const sort = options.sort ?? 'recent';
  const pageSize = options.pageSize ?? GALLERY_PAGE_SIZE;
  const kind = options.kind ?? 'portfolio';
  const cursor = decodeGalleryCursor(options.cursor);
  const searchFilter = buildSearchFilter(options.query, options.queryFilter);

  const rows = await selectPosts<PostListItem[]>((columns) => {
    let query = client.from('posts').select(columns).eq('is_public', true).eq('kind', kind);

    if (searchFilter) query = query.or(searchFilter);
    if (cursor) query = query.or(buildKeysetFilter(sort, cursor));

    for (const bound of buildGalleryFacetFilters(options.facets)) {
      query = bound.op === 'gte' ? query.gte(bound.column, bound.value) : query.lte(bound.column, bound.value);
    }

    for (const key of getGalleryOrderKeys(sort)) {
      query = query.order(key.column, { ascending: key.ascending });
    }

    // 다음 페이지 존재 여부를 알기 위해 1개 더 받는다
    return query.limit(pageSize + 1).returns<PostListItem[]>();
  }, LIST_COLUMNS);

  return splitPage(rows, pageSize, sort);
};

/**
 * 자유게시판 목록 — fetchGalleryPage에 kind:'board'만 얹은 얇은 래퍼.
 * 페이지네이션·정렬·검색·격리 규칙은 갤러리와 완전히 동일하다(단일 원천). 기본 정렬은 최신순.
 * 게시판 글은 대개 sim_summary가 없어 facet range 필터엔 자동 제외되지만, 계약은 그대로 열어둔다.
 */
export const fetchBoardPage = async (
  client: CommunityClient,
  options: {
    sort?: GallerySort;
    cursor?: string | null;
    pageSize?: number;
    query?: string;
    queryFilter?: string;
    facets?: GalleryFacetFilters;
  } = {}
): Promise<GalleryPage> => fetchGalleryPage(client, { ...options, kind: 'board' });

export const fetchPostDetail = async (
  client: CommunityClient,
  postId: string
): Promise<PostWithAuthor> =>
  selectPosts<PostWithAuthor>(
    (columns) => client.from('posts').select(columns).eq('id', postId).single().returns<PostWithAuthor>(),
    DETAIL_COLUMNS
  );

export const fetchMyPosts = async (client: CommunityClient, userId: string): Promise<PostListItem[]> =>
  selectPosts<PostListItem[]>(
    (columns) =>
      client
        .from('posts')
        .select(columns)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .returns<PostListItem[]>(),
    LIST_COLUMNS
  );

/**
 * payload → 게시 시점 시뮬 요약. **게시·수정 뮤테이션에서만 부른다** — 읽기 경로는
 * 절대 재계산하지 않는다(게시 시점 숫자 고정: 엔진이 바뀌어도 카드·상세 표기 일치).
 * payload가 없거나 계산 불가(미완성 payload)면 null → UI는 텍스트 카드로 폴백한다.
 */
const toSimSummary = (payload: PostPayload | null) => (payload ? buildScenarioSimSummary(payload) : null);

/**
 * 글 게시. 하이브리드 모델이라 payload/body 둘 다 선택적이다:
 *   - 자유 글        : body만 (payload 없음)
 *   - 시나리오 공유   : payload만 (body 없음)
 *   - 둘 다          : body + payload
 * 서버 CHECK(posts_payload_valid_or_null)가 payload NULL을 허용한다.
 * payload가 있으면 시뮬 요약(sim_summary)을 여기서 1회 계산해 함께 저장한다.
 *
 * `kind`는 글이 어느 표면에 속하는지 정한다('portfolio'=갤러리, 'board'=자유게시판).
 * 지정하지 않으면 컬럼 자체를 보내지 않아 서버 default('portfolio')가 적용된다(하위호환).
 * 게시판 글쓰기만 'board'를 명시한다.
 *
 * `category`(게시판 분류)도 같은 규율이다 — 미지정이면 키를 생략해 서버 default('free')가 붙는다.
 * 호출부(usePostComposer)는 **기본값이 아닐 때만** 넘기므로, category 마이그레이션 전에도
 * '자유' 글 게시는 42703 없이 성공한다.
 */
export const publishPost = async (
  client: CommunityClient,
  input: {
    title: string;
    description?: string | null;
    body?: string | null;
    payload?: PostPayload | null;
    isPublic?: boolean;
    kind?: PostKind;
    category?: PostCategory;
  }
): Promise<PostWithAuthor> => {
  const payload = input.payload ?? null;

  return unwrap(
    await client
      .from('posts')
      .insert({
        title: input.title,
        description: input.description ?? null,
        body: input.body ?? null,
        payload,
        sim_summary: toSimSummary(payload),
        // 기본은 비공개. 공개는 사용자가 명시적으로 선택할 때만 (서버 기본값과 동일한 철학)
        is_public: input.isPublic ?? false,
        // kind 미지정이면 키 자체를 생략 → 서버 default 'portfolio'. 게시판만 'board' 명시.
        ...(input.kind ? { kind: input.kind } : {}),
        // category 미지정이면 키 자체를 생략 → 서버 default 'free'.
        ...(input.category ? { category: input.category } : {})
      })
      // ⚠ 쓰기의 RETURNING 에는 **낙관적 컬럼을 싣지 않는다**(DETAIL_COLUMNS 고정, selectPosts 미사용).
      //   호출부가 쓰는 건 `saved.id` 뿐이라 category 를 되받을 이유가 없고, 컬럼을 안 실으면
      //   쓰기 경로에서 42703 폴백이 아예 발동하지 않는다 — "쓰기+RETURNING 재시도가 행을 두 번
      //   만들지 않는다"는 (실 DB 로 재현하지 않은) 논증에 기댈 필요 자체가 사라진다.
      //   덤으로 마이그레이션 전 '자유' 글 게시가 불필요한 재시도 왕복을 안 탄다.
      .select(DETAIL_COLUMNS)
      .single()
      .returns<PostWithAuthor>()
  );
};

export const updatePost = async (
  client: CommunityClient,
  postId: string,
  patch: {
    title?: string;
    description?: string | null;
    body?: string | null;
    payload?: PostPayload | null;
    isPublic?: boolean;
    /** 분류 변경. **바뀌었을 때만** 넘긴다(무변경 수정은 키를 생략해 컬럼 부재 환경에서도 안전). */
    category?: PostCategory;
  }
): Promise<PostWithAuthor> =>
  unwrap(
    await client
      .from('posts')
      .update({
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.description !== undefined ? { description: patch.description } : {}),
        ...(patch.body !== undefined ? { body: patch.body } : {}),
        // payload를 바꿀 때만 요약도 함께 갱신한다(재첨부=새 숫자, 해제=null).
        // payload를 안 건드리는 수정(제목/본문만)은 sim_summary 키 자체를 보내지 않아
        // 게시 시점 숫자가 보존된다 — 읽기·수정 경로의 임의 재계산 금지 원칙.
        ...(patch.payload !== undefined ? { payload: patch.payload, sim_summary: toSimSummary(patch.payload) } : {}),
        ...(patch.isPublic !== undefined ? { is_public: patch.isPublic } : {}),
        ...(patch.category !== undefined ? { category: patch.category } : {})
      })
      .eq('id', postId)
      // 쓰기 RETURNING 은 낙관적 컬럼 없이 고정 — publishPost 의 주석과 같은 이유.
      .select(DETAIL_COLUMNS)
      .single()
      .returns<PostWithAuthor>()
  );

/** RLS가 본인 것만 지우게 한다 — 남의 id를 넣으면 0건 삭제(에러 아님). */
export const deletePost = async (client: CommunityClient, postId: string): Promise<void> => {
  const { error } = await client.from('posts').delete().eq('id', postId);
  if (error) throw new Error(error.message);
};

// ── 좋아요 ──────────────────────────────────────────────────────────────────

/** 반환값: true = 좋아요 켜짐. 중복 좋아요는 서버 복합 PK가 막는다. */
export const togglePostLike = async (client: CommunityClient, postId: string): Promise<boolean> =>
  unwrap(await client.rpc('toggle_post_like', { p_post_id: postId }));

export const toggleCommentLike = async (client: CommunityClient, commentId: string): Promise<boolean> =>
  unwrap(await client.rpc('toggle_comment_like', { p_comment_id: commentId }));

/** 목록에 하트를 채우기 위해 "내가 좋아요한 시나리오 id"를 한 번에 조회한다. */
export const fetchMyPostLikes = async (
  client: CommunityClient,
  userId: string,
  postIds: readonly string[]
): Promise<Set<string>> => {
  if (postIds.length === 0) return new Set();
  const rows = unwrap(
    await client
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds as string[])
      .returns<{ post_id: string }[]>()
  );
  return new Set(rows.map((row) => row.post_id));
};

export const fetchMyCommentLikes = async (
  client: CommunityClient,
  userId: string,
  commentIds: readonly string[]
): Promise<Set<string>> => {
  if (commentIds.length === 0) return new Set();
  const rows = unwrap(
    await client
      .from('comment_likes')
      .select('comment_id')
      .eq('user_id', userId)
      .in('comment_id', commentIds as string[])
      .returns<{ comment_id: string }[]>()
  );
  return new Set(rows.map((row) => row.comment_id));
};

// ── 조회수 ──────────────────────────────────────────────────────────────────

const VIEWER_TOKEN_KEY = 'snowball:viewer-token';

/**
 * 익명 뷰어 토큰 (localStorage).
 *
 * 서버는 로그인 사용자면 auth.uid()를, 아니면 IP를 우선 쓴다. 이 토큰은 IP 헤더를
 * 못 읽을 때의 마지막 폴백이라, 지우고 다시 만든다고 조회수가 뻥튀기되지는 않는다.
 * (localStorage를 못 쓰는 환경에서도 죽지 않아야 한다 — 사파리 프라이빗 등)
 */
export const getViewerToken = (): string | null => {
  try {
    const existing = window.localStorage.getItem(VIEWER_TOKEN_KEY);
    if (existing) return existing;

    const token =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    window.localStorage.setItem(VIEWER_TOKEN_KEY, token);
    return token;
  } catch {
    return null;
  }
};

/**
 * 조회수 등록. 반환값은 갱신된 view_count.
 * 같은 뷰어가 1시간 내 다시 불러도 숫자는 그대로다 (서버 dedupe).
 */
export const registerPostView = async (client: CommunityClient, postId: string): Promise<number> =>
  unwrap(
    await client.rpc('register_post_view', {
      p_post_id: postId,
      p_client_token: getViewerToken()
    })
  );

// ── 댓글 ────────────────────────────────────────────────────────────────────

export type CommentsPage = {
  /** 이번 페이지의 루트 + 그 루트들의 대댓글(플랫). 트리 구성은 buildCommentTree로. */
  comments: CommentWithAuthor[];
  nextCursor: CommentCursor | null;
};

/**
 * 댓글 페이지 — 루트 댓글 keyset(created_at asc, id asc) 20개 + 로드된 루트의 대댓글 전부.
 * 삭제된 댓글도 내려온다 — 대댓글이 매달려 있으면 자리표시자로 보여줘야 하기 때문
 * (본문은 서버가 이미 ''로 파기했다). 트리 구성은 buildCommentTree(순수 함수)로 한다.
 */
export const fetchCommentsPage = async (
  client: CommunityClient,
  postId: string,
  options: { cursor?: CommentCursor | null; pageSize?: number } = {}
): Promise<CommentsPage> => {
  const pageSize = options.pageSize ?? COMMENTS_PAGE_SIZE;

  let rootsQuery = client
    .from('comments')
    .select(COMMENT_COLUMNS)
    .eq('post_id', postId)
    .is('parent_id', null);
  if (options.cursor) rootsQuery = rootsQuery.or(buildCommentKeysetFilter(options.cursor));

  // 다음 페이지 존재 여부를 알기 위해 1개 더 받는다 (갤러리와 동일)
  const rows = unwrap(
    await rootsQuery
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .limit(pageSize + 1)
      .returns<CommentWithAuthor[]>()
  );

  const { roots, nextCursor } = splitCommentRootsPage(rows, pageSize);
  if (roots.length === 0) return { comments: [], nextCursor: null };

  const replies = unwrap(
    await client
      .from('comments')
      .select(COMMENT_COLUMNS)
      .in('parent_id', roots.map((row) => row.id))
      .order('created_at', { ascending: true })
      .returns<CommentWithAuthor[]>()
  );

  return { comments: [...roots, ...replies], nextCursor };
};

/**
 * 보이는 댓글 총계(삭제 제외) — "댓글 N" 헤딩용. 서버 트리거가 유지하는
 * posts.comment_count와 같은 정의지만, 댓글 훅이 시나리오 행에 결합하지 않도록
 * comments 테이블에서 직접 센다(head:true — 행은 내려받지 않는다).
 */
export const fetchVisibleCommentCount = async (
  client: CommunityClient,
  postId: string
): Promise<number> => {
  const { count, error } = await client
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', postId)
    .is('deleted_at', null);
  if (error) throw new Error(error.message);
  return count ?? 0;
};

/** parentId를 주면 대댓글. 대댓글의 대댓글은 서버 트리거가 거부한다. */
export const createComment = async (
  client: CommunityClient,
  input: { postId: string; body: string; parentId?: string | null }
): Promise<CommentWithAuthor> =>
  unwrap(
    await client
      .from('comments')
      .insert({
        post_id: input.postId,
        body: input.body,
        parent_id: input.parentId ?? null
      })
      .select(COMMENT_COLUMNS)
      .single()
      .returns<CommentWithAuthor>()
  );

export const updateComment = async (
  client: CommunityClient,
  commentId: string,
  body: string
): Promise<CommentWithAuthor> =>
  unwrap(
    await client
      .from('comments')
      .update({ body })
      .eq('id', commentId)
      .select(COMMENT_COLUMNS)
      .single()
      .returns<CommentWithAuthor>()
  );

/**
 * 소프트 삭제. 하드 삭제는 서버가 아예 허용하지 않는다(DELETE 권한 없음) —
 * 대댓글이 달린 댓글을 지우면 트리가 깨지기 때문.
 * deleted_at 값은 서버 트리거가 now()로 덮어쓰고 본문을 ''로 파기한다.
 */
export const softDeleteComment = async (client: CommunityClient, commentId: string): Promise<void> => {
  const { error } = await client
    .from('comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', commentId);
  if (error) throw new Error(error.message);
};
