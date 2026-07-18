-- =============================================================================
-- snowball-income — 커뮤니티 갤러리 "정밀 검색" G1: sim_summary 파생 숫자 facet 컬럼
-- =============================================================================
--
-- 의도
-- ---------------------------------------------------------------------------
-- 갤러리에서 월배당·목표·투자기간으로 숫자 필터링을 하려면 sim_summary(jsonb)의 값으로
-- 범위 비교(gte/lte)를 걸어야 한다. 그런데 PostgREST의 `->>`(text 추출)는 **사전식 비교**라
-- 숫자 필터에 못 쓴다("3000000" < "500000"이 true). 그래서 sim_summary에서 세 숫자를
-- **generated STORED 컬럼**으로 뽑아 진짜 numeric 비교 + B-tree 인덱스를 가능하게 한다.
--
-- 이 파일은 20260717000000_scenario_sim_summary.sql(sim_summary jsonb 컬럼 추가) **다음에**
-- 실행되어야 한다 — 파생 컬럼이 sim_summary를 참조하므로. 타임스탬프 순서가 이를 보장한다
-- (…000000 < …000001). 두 파일 모두 미실행이라 배포 시 순서대로 함께 적용된다.
--
-- 백필
-- ---------------------------------------------------------------------------
-- 별도 백필 스크립트가 **필요 없다**. STORED generated 컬럼은 ALTER 시 Postgres가 기존 행을
-- 자동 계산한다(테이블 재작성). 현 데이터는 테스트 데이터라 재작성 락은 순간이다.
-- sim_summary가 NULL이거나 해당 키가 없는 행은 표현식이 graceful하게 NULL을 낸다(아래 참조).
--
-- 신뢰 모델 (표현식이 절대 던지지 않아야 하는 이유)
-- ---------------------------------------------------------------------------
-- sim_summary 값은 클라이언트가 쓰고 서버는 내용을 신뢰하지 않는다(20260717000000 주석 참조).
-- 다른 클라이언트가 `{"finalMonthlyDividend":"abc"}` 같은 비숫자 값을 넣을 수 있는데,
-- 단순 `(sim_summary->>'finalMonthlyDividend')::numeric`은 그 행의 INSERT/UPDATE를
-- **캐스트 에러로 통째로 막는다**(pitfalls: 쓰기 즉사). 그래서 `jsonb_typeof(... -> 'key') = 'number'`
-- 로 먼저 JSON 숫자인지 확인하고, 아니면 NULL을 낸다:
--   - sim_summary NULL / 키 없음 / 비숫자 값  → 컬럼 NULL (읽기 측 parseScenarioSimSummary와 같은 graceful 폴백)
--   - JSON 숫자 값                              → numeric으로 안전 추출
-- 세 컬럼 모두 numeric이다(정수인 durationYears 포함) — jsonb_typeof 가드를 통과한 JSON 숫자는
-- `->>` 텍스트가 항상 numeric으로 캐스트되므로 표현식이 절대 던지지 않는다(::integer는 소수 표현이
-- 섞이면 던질 수 있어 회피). 필터는 년/원 정수 리터럴과 비교하며 numeric↔integer 비교는 안전하다.
--
-- jsonb 키 매핑 (shared/lib/snowball/SnowballScenarioSummary.ts scenarioSimSummarySchema)
-- ---------------------------------------------------------------------------
--   final_monthly_dividend   ← sim_summary->>'finalMonthlyDividend'   (마지막 해 세후 월평균 배당, KRW)
--   target_monthly_dividend  ← sim_summary->>'targetMonthlyDividend'  (목표 월배당, KRW)
--   duration_years           ← sim_summary->>'durationYears'          (시뮬 기간, 년)
-- ⚠ 키는 camelCase다. 스키마가 바뀌면 이 매핑도 같이 바꿔야 한다(파서 필드명과 1:1).
--
-- GRANT / RLS
-- ---------------------------------------------------------------------------
-- SELECT: 추가 GRANT 불필요. 20260714000000_community.sql:707의 `grant select on public.scenarios
--   to anon, authenticated`는 **테이블 레벨**이라 이후 추가되는 컬럼을 자동 포함한다(파생 컬럼도).
-- INSERT/UPDATE: 불필요. GENERATED ALWAYS ... STORED 컬럼은 Postgres가 쓰기를 거부한다
--   (클라이언트가 값을 넣을 수 없음). 그래서 컬럼 레벨 insert/update GRANT를 주지 않는다.
-- RLS: 무영향. scenarios 정책은 전부 행 단위(is_public or owner)라 컬럼 추가에 반응하지 않는다.
--
-- 멱등성 (재실행 안전)
-- ---------------------------------------------------------------------------
-- 컬럼은 add column IF NOT EXISTS, 인덱스는 create index IF NOT EXISTS. 재실행해도 무해하다.
--
-- ⚠ shared/lib/supabase/types.ts(ScenarioRow)와 동기화 — 세 컬럼은 읽기 전용(number|null).
-- ⚠ 이전 마이그레이션은 수정하지 않는다. 이 파일은 그 위에 덧붙인다.
-- =============================================================================

