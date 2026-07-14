-- =============================================================================
-- snowball-income — 커뮤니티 레이어 (시나리오 갤러리 / 좋아요 / 조회수 / 댓글)
-- =============================================================================
--
-- 위협 모델 (이 파일을 읽기 전에 반드시 이해할 것)
-- ---------------------------------------------------------------------------
-- anon 키는 브라우저 번들에 그대로 박혀 나간다. 즉 **누구나** 이 DB에 직접
-- PostgREST 요청을 보낼 수 있다. 클라이언트 코드의 검증은 방어가 아니다.
-- 유일한 방어선은 (1) RLS 정책, (2) 컬럼 수준 GRANT, (3) CHECK/트리거다.
--
-- 따라서 이 스키마의 3대 원칙:
--   1. 모든 테이블 RLS ON. 정책 없는 작업 = 거부.
--   2. 카운터(like_count/view_count/comment_count)는 **클라이언트가 UPDATE할 수
--      없다**. 컬럼 수준 GRANT에서 아예 제외했고, 트리거(SECURITY DEFINER)로만
--      갱신된다. 정책만으로 막으면 "내 시나리오의 like_count를 9999로" 가 된다.
--   3. 중복 좋아요는 정책이 아니라 **복합 PK**로 막는다 (경쟁 조건에서도 안전).
--
-- 멱등성: 이 마이그레이션은 재실행 가능하다 (create if not exists / drop policy if exists).
-- =============================================================================

-- =============================================================================
-- 0. 사전 준비 — 비공개 스키마 (조회수 해싱 솔트 보관)
-- =============================================================================

create schema if not exists private;

-- private 스키마는 클라이언트(anon/authenticated)가 절대 접근할 수 없다.
-- 솔트가 새면 조회수 해시(viewer_hash)로 IP 역산이 가능해지기 때문이다.
revoke all on schema private from anon, authenticated;
revoke all on all tables in schema private from anon, authenticated;

create table if not exists private.app_config (
  key   text primary key,
  value text not null
);

revoke all on private.app_config from anon, authenticated;

-- 조회수 해싱용 비밀 솔트. IP/사용자 식별자를 그대로 저장하지 않기 위해 쓴다.
-- gen_random_uuid()는 코어 함수(pgcrypto 불필요). 122bit x 2 = 충분한 엔트로피.
-- ⚠ 이미 존재하면 덮어쓰지 않는다 (덮어쓰면 기존 dedupe 기록이 전부 무효화됨).
insert into private.app_config (key, value)
values ('view_hash_salt', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (key) do nothing;

-- =============================================================================
-- 1. 공용 헬퍼 함수
-- =============================================================================

-- updated_at 자동 갱신. 클라이언트가 updated_at을 위조하지 못하도록
-- (컬럼 GRANT에서도 제외했지만) 서버 시각으로 덮어쓴다.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- 시나리오 페이로드 검증.
--
-- 왜 CHECK 제약인가: 클라이언트를 믿을 수 없다. anon 키로 아무나 500MB짜리
-- JSON을 밀어 넣거나, 앱이 파싱 못 하는 구조를 넣어 갤러리를 깨뜨릴 수 있다.
--
-- ⚠ NULL 함정: `jsonb_typeof(p->'a'->'b')` 는 키가 없으면 NULL을 반환하고,
--    CHECK 제약은 NULL을 **통과**로 취급한다. 그래서 전체를 coalesce(..., false)로
--    감싼다. 이걸 빼먹으면 검증이 통째로 무력화된다.
--
-- 형태는 앱의 PersistedScenarioState (jotai/snowball/types/persistence.ts):
--   { id?, name?, portfolio: {...}, investmentSettings: {...} }
-- id/name은 클라이언트 로컬 값이라 선택적으로 허용한다 (제목은 scenarios.title이 정본).
create or replace function public.is_valid_scenario_payload(p jsonb)
returns boolean
language sql
immutable
as $$
  select coalesce(
    jsonb_typeof(p) = 'object'
    -- 크기 상한 64KB. 무료 티어(500MB)와 대역폭 보호.
    -- p::text는 jsonb_out(immutable) 경유라 immutable 함수 안에서 안전하다.
    and octet_length(p::text) <= 65536
    -- 필수 키
    and p ? 'portfolio'
    and p ? 'investmentSettings'
    and jsonb_typeof(p -> 'portfolio') = 'object'
    and jsonb_typeof(p -> 'investmentSettings') = 'object'
    -- 포트폴리오 구조
    and jsonb_typeof(p -> 'portfolio' -> 'tickerProfiles') = 'array'
    and jsonb_array_length(p -> 'portfolio' -> 'tickerProfiles') <= 50
    and jsonb_typeof(p -> 'portfolio' -> 'includedTickerIds') = 'array'
    -- 선택적 키가 들어오면 타입만 확인
    and (not p ? 'id' or jsonb_typeof(p -> 'id') = 'string')
    and (not p ? 'name' or (jsonb_typeof(p -> 'name') = 'string' and char_length(p ->> 'name') <= 80)),
    false
  );
$$;

-- =============================================================================
-- 2. profiles — auth.users와 1:1 공개 프로필
-- =============================================================================
-- ⚠ PII 금지: 이메일은 auth.users에만 있고 이 테이블엔 절대 두지 않는다.
--   profiles는 anon도 SELECT할 수 있는 완전 공개 테이블이다.

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text        not null check (char_length(btrim(display_name)) between 1 and 40),
  avatar_url   text        check (avatar_url is null or avatar_url ~ '^https://'),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- 가입 시 프로필 자동 생성.
-- 구글/카카오가 주는 메타데이터 키가 서로 달라서 coalesce로 훑는다.
--   google: full_name / name, avatar_url / picture
--   kakao : name / preferred_username / nickname, avatar_url / picture
-- 아무것도 없으면 결정론적 기본 닉네임을 만든다 (가입 실패보다 낫다).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(btrim(coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'preferred_username'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'nickname'), ''),
      '스노우볼러' || substr(replace(new.id::text, '-', ''), 1, 6)
    )), 40),
    nullif(btrim(coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture',
      ''
    )), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- 3. scenarios — 서버 저장 시나리오 (갤러리)
