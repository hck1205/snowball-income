import { readSupabaseRestConfig } from './sharedSnapshotRest';

/**
 * 서버(api/) 전용 **공개 게시글** 조회 — PostgREST 를 **anon 키 plain REST** 로 직접 호출한다.
 *
 * api/sitemap.ts(동적 사이트맵)와 api/post-html.ts(상세 메타 ISR)가 공유한다.
 *
 * ## 왜 service_role 이 아니라 anon 키인가
 * `posts` 의 select 정책은 `is_public or user_id = auth.uid()`(20260714000000_community.sql:803) 이고
 * 테이블 GRANT 도 anon 에 열려 있다. 즉 **anon 키로 공개 글만** 읽는 것이 정확히 필요한 권한이고,
 * service_role 은 RLS 를 우회해 비공개 글까지 열어 버리므로 여기서는 **일부러 쓰지 않는다**
 * (서버 코드의 게이트 하나만 실수해도 비공개 포트폴리오가 엣지 캐시에 박제된다).
 * 그럼에도 쿼리에 `is_public=eq.true` 를 **명시**한다 — RLS 와 코드, 두 겹으로 막는다.
 *
 * ## 서버 세이프 규약 (sharedSnapshotRest.ts 와 동일)
 * 모듈 스코프에서 `import.meta.env` 를 읽지 않는다. env 는 전부 핸들러 실행 중 `process.env` 로 읽는다
 * (Vercel Node 런타임엔 import.meta.env 가 없어 모듈 평가 단계에서 함수가 즉사한다 — og.tsx 함정).
 * `@supabase/supabase-js` 도 끌어오지 않는다(엔트리 번들 격리 규율과 무관하게, 서버 함수도 가볍게 유지).
 */

/** 게시글 종류 — router/routes.tsx 의 `/community/portfolio` · `/community/board` 두 섹션에 대응한다. */
export type PublicPostKind = 'portfolio' | 'board';

export const PUBLIC_POST_KINDS: readonly PublicPostKind[] = ['portfolio', 'board'];

export const isPublicPostKind = (value: string | null): value is PublicPostKind =>
  value !== null && (PUBLIC_POST_KINDS as readonly string[]).includes(value);

/**
 * posts.id 는 uuid(gen_random_uuid) 다. 형식 검사는 두 가지를 동시에 한다:
 *   1) PostgREST 에 쓰레기 값을 던지지 않는다(uuid 캐스트 에러 = 400).
 *   2) `/community/portfolio/write` 처럼 **id 가 아닌 예약 세그먼트**를 라우팅 단계가 아니라 여기서 걸러낸다
 *      (그래서 글쓰기 화면이 "없는 글 404" 로 죽지 않는다 — api/post-html.ts 의 분기 참고).
 */
export const POST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 사이트맵 한 줄에 필요한 최소 필드. */
export type PublicPostRef = {
  id: string;
  kind: PublicPostKind;
  /** ISO timestamptz. `<lastmod>` 로 나간다. */
  updatedAt: string;
};

/** 목록 페이지 ISR 한 줄(제목·링크). 본문·요약은 필요 없다 — 크롤러가 상세 URL 을 발견하게만 한다. */
export type PublicPostListItem = {
  id: string;
  kind: PublicPostKind;
  title: string;
};

/** 상세 메타 치환에 필요한 필드. description 은 본문 자동 발췌(글쓰기 트랙 결정)라 없을 수 있다. */
export type PublicPostMeta = PublicPostRef & {
  title: string;
  description: string | null;
  /**
   * 본문 리치 HTML(Tiptap). **정화되지 않은 원본**이므로 서버 주입 전 반드시 `sanitizePostBody` 를
   * 통과시킨다(PR-B 본문 ISR). 첨부만 있는 포트폴리오 글은 빈 문자열일 수 있어 `null` 을 허용한다.
   */
  body: string | null;
  /**
   * 게시 시점에 굳은 시뮬 요약(`posts.sim_summary` jsonb) — **포트폴리오 글만 의미가 있고**, 그 외/부재는
   * null 이다. **raw unknown 으로만** 실어 나른다: 이 파일(및 이 파일이 들어가는 sitemap/post-html 번들)은
   * `@/shared/lib/snowball`(계산 엔진)을 절대 import 하지 않는다 — 파싱·매핑은 엔진을 이미 import 하는 og
   * 카드 레이어(pages/Main/utils/ogCard)에서 한다. post-html 은 presence(비-null object)만 보고 og:image 를
   * 켠다(malformed 면 og 엔드포인트가 파싱 실패로 기본 이미지에 폴백).
   */
  simSummary: unknown;
};

