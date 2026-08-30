import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { DATA_RADIUS, color, font, media, motion, pageHue, pageHueMix, radius, space } from '@/shared/styles';

/* --------------------------------------------------------------------------
 * 투자 성향 테스트 — **결과 화면**의 스타일.
 *
 * 🔴 이 화면의 착지점은 PresetCta 하나다("이 구성으로 계산해 보기"). 이 지면에서 **채움 버튼은
 * 그것뿐**이어야 한다 — 다른 링크가 같은 무게를 가지면 테스트가 "재미로 해 봤다"로 끝난다.
 *
 * 갈라 낸 경위는 QuizView.styled.ts 머리말 참고(2026-08-30).
 * ⚠ styled 템플릿 안 CSS 주석에 백틱 금지.
 * -------------------------------------------------------------------------- */

/**
 * 구성 비중 막대. **숫자만 나열하면 "무엇이 주인공인지"가 안 읽힌다** — 30/20/15/15/10/10 을
 * 눈으로 더해야 한다. 한 줄 막대는 그걸 한눈에 준다.
 * 🔴 색은 hue 한 계열의 농도 차이로만 가른다. 여섯 종목에 여섯 색을 주면 그 순간 이 패널이
 *   화면에서 가장 시끄러운 요소가 된다(결과의 주인공은 유형이지 구성이 아니다).
 */
export const AllocationBar = styled.div`
  display: flex;
  /* ⚠ 8px 에서는 여섯 칸의 농도 차이가 눈에 안 잡혔다(2026-08-27 실측 — 한 덩어리로 보였다). */
  height: 14px;
  border-radius: ${radius.pill};
  overflow: hidden;
`;

/**
 * 한 종목의 몫.
 * ⚠ 칸 사이에 **면 색 1px 틈**을 둔다. 농도만으로 가르면 인접한 두 칸의 차이가 3%p 라 붙어 보인다 —
 *   틈이 있으면 농도가 비슷해도 "몇 칸인지"가 즉시 읽힌다. 마지막 칸은 틈을 두지 않는다.
 */

export const AllocationItem = styled.li`
  display: flex;
  gap: ${space[1]};
  font-variant-numeric: tabular-nums;
`;

export const AllocationLegend = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[1]} ${space[3]};
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
`;

/**
 * 한 종목의 몫.
 * ⚠ 칸 사이에 **면 색 1px 틈**을 둔다. 농도만으로 가르면 인접한 두 칸의 차이가 3%p 라 붙어 보인다 —
 *   틈이 있으면 농도가 비슷해도 "몇 칸인지"가 즉시 읽힌다. 마지막 칸은 틈을 두지 않는다.
 */
export const AllocationSegment = styled.span<{ $weight: number; $depth: number }>`
  flex: ${({ $weight }) => $weight} 0 0;
  background: ${({ $depth }) => pageHueMix($depth)};

  & + & {
    border-left: 1px solid ${color.surface};
  }
`;

export const AllocationTicker = styled.strong`
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;

/**
 * 결과 공유. 🔴 **버튼이지 링크가 아니다** — 누르면 이동하는 것이 아니라 주소를 복사한다.
 * 링크로 만들면 사용자가 새 탭이 열릴 것을 기대한다.
 */

export const AxisCaption = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  line-height: 1.5;
  color: ${color.textMuted};
`;

/**
 * 축 위의 위치. 🔴 채우기가 아니라 **점**이다 — 채우면 "많을수록 좋다"로 읽히는데, 이 축들에는
 * 우열이 없다(양 끝이 서로 다른 성향일 뿐이다).
 */
export const AxisDot = styled.span<{ $percent: number }>`
  position: absolute;
  top: 50%;
  left: ${({ $percent }) => $percent}%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: ${pageHue};
  /* 링을 둘러 눈금·트랙 위에서도 점이 또렷하게 떠 보이게 한다. */
  box-shadow: 0 0 0 3px ${color.surface};
  transform: translate(-50%, -50%);
`;

export const AxisHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[2]};
`;

export const AxisLabels = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${space[2]};
  font-size: ${font.size.xs};
  color: ${color.textMuted};
`;

/**
 * 축 **이름**. 🔴 예전에는 이 줄이 아예 없었다 — 양 끝 라벨("소수 집중"·"넓은 분산")만 있고
 * 무엇을 재는 축인지는 화면 어디에도 없었다. 사용자는 네 개의 막대를 보면서 그것들이 서로 무슨
 * 관계인지 알 수 없었다.
 */
export const AxisName = styled.h3`
  margin: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;

export const AxisRow = styled.div`
  display: grid;
  gap: ${space[2]};
  padding: ${space[3]} 0;

  & + & {
    border-top: 1px solid ${color.border};
  }
`;

