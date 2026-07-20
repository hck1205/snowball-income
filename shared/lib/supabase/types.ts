import type { PersistedAppStatePayload, PersistedInvestmentSettings, PersistedScenarioState } from '@/jotai/snowball/types';
import type { ScenarioSimSummary } from '@/shared/lib/snowball';
import type { PortfolioPersistedState } from '@/shared/types/snowball';

/**
 * DB 행 타입.
 *
 * 지금은 손으로 썼지만 `supabase gen types typescript` 출력과 같은 형태를 유지한다
 * (Database → public → Tables/Functions). 나중에 CLI 생성물로 바꿔치기할 수 있도록.
 *
 * ⚠ supabase/migrations/20260714000000_community.sql (및 이후 append 마이그레이션,
 *   특히 20260723…_rename_scenarios_to_posts / 20260724…_add_post_kind) 과 동기화되어야 한다.
 */

/**
 * 서버에 저장되는 시나리오 페이로드.
 *
 * 앱의 PersistedScenarioState와 같은 형태지만 id/name은 선택적이다:
 *   - id: 클라이언트 로컬 탭 id라 서버에선 의미가 없다
 *   - name: 서버에선 posts.title이 정본이다
 * 서버 CHECK 제약(is_valid_post_payload)이 portfolio/investmentSettings 존재를 강제한다.
 *
 * 타입 전용 import라 런타임 의존성은 없다 (jotai 모듈이 번들에 끌려오지 않는다).
 */
export type PostPayload = {
  id?: string;
  name?: string;
  portfolio: PortfolioPersistedState;
  investmentSettings: PersistedInvestmentSettings;
};

export type { PersistedScenarioState };

/**
 * 글 종류 (마이그레이션 20260724000000).
 *   - 'portfolio' : 갤러리(포트폴리오/시나리오 공유글). 기존 글 전부가 여기 속한다(default).
 *   - 'board'     : 자유게시판 글(질문·잡담·건의 등, 본문 위주 + 선택적 시나리오 첨부).
 * 갤러리/게시판 조회는 이 값으로 서로를 격리한다(fetchGalleryPage=portfolio, fetchBoardPage=board).
 */
export type PostKind = 'portfolio' | 'board';

/**
 * 자유게시판 글 분류 (마이그레이션 20260726000000 → 20260727000000 에서 5종으로 확장).
 * DB 에는 **영어 슬러그**로 저장하고 화면 라벨(한국어)은
 * `COMMUNITY_COPY.write.categoryLabels` 가 소유한다.
 *   - 'free'       : 자유(기본값). 기존 글 전부가 여기 속한다.
 *   - 'question'   : 질문과 고민 — 답을 구하는 글.
 *   - 'insight'    : 인사이트 — 분석·컬럼처럼 알게 된 것을 나누는 글.
 *   - 'suggestion' : 건의사항.
 *   - 'notice'     : 공지 — **운영자에게만 선택지로 노출된다(UI 수준 제한, RLS 강제 아님)**.
 *
 * `kind`(표면)와 직교한다: 갤러리 글(kind='portfolio')은 이 값을 쓰지 않고 기본값으로 남는다.
 */
export type PostCategory = 'free' | 'question' | 'insight' | 'suggestion' | 'notice';

