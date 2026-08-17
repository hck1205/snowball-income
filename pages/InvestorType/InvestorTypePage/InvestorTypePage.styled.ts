import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { DATA_RADIUS, color, font, media, motion, pageHue, pageHueMix, radius, space } from '@/shared/styles';

/* --------------------------------------------------------------------------
 * 투자 성향 테스트 — 문항 화면과 결과 화면이 같은 라우트를 쓴다(쿼리로 갈린다).
 *
 * 🔴 **모달이 아니다.** 정식 라우트라 새로고침·뒤로 가기·공유가 전부 산다. 12문항짜리 흐름을
 * 모달로 만들면 중간에 새로고침한 사용자가 답안을 통째로 잃는다.
 * ⚠ 진입 애니메이션 금지(랜딩과 같은 규율). 호버·누름만 기존 토큰 안에서 쓴다.
 * -------------------------------------------------------------------------- */

export const Stack = styled.div`
  display: grid;
  gap: ${space[5]};
  max-width: 760px;
  margin: 0 auto;
  padding: ${space[5]} ${space[4]} ${space[8]};
`;

/** 진행률. 🔴 숫자와 막대를 **함께** 준다 — 막대만 있으면 "몇 개 남았나"에 답하지 못한다. */
export const Progress = styled.div`
  display: grid;
  gap: ${space[2]};
`;

export const ProgressText = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  color: ${color.textMuted};
`;

export const ProgressTrack = styled.div`
  height: 4px;
  border-radius: 999px;
  background: ${color.border};
  overflow: hidden;
`;

export const ProgressFill = styled.div<{ $percent: number }>`
  width: ${({ $percent }) => $percent}%;
  height: 100%;
  background: ${pageHue};
  transition: width ${motion.ease};
`;

/**
 * 지금 문항이 **무엇을 재는지** 말한다.
 *
 * 없을 때는 12문항이 서로 무관한 질문 더미로 읽혔다 — 사용자가 "이걸 왜 묻지"를 품은 채 답하면
 * 답이 대충 나오고, 그 답으로 낸 유형은 틀린다. 축을 밝히면 같은 축의 세 문항이 한 묶음으로 읽힌다.
 * ⚠ 점수를 노출하는 것이 아니다 — 어느 쪽이 "좋은" 답인지는 여전히 말하지 않는다.
 */
export const AxisBadge = styled.span`
  align-self: start;
  padding: ${space[1]} ${space[2]};
  border-radius: ${radius.pill};
  background: ${pageHueMix(12)};
  color: ${color.text};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
`;

export const QuestionCard = styled.section`
  display: grid;
  gap: ${space[3]};
`;

export const QuestionContext = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  line-height: 1.6;
  color: ${color.textMuted};
`;

export const QuestionTitle = styled.h1`
  margin: 0;
  font-size: ${font.size['2xl']};
  font-weight: ${font.weight.bold};
  line-height: 1.4;
  color: ${color.text};
`;

export const OptionList = styled.ul`
  display: grid;
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;
`;

/**
 * 선택지. 🔴 **버튼이다**(라디오가 아니다). 고르는 즉시 다음 문항으로 넘어가는 흐름이라
 * "고르고 → 다음 누르기" 두 동작을 하나로 줄인다. 12문항에서 그 차이가 24번의 클릭이 된다.
 */
export const OptionButton = styled.button`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: ${space[3]};
  width: 100%;
  padding: ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${DATA_RADIUS};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.base};
  line-height: 1.5;
  text-align: left;
  cursor: pointer;
  transition: border-color ${motion.ease}, background ${motion.ease}, transform ${motion.exit};

  &:hover {
    border-color: ${pageHue};
    background: ${pageHueMix(6)};
  }

  /* 누르는 순간의 피드백. 🔴 이동은 1px 이하다 — 12번 반복되는 동작이라 크게 움직이면 멀미가 난다. */
  &:active {
    transform: translateY(1px);
  }
`;

