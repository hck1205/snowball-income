/**
 * 라우트 경로 상수 — **의존성 0인 순수 리프**.
 *
 * 🔴 이 파일은 아무것도 import 하지 않는다(앞으로도). 이유: `middleware.ts`(Edge 런타임)가
 * 여기를 **상대경로**(`./shared/constants/routes`)로 직접 가져가기 때문이다. Edge 번들러는
 * tsconfig `paths`(`@/`)를 해석하지 못하고, 못 푼 alias 를 "지원되지 않는 외부 모듈"로 취급해
 * 배포가 깨진다(middleware.ts 상단 주석의 실측 기록). 여기서 무엇 하나라도 import 하면
 * 그 캐스케이드가 통째로 Edge 번들에 딸려온다.
 *   - middleware(Edge): `import { SIMULATOR_PATH } from './shared/constants/routes';`
 *   - 앱·`server/handlers/*`(Node): `import { SIMULATOR_PATH } from '@/shared/constants/routes';`
 *
 * ⚠ `shared/constants/index.ts` 배럴에는 **일부러 넣지 않는다** — 배럴을 통해 들어오면 위 격리가
 * 무의미해진다(`community`·`tickers` 도 같은 이유로 배럴 밖이다).
 *
 * ⚠ 이 파일을 스치면 `npm run api:bundle` 로 `api/*.js` 를 재생성해야 한다(비minify 번들이라
 * 주석만 고쳐도 stale 이 된다).
 */

/**
 * 시뮬레이터 화면의 경로.
 *
 * 2026-08-01 이전 전에는 `/` 하나였다. **지금 `/` 는 랜딩이고 시뮬레이터는 `/simulator` 뿐이다**
 * (`router/routes.tsx`). 앱 링크·og:url·서버 렌더 HTML 의 CTA 는 전부 이 상수를 가리킨다 —
 * 경로 리터럴 `'/'` 로 되돌아가면 방문자가 시뮬레이터 대신 랜딩에 떨어진다
 * (`test/seo/machineReadableSurfaces.test.ts` 가 그 회귀를 잡는다).
 *
 * ⚠ 이미 배포된 옛 공유 링크(`/?share=`·`/?s=`·`/?sv=`)는 **구제하지 않는다** — 2026-08-01 사용자
 * 결정으로 `/` 의 리다이렉트 분기를 걷어냈다(실사용자 없음 확인). 그 주소는 랜딩에 착지한다.
 * 사유·되살리는 법은 `router/routes.tsx` 의 `'/'` 라우트 주석.
 */
export const SIMULATOR_PATH = '/simulator';
