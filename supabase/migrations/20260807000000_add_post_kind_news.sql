-- =============================================================================
-- snowball-income — 커뮤니티 확장: 미디어 뉴스(kind='news')
-- =============================================================================
--
-- 의도
-- ---------------------------------------------------------------------------
-- 20260724000000 이 만든 posts.kind 를 두 갈래에서 **세 갈래**로 넓힌다.
--   - 'portfolio' : 갤러리(포트폴리오/시나리오 공유글)
--   - 'board'     : 자유게시판 글
--   - 'news'      : 미디어 뉴스 — **바깥 글로 가는 링크**가 본체인 글.  ← 신규
--
-- 🔴 **새 테이블을 만들지 않는다.** 댓글(comments)·좋아요(post_likes)·조회수가 이미 posts 위에
-- 붙어 있어서, 뉴스에 별도 테이블을 파면 그 셋을 전부 한 벌 더 만들어야 한다(그리고 두 벌이
-- 조용히 갈린다). 뉴스는 kind 값 하나를 더하는 것으로 끝난다.
--
-- 링크 메타는 어디에 저장하나
-- ---------------------------------------------------------------------------
-- 컬럼을 더하지 않는다. 원문 URL·제목·요약·썸네일·출처는 기존 `payload`(jsonb)에 들어간다
-- (shared/lib/supabase/types.ts 의 NewsPayload). 스키마 변경 없이 필드가 늘어날 수 있고,
-- 뉴스가 아닌 글에는 그 키가 아예 없다.
--
-- ⚠ **원문 본문을 복제해 저장하지 않는다**(저작권). 담는 것은 제목·요약 2~3줄·썸네일 URL·출처
--   도메인뿐이고, 카드 전체가 원문으로 가는 링크여야 한다. 이 규율은 DB 가 아니라 클라이언트와
--   `api/unfurl` 이 지킨다 — 여기 적어 두는 이유는 이 테이블을 다음에 보는 사람이 알아야 해서다.
--
-- 무엇을 바꾸나
-- ---------------------------------------------------------------------------
-- 20260724000000 은 컬럼을 **인라인 CHECK** 와 함께 만들었다
--   (`add column ... check (kind in ('portfolio','board'))`).
-- 인라인 CHECK 는 Postgres 가 이름을 자동 생성하므로(보통 posts_kind_check) 이름을 가정하지 않고
-- **kind 컬럼을 참조하는 모든 CHECK 제약을 찾아 지운 뒤**, 이름을 명시한 제약
-- `posts_kind_allowed` 를 새로 붙인다. 이후 확장은 이 이름 하나만 알면 된다.
-- (같은 처방을 category 가 20260727000000 에서 이미 썼다 — 그 파일과 나란히 읽어라.)
--
-- 실행 순서 / 멱등성 (중요)
-- ---------------------------------------------------------------------------
-- 이 파일은 **20260724000000 을 아직 실행하지 않았어도** 단독으로 안전하다.
--   - 컬럼: `add column if not exists` 로 없으면 만든다(기본값·NOT NULL 동일).
--   - 제약: 이름을 가정하지 않고 동적으로 찾아 drop → 그 다음 add. 두 번 돌려도 최종 상태가 같다.
--   - GRANT·인덱스: additive / IF NOT EXISTS 라 재실행 무해.
--
-- 🔴 배포 순서: **이 마이그레이션을 먼저 실행**한 뒤 뉴스 클라이언트를 배포한다.
--   순서가 뒤집히면 게시가 CHECK 위반(23514)으로 실패한다. 읽기는 깨지지 않는다 —
--   구 스키마에는 kind='news' 행이 존재할 수 없어 목록이 그냥 비어 있을 뿐이다.
--
-- 앱 하위 호환
-- ---------------------------------------------------------------------------
-- 마이그레이션 미실행 상태에서도 앱은 죽지 않는다. 갤러리(kind='portfolio')·게시판(kind='board')
-- 조회와 게시는 이 파일과 무관하게 그대로 동작하고, **뉴스 게시만** 실패한다(무음이 아니라
-- 게시 실패 배너). 기존 행은 한 줄도 건드리지 않는다.
--
-- ⚠ 원장(append-only): 20260724000000 을 포함한 이전 마이그레이션은 절대 수정하지 않는다.
-- ⚠ shared/lib/supabase/types.ts(PostKind) · shared/constants/community 와 동기화된다.
-- =============================================================================