-- =============================================================================

create table if not exists public.scenarios (
  id            uuid primary key default gen_random_uuid(),
  -- ⚠ FK가 auth.users가 아니라 public.profiles를 가리키는 이유:
  --   PostgREST의 임베드(`select=*,profiles(display_name)`)는 **FK를 보고** 관계를 추론한다.
  --   auth.users를 가리키면 갤러리에서 작성자 닉네임을 한 번에 조인해 올 수 없다.
  --   profiles.id는 auth.users(id)를 참조하므로 삭제 캐스케이드는 그대로 이어진다
  --   (auth.users 삭제 → profiles 삭제 → scenarios 삭제).
  user_id       uuid        not null default auth.uid() references public.profiles (id) on delete cascade,
  title         text        not null check (char_length(btrim(title)) between 1 and 80),
  description   text        check (description is null or char_length(description) <= 500),
  payload       jsonb       not null check (public.is_valid_scenario_payload(payload)),
  -- ⚠ 기본값 false: 포트폴리오는 개인 금융정보다. 실수로 INSERT 하면 공개되는 게 아니라
  --   비공개여야 한다. 갤러리 게시는 클라이언트가 is_public=true를 **명시**할 때만.
  is_public     boolean     not null default false,
  like_count    integer     not null default 0 check (like_count >= 0),
  view_count    bigint      not null default 0 check (view_count >= 0),
  comment_count integer     not null default 0 check (comment_count >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists scenarios_touch_updated_at on public.scenarios;
create trigger scenarios_touch_updated_at
  before update on public.scenarios
  for each row execute function public.touch_updated_at();

-- 스팸/용량 방어: 1인당 시나리오 30개 상한. 무료 티어에서 봇이 수만 개를 밀어
-- 넣어 DB를 채우는 걸 막는다. (RLS는 "본인 것만"은 막아도 "몇 개까지"는 못 막는다.)
create or replace function public.enforce_scenario_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.scenarios where user_id = new.user_id) >= 30 then
    raise exception '시나리오는 최대 30개까지 저장할 수 있습니다'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists scenarios_enforce_quota on public.scenarios;
create trigger scenarios_enforce_quota
  before insert on public.scenarios
  for each row execute function public.enforce_scenario_quota();

-- 갤러리 최신순 keyset 페이지네이션: (created_at desc, id desc)
create index if not exists scenarios_public_recent_idx
  on public.scenarios (created_at desc, id desc)
  where is_public;

-- 갤러리 인기순 keyset 페이지네이션: (like_count desc, created_at desc, id desc)
create index if not exists scenarios_public_popular_idx
  on public.scenarios (like_count desc, created_at desc, id desc)
  where is_public;

-- 내 시나리오 목록
create index if not exists scenarios_user_idx
  on public.scenarios (user_id, created_at desc);

-- =============================================================================
-- 4. scenario_likes — 시나리오 좋아요
-- =============================================================================
-- 중복 좋아요 방지의 핵심: **복합 PK**. 정책이나 애플리케이션 로직이 아니라
-- DB 제약이라 동시 요청(더블클릭/경쟁조건)에서도 두 번 들어갈 수 없다.

create table if not exists public.scenario_likes (
  scenario_id uuid        not null references public.scenarios (id) on delete cascade,
  user_id     uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (scenario_id, user_id)
);

-- "내가 좋아요한 시나리오" 역방향 조회
create index if not exists scenario_likes_user_idx
  on public.scenario_likes (user_id, created_at desc);

-- 카운터 동기화 — SECURITY DEFINER인 이유:
-- authenticated 롤은 scenarios.like_count에 UPDATE 권한이 **없다**(컬럼 GRANT 제외).
-- 이 트리거는 소유자(postgres) 권한으로 돌아 RLS와 컬럼 ACL을 우회한다.
-- 즉 카운터를 바꿀 수 있는 유일한 경로가 이 트리거다.
create or replace function public.sync_scenario_like_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.scenarios
       set like_count = like_count + 1
     where id = new.scenario_id;
    return new;
  else
    update public.scenarios
       set like_count = greatest(like_count - 1, 0)
     where id = old.scenario_id;
    return old;
  end if;
end;
$$;

drop trigger if exists scenario_likes_sync_count on public.scenario_likes;
create trigger scenario_likes_sync_count
  after insert or delete on public.scenario_likes
  for each row execute function public.sync_scenario_like_count();

-- =============================================================================
-- 5. comments — 댓글 + 대댓글(1단계) — 소프트 삭제
-- =============================================================================

create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  scenario_id uuid        not null references public.scenarios (id) on delete cascade,
  -- profiles를 참조하는 이유는 scenarios.user_id와 동일 (PostgREST 작성자 임베드)
  user_id     uuid        not null default auth.uid() references public.profiles (id) on delete cascade,
  parent_id   uuid        references public.comments (id) on delete cascade,
  body        text        not null,
  like_count  integer     not null default 0 check (like_count >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  -- 살아있는 댓글은 1~2000자. 삭제된 댓글은 본문이 ''로 파기되므로 예외.
  -- (소프트 삭제인데 본문이 남아 있으면 API로 그대로 읽힌다 → 사실상 삭제가 아니다)
  constraint comments_body_len check (
    (deleted_at is null and char_length(btrim(body)) between 1 and 2000)
    or deleted_at is not null
  ),
  -- 자기 자신을 부모로 지정 금지 (트리 무한루프)
  constraint comments_no_self_parent check (parent_id is null or parent_id <> id)
);

create index if not exists comments_scenario_idx
  on public.comments (scenario_id, created_at);

create index if not exists comments_parent_idx
  on public.comments (parent_id, created_at)
  where parent_id is not null;

create index if not exists comments_user_recent_idx
  on public.comments (user_id, created_at desc);

-- 대댓글 1단계 강제 + 스팸 방어.
-- CHECK으로는 불가능하다(다른 행을 봐야 해서 서브쿼리가 필요 → CHECK 금지).
create or replace function public.enforce_comment_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_parent_parent_id  uuid;
  v_parent_scenario   uuid;
  v_parent_deleted_at timestamptz;
  v_found             boolean := false;
begin
  -- 1) 스팸 레이트리밋: 1분에 10개 초과 금지.
  --    RLS는 "본인 것만 쓰기"는 막아도 "1초에 100개"는 못 막는다.
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
    select c.parent_id, c.scenario_id, c.deleted_at, true
      into v_parent_parent_id, v_parent_scenario, v_parent_deleted_at, v_found
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

    -- 다른 시나리오의 댓글에 답글을 달아 트리를 교차시키는 걸 막는다.
    if v_parent_scenario <> new.scenario_id then
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

