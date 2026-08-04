import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { DATA_RADIUS, color, font, media, radius, space, surface } from '@/shared/styles';

/**
 * 이 화면이 세우는 면의 패딩. `surface()` 가 이 값에서 안쪽 라운드까지 파생하므로 상수로 둔다
 * (`TickerComparePage/styled/` 가 같은 이유로 같은 형태를 쓴다).
 */
const PANEL_PAD = space[4];

/** 히어로 아래 본문. 섹션 간격 하나만 여기서 정한다 — 섹션마다 margin 을 흩뿌리지 않는다. */
export const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[6]};
  margin-top: ${space[6]};
`;

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${space[3]};
`;

export const SectionTitle = styled.h2`
  margin: 0;
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const Body = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: 1.7;
  max-width: 72ch;
`;

/**
 * 기준 배지 — "연속 증배 50년 이상". 이 화면에서 **가장 먼저 읽혀야 하는 사실**이라 본문이 아니라
 * 자기 면을 갖는다.
 */
export const CriterionBadge = styled.p`
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: ${space[2]};
  margin: 0;
  padding: ${space[2]} ${space[4]};
  border: 1px solid ${color.brandBorder};
  border-radius: ${radius.pill};
  background: ${color.brandSubtle};
  color: ${color.brandText};
  font-size: ${font.size.md};
  font-weight: ${font.weight.semibold};
`;

/** 읽기 주의 — 경고가 아니라 "이 목록을 어떻게 읽어야 하는가"라 중립 면에 둔다. */
export const CautionPanel = styled.div`
  ${surface(DATA_RADIUS, PANEL_PAD)};
  border: 1px solid ${color.border};
  background: ${color.surfaceSunken};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: 1.7;
`;

/**
 * 마스코트가 앉을 **폭**. 상한 168px 은 히어로 카드 안쪽에서 제목·리드가 쓸 폭을 남기고,
 * 하한 88px 은 390px 에서 캐릭터의 얼굴이 알아볼 수 있는 최소치다(그 아래로는 보라색 덩어리가 된다).
 */
const MASCOT_WIDTH = 'clamp(88px, 12vw, 168px)';

/** 카드 테두리와의 거리. 그림의 발끝·오른팔이 둥근 모서리에 닿지 않을 만큼만. */
const MASCOT_INSET = 'clamp(6px, 1vw, 14px)';

/**
 * 히어로 + 마스코트 한 덩어리.
 *
 * ## 🔴 그림을 히어로 **안**이 아니라 같은 그리드 셀의 형제로 두는 이유
 * `PageHero` 는 앱의 유일한 히어로이고 슬롯이 정해져 있다(icon·title·actions·lede·notice·meta).
 * 그림을 `actions` 에 넣으면 좁은 폭에서 그 슬롯이 **제목 아래 전폭**으로 내려가(`PageHero.styled`
 * HeroActions) 그림이 본문을 그만큼 밀어낸다. 형제로 두고 같은 셀에 겹치면 카드 오른쪽의
 * 원래 비어 있던 자리를 쓰므로 **세로로 아무것도 밀지 않는다.** 랜딩 히어로가 같은 처방을 쓴다
 * (`pages/Landing/LandingPage/LandingPage.styled.ts` 의 HeroArt).
 *
 * ## 자리를 겹치되 **비워 준다**
 * 겹치기만 하면 제목·리드가 그림 밑으로 흐른다(리드에는 max-width 가 없다). 그래서 카드에
 * 그림 폭만큼 오른쪽 패딩을 준다 — 절대배치로는 이 "자리 비우기"를 할 수 없다.
 */
/**
 * 그림이 앉는 쪽. 목록마다 다르다(2026-08-04 사용자 지시: 킹·챔피언은 그림이 오른쪽,
 * 귀족은 그림이 왼쪽이고 글이 오른쪽). 셋 다 같은 쪽이면 세 화면이 한 장처럼 보인다 —
 * 좌우를 갈라 두면 목록을 옮겨 다닐 때 **화면이 바뀌었다는 신호**가 시각적으로 남는다.
 */
export type MascotSide = 'left' | 'right';

/** 그림이 비켜 준 자리. 글은 그림 반대쪽 패딩만 받는다 — 양쪽을 다 주면 글 폭이 두 번 깎인다. */
const MASCOT_GUTTER = `calc(${MASCOT_WIDTH} + ${MASCOT_INSET} + clamp(12px, 1.6vw, 24px))`;

export const HeroBlock = styled.div<{ $side: MascotSide }>`
  display: grid;
  grid-template-areas: 'hero';
  min-width: 0;

  > header {
    grid-area: hero;
    ${({ $side }) => ($side === 'left' ? `padding-left: ${MASCOT_GUTTER};` : `padding-right: ${MASCOT_GUTTER};`)}
  }
`;

