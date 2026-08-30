import styled from '@emotion/styled';
import { DATA_RADIUS, color, font, media, motion, pageHue, pageHueMix, radius, space } from '@/shared/styles';

/* --------------------------------------------------------------------------
 * 투자 성향 테스트 — **문항 화면**의 스타일.
 *
 * 🔴 2026-08-30 에 페이지 스타일 파일(661줄)에서 갈라 냈다. 두 화면은 같은 라우트를 쓰지만
 * **함께 보이는 일이 없어서**(쿼리로 갈린다), 한 파일에 두면 어느 규칙이 어느 화면 것인지
 * 읽는 사람이 매번 되짚어야 했다. 실제로 공유하던 것은 Stack·Disclaimer 둘뿐이고 그 둘만
 * 페이지 쪽에 남겼다.
 *
 * ⚠ 진입 애니메이션 금지(랜딩과 같은 규율). 호버·누름만 기존 토큰 안에서 쓴다.
 * ⚠ styled 템플릿 안 CSS 주석에 **백틱을 넣지 마라** — Emotion 이 그 자리에서 끊긴다.
 *   (node tools/dev/styled-comment-backticks.mjs 가 잡는다.)
 * -------------------------------------------------------------------------- */

/**
 * 지금 문항이 **무엇을 재는지** 말한다.
 *
 * 없을 때는 12문항이 서로 무관한 질문 더미로 읽혔다 — 사용자가 "이걸 왜 묻지"를 품은 채 답하면
 * 답이 대충 나오고, 그 답으로 낸 유형은 틀린다. 축을 밝히면 같은 축의 세 문항이 한 묶음으로 읽힌다.
 * ⚠ 점수를 노출하는 것이 아니다 — 어느 쪽이 "좋은" 답인지는 여전히 말하지 않는다.
 */
export const AxisBadge = styled.span`
  /*
   * 🔴 justify-self 다. align-self 였을 때 이 칩이 **카드 전폭을 채운 초록 막대**로 보였다
   * (2026-08-27 실측 — 사용자가 "허접하다"고 지적한 화면의 가장 큰 원인). 부모가 grid 라
   * align 은 블록축(세로)을 정하고, 인라인축은 기본값 stretch 로 남는다.
   */
  justify-self: start;
  padding: ${space[1]} ${space[3]};
  border: 1px solid ${pageHueMix(24)};
  border-radius: ${radius.pill};
  background: ${pageHueMix(10)};
  color: ${color.text};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
`;

/**
 * 🔴 **카드다**(2026-08-27). 그전에는 페이지 배경 위의 맨 grid 라 문항·선택지·안내가 서로 다른
 * 층인지 같은 층인지 화면이 말하지 않았고, 넓은 폭에서는 좁은 글 뭉치가 빈 화면에 떠 있었다.
 * 담아 두면 "이 문항"이 하나의 단위로 읽힌다.
 */

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

/**
 * 🔴 **카드다**(2026-08-27). 그전에는 유형 이름·한 줄 정의·설명이 페이지 배경 위의 맨 텍스트라,
 * 12문항을 다 푼 **보상**으로 읽히지 않았다 — 아래 패널 넷은 카드인데 정작 결과만 카드가 아니었다.
 * ⚠ 틴트는 hue 한 계열의 옅은 면이다. 화려하게 만들면 그 아래 축·구성 패널이 안 읽힌다.
 */

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

/**
 * 선택지. 🔴 **버튼이다**(라디오가 아니다). 고르는 즉시 다음 문항으로 넘어가는 흐름이라
 * "고르고 → 다음 누르기" 두 동작을 하나로 줄인다. 12문항에서 그 차이가 24번의 클릭이 된다.
 */
export const OptionButton = styled.button`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: ${space[3]};
  width: 100%;
  padding: ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${DATA_RADIUS};
  background: ${color.surfaceMuted};
  color: ${color.text};
  font-size: ${font.size.base};
  line-height: 1.5;
  text-align: left;
  cursor: pointer;
  transition: border-color ${motion.ease}, background ${motion.ease}, transform ${motion.exit};

  ${media.up('mobileWide')} {
    padding: ${space[4]};
  }

  /*
   * 호버는 **셋을 한꺼번에** 바꾼다: 테두리·면·번호 배지. 2026-08-27 이전에는 테두리와 면만
   * 옅게 바뀌어서 어느 줄에 있는지 눈으로 잘 안 잡혔다(선택지가 넷이라 그 차이가 크다).
   */
  /*
   * 🔴 자식 강조는 **속성 선택자**로 건다. Emotion 컴포넌트 셀렉터(${'$'}{Child}:hover &)는 babel/swc
   * 플러그인이 있어야 하는데 이 프로젝트에는 없다 — 쓰면 런타임에 통째로 던진다(2026-08-27 실측:
   * 테스트 12건이 그 예외로 죽었다). 속성 선택자는 플러그인 없이 동작한다.
   */
  &:hover {
    border-color: ${pageHue};
    background: ${color.surface};
  }

  &:hover [data-option-order] {
    border-color: ${pageHueMix(30)};
    background: ${pageHueMix(14)};
    color: ${color.text};
  }

  &:hover [data-option-chevron] {
    color: ${pageHue};
    transform: translateX(2px);
  }

  /* 누르는 순간의 피드백. 🔴 이동은 1px 이하다 — 12번 반복되는 동작이라 크게 움직이면 멀미가 난다. */
  &:active {
    transform: translateY(1px);
  }
`;

