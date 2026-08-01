/**
 * 면(surface)의 기하 규칙 — 동심 라운드와 히트 영역.
 *
 * `heroTitleRow.ts` 와 같은 자리다: **하나의 파일이 하나의 가로지르는 기하 규칙을 소유**하고,
 * 그 유도 과정을 JSDoc 에 남긴다. 값을 여기저기 손으로 적으면 반드시 어긋난다 — 실제로 어긋났다.
 */

import { color, elevation } from './semantic';
import { TOUCH_TARGET } from './tokens';

/* -------------------------------------------------------------------------- */
/* 동심 라운드                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * 패딩이 이보다 크면 두 면은 "붙어 있는 겹"이 아니라 **별개의 표면**이다.
 * 그 구간에서는 동심을 강제하지 않는다(각자 라운드를 골라도 어색하지 않다).
 */
export const SEPARATE_SURFACE_PADDING = '24px';

/**
 * 안쪽 라운드를 바깥 라운드·패딩에서 파생한다. 음수는 0 으로 눌린다.
 *
 * 왜 상수표가 아니라 `calc()` 인가 — 이 앱의 카드 패딩은 **`clamp()` 다섯 종류**다
 * (Card 16~20 · GoalCard 16~28 · PageHero 20~32 · EmptyState 20~28 · TickerHub 24~40).
 * 고정 라운드 값은 그중 **한 뷰포트 폭에서만** 동심이 된다.
 */
export const innerRadius = (outer: string, pad: string): string => `max(0px, calc(${outer} - ${pad}))`;

/** 바깥 라운드를 안쪽 라운드·패딩에서 파생한다. */
export const outerRadius = (inner: string, pad: string): string => `calc(${inner} + ${pad})`;

/**
 * 표면 한 겹을 선언한다. 패딩과 라운드를 **한 자리에서 함께** 정하고, 안쪽에 앉을 자식이 쓸
 * 라운드를 `--sb-inner-radius` 로 발행한다.
 *
 * CSS 변수는 상속되므로 자식은 그 변수만 읽으면 된다 — `StatTile` 이 `Card` 안에 있든 `Modal`
 * 안에 있든 `SideDrawer` 안에 있든 **쌍마다 표를 만들 필요가 없다.** 중첩도 스스로 교정된다:
 * `surface()` 를 부르는 컴포넌트가 변수를 다시 발행하므로 **가장 가까운 면**이 항상 이긴다.
 *
 * 이 방식이 이 레포에 맞는 이유는 하나 더 있다 — 여기는 Emotion `ThemeProvider` 를 쓰지 않고
 * CSS 변수로 테마를 돌린다(`tokens.ts` 참고). 같은 기계를 그대로 쓰는 것이다.
 */
export const surface = (outer: string, pad: string): string => `
  padding: ${pad};
  border-radius: ${outer};
  --sb-inner-radius: ${innerRadius(outer, pad)};
`;

/**
 * 표면 안쪽 자식의 라운드.
 *
 * `fallback` 은 **표면 밖에서 단독으로 렌더될 때**의 값이다 — 이 레포의 공용 컴포넌트 테스트는
 * Provider·부모 없이 단독 렌더되므로(그래서 CSS 변수를 쓴다) 폴백이 없으면 라운드가 사라진다.
 */
export const nestedRadius = (fallback: string): string => `var(--sb-inner-radius, ${fallback})`;

/* -------------------------------------------------------------------------- */
/* 위계 (엘리베이션)                                                            */
/* -------------------------------------------------------------------------- */

/**
 * 면의 격. **화면 하나에 `raised` 는 하나뿐이다** — 둘이 되는 순간 어느 쪽도 주역이 아니다.
 *
 * - `raised` 주역 — 그 화면을 켠 이유(결과 요약·지금 받는 배당).
 * - `base`   본문 — 차트·표·구성처럼 주역을 뒷받침하는 면.
 * - `sunken` 부속 — "다른 가정"을 말하는 곁가지(전량 매도 시 세금).
 */
export type SurfaceTier = 'raised' | 'base' | 'sunken';

