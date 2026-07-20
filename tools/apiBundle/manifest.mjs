/**
 * `server/handlers/*` → `api/*.js` 번들 매니페스트.
 *
 * `api/` 의 파일명이 **곧 공개 URL**이다(`api/og.js` → `/api/og`). 그래서 소스 폴더명(PascalCase,
 * `.cursor/rules`)과 배포 경로(kebab-case, Vercel 규약)가 다르고, 그 대응을 여기 한 곳에만 둔다.
 *
 * ⚠ 여기에 항목을 추가/삭제하면 `api/` 의 산출물도 함께 커밋해야 한다 — 빌드의 신선도 검사가
 *   **누락된 파일과 남아 있는 파일 양쪽을** 잡는다(tools/apiBundle/build.mjs).
 */
export const API_BUNDLES = [
  { entry: 'server/handlers/AccountDelete/AccountDelete.ts', out: 'api/account-delete.js' },
  { entry: 'server/handlers/NaverAuth/NaverAuth.ts', out: 'api/naver-auth.js' },
  { entry: 'server/handlers/Og/Og.tsx', out: 'api/og.js' },
  { entry: 'server/handlers/PostHtml/PostHtml.ts', out: 'api/post-html.js' },
  { entry: 'server/handlers/ShareHtml/ShareHtml.ts', out: 'api/share-html.js' },
  { entry: 'server/handlers/Sitemap/Sitemap.ts', out: 'api/sitemap.js' }
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
