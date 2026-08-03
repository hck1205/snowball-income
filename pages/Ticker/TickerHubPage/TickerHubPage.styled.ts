import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { PickCard } from '@/components/common';
import { PICK, color, font, iconOpticalAlign, motion, radius, space } from '@/shared/styles';

/**
 * ── `/ticker/all` 의 면 설계 ────────────────────────────────────────────────
 *
 * 이 화면은 **고르는 면(brand)** 이 지배한다 — 카드 한 장을 고르면 화면이 바뀐다.
 * 그래서 카드는 공용 `Card`(읽는 면)가 아니라 `PickCard` 이고, 컬러 캡을 두른다.
 *
 * ## 틴트 면 예산 (tintscan: 화면당 2면)
 * 이 화면의 채도 면은 **정확히 둘**이고, 그중 하나는 이 화면 것이 아니다.
 *   ① 카드 컬러 캡 — 전 카드가 **같은 배경값**이라 클러스터가 1면으로 접는다(32 → 1, 실측)
 *   ② 공용 `PageFooter`(브랜드 패널) — 이 화면이 고를 수 없는, 페이지 공통으로 딸려오는 면
 *
 * 🔴 그래서 **히어로는 채도 면이 아니다.** 종전에는 `gradientHero` 를 깔았는데, 푸터가 브랜드
 * 패널이 된 뒤로는 히어로 + 캡 + 푸터 = 3면이라 상한을 깬다(실측 2026-08-03: 1280px·390px 모두 3).
 * 셋 중 무엇을 내릴지는 이 화면의 정체성이 정한다 — 여기는 **컬러 캡을 허용하는 유일한 화면**이므로
 * 캡을 지키고 히어로를 중립 면으로 내렸다. 색은 6px 오로라 리본 · 머리말 칩 · 색 점 칩 ·
 * 솔리드 CTA 가 계속 말한다(넷 다 면 판정에 걸리지 않는다).
 * ⚠ 히어로에 다시 그라디언트를 깔고 싶어지면, 먼저 tintscan 을 돌려 3이 되는지 확인하라.
 *
 * 🔴 캡 색을 **티커마다 다르게 칠하지 않는 이유**가 여기 있다. tintscan 의 클러스터 접기는
 * "같은 표식값 **+ 같은 배경값**"일 때만 합친다(도구 주석: 색이 다르면 눈에도 다른 덩어리다).
 * 27종에 각자의 틴트를 주면 27면으로 세어져 예산을 13배 초과한다. 그래서 **면은 공유하고,
 * 티커의 색은 면이 아닌 곳**(상단 6px 리본 · 캡 안 글리프/라벨 잉크 · 심볼 글자)에 싣는다.
 * 셋 다 tintscan 의 면 판정(폭 ≥180px · 높이 ≥8px · 비중립 배경)에 걸리지 않는다.
 *
 * ## 나머지 색은 전부 "면이 아닌 색"이다
 * 카테고리 칩은 **중립 면 + 색 테두리 + 색 점**이다. 종전처럼 12% 틴트를 깔면 좁은 폭에서
 * 긴 라벨('커버드콜·옵션인컴 ETF')이 180px 을 넘겨 조용히 3번째 면이 된다.
 */

/**
 * 카테고리 색 순환 — 섹션 하나가 자기 색을 정하고, 그 안의 칩·제목 레일·종목 수 칩이 전부 이
 * 변수를 읽는다. 색이 장식이 아니라 **길찾기 단서**가 되게 하는 장치다.
 *
 * ⚠ 3색은 프리셋의 brand/accent/accentAlt 라 **velog(기본)에서는 셋 다 초록 계열**이다 —
 * 색상군이 하나인 프리셋의 의도된 결과이고, navy-gold·grape·sunset 에서는 확실히 갈린다.
 * 전경으로도 쓰이므로 solid 가 아니라 대비 검증된 `*Text` 계열을 넣는다.
 */
