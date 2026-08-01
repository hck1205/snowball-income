# `/` → `/simulator` 이전 — 하위 호환 대응 설계

> 트랙 ⑥(`docs/design-refresh-plan.md`, `docs/roadmap-gap-analysis.md` 5단계의 선행 조건).
> 이 문서는 **무엇이 깨지는지**와 **어떻게 막는지**만 다룬다. 랜딩 콘텐츠 설계는 트랙 ⑦의 몫이다.
> 2026-08-01 조사. 조사자가 실측으로 확인한 것만 적는다.

## §0 전제 반증 (먼저 읽어라)

| 통념 | 실측 | 근거 |
|---|---|---|
| 공유 파라미터는 `?share=` **하나** | ❌ **셋** — `share`(lz-string) · `s`(DB key) · `sv`(버전) | `pages/Main/hooks/persistence/shareUrl.ts:1-4` |
| OG 크롤러 경로는 `api/og.js`·`api/share-html.js` | ❌ 실제 진입점은 **`middleware.ts`(Edge)** 다. 두 api 함수는 그 하위 단계 | `middleware.ts:43-98` |
| 클라이언트 리다이렉트는 크롤러가 안 따라와 위험 | ❌ **정반대.** middleware 는 파일시스템·캐시보다 **앞**에서 돌고 `matcher:'/'` 라 크롤러는 리다이렉트의 존재조차 모른다. **기존 링크 OG 는 영향 없다.** 진짜 위험은 **이전 후 새로 만들어지는 링크** | `middleware.ts:24-28` |
| `public/sitemap.xml` 점검 | ❌ **그 파일은 없다.** `vite.config.ts` 의 `seoAssetsPlugin` 이 빌드 때 emit | `vite.config.ts:42-56, 356-411` |
| 헤더 nav 가 늘어난다 | ❌ **안 는다.** "시뮬레이터" 항목의 `to` 만 바뀐다 | `components/PrimaryNav/PrimaryNav.tsx:41` |

🔴 **부수 발견 — `public/ai-overview.json` 은 llms.txt 수정에서 누락됐다.**
`"collects_personal_data": false`, `"computation": "client-side only (no backend)"` 가 그대로 남아 있다.
AI 크롤러용 표면 3종 중 1종만 거짓인 상태다. **별도 트랙으로 잡아야 한다.**

## §1 공유 링크 대응 🔴 최우선

### 1-A 생산자 / 소비자 전수

**생산자** — `usePortfolioPersistence.ts:537`(`?s=`), `:518`(`?share=`) 둘 다 `window.location.href` 베이스라
**경로가 바뀌면 새 링크 경로도 자동으로 따라간다.** 유일한 하드코딩 생산자는
`pages/Community/CommunityDetailPage/hooks/usePostDetail.ts:194` (`` `/?share=…` ``).

**소비자** — 앱 쪽(`usePortfolioPersistence.ts:577-639`, `scenarioPrefill.ts:21`)은 `href` 직독이라 **경로 무관**.
`server/handlers/Og/Og.tsx:259-265` 도 파라미터만 본다. **경로에 묶인 것은 `middleware.ts:45`(`matcher:'/'`)와
`ShareHtml.ts:63`(og:url 을 `new URL('/', origin)` 로 하드코딩) 둘뿐**이다.

해시(`#share=`)·경로 세그먼트(`/share/:code`) 형태는 **없다**(전수 grep 무매치).

### 1-B 무엇이 깨지나

1. 배포된 `/?share=…`·`/?s=…` 가 랜딩에 착지 → 시나리오가 안 열린다.
2. `usePostDetail` 의 "시뮬레이터로 열기" CTA 가 `/` 로 보낸다 → 갤러리 첨부가 전부 죽는다.
3. 이전 **후** 생성되는 링크는 `/simulator?share=…` 인데 `matcher:'/'` 가 못 잡는다 →
   **OG 카드가 기본 카드로 폴백**(카카오·페북·네이버 미리보기 무의미).

### 1-C 권고안 — 클라이언트 조기 분기 + middleware matcher 확장 (**조합**)

두 층은 서로 다른 사용자를 담당한다. 하나만으로는 부족하다.

**층 1 — 클라이언트(사람용)**: `router/routes.tsx` 의 `/` element 를 **동기 분기 래퍼**로.