export type ProfileRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  /**
   * 운영자 여부 (마이그레이션 20260725000000). NOT NULL DEFAULT false.
   *
   * ⚠ **표시 힌트일 뿐 권한이 아니다** — 이 값에 걸린 RLS 정책은 없다(사용자 결정: 이번 차단은
   *   UI 수준만). 서버가 막아야 하는 동작을 이 불리언만으로 게이팅하지 말 것.
   * ⚠ 마이그레이션 실행 전에는 컬럼이 아예 없다. 그래서 `fetchMyProfile` 은 이 이름을 select
   *   목록에 넣지 않고(`select *`) 응답에서 `?? false` 로만 읽는다 — 컬럼 부재 = 일반 사용자.
   */
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type PostRow = {
  id: string;
  user_id: string;
  /**
   * 글 종류 (마이그레이션 20260724000000). NOT NULL DEFAULT 'portfolio' 라 기존 행은 전부
   * 'portfolio'. insert 시에만 지정 가능(update GRANT 없음 → 게시 후 종류 고정).
   */
  kind: PostKind;
  /**
   * 게시판 글 분류 (마이그레이션 20260726000000). NOT NULL DEFAULT 'free' 라 기존 행은 전부 'free'.
   *
   * ⚠ 마이그레이션 실행 전에는 컬럼이 아예 없다. 그래서 조회 경로(queries.ts)는 이 컬럼을 뺀
   *   컬럼셋으로 **재시도**하고, 소비 측은 값이 없으면 'free' 로 본다(`toPostCategory`).
   *
   * 그래서 타입도 **optional 이다** — 다른 NOT NULL 컬럼과 달리 런타임 부재가 정상 상태이기
   * 때문이다. optional 로 둬야 `post.category === 'notice'` 같은 직접 비교를 TS 가 막고
   * (마이그레이션 전 DB 에서 조용히 false 가 되는 버그), 소비처가 `toPostCategory` 경유를
   * 강제받는다. Insert/Update 는 이미 `Partial<Pick<…>>` 이라 영향 없다.
   */
  category?: PostCategory;
  title: string;
  description: string | null;
  /**
   * 자유 글 본문 (Tiptap 리치 HTML). Stage 2 하이브리드 글 모델에서 추가됐다.
   * 기존 행/시나리오-only 글에는 없으므로 nullable. 서버 CHECK(posts_body_len)가 64KB 상한.
   */
  body: string | null;
  /**
   * 시나리오 첨부. Stage 2부터 **선택적**이다 — 본문만 있는 자유 글은 payload가 null이다.
   * (마이그레이션 20260715000000에서 NOT NULL을 풀고 CHECK를 "NULL 허용"으로 완화했다.)
   * 소비 측은 반드시 null 가드 후 fromPostPayload에 넘길 것.
   */
  payload: PostPayload | null;
  is_public: boolean;
  /**
   * payload 첨부 여부. 서버 생성 컬럼(generated always as (payload is not null) stored)이다.
   * 목록 카드가 무거운 payload 없이 "자유 글 vs 시뮬 첨부 글" 배지를 그릴 수 있게 한다.
   * generated STORED라 클라이언트가 write할 수 없다 → Insert/Update에는 넣지 않는다.
   */
  has_payload: boolean;
  /**
   * 게시 시점 시뮬 요약 (jsonb, nullable — 마이그레이션 20260717000000).
   * 게시/수정 시 데이터 레이어가 `buildScenarioSimSummary(payload)`로 1회 계산해 저장하고,
   * 이후 재계산하지 않는다(표기 일치 — 카드·상세가 같은 숫자를 보여야 한다).
   *
   * 읽기 타입이 `unknown`인 이유: 다른 클라이언트가 임의 jsonb를 넣을 수 있어 신뢰하지 않는다.
   * 소비 측은 **반드시 `parseScenarioSimSummary`로 검증**해서 쓴다 — 오염 값은 null이 되고
   * UI는 텍스트 카드로 폴백한다(§E). `has_payload`와 독립: payload가 있어도 계산 불가면 NULL.
   */
  sim_summary: unknown;
  /** 트리거로만 갱신된다. 클라이언트는 UPDATE 권한이 없다. */
  like_count: number;
  view_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
};

/**
 * sim_summary에서 파생된 숫자 검색 facet 컬럼 (마이그레이션 20260717000001).
 *
 * generated always as (…) stored — **읽기 전용**이라 Insert/Update에 넣지 않는다
 * (Postgres가 쓰기를 거부한다). 카드/상세는 sim_summary jsonb를 표시에 쓰므로 이 컬럼들은
 * **표시용이 아니라 갤러리 정밀 검색 필터(.gte/.lte) 전용**이다 → 앱 도메인 타입(PostRow,
 * PostListItem, PostWithAuthor)에는 넣지 않고, PostgREST 필터의 컬럼 타입 근거로만
 * Database 제네릭 Row(PostDbRow)에 둔다. NULL = sim_summary 없음/키 없음/비숫자(graceful).
 * 값 정의는 shared/lib/snowball/SnowballScenarioSummary.ts scenarioSimSummarySchema와 1:1.
 */
