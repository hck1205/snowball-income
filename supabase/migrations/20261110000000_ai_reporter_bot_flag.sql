-- =============================================================================
-- AI 리포터(자동 작성 계정) — 봇 표식과 글 개수 상한 예외 (2026-11-10)
-- =============================================================================
--
-- ## 무엇을 하는가
--
-- 1. `profiles.is_bot` 컬럼을 더한다(기본 false).
-- 2. 글 개수 상한 트리거(`enforce_post_quota`, 1인 30개)가 **is_bot 계정만 건너뛴다.**
--
-- ## 왜
--
-- 사용자 결정(2026-11-10): "AI 리포터" 라는 **AI 임을 밝힌** 계정 하나가 사이트 데이터로 리포트 글을
-- 정기적으로 쓴다(주 2~3편으로 시작). 30개 상한은 사람 한 명의 저장 공간을 막으려는 장치라, 주기적으로
-- 쓰는 리포트 계정에는 몇 달 안에 닿는다. 상한을 계정 전체에서 풀면 남용 방어가 사라지므로 **이 표식이
-- 있는 계정만** 예외로 둔다.
--
-- ## 🔴 자가 승격이 불가능하다 — is_admin 과 같은 이유
--
-- `profiles` 의 update GRANT 는 `(display_name, avatar_url)` 두 컬럼뿐이다(20260714000000). 새 컬럼에는
-- GRANT 를 주지 않으므로 사용자가 자기 행의 is_bot 을 true 로 바꿀 수 없다. 값은 **service_role(운영자)
-- 만** 바꾼다. insert GRANT 도 `(id, display_name, avatar_url)` 뿐이라 가입 때 끼워 넣을 수도 없다.
--
-- ## ⚠ 화면 코드는 이 컬럼을 읽지 않는다
--
-- 봇 배지·색인 제외는 코드의 계정 ID 상수(`AI_REPORTER`)로 판별한다. 이 마이그레이션이 배포보다 늦게
-- 적용돼도 커뮤니티 조회가 깨지지 않게 하려는 것이다(없는 컬럼을 select 하면 PostgREST 가 400 을 낸다).
--
-- ## 적용 뒤 운영자가 할 일 (한 번)
--
--   update public.profiles set is_bot = true where id = '<AI 리포터 user_id>';
-- =============================================================================

alter table public.profiles
  add column if not exists is_bot boolean not null default false;

comment on column public.profiles.is_bot is
  '자동 작성 계정(AI 리포터) 표식. update/insert GRANT 없음 — service_role 만 바꾼다. 글 개수 상한(enforce_post_quota) 예외의 근거.';

-- 글 개수 상한: 봇 표식 계정은 건너뛴다. 나머지는 20260723000000 과 글자까지 같다.
create or replace function public.enforce_post_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.profiles where id = new.user_id and is_bot) then
    return new;
  end if;

  if (select count(*) from public.posts where user_id = new.user_id) >= 30 then
    raise exception '시나리오는 최대 30개까지 저장할 수 있습니다'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

-- `create or replace` 는 기존 권한을 유지한다. 20260808000000 의 하드닝(PUBLIC EXECUTE 회수)이 그대로
-- 살아 있는지 확인하려면:
--   select has_function_privilege('anon', 'public.enforce_post_quota()', 'execute');  -- 기대: false
