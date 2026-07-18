-- =============================================================================
-- snowball-income — 시드(합성) 계정 추적 장치 (profiles.is_seed)
-- =============================================================================
--
-- 의도
-- ---------------------------------------------------------------------------
-- 커뮤니티 콜드스타트 시딩을 위해 가상 페르소나(합성 계정)가 곧 글·댓글·좋아요를
-- 생성한다(별도 세션 · docs/community-seeding/). 이들을 **운영자가 항상 식별하고,
-- 나중에 티 안 나게 순차 삭제(de-seed)**할 수 있도록 profiles에 내부 플래그 하나만 건다.
--
--   - 화면(UI)엔 시드 표시를 하지 않는다(티 안 나게). 이 컬럼은 **읽기는 무방하나
--     현재 앱 코드는 읽지 않는다** — 순수 운영/집계/삭제용 내부 신호다.
--   - 이번 작업은 **추적 장치만** 건다. 실제 시드 계정/콘텐츠 생성·삭제는 범위 밖이다.
--
-- 위협 모델 (반드시 지킬 것)
-- ---------------------------------------------------------------------------
-- `is_seed`는 **오직 service_role(서버)만** 설정할 수 있어야 한다. 일반 사용자가
-- 자기 프로필의 is_seed를 조작하면(예: 시드 계정이 스스로 플래그를 지워 실사용자로
-- 위장, 또는 실사용자가 스스로 시드로 자칭) 식별·집계·감사가 무너진다.
--
-- 방어선은 **컬럼 GRANT**다(RLS 아님). 20260714000000_community.sql:698-714 가
-- profiles 에 대해 anon/authenticated 의 ALL 을 REVOKE 하고
--   grant update (display_name, avatar_url) on public.profiles to authenticated;
-- 처럼 **컬럼을 나열해** 다시 GRANT 했다. 컬럼 나열형 GRANT 는 **새로 추가된 컬럼을
-- 자동으로 포함하지 않는다** → authenticated 는 is_seed 에 UPDATE 권한이 없어
-- `update profiles set is_seed = true where id = auth.uid()` 는 RLS 이전에
-- **permission denied for column is_seed** 로 죽는다. (RLS profiles_update_own 은
-- 행은 허용해도 컬럼 권한이 없으면 통과 못 한다.)
--
-- 아래 §3 의 명시적 REVOKE 는 그 방어가 이미 성립함을 못박는 **belt-and-suspenders**다
-- (없던 권한을 REVOKE 하는 건 no-op — 에러 없음). service_role 은 커뮤니티 마이그레이션이
-- REVOKE 대상에 넣지 않았고 RLS 를 우회하므로 is_seed 를 계속 쓸 수 있다.
--
-- ⚠ 가입 트리거: `handle_new_user`(community.sql:124) 는
--   insert into public.profiles (id, display_name, avatar_url)
-- 로 **is_seed 를 건드리지 않는다** → 신규 가입자는 컬럼 DEFAULT(false)로 들어온다.
-- 트리거를 수정할 필요가 없다(default 로 충분). 되살려 확인만 하고 손대지 않는다.
--
-- 하위 호환 / 불변식
-- ---------------------------------------------------------------------------
-- - **기존 커뮤니티 테이블 동작 불변**: is_seed 컬럼 추가만 한다. 기존 컬럼·RLS·GRANT·
--   트리거 로직은 하나도 바꾸지 않는다. 기존 profiles 행은 전부 default false 로 백필된다.
-- - 영속 페이로드(user_app_states)·공유 스냅샷(shared_snapshots)·`?share=` 링크와
--   **무관**하다(그쪽은 profiles 를 안 읽는다).
-- - ⚠ 기존 마이그레이션(20260714… 등)은 절대 수정하지 않는다. 이 파일은 그 위에 덧붙인다.
-- - 멱등: ADD COLUMN IF NOT EXISTS / CREATE INDEX IF NOT EXISTS / CREATE OR REPLACE
--   FUNCTION 라 재실행 안전.
--
-- ⚠ 배포: 이 마이그레이션도 **배포 전(=시드 생성 전) 실행 대상**이다. is_seed 를 쓰는
--   시드 생성기·de-seed 절차는 이 컬럼이 실제로 존재해야 동작한다.
-- =============================================================================

-- =============================================================================
-- 1. profiles.is_seed — 시드 계정 식별 플래그
-- =============================================================================
-- default false: 절대다수(실사용자)가 false 다. 시드 생성기(service_role)가 계정을
-- 만든 뒤 명시적으로 true 로 태깅한다. not null 이라 3-값 논리(NULL)를 피한다.
alter table public.profiles
  add column if not exists is_seed boolean not null default false;

comment on column public.profiles.is_seed is
  '내부 전용: 커뮤니티 콜드스타트 시딩용 합성(가상 페르소나) 계정이면 true. service_role 만 설정한다(컬럼 GRANT 로 anon/authenticated 쓰기 차단). UI 미노출 — 식별·집계 제외·순차 삭제(de-seed) 용도. docs/community-seeding/.';

-- 부분 인덱스: 시드는 소수(수십 명)라 `where is_seed` 부분 인덱스가 작고, de-seed·감사·
-- 집계제외 조회(`... where is_seed`)를 가속한다. 실사용자(false) 행은 인덱스에 안 들어간다.
create index if not exists profiles_is_seed_idx
  on public.profiles (id)
  where is_seed;