export type PostSearchFacets = {
  /** sim_summary.finalMonthlyDividend 파생 (마지막 해 세후 월평균 배당, KRW). */
  final_monthly_dividend: number | null;
  /** sim_summary.targetMonthlyDividend 파생 (목표 월배당, KRW). */
  target_monthly_dividend: number | null;
  /** sim_summary.durationYears 파생 (시뮬 기간, 년). */
  duration_years: number | null;
};

/**
 * DB posts 테이블의 **실제** Row (generated facet 컬럼 포함) — `supabase gen types`의 Row에 해당.
 * 앱은 표시에 쓰는 컬럼만 PostRow로 큐레이션한다. 이 타입은 Database 제네릭에만 쓰여
 * `.gte('final_monthly_dividend', …)` 같은 필터가 타입 체크되게 하는 게 유일한 목적이다.
 */
export type PostDbRow = PostRow & PostSearchFacets;

export type CommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  /** null이면 최상위 댓글. 대댓글은 1단계까지만 (서버 트리거가 강제). */
  parent_id: string | null;
  /** 소프트 삭제되면 서버 트리거가 ''로 파기한다. */
  body: string;
  like_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/**
 * 개인 클라우드 저장 행 (마이그레이션 20260718000000, cloud-save-proposal §5).
 * 커뮤니티 posts와 분리 — 공개 개념 없이 owner-only.
 *
 * `payload`는 로컬과 **같은 스키마**(PersistedAppStatePayload)지만, 다른 클라이언트가 쓴 값일 수
 * 있어 신뢰하지 않는다. 읽기 소비 측은 **반드시 normalizePersistedAppState로 정규화**한 뒤 쓴다
 * (posts.payload와 같은 규율 — 서버 CHECK는 구조·크기만 본다).
 *
 * `name`: null = 자동 동기화 슬롯(1인 1개), not null = 이름 붙인 체크포인트.
 */
export type UserAppStateRow = {
  id: string;
  user_id: string;
  name: string | null;
  payload: PersistedAppStatePayload;
  created_at: string;
  updated_at: string;
};

/** "내 저장" 목록용 — 무거운 payload를 뺀 메타데이터만(posts 목록이 payload를 빼는 것과 같은 이유). */
export type UserAppStateSummary = Omit<UserAppStateRow, 'payload'>;

/**
 * 공유 스냅샷 payload 계약 (마이그레이션 20260720000000, 트랙 E).
 *
 * "Share" 버튼이 현재 active 시나리오 탭을 서버에 저장하고 `?s=<key>`로 공유한다.
 * OG 카드(api/og)도 **같은** payload를 소비하므로 형태를 바꾸면 양쪽을 함께 고쳐야 한다.
 *   - v        : 스키마 버전(현재 1). 필드가 늘면 optional+default로 올린다.
 *   - scenario : 공유된 활성 시나리오 한 개(id/name/portfolio/investmentSettings).
 *
 * ⚠ 서버는 payload 내용을 신뢰하지 않는다(다른 클라이언트가 임의 값 주입 가능) — 읽기 소비 측은
 *   scenario를 normalizePersistedAppState로 정규화한 뒤 쓴다(posts.payload와 같은 규율).
 */
export type SharedSnapshotEnvelope = {
  v: 1;
  scenario: PersistedScenarioState;
};

/**
 * 공유 스냅샷 행. key는 서버 생성(RPC), 클라이언트는 테이블에 직접 접근하지 않는다(RPC 전용).
 * `payload`는 신뢰하지 않는 jsonb지만, 편의상 계약 타입으로 표기한다(소비 측이 정규화 책임).
 */
export type SharedSnapshotRow = {
  key: string;
  payload: SharedSnapshotEnvelope;
  created_at: string;
  /** null = 무만료. */
  expires_at: string | null;
};

export type PostLikeRow = {
  post_id: string;
  user_id: string;
  created_at: string;
};

export type CommentLikeRow = {
  comment_id: string;
  user_id: string;
  created_at: string;
};