/**
 * 축 **이름**. 🔴 예전에는 이 줄이 아예 없었다 — 양 끝 라벨("소수 집중"·"넓은 분산")만 있고
 * 무엇을 재는 축인지는 화면 어디에도 없었다. 사용자는 네 개의 막대를 보면서 그것들이 서로 무슨
 * 관계인지 알 수 없었다.
 */

export const AxisTrack = styled.div`
  position: relative;
  height: 6px;
  border-radius: 999px;
  /* 양 끝이 서로 다른 성향일 뿐 우열이 없다 — 그래서 한쪽만 진한 그라데이션을 쓰지 않는다. */
  background: ${color.border};

  /* 가운데 눈금. 점이 어느 쪽으로 기울었는지 읽으려면 기준선이 있어야 한다. */
  &::after {
    content: '';
    position: absolute;
    top: -3px;
    bottom: -3px;
    left: 50%;
    width: 1px;
    background: ${color.border};
  }
`;

/**
 * 축 위의 위치. 🔴 채우기가 아니라 **점**이다 — 채우면 "많을수록 좋다"로 읽히는데, 이 축들에는
 * 우열이 없다(양 끝이 서로 다른 성향일 뿐이다).
 */

/**
 * 이니셜 원. 사진을 쓰지 않는다 — 실존 인물의 초상은 권리 문제가 따르고, 여기서 필요한 것은
 * "누구인지"가 아니라 **목록에서 항목을 가르는 앵커**다(pages/Investors 가 같은 판단을 했다).
 * ⚠ aria-hidden 이다. 이름은 바로 옆에 글자로 있다.
 */
export const MatchAvatar = styled.span`
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: ${radius.pill};
  background: ${pageHueMix(14)};
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
`;

export const MatchBody = styled.div`
  display: grid;
  gap: ${space[1]};
  min-width: 0;
`;

export const MatchItem = styled.li`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: ${space[3]};
`;

/**
 * 이니셜 원. 사진을 쓰지 않는다 — 실존 인물의 초상은 권리 문제가 따르고, 여기서 필요한 것은
 * "누구인지"가 아니라 **목록에서 항목을 가르는 앵커**다(pages/Investors 가 같은 판단을 했다).
 * ⚠ aria-hidden 이다. 이름은 바로 옆에 글자로 있다.
 */

export const MatchList = styled.ul`
  display: grid;
  gap: ${space[3]};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const MatchName = styled.strong`
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;

export const MatchWhy = styled.span`
  font-size: ${font.size.sm};
  line-height: 1.6;
  color: ${color.textMuted};
`;

export const NextGrid = styled.ul`
  display: grid;
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;

  ${media.up('mobileWide')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const NextLink = styled(Link)`
  display: block;
  padding: ${space[3]} ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${DATA_RADIUS};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  text-decoration: none;
  transition: border-color ${motion.ease}, background ${motion.ease};

  &:hover {
    border-color: ${color.textMuted};
    background: ${color.surfaceHover};
  }
`;

/**
 * 🔴 **이 화면의 착지점.** 성향 테스트가 "재미로 해 봤다"로 끝나느냐 "실제로 계산까지 했다"로
 * 이어지느냐가 이 버튼 하나에 걸려 있다.
 *
 * ⚠ 2026-08-27 이전에는 `NextLink`(흐린 테두리, 전폭 흰 면)를 그대로 썼다 — 화면에서 **가장 중요한
 *   것이 가장 약했다**. 지금은 이 지면에서 유일한 채움 버튼이고, "이어서 볼 곳"은 여전히 NextLink 다.
 * ⚠ 채움은 brand 램프를 쓴다 — 그 면 위 글자색(`onBrand`)만 전 프리셋에서 대비가 보증돼 있다.
 */

export const Panel = styled.section`
  display: grid;
  gap: ${space[3]};
  padding: ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${DATA_RADIUS};
  background: ${color.surface};
`;

export const PanelTitle = styled.h2`
  margin: 0;
  font-size: ${font.size.md};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;

/**
 * 🔴 **이 화면의 착지점.** 성향 테스트가 "재미로 해 봤다"로 끝나느냐 "실제로 계산까지 했다"로
 * 이어지느냐가 이 버튼 하나에 걸려 있다.
 *
 * ⚠ 2026-08-27 이전에는 `NextLink`(흐린 테두리, 전폭 흰 면)를 그대로 썼다 — 화면에서 **가장 중요한
 *   것이 가장 약했다**. 지금은 이 지면에서 유일한 채움 버튼이고, "이어서 볼 곳"은 여전히 NextLink 다.
 * ⚠ 채움은 brand 램프를 쓴다 — 그 면 위 글자색(`onBrand`)만 전 프리셋에서 대비가 보증돼 있다.
 */