```tsx
function RootRoute() {
  const { search } = useLocation();
  const redirect = resolveShareRedirectPath(search);       // 순수 함수
  if (redirect) return <Navigate to={redirect} replace />; // 랜딩은 렌더조차 안 된다
  return <LandingPage />;
}
```

`resolveShareRedirectPath` 는 **`pages/Main/hooks/persistence/shareUrl.ts`** 에 둔다 —
파라미터 이름 상수의 단일 정본이 거기이고, `stripShareParams` 와 같은 파일이면 4번째 파라미터가 생겨도 함께 갱신된다.

🔴 **판정은 "값의 유효성"이 아니라 "파라미터 존재"로 한다.**
`?share=zz`(깨진 페이로드)를 여기서 걸러 랜딩에 남기면 **이번 세션에 고친 버그의 사용자 가치가 되돌아간다** —
`decodeSharedScenarioResult` 가 실패를 값으로 돌려주고 `shareLinkFailureAtom` → `ShareLinkFailureNotice` 가
"공유 링크가 손상되었거나…"를 띄우는 경로가, 랜딩에 머물면 **아무 말도 못 하고 사라진다**(무음 실패).
깨진 코드도 `/simulator` 로 보내야 배너가 뜬다. 근거 `pages/Main/hooks/persistence/shareLink.ts:435-479`.

⚠ **랜딩의 통합 검색(트랙 ⑧)은 `s`·`share` 를 쿼리 파라미터로 쓰면 안 된다** —
`?s=고배당` 으로 검색하는 순간 사용자가 시뮬레이터로 튕긴다. **`q` 를 쓰고 테스트로 못 박아라.**

**층 2 — middleware(크롤러 + 신규 링크용)**: `export const config = { matcher: ['/', '/simulator'] };`
그리고 하드코딩 og:url 2곳을 경로 상수로: `middleware.ts:77`, `server/handlers/ShareHtml/ShareHtml.ts:63`.

⚠ **Edge 번들러는 `@/` alias 를 못 푼다**(middleware.ts:2-6 실측 기록).
`SIMULATOR_PATH` 는 **의존성 0인 순수 리프**(`shared/constants/routes/index.ts`)에 두고
middleware 는 **상대경로**(`./shared/constants/routes`), 앱·핸들러는 `@/shared/constants/routes` 로 가져온다.
🔴 `shared/constants/` 를 스쳤으므로 **`npm run api:bundle` 후 `api/*.js` 동반 스테이징.**

**508 루프 검증**: 새 matcher 항목 `/simulator` 는 서버가 fetch 하는 어떤 경로도 아니다. `ShareHtml.redirectToRoot`
의 302 목적지 `/` 는 matcher 안이지만 `s`·`share` 가 없어 즉시 `next()` → 루프 없음. ✅

**왜 조합인가**: 층 1만 두면 신규 링크 OG 가 죽는다. 층 2만 두면 배포된 `/?share=` 를 클릭한 **사람**이
랜딩에 착지한다(middleware 는 메타만 갈아끼우고 HTML 은 SPA 셸 그대로다).

### 1-D 기각안

| 안 | 판정 | 근거 |
|---|---|---|
| `vercel.json` rewrite | 🔴 **물리적으로 불가능** | rewrites 는 **파일시스템 조회 다음**에 평가된다. `/?share=` 는 경로가 `/` 라 `dist/index.html` 이 먼저 히트해 rewrite 단계에 도달하지 못한다(쿼리스트링은 매칭에 무관). 레포에 이미 기록된 실측 — `middleware.ts:24-28`, `test/api/middlewareShareRouting.test.ts:9-11` |
| middleware 308 redirect | ❌ | ①크롤러 홉 증가(카카오 스크래퍼의 30x 추종 불안정) ②**이미 배포된 링크의 서버 응답 바이트가 바뀐다** — 잘 도는 경로를 건드리는 순수 손해 ③`s-maxage=86400` 엣지 캐시 통째 무효화 |
| 랜딩 내부 `useEffect` 분기 | ❌ | 랜딩이 **한 번 그려진 뒤** 튄다(히어로 번쩍임). lazy 청크면 다 받고 나서 이동 |
| `/` 유지 + `/simulator` 별칭만 | ❌ | 트랙 ⑦이 `/` 를 차지해야 하므로 미션이 성립하지 않는다 |

### 1-E 증명할 테스트