drop trigger if exists comments_enforce_rules on public.comments;
create trigger comments_enforce_rules
  before insert on public.comments
  for each row execute function public.enforce_comment_rules();

-- UPDATE 보호.
-- authenticated에게는 (body, deleted_at) 컬럼만 UPDATE를 허용했지만,
-- 그 두 컬럼만으로도 "삭제 취소" "삭제된 댓글 본문 되살리기"가 가능하다. 여기서 막는다.
create or replace function public.protect_comment_update()
returns trigger
language plpgsql
as $$
begin
  -- 삭제 되살리기 금지
  if old.deleted_at is not null and new.deleted_at is null then
    raise exception '삭제된 댓글은 복구할 수 없습니다' using errcode = 'check_violation';
  end if;

  -- 이미 삭제된 댓글의 본문 수정 금지
  if old.deleted_at is not null and new.body is distinct from old.body then
    raise exception '삭제된 댓글은 수정할 수 없습니다' using errcode = 'check_violation';
  end if;

  -- 삭제 전이(null → not null): 본문을 실제로 파기한다.
  -- 소프트 삭제는 트리 유지를 위한 것이지, 내용을 남겨두기 위한 게 아니다.
  if old.deleted_at is null and new.deleted_at is not null then
    new.body := '';
    new.deleted_at := now();  -- 클라이언트가 보낸 시각을 믿지 않는다
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists comments_protect_update on public.comments;
create trigger comments_protect_update
  before update on public.comments
  for each row execute function public.protect_comment_update();

