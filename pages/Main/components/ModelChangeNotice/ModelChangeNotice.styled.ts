import styled from '@emotion/styled';
import { color, font, media, motion, radius, space, TOUCH_TARGET } from '@/shared/styles';

/**
 * 색은 전부 `shared/styles` 토큰(`var(--sb-*)`)이라 라이트/다크가 자동으로 따라온다.
 * 본문/각주에 `textMuted`를 쓰지 않는 이유: `brandSubtle` 배경 위에서 대비가 라이트 4.24:1,
 * 다크 4.00:1 로 WCAG AA(4.5:1)에 못 미친다. `textSecondary`는 각각 6.2:1 / 6.5:1 로 통과한다.
 */
export const NoticeBanner = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: ${space[3]};
  align-items: start;
  padding: ${space[4]};
  border: 1px solid ${color.brandBorder};
  border-radius: ${radius.md};
  background: ${color.brandSubtle};
  color: ${color.text};

  ${media.down('mobileWide')} {
    padding: ${space[3]};
    gap: ${space[2]};
  }
`;

export const NoticeContent = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

export const NoticeTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.md};
  font-weight: ${font.weight.semibold};
  line-height: ${font.leading.tight};
`;

export const NoticeBody = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  overflow-wrap: anywhere;
`;

export const NoticeEmphasis = styled.strong`
  color: ${color.text};
  font-weight: ${font.weight.semibold};
`;

export const NoticeFootnote = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
`;

export const NoticeCloseButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  /* 터치 타겟 44x44 (WCAG 2.5.5). 음수 마진으로 시각적 여백은 배너 패딩과 맞춘다. */
  width: ${TOUCH_TARGET};
  height: ${TOUCH_TARGET};
  margin: -${space[2]} -${space[2]} 0 0;
  border: 1px solid transparent;
  border-radius: ${radius.sm};
  background: transparent;
  color: ${color.textSecondary};
  font-family: inherit;
  font-size: ${font.size.xl};
  line-height: 1;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.brandSubtleHover};
    color: ${color.text};
  }
`;
