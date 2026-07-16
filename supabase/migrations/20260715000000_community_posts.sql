-- =============================================================================
-- snowball-income — 커뮤니티 Stage 2: 하이브리드 글 (자유 글 + 선택적 시나리오 첨부)
-- =============================================================================
--
-- 의도
-- ---------------------------------------------------------------------------
-- Stage 1의 scenarios 테이블을 "글" 모델로 확장한다. **새 posts 테이블을 만들지 않고**
-- 기존 scenarios를 재사용한다:
--   - body(리치 HTML 본문)를 추가해 자유 글을 담는다 (Tiptap 출력).
--   - payload(시나리오 첨부)를 **선택적**으로 만든다 — 본문만 있는 자유 글도 게시 가능.
--   - 공개 글 검색(제목/설명)을 위한 pg_trgm GIN 인덱스를 추가한다.
--
-- 하위 호환 (중요)
-- ---------------------------------------------------------------------------
--   - 기존 행은 payload NOT NULL 하에 저장돼 있다. 이 마이그레이션 후에도 그대로 유효하다:
--     payload를 nullable로 완화하되 기존 값은 손대지 않는다.
--   - 기존 payload CHECK(is_valid_scenario_payload)는 "payload IS NULL 허용"으로 완화한다.
--     기존의 유효한 payload는 계속 통과한다.
--   - body는 nullable이라 기존 행(body 없음)에 아무 영향이 없다.
--
-- 멱등성 (재실행 안전)
-- ---------------------------------------------------------------------------
-- 컬럼/인덱스/확장은 IF NOT EXISTS로, 제약은 pg_constraint를 조회하는 DO 블록(conname 가드)
-- 으로 처리한다. 원본 payload CHECK는 **인라인이라 자동 생성 이름**을 가지므로, 이름이 아니라
-- "정의가 is_valid_scenario_payload를 참조하지만 IS NULL 분기가 없는" 제약을 찾아 drop한다.
--
-- ⚠ 20260714000000_community.sql은 절대 수정하지 않는다. 이 파일은 그 위에 덧붙인다.
-- ⚠ shared/lib/supabase/types.ts 와 동기화되어야 한다 (ScenarioRow.body, payload nullable 등).
-- =============================================================================

-- =============================================================================
-- 1. body 컬럼 — 자유 글 본문 (Tiptap 리치 HTML)
-- =============================================================================
-- nullable: 기존 행에는 본문이 없다. 시나리오만 첨부한 글도 body가 없을 수 있다.
alter table public.scenarios
  add column if not exists body text;

-- 크기 상한 64KB (octet_length ≤ 65536). payload와 동일한 무료 티어/대역폭 보호.
-- body는 HTML이라 문자 수가 아니라 **바이트 수**로 잰다 (한글/이모지 방어).
-- 인라인이 아니라 named 제약으로 추가해 멱등 가드(conname)를 건다.
do $$
begin
  if not exists (
    select 1
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace nsp on nsp.oid = rel.relnamespace
     where nsp.nspname = 'public'
       and rel.relname = 'scenarios'
       and con.conname = 'scenarios_body_len'
  ) then
    alter table public.scenarios
      add constraint scenarios_body_len
      check (body is null or octet_length(body) <= 65536);
  end if;
end;
$$;

-- =============================================================================
-- 2. payload를 nullable로 — 자유 글은 시나리오 첨부가 없다
-- =============================================================================
-- drop not null은 멱등하다 (이미 nullable이면 no-op). 기존 값은 건드리지 않는다.
alter table public.scenarios
  alter column payload drop not null;

-- =============================================================================
-- 3. payload CHECK 완화 — "payload IS NULL 이거나 유효한 payload"
-- =============================================================================
-- (a) 원본 인라인 CHECK 제거. 인라인이라 자동 생성 이름(예: scenarios_payload_check)이므로
--     이름이 아니라 "is_valid_scenario_payload를 참조하지만 IS NULL 분기가 없는" 제약을
--     찾아서 drop한다. 재실행 시 이미 없으면 루프가 아무것도 하지 않는다(멱등).
--     완화된 새 제약(scenarios_payload_valid_or_null)은 IS NULL을 포함하므로 매칭되지 않아
--     재실행에도 살아남는다.
do $$
declare
  r record;
