/**
 * 면(surface)의 기하 규칙 — 동심 라운드와 히트 영역.
 *
 * `heroTitleRow.ts` 와 같은 자리다: **하나의 파일이 하나의 가로지르는 기하 규칙을 소유**하고,
 * 그 유도 과정을 JSDoc 에 남긴다. 값을 여기저기 손으로 적으면 반드시 어긋난다 — 실제로 어긋났다.
 *
 * ── 🔴 2026-08-03: 흰 캔버스 전환 — **격을 말하는 채널이 바뀌었다** ──────────────────
 *
 * 사용자 지시로 라이트 `bg` 가 전 프리셋 **순백**이 됐다. 그 결과:
 * ```
 *   bg = surface = surface-raised = #ffffff      ← 면색이 더 이상 카드를 세우지 못한다
 *   surface-muted  1.03~1.07:1 on white          ← 카드 '안'의 타일. 속삭임
 *   surface-sunken 1.11~1.25:1 on white          ← 들어간 자리(표 머리·코드·빈 상태). 유일한 진짜 계단
 *   border         1.44~1.49:1 on white          ← 🔴 새 주역 (구 1.19~1.39 = 장식)
 * ```
 * **종전**: 흰 카드 vs 회색 배경 = 면색이 격을 말함.
 * **이후**: 헤어라인 경계 + 여백 + (주역에만) 그림자가 격을 말함.
 *
 * 그래서 아래 `cardElevation` 의 층별 수단이 이전보다 **더** 중요해졌다:
 *  - `base`   1px `border` — 흰 캔버스 위에서 카드를 세우는 기본값. 이제 실제로 보인다.
 *  - `raised` `border: none` + `elevation[2]` — 그래서 라이트 `shadow-2` 를 전 프리셋 올렸다
 *             (구 값은 흰 면 위에서 사실상 안 보여, 주역 카드가 통째로 사라졌다).
 *  - `sunken` `surface-sunken` 면색 — 흰 캔버스 위에서 오히려 더 또렷해졌다.
 *
 * 🔴 **흰 캔버스에서 하지 말 것**
 *  - 카드 대신 면색으로 격을 만들려고 `surface-muted` 를 카드 배경에 깔지 마라. 1.05:1 이라
 *    보이지 않고, 그 토큰은 **더 어둡게 내릴 수 없다**(공통 `data-positive` 가 ink 라이트에서
 *    4.50:1 knife-edge — presets/sharedTokens.ts).
 *  - 카드가 안 보인다고 그림자를 덧붙이지 마라. 층마다 수단은 하나다 — 안 보이면 `base` 인지
 *    `raised` 인지를 다시 정하는 게 맞다.
 *  - 🔴 **틴트 면 예산(화면당 2)이 하나 풀렸다** — 히어로가 더 이상 채도 면이 아니기 때문이다
 *    (구 내역은 대개 ①히어로 ②푸터로 2/2 였다). 그 여유는 **자동으로 쓰라는 뜻이 아니다.**
 *    흰 캔버스의 이득은 절제에서 나온다. 쓸 거라면 화면당 **딱 한 장** — 그 화면을 켠 이유
 *    (결과 요약·마무리 CTA)에만 쓰고, 히어로에는 돌려놓지 마라. 상한은 그대로 2 다.
 */

import { color, elevation } from './semantic';
import { DATA_SURFACE, PICK, TOUCH_TARGET, radius } from './tokens';

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

/* -------------------------------------------------------------------------- */
/* 면의 종류 (SurfaceKind) — 격(tier)과 직교하는 두 번째 축                       */
/* -------------------------------------------------------------------------- */

