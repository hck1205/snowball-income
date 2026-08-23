import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/**
 * 종목별 재투자. 전역 재투자 컨트롤 **바로 아래**에 서므로 카드를 따로 두지 않고
 * 구분선 하나로 묶는다 — 같은 주제(재투자)의 상세이지 다른 주제가 아니다.
 */
export const RoutingRoot = styled.div`
  margin-top: ${space[3]};
  padding-top: ${space[3]};
  border-top: 1px solid ${color.border};
  display: grid;
  gap: ${space[2]};
`;

export const RoutingHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${space[1]} ${space[2]};
`;

export const RoutingTitle = styled.span`
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
`;

/** 기준 문구. 값이 아니라 안내라 흐리게 둔다. */
export const RoutingNote = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
`;

/**
 * 카드 줄. 접힌 종목과 펼친 종목이 **같은 흐름**에 섞여 흐른다 — 그래서 펼침이 "그 자리에서
 * 자란 것"으로 읽히고 목록이 위아래로 재배치되지 않는다.
 *
 * ⚠ `align-items: stretch` 다. 접힌 카드와 펼친 카드의 높이가 달라도 한 줄 안에서 위가 맞는다.
 */
export const RoutingCardList = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: ${space[2]};
`;

/**
 * 카드의 공통 기하 — **사각형**이다(2026-08-23 사용자 지시).
 *
 * 처음에는 칩(pill)으로 만들었는데, 그 안에 셀렉트·숫자 입력 같은 사각 컨트롤을 넣으니 모서리가
 * 서로 싸워 무슨 UI 인지 읽히지 않았다. 담는 그릇과 담기는 것의 모서리를 맞춘다.
 */
const cardBase = `
  display: flex;
  flex-direction: column;
  gap: ${space[1]};
  min-width: 132px;
  padding: ${space[2]} ${space[3]};
  border-radius: ${radius.sm};
  text-align: left;
  font-family: inherit;
`;

/**
 * 접힌 카드. **누르는 것**이라 버튼이고, 두 줄로 종목과 현재 설정을 함께 말한다.
 *
 * 🔴 접근성 이름을 `aria-label` 로 덮지 않는다 — 눈으로 읽는 문장이 곧 낭독 문장이어야 이 카드가
 *    무엇을 말하는지 두 사용자가 같은 것을 얻는다(테스트도 그 문장으로 잡는다).
 */
export const RoutingCard = styled.button<{ routed?: boolean }>`
  ${cardBase};
  border: 1px solid ${({ routed }) => (routed ? color.brandBorder : color.border)};
  background: ${({ routed }) => (routed ? color.brandSubtle : color.surface)};
  cursor: pointer;
  transition: border-color ${motion.fast} ${motion.ease}, background-color ${motion.fast} ${motion.ease};

  &:hover:not(:disabled) {
    border-color: ${color.brandBorder};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

/** 종목 이름. 카드에서 가장 먼저 읽히는 줄이다. */
export const RoutingCardName = styled.span`
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  line-height: ${font.leading.tight};
  white-space: nowrap;
`;

/** 현재 설정 줄 — `재투자 100%` · `재투자 50%`. 값이라 숫자 서체를 쓴다. */
export const RoutingCardState = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: ${space[1]};
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.tight};
  white-space: nowrap;
  ${font.numeric};
`;

/**
 * 목적지 표기(`→ SCHD`). 브랜드 톤을 **여기에만** 준다 — 이 카드가 남과 다른 유일한 이유라
 * 그 사실이 색으로 먼저 읽혀야 한다.
 */
export const RoutingCardTarget = styled.span`
  color: ${color.brandText};
  font-weight: ${font.weight.semibold};
`;

/** 펼친 카드. 접힌 카드와 **같은 사각형**이고 안쪽 컨트롤 줄만 더 갖는다. */
export const RoutingEditor = styled.div`
  ${cardBase};
  gap: ${space[2]};
  border: 1px solid ${color.brandBorder};
  background: ${color.surface};
`;

export const RoutingEditorHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[2]};
`;

/** 컨트롤 줄 — 비율 · 화살표 · 목적지. 좁은 패널에서도 접히지 않게 각자 폭을 좁게 잡는다. */
export const RoutingEditorControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[1]};
`;

/** 목적지 앞의 화살표. 글자 라벨("보낼 곳") 대신 폭을 아끼는 장식이라 낭독에서 뺀다. */
export const RoutingArrow = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: 1;
`;

/**
 * 비율 입력 + 단위. 🔴 `%` 를 입력 **바깥에** 둔다 — 레포의 기존 재투자 입력
 * (`InvestmentSettings.styled` 의 `ReinvestPercentField`)과 같은 관례다.
 *
 * 안쪽에 절대배치했더니 `type="number"` 의 스피너와 자리를 다퉈 `100%` 가 잘렸다
 * (2026-08-23 사용자 신고). 브라우저가 그 자리를 얼마나 쓸지는 우리가 정할 수 없다.
 */
export const RoutingPercentField = styled.span`
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  gap: ${space[1]};
`;

export const RoutingPercentInput = styled.input`
  /* 기존 재투자 입력(64px)과 같은 폭 — 스피너가 붙어도 세 자리가 들어간다. */
  width: 68px;
  min-width: 0;
  /* 셀렉트(sm)와 같은 32px — 한 줄 안에서 높이가 어긋나면 그것만으로 깨져 보인다. */
  height: 32px;
  box-sizing: border-box;
  padding: 0 ${space[2]};
  border: 1px solid ${color.borderStrong};
  border-radius: ${radius.sm};
  background-color: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.xs};
  font-family: inherit;
  text-align: right;
  ${font.numeric}

  &:disabled {
    background: ${color.surfaceSunken};
    color: ${color.textMuted};
    cursor: not-allowed;
  }
`;

/** 단위 표기. 값이 아니라 장식이라 낭독에서 뺀다(호출부가 `aria-hidden`). */
export const RoutingPercentSuffix = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: 1;
`;

/** 접기. 값을 지우는 버튼이 아니라 **보기를 접는** 버튼이라 크롬 톤으로만 둔다. */
export const RoutingCloseButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: ${radius.sm};
  background: none;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
  font-family: inherit;
  line-height: 1;
  cursor: pointer;

  &:hover {
    background: ${color.surfaceSunken};
    color: ${color.text};
  }
`;