-- =============================================================================
-- 2. (확인용) 가입 트리거는 손대지 않는다
-- =============================================================================
-- handle_new_user 는 is_seed 를 안 쓰므로 신규 가입자는 DEFAULT false 로 들어온다.
-- 여기서 재정의하지 않는다(기존 트리거 로직 변경 금지). 이 주석은 "확인했고 불변"의 기록.

-- =============================================================================
-- 3. is_seed 쓰기 잠금 (belt-and-suspenders)
-- =============================================================================
-- 위협모델 주석대로, 컬럼 나열형 GRANT 덕에 authenticated 는 이미 is_seed 를 못 쓴다.
-- 아래는 그 사실을 **명시적으로 못박는다**(없는 권한 REVOKE = no-op, 재실행 안전).
-- 미래에 누군가 profiles 에 테이블 전체 GRANT(컬럼 미나열)를 추가해도 이 REVOKE 가
-- 남아 있으면 is_seed 만은 계속 잠긴다.
revoke insert (is_seed), update (is_seed) on public.profiles from anon, authenticated;
-- 읽기(select)는 막지 않는다 — profiles 는 공개 테이블이고, is_seed 노출이
-- 보안 문제는 아니다(운영 신호일 뿐). UI 가 안 읽으므로 화면엔 티가 안 난다.

-- =============================================================================
-- 4. de-seed 도구 — 오래된 시드 글 소량 정리 (파라미터화, 운영자 전용)
-- =============================================================================
-- 나중에 실사용자 활동이 자라면 시드를 **순차·소량·티 안 나게** 걷어낸다
-- (docs/community-seeding/README.md §5). 급격한 대량삭제는 "커뮤니티가 반토막" 나는
-- 티를 내므로 금지 → "오래된 N개"씩 나눠 지운다.
--
-- 삭제 순서 / FK·트리거 안전:
--   scenarios 는 scenario_likes·comments·comment_likes 를 ON DELETE CASCADE 로 매단다.
--   시드 **글 하나**를 지우면 그 아래 좋아요/댓글/댓글좋아요가 캐스케이드로 함께 사라지고,
--   카운터 트리거(sync_*_count, SECURITY DEFINER)는 사라지는 부모를 향해 UPDATE 하지만
--   행이 없으면 no-op 이라 에러가 없다(앱의 deleteScenario 와 동일한, 검증된 경로).
--
-- 실사용자 기여 보호(README §5-2): **비-시드 사용자의 살아있는 댓글**이 달린 시드 글은
--   지우지 않는다(지우면 실사용자 댓글이 고아가 된다). 그런 글은 마지막까지 존치한다.
--
-- 권한: SECURITY INVOKER(기본) — 호출자의 권한으로 돈다. scenarios DELETE 권한과 RLS 우회를
--   가진 **service_role/postgres 만** 실질 실행할 수 있고, §아래 GRANT 로 anon/authenticated
--   실행을 차단한다. 자동 실행은 없다 — 운영자가 service_role 로 수동 호출한다.
create or replace function public.deseed_oldest_seed_scenarios(p_limit integer default 5)
returns table (deleted_scenario_id uuid, deleted_created_at timestamptz)
language plpgsql
set search_path = ''
as $$
begin
  return query
  with victims as (
    select s.id, s.created_at
      from public.scenarios s
      join public.profiles p on p.id = s.user_id
     where p.is_seed
       -- 실사용자(비-시드)의 살아있는 댓글이 달린 시드 글은 보호(고아 방지)
       and not exists (
         select 1
           from public.comments c
           join public.profiles cp on cp.id = c.user_id
          where c.scenario_id = s.id
            and c.deleted_at is null
            and not cp.is_seed
       )
     order by s.created_at asc, s.id asc
     limit greatest(coalesce(p_limit, 0), 0)
  )
  delete from public.scenarios s
   using victims v
   where s.id = v.id
  returning s.id, s.created_at;
end;
$$;

-- 실행 권한: service_role(서버)만. anon/authenticated/public 은 차단.
revoke all on function public.deseed_oldest_seed_scenarios(integer) from public;
revoke all on function public.deseed_oldest_seed_scenarios(integer) from anon, authenticated;
grant execute on function public.deseed_oldest_seed_scenarios(integer) to service_role;

comment on function public.deseed_oldest_seed_scenarios(integer) is
  '운영자 전용(service_role): 가장 오래된 시드 글 최대 p_limit 개를 삭제한다. 실사용자 댓글이 달린 시드 글은 건너뛴다(고아 방지). 좋아요/댓글은 CASCADE 로 함께 삭제. 시드 계정이 남긴 좋아요/댓글·계정 자체 삭제는 이 함수가 아니라 docs/community-seeding/README.md 5.7 절의 순서/admin API 로.';

-- =============================================================================
-- 끝. 요약
-- =============================================================================
--   - profiles.is_seed boolean not null default false (멱등 ADD COLUMN)
--   - 부분 인덱스 profiles_is_seed_idx (where is_seed)
--   - is_seed 쓰기 = service_role 만 (컬럼 GRANT 방어 + 명시 REVOKE, 읽기는 무방)
--   - handle_new_user 불변 (신규 가입자 default false)
--   - de-seed 함수 deseed_oldest_seed_scenarios(p_limit) — service_role 전용, 실사용자
--     댓글 달린 시드 글 보호. 전체 teardown 순서/계정삭제는 README §5.7.
--   - 기존 커뮤니티 테이블·RLS·트리거·영속/공유 스키마 전부 불변
-- =============================================================================
