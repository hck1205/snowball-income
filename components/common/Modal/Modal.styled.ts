import styled from '@emotion/styled';
import { color, font, media, motion, radius, shadow, space, subtleScrollbar, zIndex } from '@/shared/styles';
import type { OverlayPhase } from '@/shared/hooks';

/**
 * 모달의 시각 언어 — 앱의 모든 모달(도움말/티커/프리셋 확인)이 이걸 공유한다.
 *
 * 이 파일이 스타일의 단일 출처다. `pages/Main/Main.shared.styled.ts`가 여기서 다시 내보내기 때문에
 * 기존 호출부(TickerModal, MainRightPanel)는 import 한 줄도 안 바꾸고 새 스킨을 받는다.
 *
 * ## 진입 / 퇴장
 * `$phase` 를 주면 닫힐 때도 모션이 생긴다(`'exit'`). **주지 않으면 지금까지와 똑같이 진입만** 한다 —
 * 모달마다 라이프사이클이 달라 한 번에 옮길 수 없어서 옵트인으로 뒀다. 퇴장을 켜려면 호출부가
 * `useOverlayPresence` 로 닫힌 뒤에도 `MODAL_EXIT_MS` 동안 트리를 붙잡아 줘야 한다.
 *
 * 퇴장은 진입의 60%(200ms → 120ms)이고 이동 거리도 절반(8px → 4px)이다 — 사라지는 것은 이미
 * 관심 밖이라 같은 시간·같은 거리를 쓰면 "안 없어진다"로 느껴진다.
 * `forwards` 로 끝 프레임을 붙잡아 두지 않으면 마지막 프레임에서 원래 불투명도로 튄다.
 */

/** 퇴장 잔류 시간(ms). CSS 의 `motion.exit` 과 **같은 값**이어야 한다 — JS 가 트리를 붙잡는 시간이다. */
export const MODAL_EXIT_MS = 120;

export const ModalBackdrop = styled.div<{ $phase?: OverlayPhase }>`
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

    ${({ $phase }) =>
      $phase === 'exit' &&
      `
      animation: sb-modal-fade-out ${motion.exit} ${motion.ease} forwards;
      /* 닫는 순간 클릭이 백드롭에 또 닿으면 이미 닫힌 오버레이가 한 번 더 닫기를 부른다. */
      pointer-events: none;
    `}
  }

  @keyframes sb-modal-fade {
    from {
      opacity: 0;
    }
  }

  @keyframes sb-modal-fade-out {
    to {
      opacity: 0;
    }
  }
`;

export const ModalPanel = styled.section<{ $phase?: OverlayPhase }>`
  width: min(520px, 100%);
  max-height: min(88vh, 760px);
  /*
   * 서리유리(§4.7) — 폴백 불투명색을 먼저 깔고, 지원 브라우저에서만 글래스로 승격한다.
   * 다크 글래스 알파는 0.85 미만 금지(0.78에서는 밝은 teal 위 text-secondary 4.41:1로 탈락 실측).
   */
  background: ${color.surfaceGlassFallback};
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  padding: ${space[5]};
  display: grid;
  gap: ${space[3]};
  align-content: start;
  overflow-y: auto;
  scrollbar-gutter: stable;
  ${subtleScrollbar}
  box-shadow: ${shadow.e3};
  color: ${color.text};

  @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
    background: ${color.surfaceGlass};
    -webkit-backdrop-filter: blur(14px) saturate(1.35);
    backdrop-filter: blur(14px) saturate(1.35);
  }

  @media (prefers-reduced-motion: no-preference) {
    animation: sb-modal-rise ${motion.base} ${motion.ease};

    ${({ $phase }) =>
      $phase === 'exit' &&
      `animation: sb-modal-sink ${motion.exit} ${motion.ease} forwards;`}
  }

  @keyframes sb-modal-rise {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.98);
    }
  }

  /* 모달은 팝오버와 달리 트리거가 아니라 화면 중앙이 기준이다 — transform-origin 을 옮기지 않는다. */
  @keyframes sb-modal-sink {
    to {
      opacity: 0;
      transform: translateY(4px) scale(0.99);
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
