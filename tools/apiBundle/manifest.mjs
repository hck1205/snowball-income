/**
 * `server/handlers/*` → `api/*.js` 번들 매니페스트.
 *
 * `api/` 의 파일명이 **곧 공개 URL**이다(`api/og.js` → `/api/og`). 그래서 소스 폴더명(PascalCase,
 * `.cursor/rules`)과 배포 경로(kebab-case, Vercel 규약)가 다르고, 그 대응을 여기 한 곳에만 둔다.
 *
 * ⚠ 여기에 항목을 추가/삭제하면 `api/` 의 산출물도 함께 커밋해야 한다 — 빌드의 신선도 검사가
 *   **누락된 파일과 남아 있는 파일 양쪽을** 잡는다(tools/apiBundle/build.mjs).
 *
 * 🔴 **이 목록의 길이가 곧 서버리스 함수 개수이고, 상한이 12개다**(Vercel Hobby).
 * 2026-08-07 에 13개로 늘렸다가 배포가 죽었다 — 빌드는 통과하고 "Deploying outputs" 에서
 * `exceeded_serverless_functions_per_deployment` 로 실패한다(빌드 로그에는 이유가 안 남는다).
 * 새 핸들러를 더하기 전에 **먼저 세라.** 2026-08-15 에 외부 조회 셋을 `Proxy` 로 합쳐 **10개**가 됐다(여유 2).
 * 지면이 하나 더 필요하면 새 파일을 만들지 말고 `SeoHtml`(정적 콘텐츠 렌더러 묶음)에 얹어라.
 * JSON 응답이 하나 더 필요하면 `Fx`·`MarketIndices`·`Unfurl` 을 프록시 묶음으로 합치는 것이
 * 다음 수순이다(같은 패턴 — 근거는 SeoHtml.ts 머리말).
 */
export const API_BUNDLES = [
  { entry: 'server/handlers/AccountDelete/AccountDelete.ts', out: 'api/account-delete.js' },
  /* 외부 조회 셋(fx · market-indices · unfurl)을 **한 함수로** 모은 진입점 — 근거는 Proxy.ts 머리말.
     공개 URL 은 vercel.json rewrite 가 그대로 유지한다. */
  { entry: 'server/handlers/Proxy/Proxy.ts', out: 'api/proxy.js' },
  { entry: 'server/handlers/KakaoAuth/KakaoAuth.ts', out: 'api/kakao-auth.js' },
  { entry: 'server/handlers/NaverAuth/NaverAuth.ts', out: 'api/naver-auth.js' },
  { entry: 'server/handlers/Og/Og.tsx', out: 'api/og.js' },
  { entry: 'server/handlers/PostHtml/PostHtml.ts', out: 'api/post-html.js' },
  { entry: 'server/handlers/PostList/PostList.ts', out: 'api/post-list.js' },
  /* 티커 상세 · 배당 목록 · 가이드 **셋을 한 함수로** 모은 진입점 — 근거는 SeoHtml.ts 머리말. */
  { entry: 'server/handlers/SeoHtml/SeoHtml.ts', out: 'api/seo-html.js' },
  { entry: 'server/handlers/ShareHtml/ShareHtml.ts', out: 'api/share-html.js' },
  { entry: 'server/handlers/Sitemap/Sitemap.ts', out: 'api/sitemap.js' },
  /* 링크 미리보기 — 남의 페이지에서 제목·요약·썸네일만 뽑는다. SSRF 가드가 그 파일의 본체다. */
];

/**
 * 번들에서 **제외**하는 패키지 — `api/*.js` 에 bare import 로 남고, Vercel 의 Node 빌더가
 * import 를 추적해 `node_modules` 를 함수에 함께 싣는다.
 *
 * `@vercel/og` 는 **반드시** external 이어야 한다: satori 가 `Geist-Regular.ttf` 를 산출물 옆의
 * 실제 파일로 읽으므로 번들에 넣으면 런타임에 ENOENT 로 죽는다(실측).
 * `@supabase/supabase-js` 는 번들해도 동작하지만, 무겁고 자체 조건부 require 가 있어 external 로 둔다.
 *
 * `jsdom`(api/post-html.js 의 서버 본문 정화 전용)도 external 이다: 무겁고 동적 require(내부 리소스
 * 로딩)가 있어 번들 인라인이 취약하다. bare import 로 남기면 Vercel Node 빌더가 node_modules 를 함수에
 * 싣는다 — 그러려면 jsdom 이 **dependencies**(프로덕션 설치 포함)여야 한다(런타임 필요, package.json 참고).
 */
export const API_EXTERNALS = ['@vercel/og', '@supabase/supabase-js', '@vercel/functions', 'jsdom'];
