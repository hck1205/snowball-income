-- =============================================================================
-- snowball-income — 남은 Security Advisor 경고 정리 + 앞 마이그레이션의 과잉 회수 복구
-- (20260808000000 의 후속. 2026-08-08)
-- =============================================================================
--
-- 앞 파일(20260808000000)이 닫은 것과, 이 파일이 닫는 것
-- ---------------------------------------------------------------------------
-- 앞 파일은 public 스키마 함수의 search_path 를 고정하고, **트리거·CHECK 검증 함수**의
-- EXECUTE 를 anon/authenticated/public 에서 회수했다. 그 뒤 다시 스캔했더니 세 종류가 남았다:
--
--   ① extension_in_public — pg_trgm 이 public 에 심겨 있다.
--   ② anon/authenticated_security_definer_function_executable — 넷.
--   ③ auth_leaked_password_protection — SQL 로 못 고친다(대시보드 토글). 아래 꼬리말 참고.
--
-- 🔴 그리고 앞 파일에 **버그가 있었다.**
-- ---------------------------------------------------------------------------
-- 앞 파일은 "CHECK 제약이 부르는 함수는 EXECUTE 권한을 보지 않는다"고 적고
-- is_valid_post_payload · is_valid_news_payload · is_valid_scenario_payload 의 EXECUTE 를
-- 회수했다. **그 전제가 틀렸다.** 트리거 함수는 맞다(트리거 호출 경로는 ACL 을 보지 않고,
-- CREATE TRIGGER 시점에만 본다). 그러나 CHECK 제약과 RLS 정책의 표현식은 평범한 질의
-- 표현식으로 실행돼 실행 시점에 **호출자 권한으로 함수 ACL 검사를 통과해야 한다.**
--
-- 결과: posts_payload_valid_or_null CHECK 가 걸린 INSERT/UPDATE 가
--       `permission denied for function is_valid_post_payload` (42501) 로 거절된다 —
--       즉 **글·뉴스 게시가 막혀 있다.** 읽기 경로는 무사하다(CHECK 는 쓰기에만 걸린다).
--       이 파일이 EXECUTE 를 되돌려 그 길을 다시 연다.
--
-- 그러면 경고 ②는 어떻게 닫는가 — 회수 대신 **스키마 이동**
-- ---------------------------------------------------------------------------
-- 경고 ②의 본질은 "SECURITY DEFINER 인데 PostgREST 가 /rest/v1/rpc/<name> 으로 연다"이다.
-- PostgREST 는 **노출 스키마(public)** 의 함수만 연다. 그러니 EXECUTE 를 뺏지 않고
-- 함수를 public 밖으로 옮기면 둘 다 만족한다 — RPC 로는 안 보이고, CHECK·RLS 는 계속 돈다.
--
-- CHECK 제약과 RLS 정책은 함수를 **이름이 아니라 OID 로** 참조하므로 스키마를 옮겨도
-- 그대로 따라온다(20260723000000 이 rename 으로 같은 성질을 이미 썼다).
--
-- ⚠ 남는 셋은 **의도된 노출**이라 옮기지 않는다 — 앱이 anon 키로 직접 부르는 RPC 다:
--     create_shared_snapshot · get_shared_snapshot · register_post_view
--   비로그인 공유·조회수가 이 셋 위에 서 있다(20260720000000 머리말의 신뢰 모델).
--   경고는 계속 뜨지만 "그렇게 설계했다"가 답이다. 회수하면 기능이 죽는다.
--
-- 왜 private 이 아니라 internal 인가
-- ---------------------------------------------------------------------------
-- private 스키마는 20260714000000 이 **완전히 봉인**한 곳이다(조회수 해싱 솔트가 산다 —
-- anon/authenticated 는 USAGE 조차 없다). 여기 옮기고 EXECUTE 를 주면 그 봉인 문구와
-- 어긋나고, 나중에 누가 `revoke all on schema private` 를 다시 돌리면 조용히 깨진다.
-- 그래서 용도가 다른 스키마를 새로 판다:
--     private  = 클라이언트가 절대 못 닿는 **데이터**(비밀)
--     internal = 클라이언트를 **대신해** DB 가 부르는 서버측 헬퍼(RLS·CHECK). API 미노출.
--
-- 멱등성: 이미 옮겨졌으면 건너뛴다. 없는 함수는 조용히 넘어간다(개명 전/후 DB 양쪽에서 선다).
-- ⚠ 이전 마이그레이션은 절대 수정하지 않는다(원장). 이 파일이 그 위에 덧쓴다.
-- =============================================================================

