-- =============================================================================
-- snowball-income — 파이어족들(kind='fire') 글 작성을 **운영자에게만** 연다 (DB 강제)
-- =============================================================================
-- 2026-08-09 사용자 결정. 종전 방침은 "UI 수준 차단"이었는데(20260725000000 이 is_admin 을
-- "권한이 아니라 표시 힌트"로 못 박았다), 이 지면만큼은 서버가 막는다.
--
-- ## 왜 UI 만으로는 부족한가
--
-- 브라우저에 나가는 **anon 키로 PostgREST 를 직접 때리면** 화면을 거치지 않고 행을 만들 수 있다.
-- 게시판·갤러리는 원래 누구나 쓰는 지면이라 그것이 문제가 아니었지만, 파이어족들은 **운영자만
-- 쓰는 지면**이다. UI 만 막으면 "운영자만 쓴다"는 것이 화면의 약속일 뿐 사실이 아니다.
--
-- ## 왜 이 조건이 안전한가
--
-- `profiles.is_admin` 은 **update GRANT 가 없다**(20260725000000). 즉 사용자가 자기 행의
-- is_admin 을 true 로 바꿀 수 없어 **자가 승격이 불가능**하다. 그래서 이 값을 정책 조건으로
-- 쓰는 것은 안전하다 — 20260808000000 계열 주석이 예고해 둔 그대로다.
--
-- ## 무엇이 바뀌고 무엇이 그대로인가
--
-- 정책 하나(`posts_insert_own`)를 **조건만 더해** 다시 만든다.
--   · `kind <> 'fire'` 인 글(갤러리·게시판)은 **종전과 완전히 같다** — 누구나 자기 이름으로 쓴다.
--   · `kind = 'fire'` 인 글은 **is_admin 인 사람만** 쓸 수 있다.
-- 읽기·수정·삭제 정책은 건드리지 않는다. 운영자가 쓴 글을 모두가 읽고, 좋아요·댓글은 그대로다.
--
-- ⚠ `service_role` 은 이 정책의 영향을 받지 않지만(RLS 우회), posts 테이블 GRANT 가 없어서
--   어차피 직접 insert 하지 못한다(20260729000000 주석 참고).
--
-- ## 되돌리기
--
--   drop policy if exists posts_insert_own on public.posts;
--   create policy posts_insert_own on public.posts
--     for insert to authenticated
--     with check (user_id = (select auth.uid()));
-- =============================================================================

drop policy if exists posts_insert_own on public.posts;

create policy posts_insert_own on public.posts
  for insert to authenticated
  with check (
    -- ① 남의 이름으로 게시(사칭) 차단 — 종전 조건 그대로.
    user_id = (select auth.uid())
    and (
      -- ② 파이어족들 지면만 운영자로 좁힌다. 나머지 종류는 조건이 붙지 않는다.
      kind <> 'fire'
      or exists (
        select 1
        from public.profiles p
        where p.id = (select auth.uid())
          and p.is_admin
      )
    )
  );

comment on policy posts_insert_own on public.posts is
  '자기 이름으로만 게시할 수 있다(사칭 차단). 추가로 kind=''fire''(파이어족들)는 profiles.is_admin 인 사용자만 쓸 수 있다 — is_admin 은 update GRANT 가 없어 자가 승격이 불가능하므로 이 조건은 안전하다.';

-- =============================================================================
-- 적용 후 확인 (선택)
-- =============================================================================
--   select polname, pg_get_expr(polwithcheck, polrelid) as with_check
--   from pg_policy
--   where polrelid = 'public.posts'::regclass and polname = 'posts_insert_own';
--
-- 기대: with_check 에 kind <> 'fire' 와 is_admin 조건이 보인다.