/**
 * 선택지 번호. **키보드 힌트를 겸한다** — `1`~`4` 로 고를 수 있다는 것을 화면이 직접 말한다.
 * ⚠ `aria-hidden` 이다. 낭독기에는 버튼 이름(선택지 문장)만 들려야 한다 — "일, 팝니다"로 두 번
 *   읽히면 안 된다. 키보드 안내는 목록 위 `KeyHint` 가 한 번만 말한다.
 */
export const OptionOrder = styled.span`
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 1px solid ${color.border};
  border-radius: ${radius.sm};
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  font-variant-numeric: tabular-nums;
`;

/** 키보드로도 된다는 안내. 좁은 화면(터치)에서는 의미가 없어 감춘다. */
export const KeyHint = styled.p`
  display: none;
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};

  ${media.up('mobileWide')} {
    display: block;
  }
`;

export const NavRow = styled.div`
  display: flex;
  gap: ${space[3]};
  align-items: center;
`;

export const GhostButton = styled.button`
  padding: ${space[2]} 0;
  border: 0;
  background: none;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
  cursor: pointer;

  &:hover {
    color: ${color.text};
    text-decoration: underline;
  }
`;

/* ── 결과 ─────────────────────────────────────────────────────────────── */

export const ResultHead = styled.header`
  display: grid;
  gap: ${space[2]};
`;

export const ResultEyebrow = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  color: ${color.textMuted};
`;

export const ResultTitle = styled.h1`
  margin: 0;
  font-size: ${font.size['3xl']};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const ResultTagline = styled.p`
  margin: 0;
  font-size: ${font.size.lg};
  line-height: 1.6;
  color: ${color.text};
`;

export const ResultBody = styled.p`
  margin: 0;
  font-size: ${font.size.base};
  line-height: 1.7;
  color: ${color.textMuted};
`;

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
export const AxisName = styled.h3`
  margin: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;

export const AxisCaption = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  line-height: 1.5;
  color: ${color.textMuted};
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

export const MatchList = styled.ul`
  display: grid;
  gap: ${space[3]};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const MatchItem = styled.li`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: ${space[3]};
`;

/**
 * 이니셜 원. 사진을 쓰지 않는다 — 실존 인물의 초상은 권리 문제가 따르고, 여기서 필요한 것은
 * "누구인지"가 아니라 **목록에서 항목을 가르는 앵커**다(`pages/Investors` 가 같은 판단을 했다).
 * ⚠ `aria-hidden` 이다. 이름은 바로 옆에 글자로 있다.
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
 * 구성 비중 막대. **숫자만 나열하면 "무엇이 주인공인지"가 안 읽힌다** — 30/20/15/15/10/10 을
 * 눈으로 더해야 한다. 한 줄 막대는 그걸 한눈에 준다.
 * 🔴 색은 hue 한 계열의 농도 차이로만 가른다. 여섯 종목에 여섯 색을 주면 그 순간 이 패널이
 *   화면에서 가장 시끄러운 요소가 된다(결과의 주인공은 유형이지 구성이 아니다).
 */
export const AllocationBar = styled.div`
  display: flex;
  height: 8px;
  border-radius: ${radius.pill};
  overflow: hidden;
`;

export const AllocationSegment = styled.span<{ $weight: number; $depth: number }>`
  flex: ${({ $weight }) => $weight} 0 0;
  background: ${({ $depth }) => pageHueMix($depth)};
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

export const AllocationItem = styled.li`
  display: flex;
  gap: ${space[1]};
  font-variant-numeric: tabular-nums;
`;

export const AllocationTicker = styled.strong`
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;

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

/** 복사 결과 안내. `role="status"` 로 낭독기에도 전해진다(무음 성공 금지). */
export const ShareNotice = styled.span`
  font-size: ${font.size.sm};
  color: ${color.textMuted};
`;

/** 면책. 🔴 결과가 조언으로 읽히지 않게 하는 줄이라 지우지 마라(투자 권유 금지 규율). */
export const Disclaimer = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  line-height: 1.6;
  color: ${color.textMuted};
`;
