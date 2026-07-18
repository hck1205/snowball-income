-- =============================================================================
-- snowball-income — 클라우드 저장 Stage 1: user_app_states (개인 워크스페이스 동기화)
-- =============================================================================
--
-- 의도 (cloud-save-proposal.md §D6 옵션 B, §5 스키마)
-- ---------------------------------------------------------------------------
-- 로그인 사용자의 워크스페이스(시나리오 탭 전부 = 로컬 IndexedDB 자동 저장 슬롯의 미러)를
-- 계정에 축적해 기기 간 이어하기·유실 방지를 제공한다. 커뮤니티 scenarios와 **분리**한다:
--   - scenarios = 공개 게시(스냅샷). 자동 동기화가 그 행을 건드리면 "게시물이 조용히 바뀌는" 사고.
--   - user_app_states = 개인 저장. 공개 개념 없음(전 작업 owner-only), 쿼터·정책 독립.
--
-- 저장 형식은 로컬과 **하나의 스키마**를 공유한다: PersistedAppStatePayload(jotai/snowball/types).
-- 클라이언트가 normalizePersistedAppState로 정규화하므로 로컬↔클라우드↔JSON 왕복이 그대로 성립한다.
--
-- 신뢰 모델
-- ---------------------------------------------------------------------------
-- payload는 클라이언트가 쓰는 값이라 서버는 내용을 신뢰하지 않는다. 서버 CHECK는
-- "jsonb object + 크기 상한"만 지킨다(임의 저장소 악용 방지). 필드 검증은 읽기 측 정규화가 한다.
--
-- 하위 호환 (§D2 — 절대 규칙)
-- ---------------------------------------------------------------------------
-- 이 테이블은 **추가 계층**이다. 로컬 IndexedDB 자동 저장·이름 슬롯·?share= URL·JSON 가져오기는
-- 전부 그대로 유지된다. 로그인 시 로컬 슬롯은 "클라우드로 복사"만 하고 원본을 삭제하지 않는다.
--
-- 멱등성 (재실행 안전): 테이블/인덱스 IF NOT EXISTS, 트리거 drop-then-create, 함수 create or replace.
--
-- ⚠ 이전 마이그레이션(20260714/15/17)은 절대 수정하지 않는다. 이 파일은 그 위에 덧붙인다.
-- ⚠ shared/lib/supabase/types.ts 의 UserAppStateRow / Database.Tables.user_app_states 와 동기.
-- =============================================================================

-- =============================================================================
-- 1. 테이블
-- =============================================================================
create table if not exists public.user_app_states (
  id          uuid        primary key default gen_random_uuid(),
  -- ⚠ scenarios와 같은 이유로 FK가 public.profiles를 가리킨다(auth.users 삭제 → profiles → 여기까지 CASCADE).
  --   default auth.uid()라 클라이언트는 user_id를 명시하지 않는다(컬럼 GRANT에도 제외 → 위조 불가).
  user_id     uuid        not null default auth.uid() references public.profiles (id) on delete cascade,
  -- null = 자동 동기화 슬롯(1인 1개, 아래 partial unique index로 강제).
  -- not null = 이름 붙인 체크포인트(사용자가 명시 저장). 1~60자.
  name        text        check (name is null or char_length(btrim(name)) between 1 and 60),
  -- PersistedAppStatePayload 전체(시나리오 탭 포함). 128KB 상한 — 페이로드 실측 수 KB~수십 KB라 여유.
  -- pg_column_size는 body(64KB)·sim_summary와 같은 크기 방어 패턴.
  payload     jsonb       not null check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) <= 131072),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()   -- LWW 충돌 판정 기준(§5 동기화 프로토콜)
);

-- 자동 동기화 슬롯은 1인 1개. 두 기기가 동시에 insert하면 두 번째가 이 index에 걸려 거부되고,
-- 클라이언트는 그때 update 경로로 폴백한다(무결성은 DB가 보증).
create unique index if not exists user_app_states_autosave_one
  on public.user_app_states (user_id) where name is null;

-- 내 저장 목록(최신 수정순).
create index if not exists user_app_states_user_idx
  on public.user_app_states (user_id, updated_at desc);

-- =============================================================================
-- 2. updated_at 자동 갱신 (community의 touch_updated_at 재사용)
-- =============================================================================
drop trigger if exists user_app_states_touch_updated_at on public.user_app_states;
create trigger user_app_states_touch_updated_at
  before update on public.user_app_states
  for each row execute function public.touch_updated_at();

-- =============================================================================
-- 3. 쿼터 — 이름 체크포인트 1인 20개 (§5). 자동 동기화 슬롯(name is null)은 세지 않는다.
-- =============================================================================
-- RLS는 "본인 것만"은 막아도 "몇 개까지"는 못 막는다. scenarios의 30개 쿼터 트리거와 같은 패턴.
create or replace function public.enforce_user_app_state_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.name is not null
     and (select count(*) from public.user_app_states
           where user_id = new.user_id and name is not null) >= 20 then
    raise exception '이름 저장은 최대 20개까지 만들 수 있습니다'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists user_app_states_enforce_quota on public.user_app_states;
create trigger user_app_states_enforce_quota
  before insert on public.user_app_states
  for each row execute function public.enforce_user_app_state_quota();

-- =============================================================================
-- 4. GRANT — 컬럼 단위(위조 방지: user_id/created_at/updated_at은 클라이언트가 못 쓴다)
-- =============================================================================
-- ⚠ anon 제외 — 개인 저장이라 로그인 사용자만 접근한다.
grant select                     on public.user_app_states to authenticated;
grant insert (name, payload)     on public.user_app_states to authenticated;
grant update (name, payload)     on public.user_app_states to authenticated;
grant delete                     on public.user_app_states to authenticated;

-- =============================================================================
-- 5. RLS — 전 작업 owner-only (공개 개념 없음 → scenarios보다 단순)
-- =============================================================================
alter table public.user_app_states enable row level security;

drop policy if exists user_app_states_select_own on public.user_app_states;
create policy user_app_states_select_own on public.user_app_states
  for select to authenticated
  using (user_id = (select auth.uid()));

-- user_id 위조 차단(default auth.uid()가 채우지만 명시 위조도 막는다).
drop policy if exists user_app_states_insert_own on public.user_app_states;
create policy user_app_states_insert_own on public.user_app_states
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- 남의 저장 수정 + 소유권 이전 차단(USING·WITH CHECK 둘 다).
drop policy if exists user_app_states_update_own on public.user_app_states;
create policy user_app_states_update_own on public.user_app_states
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists user_app_states_delete_own on public.user_app_states;
create policy user_app_states_delete_own on public.user_app_states
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- =============================================================================
-- 끝. 요약
-- =============================================================================
--   - user_app_states(개인 워크스페이스, payload jsonb ≤128KB) + autosave 1개 partial unique
--   - 이름 체크포인트 20개 쿼터 트리거 + updated_at 트리거
--   - 컬럼 GRANT(authenticated only) + owner-only RLS 4정책
--   - 로컬 저장·공유 URL·JSON은 무변경(추가 계층, 하위 호환)
-- =============================================================================