/**
 * 선택지 번호. **키보드 힌트를 겸한다** — 1~4 로 고를 수 있다는 것을 화면이 직접 말한다.
 * ⚠ aria-hidden 이다. 낭독기에는 버튼 이름(선택지 문장)만 들려야 한다 — "일, 팝니다"로 두 번
 *   읽히면 안 된다. 키보드 안내는 목록 위 KeyHint 가 한 번만 말한다.
 */

/**
 * 꼬리 화살표 — 누를 수 있는 것임을 형태로 말한다.
 * ⚠ 평소에는 거의 안 보이고 호버에서만 진해진다. 넷이 늘 진하면 화면이 화살표 밭이 된다.
 */
export const OptionChevron = styled.span`
  display: inline-flex;
  color: ${color.border};
  /* 강조는 부모(OptionButton)가 [data-option-chevron] 로 건다. */
  transition: color ${motion.ease}, transform ${motion.ease};
`;

/** 키보드로도 된다는 안내. 좁은 화면(터치)에서는 의미가 없어 감춘다. */

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

/**
 * 선택지 번호. **키보드 힌트를 겸한다** — 1~4 로 고를 수 있다는 것을 화면이 직접 말한다.
 * ⚠ aria-hidden 이다. 낭독기에는 버튼 이름(선택지 문장)만 들려야 한다 — "일, 팝니다"로 두 번
 *   읽히면 안 된다. 키보드 안내는 목록 위 KeyHint 가 한 번만 말한다.
 */
export const OptionOrder = styled.span`
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  font-variant-numeric: tabular-nums;
  /* 강조는 부모(OptionButton)가 [data-option-order] 로 건다 — 위 주석의 이유. */
  transition: background ${motion.ease}, border-color ${motion.ease}, color ${motion.ease};
`;

/** 선택지 문장. 번호·꼬리표와 같은 줄에서 가운데 칸을 차지한다. */

/** 선택지 문장. 번호·꼬리표와 같은 줄에서 가운데 칸을 차지한다. */
export const OptionText = styled.span`
  min-width: 0;
  word-break: keep-all;
`;

/**
 * 꼬리 화살표 — 누를 수 있는 것임을 형태로 말한다.
 * ⚠ 평소에는 거의 안 보이고 호버에서만 진해진다. 넷이 늘 진하면 화면이 화살표 밭이 된다.
 */

/** 진행률. 🔴 숫자와 막대를 **함께** 준다 — 막대만 있으면 "몇 개 남았나"에 답하지 못한다. */
export const Progress = styled.div`
  display: grid;
  gap: ${space[2]};
`;

/** 현재 번호. 훑는 눈이 여기서 멈춘다 — 그래서 이 줄에서 유일하게 큰 글자다. */
export const ProgressCount = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: ${space[1]};
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  font-variant-numeric: tabular-nums;
  color: ${color.text};
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

export const ProgressRemain = styled.span`
  font-size: ${font.size.xs};
  color: ${color.textMuted};
`;

/** ⚠ 4px 은 화면에서 실선 한 줄로 읽혔다(2026-08-27 실측). 진행이 보이려면 두께가 필요하다. */

export const ProgressText = styled.p`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[2]};
  margin: 0;
`;

/** 현재 번호. 훑는 눈이 여기서 멈춘다 — 그래서 이 줄에서 유일하게 큰 글자다. */

/** ⚠ 4px 은 화면에서 실선 한 줄로 읽혔다(2026-08-27 실측). 진행이 보이려면 두께가 필요하다. */
export const ProgressTrack = styled.div`
  height: 8px;
  border-radius: 999px;
  background: ${pageHueMix(10)};
  overflow: hidden;
`;

/**
 * 🔴 **카드다**(2026-08-27). 그전에는 페이지 배경 위의 맨 grid 라 문항·선택지·안내가 서로 다른
 * 층인지 같은 층인지 화면이 말하지 않았고, 넓은 폭에서는 좁은 글 뭉치가 빈 화면에 떠 있었다.
 * 담아 두면 "이 문항"이 하나의 단위로 읽힌다.
 */
export const QuestionCard = styled.section`
  display: grid;
  gap: ${space[3]};
  padding: ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surface};

  ${media.up('mobileWide')} {
    gap: ${space[4]};
    padding: ${space[6]};
  }
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

/**
 * 이 화면이 무엇인지 말하는 한 줄.
 *
 * 🔴 2026-08-27 신설. 그전에는 화면이 진행률(1 / 12)로 **갑자기 시작**해서, 링크를 받고 들어온
 * 사람이 무엇을 하는 곳인지 알 수 없었다. 히어로를 통째로 세우지 않은 것은 의도다 — 12문항짜리
 * 흐름에서 제목이 크면 매 문항 화면 위쪽을 그만큼 잡아먹는다.
 */
export const QuizEyebrow = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  letter-spacing: 0.02em;
  color: ${pageHue};
`;

/** 진행률. 🔴 숫자와 막대를 **함께** 준다 — 막대만 있으면 "몇 개 남았나"에 답하지 못한다. */