/**
 * 조회 결과는 **세 갈래**로 구분한다. 이 구분이 상세 ISR 의 캐시 정책을 가른다:
 *   - `ok`          : 공개 글이 실제로 있다 → 메타 치환 + 엣지 캐시.
 *   - `not-found`   : 글이 없거나 **비공개**다 → 404 + `no-store`(비공개를 엣지에 얹으면 URL 을 아는
 *                     누구에게나 노출된다).
 *   - `unavailable` : 일시적 조회 실패 / env 미설정 → **404 가 아니다**. 셸 200 + `no-store` 로 앱을 띄워
 *                     클라이언트가 알아서 처리하게 한다(장애를 "글 없음"으로 박제하지 않는다).
 */
export type PublicPostMetaResult =
  | { status: 'ok'; post: PublicPostMeta }
  | { status: 'not-found' }
  | { status: 'unavailable' };

const restHeaders = (anonKey: string): HeadersInit => ({
  apikey: anonKey,
  authorization: `Bearer ${anonKey}`,
  accept: 'application/json'
});

type PostRestRow = {
  id?: unknown;
  kind?: unknown;
  title?: unknown;
  description?: unknown;
  body?: unknown;
  sim_summary?: unknown;
  updated_at?: unknown;
};

const toRef = (row: PostRestRow): PublicPostRef | null => {
  const { id, kind, updated_at: updatedAt } = row;
  if (typeof id !== 'string' || !POST_ID_PATTERN.test(id)) return null;
  if (typeof kind !== 'string' || !isPublicPostKind(kind)) return null;
  if (typeof updatedAt !== 'string' || updatedAt.length === 0) return null;
  return { id, kind, updatedAt };
};

/** 목록 한 줄: id/kind 형식 + 비어 있지 않은 제목만 통과(updatedAt 은 목록에 불필요해 검증 안 함). */
const toListItem = (row: PostRestRow): PublicPostListItem | null => {
  const { id, kind, title } = row;
  if (typeof id !== 'string' || !POST_ID_PATTERN.test(id)) return null;
  if (typeof kind !== 'string' || !isPublicPostKind(kind)) return null;
  if (typeof title !== 'string' || title.length === 0) return null;
  return { id, kind, title };
};

/**
 * sitemaps.org 상한(파일당 **50,000 URL / 50MB 비압축**)을 의식한 방어선. 지금 규모(수십 건)에선 닿지
 * 않지만, 넘어서면 **페이지 분할이 필요**하다 — 그때는 `/api/sitemap` 이 `?page=N` 을 받아 `offset` 을
 * 걸고, 정적 `sitemap.xml`(sitemapindex)에 자식 항목을 늘린다(구조를 index 로 잡아둔 이유).
 */
export const SITEMAP_POST_LIMIT = 45_000;

/**
 * 사이트맵용 공개 글 목록. **어떤 실패도 throw 하지 않고 null** 로 흡수한다 — 조회 실패로 사이트맵이
 * 5xx 가 되면 색인이 통째로 멈추므로, 호출부가 빈 사이트맵이라도 200 으로 내보낼 수 있어야 한다.
 */
export const fetchPublicPostRefs = async (limit: number = SITEMAP_POST_LIMIT): Promise<PublicPostRef[] | null> => {
  const config = readSupabaseRestConfig();
  if (!config) return null;

  const query = new URLSearchParams({
    select: 'id,kind,updated_at',
    is_public: 'eq.true',
    order: 'updated_at.desc',
    limit: String(limit)
  });

  try {
    const response = await fetch(`${config.url}/rest/v1/posts?${query.toString()}`, {
      headers: restHeaders(config.anonKey)
    });
    if (!response.ok) return null;

    const rows = (await response.json().catch(() => null)) as PostRestRow[] | null;
    if (!Array.isArray(rows)) return null;

    return rows.map(toRef).filter((ref): ref is PublicPostRef => ref !== null);
  } catch {
    return null;
  }
};

/**
 * 상세 메타용 단건 조회. `kind` 까지 조건에 넣어 `/community/board/<포트폴리오 글 id>` 같은 **교차 경로**가
 * 성립하지 않게 한다(같은 글이 두 URL 로 색인되는 중복 콘텐츠 방지).
 */
