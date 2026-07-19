-- =============================================================================
-- snowball-income — 커뮤니티 엔티티 물리 rename: scenarios → posts
-- =============================================================================
--
-- 배경
-- ---------------------------------------------------------------------------
-- `scenarios` 테이블은 사실상 "커뮤니티 게시글"이다(포트폴리오 공유글 + 자유글
-- body-only 하이브리드). 콜드스타트(운영 데이터 없음) 시점에 이름을 바로잡는다.
-- 게시글 = post. 반면 시뮬레이터의 what-if 시나리오(user_app_states / shared_snapshots /
-- sim_summary / `?share=` 링크)는 진짜 "시나리오"라 **건드리지 않는다**.
--
-- 데이터 보존
-- ---------------------------------------------------------------------------
-- 전부 ALTER ... RENAME 이라 데이터/행/좋아요/조회수/댓글이 그대로 보존된다
-- (테이블 재작성 없음). 함수는 데이터가 없으므로 본문을 새 이름으로 재정의하고
-- 이전 이름을 drop 한다. **로직/동작은 불변** — 참조하는 테이블·컬럼 이름만 바뀐다.
-- raise exception 의 한국어 문구는 동작 불변을 위해 **원문 그대로** 둔다.
--
-- 원장(append-only) 원칙
-- ---------------------------------------------------------------------------
-- ⚠ 이전 마이그레이션(20260714… ~ 20260722…)은 **절대 수정하지 않는다.**
--   이 파일이 그 위에서 rename 으로 최종 상태를 만든다.
--
-- 멱등성 / 실행 안전(존재 가드)
-- ---------------------------------------------------------------------------
-- 테이블·인덱스·drop 은 IF EXISTS. 이름 변경만 지원하지 않는 대상(컬럼·제약·트리거·
-- 정책·함수 rename)은 카탈로그를 조회하는 DO 블록으로 "구 이름이 있을 때만" 바꾼다.
-- 재실행하면 구 이름이 이미 없어 전부 no-op → 안전.
--
-- ⚠ shared/lib/supabase/types.ts 와 동기화된다(PostRow / posts 테이블 키 / RPC 인자
--   p_post_id / FK 이름 posts_user_id_fkey·comments_post_id_fkey·post_likes_post_id_fkey).
-- ⚠ 배포 순서: **이 마이그레이션을 먼저 실행**한 뒤 새 클라이언트(posts/post_id/RPC
--   register_post_view·toggle_post_like 를 부르는)를 배포한다. 순서가 뒤집히면 구 스키마에
--   신 클라이언트가 붙어 404/42P01 이 난다.
-- =============================================================================

-- =============================================================================
-- 1. 테이블 rename (FK·트리거·정책·인덱스는 OID 로 따라온다 — 이름만 뒤에서 정리)
-- =============================================================================
alter table if exists public.scenarios      rename to posts;
alter table if exists public.scenario_likes rename to post_likes;
alter table if exists public.scenario_views rename to post_views;

-- =============================================================================
-- 2. FK 컬럼 rename: scenario_id → post_id (정책 표현식·FK·인덱스는 OID 로 따라온다)
-- =============================================================================
do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'comments' and column_name = 'scenario_id'
  ) then
    alter table public.comments rename column scenario_id to post_id;
  end if;

  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'post_likes' and column_name = 'scenario_id'
  ) then
    alter table public.post_likes rename column scenario_id to post_id;
  end if;

  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'post_views' and column_name = 'scenario_id'
  ) then
    alter table public.post_views rename column scenario_id to post_id;
  end if;
end;
$$;

-- =============================================================================
-- 3. 함수 재정의 — 참조 테이블/컬럼/인자 이름만 posts/post_id/p_post_id 로 교체
-- =============================================================================
-- plpgsql 본문은 텍스트라 테이블 rename 을 자동 반영하지 않는다 → 새 이름으로 재정의하고
-- 트리거를 재지정한 뒤 구 함수를 drop 한다. **로직 동일**(문구·상수·분기 불변).

-- 3a. 게시글 페이로드 검증 CHECK 함수 — 테이블 미참조(순수 jsonb)라 이름만 바꾼다.
--     CHECK 제약(posts_payload_valid_or_null)은 OID 로 참조하므로 rename 을 따라온다.
do $$
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'is_valid_scenario_payload'
  ) then
    alter function public.is_valid_scenario_payload(jsonb) rename to is_valid_post_payload;
  end if;
end;
$$;