const CAT_VAR = '--tk-cat';
const CAT_COLORS = [color.brandText, color.accentText, color.accentAltText] as const;

/**
 * 3색 순환의 **단일 표**. 여기 없는 카테고리는 0번 색으로 떨어진다(깨지지 않는다).
 *
 * 🔴 히어로 칩과 섹션(제목 레일·종목 수 칩)이 **같은 표를 읽어야** 색이 길찾기 단서가 된다.
 * 종전에는 칩만 `nth-of-type` 으로 **렌더 순서**를 세었는데, 섹션은 id 로 색을 받으므로 비어 있는
 * 카테고리가 걸러지는 순간 둘이 어긋났다 — 실측(2026-08-03, 1280px)에서 '리츠(REITs)' 칩은 초록인데
 * 섹션 레일은 파랑, '해외 배당 ETF' 는 그 반대였다. 그래서 칩도 **href(=섹션 id)** 로 색을 받는다.
 */
const CAT_GROUP_1 = ['high-dividend', 'reit', 'core-index'] as const;
const CAT_GROUP_2 = ['covered-call', 'international', 'dividend-stock'] as const;

/** 섹션 자신을 고르는 선택자(`&#high-dividend, &#reit …`). */
const sectionSelector = (ids: readonly string[]): string => ids.map((id) => `&#${id}`).join(', ');

/** 그 섹션으로 뛰는 해시 앵커를 고르는 선택자. 칩의 순서가 아니라 **목적지**로 색을 정한다. */
const anchorSelector = (ids: readonly string[]): string => ids.map((id) => `&[href='#${id}']`).join(', ');

/** 제목 왼쪽 액센트 레일 폭. 얇은 막대라 반경을 주지 않는다(radiusShape 가드 §②). */
const RAIL = '4px';

/** 카드 상단 컬러 리본 두께. 🔴 8px 이 되면 tintscan 이 면으로 세기 시작한다 — 6px 을 넘기지 마라. */
const CARD_RIBBON = PICK.railHeight;

/* -------------------------------------------------------------------------- */
/* 히어로 — 중립 면 + 오로라 리본 (파일 머리말의 예산 설명을 보라)                  */
/* -------------------------------------------------------------------------- */

/**
 * 허브 히어로 — **중립 면** + 상단 6px 오로라 리본.
 *
 * 🔴 배경을 `gradientHero` 로 되돌리지 마라. 이 라우트는 카드 컬러 캡(1면)과 공용 브랜드 패널
 * 푸터(1면)로 이미 예산 2를 다 쓴다 — 히어로가 채도 면이 되는 순간 3면이 된다(파일 머리말 실측).
 *
 * 브랜드 테두리를 남기는 이유: 중립 면끼리는 라이트 테마에서 surface↔bg 차이가 거의 없어
 * 히어로가 배경에 잠긴다. 6px 리본과 1px 브랜드 테두리가 그 경계를 만든다.
 */
export const HubHero = styled.section`
  position: relative;
  overflow: hidden;
  display: grid;
  gap: ${space[3]};
  padding: clamp(28px, 4.5vw, 48px);
  border-radius: ${radius.xl};
  border: 1px solid ${color.brandBorder};
  background: ${color.surface};

  /* ⚠ 얇은 막대(6px)라 반경을 주지 않는다 — 부모 overflow 가 잘라낸다(radiusShape 가드 §②). */
  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: ${CARD_RIBBON};
    background: ${color.gradientAurora};
  }
`;

/**
 * 히어로 머리말 칩. 폭이 짧아(<180px) 틴트 면으로 세어지지 않는다 — 그래서 여기서는 채도 면을
 * 예산 없이 쓸 수 있다(색면 사다리 L1).
 */
export const HubEyebrow = styled.p`
  justify-self: start;
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px ${space[3]};
  border-radius: ${radius.pill};
  background: ${color.brandSubtle};
  border: 1px solid ${color.brandBorder};
  color: ${color.brandText};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.02em;
`;