/** 작성자 프로필이 임베드된 형태 (PostgREST `select=*,author:profiles(...)`). */
export type CommunityAuthor = Pick<ProfileRow, 'id' | 'display_name' | 'avatar_url'>;

/**
 * **내** 프로필 — 작성자 임베드(CommunityAuthor)보다 한 필드 넓다.
 *
 * `is_admin` 을 CommunityAuthor 에 넣지 않은 이유: 목록/상세의 작성자 임베드
 * (`author:profiles(id,display_name,avatar_url)`)는 컬럼을 **명시 나열**하므로 그 타입에
 * is_admin 이 생기면 임베드 select 도 전부 고쳐야 하고, 그 순간 마이그레이션 미실행 환경에서
 * 갤러리/상세가 42703 으로 통째로 죽는다. 관리자 여부는 "내 프로필"에서만 필요하므로 분리한다.
 */
export type MyProfile = CommunityAuthor & Pick<ProfileRow, 'is_admin'>;

export type PostWithAuthor = PostRow & { author: CommunityAuthor | null };
export type CommentWithAuthor = CommentRow & { author: CommunityAuthor | null };

/** 갤러리 카드에 필요한 최소 필드 (payload/body를 빼서 목록 응답을 가볍게 유지 — 목록은 description 요약만). */
export type PostListItem = Omit<PostRow, 'payload' | 'body'> & { author: CommunityAuthor | null };

export type GallerySort = 'recent' | 'popular';

/**
 * 갤러리 "정밀 검색" 숫자 facet 필터 — **프런트 계약**. 전 필드 optional, 미지정=무필터.
 * 단위는 canonical: 금액=**원(KRW)**, 기간=**년**. UI는 만원/년으로 표기하되 여기엔 원/년으로 넘긴다.
 *   - monthlyMin/monthlyMax : 최종(마지막 해) 월배당 range  → final_monthly_dividend gte/lte
 *   - targetMin             : 목표 월배당 **이상(≥) 단일**   → target_monthly_dividend gte
 *   - durationMin/durationMax: 투자기간(년) range           → duration_years gte/lte
 * sim_summary가 없는 글(자유 글 등)은 facet이 NULL이라 어떤 range 필터든 자동 제외된다
 * (필터를 하나도 안 걸면 무영향 — 기존 목록 그대로). 티커 필터는 G2(후속) 범위로 여기 없다.
 */
export type GalleryFacetFilters = {
  monthlyMin?: number;
  monthlyMax?: number;
  targetMin?: number;
  durationMin?: number;
  durationMax?: number;
};

export type GalleryCursor = {
  createdAt: string;
  id: string;
  /** popular 정렬에서만 쓰인다. */
  likeCount?: number;
};

export type GalleryPage = {
  items: PostListItem[];
  /** null이면 마지막 페이지. */
  nextCursor: string | null;
};

