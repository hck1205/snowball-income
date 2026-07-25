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

/**
 * 한 줄 = 티커 열 + 금액 열. 티커를 **고정폭**으로 잡아야 금액 시작선이 셀마다·행마다 일직선이
 * 된다(글자 수대로 흐르면 세로로 훑을 수 없다). 배당 캘린더 페이지의 아젠다·범례와 같은 6ch 규격.
 */
export const CalendarItemRow = styled.span<{ $estimated: boolean }>`
  display: flex;
  align-items: baseline;
  gap: ${space[1]};
  min-width: 0;
  font-size: 11px;
  color: ${({ $estimated }) => ($estimated ? color.textMuted : color.textSecondary)};
`;

export const CalendarItemTicker = styled.span`
  flex: 0 0 6ch;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  ${font.numeric}
`;

export const CalendarItemAmount = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  ${font.numeric}
`;