/**
 * 목록별 마스코트.
 *
 * 🔴 **장식이다** — `alt=""`. 바로 옆의 `<h1>`("배당킹")이 이미 이 그림의 이름을 말하고 있어서,
 * 대체 텍스트를 달면 스크린리더 사용자는 같은 말을 두 번 듣는다.
 * 🔴 클릭을 통과시킨다. 이 상자는 그리드 셀을 채우느라 카드 오른쪽 위를 덮는데, 그림은 읽는 것도
 *    누르는 것도 아니다(랜딩 히어로에서 그림이 CTA 를 먹었던 실측 사고와 같은 처방).
 * ⚠ `width`/`height` 속성은 **원본 픽셀**을 그대로 준다 — 실제 폭은 CSS 가 정하지만, 두 값이 있어야
 *   브라우저가 비율대로 자리를 미리 잡아 이미지가 도착할 때 글자가 튀지 않는다(CLS).
 * ⚠ 바닥에 붙인다: 세 그림 모두 **서 있는 전신** 캐릭터라 카드 아래 선에 발이 닿아야 떠 보이지 않는다.
 * ⚠ `$side` 는 위 HeroBlock 의 패딩과 **반드시 같은 값**이어야 한다. 어긋나면 그림이 글 위에 겹친다 —
 *   그래서 둘 다 뷰가 한 곳(LIST_MASCOT)에서 읽은 같은 값을 받는다.
 */
export const HeroMascot = styled.img<{ $side: MascotSide }>`
  grid-area: hero;
  /*
   * 🔴 **이 한 줄이 없으면 그림이 안 보인다.** 실측(2026-08-04 @1280,
   * document.elementFromPoint(1100, 300) → HEADER): 히어로 카드(HeroRoot)는 position: relative 라
   * **위치 지정 요소**이고, CSS 페인트 순서상 위치 지정 요소는 정적 요소보다 **나중에** 그려진다.
   * 그래서 DOM 상 뒤에 있는 이 그림이 카드의 불투명 배경 밑으로 깔렸다(이미지는 정상 로드된
   * 상태였다 — complete: true · naturalWidth: 440). 여기에 position 을 주면 그림이 같은 페인트
   * 단계로 올라오고, 그 안에서는 DOM 순서가 이겨서 카드 위에 선다.
   * z-index 는 주지 않는다 — 필요 없고, 주면 이 자리에 쓸데없는 쌓임 맥락이 생긴다.
   */
  position: relative;
  ${({ $side }) => ($side === 'left' ? 'justify-self: start;' : 'justify-self: end;')}
  align-self: end;
  width: ${MASCOT_WIDTH};
  height: auto;
  ${({ $side }) =>
    $side === 'left'
      ? `margin: 0 0 ${MASCOT_INSET} ${MASCOT_INSET};`
      : `margin: 0 ${MASCOT_INSET} ${MASCOT_INSET} 0;`}
  pointer-events: none;
`;

/** 표 위의 한 줄 — 지금 몇 종목이 보이는지. 필터를 걸면 사용자가 잃는 맥락을 여기서 되돌려준다. */
export const TableMeta = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
`;

/** 출처 목록. `<dl>` 이 아니라 `<ul>` 인 이유: 각 항목이 "자료 하나"라는 동등한 낱개다. */
export const SourceList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const SourceItem = styled.li`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${space[2]};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
`;

export const SourceRole = styled.span`
  padding: 1px ${space[2]};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surfaceMuted};
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  white-space: nowrap;
`;

export const SourceLink = styled.a`
  color: ${color.brandText};
  text-decoration: none;
  overflow-wrap: anywhere;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }
`;

export const SourceDate = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
`;

/**
 * 출처 목록 아래의 한 줄. 지금은 위키피디아 CC BY-SA 4.0 표기가 여기 산다 —
 * 라이선스 고지는 "자료 하나"가 아니라 목록 전체에 걸리는 조건이라 `<ul>` 항목이 아니다.
 */
export const SourceNote = styled.p`
  margin: ${space[3]} 0 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
`;

/** 다른 목록으로 가는 카드 줄. 세 목록이 서로를 알고 있어야 하나만 보고 나가지 않는다. */
export const RelatedGrid = styled.nav`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: ${space[3]};

  ${media.down('mobileWide')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const RelatedCard = styled(Link)`
  ${surface(DATA_RADIUS, PANEL_PAD)};
  display: flex;
  flex-direction: column;
  gap: ${space[1]};
  border: 1px solid ${color.border};
  background: ${color.surface};
  color: ${color.text};
  text-decoration: none;

  &:hover,
  &:focus-visible {
    border-color: ${color.brandBorder};
  }
`;

export const RelatedTitle = styled.span`
  font-size: ${font.size.lg};
  font-weight: ${font.weight.semibold};
`;

export const RelatedMeta = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
`;

export const HubLink = styled(Link)`
  align-self: flex-start;
  color: ${color.brandText};
  font-size: ${font.size.sm};
  text-decoration: none;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }
`;
