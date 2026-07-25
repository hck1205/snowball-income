import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

/** 기존 인라인 style 속성을 그대로 옮겨온 것 (마크업/동작 변화 없음). */

export const CashflowHeader = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[3]};
  margin-bottom: ${space[4]};
`;

/** Card의 CardTitle과 동일한 타이포로 맞춘다 (기존엔 h2에 인라인 색/크기가 박혀 있었다). */
export const CashflowTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: clamp(16px, 1.8vw, 18px);
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.01em;
`;

export const CashflowHeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  /* 줄이 카드 남은 폭을 전부 차지해야 마지막 자식(보기 토글)의 margin-left:auto 가 진짜 맨 우측이 된다.
     inline-flex(내용 폭)이던 시절엔 토글이 "컨트롤 묶음의 끝"에만 붙어 우측 정렬로 보이지 않았다. */
  flex: 1 1 auto;
  min-width: 0;
`;

/* 연도 셀렉트는 공용 프리미티브(`@/components/common` Select, size='md', width='116px')가 그린다. */

export const CashflowTotalLabel = styled.span`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  color: ${color.textSecondary};
  white-space: nowrap;
  ${font.numeric};

  /* 합계 금액만 도드라지게 — 라벨("배당 합계:")은 보조로 남긴다(사용자 요청 2026-07-25). */
  strong {
    font-size: ${font.size.base};
    font-weight: ${font.weight.bold};
    color: ${color.text};
  }
`;

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

/* ── 캘린더 뷰 (차트와 토글 전환) ──────────────────────────────────────── */

export const ViewToggleGroup = styled.div`
  display: inline-flex;
  /* 컨트롤 줄(flex:1)의 남는 공간을 왼쪽으로 몰아 토글을 줄의 실제 맨 우측에 고정한다. */
  margin-left: auto;
  border: 1px solid ${color.border};
  border-radius: ${space[2]};
  overflow: hidden;
`;

export const ViewToggleButton = styled.button<{ $active: boolean }>`
  border: 0;
  padding: ${space[1]} ${space[3]};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  cursor: pointer;
  color: ${({ $active }) => ($active ? color.brandText : color.textSecondary)};
  background: ${({ $active }) => ($active ? color.brandSubtle : 'transparent')};

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: -2px;
  }
`;

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
