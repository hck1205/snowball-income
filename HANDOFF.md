# HANDOFF — 2026-07-20 (커뮤니티 확장 · 클라우드 싱크 화해 · 헤더/UI 개편)

> 다음 세션은 이 문서부터. 이번 세션 산출물은 전부 **main에 머지·배포됨**(PR [#14](https://github.com/hck1205/snowball-income/pull/14), merge `43c26a1`). tsc 0 · 전체 테스트 2249 통과.

## 배포/DB 상태 (먼저 확인)
- **main = 배포 최신.** 이번 브랜치(`feat/simulator-ui-improvements`, 12커밋)가 머지됨 → Vercel 배포됨.
- **DB 마이그레이션 실행 완료(사용자가 SQL 에디터로 직접 실행):**
  - `20260722000000_drop_seed_tracking.sql` — 시드 추적장치 제거
  - `20260723000000_rename_scenarios_to_posts.sql` — `scenarios`→`posts` 물리 rename
  - `20260724000000_add_post_kind.sql` — `posts.kind`(portfolio/board)
  - ⚠ 클라이언트가 `posts`/`kind`를 호출하므로 이 순서로 선행 실행돼 있어야 정상(완료됨).

## 이번 세션에 반영된 것
### 헤더 · 시뮬레이터 UI
- 워드마크 **"Snowball / Income" 2줄**(로고 높이 정합).
- **⋯ 더보기 메뉴**로 튜토리얼·앱설치·테마 통합(커뮤니티는 튜토리얼 제외). 앱설치는 호환 분기(네이티브 프롬프트 / 수동 가이드 / 설치됨).
- **헤더 2줄 레이아웃**(1줄=로고+메뉴 / 2줄=우측 컨트롤·검색) + **상단 brand 틴트**(테마 토큰).
- 티커 **비율 조절 잠금 토글**(모바일 오조작 방지, ≤960px 기본 잠금), 프리셋 **적용 확인 모달**, 파이 중앙 **월배당 상시 표시**.

### 클라우드 ↔ 디바이스 싱크
- 무음 last-write-wins → **세션시작 충돌 감지 + 3-way 화해 모달**(디바이스 / 클라우드 / **블렌드=합집합·비파괴**) + 헤더 "동기화 보류" 재개봉.
- **비로그인 1탭 제한 + 로그인 유도**(블렌드 증식 억제·로그인 유인). 커뮤니티 비활성 배포엔 게이트 없음.
- 저장/공유 스키마 무변경(런타임 `conflict` 상태만 추가). GA4 `cloud_sync_conflict`.

### 커뮤니티 확장
- **`scenarios` → `posts` 물리 rename**(게시글 엔티티). 시뮬 what-if 개념(`PersistedScenarioState`·`sim_summary`·`buildScenarioSimSummary`·`shared_snapshots`·`?s=`/`?share=`)은 **의도적으로 유지**.
- **자유게시판**(`posts.kind`='board', `/community/board` 목록·글쓰기·상세). 갤러리는 `kind='portfolio'`만 노출.
- **글로벌 `PrimaryNav`**(로고→홈 + 시뮬레이터·포트폴리오 갤러리·게시판, `aria-current`) 두 헤더 주입, `CommunityNavLink` 제거.
- 갤러리 라우트 **`/community/portfolio`**(게시판과 대칭, `/community`→리다이렉트). 글 상세 링크 **kind-aware**로 수정(게시판 글이 갤러리 상세로 잘못 연결되던 버그 해소).

## 남은 것 / 백로그
1. **커뮤니티 콜드스타트 시딩(운영자 직접·투명)** — 세션 초반 만든 5건 posts SQL은 **rename 이전(`scenarios`) 기준이라 폐기**. 지금 스키마(`posts` + `kind='portfolio'`)로 **재생성 필요**(앱 시뮬레이터에서 만들어 "게시" 하는 방법이 가장 안전). 운영자 계정으로 직접 작성이 확정 방향(합성 페르소나 시딩은 폐기됨).
2. **실브라우저 확인** — 헤더 2줄 레이아웃·검색 2번째 줄 가운데·상단 색·워드마크 2줄은 **jsdom @media 미평가**라 유닛으로 못 잡는다. 좁은 뷰포트(모바일)·팔레트 전환·다크에서 육안 확인 권장.
3. **상단 색 트리트먼트는 1안(brand 틴트 그라데이션)** — 사용자는 컬러풀·velog풍을 선호하고 여러 버전 비교를 원함. 필요 시 대안(오로라 그라데이션 액센트 / 활성 라우트 강조 변형) 제시·비교.
4. 네이버 심사 통과 시 `NAVER_UNDER_REVIEW=false`(승인 후 배포).
5. GA4 주요 이벤트 토글(발화 후 관리 → 이벤트): `cloud_sync_conflict`·`community_post_published`·`login_completed` 등.

## ⚠ SEO — ISR 전략을 어떻게 할지 고민해야 한다 (다음 세션 최우선 검토)
자유게시판·포트폴리오 갤러리가 **공개 콘텐츠**가 되면서 검색 유입 가치가 생겼는데, 이 앱은 **Vite SPA(클라이언트 렌더)**다 → 크롤러가 글 본문·목록을 못 읽는다. 공유 링크용 동적 OG(`/api/og`·`middleware.ts`)와 `#root` 프리렌더는 있지만, **게시글/게시판 상세의 본문 자체를 SEO에 태우는 전략은 없다.**

**결정할 것**: 동적 커뮤니티/게시판 페이지의 렌더링 전략 —
- Vite는 Next의 ISR을 네이티브로 안 준다 → **(a) SSR/프리렌더 서버(예: Vercel 함수로 게시글 HTML을 캐시·재검증)**, **(b) 빌드타임 SSG는 동적 글엔 부적합**, **(c) `/api`에서 게시글별 프리렌더 HTML을 ISR처럼 stale-while-revalidate로 서빙** 등 중 무엇으로 갈지.
- 고려: 캐시 무효화(글 수정/삭제 시), 크롤러 전용 스텁 금지(기존 원칙), 엔트리 번들 격리(supabase/Tiptap), `posts.is_public`만 노출.
- 요약: **"공개 게시글/게시판을 어떤 ISR(또는 SSR/프리렌더) 방식으로 SEO에 태울지"를 먼저 설계**한 뒤 착수한다.

## 배포 규칙 (기억)
- **main push = Vercel 프로덕션 배포.** 수정·검증까지 하고 **배포는 매번 사용자 승인 후.** 이번 머지는 사용자가 사전 승인함.