신규 `test/router/shareLinkRedirect.test.tsx`:
1. **왕복** — `encodeSharedScenario` → `/?share=<code>` 진입 → `/simulator` 로 이동 → 시나리오가 실제로 열린다.
   `createMemoryRouter(routes, { initialEntries: ['/?share=…'] })` + `router.state.location.pathname` 단정 + 검색어 무손실.
2. `?s=<key>` 도 같은 왕복.
3. 🔴 **깨진 코드도 넘어간다** — `/?share=zz` → `/simulator?share=zz` → 앱 생존 + 실패 배너.
4. `?utm=…` 등 무관한 쿼리는 랜딩에 남는다(과잉 발동 방지).
5. 🔴 랜딩 검색이 `s`/`share` 를 쓰지 않는다.

갱신: `test/api/middlewareShareRouting.test.ts:41-51` matcher 계약(`toBe('/')` → 배열),
`/simulator?share=` 메타 케이스 신규, og:url 하드코딩 검출.
무수정 통과해야 하는 것: `test/persistence/shareUrl.test.ts`·`shareLink.test.ts`·`test/main/shareLinkFailureNotice.test.tsx`
(셋 다 `history.replaceState` 로 href 를 세팅하고 `MainPage` 를 직접 렌더 → 경로 무관).

**뮤턴트 3종(필수)**: ①`resolveShareRedirectPath` 를 `s` 만 보게 축소 → `?share=` 케이스만 빨감
②`<Navigate>` 에서 search 탈락 → 왕복 케이스 빨감 ③matcher 를 `'/'` 로 되돌림 → 신규 링크 OG 케이스만 빨감.

## §2 북마크·외부 링크

**깨지는 것**: 공유 파라미터 없이 `/` 를 북마크한 재방문자가 도구 대신 소개 문서를 만난다.
IndexedDB 데이터는 그대로라 **유실은 없지만** "내 데이터가 사라졌다"로 읽히면 실질적으로 같은 사고다.

**대응**
1. 🔴 **랜딩 첫 화면(스크롤 없이)에 시뮬레이터 CTA 1클릭.**
   트랙 ⑦ 와이어프레임의 히어로에 검색 입력만 있고 CTA 가 없다 → **와이어프레임 수정 필요**.
2. 헤더 nav "시뮬레이터"가 전 폭에서 항상 보인다 → 2클릭 안전망.
3. 저장된 워크스페이스가 있는 재방문자에게 "이어서 계산하기" 노출 권고.
   ⚠ 랜딩에서 IndexedDB 를 읽으면 랜딩 청크가 영속 계층을 끌어온다 — **트랙 ⑦에서 비용을 재고 결정.**

## §3 SEO

🔴 **`/simulator` 의 canonical 은 JS 로만 생긴다.** `applySeoRuntimeMetadata`→`resolveCanonicalUrl` 이
`location.pathname` 을 쓰므로 구글에는 정상이지만, 정적 `index.html:36` 의 canonical 은 `%VITE_SITE_URL%/` 로
박혀 있어 **JS 미실행 크롤러(네이버 Yeti·Daumoa)는 `/simulator` 를 `/` 의 중복으로 본다.**
⚠ **새 결함이 아니라 기존 결함의 확산**이다 — `/dividend/*`·`/ticker/all` 이 전부 같은 상태다.
해결하려면 `/simulator` 전용 서버 셸이 필요한데 스코프 초과 → **알려진 부채로 기록, 별도 트랙.**

| 대상 | 처방 |
|---|---|
| `vite.config.ts:42-56` `ROUTES` | `/simulator` **0.9** 추가. `/` 는 1.0 유지. **이 배열이 사이트맵 유일 정본** |
| `index.html` 메타·JSON-LD·`.app-shell-fallback` | **트랙 ⑥ 단독으로 손대지 마라** — 랜딩 콘텐츠 없이 메타만 바꾸면 그 기간 `/` 가 자기 내용과 다른 걸 광고한다. 랜딩 PR 소관 |
| `public/llms.txt` `## URLs` | `- App: /` → `- Landing: /` + `- Simulator: /simulator`. 🔴 **그 위 본문(서버·계정 수정본)은 손대지 마라** |
| `public/llms-full.txt:111-116` | `/simulator` 추가 |
| `public/ai-overview.json:10-16` | `"landing": "/"`, `"simulator": "/simulator"` (+ §0 거짓 필드 2개 별도 신고) |
| `server/handlers/TickerHtml/TickerHtml.ts:213` | `<a href="/">` → `/simulator`. 🔴 **크롤러가 읽는 서버 HTML** — 놓치면 11개 티커 페이지 CTA 가 전부 랜딩행 |
| `pages/Ticker/TickerDetailPage/TickerDetailPage.view.tsx:148` | `<PrimaryCta to="/">` → `/simulator` (위와 한 쌍) |