/**
 * **면의 종류.** 판정 기준은 한 줄이다 — *"여기서 무언가를 고르면 화면이 바뀌는가."*
 *
 * | | `brand` (고르는 면) | `data` (읽는 면) |
 * |---|---|---|
 * | 어디 | 프리셋 카드·티커 허브 카드·비교 후보 칩·대가 카드·갤러리 카드·404 목적지 카드·랜딩 히어로·푸터·마무리 CTA·공유 카드 | 결과 요약·차트 카드·표·StatTile·캘린더 격자·PDF 본문 |
 * | 허용 | 색면(L1·L2·화면당 1개의 L3)·`brandPanel()`·마스코트 | **L1(선·점·귀)만** — 채도면 금지 |
 * | 반경 | `PICK_RADIUS` (30~34px) | `DATA_RADIUS` (24~28px) |
 *
 * 🔴 이 축은 **타입**이지 주석이 아니다. `data` 면에 채도면을 얹고 싶어지는 순간이 이 설계의 최대
 * 오염 지점이고(특히 손익색을 카드에 칠하고 싶어질 때), 숫자의 신뢰감은 거기서 무너진다.
 */
export type SurfaceKind = 'brand' | 'data';

/* -------------------------------------------------------------------------- */
/* 두 면의 반경 — 차이가 눈에 보이는 신호가 되도록                                */
/* -------------------------------------------------------------------------- */

/**
 * **brand 면의 바깥 반경** = 안쪽 컨트롤(`radius.lg` 16px) + `PICK.pad`.
 *
 * 검산: 390px **30px**(16+14) · 800px **30px**(16+14) · 1280px **34px**(16+18).
 * 같은 폭에서 `DATA_RADIUS`(24 · 24 · 28)와의 차이는 **전 구간 약 6px 로 일정**하다 — 즉 반경만으로는 두 면이
 * 구분되지 않는다. 실제 신호는 **컬러 캡의 3변 bleed** 와 **hover 부상**이고, 반경은 그 둘을
 * 거들 뿐이다. 이 사실을 알고도 반경을 나눠 두는 이유는 캡이 없는 pick 카드(글리프만 있는 카드)가
 * 여전히 "고르는 면"으로 읽혀야 하기 때문이다.
 *
 * 상수 30px 이 아니라 `calc()` 인 이유는 위 `innerRadius` 주석과 같다 — 패딩이 `clamp()` 라
 * 고정값은 한 뷰포트 폭에서만 동심이다.
 */
export const PICK_RADIUS = outerRadius(radius.lg, PICK.pad);

/**
 * **data 면의 바깥 반경** = 안쪽 컨트롤(`radius.sm` 8px) + `DATA_SURFACE.pad`. 24~28px.
 *
 * 공용 `Card` 가 자기 파일에서 같은 식을 계산하고 있다(`Card.styled.ts` 의 `CARD_RADIUS`).
 * 값이 갈리지 않는지는 `shared/styles/geometry.test.ts` 가 소스로 대조한다 — 이 상수는
 * **새 data 면**(공용 Card 를 쓰지 않는 표면)이 같은 대역에 앉게 하려고 있다.
 */
export const DATA_RADIUS = outerRadius(radius.sm, DATA_SURFACE.pad);

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
 * - `pick`   고르는 카드 — 평상시에는 `base` 와 같은 수단(테두리)이고, **hover/focus 에서만**
 *            테두리를 지우고 그림자로 갈아탄다. 즉 "누를 수 있음"을 정적 무게가 아니라
 *            **상태 변화**로 말한다. 화면당 개수 제한이 없는 이유가 이것이다(주역과 경쟁하지 않는다).
 */
export type SurfaceTier = 'raised' | 'base' | 'sunken' | 'pick';

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
`,
    /*
     * 🔴 `border: none` + `e1` 이 아니다. `e1`(오프셋 1px·불투명도 .05)은 흰 배경에서 사실상
     * 보이지 않는다 — 그게 이 파일이 "유령 카드"로 진단하고 주역을 `e2` 로 올린 바로 그 값이다.
     * 테두리 없는 e1 카드는 `base` 보다 **약해진다**(고르는 카드가 본문 카드보다 뒤로 물러난다).
     *
     * 부상은 소비처(`PickCard.styled.ts`)가 hover/focus-visible 에서 선언한다:
     *   border-color: transparent · box-shadow: elevation[2] · transform: translateY(-2px)
     * → "테두리와 그림자를 동시에 쓰지 않는다"를 **한 시점 기준**으로 지킨다(테두리는 남아 있지만
     *   투명하다 — 레이아웃이 1px 튀지 않게 하는 유일한 방법이다).
     */
    pick: `
  background: ${color.surface};
  border: 1px solid ${color.border};
  box-shadow: none;