-- scenarios.comment_count 동기화 (SECURITY DEFINER — 카운터는 트리거만 만진다)
create or replace function public.sync_scenario_comment_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.deleted_at is null then
      update public.scenarios
         set comment_count = comment_count + 1
       where id = new.scenario_id;
    end if;
    return new;

  elsif tg_op = 'UPDATE' then
    -- 소프트 삭제 시점에 카운트를 깎는다
    if old.deleted_at is null and new.deleted_at is not null then
      update public.scenarios
         set comment_count = greatest(comment_count - 1, 0)
       where id = new.scenario_id;
    end if;
    return new;

  else -- DELETE (하드 삭제는 시나리오/부모 CASCADE로만 발생)
    if old.deleted_at is null then
      update public.scenarios
         set comment_count = greatest(comment_count - 1, 0)
       where id = old.scenario_id;
    end if;
    return old;
  end if;
end;
$$;

drop trigger if exists comments_sync_scenario_count on public.comments;
create trigger comments_sync_scenario_count
  after insert or update or delete on public.comments
  for each row execute function public.sync_scenario_comment_count();

-- =============================================================================
-- 6. comment_likes — 댓글/대댓글 좋아요
-- =============================================================================

create table if not exists public.comment_likes (
  comment_id uuid        not null references public.comments (id) on delete cascade,
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)   -- 중복 좋아요 DB 차원 차단
);

create index if not exists comment_likes_user_idx
  on public.comment_likes (user_id, created_at desc);

create or replace function public.sync_comment_like_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.comments
       set like_count = like_count + 1
     where id = new.comment_id;
    return new;
  else
    update public.comments
       set like_count = greatest(like_count - 1, 0)
     where id = old.comment_id;
    return old;
  end if;
end;
$$;

drop trigger if exists comment_likes_sync_count on public.comment_likes;
create trigger comment_likes_sync_count
  after insert or delete on public.comment_likes
  for each row execute function public.sync_comment_like_count();

-- ⚠ 위 트리거는 comments를 UPDATE한다 → comments_protect_update(BEFORE UPDATE)가
--   같이 돈다. like_count만 바뀌고 body/deleted_at은 그대로라 모든 가드를 통과한다.
--   (updated_at이 갱신되는 부작용은 있으나 무해 — 정렬은 created_at 기준)