-- 3b. 게시글 가시성 헬퍼(RLS 정책이 OID 로 참조) — 본문을 posts 참조로 replace 후 rename.
--     CREATE OR REPLACE 로 OID 를 유지해 정책/실행권한이 그대로 따라오게 한다
--     (인자명 p_scenario_id 는 OR REPLACE 로 못 바꾸므로 유지 — 내부 전용이라 무해).
create or replace function public.is_scenario_visible(p_scenario_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.posts s
     where s.id = p_scenario_id
       and (s.is_public or s.user_id = auth.uid())
  );
$$;

do $$
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'is_scenario_visible'
  ) then
    alter function public.is_scenario_visible(uuid) rename to is_post_visible;
  end if;
end;
$$;

grant execute on function public.is_post_visible(uuid) to anon, authenticated;

-- 3c. 게시글 개수 쿼터 트리거 함수.
create or replace function public.enforce_post_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.posts where user_id = new.user_id) >= 30 then
    raise exception '시나리오는 최대 30개까지 저장할 수 있습니다'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists scenarios_enforce_quota on public.posts;
drop trigger if exists posts_enforce_quota on public.posts;
create trigger posts_enforce_quota
  before insert on public.posts
  for each row execute function public.enforce_post_quota();

drop function if exists public.enforce_scenario_quota();

-- 3d. 좋아요 카운터 동기화 트리거 함수.
create or replace function public.sync_post_like_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts
       set like_count = like_count + 1
     where id = new.post_id;
    return new;
  else
    update public.posts
       set like_count = greatest(like_count - 1, 0)
     where id = old.post_id;
    return old;
  end if;
end;
$$;

drop trigger if exists scenario_likes_sync_count on public.post_likes;
drop trigger if exists post_likes_sync_count on public.post_likes;
create trigger post_likes_sync_count
  after insert or delete on public.post_likes
  for each row execute function public.sync_post_like_count();

drop function if exists public.sync_scenario_like_count();

-- 3e. 댓글 카운터 동기화 트리거 함수.
create or replace function public.sync_post_comment_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.deleted_at is null then
      update public.posts
         set comment_count = comment_count + 1
       where id = new.post_id;
    end if;
    return new;

  elsif tg_op = 'UPDATE' then
    if old.deleted_at is null and new.deleted_at is not null then
      update public.posts
         set comment_count = greatest(comment_count - 1, 0)
       where id = new.post_id;
    end if;
    return new;

  else -- DELETE (하드 삭제는 게시글/부모 CASCADE로만 발생)
    if old.deleted_at is null then
      update public.posts
         set comment_count = greatest(comment_count - 1, 0)
       where id = old.post_id;
    end if;
    return old;
  end if;
end;
$$;

drop trigger if exists comments_sync_scenario_count on public.comments;
drop trigger if exists comments_sync_post_count on public.comments;
create trigger comments_sync_post_count
  after insert or update or delete on public.comments
  for each row execute function public.sync_post_comment_count();

drop function if exists public.sync_scenario_comment_count();

-- 3f. 댓글 규칙 트리거 함수 — 이름은 유지(comment 도메인). post_id 참조만 교체.
--     트리거 comments_enforce_rules 는 같은 이름 함수를 계속 가리키므로 재지정 불필요.
create or replace function public.enforce_comment_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_parent_parent_id  uuid;
  v_parent_post       uuid;
  v_parent_deleted_at timestamptz;
  v_found             boolean := false;
begin
  -- 1) 스팸 레이트리밋: 1분에 10개 초과 금지.
  if (
    select count(*)
      from public.comments
     where user_id = new.user_id
       and created_at > now() - interval '1 minute'
  ) >= 10 then
    raise exception '댓글을 너무 빠르게 작성하고 있습니다. 잠시 후 다시 시도해 주세요'
      using errcode = 'check_violation';
  end if;

  -- 2) 대댓글 규칙
  if new.parent_id is not null then
    select c.parent_id, c.post_id, c.deleted_at, true
      into v_parent_parent_id, v_parent_post, v_parent_deleted_at, v_found
      from public.comments c
     where c.id = new.parent_id;

    if not v_found then
      raise exception '부모 댓글을 찾을 수 없습니다' using errcode = 'foreign_key_violation';
    end if;

    -- 핵심: 부모가 이미 대댓글이면 거부 → 중첩은 1단계까지만.
    if v_parent_parent_id is not null then
      raise exception '대댓글에는 다시 답글을 달 수 없습니다 (1단계까지만 허용)'
        using errcode = 'check_violation';
    end if;

    -- 다른 게시글의 댓글에 답글을 달아 트리를 교차시키는 걸 막는다.
    if v_parent_post <> new.post_id then
      raise exception '부모 댓글이 다른 시나리오에 속해 있습니다'
        using errcode = 'check_violation';
    end if;

    if v_parent_deleted_at is not null then
      raise exception '삭제된 댓글에는 답글을 달 수 없습니다'
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