`
  })[tier];

/**
 * **부상(hover/focus-visible) 선언** — `pick` 면이 눌릴 수 있음을 상태로 말하는 부분.
 *
 * 소비처가 손으로 적지 않게 여기에 둔다. `border-color: transparent` 인 이유는 위 `pick` 주석과
 * 같다 — `border: none` 으로 지우면 1px 만큼 레이아웃이 튄다.
 *
 * ⚠ `transform` 을 쓰므로 이 선언을 받는 요소는 **스태킹 컨텍스트를 만든다**(`tokens.ts` zIndex 주석).
 *   카드 안에 팝오버·드롭다운을 띄우지 마라 — 카드 밖으로 못 나간다.
 */
export const pickLift = `
  border-color: transparent;
  box-shadow: ${elevation[2]};
  transform: translateY(-2px);
`;

/* -------------------------------------------------------------------------- */
/* 컬러 캡 — brand 면의 머리에 앉는 색 띠                                        */
/* -------------------------------------------------------------------------- */

/**
 * 카드 머리의 **3변 bleed**. 패딩을 음수 마진으로 되돌려 좌·우·상 세 변에 딱 붙이고,
 * 위쪽 두 모서리만 부모 반경을 따라간다.
 *
 * `- 1px` 인 이유: 부모가 1px 테두리를 가지므로(`cardElevation('pick')`) 안쪽 면의 반경은
 * 테두리 두께만큼 작아야 한다. 같은 값을 쓰면 모서리에서 색이 테두리 바깥으로 비어져 나온다
 * (실측 가능한 계단이 생긴다 — `border-box` 안쪽 곡률이 바깥보다 작기 때문).
 *
 * 🔴 캡의 **높이**는 여기서 정하지 않는다. 6px 레일이냐 48~88px 틴트 면이냐가 `tintscan` 의
 * 면 판정(높이 ≥8px)을 가르는 지점이라, 소비처가 `PICK.railHeight` / `PICK.capHeight` 중
 * 무엇을 골랐는지 코드에 드러나야 한다.
 *
 * @param outerR 부모(카드)의 바깥 반경. 보통 `PICK_RADIUS`.
 * @param pad    부모의 패딩. 보통 `PICK.pad`.
 */
export const colorCap = (outerR: string, pad: string): string => `
  margin: calc(-1 * ${pad}) calc(-1 * ${pad}) ${pad};
  border-radius: calc(${outerR} - 1px) calc(${outerR} - 1px) 0 0;