-- =============================================================================
-- 7. scenario_views — 조회수 원본 + 어뷰징 방어
-- =============================================================================
--
-- 설계 결정: scenarios.view_count만 증가시키면 새로고침 연타로 무한 증가한다.
-- 그래서 원본 테이블을 두고 (시나리오, 뷰어해시, 1시간 버킷) 유니크로 dedupe한다.
-- → 같은 뷰어는 시나리오당 **1시간에 1회**만 조회수에 반영된다.
--
-- 뷰어 식별 우선순위: 로그인 사용자 > IP > 클라이언트 토큰 > unknown
--   - 토큰만 쓰면 localStorage를 지우거나 시크릿창으로 무한 증가시킬 수 있다.
--   - 그래서 익명은 IP를 우선한다 (NAT 뒤 여러 명이 1명으로 합쳐지는 과소집계는 감수).
--
-- ⚠ PII: IP는 개인정보다. **원본을 저장하지 않는다.** 비밀 솔트(private.app_config)와
--   함께 sha256 해싱한 값만 저장한다. 솔트를 모르면 역산할 수 없다
--   (솔트 없이 해싱하면 IPv4는 43억 개뿐이라 레인보우 테이블로 즉시 복원된다).
--
-- 이 테이블은 클라이언트가 **직접 접근할 수 없다** (GRANT 없음 / 정책 없음).
-- 오직 아래 register_scenario_view() RPC(SECURITY DEFINER)만 건드린다.

create table if not exists public.scenario_views (
  scenario_id uuid        not null references public.scenarios (id) on delete cascade,
  viewer_hash text        not null,
  view_bucket timestamptz not null,
  viewed_at   timestamptz not null default now(),
  primary key (scenario_id, viewer_hash, view_bucket)
);

-- 오래된 dedupe 기록 정리용 (아래 prune 함수)
create index if not exists scenario_views_viewed_at_idx
  on public.scenario_views (viewed_at);