begin
  for r in
    select con.conname
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace nsp on nsp.oid = rel.relnamespace
     where nsp.nspname = 'public'
       and rel.relname = 'scenarios'
       and con.contype = 'c'
       and pg_get_constraintdef(con.oid) ilike '%is_valid_scenario_payload%'
       and pg_get_constraintdef(con.oid) not ilike '%is null%'
  loop
    execute format('alter table public.scenarios drop constraint %I', r.conname);
  end loop;
end;
$$;

-- (b) 완화된 named 제약 추가. payload가 NULL이면 통과, 있으면 기존 검증을 그대로 적용.
do $$
begin
  if not exists (
    select 1
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace nsp on nsp.oid = rel.relnamespace
     where nsp.nspname = 'public'
       and rel.relname = 'scenarios'
       and con.conname = 'scenarios_payload_valid_or_null'
  ) then
    alter table public.scenarios
      add constraint scenarios_payload_valid_or_null
      check (payload is null or public.is_valid_scenario_payload(payload));
  end if;
end;
$$;

-- =============================================================================
-- 3b. has_payload 생성 컬럼 — 목록에서 "시나리오 첨부 여부"를 가볍게 판별
-- =============================================================================
-- 목록(ScenarioListItem)은 무거운 payload/body를 싣지 않는다. 하지만 카드에서
-- "자유 글 vs 시뮬 첨부 글" 배지를 그리려면 첨부 여부(boolean)만 알면 된다.
-- generated ... stored 컬럼이라:
--   - 클라이언트가 write할 수 없다 (카운터처럼 자동 파생 → 조작 위험 0). ⚠ GRANT를 주지 않는다.
--   - 기존 행(payload not null)은 true로, 자유 글(payload null)은 false로 자동 백필된다 (하위호환).
alter table public.scenarios
  add column if not exists has_payload boolean
  generated always as (payload is not null) stored;

-- =============================================================================
-- 4. GRANT — body 컬럼 쓰기 권한 (additive)
-- =============================================================================
-- ⚠ 이걸 빠뜨리면 클라이언트가 본문을 저장할 수 없다 (컬럼 GRANT가 1차 관문).
-- 기존 GRANT(title/description/payload/is_public)는 그대로 두고 body만 더한다.
-- payload는 이미 insert/update GRANT가 있으므로 nullable로 바뀌어도 재GRANT가 필요 없다.
grant insert (body) on public.scenarios to authenticated;
grant update (body) on public.scenarios to authenticated;

-- =============================================================================
-- 5. 검색 인덱스 — pg_trgm (제목/설명)
-- =============================================================================
-- 한국어는 tsvector 형태소 분석기(기본 미탑재)가 없어 to_tsvector가 무력하다.
-- pg_trgm ILIKE(트라이그램)가 부분일치 검색에 실용적이다.
--
-- 본문(body)은 HTML 태그가 섞여 트라이그램 노이즈가 크므로 **인덱스에서 제외**한다.
-- 검색 대상은 plain text인 title/description. 공개 글만 검색하므로 partial index(where is_public).
-- body까지 검색하고 싶으면 애플리케이션에서 비인덱스 ILIKE로 옵션 처리한다.
create extension if not exists pg_trgm;

create index if not exists scenarios_search_title_trgm
  on public.scenarios using gin (title gin_trgm_ops)
  where is_public;

create index if not exists scenarios_search_description_trgm
  on public.scenarios using gin (description gin_trgm_ops)
  where is_public;

-- =============================================================================
-- 끝. 요약
-- =============================================================================
--   - body(자유 글 본문, ≤64KB, nullable) 추가 + insert/update GRANT
--   - payload nullable + CHECK 완화(NULL 허용) → 시나리오 없는 자유 글 게시 가능
--   - has_payload(생성 STORED 컬럼) → 목록에서 첨부 여부 배지 (write 불가, GRANT 없음)
--   - title/description trgm GIN 인덱스(공개 글) → 부분일치 검색
--   - 기존 행/제약/GRANT는 그대로 유효 (멱등, 하위호환)
-- =============================================================================
