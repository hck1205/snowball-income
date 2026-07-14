import styled from '@emotion/styled';
import { HintText, ModalActions, ModalBody, TickerGridWrap, TickerItemButton, TickerList } from '@/pages/Main/Main.shared.styled';
import { color, font, radius, shadow, space, zIndex } from '@/shared/styles';

/** 기존 인라인 style 속성을 그대로 옮겨온 것 (마크업/동작 변화 없음). */

/** 공유 링크 복사 토스트. 기존엔 배경/글자색이 하드코딩(#1f3341/#fff)이라 다크에서 깨졌다. */
export const ShareToast = styled.div`
  position: fixed;
  top: ${space[4]};
  left: 50%;
  transform: translateX(-50%);
  z-index: ${zIndex.tooltip};
  background: ${color.text};
  color: ${color.surface};
  border-radius: ${radius.sm};
  padding: ${space[3]} ${space[4]};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  box-shadow: ${shadow.e3};
`;

export const SaveModalHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: ${space[6]};
  margin-bottom: ${space[1]};
`;

export const FlushModalBody = styled(ModalBody)`
  margin: 0;
`;

export const SaveModalGuide = styled.span`
  display: block;
  margin-top: ${space[1]};
  font-size: ${font.size.xs};
  color: ${color.textMuted};
`;

export const FileErrorText = styled.span`
  color: ${color.danger};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
`;

export const ScrollableTickerGrid = styled(TickerGridWrap)`
  max-height: 220px;
  overflow-y: auto;
`;

export const SingleColumnTickerList = styled(TickerList)`
  grid-template-columns: 1fr;
`;

export const SavedSlotRow = styled.li`
  display: flex;
  gap: ${space[2]};
`;

export const SavedSlotButton = styled(TickerItemButton)`
  text-align: left;
  flex: 1;
`;

export const LoadSlotButton = styled(TickerItemButton)`
  text-align: left;
`;

export const SpreadModalActions = styled(ModalActions)`
  justify-content: space-between;
`;

export const ModalActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
`;

export const VisuallyHiddenFileInput = styled.input`
  display: none;
`;

export const CaptureErrorText = styled(HintText)`
  margin-top: ${space[2]};
  color: ${color.danger};
`;
