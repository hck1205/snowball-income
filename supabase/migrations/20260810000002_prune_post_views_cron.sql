-- =============================================================================
-- snowball-income — 조회수 해시 정리를 **DB 안에서** 매일 돌린다 (pg_cron)
-- =============================================================================
-- ## 🔴 왜 필요한가 — 함수는 있는데 아무도 부르지 않았다
--
-- `public.prune_post_views()` 는 20260723000000 에 정의되면서 주석에 "cron/관리자 전용"이라
-- 적혀 있었지만, **부르는 곳이 아무 데도 없었다** — pg_cron 도, 워크플로도, 코드도.
-- 그 결과 개인정보처리방침이 "생성 후 24시간(정리 절차로 삭제)"이라 적은 것과 달리 조회수
-- 중복 방지 해시가 **영구 누적**되고 있었다(2026-08-09 방침 점검에서 발견).
--
-- 방침 문장을 "영구 보존"으로 고치는 길도 있었지만, 중복 방지라는 목적은 24시간이면 끝난다 —
-- IP 기반 해시를 그보다 오래 들고 있을 이유가 없다. **문장을 사실로 만드는 쪽**을 택했다.
--
-- ## 🔴 왜 GitHub Actions 가 아니라 pg_cron 인가
--
-- 처음에는 워크플로가 REST 로 이 함수를 부르게 만들었다. 그러려면 **service_role 키를 깃허브
-- 시크릿에 복사**해야 하는데, 그건 DB 전권 키를 저장소 권한자 전원에게 노출하는 상시 위험이다.
-- 이 작업이 얻는 것("하루 지난 해시 삭제")에 비해 대가가 너무 크다.
--
-- pg_cron 은 **DB 안에서** 돈다:
--   · 키가 밖으로 나가지 않는다.  · 네트워크를 타지 않는다.
--   · 깃허브가 예약 워크플로를 멈춰도(60일간 커밋이 없으면 자동 비활성화된다) 계속 돈다.
--
-- ⚠ 대가: **실패가 조용하다.** 워크플로처럼 빨갛게 뜨지 않는다. 아래 확인 쿼리로 가끔 본다.
--
-- ## 전제
--
-- `pg_cron` 확장이 켜져 있어야 한다(Supabase → Database → Extensions). 2026-08-09 사용자가 켰다.
-- ⚠ Supabase 에서 pg_cron 은 **`postgres` 데이터베이스**에만 설치된다. 이 파일은 대시보드 SQL
--   에디터(= postgres DB)에서 실행하는 것을 전제로 한다.
-- =============================================================================

-- 🔴 확장이 없으면 **여기서 멈추고 이유를 말한다.** 그냥 두면 `cron.job` 이 없다는 42P01 이
--    나는데, 그 메시지만 봐서는 "무엇을 해야 하는지"를 알 수 없다(2026-08-09 실측).
do $$
begin
  if to_regclass('cron.job') is null then
    raise exception
      'pg_cron 확장이 이 데이터베이스에 없다. Supabase 대시보드 → Database → Extensions 에서 pg_cron 을 켠 뒤(스키마는 cron), 이 파일을 **대시보드 SQL Editor** 에서 다시 실행해라.';
  end if;
end
$$;

-- 이미 등록돼 있으면 지우고 다시 건다 — 스케줄을 바꿀 때 이 파일만 다시 돌리면 되게.
-- ⚠ `cron.unschedule` 은 없는 이름이면 예외를 던지므로 존재를 먼저 확인한다.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'prune-post-views') then
    perform cron.unschedule('prune-post-views');
  end if;
end
$$;

-- 매일 20:00 UTC == 다음 날 05:00 KST.
-- 🔴 이 시각은 한국 사용자가 가장 적은 때다 — 삭제가 조회수 등록과 겹치면 그 순간의 dedupe 가
--    한 번 헛돈다(같은 사람이 두 번 세어질 수 있다). 트래픽이 가장 얕은 시각을 고른 이유다.
select cron.schedule(
  'prune-post-views',
  '0 20 * * *',
  $$select public.prune_post_views()$$
);

comment on function public.prune_post_views() is
  '24시간이 지난 조회수 중복 방지 해시(post_views)를 지우고 삭제된 행 수를 돌려준다. 매일 20:00 UTC 에 pg_cron 이 부른다(작업 이름: prune-post-views, 마이그레이션 20260810000002). 🔴 이 스케줄이 멈추면 개인정보처리방침의 "생성 후 24시간" 문장이 사실이 아니게 된다.';

-- =============================================================================
-- 적용 후 확인
-- =============================================================================
-- ① 등록됐는가
--   select jobid, jobname, schedule, active, command from cron.job where jobname = 'prune-post-views';
--   기대: schedule = '0 20 * * *', active = true
--
-- ② 실제로 돌았는가 (하루 뒤부터 행이 쌓인다)
--   select status, start_time, return_message
--   from cron.job_run_details
--   where jobid = (select jobid from cron.job where jobname = 'prune-post-views')
--   order by start_time desc limit 5;
--   기대: status = 'succeeded'
--   ⚠ 이 표를 가끔 봐야 한다 — pg_cron 은 실패해도 알려 주지 않는다.
--
-- ③ 지금 한 번 돌려 보고 싶으면
--   select public.prune_post_views();
