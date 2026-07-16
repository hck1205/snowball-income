import type { PersistedInvestmentSettings, PersistedScenarioState } from '@/jotai/snowball/types';
import type { PortfolioPersistedState } from '@/shared/types/snowball';

/**
 * DB 행 타입.
 *
 * 지금은 손으로 썼지만 `supabase gen types typescript` 출력과 같은 형태를 유지한다
 * (Database → public → Tables/Functions). 나중에 CLI 생성물로 바꿔치기할 수 있도록.
 *
 * ⚠ supabase/migrations/20260714000000_community.sql 과 반드시 동기화되어야 한다.
 */

/**
 * 서버에 저장되는 시나리오 페이로드.
 *
 * 앱의 PersistedScenarioState와 같은 형태지만 id/name은 선택적이다:
 *   - id: 클라이언트 로컬 탭 id라 서버에선 의미가 없다
 *   - name: 서버에선 scenarios.title이 정본이다
 * 서버 CHECK 제약(is_valid_scenario_payload)이 portfolio/investmentSettings 존재를 강제한다.
 *
 * 타입 전용 import라 런타임 의존성은 없다 (jotai 모듈이 번들에 끌려오지 않는다).
 */
export type ScenarioPayload = {
  id?: string;
  name?: string;
  portfolio: PortfolioPersistedState;
  investmentSettings: PersistedInvestmentSettings;
};

export type { PersistedScenarioState };

export type ProfileRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ScenarioRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  /**
   * 자유 글 본문 (Tiptap 리치 HTML). Stage 2 하이브리드 글 모델에서 추가됐다.
   * 기존 행/시나리오-only 글에는 없으므로 nullable. 서버 CHECK(scenarios_body_len)가 64KB 상한.
   */
  body: string | null;
  /**
   * 시나리오 첨부. Stage 2부터 **선택적**이다 — 본문만 있는 자유 글은 payload가 null이다.
   * (마이그레이션 20260715000000에서 NOT NULL을 풀고 CHECK를 "NULL 허용"으로 완화했다.)
   * 소비 측은 반드시 null 가드 후 fromScenarioPayload에 넘길 것.
   */
  payload: ScenarioPayload | null;
  is_public: boolean;
  /**
   * payload 첨부 여부. 서버 생성 컬럼(generated always as (payload is not null) stored)이다.
   * 목록 카드가 무거운 payload 없이 "자유 글 vs 시뮬 첨부 글" 배지를 그릴 수 있게 한다.
   * generated STORED라 클라이언트가 write할 수 없다 → Insert/Update에는 넣지 않는다.
   */
  has_payload: boolean;
  /** 트리거로만 갱신된다. 클라이언트는 UPDATE 권한이 없다. */
  like_count: number;
  view_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
};

export type CommentRow = {
  id: string;
  scenario_id: string;
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

export type ScenarioLikeRow = {
  scenario_id: string;
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

export type ScenarioWithAuthor = ScenarioRow & { author: CommunityAuthor | null };
export type CommentWithAuthor = CommentRow & { author: CommunityAuthor | null };

/** 갤러리 카드에 필요한 최소 필드 (payload/body를 빼서 목록 응답을 가볍게 유지 — 목록은 description 요약만). */
export type ScenarioListItem = Omit<ScenarioRow, 'payload' | 'body'> & { author: CommunityAuthor | null };

export type GallerySort = 'recent' | 'popular';

export type GalleryCursor = {
  createdAt: string;
  id: string;
  /** popular 정렬에서만 쓰인다. */
  likeCount?: number;
};

export type GalleryPage = {
  items: ScenarioListItem[];
  /** null이면 마지막 페이지. */
  nextCursor: string | null;
};

/**
 * supabase-js 제네릭용. `supabase gen types` 출력과 호환되는 형태.
 *
 * `Relationships`는 장식이 아니다 — PostgREST 임베드(`author:profiles(...)`)의 **타입 추론 근거**다.
 * FK 이름/참조 대상은 실제 DB에서 확인한 값이다 (scenarios_user_id_fkey → profiles.id).
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
      scenarios: {
        Row: ScenarioRow;
        // title만 필수. payload/body는 optional — 자유 글은 payload 없이, 시나리오-only 글은 body 없이 게시된다.
        Insert: Pick<ScenarioRow, 'title'> &
          Partial<Pick<ScenarioRow, 'user_id' | 'description' | 'payload' | 'body' | 'is_public'>>;
        Update: Partial<Pick<ScenarioRow, 'title' | 'description' | 'payload' | 'body' | 'is_public'>>;
        Relationships: [
          {
            foreignKeyName: 'scenarios_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      comments: {
        Row: CommentRow;
        Insert: Pick<CommentRow, 'scenario_id' | 'body'> & Partial<Pick<CommentRow, 'user_id' | 'parent_id'>>;
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
            foreignKeyName: 'comments_scenario_id_fkey';
            columns: ['scenario_id'];
            isOneToOne: false;
            referencedRelation: 'scenarios';
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
      scenario_likes: {
        Row: ScenarioLikeRow;
        Insert: Pick<ScenarioLikeRow, 'scenario_id'> & Partial<Pick<ScenarioLikeRow, 'user_id'>>;
        /** 좋아요 행은 수정할 수 없다 (서버에 UPDATE 정책/권한이 없다). */
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: 'scenario_likes_scenario_id_fkey';
            columns: ['scenario_id'];
            isOneToOne: false;
            referencedRelation: 'scenarios';
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
    };
    Views: Record<never, never>;
    Functions: {
      toggle_scenario_like: {
        Args: { p_scenario_id: string };
        /** true = 좋아요 켜짐, false = 꺼짐 */
        Returns: boolean;
      };
      toggle_comment_like: {
        Args: { p_comment_id: string };
        Returns: boolean;
      };
      register_scenario_view: {
        Args: { p_scenario_id: string; p_client_token?: string | null };
        /** 갱신된 view_count */
        Returns: number;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
