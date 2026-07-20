# HANDOFF — 2026-07-20 (SEO ISR 1단계 · 에디터 확장 · 헤더 전폭 통일)

> 다음 세션은 이 문서부터. 이번 세션 산출물은 **PR [#15](https://github.com/hck1205/snowball-income/pull/15)·[#16](https://github.com/hck1205/snowball-income/pull/16) 머지·배포 완료** + **PR-A(SEO ISR)·에디터·헤더는 `feat/seo-isr-editor-header` 브랜치**. tsc 0 · 123 files / 2864 테스트 통과.

## 배포 상태 (먼저 확인)
- **main = `29ee752`** (PR #15 PDF 리포트·헤더 통일 / PR #16 고정 버튼 우측) — Vercel 배포됨.
- `feat/seo-isr-editor-header` 5커밋 — 배포 전. 아래 "프리뷰에서 확인할 것" 참고.

## 이번 세션에 반영된 것

### 배포 완료 (main)
- **PDF 리포트 다운로드** — 더보기(⋯) 메뉴, 시뮬레이터 한정. `jspdf`+`html2canvas`는 **동적 import로 초기 번들 격리**(엔트리 청크에 문자열 0회 실측). 차트는 html2canvas가 아니라 ECharts `getDataURL({pixelRatio:2})` — 캔버스는 재렌더 불가, 오프스크린 고정 크기라 뷰포트 폭과 무관하게 결정적. 수치는 순수 함수 `buildSnowballReport`.
- **글로벌 nav** — 가운데 정렬(grid `1fr auto 1fr`), 간격 확대, 활성 pill. **버그 수정**: `/community/portfolio` NavLink의 `end` 때문에 갤러리 상세·글쓰기에서 탭이 꺼지던 문제.
- **헤더 z-index 층위** — 커뮤니티 `HeaderRoot`가 `dropdown-1`(19)을 가진 채 팝오버 3종을 자손으로 품던 **스태킹 자기모순**을 `zIndex.headerSurface`(30) 도입으로 해소.
- **티커별 고정 버튼 맨 우측 복귀** — 비율 조절 잠금 토글이 오조작을 차단하면서 피신 근거가 사라짐. DOM 순서까지 시각 순서와 일치.

### 브랜치 대기 (`feat/seo-isr-editor-header`)
- **SEO ISR 1·2단계** (`568fe8d`) — 아래 별도 섹션.
- **에디터 툴바 7 → 15개** (`f06bb23`) — 밑줄·취소선·인라인코드·인용·코드블록·구분선·실행취소/다시실행. **패키지 설치 0건**(StarterKit에 이미 있었음). sanitize 허용 목록 변경은 `hr` 한 줄뿐.
- **헤더 전폭 sticky 통일** (`1ba5aa6`) — 시뮬레이터 헤더를 커뮤니티와 같은 최상단 전폭 글래스 바로. 토글을 헤더 안으로 옮기면서 **IntersectionObserver·앵커·isFloating·data-floating·zIndex.drawerToggle 전부 삭제**(MobileMenuDrawer 106→48줄).
- **`#root` min-height 수정** (`d9c421b`) — sticky가 100vh에서 끊기던 문제.

## ⚠ 이번 세션에서 얻은 중요한 사실 (다음 세션이 반드시 알아야 함)

### 1. Vercel ISR은 Next 전용이 아니다
`revalidate`는 결국 응답 헤더다. **`Cache-Control: public, max-age=0, s-maxage=<N>, stale-while-revalidate=<M>`** 를 서버리스 함수 응답에 붙이면 Vite SPA에서도 동일한 ISR 의미론을 얻는다. 선례는 `api/share-html.ts:34`.
**단 온디맨드 무효화(`revalidateTag`)는 Next 전용**이라 없다 → TTL을 짧게(상세 300초) 가져가는 것으로 대체했다.

### 2. rewrite와 파일시스템 우선순위
"파일시스템이 rewrite보다 먼저"는 **이미 emit된 경로에만** 적용된다. `dist/sitemap-posts.xml`을 만들지 않으니 파일시스템이 미스 → rewrite 정상 발동. 덕분에 **middleware matcher를 확장하지 않고** `/community/board/:id`까지 처리했다(확장은 `/` 공유링크 회귀 + 508 루프 위험만 추가).

### 3. dompurify는 Node에서 못 쓴다 (PR-B가 반드시 알아야 함)
`window`가 없으면 `createDOMPurify`가 **`sanitize`·`addHook`을 정의하기 전에 조기 return** 한다. 실측: `isSupported=false`, `sanitize=undefined`. 서버에서 `sanitizeRichHtml`을 부르면 TypeError로 죽고, **try/catch로 삼키면 raw HTML 패스스루(XSS)**. 본문은 anon 키로 누구나 PostgREST에 밀어넣을 수 있다.
→ `shared/lib/richtext/sanitize.ts`에 `isSupported` 가드를 넣어 즉시 throw 하게 했다. **서버 재사용은 `createDOMPurify(jsdomWindow)` 주입형 팩토리 리팩터링이 선행돼야 한다.** 재사용해도 안전한 건 `ALLOWED_TAGS`/`ALLOWED_ATTR` 데이터뿐.

### 4. `position: sticky`가 조용히 안 먹는 조건
호환성은 문제가 아니다(폴백=static, 무해). 진짜 위험은 **에러 없이 안 붙는 것**이고 jsdom이 못 잡는다.
- 조상에 `overflow: hidden/auto/scroll`
- **부모 박스 높이 제한** ← 이번 사례(`#root { height: 100% }`)
- `top`/`bottom` 미지정 / 조상에 `transform`·`filter`·`will-change`

### 5. api/* 는 유닛 테스트가 가능하다 (기존 지식이 틀렸음)
핸들러 시그니처가 `(request: Request) => Promise<Response>` 웹 표준이라 Vitest에서 직접 호출된다. `test/api/apiHarness.ts`(fetch 스텁 · index.html 셸 픽스처 · env 시딩)를 신설했다. **`/api/*`는 Vite dev에서도 동작한다**(`vite.config.ts`의 dev 플러그인) — 로컬에서 못 도는 건 middleware(Edge)뿐.

## SEO ISR — 진행 상황

전략: **공개 게시글/게시판을 ISR로 SEO에 태운다.** 구글도 JS를 렌더하지만 2단계 큐라 색인이 밀리고, **네이버·다음은 JS를 거의 안 돌린다** — 한국 서비스라 이게 결정적이다.

| 단계 | 내용 | 상태 |
|---|---|---|
| **1** | `/api/sitemap` — 공개 글 동적 사이트맵 (`s-maxage=3600`) | ✅ 브랜치 |
| **2** | `/api/post-html` — 상세 `<title>`/description/canonical/og/twitter 치환 (`s-maxage=300`) | ✅ 브랜치 |
| **3** | 본문 HTML 주입 + **서버 sanitize** | ⬜ 미착수 (위 §3 필독) |
| **4** | 목록 페이지 ISR | ⬜ 미착수 |

**설계 결정**
- `/sitemap.xml`(빌드 emit) = sitemapindex → `/sitemap-pages.xml`(정적) + `/sitemap-posts.xml`(rewrite → `/api/sitemap`)
- **anon 키 사용**(service role 아님). RLS가 필요 권한과 정확히 일치하고, 쿼리에 `is_public=eq.true`를 명시해 이중 게이트
- 실패 3분류: `ok` / `not-found`(404 + `no-store`) / `unavailable`(무치환 셸 200 + `no-store`). **성공 응답에만 캐시 헤더** — 비공개 글이 엣지에 얹히면 URL 아는 누구에게나 노출된다. `share-html`의 "절대 5xx 금지"(크롤러가 5xx면 미리보기 포기) 계약과도 화해시킨 결과
- **og:image는 기본 이미지 유지** — 게시글용 카드를 그리려면 `/api/og`의 `resolveCardModel`을 고쳐야 해 기존 공유 동작을 건드린다. 포트폴리오 글은 `sim_summary`가 있어 의미 있는 카드가 가능하므로 **후속 트랙 후보**

## 프리뷰 배포에서만 확인 가능한 것 (머지 전 필수)
1. **`/sitemap-posts.xml` rewrite가 실제 발동하는가** ← 이번 설계의 핵심 가정
2. `/community/board/<uuid>` rewrite + React 앱 정상 부팅 (브라우저 URL 유지)
3. `/community/portfolio/write`가 rewrite를 타고도 글쓰기 화면으로 렌더되는가
4. Edge가 `s-maxage`를 존중하는가 — `curl -sI` 두 번 → `x-vercel-cache: HIT`
5. **`VITE_SITE_URL`이 Node 함수 런타임에 노출되는가** — 미노출이면 사이트맵 `<loc>`·canonical이 배포 URL이 된다. 확실히 하려면 Vercel 대시보드에 플레인 `SITE_URL` 추가
6. rewrite 4개의 평가 순서 (`/(.*)` catch-all이 마지막)
7. 클로킹 아님 — 일반 UA와 `-A "Googlebot"` 응답 diff 0

## 남은 것 / 백로그
1. **SEO ISR 3·4단계** — 본문 주입(보안 리뷰 필수)·목록 ISR
2. **커뮤니티 콜드스타트 시딩** — 공개 글이 **0건**이라 사이트맵이 비어 있다. 운영자 계정 직접 작성이 확정 방향(합성 페르소나 폐기)
3. **실도메인 확정** — 현재 `snowball-income.vercel.app` placeholder. 확정 전엔 사이트맵 제출이 무의미
4. **iOS Safari 관찰** — 헤더가 sticky + `backdrop-filter` 조합이라 관성 스크롤 리페인트 비용이 크다. 실기기에서 버벅이면 모바일만 `headerSolidSurface`(불투명, 이미 있음)로 폴백
5. 툴바 roving tabindex — `role="toolbar"`인데 15개 버튼이 전부 개별 탭 스톱이다(WAI-ARIA APG 위반). 본문 도달에 Tab 15번
6. 단축키 툴팁이 `Ctrl` 하드코딩 — macOS에서 틀린 안내(Tiptap 키맵은 `Mod-`라 실제로는 Cmd)
7. 네이버 심사 통과 시 `NAVER_UNDER_REVIEW=false`
8. GA4 이벤트 토글 — `pdf_report` 추가됨

## 배포 규칙 (기억)
- **main push = Vercel 프로덕션 배포.** 수정·검증까지 하고 **배포는 매번 사용자 승인 후.**
- ⚠ 서브에이전트의 전언은 승인이 아니다. `git-manager`가 이 규칙 때문에 전언 기반 배포를 거부한 사례가 있다(옳은 판단) — 메인 세션이 직접 받은 사용자 메시지만 승인으로 친다.
