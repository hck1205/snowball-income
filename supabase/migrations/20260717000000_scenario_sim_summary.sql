-- =============================================================================
-- snowball-income — 커뮤니티 Stage 3: sim_summary (게시 시점 시뮬 요약, 카드 프리뷰용)
-- =============================================================================
--
-- 의도
-- ---------------------------------------------------------------------------
-- 갤러리 카드/리스트가 시뮬 숫자 프리뷰(월 배당·최종 자산 등, 스펙 §E~§H)를 그리려면
-- 요약 숫자가 필요하지만, 목록 쿼리는 무거운 payload를 싣지 않는다(대역폭).
-- 그래서 **게시/수정 시점에 클라이언트가 1회 계산**한 요약(10필드 jsonb)을 저장하고,
-- 목록 쿼리에 포함한다. 게시 후 재계산하지 않는다 — 엔진이 바뀌어도 저장값 보존
-- (카드·상세·OG·첨부 미리보기의 표기 일치가 목적).
--
-- 신뢰 모델
-- ---------------------------------------------------------------------------
-- 클라이언트가 쓰는 값이므로 서버는 내용을 신뢰하지 않는다. 서버 CHECK는
-- "jsonb object + 크기 상한"만 지킨다(컬럼을 임의 저장소로 악용하는 것 방지).
-- 필드 단위 검증은 읽기 측이 zod로 한다(shared/lib/snowball/SnowballScenarioSummary.ts
-- parseScenarioSimSummary) — 오염 값은 파서가 null 처리하고 UI는 텍스트 카드로 폴백하므로
-- 서버에 payload 검증 함수 같은 스키마 중복을 두지 않는다.
--
-- 하위 호환
-- ---------------------------------------------------------------------------
-- 기존 행은 sim_summary NULL → UI는 현행 텍스트 카드 그대로(스펙 §E/§J 폴백).
-- 백필은 하지 않는다(선택 시 별도 작업 — 핸드오프 권고 참조).
--
-- RLS 영향
-- ---------------------------------------------------------------------------
-- 없음. scenarios의 정책(select_public_or_own / insert_own / update_own / delete_own,
-- 20260714000000_community.sql)은 전부 **행 단위** 조건이라 컬럼 추가에 영향받지 않는다.
-- 읽기는 테이블 단위 `grant select on public.scenarios`(같은 파일 :707)가 새 컬럼을
-- 자동으로 포함한다. 쓰기는 **컬럼 단위 GRANT**라 아래 4절이 반드시 필요하다.
--
-- 멱등성 (재실행 안전)
-- ---------------------------------------------------------------------------
-- 컬럼은 IF NOT EXISTS, 제약은 pg_constraint conname 가드 DO 블록. GRANT는 원래 멱등.
--
-- ⚠ 이전 마이그레이션(20260714/20260715)은 절대 수정하지 않는다. 이 파일은 그 위에 덧붙인다.
-- ⚠ shared/lib/supabase/types.ts 와 동기화되어야 한다 (ScenarioRow.sim_summary).
-- =============================================================================

-- =============================================================================
-- 1. sim_summary 컬럼 — 게시 시점 시뮬 요약 (nullable)
-- =============================================================================
-- nullable: 기존 행/자유 글/계산 불가 payload(buildScenarioSimSummary가 null을 준 경우)는
-- NULL이고, UI는 텍스트 카드로 폴백한다. has_payload와 독립이다 —
-- "payload는 있는데 요약 계산이 불가"한 글이 존재할 수 있다(§E: has_payload로 프리뷰를 그리지 말 것).
alter table public.scenarios
  add column if not exists sim_summary jsonb;

-- =============================================================================
-- 2. 형태·크기 가드 — jsonb object + 2KB 상한
-- =============================================================================
-- 요약은 10필드 숫자 객체(실측 ~300B)다. 2KB는 버전 진화(필드 추가) 여유를 포함한 상한으로,
-- body(64KB)와 같은 무료 티어/대역폭 보호 철학이다. named 제약 + conname 가드(멱등).
do $$
begin
  if not exists (
    select 1
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace nsp on nsp.oid = rel.relnamespace
     where nsp.nspname = 'public'
       and rel.relname = 'scenarios'
       and con.conname = 'scenarios_sim_summary_shape'
  ) then
    alter table public.scenarios
      add constraint scenarios_sim_summary_shape
      check (
        sim_summary is null
        or (jsonb_typeof(sim_summary) = 'object' and pg_column_size(sim_summary) <= 2048)
      );
  end if;
end;
$$;

-- =============================================================================
-- 3. (없음) 인덱스 — 요약은 표시 전용이라 검색/정렬에 쓰지 않는다
-- =============================================================================

-- =============================================================================
-- 4. GRANT — sim_summary 컬럼 쓰기 권한 (additive)
-- =============================================================================
-- ⚠ 이걸 빠뜨리면 클라이언트가 요약을 저장할 수 없다 (컬럼 GRANT가 1차 관문 — body와 동일).
-- 기존 GRANT(title/description/payload/body/is_public)는 그대로 두고 sim_summary만 더한다.
grant insert (sim_summary) on public.scenarios to authenticated;
grant update (sim_summary) on public.scenarios to authenticated;

-- =============================================================================
-- 끝. 요약
-- =============================================================================
--   - sim_summary(jsonb, nullable, ≤2KB object) 추가 + insert/update GRANT
--   - RLS 정책 무변경 (행 단위 정책이라 컬럼 추가 무영향, select는 테이블 GRANT가 커버)
--   - 기존 행은 NULL → 텍스트 카드 폴백 (백필 없음, 하위 호환)
-- =============================================================================