-- 3g. 조회수 등록 RPC — 이름/인자/참조 테이블 교체(register_post_view, p_post_id).
create or replace function public.register_post_view(
  p_post_id      uuid,
  p_client_token text default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_public  boolean;
  v_salt       text;
  v_ip         text;
  v_viewer_key text;
  v_hash       text;
  v_bucket     timestamptz := date_trunc('hour', now());
  v_inserted   integer;
  v_count      bigint;
begin
  select s.is_public, s.view_count
    into v_is_public, v_count
    from public.posts s
   where s.id = p_post_id;

  if not found then
    raise exception '시나리오를 찾을 수 없습니다' using errcode = 'no_data_found';
  end if;

  -- 비공개 게시글은 조회수를 세지 않는다 (소유자가 자기 걸 열어보는 것도 카운트 X)
  if not v_is_public then
    return v_count;
  end if;

  select value into v_salt from private.app_config where key = 'view_hash_salt';

  begin
    v_ip := btrim(split_part(
      coalesce(
        nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for',
        ''
      ),
      ',', 1
    ));
  exception when others then
    v_ip := '';
  end;

  v_viewer_key := coalesce(
    'u:' || auth.uid()::text,
    nullif('i:' || v_ip, 'i:'),
    nullif('t:' || btrim(coalesce(p_client_token, '')), 't:'),
    'x:unknown'
  );

  v_hash := encode(sha256(convert_to(v_salt || '|' || v_viewer_key, 'utf8')), 'hex');

  insert into public.post_views (post_id, viewer_hash, view_bucket)
  values (p_post_id, v_hash, v_bucket)
  on conflict (post_id, viewer_hash, view_bucket) do nothing;

  get diagnostics v_inserted = row_count;

  -- 이미 이번 시간대에 본 뷰어면 카운트를 올리지 않는다 (= 새로고침 연타 무효)
  if v_inserted = 0 then
    return v_count;
  end if;

  update public.posts
     set view_count = view_count + 1
   where id = p_post_id
  returning view_count into v_count;

  return v_count;
end;
$$;

drop function if exists public.register_scenario_view(uuid, text);

-- 3h. 조회수 dedupe 정리(cron/관리자 전용).
create or replace function public.prune_post_views()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  delete from public.post_views
   where viewed_at < now() - interval '24 hours';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.prune_post_views() from public, anon, authenticated;

drop function if exists public.prune_scenario_views();

-- 3i. 좋아요 토글 RPC — 이름/인자/참조 테이블 교체(toggle_post_like, p_post_id).
create or replace function public.toggle_post_like(p_post_id uuid)
returns boolean          -- true = 좋아요 켜짐, false = 꺼짐
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다' using errcode = 'insufficient_privilege';
  end if;

  delete from public.post_likes
   where post_id = p_post_id and user_id = auth.uid();
  get diagnostics v_deleted = row_count;

  if v_deleted > 0 then
    return false;
  end if;

  -- INSERT는 RLS(post_likes_insert_own) + 복합 PK 둘 다 통과해야 한다
  insert into public.post_likes (post_id, user_id)
  values (p_post_id, auth.uid());

  return true;
end;
$$;

drop function if exists public.toggle_scenario_like(uuid);

-- =============================================================================
-- 4. RPC 실행 권한 재부여 (구 함수 drop 으로 사라진 GRANT 를 새 함수에 다시 건다)
-- =============================================================================
revoke all on function public.register_post_view(uuid, text) from public;
revoke all on function public.toggle_post_like(uuid)         from public;

grant execute on function public.register_post_view(uuid, text) to anon, authenticated;
grant execute on function public.toggle_post_like(uuid)         to authenticated;

-- =============================================================================
-- 5. 인덱스 이름 정리 (내용/정의 불변 — 이름만)
-- =============================================================================
alter index if exists public.scenarios_public_recent_idx     rename to posts_public_recent_idx;
alter index if exists public.scenarios_public_popular_idx     rename to posts_public_popular_idx;
alter index if exists public.scenarios_user_idx              rename to posts_user_idx;
alter index if exists public.scenario_likes_user_idx         rename to post_likes_user_idx;
alter index if exists public.comments_scenario_idx          rename to comments_post_idx;
alter index if exists public.scenario_views_viewed_at_idx   rename to post_views_viewed_at_idx;
alter index if exists public.scenarios_search_title_trgm       rename to posts_search_title_trgm;
alter index if exists public.scenarios_search_description_trgm rename to posts_search_description_trgm;
alter index if exists public.scenarios_public_final_md_idx  rename to posts_public_final_md_idx;
alter index if exists public.scenarios_public_target_md_idx rename to posts_public_target_md_idx;
alter index if exists public.scenarios_public_duration_idx  rename to posts_public_duration_idx;

-- =============================================================================
-- 6. 제약 이름 정리 (PK / FK / CHECK — 정의 불변, 이름만; types.ts Relationships 와 일치)
-- =============================================================================
do $$
declare
  r text[];
  rename_map constant text[][] := array[
    -- [table, old_constraint, new_constraint]
    ['posts',      'scenarios_pkey',                     'posts_pkey'],
    ['posts',      'scenarios_user_id_fkey',             'posts_user_id_fkey'],
    ['posts',      'scenarios_body_len',                 'posts_body_len'],
    ['posts',      'scenarios_payload_valid_or_null',    'posts_payload_valid_or_null'],
    ['posts',      'scenarios_sim_summary_shape',        'posts_sim_summary_shape'],
    ['comments',   'comments_scenario_id_fkey',          'comments_post_id_fkey'],
    ['post_likes', 'scenario_likes_pkey',                'post_likes_pkey'],
    ['post_likes', 'scenario_likes_scenario_id_fkey',    'post_likes_post_id_fkey'],
    ['post_likes', 'scenario_likes_user_id_fkey',        'post_likes_user_id_fkey'],
    ['post_views', 'scenario_views_pkey',                'post_views_pkey'],
    ['post_views', 'scenario_views_scenario_id_fkey',    'post_views_post_id_fkey']
  ];
begin
  foreach r slice 1 in array rename_map loop
    if exists (
      select 1
        from pg_constraint con
        join pg_class rel on rel.oid = con.conrelid
        join pg_namespace nsp on nsp.oid = rel.relnamespace
       where nsp.nspname = 'public'
         and rel.relname = r[1]
         and con.conname = r[2]
    ) then
      execute format('alter table public.%I rename constraint %I to %I', r[1], r[2], r[3]);
    end if;
  end loop;
end;
$$;

-- =============================================================================
-- 7. 트리거 이름 정리 (재정의하지 않은 것만 — 함수 불변 touch_updated_at)
-- =============================================================================
do $$
begin
  if exists (
    select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
     where c.relname = 'posts' and t.tgname = 'scenarios_touch_updated_at'
  ) then
    alter trigger scenarios_touch_updated_at on public.posts rename to posts_touch_updated_at;
  end if;
end;
$$;

-- =============================================================================
-- 8. 정책 이름 정리 (정의 불변 — 표현식은 컬럼/함수 OID 로 이미 posts·post_id·is_post_visible 참조)
-- =============================================================================
do $$
declare
  r text[];
  rename_map constant text[][] := array[
    -- [table, old_policy, new_policy]
    ['posts',      'scenarios_select_public_or_own', 'posts_select_public_or_own'],
    ['posts',      'scenarios_insert_own',           'posts_insert_own'],
    ['posts',      'scenarios_update_own',           'posts_update_own'],
    ['posts',      'scenarios_delete_own',           'posts_delete_own'],
    ['post_likes', 'scenario_likes_select_all',      'post_likes_select_all'],
    ['post_likes', 'scenario_likes_insert_own',      'post_likes_insert_own'],
    ['post_likes', 'scenario_likes_delete_own',      'post_likes_delete_own']
  ];
begin
  foreach r slice 1 in array rename_map loop
    if exists (
      select 1 from pg_policies
       where schemaname = 'public' and tablename = r[1] and policyname = r[2]
    ) then
      execute format('alter policy %I on public.%I rename to %I', r[2], r[1], r[3]);
    end if;
  end loop;
end;
$$;

-- =============================================================================
-- 끝. 요약: scenarios → posts 물리 rename (데이터 보존, 동작 불변)
-- =============================================================================
--   - 테이블: scenarios→posts, scenario_likes→post_likes, scenario_views→post_views
--   - 컬럼: comments/post_likes/post_views 의 scenario_id → post_id
--   - 함수: is_valid_post_payload / is_post_visible / enforce_post_quota /
--           sync_post_like_count / sync_post_comment_count / register_post_view /
--           prune_post_views / toggle_post_like (+ enforce_comment_rules 본문 post_id)
--   - 트리거·인덱스·제약·정책 이름 전부 posts_/post_likes_/post_views_/comments_post_ 로
--   - user_app_states / shared_snapshots / sim_summary 컬럼 / profiles 는 불변(시뮬 도메인)
--   - raise exception 한국어 문구는 동작 불변 위해 원문 유지
-- =============================================================================
