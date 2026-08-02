import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, elevation, font, iconOpticalAlign, media, motion, radius, space } from '@/shared/styles';

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

/** 카테고리 색의 **틴트 강도** 한 손잡이 — 칩 바탕·테두리가 전부 여기서 파생된다. */
const CAT_TINT = '12%';

/** 제목 왼쪽 액센트 레일 폭. 얇은 막대라 반경을 주지 않는다(radiusShape 가드 §②). */
const RAIL = '4px';

/**
 * 허브 히어로 — 파스텔 히어로 그라디언트 + 상단 오로라 리본.
 *
 * `gradient-hero` 는 **장식 표면 전용** 토큰이다(콘텐츠 카드 배경 금지, `gradient-cta`·
 * `gradient-aurora` 와 교차 사용 금지). ink 프리셋은 hero↔bg ΔE 가 2.8 이라 fill 단독으로는
 * 띠가 안 보이므로 **1px border 가 필수**다 — 아래 테두리를 지우지 마라.
 */
export const HubHero = styled.section`
  display: grid;
  gap: ${space[3]};
  padding: clamp(24px, 4vw, 40px);
  border-radius: ${radius.xl};
  border: 1px solid ${color.brandBorder};
  background: ${color.gradientHero};
  position: relative;
  overflow: hidden;

  /* ⚠ 얇은 막대(6px)라 반경을 주지 않는다 — 부모 overflow 가 잘라낸다(radiusShape 가드 §②). */
  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 6px;
    background: ${color.gradientAurora};
  }
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

/** 카테고리 점프 내비 — 허브에도 목차 성격의 카테고리 이동을 둔다. */
export const CategoryNav = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
  margin-top: ${space[2]};
`;

/**
 * 종목 비교(`/ticker/compare`) 진입 링크.
 *
 * 🔴 **`CategoryNav` 안에 넣지 마라.** 아래 `CategoryNavLink` 의 3색 순환이 "이 nav 안의 유일한 `<a>`"
 * 라는 전제로 `nth-of-type` 을 센다 — 링크를 하나 더 끼우는 순간 칩 색과 아래 섹션 레일 색의 맞물림이
 * 조용히 어긋난다. 그래서 nav 밖 형제로 선다.
 */
export const CompareLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  align-self: start;
  margin-top: ${space[3]};
  padding: ${space[1]} ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  text-decoration: none;

  &:hover {
    background: ${color.surfaceHover};
    color: ${color.text};
  }
`;

/**
 * 카테고리 칩.
 *
 * 3색 순환을 칩에도 적용해 **히어로의 칩 색 = 아래 섹션 제목 레일 색 = 그 섹션의 종목 수 칩 색**
 * 이 맞물린다.
 *
 * ⚠ 순서는 `nth-of-type` 으로 센다 — 이 칩들은 nav 안의 유일한 `<a>` 라 히어로/섹션 세기 문제가 없다.
 */
export const CategoryNavLink = styled.a`
  /* 셋 다 같은 기본값 — 아래 nth-of-type 이 못 잡는 경우에도 color-mix 가 무효화되지 않게. */
  ${CAT_VAR}: ${CAT_COLORS[0]};

  display: inline-flex;
  align-items: center;
  padding: ${space[1]} ${space[3]};
  border-radius: ${radius.pill};
  background: color-mix(in srgb, var(${CAT_VAR}) ${CAT_TINT}, ${color.surface});
  border: 1px solid color-mix(in srgb, var(${CAT_VAR}) calc(${CAT_TINT} * 2.5), ${color.border});
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
  text-decoration: none;

  &:nth-of-type(3n + 1) {
    ${CAT_VAR}: ${CAT_COLORS[0]};
  }
  &:nth-of-type(3n + 2) {
    ${CAT_VAR}: ${CAT_COLORS[1]};
  }
  &:nth-of-type(3n) {
    ${CAT_VAR}: ${CAT_COLORS[2]};
  }

  &:hover {
    border-color: color-mix(in srgb, var(${CAT_VAR}) calc(${CAT_TINT} * 4), ${color.brandBorder});
    color: ${color.brandText};
  }
`;

/**
 * 카테고리 블록.
 *
 * ⚠ scroll-driven 리빌(`animation-timeline: view()`)을 **의도적으로 두지 않는다.** 진입 진행도에
 * opacity 를 매면 아직 화면 아래쪽에 있는 카테고리들이 **흐릿하게 비쳐** 사용자가 "덜 그려진 화면"
 * 으로 읽는다(2026-07-25 사용자 요청으로 제거). 같은 이유로 상세 페이지의 blur 도 앞서 걷어냈다
 * (2026-07-22). 되살리지 마라 — 되살린다면 리빌 대상이 뷰포트 밖에서 완전히 불투명해야 한다.
 *
 * 카테고리 색은 **id 로** 배정한다(`nth-of-type` 은 히어로도 `section` 이라 세기가 어긋난다).
 * id 는 `TICKER_CATEGORY_LABEL` 의 키다 — 카테고리를 추가하면 여기 한 줄이 늘고, 빠뜨리면
 * 기본 색으로 폴백한다(깨지지 않는다).
 */
export const CategorySection = styled.section`
  ${CAT_VAR}: ${CAT_COLORS[0]};

  &#high-dividend,
  &#reit,
  &#core-index {
    ${CAT_VAR}: ${CAT_COLORS[1]};
  }
  &#covered-call,
  &#international,
  &#dividend-stock {
    ${CAT_VAR}: ${CAT_COLORS[2]};
  }

  scroll-margin-top: 80px;
  margin-top: clamp(28px, 4vw, 44px);
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

