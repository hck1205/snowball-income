/**
 * AI 리포터 계정으로 게시(2026-11-10).
 *
 * 🔴 권한: **이 계정의 비밀번호 로그인 세션**(`authenticated`)으로만 쓴다 — service_role 을 쓰지 않는다.
 *   그래서 RLS 가 그대로 적용되고, 이 자격증명이 새어도 할 수 있는 일은 "AI 리포터 이름으로 자기 글
 *   쓰기·지우기"뿐이다. 자격증명은 GitHub Actions 비밀값에만 있다(루틴·LLM 은 모른다).
 *
 * 필요한 환경변수: SUPABASE_URL · SUPABASE_ANON_KEY(공개키) · AI_REPORTER_EMAIL · AI_REPORTER_PASSWORD.
 */

export type ReporterEnv = {
  readonly supabaseUrl: string;
  readonly anonKey: string;
  readonly email: string;
  readonly password: string;
};

export const readReporterEnv = (env: NodeJS.ProcessEnv = process.env): ReporterEnv => {
  const missing = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'AI_REPORTER_EMAIL', 'AI_REPORTER_PASSWORD'].filter((key) => !env[key]);
  if (missing.length > 0) throw new Error(`환경변수 없음: ${missing.join(', ')}`);
  return {
    supabaseUrl: env.SUPABASE_URL!.replace(/\/+$/, ''),
    anonKey: env.SUPABASE_ANON_KEY!,
    email: env.AI_REPORTER_EMAIL!,
    password: env.AI_REPORTER_PASSWORD!
  };
};

type Session = { readonly accessToken: string; readonly userId: string };

const signIn = async (env: ReporterEnv, fetchImpl: typeof fetch): Promise<Session> => {
  const response = await fetchImpl(`${env.supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: env.anonKey, 'content-type': 'application/json' },
    body: JSON.stringify({ email: env.email, password: env.password })
  });
  // 🔴 응답 본문을 그대로 로그에 남기지 않는다(토큰이 들어 있다). 상태 코드만 말한다.
  if (!response.ok) throw new Error(`AI 리포터 로그인 실패: HTTP ${response.status}`);
  const data = (await response.json()) as { access_token?: string; user?: { id?: string } };
  if (!data.access_token || !data.user?.id) throw new Error('AI 리포터 로그인 응답에 토큰·user id 가 없다');
  return { accessToken: data.access_token, userId: data.user.id };
};

export type PostToPublish = {
  readonly title: string;
  readonly description: string;
  readonly body: string;
  /** 게시판 분류. 갤러리 글은 null — 키를 보내지 않아 DB 기본값을 쓴다. */
  readonly category: 'insight' | 'news' | null;
  readonly isPublic: boolean;
  /** 첨부. portfolio = 갤러리(시나리오 + 결과 요약), fire = 파이어족들(영상 링크 카드). 없으면 게시판 글. */
  readonly attachment?: { readonly kind: 'portfolio' | 'fire'; readonly payload: unknown; readonly simSummary?: unknown };
};

/**
 * 이미 올린 AI 리포터 글의 제목·요약·본문을 **고쳐 쓴다**(2026-11-11). 주소(id)·좋아요·댓글은 그대로다.
 * RLS 가 "자기 글만 수정"을 강제하므로 봇은 봇 글만 고칠 수 있다. 바뀐 행이 0개면 실패로 본다.
 */
export const updateReporterPost = async (
  env: ReporterEnv,
  postId: string,
  patch: { readonly title: string; readonly description: string; readonly body: string },
  fetchImpl: typeof fetch = fetch
): Promise<void> => {
  const session = await signIn(env, fetchImpl);
  const response = await fetchImpl(`${env.supabaseUrl}/rest/v1/posts?id=eq.${encodeURIComponent(postId)}`, {
    method: 'PATCH',
    headers: {
      apikey: env.anonKey,
      authorization: `Bearer ${session.accessToken}`,
      'content-type': 'application/json',
      prefer: 'return=representation'
    },
    body: JSON.stringify({ title: patch.title, description: patch.description, body: patch.body })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`수정 실패: HTTP ${response.status} ${detail.slice(0, 300)}`);
  }
  const rows = (await response.json()) as { id?: string }[];
  if (rows.length === 0) throw new Error(`수정 실패: 글 ${postId} 이 없거나 AI 리포터의 글이 아니다`);
};

/** 커뮤니티 글 한 편(게시판 또는 갤러리)을 쓰고 새 글 id 를 돌려준다. */
export const publishBoardPost = async (
  env: ReporterEnv,
  post: PostToPublish,
  fetchImpl: typeof fetch = fetch
): Promise<{ postId: string; userId: string }> => {
  const session = await signIn(env, fetchImpl);
  const response = await fetchImpl(`${env.supabaseUrl}/rest/v1/posts`, {
    method: 'POST',
    headers: {
      apikey: env.anonKey,
      authorization: `Bearer ${session.accessToken}`,
      'content-type': 'application/json',
      prefer: 'return=representation'
    },
    body: JSON.stringify({
      user_id: session.userId,
      kind: post.attachment ? post.attachment.kind : 'board',
      ...(post.category ? { category: post.category } : {}),
      ...(post.attachment ? { payload: post.attachment.payload } : {}),
      ...(post.attachment?.kind === 'portfolio' ? { sim_summary: post.attachment.simSummary } : {}),
      title: post.title,
      description: post.description,
      body: post.body,
      is_public: post.isPublic
    })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`게시 실패: HTTP ${response.status} ${detail.slice(0, 300)}`);
  }
  const rows = (await response.json()) as { id?: string }[];
  const postId = rows[0]?.id;
  if (!postId) throw new Error('게시 응답에 글 id 가 없다');
  return { postId, userId: session.userId };
};
