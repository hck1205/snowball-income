import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildKeysetFilter,
  buildSearchFilter,
  decodeGalleryCursor,
  GALLERY_PAGE_SIZE,
  getGalleryOrderKeys,
  splitPage
} from './pagination';
import type {
  CommentWithAuthor,
  Database,
  GalleryPage,
  GallerySort,
  ScenarioListItem,
  ScenarioPayload,
  ScenarioWithAuthor
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

/** 갤러리 카드에 필요한 컬럼만. payload/body는 목록에서 제외한다 (행당 수십 KB → 대역폭 낭비). */
const LIST_COLUMNS = 'id,user_id,title,description,is_public,has_payload,like_count,view_count,comment_count,created_at,updated_at,author:profiles(id,display_name,avatar_url)';

/** 상세는 본문(body)과 시나리오 첨부(payload)까지 내려온다. */
const DETAIL_COLUMNS = `${LIST_COLUMNS},payload,body`;

const COMMENT_COLUMNS = 'id,scenario_id,user_id,parent_id,body,like_count,created_at,updated_at,deleted_at,author:profiles(id,display_name,avatar_url)';

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
 */
export const fetchGalleryPage = async (
  client: CommunityClient,
  options: { sort?: GallerySort; cursor?: string | null; pageSize?: number; query?: string; queryFilter?: string } = {}
): Promise<GalleryPage> => {
  const sort = options.sort ?? 'recent';
  const pageSize = options.pageSize ?? GALLERY_PAGE_SIZE;
  const cursor = decodeGalleryCursor(options.cursor);
  const searchFilter = buildSearchFilter(options.query, options.queryFilter);

  let query = client.from('scenarios').select(LIST_COLUMNS).eq('is_public', true);

  if (searchFilter) query = query.or(searchFilter);
  if (cursor) query = query.or(buildKeysetFilter(sort, cursor));

  for (const key of getGalleryOrderKeys(sort)) {
    query = query.order(key.column, { ascending: key.ascending });
  }

  // 다음 페이지 존재 여부를 알기 위해 1개 더 받는다
  const rows = unwrap(await query.limit(pageSize + 1).returns<ScenarioListItem[]>());

  return splitPage(rows, pageSize, sort);
};

export const fetchScenarioDetail = async (
  client: CommunityClient,
  scenarioId: string
): Promise<ScenarioWithAuthor> =>
  unwrap(
    await client
      .from('scenarios')
      .select(DETAIL_COLUMNS)
      .eq('id', scenarioId)
      .single()
      .returns<ScenarioWithAuthor>()
  );

export const fetchMyScenarios = async (client: CommunityClient, userId: string): Promise<ScenarioListItem[]> =>
  unwrap(
    await client
      .from('scenarios')
      .select(LIST_COLUMNS)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .returns<ScenarioListItem[]>()
  );

/**
 * 글 게시. 하이브리드 모델이라 payload/body 둘 다 선택적이다:
 *   - 자유 글        : body만 (payload 없음)
 *   - 시나리오 공유   : payload만 (body 없음)
 *   - 둘 다          : body + payload
 * 서버 CHECK(scenarios_payload_valid_or_null)가 payload NULL을 허용한다.
 */
export const publishScenario = async (
  client: CommunityClient,
  input: {
    title: string;
    description?: string | null;
    body?: string | null;
    payload?: ScenarioPayload | null;
    isPublic?: boolean;
  }
): Promise<ScenarioWithAuthor> =>
  unwrap(
    await client
      .from('scenarios')
      .insert({
        title: input.title,
        description: input.description ?? null,
        body: input.body ?? null,
        payload: input.payload ?? null,
        // 기본은 비공개. 공개는 사용자가 명시적으로 선택할 때만 (서버 기본값과 동일한 철학)
        is_public: input.isPublic ?? false
      })
      .select(DETAIL_COLUMNS)
      .single()
      .returns<ScenarioWithAuthor>()
  );

export const updateScenario = async (
  client: CommunityClient,
  scenarioId: string,
  patch: {
    title?: string;
    description?: string | null;
    body?: string | null;
    payload?: ScenarioPayload | null;
    isPublic?: boolean;
  }
): Promise<ScenarioWithAuthor> =>
  unwrap(
    await client
      .from('scenarios')
      .update({
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.description !== undefined ? { description: patch.description } : {}),
        ...(patch.body !== undefined ? { body: patch.body } : {}),
        ...(patch.payload !== undefined ? { payload: patch.payload } : {}),
        ...(patch.isPublic !== undefined ? { is_public: patch.isPublic } : {})
      })
      .eq('id', scenarioId)
      .select(DETAIL_COLUMNS)
      .single()
      .returns<ScenarioWithAuthor>()
  );

/** RLS가 본인 것만 지우게 한다 — 남의 id를 넣으면 0건 삭제(에러 아님). */
export const deleteScenario = async (client: CommunityClient, scenarioId: string): Promise<void> => {
  const { error } = await client.from('scenarios').delete().eq('id', scenarioId);
  if (error) throw new Error(error.message);
};

// ── 좋아요 ──────────────────────────────────────────────────────────────────

/** 반환값: true = 좋아요 켜짐. 중복 좋아요는 서버 복합 PK가 막는다. */
export const toggleScenarioLike = async (client: CommunityClient, scenarioId: string): Promise<boolean> =>
  unwrap(await client.rpc('toggle_scenario_like', { p_scenario_id: scenarioId }));

export const toggleCommentLike = async (client: CommunityClient, commentId: string): Promise<boolean> =>
  unwrap(await client.rpc('toggle_comment_like', { p_comment_id: commentId }));

/** 목록에 하트를 채우기 위해 "내가 좋아요한 시나리오 id"를 한 번에 조회한다. */
export const fetchMyScenarioLikes = async (
  client: CommunityClient,
  userId: string,
  scenarioIds: readonly string[]
): Promise<Set<string>> => {
  if (scenarioIds.length === 0) return new Set();
  const rows = unwrap(
    await client
      .from('scenario_likes')
      .select('scenario_id')
      .eq('user_id', userId)
      .in('scenario_id', scenarioIds as string[])
      .returns<{ scenario_id: string }[]>()
  );
  return new Set(rows.map((row) => row.scenario_id));
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
export const registerScenarioView = async (client: CommunityClient, scenarioId: string): Promise<number> =>
  unwrap(
    await client.rpc('register_scenario_view', {
      p_scenario_id: scenarioId,
      p_client_token: getViewerToken()
    })
  );

// ── 댓글 ────────────────────────────────────────────────────────────────────

/**
 * 시나리오의 모든 댓글(플랫). 트리 구성은 buildCommentTree(순수 함수)로 한다.
 * 삭제된 댓글도 내려온다 — 대댓글이 매달려 있으면 자리표시자로 보여줘야 하기 때문
 * (본문은 서버가 이미 ''로 파기했다).
 */
export const fetchComments = async (
  client: CommunityClient,
  scenarioId: string
): Promise<CommentWithAuthor[]> =>
  unwrap(
    await client
      .from('comments')
      .select(COMMENT_COLUMNS)
      .eq('scenario_id', scenarioId)
      .order('created_at', { ascending: true })
      .returns<CommentWithAuthor[]>()
  );

/** parentId를 주면 대댓글. 대댓글의 대댓글은 서버 트리거가 거부한다. */
export const createComment = async (
  client: CommunityClient,
  input: { scenarioId: string; body: string; parentId?: string | null }
): Promise<CommentWithAuthor> =>
  unwrap(
    await client
      .from('comments')
      .insert({
        scenario_id: input.scenarioId,
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
