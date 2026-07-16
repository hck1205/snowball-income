import styled from '@emotion/styled';
import { color, font, motion, radius, shadow, space, zIndex } from '@/shared/styles';

export const AuthRoot = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
`;

export const SessionTrigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  height: 36px;
  padding: 0 ${space[2]} 0 ${space[1]};
  border-radius: ${radius.pill};
  border: 1px solid ${color.border};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  cursor: pointer;
  transition: background ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceHover};
    border-color: ${color.borderStrong};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const TriggerName = styled.span`
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 640px) {
    display: none;
  }
`;

export const Menu = styled.div`
  position: absolute;
  top: calc(100% + ${space[2]});
  right: 0;
  z-index: ${zIndex.dropdown};
  min-width: 180px;
  padding: ${space[1]};
  border-radius: ${radius.md};
  border: 1px solid ${color.border};
  background: ${color.surfaceRaised};
  box-shadow: ${shadow.e2};
  display: grid;
  gap: 2px;
`;

export const MenuHeader = styled.div`
  padding: ${space[2]} ${space[3]};
  border-bottom: 1px solid ${color.border};
  margin-bottom: ${space[1]};

  strong {
    display: block;
    color: ${color.text};
    font-size: ${font.size.sm};
    font-weight: ${font.weight.bold};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  width: 100%;
  min-height: 40px;
  padding: 0 ${space[3]};
  border: 0;
  border-radius: ${radius.sm};
  background: transparent;
  color: ${color.text};
  font-size: ${font.size.sm};
  text-align: left;
  cursor: pointer;
  text-decoration: none;

  &:hover {
    background: ${color.surfaceHover};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: -2px;
  }

  svg {
    color: ${color.textMuted};
    flex: 0 0 auto;
  }
`;