/**
 * 한 면의 **위계 선언 3종 세트**(배경·테두리·그림자)를 한 번에 낸다.
 *
 * 🔴 규칙은 하나다 — **테두리와 그림자를 동시에 선언하지 않는다.** 예전에는 모든 카드가
 * `border: 1px` **와** `shadow.e1` 을 함께 갖고 있었는데, `e1`(오프셋 1px·불투명도 .05)은
 * 흰 배경 위에서 사실상 보이지 않아 **실제로 위계를 만드는 건 테두리뿐**이었다. 테두리는
 * 모든 카드가 똑같이 가지므로 결과 요약 카드와 곁가지 카드가 같은 무게로 보였다("유령 카드").
 *
 * 그래서 층마다 **딱 한 가지 수단**만 쓴다: 주역은 그림자, 본문은 테두리, 부속은 면색.
 *
 * ⚠ **다크에서는 그림자가 물리적으로 보이지 않는다.** 위계는 `surfaceRaised`(= surface 보다
 * 밝은 면)가 만든다 — 라이트에서 `surfaceRaised` 는 `surface` 와 같은 값이라(전 프리셋)
 * 라이트/다크에 분기가 필요 없다. 같은 선언이 모드에 따라 다른 수단으로 읽힌다.
 *
 * 주역의 그림자가 `e1` 이 아니라 `e2` 인 것도 같은 이유다 — `e1` 은 눈에 안 띈다.
 */
export const cardElevation = (tier: SurfaceTier): string =>
  ({
    raised: `
  background: ${color.surfaceRaised};
  border: none;
  box-shadow: ${elevation[2]};
`,
    base: `
  background: ${color.surface};
  border: 1px solid ${color.border};
  box-shadow: none;
`,
    sunken: `
  background: ${color.surfaceSunken};
  border: none;
  box-shadow: none;
`
  })[tier];

/* -------------------------------------------------------------------------- */
/* 히트 영역                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * 시각 크기는 그대로 두고 **누를 수 있는 영역만** 넓힌다.
 *
 * 밀집한 금융 대시보드라 모든 버튼을 실제로 44px 로 키우면 화면이 터진다. 그래서 의사요소로
 * 넓힌다 — 이 기법 자체는 이 레포가 이미 쓰고 있었다. 문제는 **20곳에 손으로 적혀 있었다는 것**이고,
 * 그중 `Chip` 은 `top/left/transform` 을 빠뜨려 히트 영역이 중앙이 아니라 **오른쪽·아래로** 44px
 * 뻗어 있었다(2026-07-30 발견). 옆 칩과 아랫줄 칩을 잡아먹는 실제 버그였다.
 *
 * 그래서 정렬을 헬퍼가 **구조적으로** 보장한다. 다시 틀릴 수 없다.
 */
export const hitArea = (min: string = TOUCH_TARGET): string => `
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: max(100%, ${min});
    height: max(100%, ${min});
    transform: translate(-50%, -50%);
  }
`;

/**
 * 이웃과 **겹치지 않는** 히트 영역. `gap` 은 형제 사이 간격이다.
 *
 * ⚠ 두 인터랙티브 요소의 히트 영역은 절대 겹치면 안 된다 — 겹치면 "눌렀는데 다른 게 열린다".
 * 44px 를 무조건 밀어붙이면 좁은 간격에서 반드시 겹친다(실측: 헤더 버튼들이 4~12px 겹쳐 있었고,
 * `InputField` 의 도움말 halo 는 **아래 입력칸 상단 3.5px 을 덮고 있었다** — 입력칸 위쪽을 누르면
 * 도움말이 열렸다).
 *
 * 그래서 여기서는 44px 를 **상한이 아니라 희망값**으로 다룬다: 이웃에 닿지 않는 선까지만 넓힌다.
 */
export const hitAreaWithin = (gap: string, min: string = TOUCH_TARGET): string => `
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: min(${min}, calc(100% + ${gap}));
    height: min(${min}, calc(100% + ${gap}));
    transform: translate(-50%, -50%);
  }
`;