-- 조회수 등록 RPC.
-- 반환: 갱신된 view_count (클라이언트가 즉시 표시할 수 있도록)
create or replace function public.register_scenario_view(
  p_scenario_id  uuid,
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
    from public.scenarios s
   where s.id = p_scenario_id;

  if not found then
    raise exception '시나리오를 찾을 수 없습니다' using errcode = 'no_data_found';
  end if;

  -- 비공개 시나리오는 조회수를 세지 않는다 (소유자가 자기 걸 열어보는 것도 카운트 X)
  if not v_is_public then
    return v_count;
  end if;

  select value into v_salt from private.app_config where key = 'view_hash_salt';

  -- Supabase(PostgREST)는 요청 헤더를 request.headers GUC로 넘겨준다.
  -- ⚠ GUC가 미설정이면 NULL, 설정됐지만 빈 문자열이면 ''다. ''::json은 예외를 던지므로
  --   캐스팅 **전에** nullif로 걸러야 한다. (exception 블록은 2차 방어)
  -- x-forwarded-for는 "client, proxy1, proxy2" 형태라 첫 번째만 클라이언트 IP다.
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

  -- sha256()은 PG11+ 코어 함수 (pgcrypto 불필요)
  v_hash := encode(sha256(convert_to(v_salt || '|' || v_viewer_key, 'utf8')), 'hex');

  insert into public.scenario_views (scenario_id, viewer_hash, view_bucket)
  values (p_scenario_id, v_hash, v_bucket)
  on conflict (scenario_id, viewer_hash, view_bucket) do nothing;

  get diagnostics v_inserted = row_count;

  -- 이미 이번 시간대에 본 뷰어면 카운트를 올리지 않는다 (= 새로고침 연타 무효)
  if v_inserted = 0 then
    return v_count;
  end if;

  update public.scenarios
     set view_count = view_count + 1
   where id = p_scenario_id
  returning view_count into v_count;

  return v_count;
end;
$$;

-- dedupe 창(1시간)이 지난 기록은 쓸모없다. 무료 티어 용량 보호를 위해 정리한다.
-- (안전 여유를 둬서 24시간 보관. pg_cron으로 하루 1회 도는 걸 권장 — docs 참고)
create or replace function public.prune_scenario_views()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  delete from public.scenario_views
   where viewed_at < now() - interval '24 hours';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

-- prune은 클라이언트가 부를 이유가 없다 (cron/관리자 전용)
revoke all on function public.prune_scenario_views() from public, anon, authenticated;

-- =============================================================================
-- 8. 토글 RPC (좋아요) — 1왕복으로 처리
-- =============================================================================
-- SECURITY INVOKER(기본): 호출자 권한으로 돌기 때문에 아래 RLS 정책이 그대로 적용된다.
-- 즉 이 RPC가 있다고 해서 정책이 우회되지 않는다. (DEFINER로 만들면 안 되는 이유)

create or replace function public.toggle_scenario_like(p_scenario_id uuid)
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

  delete from public.scenario_likes
   where scenario_id = p_scenario_id and user_id = auth.uid();
  get diagnostics v_deleted = row_count;

  if v_deleted > 0 then
    return false;
  end if;

  -- INSERT는 RLS(scenario_likes_insert_own) + 복합 PK 둘 다 통과해야 한다
  insert into public.scenario_likes (scenario_id, user_id)
  values (p_scenario_id, auth.uid());

  return true;
end;
$$;

create or replace function public.toggle_comment_like(p_comment_id uuid)
returns boolean
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

  delete from public.comment_likes
   where comment_id = p_comment_id and user_id = auth.uid();
  get diagnostics v_deleted = row_count;

  if v_deleted > 0 then
    return false;
  end if;

  insert into public.comment_likes (comment_id, user_id)
  values (p_comment_id, auth.uid());

  return true;
end;
$$;

-- =============================================================================
-- 9. 권한 (GRANT) — RLS보다 먼저 걸리는 1차 관문
-- =============================================================================
-- Supabase는 public 스키마의 새 테이블에 anon/authenticated로 ALL을 기본 GRANT한다.
-- 그대로 두면 RLS 정책이 통과하는 순간 **모든 컬럼**을 쓸 수 있다 → 카운터 조작 가능.
-- 그래서 전부 REVOKE하고 필요한 컬럼만 다시 GRANT한다.
--
-- 이게 카운터 방어의 핵심이다. RLS "본인 시나리오 UPDATE 허용" 정책만 있으면
-- `update scenarios set like_count = 999999 where id = <내 시나리오>` 가 통과한다.
-- 컬럼 GRANT에서 like_count를 빼면 그 문장은 권한 오류로 죽는다.

revoke all on public.profiles       from anon, authenticated;
revoke all on public.scenarios      from anon, authenticated;
revoke all on public.scenario_likes from anon, authenticated;
revoke all on public.comments       from anon, authenticated;
revoke all on public.comment_likes  from anon, authenticated;
revoke all on public.scenario_views from anon, authenticated;  -- RPC로만 접근

-- 읽기: 익명도 갤러리/댓글/카운터를 볼 수 있어야 한다 (RLS가 행 단위로 다시 거른다)
grant select on public.profiles       to anon, authenticated;
grant select on public.scenarios      to anon, authenticated;
grant select on public.scenario_likes to anon, authenticated;
grant select on public.comments       to anon, authenticated;
grant select on public.comment_likes  to anon, authenticated;

-- 쓰기: 로그인 사용자만. 카운터/타임스탬프 컬럼은 의도적으로 제외했다.
grant insert (id, display_name, avatar_url)             on public.profiles  to authenticated;
grant update (display_name, avatar_url)                 on public.profiles  to authenticated;

grant insert (user_id, title, description, payload, is_public) on public.scenarios to authenticated;
grant update (title, description, payload, is_public)          on public.scenarios to authenticated;
grant delete                                                   on public.scenarios to authenticated;
--        ↑ like_count / view_count / comment_count / created_at / updated_at 없음 → 조작 불가

grant insert (scenario_id, user_id) on public.scenario_likes to authenticated;
grant delete                        on public.scenario_likes to authenticated;

grant insert (scenario_id, user_id, parent_id, body) on public.comments to authenticated;
grant update (body, deleted_at)                      on public.comments to authenticated;
--        ↑ DELETE 권한 없음 → 하드 삭제 불가(소프트 삭제만). like_count 조작 불가.

grant insert (comment_id, user_id) on public.comment_likes to authenticated;
grant delete                       on public.comment_likes to authenticated;

-- RPC 실행 권한
revoke all on function public.register_scenario_view(uuid, text) from public;
revoke all on function public.toggle_scenario_like(uuid)         from public;
revoke all on function public.toggle_comment_like(uuid)          from public;

grant execute on function public.register_scenario_view(uuid, text) to anon, authenticated;
grant execute on function public.toggle_scenario_like(uuid)         to authenticated;
grant execute on function public.toggle_comment_like(uuid)          to authenticated;

-- =============================================================================
-- 10. RLS 정책
-- =============================================================================
-- 원칙: 테이블마다 RLS를 켜고, 명시적으로 허용한 작업만 통과시킨다.
-- 정책이 없는 (역할 × 작업) 조합은 **전부 거부**된다 (RLS의 기본값이 deny).

alter table public.profiles       enable row level security;
alter table public.scenarios      enable row level security;
alter table public.scenario_likes enable row level security;
alter table public.comments       enable row level security;
alter table public.comment_likes  enable row level security;
alter table public.scenario_views enable row level security;   -- 정책 0개 = 클라이언트 전면 차단

-- ---------------------------------------------------------------------------
-- 시나리오 가시성 헬퍼.
-- comments 정책에서 scenarios를 참조할 때 중첩 RLS 평가를 피하고(성능),
-- 정책 로직을 한 곳에 모으기 위해 SECURITY DEFINER STABLE 함수로 뺀다.
-- "공개 시나리오이거나, 내가 소유한 시나리오" 일 때만 true.
-- ---------------------------------------------------------------------------
create or replace function public.is_scenario_visible(p_scenario_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.scenarios s
     where s.id = p_scenario_id
       and (s.is_public or s.user_id = auth.uid())
  );
$$;

grant execute on function public.is_scenario_visible(uuid) to anon, authenticated;

-- ── profiles ────────────────────────────────────────────────────────────────

-- 막는 것: 없음. 닉네임/아바타는 공개 정보다 (이메일은 이 테이블에 아예 없다).
drop policy if exists profiles_select_all on public.profiles;
create policy profiles_select_all on public.profiles
  for select to anon, authenticated
  using (true);

-- 막는 것: 남의 id로 프로필을 만드는 것(사칭). 보통은 가입 트리거가 만든다.
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

-- 막는 것: 남의 닉네임/아바타 변경.
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- DELETE 정책 없음 → 프로필 직접 삭제 불가 (auth.users 삭제 시 CASCADE로만 사라짐)

-- ── scenarios ───────────────────────────────────────────────────────────────

-- 막는 것: 남의 **비공개** 시나리오 열람. 공개된 것만 보이고,
--          비공개는 소유자에게만 보인다. (익명은 공개된 것만)
drop policy if exists scenarios_select_public_or_own on public.scenarios;
create policy scenarios_select_public_or_own on public.scenarios
  for select to anon, authenticated
  using (is_public or user_id = (select auth.uid()));

-- 막는 것: 남의 이름으로 시나리오 게시(사칭). user_id 위조를 차단한다.
--          (payload 크기·구조는 CHECK 제약이, 개수는 quota 트리거가 따로 막는다)
drop policy if exists scenarios_insert_own on public.scenarios;
create policy scenarios_insert_own on public.scenarios
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- 막는 것: 남의 시나리오 수정 + 소유권 이전(USING과 WITH CHECK를 둘 다 건다.
--          WITH CHECK가 없으면 내 시나리오의 user_id를 남에게 넘길 수 있다).
--          카운터 컬럼 수정은 여기가 아니라 컬럼 GRANT에서 막힌다.
drop policy if exists scenarios_update_own on public.scenarios;
create policy scenarios_update_own on public.scenarios
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- 막는 것: 남의 시나리오 삭제.
drop policy if exists scenarios_delete_own on public.scenarios;
create policy scenarios_delete_own on public.scenarios
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ── scenario_likes ──────────────────────────────────────────────────────────

-- 막는 것: 없음(좋아요는 공개 정보). 클라이언트가 "내가 눌렀는지"를 알아야 하고,
--          보이지 않는 시나리오의 좋아요 행은 어차피 조인할 대상이 없다.
drop policy if exists scenario_likes_select_all on public.scenario_likes;
create policy scenario_likes_select_all on public.scenario_likes
  for select to anon, authenticated
  using (true);

-- 막는 것: (1) 남의 이름으로 좋아요 누르기, (2) 볼 수도 없는 비공개 시나리오에
--          ID를 찍어서 좋아요 심기. 중복 좋아요는 복합 PK가 막는다.
drop policy if exists scenario_likes_insert_own on public.scenario_likes;
create policy scenario_likes_insert_own on public.scenario_likes
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_scenario_visible(scenario_id)
  );

