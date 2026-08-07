-- Supabase Security Advisor 경고 정리 (2026-08-08)
--
-- 두 종류의 경고를 닫는다. 둘 다 **동작은 그대로 두고 노출만 줄이는** 변경이라 앱 코드 수정이
-- 필요 없다.
--
-- ## 1. function_search_path_mutable
--
-- search_path 가 고정돼 있지 않으면 호출자가 그 값을 바꿔 함수 안의 이름 해석을 가로챌 수 있다.
-- SECURITY DEFINER 함수에서는 그게 곧 권한 상승 경로다(공격자가 만든 스키마의 동명 함수가
-- 먼저 잡힌다).
--
-- 🔴 값을 '' (빈 문자열)이 아니라 public, pg_temp 로 못 박는다. 빈 문자열은 함수 본문의 모든
--    이름을 스키마까지 적어야 동작하는데 이 레포의 함수들은 그렇게 쓰여 있지 않다 — 지금 바꾸면
--    조용히 깨진다. 고정하는 것만으로 "호출자가 바꿀 수 있다"는 위험은 사라지고 경고도 닫힌다.
-- ⚠ 앞으로 새 함수를 만들 때는 처음부터 SET search_path = public, pg_temp 를 붙여라.
--
-- ## 2. anon/authenticated_security_definer_function_executable
--
-- 🔴 **대부분은 트리거 함수다.** 트리거는 테이블 이벤트로 실행되고 그때 EXECUTE 권한을 보지
--    않는다. 그런데 public 스키마에 있으면 PostgREST 가 /rest/v1/rpc/<name> 으로도 노출해서
--    로그인하지 않은 사람이 직접 부를 수 있는 상태였다. 트리거 동작에는 EXECUTE 권한이 필요
--    없으므로 **회수해도 잃는 것이 없다.**
--
-- ⚠ 아래 넷은 **앱이 실제로 부르는 RPC** 라 회수하지 않는다. 경고는 남지만 의도된 것이다:
--     create_shared_snapshot · get_shared_snapshot · register_post_view · is_post_visible
--   (앞의 셋은 공유 링크·조회수 기능이 쓰고, is_post_visible 은 RLS 정책이 쓴다.)
--
-- ## 🔴 왜 이름을 하드코딩하지 않는가
--
-- 처음에는 `alter function public.enforce_scenario_quota() ...` 처럼 한 줄씩 적었다가 실패했다
-- (42883: function does not exist). 그 함수는 scenario → post 개명 때 사라졌는데, 옛 마이그레이션
-- 파일에는 이름이 남아 있어 그대로 옮겨 적은 것이다. 게다가 인자 타입까지 손으로 맞춰야 해서
-- 틀릴 자리가 두 배다.
--
-- 그래서 **pg_proc 을 조회해 실제로 존재하는 것에만** 적용한다. 없는 함수는 조용히 건너뛴다.
-- 인자 서명도 pg_get_function_identity_arguments() 가 만들어 주므로 손으로 적을 일이 없다.
-- 배포마다 함수 구성이 다를 수 있는데(기능 플래그로 안 만든 것들) 그때도 이 파일은 그대로 돈다.

do $$
declare
  target record;
  signature text;

  /*
   * search_path 를 고정할 대상. public 스키마의 우리 함수 전부다 — 하나만 남기면 다음 스캔에서
   * 다시 뜬다. 확장(pg_trgm 등)이 심은 함수는 우리 것이 아니므로 제외한다(아래 조회에서 거른다).
   */
  pin_all boolean := true;

  /*
   * EXECUTE 를 회수할 함수 이름.
   *
   * 🔴 앱이 부르는 RPC 넷은 **여기 없다**(위 머리말). 이 목록에 새 이름을 넣기 전에 "앱이
   *    supabase.rpc() 로 부르는가"를 먼저 확인하라 — 회수하면 그 기능이 조용히 죽는다.
   */
  revoke_targets text[] := array[
    -- 트리거 함수: 테이블 이벤트로 실행된다. RPC 로 열려 있을 이유가 없다.
    'touch_updated_at',
    'protect_comment_update',
    'enforce_comment_rules',
    'enforce_post_quota',
    'enforce_scenario_quota',
    'enforce_user_app_state_quota',
    'handle_new_user',
    'sync_comment_like_count',
    'sync_post_comment_count',
    'sync_post_like_count',
    'sync_scenario_comment_count',
    'sync_scenario_like_count',
    -- 이벤트 트리거.
    'rls_auto_enable',
    -- 값 검증 함수: CHECK 제약이 부르고, 제약 평가는 EXECUTE 권한을 보지 않는다.
    'is_valid_post_payload',
    'is_valid_news_payload',
    'is_valid_scenario_payload'
  ];
begin
  for target in
    select
      p.oid,
      p.proname,
      pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    left join pg_depend d
      on d.objid = p.oid
      and d.deptype = 'e' -- 확장이 심은 함수
    where n.nspname = 'public'
      and d.objid is null -- 확장 소유 함수는 건드리지 않는다(pg_trgm 등)
      and p.prokind = 'f'
  loop
    signature := format('public.%I(%s)', target.proname, target.args);

    if pin_all then
      execute format('alter function %s set search_path = public, pg_temp', signature);
    end if;

    if target.proname = any (revoke_targets) then
      /*
       * public 에서 **먼저** 회수한다 — anon·authenticated 는 public 을 상속하므로, 역할에서만
       * 빼고 public 을 남기면 아무것도 달라지지 않는다(흔한 함정이다).
       */
      execute format('revoke execute on function %s from anon, authenticated, public', signature);
      raise notice 'EXECUTE 회수: %', signature;
    end if;
  end loop;
end
$$;
