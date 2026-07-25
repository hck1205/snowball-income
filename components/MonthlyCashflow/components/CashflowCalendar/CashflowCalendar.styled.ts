import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

/* ── 캘린더 뷰 (차트와 토글 전환) ──────────────────────────────────────── */

export const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${space[2]};

  @media (max-width: 960px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  @media (max-width: 560px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

/** $paying=false 는 지급 없는 달 — 흐리게 두되 칸은 유지한다(12칸 리듬이 곧 캘린더다). */
export const CalendarCell = styled.div<{ $paying: boolean }>`
  border: 1px solid ${color.border};
  border-radius: ${space[2]};
  padding: ${space[2]} ${space[3]};
  min-height: 76px;
  display: grid;
  align-content: start;
  gap: ${space[1]};
  opacity: ${({ $paying }) => ($paying ? 1 : 0.55)};
`;

export const CalendarMonthLabel = styled.span`
  font-size: ${font.size.xs};
  color: ${color.textMuted};
`;

export const CalendarTotal = styled.span`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  font-variant-numeric: tabular-nums;
`;

export const CalendarItemRow = styled.span<{ $estimated: boolean }>`
  font-size: 11px;
  color: ${({ $estimated }) => ($estimated ? color.textMuted : color.textSecondary)};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