-- 막는 것: 남의 좋아요 취소.
drop policy if exists scenario_likes_delete_own on public.scenario_likes;
create policy scenario_likes_delete_own on public.scenario_likes
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- UPDATE 정책 없음 → 좋아요 행 수정 불가 (필요도 없음)

-- ── comments ────────────────────────────────────────────────────────────────

-- 막는 것: 비공개 시나리오에 달린 댓글 열람.
--          (삭제된 댓글 행 자체는 보인다 — 트리 구조 유지를 위해. 다만 본문은
--           트리거가 ''로 파기했으므로 내용은 새어나가지 않는다.)
drop policy if exists comments_select_visible on public.comments;
create policy comments_select_visible on public.comments
  for select to anon, authenticated
  using (public.is_scenario_visible(scenario_id));

-- 막는 것: (1) 남의 이름으로 댓글 작성, (2) 비공개/존재하지 않는 시나리오에 댓글 심기.
--          대댓글 깊이·레이트리밋은 enforce_comment_rules 트리거가 막는다.
drop policy if exists comments_insert_own on public.comments;
create policy comments_insert_own on public.comments
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_scenario_visible(scenario_id)
  );

-- 막는 것: 남의 댓글 수정/삭제. 본인 것만.
--          "삭제 취소", "삭제된 댓글 수정"은 protect_comment_update 트리거가 막는다.
--          like_count 조작은 컬럼 GRANT가 막는다.
drop policy if exists comments_update_own on public.comments;
create policy comments_update_own on public.comments
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- DELETE 정책 없음 + DELETE GRANT 없음 → **하드 삭제 완전 차단**.
-- 삭제는 오직 deleted_at을 세팅하는 소프트 삭제뿐이다.
-- (대댓글이 달린 댓글을 하드 삭제하면 트리가 깨지기 때문)

