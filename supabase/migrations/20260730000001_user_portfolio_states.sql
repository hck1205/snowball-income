-- =============================================================================
-- snowball-income — 내 포트폴리오 클라우드 슬롯: user_portfolio_states
-- =============================================================================
--
-- 의도
-- ---------------------------------------------------------------------------
-- 로그인 사용자의 **보유 종목 + 배당 캘린더 선택**을 계정에 보관해 기기 간 이어보기·유실 방지를
-- 제공한다. 시뮬레이터의 user_app_states 와 **다른 테이블**을 쓴다:
--   - user_app_states 는 name=null 한 행이 자동 슬롯이고 name!=null 이 "이름 붙인 저장"이다.
--     포트폴리오를 예약어 이름으로 끼워 넣으면 사용자의 "내 저장" 목록에 섞여 나온다.
--   - 이 레포는 이미 "포트폴리오는 자기 저장소만 만진다"(별도 IndexedDB snowball-portfolio)를
--     지킨다. 클라우드에서도 같은 경계를 유지한다.
--   - user_id 를 primary key 로 두어 **1인 1행이 스키마로 강제**된다(partial unique index 불필요).
--
-- ⚠ 이 파일은 **사고 복구를 겸한다.**
-- ---------------------------------------------------------------------------
-- 2026-07-29 이 테이블을 마이그레이션 파일 없이 대화로 전달한 SQL 로 만들었고, 그 SQL 에
-- **GRANT 가 빠져 있었다.** 이 프로젝트는 public 스키마 기본 권한이 회수돼 있어(anon·service_role
-- 모두 42501) GRANT 없이는 authenticated 도 select 조차 못 한다 → 화면은 첫 동기화부터 실패했다.
-- 그래서 이 파일은 "없으면 만들고, 있으면 고친다"로 쓰여 **재실행이 항상 안전**하다.
--
-- 같은 사고를 두 번 겪지 않으려면: 테이블은 여기 파일로 만든다. 대화로 흘린 SQL 은 레포에 남지
-- 않아 다음 사람도, 다음 환경도 재현할 수 없다.
--
-- ⚠ touch_updated_at 은 community 마이그레이션의 공용 함수다 — **재정의하지 않고 쓰기만 한다.**
--   (다른 테이블 트리거가 같은 함수를 물고 있어 replace 는 그쪽까지 바꾼다.)
-- ⚠ shared/lib/supabase/types.ts 의 UserPortfolioStateRow 와 동기.
-- =============================================================================

-- =============================================================================
-- 1. 테이블
-- =============================================================================
create table if not exists public.user_portfolio_states (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  -- 보유 종목 + 캘린더 선택을 **한 payload 로** 담는다. 슬롯을 나누면 저장 시점이 어긋나
  -- 한쪽만 최신인 상태가 생긴다(사용자에겐 "캘린더만 옛날"로 보인다).
  payload     jsonb not null,
  updated_at  timestamptz not null default now()
);

-- 클라이언트가 user_id 를 **보내지 않아도** 채워지게 한다. 아래 컬럼 GRANT 가 user_id 쓰기를
-- 막으므로(위조 차단) 기본값이 없으면 insert 자체가 불가능하다. 둘은 한 쌍이다.
alter table public.user_portfolio_states alter column user_id set default auth.uid();

-- payload 크기 상한 — 서버는 내용을 신뢰하지 않지만 "임의 저장소로 악용"은 막는다.
-- user_app_states 와 같은 128KB(보유 종목 목록은 실측 수 KB).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.user_portfolio_states'::regclass
      and conname = 'user_portfolio_states_payload_sane'
  ) then
    alter table public.user_portfolio_states
      add constraint user_portfolio_states_payload_sane
      check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) <= 131072);
  end if;
end $$;

-- =============================================================================
-- 2. updated_at 자동 갱신 (community 의 touch_updated_at 재사용)
-- =============================================================================
drop trigger if exists user_portfolio_states_touch_updated_at on public.user_portfolio_states;
create trigger user_portfolio_states_touch_updated_at
  before update on public.user_portfolio_states
  for each row execute function public.touch_updated_at();

-- 최초 SQL 이 만든 이름의 트리거도 정리한다(있으면 중복 실행된다).
drop trigger if exists user_portfolio_states_touch on public.user_portfolio_states;

-- =============================================================================
-- 3. GRANT — **이게 빠져서 화면이 실패했다.** 컬럼 단위(user_id/updated_at 위조 차단)
-- =============================================================================
-- ⚠ anon 제외 — 개인 저장이라 로그인 사용자만 접근한다.
grant select           on public.user_portfolio_states to authenticated;
grant insert (payload) on public.user_portfolio_states to authenticated;
grant update (payload) on public.user_portfolio_states to authenticated;
grant delete           on public.user_portfolio_states to authenticated;

-- =============================================================================
-- 4. RLS — 전 작업 owner-only
-- =============================================================================
alter table public.user_portfolio_states enable row level security;

-- 2026-07-29 SQL 이 만든 공백 이름 정책을 걷어내고 레포 관례 이름으로 다시 만든다
-- (남겨두면 같은 뜻의 정책이 둘씩 걸린다).
drop policy if exists "own row select" on public.user_portfolio_states;
drop policy if exists "own row insert" on public.user_portfolio_states;
drop policy if exists "own row update" on public.user_portfolio_states;

drop policy if exists user_portfolio_states_select_own on public.user_portfolio_states;
create policy user_portfolio_states_select_own on public.user_portfolio_states
  for select to authenticated
  using (user_id = (select auth.uid()));

-- user_id 위조 차단(default auth.uid() 가 채우지만 명시 위조도 막는다).
drop policy if exists user_portfolio_states_insert_own on public.user_portfolio_states;
create policy user_portfolio_states_insert_own on public.user_portfolio_states
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- 남의 행 수정 + 소유권 이전 차단(USING·WITH CHECK 둘 다).
drop policy if exists user_portfolio_states_update_own on public.user_portfolio_states;
create policy user_portfolio_states_update_own on public.user_portfolio_states
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists user_portfolio_states_delete_own on public.user_portfolio_states;
create policy user_portfolio_states_delete_own on public.user_portfolio_states
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- =============================================================================
-- 끝. 요약
-- =============================================================================
--   - user_portfolio_states(1인 1행, payload jsonb ≤128KB, user_id default auth.uid())
--   - 컬럼 GRANT(authenticated only) ← 최초 SQL 누락분. 이것 없이는 select 도 안 된다
--   - owner-only RLS 4정책 + updated_at 트리거(공용 함수 재사용)
--   - 로컬 IndexedDB(snowball-portfolio)는 무변경 — 이 테이블은 추가 계층이다
-- =============================================================================