export const fetchPublicPostMeta = async (kind: PublicPostKind, id: string): Promise<PublicPostMetaResult> => {
  if (!POST_ID_PATTERN.test(id)) return { status: 'not-found' };

  const config = readSupabaseRestConfig();
  if (!config) return { status: 'unavailable' };

  const query = new URLSearchParams({
    select: 'id,kind,title,description,body,sim_summary,updated_at',
    id: `eq.${id}`,
    kind: `eq.${kind}`,
    is_public: 'eq.true',
    limit: '1'
  });

  try {
    const response = await fetch(`${config.url}/rest/v1/posts?${query.toString()}`, {
      headers: restHeaders(config.anonKey)
    });
    if (!response.ok) return { status: 'unavailable' };

    const rows = (await response.json().catch(() => null)) as PostRestRow[] | null;
    if (!Array.isArray(rows)) return { status: 'unavailable' };
    // 빈 배열 = 없는 글 **또는 비공개 글**(RLS 가 걸러낸다). 둘 다 404 여야 한다 — 비공개인지
    // 없는 글인지 구분해 알려주면 그 자체가 존재 여부 누출이다.
    if (rows.length === 0) return { status: 'not-found' };

    const row = rows[0];
    const ref = toRef(row);
    if (!ref || typeof row.title !== 'string' || row.title.length === 0) return { status: 'unavailable' };

    return {
      status: 'ok',
      post: {
        ...ref,
        title: row.title,
        description: typeof row.description === 'string' && row.description.length > 0 ? row.description : null,
        // 문자열이 아니면(누락·null·비문자) null — 빈 body 도 정상(첨부만 있는 포트폴리오 글).
        body: typeof row.body === 'string' ? row.body : null,
        // raw jsonb 그대로(포트폴리오만 유의미). 파싱은 여기서 하지 않는다 — postsRest 서두의 엔진 미유입 규약.
        simSummary: row.sim_summary ?? null
      }
    };
  } catch {
    return { status: 'unavailable' };
  }
};

/**
 * `/api/og?post=<id>` 전용 — 공개 **포트폴리오** 글의 `sim_summary` raw jsonb 단건 조회.
 *
 * fetchPublicPostMeta 와 별도인 이유: og 카드는 메타(제목·본문)가 필요 없고 sim_summary 하나만 읽는다.
 * 게이트는 두 겹 + 종류 고정이다:
 *   - `is_public=eq.true` : RLS 와 별개로 코드에서도 공개 글만(비공개 포폴이 엣지 카드에 박제되지 않게).
 *   - `kind=eq.portfolio` : board 글엔 sim_summary 가 없다(portfolio 전용, 결정 2026-07-20).
 *   - `POST_ID_PATTERN`   : uuid 아닌 값을 PostgREST 에 던지지 않는다(400 회피).
 *
 * 실패/부재/env 미설정은 **전부 null**(throw 금지) — og 엔드포인트는 절대 5xx 를 내지 않는다.
 * 반환은 row 의 raw `sim_summary`(jsonb 그대로). 파싱·매핑은 호출자(ogCard 레이어)가 한다.
 */
export const fetchPublicPostSimSummary = async (id: string): Promise<unknown | null> => {
  if (!POST_ID_PATTERN.test(id)) return null;

  const config = readSupabaseRestConfig();
  if (!config) return null;

  const query = new URLSearchParams({
    select: 'sim_summary',
    id: `eq.${id}`,
    kind: 'eq.portfolio',
    is_public: 'eq.true',
    limit: '1'
  });

  try {
    const response = await fetch(`${config.url}/rest/v1/posts?${query.toString()}`, {
      headers: restHeaders(config.anonKey)
    });
    if (!response.ok) return null;

    const rows = (await response.json().catch(() => null)) as PostRestRow[] | null;
    if (!Array.isArray(rows) || rows.length === 0) return null;

    return rows[0].sim_summary ?? null;
  } catch {
    return null;
  }
};

/** 목록 ISR 기본 상한. 크롤러가 발견할 상세 URL 을 늘리되, 셸 크기와 조회 비용을 함께 억제한다. */
export const POST_LIST_LIMIT = 50;

/**
 * 목록 페이지 ISR 용 공개 글 목록. `fetchPublicPostRefs`(사이트맵)와 달리 **제목**을 포함한다.
 *
 * 사이트맵과 동일하게 **어떤 실패도 throw 하지 않고 null** 로 흡수한다 — 조회가 실패해도 호출부가 무치환
 * 셸 200 으로 내보낼 수 있어야 한다(목록 페이지가 5xx 로 죽으면 안 된다). RLS 에 더해 `is_public=eq.true`
 * 를 명시한다(두 겹 방어, postsRest 서두 참고).
 */
export const fetchPublicPostList = async (
  kind: PublicPostKind,
  limit: number = POST_LIST_LIMIT
): Promise<PublicPostListItem[] | null> => {
  const config = readSupabaseRestConfig();
  if (!config) return null;

  const query = new URLSearchParams({
    select: 'id,kind,title',
    kind: `eq.${kind}`,
    is_public: 'eq.true',
    order: 'updated_at.desc',
    limit: String(limit)
  });

  try {
    const response = await fetch(`${config.url}/rest/v1/posts?${query.toString()}`, {
      headers: restHeaders(config.anonKey)
    });
    if (!response.ok) return null;

    const rows = (await response.json().catch(() => null)) as PostRestRow[] | null;
    if (!Array.isArray(rows)) return null;

    return rows.map(toListItem).filter((item): item is PublicPostListItem => item !== null);
  } catch {
    return null;
  }
};