-- =============================================================================
-- 1. internal 스키마 — API 에 노출되지 않는 서버측 헬퍼 자리
-- =============================================================================
create schema if not exists internal;

comment on schema internal is
  'RLS 정책·CHECK 제약이 호출자 권한으로 부르는 서버측 헬퍼 함수. PostgREST 노출 스키마가 '
  '아니라 /rest/v1/rpc 로는 보이지 않는다. 비밀 데이터는 여기가 아니라 private 스키마에 둔다.';

-- 테이블은 이 스키마에 두지 않는다 — 혹시 생기더라도 클라이언트가 못 읽게 미리 막는다.
revoke all on all tables in schema internal from anon, authenticated;

/*
 * USAGE 를 주는 이유: CHECK·RLS 는 OID 로 부르므로 스키마 USAGE 가 필요 없지만,
 * 나중에 다른 함수 본문이 internal.foo() 를 **이름으로** 부르면 그때는 필요해진다.
 * 스키마에 테이블이 없고 API 에도 안 실리므로 USAGE 자체로 새는 것은 없다.
 */
grant usage on schema internal to anon, authenticated, service_role;

-- =============================================================================
-- 2. RLS·CHECK 헬퍼를 public → internal 로 옮기고 EXECUTE 를 되돌린다
-- =============================================================================
-- 이름 목록은 하드코딩하되 **실재 여부를 확인하고** 처리한다(앞 파일이 42883 으로 넘어진
-- 자리다). 인자 서명은 pg_get_function_identity_arguments() 가 만들어 준다.
do $$
declare
  target record;
  old_signature text;
  new_signature text;

  /*
   * 옮길 대상 = "클라이언트가 RPC 로 부르지 않는데 DB 가 클라이언트 권한으로 부르는" 함수.
   *
   * 🔴 여기에 이름을 더하기 전에 "앱이 supabase.rpc() 로 부르는가"를 먼저 확인하라.
   *    부르는 함수를 옮기면 PostgREST 에서 사라져 404(PGRST202)로 죽는다.
   *    현재 앱이 부르는 RPC 는 shared/lib/supabase/types.ts 의 Database.Functions 가 정본이다.
   */
  move_targets text[] := array[
    -- RLS 정책 4곳이 쓴다(comments select/insert · post_likes insert · comment_likes insert).
    'is_post_visible',
    -- posts.payload CHECK 가 쓴다. 개명 전 DB 를 위해 옛 이름도 함께 본다.
    'is_valid_post_payload',
    'is_valid_scenario_payload',
    'is_valid_news_payload'
  ];
begin
  for target in
    select
      p.oid,
      p.proname,
      pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and p.proname = any (move_targets)
  loop
    old_signature := format('public.%I(%s)', target.proname, target.args);
    new_signature := format('internal.%I(%s)', target.proname, target.args);

    execute format('alter function %s set schema internal', old_signature);

    /*
     * 🔴 EXECUTE 복구가 이 파일의 본론이다(머리말 "앞 파일에 버그가 있었다").
     *    CHECK·RLS 표현식은 호출자 권한으로 평가되므로 anon/authenticated 가 EXECUTE 를
     *    갖고 있어야 게시·댓글 열람이 선다. public(전체) 에는 주지 않는다.
     */
    execute format('revoke all on function %s from public', new_signature);
    execute format('grant execute on function %s to anon, authenticated, service_role', new_signature);

    raise notice 'internal 로 이동 + EXECUTE 복구: % → %', old_signature, new_signature;
  end loop;
end
$$;

-- =============================================================================
-- 3. pg_trgm 을 public 밖으로 (extension_in_public)
-- =============================================================================
-- 확장이 public 에 있으면 그 함수·연산자가 앱 스키마와 한 이름공간을 쓴다. 확장을 올리거나
-- 내릴 때 우리 객체와 충돌할 수 있고, 무엇보다 확장 함수가 API 표면에 섞인다.
--
-- 안전한 이유: 이 레포가 pg_trgm 을 쓰는 곳은 GIN 인덱스의 **연산자 클래스** 하나뿐이다
--   (posts_search_title_trgm · posts_search_description_trgm 의 gin_trgm_ops).
--   인덱스는 opclass 를 OID 로 들고 있어 스키마가 바뀌어도 그대로 선다. 앱 질의는 ILIKE —
--   내장 연산자라 pg_trgm 이름 해석이 필요 없다. 즉 이름으로 pg_trgm 을 부르는 코드가 없다.
--   (shared/lib/supabase/pagination.ts 의 검색 경로가 그 ILIKE 다.)
--
-- 🔴 이 단계만 예외를 삼킨다. 확장 이동은 권한·호스팅 사정으로 막힐 수 있는데(WARN 등급의
--    위생 문제다), 그것 때문에 2번의 **게시 복구**까지 롤백되면 손해가 훨씬 크다.
do $$
declare
  current_schema_name text;