-- =============================================================================
-- 1. 파생 숫자 facet 컬럼 (generated always as … stored, nullable)
-- =============================================================================
-- jsonb_typeof 가드로 "JSON 숫자일 때만 추출"한다 — 비숫자/누락/NULL은 컬럼 NULL(던지지 않음).
alter table public.scenarios
  add column if not exists final_monthly_dividend numeric
    generated always as (
      case
        when jsonb_typeof(sim_summary -> 'finalMonthlyDividend') = 'number'
          then (sim_summary ->> 'finalMonthlyDividend')::numeric
        else null
      end
    ) stored;

alter table public.scenarios
  add column if not exists target_monthly_dividend numeric
    generated always as (
      case
        when jsonb_typeof(sim_summary -> 'targetMonthlyDividend') = 'number'
          then (sim_summary ->> 'targetMonthlyDividend')::numeric
        else null
      end
    ) stored;

alter table public.scenarios
  add column if not exists duration_years numeric
    generated always as (
      case
        when jsonb_typeof(sim_summary -> 'durationYears') = 'number'
          then (sim_summary ->> 'durationYears')::numeric
        else null
      end
    ) stored;

-- =============================================================================
-- 2. B-tree 인덱스 — 숫자 범위 필터 성능
-- =============================================================================
-- 갤러리 필터는 공개(is_public) 행에만, facet이 있는(NOT NULL) 행에만 의미가 있다.
-- 필터는 전부 gte/lte(강비교)라 `col is not null`을 함의하므로 부분 인덱스 술어가 매칭된다.
-- 기존 keyset 인덱스(scenarios_public_recent_idx / _popular_idx)와 공존한다 — 플래너가
-- 선택도에 따라 facet 인덱스로 필터 후 정렬하거나 정렬 인덱스를 탄다.
create index if not exists scenarios_public_final_md_idx
  on public.scenarios (final_monthly_dividend)
  where is_public and final_monthly_dividend is not null;

create index if not exists scenarios_public_target_md_idx
  on public.scenarios (target_monthly_dividend)
  where is_public and target_monthly_dividend is not null;

create index if not exists scenarios_public_duration_idx
  on public.scenarios (duration_years)
  where is_public and duration_years is not null;

-- =============================================================================
-- 끝. 요약
-- =============================================================================
--   - final_monthly_dividend / target_monthly_dividend / duration_years
--     : sim_summary jsonb 파생 generated STORED numeric 컬럼(NULL-graceful, camelCase 키 매핑)
--   - 각 컬럼에 부분 B-tree 인덱스(where is_public and col is not null)
--   - GRANT 불필요(테이블 레벨 select가 자동 포함 + generated 컬럼은 쓰기 불가)
--   - RLS 무변경, 기존 sim_summary NULL 행은 세 컬럼 NULL(하위 호환, 필터 없으면 그대로 노출)
-- =============================================================================
