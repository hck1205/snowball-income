-- =============================================================================
-- AI 리포터(is_bot)도 파이어족들(kind='fire') 글을 쓸 수 있게 한다 (2026-11-11)
-- =============================================================================
--
-- ## 왜
--
-- 사용자 결정(2026-11-11): AI 리포터가 주 1회 파이어족들에 유튜브 영상 하나를 소개 글과 함께 올린다.
-- 그런데 파이어족들 글쓰기는 운영자(is_admin)만 열려 있다(20260810000001). 봇을 운영자로 만들면
-- 운영자 권한 전체가 봇에 넘어가므로, **쓰기 조건에 is_bot 만 더한다.**
--
-- ## 무엇이 바뀌고 무엇이 그대로인가
--
-- 정책 `posts_insert_own` 을 조건만 넓혀 다시 만든다.
--   · 사칭 차단(user_id = auth.uid())은 그대로.
--   · kind <> 'fire' 는 종전과 같다(누구나 자기 이름으로).
--   · kind = 'fire' 는 is_admin **또는 is_bot** 인 사람만.
--
-- ## 🔴 왜 안전한가
--
-- is_admin·is_bot 둘 다 update/insert GRANT 가 없다(20260725000000 · 20261110000000) — 사용자가 스스로
-- 운영자나 봇이 될 수 없다. 20260810000001 과 같은 근거다.
--
-- ## 되돌리기 — 20260810000001 의 정책을 다시 만든다
--
--   drop policy if exists posts_insert_own on public.posts;
--   create policy posts_insert_own on public.posts for insert to authenticated
--     with check (user_id = (select auth.uid()) and (kind <> 'fire' or exists (
--       select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin)));
-- =============================================================================

drop policy if exists posts_insert_own on public.posts;

create policy posts_insert_own on public.posts
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      kind <> 'fire'
      or exists (
        select 1
        from public.profiles p
        where p.id = (select auth.uid())
          and (p.is_admin or p.is_bot)
      )
    )
  );

comment on policy posts_insert_own on public.posts is
  '자기 이름으로만 게시할 수 있다(사칭 차단). kind=''fire''(파이어족들)는 profiles.is_admin 또는 is_bot(AI 리포터)인 사용자만 — 두 플래그 모두 GRANT 가 없어 자가 승격이 불가능하다.';
