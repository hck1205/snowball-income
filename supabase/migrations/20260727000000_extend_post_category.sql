-- =============================================================================
-- snowball-income — 글 종류 확장: 질문과 고민 · 인사이트 추가 (총 5종)
-- =============================================================================
--
-- 의도
-- ---------------------------------------------------------------------------
-- 20260726000000 이 만든 posts.category 를 세 갈래에서 **다섯 갈래**로 넓힌다.
--   - 'free'       : 자유 (기본값). 어디에도 안 붙는 일반 글.
--   - 'question'   : 질문과 고민. 답을 구하는 글.            ← 신규
--   - 'insight'    : 인사이트. 분석·컬럼처럼 알게 된 것을 나누는 글. ← 신규
--   - 'suggestion' : 건의사항. 서비스 개선 요청.
--   - 'notice'     : 공지. **운영자만 선택**한다(UI 수준 제한, RLS 강제 아님 — 아래 참고).
--
-- 슬러그 선정 근거
-- ---------------------------------------------------------------------------
-- 기존 'free' / 'suggestion' / 'notice' 와 같은 규율을 따른다: **한 단어 영어 명사, 소문자**.
--   - 'question' : 화면 라벨은 '질문&고민'이지만 슬러그는 축 하나(질문)로 짧게 둔다.
--     'question_and_concern' 류의 합성어는 라벨이 조금만 바뀌어도 이름이 어긋나 보인다.
--     라벨은 카피의 문제이고 슬러그는 데이터의 문제라 **의도적으로 분리**한다.
--   - 'insight'  : 라벨('인사이트')과 1:1. 'column'은 SQL 예약어와 눈으로 헷갈리고
--     ('column' 은 실제로 예약어다) 'analysis'/'review' 보다 포괄 범위가 넓어 인사이트를 골랐다.
-- 복수형('questions')을 쓰지 않는 것도 기존 값들과의 일관성 때문이다(한 행의 분류 = 단수).
--
-- 무엇을 바꾸나
-- ---------------------------------------------------------------------------
-- 20260726000000 은 컬럼을 **인라인 CHECK** 와 함께 만들었다
--   (`add column ... check (category in ('free','suggestion','notice'))`).
-- 인라인 CHECK 는 Postgres 가 이름을 자동 생성하므로(보통 posts_category_check) 이름을 가정하지
-- 않고 **category 컬럼을 참조하는 모든 CHECK 제약을 찾아 지운 뒤**, 이름을 명시한 제약
-- `posts_category_allowed` 를 새로 붙인다. 이후 확장은 이 이름 하나만 알면 된다.
--
-- 실행 순서 / 멱등성 (중요)
-- ---------------------------------------------------------------------------
-- 이 파일은 **20260726000000 을 아직 실행하지 않았어도** 단독으로 안전하다.
--   - 컬럼: `add column if not exists` 로 없으면 만든다(기본값·NOT NULL 동일).
--   - 제약: 이름을 가정하지 않고 동적으로 찾아 drop → 그 다음 add. 26 을 실행했든 안 했든,
--           이 파일을 두 번 돌리든 최종 상태가 같다.
--   - GRANT: additive 라 재실행 안전. 26 을 건너뛴 DB 에서도 권한이 갖춰지도록 다시 준다.
-- 26 → 27 순서로 실행해도, 27 만 실행해도 결과는 동일하다.
--
-- 앱 하위 호환
-- ---------------------------------------------------------------------------
-- 마이그레이션 **미실행 상태에서도 앱은 죽지 않는다**(20260726000000 이 세운 방식 그대로).
--   - 읽기: 조회가 category 를 select 목록에 넣었다가 42703 을 받으면 그 컬럼을 뺀 컬럼셋으로
--           1회 재시도하고 세션 동안 기억한다(shared/lib/supabase/queries.ts). 값이 없으면 'free'.
--   - 쓰기: 클라이언트는 값이 **기준선과 다를 때만** category 키를 보낸다
--           (pages/Community/CommunityWritePage/hooks/usePostComposer.ts). 그래서 이 파일을
--           실행하기 전에는 '자유' 게시와 분류를 안 바꾼 수정이 그대로 성공하고,
--           질문과 고민 · 인사이트로 게시하는 것만 실패한다(무음이 아니라 게시 실패 배너).
--
-- ⚠ 원장(append-only): 20260726000000 을 포함한 이전 마이그레이션은 절대 수정하지 않는다.
-- ⚠ shared/lib/supabase/types.ts(PostCategory) · shared/constants/community/config.ts
--   (POST_CATEGORY_IDS) · copy.ts(categoryLabels) 와 동기화된다.
-- =============================================================================

-- =============================================================================
-- 1. category 컬럼 — 20260726000000 을 건너뛴 DB 를 위한 방어적 생성
-- =============================================================================
-- 이미 있으면 아무 일도 일어나지 않는다(CHECK 는 아래 2단계가 통일한다).
alter table public.posts
  add column if not exists category text not null default 'free';

-- =============================================================================
-- 2. CHECK 제약 교체 — 이름을 가정하지 않고 category 참조 CHECK 를 전부 걷어낸다
-- =============================================================================
-- 20260726000000 의 인라인 CHECK 는 자동 생성 이름이라 `drop constraint posts_category_check`
-- 로 하드코딩하면 프로젝트에 따라 빗나갈 수 있다. 카탈로그에서 찾아 지운다.
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
          and att.attname = 'category'
          and not att.attisdropped
      ) = any (con.conkey)
  loop
    execute format('alter table public.posts drop constraint %I', target.conname);
  end loop;
end
$$;

-- 이제 이름 있는 제약으로 다시 건다. 다음 확장은 이 이름만 drop 하면 된다.
alter table public.posts
  add constraint posts_category_allowed
  check (category in ('free', 'question', 'insight', 'suggestion', 'notice'));

comment on column public.posts.category is
  '자유게시판 글 분류: free(자유·기본) / question(질문과 고민) / insight(인사이트) / suggestion(건의사항) / notice(공지). 화면 라벨은 한국어, DB 는 영어 슬러그. 갤러리(kind=''portfolio'') 글은 이 값을 쓰지 않고 기본값으로 남는다. ⚠ ''notice'' 제한은 UI 표시 수준일 뿐 RLS 로 강제되지 않는다.';

-- =============================================================================
-- 3. GRANT — 20260726000000 을 건너뛴 DB 를 위한 재확인 (additive · 재실행 안전)
-- =============================================================================
-- insert GRANT 가 없으면 자유 이외의 분류로 게시할 수 없고, update GRANT 가 없으면
-- 잘못 고른 분류를 되돌릴 방법이 "글 삭제 후 재작성"뿐이 된다(좋아요·댓글·조회수 소실).
-- 대상 행은 기존 posts RLS 정책(본인 글만)이 그대로 제한한다.
grant insert (category) on public.posts to authenticated;
grant update (category) on public.posts to authenticated;

-- =============================================================================
-- 끝. 요약
-- =============================================================================
--   - posts.category 허용값을 3종 → 5종으로 확장 (question · insight 추가)
--   - 인라인(자동 이름) CHECK → 이름 있는 제약 posts_category_allowed 로 교체
--   - 기존 행/기존 값('free','suggestion','notice')은 전부 그대로 유효 — 데이터 변경 없음
--   - 20260726000000 실행 여부와 무관하게 단독 실행 가능하고, 재실행해도 결과가 같다
--   - RLS 정책 변경 없음. 인덱스 추가 없음
-- =============================================================================
