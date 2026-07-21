-- =============================================================================
-- 카카오 로그인 500 수정 — 가입 트리거가 avatar_url 을 저장하지 않도록 변경
-- =============================================================================
--
-- ## 증상 (프로덕션 장애: 카카오만 로그인 실패)
--
--   Auth 콜백에서 500:
--     new row for relation "profiles" violates check constraint
--     "profiles_avatar_url_check" (SQLSTATE 23514)
--     → current transaction is aborted (SQLSTATE 25P02)
--
-- ## 원인
--
--   profiles.avatar_url 에는 `check (avatar_url is null or avatar_url ~ '^https://')`
--   제약이 있다(community.sql:109). 그런데 가입 트리거 handle_new_user 는 OAuth
--   메타데이터의 avatar_url/picture 를 그대로 넣는다. **카카오가 주는 프로필 이미지 URL 은
--   `http://k.kakaocdn.net/...` (비-https)** 라 이 제약을 위반한다 → INSERT 실패 →
--   트랜잭션 abort → 콜백 500 → 세션 미생성 → 로그인 실패. (구글은 https 라 통과해서
--   "카카오만 안 됨" 증상이 됐다.)
--
-- ## 수정
--
--   프로필 이미지 기능은 v2 에서 제거됐고 표시는 전부 이니셜 아바타로 통일됐다
--   (avatar_url 은 화면에서 더 이상 쓰이지 않는다). 그래서 트리거가 avatar_url 을
--   **아예 저장하지 않도록**(null) 바꾼다:
--     - 카카오 http URL 로 인한 제약 위반이 원천 제거된다.
--     - 쓰지도 않는 외부 이미지 URL(경미한 PII)을 공개 profiles 테이블에 남기지 않는다.
--     - CHECK 제약은 방어선으로 그대로 둔다(이후 누가 http URL 을 넣으려 하면 여전히 막는다).
--
--   display_name 계산 로직은 그대로다 — 닉네임/이름 coalesce 는 건드리지 않는다.
--
-- ## 하위 호환
--
--   create or replace 라 멱등하다. 기존 profiles 행(이미 저장된 https avatar_url 포함)은
--   건드리지 않는다 — 신규 가입 경로만 바뀐다. 되돌리려면 community.sql:124 의 원본 함수를
--   다시 create or replace 하면 된다.
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
      '스노우볼러' || substr(replace(new.id::text, '-', ''), 1, 6)
    )), 40),
    -- avatar_url 은 저장하지 않는다(이니셜 아바타로 통일 + 카카오 http URL 제약 위반 회피).
    null
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 트리거 재바인딩은 불필요하다(같은 함수를 교체했을 뿐). on_auth_user_created 는 그대로 이 함수를 가리킨다.