export const HubTitle = styled.h1`
  margin: 0;
  font-size: clamp(${font.size['2xl']}, 4vw, ${font.size['5xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  line-height: ${font.leading.tight};
  color: ${color.text};
`;

export const HubLede = styled.p`
  margin: 0;
  font-size: clamp(${font.size.md}, 2vw, ${font.size.xl});
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
  max-width: 56ch;
`;

/**
 * 히어로 요약 줄 — "27종 · 7개 카테고리".
 *
 * 🔴 숫자는 **중립색**이다(손익색·액센트 금지). 색은 위 칩과 아래 카드가 이미 충분히 말한다.
 */
export const HubMeta = styled.p`
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[2]};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
`;

export const HubMetaValue = styled.strong`
  color: ${color.text};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  ${font.numeric};
`;

/** 요약 줄의 구분점. 글자가 아니라 기호라 스크린리더에서 숨긴다(호출부가 aria-hidden 을 건다). */
export const HubMetaDot = styled.span`
  color: ${color.textMuted};
`;

/** 카테고리 점프 내비 — 허브에도 목차 성격의 카테고리 이동을 둔다. */
export const CategoryNav = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
  margin-top: ${space[1]};
`;

/**
 * 카테고리 칩.
 *
 * 3색 순환을 칩에도 적용해 **히어로의 칩 색 = 아래 섹션 제목 레일 색 = 그 섹션의 종목 수 칩 색**
 * 이 맞물린다.
 *
 * ⚠ 색은 칩의 **순서가 아니라 목적지**(href = 섹션 id)로 정한다. 순서로 세면 비어 있는 카테고리가
 * 걸러지거나 카테고리가 추가되는 순간 섹션 색과 어긋난다(위 CAT_GROUP_* 주석의 실측을 보라).
 *
 * 🔴 배경이 **중립(surface)** 인 것은 취향이 아니라 예산이다. 종전의 12% 틴트는 390px 폭에서
 * 긴 라벨 칩이 180px 을 넘겨 tintscan 의 3번째 면이 될 수 있었다. 색은 테두리와 앞의 점이 말한다
 * (둘 다 배경이 아니라 세어지지 않는다).
 */
export const CategoryNavLink = styled.a`
  /* 표에 없는 카테고리(신규 추가)의 기본값 — 변수가 비어 color-mix 가 통째로 무효화되지 않게. */
  ${CAT_VAR}: ${CAT_COLORS[0]};

  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px ${space[3]};
  border-radius: ${radius.pill};
  background: ${color.surface};
  border: 1px solid color-mix(in srgb, var(${CAT_VAR}) 34%, ${color.border});
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  text-decoration: none;
  transition: border-color ${motion.fast} ${motion.ease}, background ${motion.fast} ${motion.ease};

  /* 색 점 — 칩이 어느 카테고리 색인지 말하는 비텍스트 채널(10px 이라 면으로 세어지지 않는다). */
  &::before {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: ${radius.pill};
    background: var(${CAT_VAR});
    flex: 0 0 auto;
  }

  ${anchorSelector(CAT_GROUP_1)} {
    ${CAT_VAR}: ${CAT_COLORS[1]};
  }
  ${anchorSelector(CAT_GROUP_2)} {
    ${CAT_VAR}: ${CAT_COLORS[2]};
  }

  &:hover {
    background: color-mix(in srgb, var(${CAT_VAR}) 10%, ${color.surface});
    border-color: var(${CAT_VAR});
  }
