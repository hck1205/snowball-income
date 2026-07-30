import styled from '@emotion/styled';
import { color, font, space, subtleScrollbar } from '@/shared/styles';

/* ── 종목별 지급 일정 스트립 ────────────────────────────────────────────── */

export const ScheduleSection = styled.div`
  margin-top: ${space[5]};
  padding-top: ${space[4]};
  border-top: 1px solid ${color.border};
  display: grid;
  gap: ${space[3]};
`;

export const ScheduleHeading = styled.h3`
  margin: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
`;

/* 표 전체가 좁은 화면에서 자체 스크롤한다 — 12칸 그리드를 줄바꿈으로 구기지 않는다. */
export const ScheduleScroll = styled.div`
  overflow-x: auto;
  ${subtleScrollbar}
`;

export const ScheduleTable = styled.table`
  border-collapse: collapse;
  width: 100%;
  min-width: 520px;
  font-variant-numeric: tabular-nums;

  th,
  td {
    text-align: center;
    padding: ${space[1]} 2px;
    font-size: ${font.size.xs};
  }

  th {
    color: ${color.textMuted};
    font-weight: ${font.weight.medium};
  }
`;

export const ScheduleTickerCell = styled.th`
  && {
    text-align: left;
    color: ${color.text};
    font-weight: ${font.weight.semibold};
    white-space: nowrap;
    padding-right: ${space[3]};
  }
`;

/** 지급 달 점. $paying=false 는 자리만 지키는 흐린 점 — 줄마다 12칸이 유지돼 세로 스캔이 된다. */
export const ScheduleDot = styled.span<{ $paying: boolean }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $paying }) => ($paying ? color.brand : color.border)};
`;

/** 출처 배지 — 실측(지급일 관측)과 추정(배당락일 기반)을 한 단어로 가른다. */
export const ScheduleSourceBadge = styled.span<{ $estimated: boolean }>`
  display: inline-block;
  margin-left: ${space[2]};
  padding: 1px ${space[2]};
  border-radius: 999px;
  font-size: 11px;
  font-weight: ${font.weight.medium};
  white-space: nowrap;
  color: ${({ $estimated }) => ($estimated ? color.textMuted : color.brandText)};
  background: ${({ $estimated }) => ($estimated ? color.surfaceHover : color.brandSubtle)};
`;

/* ── 지급 일정 아코디언 (네이티브 details — JS 상태 없이 접근성 확보) ────── */

export const ScheduleDetails = styled.details`
  margin-top: ${space[5]};
  padding-top: ${space[4]};
  border-top: 1px solid ${color.border};

  &[open] > summary svg {
    transform: rotate(90deg);
  }
`;

export const ScheduleSummary = styled.summary`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  cursor: pointer;
  list-style: none;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
  border-radius: ${space[1]};

  &::-webkit-details-marker {
    display: none;
  }

  svg {
    transition: transform 120ms ease;
  }

  &:hover {
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const ScheduleBody = styled.div`
  display: grid;
  gap: ${space[3]};
  margin-top: ${space[3]};
`;
