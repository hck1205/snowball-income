-- =============================================================================
-- snowball-income — 게시판 분류에 '뉴스' 추가 + 글 종류에 'fire'(파이어족들) 추가
-- =============================================================================
-- 2026-08-09 사용자 결정으로 두 가지가 함께 바뀐다.
--
-- ## ① 뉴스는 **지면이 아니라 게시판의 분류**다
--
-- 종전에는 `kind='news'` 라는 **별도 지면**을 만들어 뒀다(20260807000000). 그런데 실제로
-- 원했던 것은 "증시·투자 기사를 게시판에 나눠 올리는 것"이었다 — 지면을 새로 팔 일이 아니라
-- 분류 한 칸이면 되는 일이다. 그래서 `category` 에 `'news'` 를 더하고, 그 지면은 코드에서 걷는다.
--
-- 🔴 **데이터 손실이 없다.** 적용 전에 확인했다: `kind='news'` 행은 공개·비공개 통틀어 **0건**이다
--    (운영자만 쓸 수 있는 지면이었고 한 번도 쓰이지 않았다). 그래서 행을 옮기는 절차가 없다.
-- ⚠ 그럼에도 `kind` 의 CHECK 에서 `'news'` 를 **빼지 않는다.** 이유는 아래 ② 끝에 적었다.
--
-- ## ② 파이어족들은 **유튜브 전용 지면**이라 새 종류가 필요하다
--
-- 파이어족의 생활을 담은 유튜브 영상을 카드로 모으는 지면이다. 게시판 글과 저장하는 모양이
-- 다르고(본문 대신 링크 메타), 작성 권한도 다르다(운영자만) — 분류가 아니라 종류로 가른다.
--
-- ## 왜 CHECK 를 이름으로 drop 하지 않나
--
-- 20260724000000 의 인라인 CHECK 는 Postgres 가 이름을 자동 생성해서(보통 `posts_kind_check`)
-- 프로젝트마다 다를 수 있다. 이름을 가정하면 어떤 DB 에서는 빗나간다. 그래서 **그 컬럼을
-- 참조하는 CHECK 를 카탈로그에서 찾아 전부 지운 뒤**, 이름을 명시해 다시 건다
-- (20260807000000 이 쓴 방식 그대로 — 다음 확장은 이 이름만 drop 하면 된다).
--
-- ## 되돌리기
--
-- 두 제약을 이전 목록으로 다시 걸면 된다. 다만 그 사이에 새 값으로 저장된 행이 있으면
-- CHECK 가 걸리므로, 되돌리기 전에 `select kind, category, count(*) from public.posts group by 1,2`
-- 로 확인할 것.
-- =============================================================================

-- =============================================================================
-- 1. 컬럼 — 이전 마이그레이션을 건너뛴 DB 를 위한 방어적 생성
-- =============================================================================
-- 이미 있으면 아무 일도 일어나지 않는다(CHECK 는 아래 단계가 통일한다).
alter table public.posts
  add column if not exists kind text not null default 'portfolio';

alter table public.posts
  add column if not exists category text not null default 'free';

-- =============================================================================
-- 2. category CHECK 교체 — 'news' 추가
-- =============================================================================
do $$
declare
  target record;
begin
  for target in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'posts'
      and con.contype = 'c'
      and (
        select att.attnum
        from pg_attribute att
        where att.attrelid = rel.oid
          and att.attname = 'category'
          and not att.attisdropped
      ) = any (con.conkey)
  loop
    execute format('alter table public.posts drop constraint %I', target.conname);
  end loop;
end
$$;

-- 'news' = 증시·투자 관련 기사 공유. 화면 라벨은 클라이언트가 소유한다
-- (shared/constants/community/copy.ts 의 categoryLabels).
alter table public.posts
  add constraint posts_category_allowed
  check (category in ('free', 'question', 'insight', 'suggestion', 'notice', 'news'));

-- =============================================================================
-- 3. kind CHECK 교체 — 'fire' 추가
-- =============================================================================
do $$
declare
  target record;
begin
  for target in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'posts'
      and con.contype = 'c'
      and (
        select att.attnum
        from pg_attribute att
        where att.attrelid = rel.oid
          and att.attname = 'kind'
          and not att.attisdropped
      ) = any (con.conkey)
  loop
    execute format('alter table public.posts drop constraint %I', target.conname);
  end loop;
end
$$;

-- 🔴 `'news'` 를 **남겨 둔다.** 지금은 그 종류로 저장되는 글이 없지만, 목록에서 빼면
--    이 마이그레이션이 "되돌릴 수 없는 변경"이 된다 — 코드를 되살리는 순간 DB 까지 다시
--    고쳐야 한다. 값 하나를 허용해 두는 비용은 0이고, 막아서 얻는 것도 없다
--    (그 종류로 쓸 수 있는 화면이 코드에 없으므로 실제로 들어올 수 없다).
alter table public.posts
  add constraint posts_kind_allowed
  check (kind in ('portfolio', 'board', 'news', 'fire'));

-- =============================================================================
-- 적용 후 확인 (선택)
-- =============================================================================
--   select conname, pg_get_constraintdef(oid)
--   from pg_constraint
--   where conrelid = 'public.posts'::regclass and contype = 'c'
--   order by conname;
--
-- 기대: posts_category_allowed 에 'news' 가, posts_kind_allowed 에 'fire' 가 보인다.