`;

/**
 * 종목 비교(`/ticker/compare`) 진입 링크 — 이 화면의 **유일한 L3 솔리드 면**이다.
 *
 * 🔴 `CategoryNav` 안에 넣지 마라. 그 nav 는 "카테고리 바로가기"라는 이름을 달고 있어, 스크린리더
 * 사용자가 목록을 훑을 때 **같은 문서 안 이동만** 나오리라 기대한다 — 다른 라우트로 나가는 링크가
 * 섞이면 그 약속이 깨진다. 또 이 버튼은 이 화면의 유일한 L3 솔리드 면이라, 칩 줄에 섞이면
 * 카테고리 칩과 같은 위계로 읽힌다. 구조는 테스트가 잠근다(TickerHubPage.test.tsx).
 *
 * 🔴 솔리드 채움은 **brand 축 하나만** 합법이다(accent/accentAlt/identity 를 채우면 16테마 중
 * 최소 하나가 대비를 잃는다). 그래서 여기 색은 brand + onBrand 고정이다.
 */
export const CompareLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: start;
  justify-self: start;
  margin-top: ${space[2]};
  padding: 10px ${space[4]};
  border: 1px solid transparent;
  border-radius: ${radius.pill};
  background: ${color.brand};
  color: ${color.onBrand};
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  text-decoration: none;
  transition: background ${motion.fast} ${motion.ease}, transform ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.brandHover};
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-1px);
    }
  }
`;

/* -------------------------------------------------------------------------- */
/* 카테고리 섹션                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * 카테고리 블록.
 *
 * ⚠ scroll-driven 리빌(`animation-timeline: view()`)을 **의도적으로 두지 않는다.** 진입 진행도에
 * opacity 를 매면 아직 화면 아래쪽에 있는 카테고리들이 **흐릿하게 비쳐** 사용자가 "덜 그려진 화면"
 * 으로 읽는다(2026-07-25 사용자 요청으로 제거). 같은 이유로 상세 페이지의 blur 도 앞서 걷어냈다
 * (2026-07-22). 되살리지 마라 — 되살린다면 리빌 대상이 뷰포트 밖에서 완전히 불투명해야 한다.
 *
 * 카테고리 색은 **id 로** 배정한다(`nth-of-type` 은 히어로도 section 이라 세기가 어긋난다).
 * id 는 `TICKER_CATEGORY_LABEL` 의 키다 — 카테고리를 추가하면 여기 한 줄이 늘고, 빠뜨리면
 * 기본 색으로 폴백한다(깨지지 않는다).
 *
 * 🔴 `scroll-margin-top` 은 해시 앵커(`#high-dividend`)로 뛰어왔을 때 고정 헤더에 제목이 가리지
 * 않게 하는 값이다. 이 화면의 카테고리 바로가기가 **해시 앵커**로 동작하므로 지우지 마라.
 */
export const CategorySection = styled.section`
  ${CAT_VAR}: ${CAT_COLORS[0]};

  ${sectionSelector(CAT_GROUP_1)} {
    ${CAT_VAR}: ${CAT_COLORS[1]};
  }
  ${sectionSelector(CAT_GROUP_2)} {
    ${CAT_VAR}: ${CAT_COLORS[2]};
  }

  scroll-margin-top: 80px;
  margin-top: clamp(32px, 5vw, 56px);
  display: grid;
  gap: ${space[4]};
`;

/**
 * 카테고리 제목 크기. **아래 종목 수 칩의 광학 보정이 이 값을 기준으로 하므로 둘은 항상 같이
 * 움직인다** — 크기만 바꾸고 보정을 두면 칩이 조용히 어긋난다.
 */
const CATEGORY_TITLE_SIZE = font.size['2xl'];

/**
 * 카테고리 제목 줄(제목 + 종목 수 칩).
 *
 * 🔴 정렬은 `baseline` 이 아니라 `center` + 잉크 보정이다. 칩은 글자가 아니라 **면을 가진 알약**이라
 * 사람 눈은 칩의 *상자 중심*을 제목의 *잉크 중심*에 맞춘 것으로 읽는다. 베이스라인으로 맞추면
 * 두 글자 크기(20px 제목 vs 13px 칩)의 잉크 높이 차 + 칩 패딩만큼 칩이 아래로 내려앉는다
 * (실측 2026-08-01, 헤드리스 크롬 150: 칩 상자 중심이 제목 잉크 중심보다 **+4.0~4.3px 아래**,
 * 1280px·390px 동일). 보정은 아래 CategoryCount 가 공용 유틸로 건다.
 */
