import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/**
 * 화면 탭바 — 시트의 네 입력 탭을 앱에서도 탭으로.
 *
 * 🔴 **가로 탭바인 것이 여기서는 허용된다.** 형제인 `LedgerTabPicker` 는 "가로 탭바로 바꾸지 마라"고
 *    못 박혀 있는데, 그 금지는 **개수가 열려 있는 목록**(사용자 워크시트 1~20+개)에 대한 것이다.
 *    이 탭바는 **넷으로 닫혀** 있어 좁은 폭에서도 전부 보이고, 스크롤 뒤로 숨는 항목이 없다.
 *
 * ⚠ 넷을 넘기게 되면 이 판단이 무너진다. 탭을 더할 일이 생기면 그때는 셀렉트로 바꾸거나
 *   숨은 항목을 알리는 장치를 함께 만들어야 한다 — 그냥 다섯째를 더하지 마라.
 */

export const TabsRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[2]};
  min-width: 0;
`;

/**
 * 탭 줄. 🔴 좁은 폭에서 **줄바꿈**한다(스크롤이 아니다) — 넷뿐이라 두 줄이면 다 보이고,
 * 가로 스크롤은 숨은 항목을 만든다.
 */
export const TabList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[1]};
  min-width: 0;
  padding: ${space[1]};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
`;

/**
 * 탭 하나.
 *
 * 🔴 고른 탭을 **색만으로** 표시하지 않는다 — 배경면과 글자 굵기가 함께 바뀐다(색 단독 채널 금지).
 * 🔴 막힌 탭은 `disabled` 지만 **사유가 아래 줄에 함께 선다** — 무음 비활성 금지.
 *    `aria-describedby` 로 그 문장을 가리킨다(같은 처방이 `LedgerMappingCard`·`LedgerTabPicker` 에도 있다).
 */
export const TabButton = styled.button<{ 'data-selected'?: boolean }>`
  flex: 0 1 auto;
  min-width: 0;
  padding: ${space[2]} ${space[3]};
  border: none;
  border-radius: ${radius.sm};
  background: ${(props) => (props['data-selected'] ? color.surface : 'transparent')};
  color: ${(props) => (props['data-selected'] ? color.text : color.textMuted)};
  font-size: ${font.size.sm};
  font-weight: ${(props) => (props['data-selected'] ? font.weight.bold : font.weight.medium)};
  cursor: pointer;
  transition: background ${motion.fast}, color ${motion.fast};

  &:hover:not(:disabled) {
    color: ${color.text};
  }

  &:disabled {
    cursor: not-allowed;
    /* 흐리게만 하지 않는다 — 아래 사유 줄이 왜 막혔는지 말한다. */
    opacity: 0.55;
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/** 고른 탭이 무엇인지 한 줄. 탭 줄 바로 아래에 선다. */
export const TabDescription = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  line-height: 1.55;
  color: ${color.textMuted};
`;
