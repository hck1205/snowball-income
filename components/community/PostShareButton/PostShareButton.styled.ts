import styled from '@emotion/styled';
import { color, font, motion, radius, shadow, space, zIndex } from '@/shared/styles';

/**
 * 피드 카드/행의 아이콘 전용 공유 버튼 — 스탯과 같은 중립 톤(textMuted)이고 hover/focus만 brand로 뜬다.
 * 최소 터치 타깃(32px)을 유지하되 카드 흐름을 밀지 않게 배경 없이 앉는다. 위치(정렬)는 부모가
 * `styled(PostShareButton)`으로 덮으므로 여기선 자기 모양만 책임진다.
 */
export const ShareIconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: ${radius.pill};
  background: transparent;
  color: ${color.textMuted};
  cursor: pointer;
  transition: background ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceSunken};
    color: ${color.brand};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }

  svg {
    flex: 0 0 auto;
  }
`;

/** 복사 폴백 토스트 — 상세 페이지 공유 토스트와 동일 언어(토큰 대비 안전, body 포털). */
export const ShareToast = styled.div`
  position: fixed;
  top: ${space[4]};
  left: 50%;
  transform: translateX(-50%);
  z-index: ${zIndex.tooltip};
  max-width: min(92vw, 420px);
  background: ${color.text};
  color: ${color.surface};
  border-radius: ${radius.sm};
  padding: ${space[3]} ${space[4]};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  box-shadow: ${shadow.e3};
  word-break: break-all;
`;