`;

/* -------------------------------------------------------------------------- */
/* 상단 리본 — 둥근 카드의 머리에 앉는 3~6px 띠                                    */
/* -------------------------------------------------------------------------- */

/**
 * **둥근 카드 위의 상단 리본 한 벌.** 소비처는 이 문자열을 `::before` 에 넣고 `background` 만 정한다.
 *
 * 🔴 이 헬퍼가 존재하는 이유는 **리본이 둥근 모서리 밖으로 튀어나오는 결함**이다. 리본은 직사각형이고
 * 카드는 라운드라, 모서리에서 카드 면은 안으로 휘는데 리본은 직진한다. 고치는 법이 셋 있고
 * (①부모 `overflow: hidden` ②리본에 같은 반경 ③inset 보정) 이 레포는 **①로 통일돼 있다** —
 * 근거는 두 가지다:
 *  - ②는 4~6px 짜리 띠에서 **작동하지 않는다.** CSS 는 반경 합이 박스 치수를 넘으면 전 모서리를
 *    같은 비율로 축소하므로(CSS Backgrounds L3 §5.5), 20px 반경을 4px 높이 띠에 주면 4px 로
 *    줄어든다 — 카드의 곡률과 어긋나 모서리에 **틈**이 생긴다(고치려던 것보다 나쁘다).
 *  - ③은 뷰포트마다 다른 `clamp()` 패딩·반경 아래에서 한 폭에서만 맞는다.
 * 그래서 **부모가 자른다.** 리본 자신은 반경을 갖지 않는다.
 *
 * 반드시 **부모(카드)에** 함께 선언한다 — 이 헬퍼는 의사요소 쪽만 낸다:
 * ```
 *   position: relative;
 *   overflow: hidden;   // 없으면 리본이 모서리 밖으로 나간다
 * ```
 *
 * ⚠ 높이는 소비처가 정한다. `PICK.railHeight`(6px)를 넘기면 `tintscan` 이 선이 아니라 **면**으로
 *   세기 시작해 그 라우트의 틴트 면 예산을 먹는다(면 하한 8px).
 * ⚠ `overflow: hidden` 은 `position: fixed` 자손을 자르지 않는다(스티키 히어로 액션이 그 경우다 —
 *   2026-07-31 실측 확인). 스크롤 승격 버튼이 사라질 걱정은 하지 않아도 된다.
 */
export const topRail = (height: string): string => `
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: ${height};
  /* ⚠ 반경을 주지 마라 — 위 주석 ②. 자르는 것은 부모의 overflow 다. */
  border-radius: 0;
`;

/* -------------------------------------------------------------------------- */
/* 브랜드 패널 — 금색이 사는 유일한 자리                                          */
/* -------------------------------------------------------------------------- */

/**
 * **네이비 패널 한 겹.** 브랜드가 직접 말하는 반전 면(마무리 CTA·푸터·공유 카드).
 *
 * 🔴 **금색(`color.onPanelGold`)이 합법인 유일한 조합이다.** 밝은 면 위 금색은 **1.83:1** 로
 * 죽는다 — 그래서 범용 `gold` 토큰은 일부러 존재하지 않고, 금색은 `on-panel-gold` 라는
 * 이름으로만 있다. **이 믹스인이 깐 면 밖으로 금색을 꺼내지 마라.** `contrast.test.ts` 가 잡는다.
 *
 * 실측(라이트/다크 동일 — 반전 면이라 모드 불변):
 * ```
 *   on-panel        흰 글자   / panel   16.24:1  ✅ 제목·큰 숫자
 *   on-panel-gold   금색      / panel    8.86:1  ✅ 액센트 텍스트·1px 선
 *   on-panel-muted  연보라    / panel    8.20:1  ✅ 라벨·캡션
 * ```
 *
 * 경계선을 다크에서만 그리는 이유: `panel` 과 라이트 `bg` 는 8프리셋 최저 12.4:1 이라 경계가
 * 필요 없지만, 다크 `bg`(#121212) 와는 **1.18:1** 이라 패널이 배경에 잠긴다. 금색 28% 헤어라인이
 * 그 경계를 만든다(금색/다크 bg = 10.24:1).
 *
 * ⚠ 이 믹스인은 **면색과 글자색만** 낸다. 반경·패딩은 소비처가 자기 기하로 정한다 —
 * 푸터(전폭·직각)와 마무리 CTA(카드·큰 라운드)의 기하가 다르기 때문이다.
 * ⚠ `SurfaceKind: 'brand'` 면에서만 부른다. data 면에 이 면을 깔면 어두운 면 위 숫자가 되어
 * 앱의 나머지 표와 위계가 어긋난다.
 */
export const brandPanel = (): string => `
  background: ${color.panel};
  color: ${color.onPanel};
  border: none;

  @media (prefers-color-scheme: dark) {
    border: 1px solid color-mix(in srgb, ${color.onPanelGold} 28%, transparent);
  }

  :root[data-theme='light'] & {
    border: none;
  }

  :root[data-theme='dark'] & {
    border: 1px solid color-mix(in srgb, ${color.onPanelGold} 28%, transparent);
  }
`;

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
