import styled from '@emotion/styled';
import { color, font, media, motion, radius, shadow, space, zIndex } from '@/shared/styles';

/**
 * 모달의 시각 언어 — 앱의 모든 모달(도움말/티커/프리셋 확인)이 이걸 공유한다.
 *
 * 이 파일이 스타일의 단일 출처다. `pages/Main/Main.shared.styled.ts`가 여기서 다시 내보내기 때문에
 * 기존 호출부(TickerModal, MainRightPanel)는 import 한 줄도 안 바꾸고 새 스킨을 받는다.
 */

export const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: ${color.overlay};
  backdrop-filter: blur(3px);
  display: grid;
  place-items: center;
  padding: ${space[4]};
  z-index: ${zIndex.modal};
  contain: paint;

  @media (prefers-reduced-motion: no-preference) {
    animation: sb-modal-fade ${motion.base} ${motion.ease};
  }

  @keyframes sb-modal-fade {
    from {
      opacity: 0;
    }
  }
`;

export const ModalPanel = styled.section`
  width: min(520px, 100%);
  max-height: min(88vh, 760px);
  background: ${color.surfaceRaised};
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  padding: ${space[5]};
  display: grid;
  gap: ${space[3]};
  align-content: start;
  overflow-y: auto;
  scrollbar-gutter: stable;
  box-shadow: ${shadow.e3};
  color: ${color.text};

  @media (prefers-reduced-motion: no-preference) {
    animation: sb-modal-rise ${motion.base} ${motion.ease};
  }

  @keyframes sb-modal-rise {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.98);
    }
  }

  ${media.down('mobileWide')} {
    padding: ${space[4]};
  }
`;

export const ModalTitle = styled.h3`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size['2xl']};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.02em;
`;

export const ModalBody = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: ${font.leading.relaxed};
  white-space: pre-line;

  strong {
    color: ${color.text};
    font-weight: ${font.weight.semibold};
  }
`;

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${space[2]};
  margin-top: ${space[1]};
`;
