-- =============================================================================
-- snowball-income — 프로필 기능 3종: 아바타 Storage (버킷 + objects 정책)
-- =============================================================================
--
-- 의도
-- ---------------------------------------------------------------------------
-- 프로필 이미지 업로드/제거를 위해 public Storage 버킷 `avatars`와, 본인 폴더
-- (`{auth.uid()}/…`)만 쓰고 지울 수 있게 하는 objects 정책 3개(INSERT/UPDATE/DELETE)를 만든다.
--
--   - 닉네임 변경: **DB 변경 없음.** display_name 컬럼 CHECK(1~40)·GRANT·RLS가 이미 있고
--     (20260714000000_community.sql:108,714,791-795), 클라이언트가 2~20자로 더 엄격히 막는다.
--   - 회원 탈퇴: **DB 변경 없음.** auth.users → profiles → scenarios → comments/likes 로 이어지는
--     CASCADE 체인이 기존 스키마에서 이미 완결돼 있다. 서버(/api/account-delete)가 admin.deleteUser로
--     그 체인을 실행한다.
--   - 아바타: avatar_url 컬럼·CHECK(^https://)·GRANT도 이미 있다. 필요한 건 DB가 아니라
--     **Storage 버킷/정책**뿐이라 이 파일은 그것만 다룬다.
--
-- ⚠ 권한 제약 (반드시 읽을 것) — 이 파일은 "되면 좋고, 안 되면 수동" 이다
-- ---------------------------------------------------------------------------
-- storage.buckets / storage.objects 는 `supabase_storage_admin` 소유다. 프로젝트에 따라
-- postgres/서비스 롤이 여기에 대해 INSERT·CREATE POLICY 권한이 없어 **권한 오류로 실패**할 수 있다.
-- 그래서 모든 문장을 DO 블록으로 감싸고 insufficient_privilege 를 잡아 NOTICE 로만 남긴다 —
-- 이 마이그레이션이 다른 마이그레이션 실행(supabase db push)을 통째로 깨뜨리지 않게 하기 위함이다.
--
-- 실패(NOTICE) 시에는 **대시보드 수동 설정이 정본**이다:
--   1) Storage → New bucket: name `avatars`, Public ON,
--      File size limit 512 KB, Allowed MIME `image/webp, image/jpeg, image/png`.
--   2) Storage → avatars → Policies: authenticated 대상 INSERT / UPDATE / DELETE 각 1개,
--      조건(공통):
--        bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
--      (SELECT 정책은 public 버킷이라 불필요)
--
-- ⚠ 기존 마이그레이션(20260714…, 20260715…)은 절대 수정하지 않는다. 이 파일은 그 위에 덧붙인다.
-- ⚠ 멱등: 버킷은 on conflict, 정책은 pg_policies 조회 가드로 재실행 안전.
-- =============================================================================

-- =============================================================================
-- 1. avatars 버킷 (public read, 512KB, 이미지 3종)
-- =============================================================================
-- public=true: 읽기는 public URL 로 한다(SELECT 정책 불필요). 512KB 상한은 클라이언트가
-- 256px webp(수십 KB)로 리사이즈해 올리므로 넉넉한 안전망이다. upsert 덮어쓰기라 용량이 누적되지 않는다.
do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('avatars', 'avatars', true, 524288, array['image/webp', 'image/jpeg', 'image/png'])
  on conflict (id) do update
    set public            = excluded.public,
        file_size_limit   = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;
exception
  when insufficient_privilege then
    raise notice 'avatars 버킷을 SQL로 만들 권한이 없습니다 → 대시보드에서 수동 생성하세요 (파일 상단 주석 1) 참고).';
end;
$$;

-- =============================================================================
-- 2. storage.objects 정책 3개 — 본인 폴더({auth.uid()}/…)만 쓰기/수정/삭제
-- =============================================================================
-- upsert 업로드는 INSERT 또는 UPDATE 로 동작하므로 둘 다 필요하고, 이미지 제거를 위해 DELETE 도 준다.
-- 읽기(SELECT)는 public 버킷이라 정책이 필요 없다.
do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars_insert_own'
  ) then
    create policy avatars_insert_own on storage.objects
      for insert to authenticated
      with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;

  if not exists (
    select 1 from pg_policies
     where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars_update_own'
  ) then
    create policy avatars_update_own on storage.objects
      for update to authenticated
      using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
      with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;

  if not exists (
    select 1 from pg_policies
     where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars_delete_own'
  ) then
    create policy avatars_delete_own on storage.objects
      for delete to authenticated
      using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
exception
  when insufficient_privilege then
    raise notice 'storage.objects 정책을 SQL로 만들 권한이 없습니다 → 대시보드에서 수동 생성하세요 (파일 상단 주석 2) 참고).';
end;
$$;

-- =============================================================================
-- 끝. 요약
-- =============================================================================
--   - avatars 버킷(public, 512KB, webp/jpeg/png) — 권한 없으면 NOTICE 후 수동
--   - storage.objects 본인 폴더 INSERT/UPDATE/DELETE 정책 — 권한 없으면 NOTICE 후 수동
--   - 닉네임/탈퇴/avatar_url 은 DB 변경 0 (기존 스키마로 충분)
-- =============================================================================