export const CategoryHeading = styled.h2`
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${space[2]};
  font-size: ${CATEGORY_TITLE_SIZE};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
  color: ${color.text};

  /* 카테고리 색 레일. */
  border-left: ${RAIL} solid var(${CAT_VAR});
  padding-left: calc(${RAIL} * 2.5);
`;

/**
 * 제목 앞 글리프 — 카테고리를 **모양으로도** 말한다(색이 단독 채널이 되지 않게).
 * 한글 제목의 라인박스 중심 어긋남은 공용 유틸이 제목 크기 기준으로 되올린다.
 */
export const CategoryGlyph = styled.span`
  ${iconOpticalAlign('display', CATEGORY_TITLE_SIZE)}
  display: inline-flex;
  flex: 0 0 auto;
  color: var(${CAT_VAR});
`;

/**
 * 종목 수 — 색 칩으로 올린다(섹션마다 색이 한 번 더 찍혀 목록에 리듬이 생긴다).
 *
 * 제목이 헤딩 서체(전역 h1~h6 이 font.display 를 건다)라 라인박스 중심이 잉크 중심보다 아래에 있다.
 * 그 몫을 공용 유틸이 **제목 크기 기준으로** 되올린다 — 칩 자신의 em 으로 쓰면 안 된다(칩 13px vs
 * 제목 20px). 정본과 근거는 shared/styles/heroTitleRow.ts.
 */
export const CategoryCount = styled.span`
  ${iconOpticalAlign('display', CATEGORY_TITLE_SIZE)}
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  background: color-mix(in srgb, var(${CAT_VAR}) 14%, ${color.surface});
  border: 1px solid color-mix(in srgb, var(${CAT_VAR}) 32%, transparent);
  font-size: ${font.size.sm};
  /* 🔴 값(개수)은 중립색이다 — 색은 칩의 면·테두리(크롬)에만. */
  color: ${color.text};
  font-weight: ${font.weight.bold};
`;

/* -------------------------------------------------------------------------- */
/* 카드 — 고르는 면                                                              */
/* -------------------------------------------------------------------------- */

/**
 * 티커 하나의 **색 스코프**이자 격자 셀.
 *
 * 뷰가 인라인 스타일로 원시 액센트(`--tk-from/--tk-to/--tk-text-light/--tk-text-dark`)와
 * `assignSeries` 폴백(`--tk-fallback`)을 얹고, 여기서 파생 변수를 만든다 — 상세 페이지의
 * `AccentScope` 와 **같은 변수 이름**(`--tk-text`)이라 같은 티커가 두 화면에서 같은 색으로 읽힌다.
 *
 * 🔴 `--tk-cap-fill` 만은 **티커와 무관한 공유 값**이다. 파일 머리말의 예산 설명을 보라 —
 * 캡 배경이 카드마다 다르면 tintscan 클러스터가 접지 못한다.
 */
export const CardScope = styled.li`
  display: grid;
  min-width: 0;

  /* 액센트 미지정 티커의 폴백: 카테고리 색이 아니라 시리즈 색이다(같은 격자에서 겹치지 않는다). */
  --tk-ink: var(--tk-fallback, ${color.brandText});
  --tk-text: var(--tk-text-light, var(--tk-ink));
  --tk-ribbon-from: var(--tk-from, var(--tk-ink));
  --tk-ribbon-to: var(--tk-to, var(--tk-ink));

  /* 전 카드가 같은 값을 낸다 — 클러스터가 1면으로 접는 조건. */
  --tk-cap-fill: ${color.brandSubtle};

  @media (prefers-color-scheme: dark) {
    --tk-text: var(--tk-text-dark, var(--tk-ink));
  }

  /*
   * 팔레트 시스템의 강제 테마 오버라이드(data-theme)와도 정합을 맞춘다.
   *
   * 🔴 조상 선택자는 반드시 'html[...]' 로 쓴다 — ':root[...] &' 는 **동작하지 않는다.**
   * stylis 는 콜론으로 시작하는 중첩 선택자를 "부모에 붙는 의사선택자"로 보고 부모를 앞에
   * 덧붙이는데, 그 결과가 '.css-x:root[data-theme="dark"] .css-x' 라 **영원히 매치되지 않는다**
   * (2026-07-30 실측: 강제 다크에서 액센트 텍스트가 라이트 값으로 남는다).
   * 'html' 은 콜론으로 시작하지 않아 그대로 조상 선택자로 나간다.
   */
  html[data-theme='light'] & {
    --tk-text: var(--tk-text-light, var(--tk-ink));
  }
  html[data-theme='dark'] & {
    --tk-text: var(--tk-text-dark, var(--tk-ink));
  }
`;