**증명**: `test/api/sitemap.test.ts` 등재 계약, `test/api/tickerHtml.test.ts` CTA href 정확일치,
신규 `test/seo/machineReadableSurfaces.test.ts`(세 파일 모두 `/simulator` 언급 — 세 파일이 따로 논 것이 §0 사고 원인).

## §4 GA4

**코드는 안 깨진다.** `sendPageView` 가 `location.pathname` 을 그대로 쓴다. 48개 이벤트 전수 확인 —
"`/` = 시뮬레이터"를 전제하는 이벤트는 **없다**. 경로를 값으로 싣는 것은 `page_type` 하나뿐.

**콘솔이 깨진다**: `page_type='/'` 를 시뮬레이터로 간주하는 **GA4 퍼널·세그먼트·전환 정의가 이전일부터
조용히 둘로 갈린다.** 코드는 그린이고 대시보드만 틀어져 가장 늦게 발견된다.
→ ①GA4 **Annotation** 을 이전 배포일에 남긴다 ②`docs/analytics/ga4-plan.md` 에 신구 매핑 표
③기존 퍼널을 `page_type in ('/', '/simulator')` 로 확장.
❌ **코드로 "논리 페이지명"을 새로 도입하지 마라** — 48개 택소노미를 건드리는 위험 대비 이득이 없다.

## §5 투어 앵커 — 영향 없음

`TOUR_STEPS` 8단계 앵커가 전부 `MainPage` 서브트리 안이고, 이전은 그 서브트리를 **통째로** 옮긴다.
`test/main/tourAnchors.test.tsx:34-41` 은 라우터 없이 `<MainPage />` 를 직접 렌더 → **무수정 통과.**
⚠ 랜딩 PR 에서 시뮬레이터 셸을 함께 손대면 앵커가 소리 없이 증발할 수 있다
(앵커 삭제는 전 스위트 그린으로 통과한다) — **그 파일을 한 글자도 안 건드리는 것**이 이 미션의 대응이다.

## §6 V1 기능 — 무수정으로 따라간다

`usePortfolioPrefill`·`ScenarioPrefillNotice`·`QuickAdjustBar`·`scenarioPrefill.ts:21` 전부 **경로 의존 0**.
`PortfolioPrefillRequest.tsx:48` 은 `navigate(\`${location.pathname}${location.search}\`)` — **현재 경로 상대**(설계가 좋다).

🔴 **반대편(보내는 쪽)은 전부 하드코딩이라 고쳐야 한다** — §9 표 참조.
**랜딩에 복제 금지**: 이들은 `MainRightPanel` 안에서 `isPortfolioHydrated` 게이트에 묶여 있다.
복제하면 하이드레이션 순서 계약이 깨져 "버튼을 눌렀는데 아무 일도 안 일어난다"가 재현된다.

## §7 `router/routes.tsx` 보존 목록

🔴 되돌리지 마라: `*` = `NotFoundPage`(`<Navigate to="/">` 로 되돌리는 것은 한 줄이고 전 스위트가 그린으로 통과한다 —
방어선 `test/router/notFoundRoute.test.tsx`) · `/privacy`·`/terms` + `test/router/legalRoutes.test.tsx`
(특히 미확정 항목 **10/2** 고정 케이스 — 구글 OAuth 심사 접점) · `naverCallbackRoute`·`kakaoCallbackRoute`·
`communityRoutes` 의 조건부 스프레드 · **`/ledger` 게이트 라우트**(2026-08-01 랜딩).

추가할 것: `{ path: '/', element: <RootRoute /> }` · `{ path: '/simulator', element: <MainPage /> }`

## §8 헤더 — 항목이 늘지 않는다

