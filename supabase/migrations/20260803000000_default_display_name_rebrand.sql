-- =============================================================================
-- 기본 표시이름(닉네임) 폴백에서 구 브랜드 잔재를 걷어낸다: '스노우볼러' → '투자자'
-- =============================================================================
--
-- ## 왜
--
--   가입 트리거 handle_new_user 는 OAuth 메타데이터에 쓸 만한 이름이 하나도 없을 때
--   `'스노우볼러' || <uuid 앞 6자>` 를 표시이름으로 넣었다(community.sql:139 →
--   20260728000000_fix_kakao_profile_avatar.sql:54 로 승계). 이 값은 프로필·글 목록·
--   댓글에 그대로 **사용자에게 보이는 카피**로 나간다.
--
--   2026-08-03 리브랜딩(Snowball Income → Hungry Hippo)에서 "눈덩이/스노우볼" 비유는
--   전 표면 완전 금지가 됐고, 브랜드 예외 조항도 폐기됐다. 화면에 뜨는 문자열이므로
--   보호 대상 식별자(localStorage `snowball:` 접두사·IndexedDB 이름·계산 엔진 심볼)가 아니다.
--
-- ## 무엇을
--
--   폴백 접두사만 '투자자' 로 바꾼다. 제품명(Hungry Hippo)을 넣지 않는 이유:
--   ① 한글 음차를 만들지 않는다는 확정 결정에 걸리고 ② 표시이름은 사람의 이름 자리라
--   서비스 이름이 들어가면 "운영자 계정"처럼 읽힌다. 중립적인 역할명이 맞다.
--
--   coalesce 사슬(full_name → name → preferred_username → nickname)과 avatar_url 미저장,
--   40자 절단은 **그대로다** — 이 마이그레이션은 폴백 문자열 하나만 바꾼다.
--
-- ## 하위 호환
--
--   create or replace 라 멱등하다. **기존 profiles 행은 건드리지 않는다** — 이미
--   '스노우볼러xxxxxx' 로 만들어진 계정의 표시이름은 그 사용자의 데이터이고, 서버가
--   말없이 바꾸면 본인이 알아보던 이름이 사라진다(닉네임은 화면에서 직접 수정 가능하다).
--   신규 가입 경로만 바뀐다.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(btrim(coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'preferred_username'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'nickname'), ''),
      '투자자' || substr(replace(new.id::text, '-', ''), 1, 6)
    )), 40),
    -- avatar_url 은 저장하지 않는다(이니셜 아바타로 통일 + 카카오 http URL 제약 위반 회피).
    null
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 트리거 재바인딩은 불필요하다(같은 함수를 교체했을 뿐). on_auth_user_created 는 그대로 이 함수를 가리킨다.