/**
 * 허브가 쓰는 고르는 카드 = 공용 `PickCard` + **그 티커만의 상단 리본**.
 *
 * 리본을 의사요소로 그리는 이유가 둘이다.
 *  ① tintscan 은 DOM 만 열거한다 — 의사요소는 애초에 세어지지 않는다(도구 주석 §스코프에서 뺀 것).
 *  ② 6px 은 면 하한(8px)보다 낮아, DOM 이었더라도 선으로 남는다. 즉 **두 겹으로 안전하다.**
 *
 * 부모(`PickCardRoot`)가 이미 position:relative + overflow:hidden 이라 리본이 카드 라운드를 따라
 * 잘린다. z-index 2 인 것은 스트레치 컨트롤의 덮개(z-index 0)와 슬롯(z-index 1) 위에 얹기 위해서다 —
 * 클릭을 가로채지 않도록 pointer-events 는 끈다.
 */
export const HubPickCard = styled(PickCard)`
  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: ${CARD_RIBBON};
    z-index: 2;
    pointer-events: none;
    background: linear-gradient(90deg, var(--tk-ribbon-from), var(--tk-ribbon-to));
  }
`;

/**
 * 카드 제목 자리에 서는 티커 심볼.
 *
 * 그 티커의 색을 입는다 — 27장이 저마다 다른 색이라 격자가 카탈로그처럼 읽히고, 같은 티커의
 * 상세 페이지 히어로와 색이 이어진다. 🔴 대상은 **이름**이다(아래 배당률 숫자는 계속 중립색이다).
 *
 * ⚠ 이 요소가 카드 링크의 **접근 가능한 이름**이다(스트레치 컨트롤이 제목을 감싼다).
 * 심볼을 여기서 빼면 스크린리더 사용자가 카드를 티커로 구분하지 못한다.
 */
export const CardSymbol = styled.span`
  font-size: clamp(${font.size['2xl']}, 2.2vw, ${font.size['3xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  color: var(--tk-text);
  ${font.numeric};
  overflow-wrap: anywhere;
`;

/**
 * 한글명 · 영문명 — 한 줄로 자르고 넘치면 말줄임(…).
 *
 * 🔴 `white-space: nowrap` 으로 자르지 마라. 이 span 의 부모(공용 `PickCardSubtitle`)는 격자 아이템의
 * 기본 `min-width: auto` 를 갖는다 — nowrap 은 그 아이템의 **최소 크기를 글자 전체 폭으로** 만들어
 * 부모가 카드 밖으로 부푼다. 카드가 `overflow: hidden` 이라 말줄임 없이 **글자가 그냥 잘려** 나갔다
 * (실측 2026-08-03, 1280px: RDVY 카드에서 194px 초과, 8장 중 7장이 카드를 넘겼다).
 *
 * 줄바꿈을 허용하고 `-webkit-line-clamp` 로 한 줄만 남기면 같은 그림을 얻으면서 최소 크기가 커지지
 * 않는다. `overflow-wrap: anywhere` 가 핵심이다 — `break-word` 와 달리 **최소 크기 계산에 반영**되어
 * 긴 영문명(`Vanguard Dividend Appreciation ETF`)도 부모를 밀지 못한다.
 */
