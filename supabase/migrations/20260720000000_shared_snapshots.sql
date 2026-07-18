-- =============================================================================
-- snowball-income — 공유 스냅샷 (Share DB key, 트랙 E)
-- =============================================================================
--
-- 의도
-- ---------------------------------------------------------------------------
-- "Share" 버튼이 **현재 active 시나리오 탭**의 payload를 서버에 저장하고, 서버가 만든
-- 추측 불가한 key를 URL 쿼리(`?s=<key>`)로 넘긴다. 링크를 연 사람은 그 key로 payload를
-- 조회해 탭을 복원한다. 기존 lz-string `?share=` 링크(클라이언트가 전체 데이터를 URL에
-- 압축해 실어 보냄)와 **병존**한다 — 파라미터 이름(`s` vs `share`)으로 포맷을 구분한다.
--
-- 왜 DB key인가: lz-string URL은 페이로드가 커지면 URL 길이가 터진다(브라우저·카톡 등
-- 링크 프리뷰 한계). key 방식은 URL을 짧게 고정하고 payload 크기 제약을 서버로 옮긴다.
--
-- 신뢰 모델
-- ---------------------------------------------------------------------------
-- payload는 클라이언트가 쓰는 값이라 서버는 내용을 신뢰하지 않는다. 서버 CHECK는
-- "jsonb object + 크기 상한(64KB)"만 지킨다(임의 저장소 악용 방지). 필드 검증은 읽기 측
-- 정규화(normalizePersistedAppState)가 한다 — user_app_states.payload와 같은 규율.
--
-- payload 계약(클라이언트 ↔ OG 카드가 공유):
--   { "v": 1, "scenario": PersistedScenarioState }
--   - v          : 스키마 버전(현재 1). 필드가 늘면 optional+default로 올린다.
--   - scenario   : 공유된 활성 시나리오 한 개(id/name/portfolio/investmentSettings).
--   OG 이미지(api/og)가 이 payload로 카드를 그린다 — 형태를 바꾸면 OG도 함께 고쳐야 한다.
--
-- 접근 모델 (열거·나열 방지)
-- ---------------------------------------------------------------------------
-- 테이블 직접 접근은 잠근다(anon/authenticated GRANT·정책 없음). 오직 아래 SECURITY DEFINER
-- RPC 2개로만 노출한다:
--   - create_shared_snapshot(p_payload) : key를 **서버에서** 생성·INSERT하고 key 반환.
--                                          클라이언트가 key를 못 정한다(추측·덮어쓰기 불가).
--   - get_shared_snapshot(p_key)        : key로 payload 반환(부재·만료 시 null).
--
-- anon 실행을 허용하는 이유: 구 lz-string `?share=`가 로그인 없이 익명 공유를 지원했다.
-- 동등한 UX를 유지하려면 비로그인 사용자도 공유를 만들고 열 수 있어야 한다(anon 키는 공개).
-- 남용 방어(레이트리밋·용량 상한·주기적 만료 정리)는 후속 과제로 남긴다 — 지금은 크기 상한
-- (64KB)과 추측 불가 key만으로 방어한다. 만료(expires_at)는 기본 null(무만료)이며, 조회
-- RPC가 만료분을 자동 제외하므로 나중에 만료 정책을 켜도 하위 호환이 깨지지 않는다.
--
-- 하위 호환 (절대 규칙)
-- ---------------------------------------------------------------------------
-- 이 테이블은 **추가 계층**이다. 구 lz-string `?share=` 링크·로컬 저장·JSON 가져오기는
-- 전부 그대로다. 미배포(테이블 부재)·미설정(anon 키 없음) 상태에서도 앱은 죽지 않는다 —
-- 클라이언트는 create RPC 실패/미설정 시 구 lz-string `?share=` 링크로 폴백한다.
--
-- 멱등성(재실행 안전): 테이블/인덱스 IF NOT EXISTS, 함수 create or replace.
--
-- ⚠ 이전 마이그레이션(20260714/15/17/18/19)은 절대 수정하지 않는다. 이 파일은 그 위에 덧붙인다.
-- ⚠ shared/lib/supabase/types.ts 의 SharedSnapshotRow / Database.Tables.shared_snapshots +
--   Functions.create_shared_snapshot / get_shared_snapshot 와 동기.
-- =============================================================================