export const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${space[4]};

  ${media.down('tablet')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  ${media.down('mobileWide')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const TickerCard = styled(Link)`
  /* 카드 폭 기준 컨테이너 — 좁은 카드에서 심볼/스탯 폰트를 cqi 로 유동 축소한다(상세 HeroStat 와 결 맞춤). */
  container-type: inline-size;
  display: grid;
  /* 내부 열을 셀에 묶는다(auto 열이 max-content=긴 영문명/소개 한 줄로 커져 카드를 뷰포트 밖으로 밀던 주범). */
  grid-template-columns: minmax(0, 1fr);
  /* 소개가 남는 높이를 먹고 스탯 행이 카드 바닥에 정렬된다 — 같은 줄의 카드끼리 배당률이 한 선에
     놓여야 세로로 비교가 된다(비교 가능성은 취향이 아니다). */
  grid-template-rows: auto 1fr auto;
  /* 그리드 셀 안에서 카드 자신이 줄어들 수 있게(없으면 min-content 가 커서 축소 불가 → ellipsis 도 안 먹는다). */
  min-width: 0;
  gap: ${space[3]};
  padding: ${space[5]};
  border-radius: ${radius.xl};
  border: 1px solid ${color.border};
  background: ${color.surfaceRaised};
  box-shadow: ${elevation[1]};
  text-decoration: none;
  /* 아래 레일이 둥근 모서리 밖으로 삐져나오지 않게 자른다(레일에 반경을 주는 대신 — radiusShape §②). */
  position: relative;
  overflow: hidden;
  transition: transform ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease};

  /*
   * 카드 왼쪽 액센트 레일.
   *
   * 색은 **그 티커 자신의 액센트**(뷰가 '--tk-from/--tk-to' 를 얹는다. 상세 페이지가 쓰는 것과
   * 같은 큐레이션 값이라 두 화면에서 같은 티커가 같은 색으로 읽힌다). 액센트가 없는 티커는
   * 카테고리 색으로 폴백한다. 색을 새로 만들지 않는다 — 데이터에 있는 것만 쓴다.
   */
  --tk-rail-from: var(--tk-from, var(${CAT_VAR}, ${color.brandText}));
  --tk-rail-to: var(--tk-to, var(${CAT_VAR}, ${color.brandText}));

  /*
   * 심볼에 쓸 액센트 **텍스트** 색. 라이트/다크로 갈린 값을 티커 데이터가 이미 갖고 있고
   * (상세 페이지 AccentScope 가 쓰는 바로 그 두 값), 여기서 같은 방식으로 고른다.
   * 액센트가 없는 티커는 기본 본문색으로 폴백한다.
   */
  --tk-card-accent-text: var(--tk-text-light, ${color.text});

  @media (prefers-color-scheme: dark) {
    --tk-card-accent-text: var(--tk-text-dark, ${color.text});
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
    --tk-card-accent-text: var(--tk-text-light, ${color.text});
  }
  html[data-theme='dark'] & {
    --tk-card-accent-text: var(--tk-text-dark, ${color.text});
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: ${RAIL};
    background: linear-gradient(180deg, var(--tk-rail-from), var(--tk-rail-to));
  }

  /* 색 hover 는 어디서나 — 터치에서 남아도 무해하다. 그 티커 자신의 색으로 물들어 어느 카드를
     겨냥했는지가 분명해진다. */
  &:hover {
    border-color: color-mix(in srgb, var(--tk-rail-to) 55%, transparent);
  }

  /* 이동은 진짜 포인터에서만 — 터치는 탭 뒤 :hover 가 남아 카드가 들린 채로 굳는다. */
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-2px);
    }
  }
`;

export const CardHead = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const CardTicker = styled.span`
  font-size: clamp(20px, 7cqi, ${font.size['3xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  /*
   * 심볼이 그 티커의 색을 입는다. 14장이 저마다 다른 색이라 격자가 카탈로그처럼 읽히고,
   * 같은 티커의 상세 페이지와 색이 이어진다(액센트 없는 티커는 기본 본문색으로 폴백).
   * 🔴 대상은 **이름**이다 — 아래 배당률 숫자는 계속 중립색이다(숫자에 accent 금지).
   */
  color: var(--tk-card-accent-text);
  ${font.numeric};
  overflow-wrap: anywhere;
`;

/** 한글명 · 영문명 — 좁은 폭에서 길어지면 한 줄 말줄임(…)으로 카드를 넘기지 않는다. */
export const CardKorean = styled.span`
  min-width: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  color: ${color.textSecondary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** 한 줄 소개 — 최대 2줄까지 보여주고 넘치면 말줄임(정보 과잉 은닉 없이 카드 높이만 고정). */
export const CardTagline = styled.p`
  margin: 0;
  min-width: 0;
  align-self: start;
  font-size: ${font.size.md};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const CardStatRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[4]};
  /* 카드 바닥으로 밀린다 — 같은 줄의 카드끼리 배당률이 한 선에 놓여야 비교가 된다. */
  margin-top: auto;
  padding-top: ${space[3]};
  border-top: 1px solid ${color.border};
  min-width: 0;
`;

export const CardStat = styled.div`
  display: grid;
  gap: 1px;
  min-width: 0;
`;

export const CardStatLabel = styled.span`
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
`;

/**
 * 배당률·운용보수·지급 주기 값.
 *
 * 🔴 색은 **중립(`color.text`) 고정**이다 — 숫자에 accent·손익색은 확정 금지(색은 배지·아이콘·
 * 크롬에만). 카테고리 색(`--tk-cat`)이나 티커 액센트를 여기에 연결하지 마라.
 */
export const CardStatValue = styled.span`
  font-size: clamp(13px, 4.6cqi, ${font.size.lg});
  font-weight: ${font.weight.bold};
  color: ${color.text};
  ${font.numeric};
  overflow-wrap: anywhere;
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