6개 유지, `NavItem to="/" end` → `to="/simulator"` 뿐. 워드마크 `Brand to="/"` 는 **그대로 둔다** —
지금은 nav 첫 항목과 중복이지만 이전 후 "홈=랜딩"이 되어 **중복이 해소된다**(이 이전의 부수 이득).
**랜딩을 nav 항목으로 넣지 마라** — 워드마크가 그 역할이다. 그러므로 그룹화 대안은 불필요하고 65px 한 줄이 유지된다.

⚠ **`headerprobe` 는 반드시 손봐야 한다.** 기본 ROUTES(`tools/dev/headerprobe.mjs:67`)의 `/` 가 이전 후 랜딩을 잰다.
🔴 **함정**: 4번 검사(승격된 히어로 액션이 헤더 아래 8px)는 라우트로 게이트되지 않고 "화면에 승격 버튼이 있으면 잰다"
(L188-194, 246-247). 랜딩엔 승격 버튼이 없어 **그 검사가 조용히 0건이 되어 통과한다** — 게이트가 장식이 되는 전형이다.
→ ROUTES 에 `/simulator` 를 **추가**해 6라우트 × 5폭 = **30/30 이 새 기준선**.
같은 이유로 `tintscan.mjs:120,130` · `shotset.mjs:39` · `overflowprobe.mjs:122` 도 갱신 대상.
⚠ tintscan 의 `GOAL_REACHED_SHARE = '/?share=…'` 는 **그대로 두어도 된다** — 리다이렉트가 같은 화면을 그리므로
오히려 **리다이렉트의 실환경 스모크**가 된다(라벨만 고쳐라).

## §9 경로 참조 전수 체크리스트

| # | 위치 | 종류 |
|---|---|---|
| 1 | `router/routes.tsx:196-199` | 라우트 정의 |
| 2 | `components/PrimaryNav/PrimaryNav.tsx:41` (+L25,33 주석) | nav 링크 |
| 3 | `components/community/AuthControl/AuthControl.tsx:99` | 프로필 드롭다운 "시뮬레이터로" |
| 4 | `pages/Portfolio/PortfolioPage/PortfolioPage.tsx:372,384,390,403` | 프리필/목표 커밋 목적지 ×4 |
| 5 | `pages/Community/CommunityDetailPage/hooks/usePostDetail.ts:194` | 갤러리 첨부 `/?share=` |
| 6 | `pages/Ticker/TickerDetailPage/TickerDetailPage.view.tsx:148` | 티커 CTA |
| 7 | `server/handlers/TickerHtml/TickerHtml.ts:213` (+L208 주석) | **서버 렌더 CTA(크롤러용)** |
| 8 | `middleware.ts:45,77` | matcher · og:url |
| 9 | `server/handlers/ShareHtml/ShareHtml.ts:56,63` | 폴백 302 · og:url |
| 10 | `shared/hooks/usePageHue/usePageHue.utils.ts:21` | 🔴 `pathname === '/'` → `identity`. 이전 후 `/simulator` 가 폴백으로 떨어져 **시뮬레이터가 페이지 정체성 색을 잃는다.** 브리핑에 없던 항목이고 **모든 테스트가 그린인 채로 사라진다** |
| 11 | `vite.config.ts:43` | 사이트맵 ROUTES |
| 12 | `tools/dev/{headerprobe,overflowprobe,tintscan,shotset}.mjs` | 프로브 라우트 목록 |
| 13 | `public/llms.txt`·`llms-full.txt:112`·`ai-overview.json:11` | 기계 판독 표면 |
| 14 | `test/api/middlewareShareRouting.test.ts:41` | matcher 계약 |

## §10 실행 순서 — 각 단계가 끝난 시점에 배포 가능해야 한다

**P0 준비(무해)** ①`shared/constants/routes/index.ts` 신설(`SIMULATOR_PATH`, 의존성 0) ②`shareUrl.ts` 에
`resolveShareRedirectPath` + 단위 테스트 ③`api:bundle` 동반. → **동작 무변경.**

**P1 서버층 먼저** ④`middleware.ts` matcher 확장 + og:url 상수화, `ShareHtml.ts` 동일 ⑤계약 테스트 갱신.
→ 🔴 **핵심**: 이 시점에 `/simulator` 라우트는 아직 없지만 문제없다(그 경로는 404 로 가고 아무도 그 URL 을 안 만든다).
**서버가 클라이언트보다 먼저 준비되는 순서**가 안전 장치다 — 반대 순서면 이전 직후 생성된 링크들이 OG 없이 배포된다.