-- =============================================================================
-- 1. kind 컬럼 — 20260724000000 을 건너뛴 DB 를 위한 방어적 생성
-- =============================================================================
-- 이미 있으면 아무 일도 일어나지 않는다(CHECK 는 아래 2단계가 통일한다).
alter table public.posts
  add column if not exists kind text not null default 'portfolio';

-- =============================================================================
-- 2. CHECK 제약 교체 — 이름을 가정하지 않고 kind 참조 CHECK 를 전부 걷어낸다
-- =============================================================================
-- 20260724000000 의 인라인 CHECK 는 자동 생성 이름이라 `drop constraint posts_kind_check` 로
-- 하드코딩하면 프로젝트에 따라 빗나갈 수 있다. 카탈로그에서 찾아 지운다.
-- (NOT NULL 은 pg_constraint 가 아니라 pg_attribute.attnotnull 이므로 여기 걸리지 않는다.)
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

-- 이제 이름 있는 제약으로 다시 건다. 다음 확장은 이 이름만 drop 하면 된다.
alter table public.posts
  add constraint posts_kind_allowed
  check (kind in ('portfolio', 'board', 'news'));

comment on column public.posts.kind is
  '글 종류: portfolio(갤러리 공유글·기본) / board(자유게시판) / news(미디어 뉴스 — 바깥 링크가 본체). 게시 시점에 고정된다(update GRANT 없음). 뉴스의 링크 메타(url·title·summary·image·source)는 payload jsonb 안에 산다 — 원문 본문은 저장하지 않는다.';

-- =============================================================================
-- 3. GRANT — 20260724000000 을 건너뛴 DB 를 위한 재확인 (additive · 재실행 안전)
-- =============================================================================
-- ⚠ 이걸 빠뜨리면 클라이언트가 kind='news' 로 게시할 수 없다(컬럼 GRANT 가 1차 관문).
-- 🔴 update 는 **주지 않는다** — 게시 후 종류 변경 불가(뉴스를 갤러리 글로 둔갑시키지 못한다).
--   20260724000000 이 세운 규율 그대로다.
grant insert (kind) on public.posts to authenticated;

-- =============================================================================
-- 4. 뉴스 목록 인덱스 — 공개 뉴스 글 최신순 keyset
-- =============================================================================
-- 목록은 is_public=true AND kind='news' 를 (created_at desc, id desc) 로 훑는다.
-- 부분 인덱스라 뉴스 글만 좁혀 스캔한다(게시판의 posts_board_recent_idx 와 같은 형태).
create index if not exists posts_news_recent_idx
  on public.posts (created_at desc, id desc)
  where is_public and kind = 'news';

-- =============================================================================
-- 끝. 요약
-- =============================================================================
--   - posts.kind 허용값을 2종 → 3종으로 확장 (news 추가)
--   - 인라인(자동 이름) CHECK → 이름 있는 제약 posts_kind_allowed 로 교체
--   - 기존 행/기존 값('portfolio','board')은 전부 그대로 유효 — 데이터 변경 없음
--   - insert(kind) GRANT 재확인. update 는 없음(게시 후 종류 고정)
--   - posts_news_recent_idx(공개 뉴스 글 최신순 keyset) 부분 인덱스
--   - 새 테이블 0 · 새 컬럼 0 · RLS 정책 변경 없음
--   - 20260724000000 실행 여부와 무관하게 단독 실행 가능하고, 재실행해도 결과가 같다
-- =============================================================================
