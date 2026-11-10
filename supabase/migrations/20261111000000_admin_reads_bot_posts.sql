-- =============================================================================
-- 운영자(is_admin)가 AI 리포터(is_bot) 계정의 **비공개 글을 읽을 수 있게** 한다 (2026-11-10)
-- =============================================================================
--
-- ## 왜
--
-- AI 리포터 글은 처음에 비공개로 올라가고 운영자가 화면에서 검토한 뒤 공개한다(사용자 결정).
-- 그런데 읽기 정책(`posts_select_public_or_own`)은 "공개 글 또는 내 글"뿐이라, 비공개 봇 글은
-- **봇 계정 본인만** 볼 수 있었다 — 운영자가 검토할 길이 없었다. service_role 도 posts GRANT 가 없어
-- 읽지 못한다(20260729000000).
--
-- ## 무엇이 바뀌고 무엇이 그대로인가
--
-- **읽기 정책 하나를 더한다**(permissive 정책끼리는 OR 로 합쳐진다). 기존 정책은 건드리지 않는다.
--   · 열리는 것: `is_admin` 인 로그인 사용자 → `is_bot` 계정이 쓴 글(비공개 포함) **읽기만**.
--   · 그대로: 사람 사용자의 비공개 글은 운영자에게도 계속 안 보인다. 수정·삭제·쓰기 정책 변화 없음.
--
-- ## 🔴 왜 안전한가
--
-- `is_admin`·`is_bot` 둘 다 update/insert GRANT 가 없다(20260725000000 · 20261110000000) —
-- 사용자가 스스로 운영자나 봇이 될 수 없다. 20260810000001 이 같은 근거로 is_admin 을 정책에 썼다.
--
-- 운영자 판정은 `(select …)` 로 감싸 **쿼리당 한 번만** 평가된다(initplan). 비운영자에게는 그 값이
-- false 라 행마다 도는 봇 판정까지 가지 않는다 — 일반 사용자의 목록 조회 비용은 사실상 그대로다.
--
-- ## 되돌리기
--
--   drop policy if exists posts_select_bot_for_admin on public.posts;
-- =============================================================================

drop policy if exists posts_select_bot_for_admin on public.posts;

create policy posts_select_bot_for_admin on public.posts
  for select to authenticated
  using (
    (select exists (
      select 1 from public.profiles a
      where a.id = (select auth.uid()) and a.is_admin
    ))
    and exists (
      select 1 from public.profiles b
      where b.id = posts.user_id and b.is_bot
    )
  );

comment on policy posts_select_bot_for_admin on public.posts is
  '운영자(profiles.is_admin)는 봇 계정(profiles.is_bot)의 글을 비공개여도 읽을 수 있다 — AI 리포터 초안 검토용. 두 플래그 모두 GRANT 가 없어 자가 승격 불가.';

-- =============================================================================
-- 적용 후 확인 (선택)
--   select policyname from pg_policies where tablename = 'posts' and cmd = 'SELECT';
--   -- 기대: posts_select_public_or_own, posts_select_bot_for_admin
--   select id, is_admin from public.profiles where is_admin;   -- 내 계정이 운영자인지
-- =============================================================================
