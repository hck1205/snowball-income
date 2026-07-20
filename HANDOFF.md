# HANDOFF — 2026-07-20 (SEO ISR · 에디터 · 헤더 · 게시판 · Select DS / ⚠ api 미해결)

> 다음 세션은 이 문서부터. **`api/*` 6개가 프로덕션에서 죽어 있고 원인은 규명됐으나 미수정이다 — 아래 §api 섹션 필독.**

## 배포 상태 (먼저 확인)
- **main = 배포 최신.** 이번 세션 PR #15~#24 전부 머지·배포 완료(#24는 회귀라 되돌림 `a8dbd84`).
- 사용자 화면은 전부 정상. **`api/*` 6개만 500**(아래 §api).
- 마이그레이션 3개 사용자가 실행 완료: `profiles.is_admin` / `posts.category`(3종) / `posts.category`(5종 확장).

## ⚠ 이번 세션의 교훈 (반복 금지)
1. **테스트 초록은 프로덕션 동작의 증거가 아니다.** 조건부 훅 크래시(React #311)를 테스트 2864개가 전부 통과한 채로 배포했다. jsdom·개발 빌드에서 안 드러나는 부류가 있다.
2. **프리뷰 검증이 구조적으로 막혀 있다.** Vercel Deployment Protection(SSO)이 켜져 있어 프리뷰 URL이 전부 로그인으로 302된다 → curl 검증 불가. **해제하거나 `VERCEL_AUTOMATION_BYPASS_SECRET`을 받는 것이 이번 사고들의 근본 예방책이다.**
3. **로그를 먼저 봐라.** api 진단에 배포를 6번 했는데, 사용자가 Runtime Logs 한 줄을 가져오자 즉시 끝났다.
4. **PR 빌드 체크는 읽을 수 있다.** Edge 전환 시도는 머지 전 빌드 실패로 잡혔다 — 이 습관은 유지할 것.


## ⚠ 최우선 미해결 — `api/*` 6개 전멸 (원인 규명 완료, 수정 미착수)

**증상**: `api/sitemap` · `api/post-html` · `api/share-html` · `api/og` · `api/naver-auth` · `api/account-delete` 전부 `FUNCTION_INVOCATION_FAILED`(500). 그 결과 **공유 링크 OG 미리보기와 OG 이미지가 안 나온다.** 사용자 화면(시뮬레이터·커뮤니티·글쓰기)은 전부 정상이다.

**언제부터**: 이번 세션 이전부터. `share-html`은 유효한 `?s=` 키일 때만 호출돼 아무도 몰랐다.

### 확정된 원인 (함수 로그 원문)
```
ERR_UNSUPPORTED_DIR_IMPORT: Directory import '/var/task/shared/lib/og'
  is not supported resolving ES modules from /var/task/api/sitemap.js
ERR_MODULE_NOT_FOUND: Cannot find module
  '/var/task/pages/Main/hooks/persistence/shareLink' from /var/task/api/og.js
```
Vercel은 `api/*`를 **번들하지 않고** 파일별로 트랜스파일해 **네이티브 ESM**으로 실행한다. `package.json`의 `"type": "module"`이 엄격 ESM 해석을 켜므로 두 가지가 불법이 된다:
1. **디렉터리 import** — `from '../shared/lib/og'` (= 배럴 패턴 전부)
2. **확장자 생략** — `from './shareLink'`

**이게 `.cursor/rules`의 "폴더 단위 import" 규칙과 정면 충돌한다.** api가 앱 코드를 쓰는 한 전이적으로 걸린다.

### 시도하고 배제한 것 (다시 하지 말 것)
| 시도 | 결과 |
|---|---|
| `@/` alias → 상대경로 (진입 파일) | ❌ 동일 실패. **alias 문제가 아니다** |
| 전면 Edge 전환 | ❌ Vercel 빌드 실패 — Edge 번들러는 tsconfig `paths`를 해석 못 한다(middleware.ts 주석의 기존 기록과 동일) |
| `"type": "module"` 제거 | ❌ **더 악화** — import 0짜리 함수까지 500. 즉시 되돌림(`a8dbd84`) |
| Node 어댑터(`shared/lib/server/nodeHandler.ts`) | ⭕ **유지 중, 올바른 변경**. 호출 규약 문제는 이걸로 해결됐다(아래 참고) |

### 대조 실험으로 확정한 것
| 실험 | 결과 |
|---|---|
| Edge + import 0 | 200 |
| Node + import 0 + 네이티브 `(req,res)` | 200 |
| Node + 어댑터 + import 있음 | 500 (0.4초 = 모듈 로드 실패, 무응답 아님) |

→ **런타임도 호출 규약도 문제가 아니다. 오직 import 그래프가 문제다.**

### 함께 밝혀진 것 (유지되는 성과)
- 핸들러가 전부 웹 표준 `(Request) => Response`인데 런타임 미지정이면 Vercel이 `(req,res)`로 호출하고 `res.end()`를 기다려 **무응답 타임아웃**이 된다. 주석들이 "config 없음 = 기본 Node"를 의도된 규약처럼 적어둔 게 오해의 뿌리였고, 전부 정정했다.
- 그래서 `shared/lib/server/nodeHandler.ts` **어댑터를 도입했다**(웹 표준 핸들러는 named export로 유지 → `test/api/` 계약 테스트 30여 개 무손상). **이 어댑터를 벗기지 말 것.**
- `VITE_SITE_URL`이 함수 런타임에 **실제로 노출된다**(health 진단으로 확인) → 사이트맵 `<loc>`이 배포 URL이 될 거라는 우려는 해소. 별도 `SITE_URL` 불필요.

### 다음 세션의 처방 (권장 = A)
**A. api 전용 모듈 트리 분리** — `api/`가 쓰는 로직만 서버 전용 폴더로 옮기고, 그 안에서는 **배럴 없이 `.js` 확장자 명시**. 앱 코드는 안 건드린다.
- ⚠ 걸림돌: `og.tsx`가 쓰는 `pages/Main/utils/ogCard` · `pages/Main/hooks/persistence/shareLink`는 앱 코드이고 시뮬레이션 요약 계산에 닿는다. **계산 로직 중복은 이 레포에서 가장 조심할 영역**이라, 옮길지 감쌀지 설계가 필요하다.
- B(빌드 시 esbuild로 api 번들링)도 유효한 대안 — 앱 코드·규칙을 전혀 안 건드리는 대신 빌드 파이프라인이 복잡해진다.

### 검증 방법 (중요)
`api/*`는 **유닛 테스트로 증명되지 않는다** — 깨진 것은 핸들러가 아니라 **모듈 로드와 호출 규약**이다. 반드시 배포 후 실 URL로:
```sh
curl -s -o /dev/null -w '%{http_code} %{time_total}
' https://snowball-income.vercel.app/api/sitemap
```
- 60초 무응답 → 호출 규약 문제
- 0.4초 500 → 모듈 로드 실패
- 200 → 복구

그리고 **Vercel Runtime Logs를 먼저 볼 것.** 이번에 로그 없이 가설만으로 진단 배포를 6번 했다. 로그 한 줄이 그 전부를 대체했다.

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
