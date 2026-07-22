import styled from '@emotion/styled';
import { color, font, motion, radius, shadow, space } from '@/shared/styles';

/*
 * 색 규율: 전부 시맨틱 토큰(var(--sb-*)) — 새 hex 0.
 * styled 커스텀 prop 이름은 유효 HTML 어트리뷰트를 피한다(ratio/ratioLeft/ratioRight 는
 * 표준 속성이 아니라 is-prop-valid 가 걸러 DOM 으로 새지 않는다). min/max/value/size 는 금지.
 */

export const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[2]};
  min-width: 0;
`;

export const Header = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[2]};
`;

export const Label = styled.span`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
`;

export const ValueReadout = styled.span`
  font-size: ${font.size.sm};
  color: ${color.textMuted};
  ${font.numeric}
`;

/** 썸이 트랙 밖으로 넘치지 않도록 여백을 준 상호작용 영역(터치 타깃 확보). */
export const TrackArea = styled.div`
  position: relative;
  height: 28px;
  display: flex;
  align-items: center;
  padding: 0 9px;
  touch-action: none;
`;

/** 회색 베이스 레일. */
export const Track = styled.div`
  position: absolute;
  left: 9px;
  right: 9px;
  height: 4px;
  border-radius: ${radius.pill};
  background: ${color.borderStrong};
`;

/** 두 썸 사이 채움. left/right 를 비율로 잡아 두 썸 위치를 그대로 반영한다. */
export const Fill = styled.div<{ ratioLeft: number; ratioRight: number }>`
  position: absolute;
  top: 50%;
  height: 4px;
  border-radius: ${radius.pill};
  background: ${color.brand};
  transform: translateY(-50%);
  left: calc(9px + (100% - 18px) * ${({ ratioLeft }) => ratioLeft});
  right: calc(9px + (100% - 18px) * ${({ ratioRight }) => 1 - ratioRight});
`;

/**
 * 드래그 썸. ratio(0~1)로 좌표를 잡고 translateX(-50%)로 중앙 정렬한다.
 * upper 는 겹칠 때 위로 올려 항상 잡히게 한다.
 */
export const Thumb = styled.button<{ ratio: number; upper: boolean }>`
  position: absolute;
  top: 50%;
  left: calc(9px + (100% - 18px) * ${({ ratio }) => ratio});
  width: 18px;
  height: 18px;
  margin: 0;
  padding: 0;
  border-radius: ${radius.pill};
  border: 2px solid ${color.brand};
  background: ${color.surface};
  box-shadow: ${shadow.e1};
  transform: translate(-50%, -50%);
  cursor: grab;
  z-index: ${({ upper }) => (upper ? 2 : 1)};
  transition: border-color ${motion.fast} ${motion.ease}, box-shadow ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.brandText};
  }

  &:active {
    cursor: grabbing;
  }

  &:focus-visible {
    outline: none;
    border-color: ${color.focusRing};
    box-shadow: 0 0 0 3px ${color.focusShadow};
  }
`;

export const InputsRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
`;

/** 숫자 입력 셸 — focus-within 링 한 겹(전역 input 링과 이중으로 그려지지 않게). */
export const FieldShell = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  height: 34px;
  padding: 0 ${space[3]};
  border-radius: ${radius.md};
  border: 1px solid ${color.borderStrong};
  background: ${color.surface};
  min-width: 0;
  flex: 1 1 0;
  transition: border-color ${motion.fast} ${motion.ease}, box-shadow ${motion.fast} ${motion.ease};

  &:focus-within {
    border-color: ${color.focusRing};
    box-shadow: 0 0 0 3px ${color.focusShadow};
  }
`;

export const Prefix = styled.span`
  flex: 0 0 auto;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
`;

export const Suffix = styled.span`
  flex: 0 0 auto;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
`;

export const NumberInput = styled.input`
  border: 0;
  background: transparent;
  outline: none;
  min-width: 0;
  flex: 1 1 auto;
  width: 100%;
  color: ${color.text};
  font-family: inherit;
  font-size: ${font.size.sm};
  ${font.numeric}

  &:focus,
  &:focus-visible {
    outline: none;
    box-shadow: none;
  }

  &::placeholder {
    color: ${color.textMuted};
  }
`;

export const RangeSep = styled.span`
  flex: 0 0 auto;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
`;