**P2 라우트 이전** ⑥`/simulator` 추가하되 **`/` 는 아직 `MainPage` 그대로** ⑦`usePageHue` 에 `/simulator` 한 줄
⑧§9 표의 #2~#7 목적지 일괄 갱신 + 왕복 테스트.
→ **모든 내부 링크가 `/simulator` 를 가리키고 `/` 는 여전히 살아 있다. 가장 안전한 중간 상태다.**
여기서 한 번 배포하고 GA4 로 `/simulator` 유입을 확인하는 것을 권한다.

**P3 `/` 를 넘긴다(랜딩 PR과 같은 커밋)** ⑨`RootRoute` + `LandingPage` ⑩`shareLinkRedirect.test.tsx` + 뮤턴트 3종
⑪SEO 일괄 ⑫프로브 갱신 → `headerprobe` **30/30**.
→ 🔴 **⑨~⑫는 반드시 한 PR**(SEO 마이그레이션을 2회로 쪼개지 않는다).

**P4 사후** ⑬GA4 annotation + 매핑 표 ⑭배포 후 `curl '<도메인>/?share=<코드>' | grep og:image` 와
`/simulator?share=` 가 **둘 다** `/api/og?share=…` 를 가리키는지.

⚠ **P3 에서 함께 결정**: 지금 `MainPage` 는 `routes.tsx` 가 **eager import** 한다.
랜딩이 `/` 가 되면 랜딩 방문자가 시뮬레이터 전체를 내려받는다. lazy 로 내리면 `AuthControl`·`HeaderOverflowMenu` 가
엔트리 그래프에서 빠지고 헤더가 lazy 경계 뒤로 간다 — **번들 토폴로지가 바뀌는 변경**이다.
이 미션은 **eager 유지**를 권하고, 최적화는 랜딩 PR 의 별도 항목으로 실측과 함께 판단하라.

## §11 롤백

| 증상 | 되돌릴 것 | 부작용 |
|---|---|---|
| 공유 링크가 안 열린다 | `/` element 를 `<MainPage />` 로(P3-⑨ 취소) | 랜딩만 사라진다. `/simulator`·내부 링크·테스트 전부 유효 → **가장 싼 롤백** |
| 신규 공유 OG 가 안 뜬다 | og:url 하드코딩 복구 여부 먼저 확인(축소는 최후수단 — 축소하면 `/simulator` 링크 OG 가 죽는다) | |
| Vercel 508 | `matcher` 를 `'/'` 로 즉시 축소 | matcher 확장이 유일 후보 |
| 랜딩 검색이 사용자를 튕긴다 | 검색 파라미터를 `q` 로(리다이렉트 로직은 건드리지 마라) | 없음 |
| SEO 급락 | 사이트맵이 아니라 **`index.html` 메타·셸을 되돌려라** | URL 은 남기고 콘텐츠만 되돌린다 — 사이트맵 롤백은 색인을 더 망친다 |

🔴 **절대 롤백 금지**: `decodeSharedScenarioResult` 값-기반 실패 처리 + `ShareLinkFailureNotice`(zz 수정) ·
`*` = 404 · `/privacy`·`/terms` + 10/2 고정 · `llms.txt`·`llms-full.txt` 의 서버·계정 서술 수정본 ·
`shared/lib/snowball/` · 영속 스키마 · **공유 URL 스키마**(파라미터 3종·주기 코드 0~4).

**커밋 규율**: P0/P1/P2 를 P3 와 **다른 커밋**으로. P3 하나만 revert 하면 앱이 P2 상태
(=`/` 와 `/simulator` 둘 다 시뮬레이터)로 안전하게 돌아간다.

## 구현자에게 남기는 3줄

1. **`?share=` 는 하나가 아니다** — `share`·`s`·`sv` 셋을 `shareUrl.ts` 상수로만 다뤄라.
2. **크롤러는 middleware 가 잡는다, 라우터가 아니다** — 클라이언트 리다이렉트는 기존 링크 OG 를 못 깬다.
   깨지는 건 **matcher 를 안 넓혔을 때의 신규 링크**다.
3. **소리 없이 죽는 셋을 세어라** — 투어 앵커 · headerprobe 4번 검사 · `usePageHue`.
   셋 다 전 스위트가 그린인 채로 사라진다.