export const CardNames = styled.span`
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  min-width: 0;
  overflow: hidden;
  overflow-wrap: anywhere;
`;

/**
 * 카드 본문 — 소개 2줄 + 스탯 블록.
 *
 * 소개 높이를 **2줄로 고정**한다: 같은 줄의 카드끼리 스탯 블록이 한 선에 놓여야 세로로 비교가
 * 된다(비교 가능성은 취향이 아니다). 종전에는 `margin-top: auto` 로 밀었는데, 그러면 소개가
 * 1줄인 카드와 2줄인 카드의 스탯이 어긋났다.
 */
export const CardBody = styled.div`
  container-type: inline-size;
  display: grid;
  gap: ${space[3]};
  min-width: 0;
`;

export const CardTagline = styled.p`
  margin: 0;
  min-width: 0;
  font-size: ${font.size.base};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  /* 2줄 고정 — 위 CardBody 주석의 이유. */
  min-height: calc(${font.size.base} * ${font.leading.snug} * 2);
`;

/**
 * 스탯 블록 — 카드 안의 **읽는 자리**다.
 *
 * 🔴 면이 중립(`surfaceMuted`)인 것은 규율이다. 고르는 카드 안이라도 숫자가 앉는 자리에는
 * 채도 면을 깔지 않는다(SurfaceKind 2분법). 중립이라 tintscan 이 세지도 않는다.
 */
export const CardStatRow = styled.dl`
  margin: 0;
  display: grid;
  /* auto-fit 이라 스탯이 둘뿐인 티커(운용보수 없음)는 빈 칸 없이 두 칸으로 눕는다. */
  grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
  gap: ${space[2]};
  padding: ${space[3]};
  border-radius: var(--sb-inner-radius, ${radius.md});
  background: ${color.surfaceMuted};
  min-width: 0;
`;

export const CardStat = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const CardStatLabel = styled.dt`
  margin: 0;
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
  color: ${color.textMuted};
  white-space: nowrap;
`;

/**
 * 배당률·운용보수·지급 주기 값.
 *
 * 🔴 색은 **중립(`color.text`) 고정**이다 — 숫자에 accent·손익색은 확정 금지(색은 배지·아이콘·
 * 크롬에만). 카테고리 색(`--tk-cat`)이나 티커 액센트를 여기에 연결하지 마라.
 */
export const CardStatValue = styled.dd`
  margin: 0;
  /* 카드 폭 기준 — 좁은 카드에서 3열이 무너지지 않게 값 크기가 함께 줄어든다(CardBody 가 컨테이너). */
  font-size: clamp(${font.size.base}, 5.2cqi, ${font.size.lg});
  font-weight: ${font.weight.bold};
  color: ${color.text};
  ${font.numeric};
  overflow-wrap: anywhere;
`;

/** 캡 안 라벨(카테고리명) — 좁은 카드에서 잘리지 않게 크기를 한 단 낮춘다. */
export const CapLabel = styled.span`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
`;

/**
 * 칩·버튼 안에 서는 작은 글리프. 본문 서체(`sans`)는 잉크 중심이 라인박스 중심과 거의 같아
 * **보정을 내보내지 않는다** — 공용 유틸이 그 판단까지 소유한다(상수를 손으로 적지 마라).
 */
export const ChipGlyph = styled.span`
  ${iconOpticalAlign('sans', font.size.base)}
  display: inline-flex;
`;

export const EmptyState = styled.p`
  margin-top: ${space[6]};
  padding: ${space[6]};
  border-radius: ${radius.lg};
  border: 1px dashed ${color.border};
  text-align: center;
  color: ${color.textMuted};
  font-size: ${font.size.md};
`;

/** 격자 폭 — 3열(데스크톱) → 2열 → 1열이 자연스럽게 나오는 최소 열 폭. */
export const CARD_MIN_WIDTH = '272px';