-- =============================================================================
-- 1. 테이블
-- =============================================================================
create table if not exists public.shared_snapshots (
  -- 서버가 생성하는 랜덤·추측불가·URL-safe key(base64url ~22자, 122bit 엔트로피).
  -- 클라이언트가 못 정한다(컬럼 GRANT 없음 + RPC만 write). 시퀀셜 금지 → 열거 불가.
  key         text        primary key,
  -- 공유 payload. 활성 시나리오 1개라 128KB보다 작게 64KB로 잡는다(pg_column_size = user_app_states 패턴).
  payload     jsonb       not null check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) <= 65536),
  created_at  timestamptz not null default now(),
  -- 선택적 만료. 기본 null = 무만료. 조회 RPC가 만료분을 제외한다(나중에 만료 정책을 켜도 하위 호환).
  expires_at  timestamptz
);

-- 만료 정리(후속 prune)용 부분 인덱스 — 만료를 설정한 행만 인덱싱한다.
create index if not exists shared_snapshots_expires_at_idx
  on public.shared_snapshots (expires_at) where expires_at is not null;

-- =============================================================================
-- 2. RLS — 테이블 직접 접근 전면 차단(정책 없음). SECURITY DEFINER RPC로만 노출.
-- =============================================================================
-- 정책을 하나도 만들지 않으면 RLS가 anon/authenticated의 직접 SELECT/INSERT를 전부 막는다.
-- RPC는 SECURITY DEFINER라 함수 소유자(테이블 소유자) 권한으로 돌아 RLS를 우회한다.
alter table public.shared_snapshots enable row level security;

-- =============================================================================
-- 3. RPC — 생성/조회 (SECURITY DEFINER, set search_path = '')
-- =============================================================================

-- 공유 스냅샷 생성. key를 서버에서 만들어 INSERT하고 그 key를 반환한다.
-- 테이블 CHECK와 동일한 타입/크기 방어를 함수 안에서도 선제적으로 해 명확한 에러를 준다.
-- 극히 낮은 확률의 key 충돌은 unique_violation을 잡아 최대 5회 재생성으로 흡수한다.
create or replace function public.create_shared_snapshot(p_payload jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key      text;
  v_attempts integer := 0;
begin
  if jsonb_typeof(p_payload) is distinct from 'object' then
    raise exception '유효한 공유 데이터가 아닙니다' using errcode = 'check_violation';
  end if;
  if pg_column_size(p_payload) > 65536 then
    raise exception '공유 데이터가 너무 큽니다' using errcode = 'check_violation';
  end if;

  loop
    v_attempts := v_attempts + 1;
    -- gen_random_uuid()(코어 함수, pgcrypto 불필요)의 16바이트를 base64url로 인코딩 → 22자.
    -- 122bit 엔트로피라 추측·열거 불가. 24자 미만이라 base64 MIME 줄바꿈이 없다(그래도 방어적으로 제거).
    v_key := rtrim(
      translate(
        replace(encode(decode(replace(gen_random_uuid()::text, '-', ''), 'hex'), 'base64'), E'\n', ''),
        '+/', '-_'
      ),
      '='
    );

    begin
      insert into public.shared_snapshots (key, payload) values (v_key, p_payload);
      return v_key;
    exception when unique_violation then
      if v_attempts >= 5 then
        raise;
      end if;
    end;
  end loop;
end;
$$;

-- 공유 스냅샷 조회. key로 payload 반환. 부재·만료 시 null(예외 아님 → 클라이언트가 폴백 처리).
create or replace function public.get_shared_snapshot(p_key text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payload jsonb;
begin
  select payload
    into v_payload
    from public.shared_snapshots
   where key = p_key
     and (expires_at is null or expires_at > now());
  return v_payload; -- not found / 만료 → NULL
end;
$$;

-- =============================================================================
-- 4. GRANT — RPC 실행만 공개(테이블 직접 GRANT 없음). anon+authenticated 둘 다 실행.
-- =============================================================================
revoke all on function public.create_shared_snapshot(jsonb) from public;
revoke all on function public.get_shared_snapshot(text)     from public;
grant execute on function public.create_shared_snapshot(jsonb) to anon, authenticated;
grant execute on function public.get_shared_snapshot(text)     to anon, authenticated;

-- =============================================================================
-- 끝. 요약
-- =============================================================================
--   - shared_snapshots(key text pk, payload jsonb ≤64KB, expires_at nullable)
--   - RLS enable + 정책 0개 → 직접 접근 차단, SECURITY DEFINER RPC 2개로만 노출
--   - create_shared_snapshot(jsonb)->text(서버 생성 key) / get_shared_snapshot(text)->jsonb(null 허용)
--   - anon+authenticated 실행 GRANT(구 lz-string 익명 공유와 동등 UX)
--   - 구 `?share=` lz-string 링크·로컬 저장·JSON은 무변경(추가 계층, 하위 호환)
--   - payload 계약: { v:1, scenario: PersistedScenarioState } (OG 카드가 동일 payload 소비)
-- =============================================================================