-- ── comment_likes ───────────────────────────────────────────────────────────

drop policy if exists comment_likes_select_all on public.comment_likes;
create policy comment_likes_select_all on public.comment_likes
  for select to anon, authenticated
  using (true);

-- 막는 것: 남의 이름으로 좋아요, 안 보이는 댓글에 좋아요 심기, 삭제된 댓글에 좋아요.
drop policy if exists comment_likes_insert_own on public.comment_likes;
create policy comment_likes_insert_own on public.comment_likes
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
        from public.comments c
       where c.id = comment_id
         and c.deleted_at is null
         and public.is_scenario_visible(c.scenario_id)
    )
  );

drop policy if exists comment_likes_delete_own on public.comment_likes;
create policy comment_likes_delete_own on public.comment_likes
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- =============================================================================
-- 끝. 요약: 클라이언트가 절대 할 수 없는 것
-- =============================================================================
--   - 카운터(like/view/comment_count) 직접 수정      → 컬럼 GRANT 제외
--   - 같은 대상에 좋아요 2번                          → 복합 PK
--   - 새로고침으로 조회수 뻥튀기                       → scenario_views 1시간 dedupe
--   - 남의 글/댓글/좋아요 수정·삭제                   → RLS (auth.uid() = user_id)
--   - 남의 비공개 시나리오 열람                       → RLS (is_public or owner)
--   - 대댓글의 대댓글                                 → enforce_comment_rules 트리거
--   - 댓글 하드 삭제(트리 파괴)                       → DELETE 권한/정책 없음
--   - 댓글 도배                                      → 1분 10개 레이트리밋 트리거
--   - 거대 JSON 업로드                               → payload 64KB CHECK
--   - 시나리오 무한 생성                             → 1인 30개 quota 트리거
--   - scenario_views 직접 조작                       → GRANT/정책 0개 (RPC 전용)
-- =============================================================================
