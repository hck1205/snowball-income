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

/**
 * 투자 성향 테스트(2026-08-17). 랜딩 4갈래 중 **중급자**가 도착하는 유일한 신규 화면이다.
 *
 * 결과는 하위 경로가 아니라 **같은 경로의 쿼리**(`?t=…&s=…`)로 표현한다 — 결과 화면이 별도 라우트면
 * 새로고침·공유·뒤로 가기마다 "답안이 없는 결과 주소"라는 상태가 생기고, 그때 무엇을 보여 줄지가
 * 매번 문제가 된다. 쿼리면 링크 자체가 결과를 싣고 있어 그 상태가 애초에 없다.
 * 🔴 파라미터 이름·형식은 `shared/lib/investorType/investorResultLink.ts` 가 소유한다(공유 링크 계약).
 */
export const INVESTOR_TYPE_PATH = '/investor-type';

/**
 * `/simulator?preset=<id>` — **다른 화면이 프리셋을 지목해 계산기를 여는 진입점.**
 *
 * 🔴 이 상수가 라우트 계약 옆에 사는 이유(2026-08-23): 이것을 읽는 곳이 **둘**이다 —
 * 영속 계층(`resolveScenarioPrefillPresetId`)과 우패널 훅(`usePresetQueryApply`).
 * 처음엔 훅 파일에 두고 영속 계층이 가져다 썼는데, 그러면 **저장 코드가 화면 코드에 딸려 온다**
 * (`pages/Main/utils/preset.ts` 가 같은 이유로 프리셋 배럴을 피하고 있다).
 * 주소 형식은 라우팅 계약이므로 여기가 제자리다.
 */
export const PRESET_QUERY_PARAM = 'preset';

/**
 * 긴 안내문(`/about`) — **2026-08-27 이전에는 이것이 `/` 였다.**
 *
 * 첫 화면이 목표 여섯 버튼으로 바뀌면서 개념·복리·지급 리듬·프리셋·시작 전 점검·FAQ 여섯 장이
 * 통째로 이 주소로 옮겨 왔다(사용자 결정). 화면 코드는 `pages/Landing/` 에 **그대로 있다** —
 * 옮긴 것은 주소뿐이라 폴더·부품·테스트 이름은 계속 "Landing" 이다.
 *
 * 🔴 이 주소는 **색인 대상**이다(사이트맵 등재 + 정적 셸). 그 여섯 장이 이 사이트의 설명형 콘텐츠
 *   전부이고, `FAQPage` JSON-LD 도 이 주소로 함께 옮겼다 — FAQ 가 **보이는** 유일한 화면이라서다
 *   (`shared/lib/seo/faqStructuredData.ts`).
 */
export const ABOUT_PATH = '/about';

/**
 * `/simulator?goal=<id>` — **랜딩의 목표 버튼이 계산기를 여는 진입점**(2026-08-27).
 *
 * `PRESET_QUERY_PARAM` 과 같은 이유로 여기 산다: 읽는 곳이 화면과 영속 계층 양쪽이라, 한쪽에 두면
 * 반대쪽이 그 계층을 통째로 끌어온다. 주소 형식은 라우팅 계약이다.
 * ⚠ 값은 `shared/constants/landingGoals` 의 목표 id 다(`asset-100m` · `dividend-100` …).
 */
export const GOAL_QUERY_PARAM = 'goal';

/**
 * 배당 연속 증배 목록의 식별자 — 라우트 마지막 세그먼트와 **같은 문자열**이다. 순서 = 화면 노출 순서.
 *
 * 🔴 목록 데이터(`shared/constants/dividendLists`)가 아니라 여기 사는 이유: 그 폴더는 200종 가까운
 * 종목 배열과 생성물 JSON 을 안고 있어서, 라우터·전역 nav·사이트맵처럼 **경로 문자열만 필요한 곳**이
 * 그 폴더를 import 하면 목록 전체가 엔트리 번들에 실린다(lazy 격리가 그 자리에서 무효가 된다).
 * `shared/constants/tickerPages` 가 같은 이유로 존재하는 경량 인덱스다.
 * 목록 폴더는 이 값을 **역으로 재export** 하므로 정본은 하나다.
 */
export const DIVIDEND_LIST_IDS = ['kings', 'aristocrats', 'champions', 'hiddenStars'] as const;

/**
 * 🔴 `hiddenStars` 만 성격이 다르다 — 앞의 셋은 **바깥 소스가 만든 명부**를 옮겨 온 것이고,
 *    이것은 그 셋 **어디에도 없는 종목을 우리가 규칙으로 걸러 낸** 목록이다(2026-08-08 신설).
 *    그래서 큐레이션 원본이 없고 생성물만 있다 — 목록 데이터 폴더가 그 차이를 흡수한다.
 * ⚠ 경로 세그먼트는 `hidden-stars` 다(카멜케이스 id 를 그대로 주소에 쓰지 않는다).
 *   `dividendListPath` 가 그 변환의 유일한 자리다.
 */
const DIVIDEND_LIST_SEGMENTS: Record<(typeof DIVIDEND_LIST_IDS)[number], string> = {
  kings: 'kings',
  aristocrats: 'aristocrats',
  champions: 'champions',
  hiddenStars: 'hidden-stars'
};

export type DividendListId = (typeof DIVIDEND_LIST_IDS)[number];

/** 목록 허브(`/dividend/lists`). `/dividend/calendar`·`/dividend/portfolio` 와 같은 depth 다. */
export const DIVIDEND_LIST_HUB_PATH = '/dividend/lists';

/** 목록 상세 경로. 문자열을 조립하는 곳(라우터·nav·사이트맵·크롤러 HTML)을 한 군데로 모은다. */
export const dividendListPath = (id: DividendListId): string => `/dividend/${DIVIDEND_LIST_SEGMENTS[id]}`;
