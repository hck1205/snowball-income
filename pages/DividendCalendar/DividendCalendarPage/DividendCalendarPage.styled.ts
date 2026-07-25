import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, media, motion, radius, space } from '@/shared/styles';

export const PageStack = styled.div`
  display: grid;
  gap: clamp(16px, 3vw, 28px);
  min-width: 0;
`;

export const PageHero = styled.header`
  display: grid;
  gap: ${space[3]};
  padding: clamp(20px, 3vw, 32px);
  border-radius: ${radius.xl};
  border: 1px solid ${color.brandBorder};
  background: ${color.brandSubtle};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 4px;
    background: ${color.gradientAurora};
  }
`;

export const HeroIconBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${radius.md};
  color: ${color.brandText};
  background: ${color.surface};
  border: 1px solid ${color.brandBorder};
`;

export const HeroTitle = styled.h1`
  margin: 0;
  font-size: clamp(${font.size['2xl']}, 4vw, ${font.size['4xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  line-height: ${font.leading.tight};
  color: ${color.text};
`;

export const HeroLede = styled.p`
  margin: 0;
  font-size: clamp(${font.size.base}, 2vw, ${font.size.lg});
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
  max-width: 56ch;
`;

export const AsOfLine = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  ${font.numeric}
`;

/**
 * 라이브 리전은 **처음부터 끝까지 마운트 상태를 유지**한다. 시각적으로만 숨기고 텍스트만 바꾼다 —
 * `display:none`이나 조건부 언마운트는 접근성 트리에서 노드를 지워 이후 변경이 낭독되지 않는다.
 */
export const LiveRegion = styled.p`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`;

export const PageGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(16px, 3vw, 28px);
  align-items: start;

  ${media.up('layout')} {
    grid-template-columns: 320px minmax(0, 1fr);
  }
`;

export const PickerColumn = styled.section`
  min-width: 0;
  display: grid;
  gap: ${space[3]};
  align-content: start;

  ${media.up('layout')} {
    position: sticky;
    top: calc(var(--tk-header-h) + 16px);
  }
`;

export const BoardColumn = styled.section`
  min-width: 0;
  display: grid;
  gap: ${space[4]};
  align-content: start;
`;

/** 카드 안의 세로 리듬(제목 행 ↔ 본문). Card는 제목 슬롯을 쓰지 않는다 — 제목에 id가 필요하다. */
export const CardStack = styled.div`
  display: grid;
  gap: ${space[4]};
  min-width: 0;
`;

export const SectionHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[2]};
  flex-wrap: wrap;
`;

export const SectionHeading = styled.h2`
  margin: 0;
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
  color: ${color.text};
`;

export const SelectedCount = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
  ${font.numeric}
`;

export const CoverageSummary = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  ${font.numeric}
`;

/** 툴바와 달력 사이의 한 줄 요약 — "이 달에 몇 건이 잡혀 있나". */
export const MonthSummaryLine = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  ${font.numeric}
`;

export const EmptyStateCard = styled.div`
  display: grid;
  gap: ${space[3]};
  padding: clamp(20px, 3vw, 32px);
  border: 1px dashed ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surfaceMuted};
`;

export const EmptyTitle = styled.p`
  margin: 0;
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const EmptyBody = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
  max-width: 52ch;
`;

export const QuickPickLabel = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
`;

export const QuickPickList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: ${space[1]};
`;

export const QuickPickItem = styled.li`
  display: inline-flex;
`;

export const UnavailableDetails = styled.details`
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  padding: ${space[3]};

  &[open] > summary svg {
    transform: rotate(90deg);
  }
`;

export const UnavailableSummary = styled.summary`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  cursor: pointer;
  list-style: none;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
  border-radius: ${radius.xs};

  &::-webkit-details-marker {
    display: none;
  }

  svg {
    transition: transform ${motion.fast} ${motion.ease};
  }

  &:hover {
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const UnavailableBody = styled.p`
  margin: ${space[3]} 0 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};
`;

export const UnavailableList = styled.ul`
  list-style: none;
  margin: ${space[2]} 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: ${space[1]};
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  ${font.numeric}
`;

export const UnavailableItem = styled.li`
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  background: ${color.surfaceMuted};
`;

export const FootNote = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};
`;

export const SimulatorLink = styled(Link)`
  justify-self: start;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.brandText};
  text-decoration: none;
  border-radius: ${radius.xs};
  transition: color ${motion.fast} ${motion.ease};

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;
