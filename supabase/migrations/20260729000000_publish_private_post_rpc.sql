-- =============================================================================
-- snowball-income — 비공개 포트폴리오 글 발행 RPC (service_role 전용)
-- =============================================================================
-- 왜 이게 필요한가:
--   운영 도구(tools/gallery/)가 사용자 본인 명의의 포트폴리오 글을 **비공개로** 만들어 두고,
--   사용자가 앱에서 확인한 뒤 공개 여부를 직접 판단하는 흐름을 지원한다.
--
-- 왜 테이블 GRANT 가 아니라 RPC 인가:
--   service_role 은 RLS 를 우회하지만 **GRANT 는 우회하지 못한다**. 20260714000000 의 GRANT 는
--   anon/authenticated 에만 주어져 있어 service_role 로는 posts 에 쓸 수 없다(42501).
--   여기서 테이블 권한을 열면 "아무 계정 명의로, is_public=true 로도" 쓸 수 있게 된다.
--   대신 **행위 하나**만 여는 SECURITY DEFINER 함수를 둔다:
--     - `is_public` 을 함수 본문에 **false 로 하드코딩** → 호출자가 무슨 값을 보내든 공개될 수 없다.
--       (스키마 주석의 원칙 "실수로 INSERT 하면 공개가 아니라 비공개여야 한다" 를 DB 가 보장한다.)
--     - `kind` 도 'portfolio' 고정 → 이 함수로 게시판 글을 만들 수 없다.
--   이 레포는 이미 같은 패턴을 쓴다(create_shared_snapshot / toggle_post_like / register_post_view,
--   그리고 service_role 전용 execute 선례는 20260721000000 의 deseed_oldest_seed_scenarios).
--
-- 무엇이 여전히 강제되는가 (함수가 우회하지 않는 것):
--   - posts_payload CHECK = public.is_valid_scenario_payload(payload)
--   - title/description/body 길이 CHECK, sim_summary 크기·타입 CHECK
--   - enforce_scenario_quota 트리거(1인 30개 상한)
--   즉 이 함수는 "권한"만 열고 "무결성"은 그대로 둔다.
--
-- ⚠ SECURITY DEFINER + `set search_path = ''` — 스키마 하이재킹 방지를 위해 모든 참조를
--   스키마 한정(public.posts)으로 쓴다. 레포의 다른 SECURITY DEFINER 함수와 같은 규율.
-- =============================================================================

create or replace function public.publish_private_post(
  p_user_id     uuid,
  p_title       text,
  p_description text,
  p_body        text,
  p_payload     jsonb,
  p_sim_summary jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.posts (user_id, title, description, body, payload, sim_summary, kind, is_public)
  values (p_user_id, p_title, p_description, p_body, p_payload, p_sim_summary, 'portfolio', false)
  returning id into v_id;

  return v_id;
end;
$$;

comment on function public.publish_private_post(uuid, text, text, text, jsonb, jsonb) is
  '운영 도구 전용(service_role): 지정 사용자 명의로 포트폴리오 글을 **비공개(is_public=false)** 로 1건 생성하고 id 를 돌려준다. is_public 과 kind 는 함수 본문에 고정돼 호출자가 바꿀 수 없다. 공개 전환은 사용자가 앱에서 직접 한다. 도구: tools/gallery/publish_post.py';

-- 권한: service_role 만. 브라우저에 나가는 anon/authenticated 는 실행할 수 없다
-- (일반 사용자는 기존 authenticated GRANT 로 자기 글을 직접 쓴다 — 이 함수가 필요 없다).
revoke all on function public.publish_private_post(uuid, text, text, text, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.publish_private_post(uuid, text, text, text, jsonb, jsonb)
  to service_role;
