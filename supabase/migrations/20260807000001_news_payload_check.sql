` 로 **rename** 했다. 개명을 실행한 DB 와 아닌 DB 가 갈릴 수 있으므로
--   이 파일은 **이름을 가정하지 않고 실재하는 쪽을 찾아 쓴다**(아래 2단계).
--   ⚠ 2026-08-07 첫 실행이 정확히 이 이유로 42883(function does not exist)으로 실패했다.
--
-- 그 함수는 payload 가 **시나리오**임을 요구한다(portfolio · investmentSettings 키 필수).
-- 뉴스의 payload 는 링크 메타 다섯 필드라 이 검사를 통과하지 못하고, 게시가 23514
-- (check_violation)로 거절된다. 즉 앞 마이그레이션만으로는 **뉴스를 올릴 수 없다.**
--
-- 🔴 이 파일을 실행하기 전까지 뉴스 목록·화면은 정상 동작하지만 **게시만 실패한다**
--   (무음이 아니라 게시 실패 배너). 읽기 경로는 전혀 건드리지 않는다.
--
-- 왜 컬럼을 더하지 않나
-- ---------------------------------------------------------------------------
-- url·title·summary·image·source 를 컬럼 다섯 개로 만들면 posts 는 두 도메인을 한 테이블에
-- 가진 넓은 표가 되고, 그 컬럼들은 글의 99% 에서 NULL 이다. jsonb 한 칸이면 스키마가 그대로다.
-- 대신 **모양 검사를 DB 가 진다** — 그것이 이 파일이다.
--
-- ⚠ 원문 본문은 담지 않는다(저작권). 4KB 상한이 그 약속을 데이터 레이어에서 강제한다 —
--   기사 하나를 통째로 복사하면 이 상한에 걸려 게시가 거절된다.
--
-- 멱등성 / 실행 순서
-- ---------------------------------------------------------------------------
-- 함수는 create or replace, 제약은 이름을 알고 있으므로 drop → add. 두 번 돌려도 결과가 같다.
-- 20260807000000 을 실행하지 않았어도 이 파일 단독으로 안전하다(제약만 바꾼다).
-- 🔴 배포 순서: 이 마이그레이션이 **먼저**, 뉴스 게시 클라이언트가 나중.
--
-- ⚠ 원장(append-only): 이전 마이그레이션은 절대 수정하지 않는다.
-- ⚠ shared/lib/supabase/newsPayload.ts (parseNewsPayload) 와 **같은 규칙**이어야 한다 —
--   한쪽만 느슨해지면 화면이 못 그리는 행이 DB 에 남는다.
-- =============================================================================

-- =============================================================================
-- 1. 뉴스 payload 모양 검사
-- =============================================================================
-- 필수는 url 하나다. 나머지는 있으면 타입·길이만 본다 — 남의 사이트에서 뽑아 온 값이라
-- "없을 수 있다"가 정상이고, 없을 때 무엇으로 대체할지는 화면이 안다(호스트명으로 떨어진다).
create or replace function public.is_valid_news_payload(p jsonb)
returns boolean
language sql
immutable
as $$
  select coalesce(
    jsonb_typeof(p) = 'object'
    -- 🔴 4KB 상한. 원문 복제를 데이터 레이어에서 막는 선이다(시나리오의 64KB 와 다른 값인 이유).
    and octet_length(p::text) <= 4096
    -- 필수: 원문 주소. 카드 전체가 이 주소로 가는 링크라 http/https 만 허용한다.
    and p ? 'url'
    and jsonb_typeof(p -> 'url') = 'string'
    and (p ->> 'url' like 'http://%' or p ->> 'url' like 'https://%')
    and char_length(p ->> 'url') <= 2048
    -- 선택: 들어오면 타입·길이만 확인한다.
    and (not p ? 'title' or (jsonb_typeof(p -> 'title') = 'string' and char_length(p ->> 'title') <= 300))
    and (not p ? 'summary' or (jsonb_typeof(p -> 'summary') = 'string' and char_length(p ->> 'summary') <= 500))
    and (not p ? 'image' or (jsonb_typeof(p -> 'image') = 'string' and char_length(p ->> 'image') <= 2048))
    and (not p ? 'source' or (jsonb_typeof(p -> 'source') = 'string' and char_length(p ->> 'source') <= 100)),
    false
  );
$$;

comment on function public.is_valid_news_payload(jsonb) is
  '뉴스 글(kind=''news'')의 payload 모양 검사. 필수 url(http/https, 2048자) + 선택 title·summary·image·source. 전체 4KB 상한 — 원문 본문 복제를 막는 선이다.';

-- =============================================================================
-- 2. posts.payload CHECK 교체 — 시나리오 **또는** 뉴스
-- =============================================================================
-- 두 가지를 **이름으로 가정하지 않는다**:
--   ① 기존 CHECK 제약 이름 — 20260715000000 이 남긴 이름이 프로젝트마다 다를 수 있다
--      (20260727000000 의 category 와 같은 처방).
--   ② 시나리오 검사 함수 이름 — 20260723000000 의 rename 실행 여부에 따라
--      `is_valid_post_payload`(개명 후) 또는 `is_valid_scenario_payload`(개명 전)다.
--      🔴 둘 다 없으면 **아무것도 바꾸지 않고 예외로 멈춘다** — 여기서 조용히 넘어가면
--        시나리오 payload 검사가 통째로 사라진 채 제약이 다시 걸린다(그게 더 나쁘다).
do $$
declare
  target record;
  scenario_fn text;
begin
  -- 실재하는 시나리오 검사 함수를 먼저 찾는다. 드롭보다 **앞**이어야 한다 —
  -- 없는데 드롭부터 하면 되돌릴 것 없이 제약만 잃는다.
  select p.proname into scenario_fn
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('is_valid_post_payload', 'is_valid_scenario_payload')
  order by case p.proname when 'is_valid_post_payload' then 0 else 1 end
  limit 1;

  if scenario_fn is null then
    raise exception
      '시나리오 payload 검사 함수를 찾지 못했습니다(is_valid_post_payload / is_valid_scenario_payload). 20260714000000 을 먼저 실행하세요.';
  end if;

  for target in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'posts'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%payload%'
  loop
    execute format('alter table public.posts drop constraint %I', target.conname);
  end loop;

  -- 🔴 kind 로 갈라 검사한다. 뉴스 글에 시나리오를 담거나 그 반대로 담는 것을 DB 가 막는다.
  execute format(
    'alter table public.posts add constraint posts_payload_valid_or_null check ('
    || 'payload is null'
    || ' or (kind = ''news'' and public.is_valid_news_payload(payload))'
    || ' or (kind <> ''news'' and public.%I(payload)))',
    scenario_fn
  );
end
$$;

-- =============================================================================
-- 끝. 요약
-- =============================================================================
--   - is_valid_news_payload(jsonb) 신설 (url 필수 · 4KB 상한)
--   - posts.payload CHECK 를 "시나리오 또는 뉴스"로 교체 (이름: posts_payload_valid_or_null)
--   - 시나리오 검사 함수는 **실재하는 이름을 찾아** 쓴다(개명 전/후 DB 양쪽에서 선다)
--   - 기존 행은 한 줄도 건드리지 않는다 — 시나리오 payload 규칙은 그대로다
--   - 새 컬럼 0 · 새 테이블 0 · RLS 변경 없음 · 재실행 안전
--
-- 실행 뒤 확인 (SQL 에디터에 그대로 붙여 넣어 보라)
-- ---------------------------------------------------------------------------
--   select conname, pg_get_constraintdef(oid)
--     from pg_constraint
--    where conrelid = 'public.posts'::regclass and contype = 'c'
--      and pg_get_constraintdef(oid) ilike '%payload%';
--
--   → posts_payload_valid_or_null 한 줄이 나오고, 그 정의에 is_valid_news_payload 와
--     시나리오 검사 함수가 **둘 다** 보여야 한다.
-- =============================================================================
-- =============================================================================
-- snowball-income — 뉴스 글의 payload 를 허용한다 (20260807000000 의 후속)
-- =============================================================================
--
-- 왜 필요한가
-- ---------------------------------------------------------------------------
-- 앞 마이그레이션이 kind='news' 를 열었지만, payload 에는 20260714000000 이 세운 CHECK 가
-- 그대로 걸려 있다:
--
--     check (payload is null or public.is_valid_post_payload(payload))
--
-- 🔴 **함수 이름이 DB 마다 다를 수 있다.** 20260714000000 은 이 함수를
--   `is_valid_scenario_payload` 로 만들었고, 20260723000000(scenarios → posts 개명)이
--   `is_valid_post_payload