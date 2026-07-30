import { color, motion, outerRadius, radius, shadow, space } from '@/shared/styles';

/**
 * 피드 아이템(글 **카드** · 글 **행**)의 면 기하 — 한 벌의 값을 두 밀도가 공유한다.
 *
 * ## 왜 이 파일이 있나
 *
 * 갤러리는 같은 데이터를 **격자(PostCard)** 와 **리스트(PostRow)** 두 밀도로 보여주고, 사용자가
 * 우상단 토글로 그 둘을 왕복한다. 그런데 "면의 재질"(바깥 반경·평상시 그림자·숫자 존의 캡슐)이
 * 두 파일에 각자 적혀 있으면 한쪽만 고쳐져 토글할 때마다 다른 앱처럼 보인다 — 실제로 전에
 * `PostCard` 4px / `PostRow` 4px 가 손으로 두 번 적혀 있었다.
 *
 * **밀도는 나누고 재질은 공유한다**: 패딩 안쪽의 배치·글자 크기(행이 더 촘촘하다)와 각 밀도에만
 * 있는 요소(카드의 프리뷰 블록 · 행의 요약 측정 폭)는 각자 갖고, 여기 있는 것만 공유한다.
 *
 * ⚠ `shared/styles` 가 아니라 커뮤니티 폴더에 둔 이유: `shared/styles` 는 `api/og.js`·
 * `api/share-html.js` 번들에 상수·주석까지 인라인돼서, 스치기만 해도 그 산출물이 stale 이 된다
 * (pitfalls 2026-07-28). 이 값은 서버가 그리는 OG 카드와 아무 상관이 없다.
 */

/* -------------------------------------------------------------------------- */
/* 면의 기하                                                                    */
/* -------------------------------------------------------------------------- */

/** 카드·행의 패딩. 동심 역산(`바깥 = 안쪽 + 패딩`)의 '패딩'이다 — 카드와 행이 같은 값을 쓴다. */
export const FEED_PADDING = space[4];

/**
 * 카드·행 **안쪽에 앉는 면**의 반경 — 카드의 인셋 프리뷰 타일, 행의 숫자 칩이 같은 값을 쓴다.
 * 동심 역산의 '안쪽'이다.
 */
export const FEED_INNER_RADIUS = radius.sm;

/**
 * 카드·행 바깥 반경 = **안쪽(8px) + 패딩(16px) = 24px**(DESIGN.md §6 동심 라운드).
 *
 * 24px 은 반경 스케일에 없는 값이라 **상수로 박지 않고** 파생식으로 둔다 — 스케일 밖의 값을
 * 손으로 적는 순간 규칙이 다시 어긋난다. 구 4px(`radius.xs`)은 371×387 카드에서 사실상 보이지
 * 않아 프리뷰 면의 좌우 경계가 90° 직선으로 읽혔다(2026-07-30 사용자 신고).
 */
export const FEED_RADIUS = outerRadius(FEED_INNER_RADIUS, FEED_PADDING);

/** 평상시 그림자. hover 는 항상 `shadow.e3` — 한 단계 뜨는 것이 hover 의 의미다. */
export const FEED_SHADOW = shadow.e2;

/** 숫자 존 좌측 오로라 캡슐의 폭. */
export const FEED_RAIL_WIDTH = '4px';

/** hover 시 숫자 판의 면색(평상시는 `surfaceSunken`). */
export const FEED_HERO_HOVER_BG = color.surfaceMuted;

/**
 * 숫자 존(카드 프리뷰 · 행 숫자 칩)을 부모가 hover 규칙으로 집을 수 있게 하는 손잡이.
 *
 * 왜 어트리뷰트인가 — 이 레포의 테스트 변환은 **Emotion 컴포넌트 셀렉터에서 런타임 throw** 한다
 * (`PostRow.styled.ts` CategoryBadge 주석과 같은 이유). 부모(카드·행 링크)에서 자식을 집으려면
 * 어트리뷰트 셀렉터가 유일하게 안전한 길이고, `data-capture-exclude`·`data-tour` 와 같은 관례다.
 */
export const FEED_HERO_ATTR = 'data-feed-hero';

/* -------------------------------------------------------------------------- */
/* 공유 믹스인                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * 숫자 존 좌측의 오로라 캡슐 — `StatTile` hero 의 어법을 그대로 가져온다(시뮬레이터 결과 카드와
 * 같은 말로 "이게 주인공 숫자다"를 말한다). **숫자 자체에는 색을 쓰지 않는다**(확정 규칙).
 *
 * ⚠ 네 모서리 **전부** `pill` 이어야 한다. 한 변의 두 반경 합이 그 변보다 크면 브라우저가 반경
 * 전체를 비례 축소하므로, 오른쪽만 pill 로 두면 왼쪽이 각진 막대가 되어 둥근 타일 위에
 * 직사각형이 붙은 것처럼 보인다(`StatTile.styled.ts` 실측 사고 · test/shared/radiusShape.test.ts).
 *
 * **호스트에 `position: relative` 가 있어야 한다**(같은 블록에서 함께 선언하라).
 */
export const feedRail = `
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: ${space[3]};
    bottom: ${space[3]};
    width: ${FEED_RAIL_WIDTH};
    border-radius: ${radius.pill};
    background: ${color.gradientAurora};
  }
`;

/**
 * hover 시 숫자 판이 **살짝 밝아지고 캡슐이 두꺼워진다** — 카드 안에서 완결되는 미세 순간이다
 * (공용 카드가 `contain`·`content-visibility` 를 걸어 밖으로 넘치는 연출은 잘린다).
 *
 * 색 변화만으로 상태를 말하지 않는다 — 카드 전체의 그림자·이동이 이미 hover 를 알린다(정적 단서).
 * 두 전이 모두 `no-preference` 안에 있어 모션 축소 사용자에게는 즉시 값만 바뀐다.
 */
export const feedHeroHover = `
  @media (prefers-reduced-motion: no-preference) {
    [${FEED_HERO_ATTR}] {
      transition: background ${motion.base} ${motion.ease};
    }

    [${FEED_HERO_ATTR}]::before {
      transition: width ${motion.base} ${motion.ease};
    }
  }

  &:hover [${FEED_HERO_ATTR}] {
    background: ${FEED_HERO_HOVER_BG};
  }

  &:hover [${FEED_HERO_ATTR}]::before {
    width: calc(${FEED_RAIL_WIDTH} * 1.5);
  }
`;
