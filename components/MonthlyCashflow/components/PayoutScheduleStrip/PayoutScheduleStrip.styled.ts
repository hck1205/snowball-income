import styled from '@emotion/styled';
import { color, font, space, stickyCellTable, stickyColumn, subtleScrollbar } from '@/shared/styles';

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

/*
 * 표 전체가 좁은 화면에서 자체 스크롤한다 — 12칸 그리드를 줄바꿈으로 구기지 않는다.
 *
 * ⚠ 끝 흐림(`scrollFadeRight`)은 **일부러 안 쓴다.** 이 표의 칸은 점이라, 마스크로 옅어진 점이
 *   "그 달은 지급 안 함"으로 읽힌다. 형제인 캘린더의 `ScheduleLegendTable` 도 같은 이유로 없다.
 */
export const ScheduleScroll = styled.div`
  overflow-x: auto;
  overscroll-behavior-x: contain;
  ${subtleScrollbar}
`;

export const ScheduleTable = styled.table`
  /* 🔴 종목 열을 고정하려면 이 표는 separate 여야 한다 — 이유는 stickyCellTable 주석. */
  ${stickyCellTable}
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

/**
 * 종목 열 = 이 표의 닻. 가로로 미는 동안 **왼쪽에 붙어 남는다** — 520px 최소폭이라 좁은 화면에서는
 * 반드시 미는데, 이 열이 흘러나가면 지금 보는 점 열두 개가 **어느 종목 것인지** 알 방법이 없다.
 * (캘린더의 `ScheduleLegendTable` 이 같은 이유로 같은 처방을 쓴다.)
 *
 * ⚠ `&&` 는 오타가 아니라 필수다 — 위 표의 `th, td` 규칙(0,1,1)이 이 컴포넌트 클래스(0,1,0)를
 *   이기기 때문에, 없으면 정렬·색은 물론 고정까지 통째로 죽는다.
 */
export const ScheduleTickerCell = styled.th`
  && {
    ${stickyColumn('0', true)}
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