begin
  select n.nspname
    into current_schema_name
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
   where e.extname = 'pg_trgm';

  if current_schema_name is null then
    raise notice 'pg_trgm 미설치 — 건너뛴다';
    return;
  end if;

  if current_schema_name <> 'public' then
    raise notice 'pg_trgm 이 이미 % 에 있다 — 건너뛴다', current_schema_name;
    return;
  end if;

  create schema if not exists extensions;
  grant usage on schema extensions to anon, authenticated, service_role;

  alter extension pg_trgm set schema extensions;
  raise notice 'pg_trgm: public → extensions';
exception when others then
  -- 이동에 실패해도 나머지 변경은 살린다. 경고는 다음 스캔에 다시 뜬다.
  raise warning 'pg_trgm 이동 실패(경고는 남는다): % (%)', sqlerrm, sqlstate;
end
$$;

-- =============================================================================
-- 끝. 요약
-- =============================================================================
--   - internal 스키마 신설(API 미노출) — RLS·CHECK 헬퍼의 자리. 비밀은 계속 private.
--   - is_post_visible / is_valid_post_payload(·scenario) / is_valid_news_payload 를
--     public → internal 로 이동 + anon·authenticated EXECUTE **복구**
--     → 경고 ② 넷 중 하나가 닫히고, 앞 파일이 막아 둔 **게시 경로가 다시 열린다**
--   - pg_trgm: public → extensions (경고 ① 종료). 실패해도 나머지는 적용된다.
--   - 앱 코드 변경 0 · 테이블/컬럼/정책/제약 정의 변경 0 · 데이터 무변경
--
-- 남는 경고 (의도된 것 / SQL 밖의 것)
-- ---------------------------------------------------------------------------
--   - create_shared_snapshot · get_shared_snapshot · register_post_view
--     → 앱이 anon 키로 직접 부르는 RPC. 노출이 곧 기능이다. 회수하면 공유·조회수가 죽는다.
--   - auth_leaked_password_protection
--     → SQL 로 못 켠다. Dashboard → Authentication → Sign In / Providers →
--       "Leaked password protection" 토글. main.tsx 가 signInWithPassword 를 쓰므로
--       (관리자 로그인) 켤 값어치가 있다.
--
-- 실행 뒤 확인 (그대로 붙여 넣어 보라)
-- ---------------------------------------------------------------------------
--   -- ① 헬퍼가 internal 로 갔고 EXECUTE 가 붙어 있는가
--   select n.nspname, p.proname,
--          has_function_privilege('authenticated', p.oid, 'execute') as auth_exec,
--          has_function_privilege('anon',          p.oid, 'execute') as anon_exec
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where p.proname in ('is_post_visible','is_valid_post_payload','is_valid_news_payload');
--   → nspname 이 internal, 두 컬럼 모두 true
--
--   -- ② CHECK 제약이 새 스키마를 가리키는가 (정의는 자동으로 따라온다)
--   select conname, pg_get_constraintdef(oid)
--     from pg_constraint
--    where conrelid = 'public.posts'::regclass and contype = 'c'
--      and pg_get_constraintdef(oid) ilike '%payload%';
--   → internal.is_valid_news_payload / internal.is_valid_post_payload 가 보인다
--
--   -- ③ 게시 경로가 실제로 열렸는가 (롤백하므로 데이터는 남지 않는다)
--   begin;
--     set local role authenticated;
--     select internal.is_valid_news_payload('{"url":"https://example.com"}'::jsonb);
--   rollback;
--   → true (42501 permission denied 가 나오면 EXECUTE 복구가 안 된 것이다)
--
--   -- ④ trgm 인덱스가 여전히 쓰이는가
--   explain select id from public.posts where title ilike '%배당%';
--   → Bitmap Index Scan on posts_search_title_trgm
-- =============================================================================