/**
 * supabase-js 제네릭용. `supabase gen types` 출력과 호환되는 형태.
 *
 * `Relationships`는 장식이 아니다 — PostgREST 임베드(`author:profiles(...)`)의 **타입 추론 근거**다.
 * FK 이름/참조 대상은 실제 DB에서 확인한 값이다 (posts_user_id_fkey → profiles.id).
 * auth 스키마를 가리키는 FK(profiles.id → auth.users)는 public 밖이라 목록에 넣지 않는다.
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Pick<ProfileRow, 'id' | 'display_name'> & Partial<Pick<ProfileRow, 'avatar_url'>>;
        Update: Partial<Pick<ProfileRow, 'display_name' | 'avatar_url'>>;
        Relationships: [];
      };
      posts: {
        // Row는 generated facet 컬럼까지 포함한 실제 DB Row(PostDbRow) — .gte/.lte 필터 타입 근거.
        // 앱 프로젝션(PostListItem/PostWithAuthor)은 여전히 PostRow 기반이라 무영향.
        Row: PostDbRow;
        // title만 필수. payload/body는 optional — 자유 글은 payload 없이, 시나리오-only 글은 body 없이 게시된다.
        // kind는 optional(서버 default 'portfolio') — 게시판 글만 명시적으로 'board'로 넣는다. Update엔 없다(종류 고정).
        // sim_summary는 읽기(unknown)와 달리 쓰기 쪽 타입을 조인다 — 데이터 레이어가 만든 검증된 요약만 저장.
        // category는 Insert/Update 양쪽에 있다(kind와 다른 점) — 분류는 사후 수정이 허용된다.
        Insert: Pick<PostRow, 'title'> &
          Partial<
            Pick<PostRow, 'user_id' | 'kind' | 'category' | 'description' | 'payload' | 'body' | 'is_public'>
          > &
          Partial<{ sim_summary: ScenarioSimSummary | null }>;
        Update: Partial<Pick<PostRow, 'title' | 'category' | 'description' | 'payload' | 'body' | 'is_public'>> &
          Partial<{ sim_summary: ScenarioSimSummary | null }>;
        Relationships: [
          {
            foreignKeyName: 'posts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      comments: {
        Row: CommentRow;
        Insert: Pick<CommentRow, 'post_id' | 'body'> & Partial<Pick<CommentRow, 'user_id' | 'parent_id'>>;
        /** 수정 가능한 컬럼은 body/deleted_at뿐 (서버 컬럼 GRANT와 일치). */
        Update: Partial<Pick<CommentRow, 'body' | 'deleted_at'>>;
        Relationships: [
          {
            foreignKeyName: 'comments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comments_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comments_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'comments';
            referencedColumns: ['id'];
          }
        ];
      };
      post_likes: {
        Row: PostLikeRow;
        Insert: Pick<PostLikeRow, 'post_id'> & Partial<Pick<PostLikeRow, 'user_id'>>;
        /** 좋아요 행은 수정할 수 없다 (서버에 UPDATE 정책/권한이 없다). */
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: 'post_likes_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          }
        ];
      };
      comment_likes: {
        Row: CommentLikeRow;
        Insert: Pick<CommentLikeRow, 'comment_id'> & Partial<Pick<CommentLikeRow, 'user_id'>>;
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: 'comment_likes_comment_id_fkey';
            columns: ['comment_id'];
            isOneToOne: false;
            referencedRelation: 'comments';
            referencedColumns: ['id'];
          }
        ];
      };
      user_app_states: {
        Row: UserAppStateRow;
        // payload만 필수. name/user_id는 서버 default가 채운다(name null=자동 슬롯, user_id=auth.uid()).
        // 컬럼 GRANT가 user_id/timestamps 쓰기를 막으므로 Insert 타입도 그에 맞춘다.
        Insert: Pick<UserAppStateRow, 'payload'> & Partial<Pick<UserAppStateRow, 'name' | 'user_id'>>;
        Update: Partial<Pick<UserAppStateRow, 'name' | 'payload'>>;
        Relationships: [
          {
            foreignKeyName: 'user_app_states_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      shared_snapshots: {
        // 클라이언트는 테이블에 직접 접근하지 않는다(SECURITY DEFINER RPC 전용) — 아래 타입은
        // `supabase gen types` 충실성 목적. key는 서버 생성이라 Insert에서 optional.
        Row: SharedSnapshotRow;
        Insert: Pick<SharedSnapshotRow, 'payload'> & Partial<Pick<SharedSnapshotRow, 'key' | 'expires_at'>>;
        Update: Partial<Pick<SharedSnapshotRow, 'payload' | 'expires_at'>>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      toggle_post_like: {
        Args: { p_post_id: string };
        /** true = 좋아요 켜짐, false = 꺼짐 */
        Returns: boolean;
      };
      toggle_comment_like: {
        Args: { p_comment_id: string };
        Returns: boolean;
      };
      register_post_view: {
        Args: { p_post_id: string; p_client_token?: string | null };
        /** 갱신된 view_count */
        Returns: number;
      };
      create_shared_snapshot: {
        Args: { p_payload: SharedSnapshotEnvelope };
        /** 서버 생성 key (URL-safe base64url, ~22자) */
        Returns: string;
      };
      get_shared_snapshot: {
        Args: { p_key: string };
        /** 공유 payload. 부재/만료 시 null. */
        Returns: SharedSnapshotEnvelope | null;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