export const PresetCta = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${space[2]};
  padding: ${space[3]} ${space[5]};
  border: 1px solid transparent;
  border-radius: ${radius.pill};
  background: ${color.brand};
  color: ${color.onBrand};
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  text-decoration: none;
  transition: background ${motion.ease}, transform ${motion.exit};

  &:hover {
    background: ${color.brandHover};
  }

  &:active {
    transform: translateY(1px);
  }
`;

/**
 * 구성 비중 막대. **숫자만 나열하면 "무엇이 주인공인지"가 안 읽힌다** — 30/20/15/15/10/10 을
 * 눈으로 더해야 한다. 한 줄 막대는 그걸 한눈에 준다.
 * 🔴 색은 hue 한 계열의 농도 차이로만 가른다. 여섯 종목에 여섯 색을 주면 그 순간 이 패널이
 *   화면에서 가장 시끄러운 요소가 된다(결과의 주인공은 유형이지 구성이 아니다).
 */

export const ResultBody = styled.p`
  margin: 0;
  font-size: ${font.size.base};
  line-height: 1.7;
  color: ${color.textMuted};
`;

export const ResultEyebrow = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${pageHue};
`;

/**
 * 🔴 **카드다**(2026-08-27). 그전에는 유형 이름·한 줄 정의·설명이 페이지 배경 위의 맨 텍스트라,
 * 12문항을 다 푼 **보상**으로 읽히지 않았다 — 아래 패널 넷은 카드인데 정작 결과만 카드가 아니었다.
 * ⚠ 틴트는 hue 한 계열의 옅은 면이다. 화려하게 만들면 그 아래 축·구성 패널이 안 읽힌다.
 */
export const ResultHead = styled.header`
  display: grid;
  gap: ${space[2]};
  padding: ${space[5]} ${space[4]};
  border: 1px solid ${pageHueMix(20)};
  border-radius: ${radius.lg};
  background: ${pageHueMix(8)};

  ${media.up('mobileWide')} {
    padding: ${space[6]};
  }
`;

export const ResultTagline = styled.p`
  margin: 0;
  font-size: ${font.size.lg};
  line-height: 1.6;
  color: ${color.text};
`;

export const ResultTitle = styled.h1`
  margin: 0;
  font-size: ${font.size['3xl']};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const ShareButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  padding: ${space[2]} ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${DATA_RADIUS};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  cursor: pointer;
  transition: border-color ${motion.ease}, background ${motion.ease};

  &:hover {
    border-color: ${pageHue};
    background: ${pageHueMix(6)};
  }
`;

/** 복사 결과 안내. role="status" 로 낭독기에도 전해진다(무음 성공 금지). */

/**
 * "다시 해보기" — 복사 버튼 **오른쪽**에 선다(2026-08-18 사용자 지시).
 * 🔴 무게는 한 단 아래다. 결과 화면에서 사용자가 할 일은 공유하거나 이어서 보는 것이지 다시 푸는 게
 *   아니다 — 둘을 같은 버튼 모양으로 두면 "다시 하라"는 권유로 읽힌다.
 */
export const ShareGhost = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  padding: ${space[2]};
  border: 0;
  background: none;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
  cursor: pointer;

  &:hover {
    color: ${color.text};
  }
`;

/** 복사 결과 안내. role="status" 로 낭독기에도 전해진다(무음 성공 금지). */
export const ShareNotice = styled.span`
  font-size: ${font.size.sm};
  color: ${color.textMuted};
`;

/** 면책. 🔴 결과가 조언으로 읽히지 않게 하는 줄이라 지우지 마라(투자 권유 금지 규율). */

/**
 * 결과 공유. 🔴 **버튼이지 링크가 아니다** — 누르면 이동하는 것이 아니라 주소를 복사한다.
 * 링크로 만들면 사용자가 새 탭이 열릴 것을 기대한다.
 */
export const ShareRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[3]};

  /*
   * ⚠ 아이콘 보정 transform 을 쓰지 않는다. 이 줄의 글자는 본문 서체(sans)이고, 그 역할의
   *   잉크 보정값은 0 이다(shared/styles/heroTitleRow 의 INK_ABOVE_LINE_BOX). 보정이 필요한 것은
   *   display 서체(히어로 제목) 옆에 설 때다 — 여기서 흉내 내면 오히려 1px 뜬다.
   * ⚠ 이 주석에 백틱을 쓰지 마라 — 템플릿 리터럴이 그 자리에서 끊긴다(두 번째로 밟았다).
   */
`;

/**
 * "다시 해보기" — 복사 버튼 **오른쪽**에 선다(2026-08-18 사용자 지시).
 * 🔴 무게는 한 단 아래다. 결과 화면에서 사용자가 할 일은 공유하거나 이어서 보는 것이지 다시 푸는 게
 *   아니다 — 둘을 같은 버튼 모양으로 두면 "다시 하라"는 권유로 읽힌다.
 */
