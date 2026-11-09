import styled from '@emotion/styled';
import { color, font, radius, space, subtleScrollbar } from '@/shared/styles';

/**
 * 진입 버튼 자리 — 탭 줄과 결과 사이(ResultBoard 의 notices 슬롯), 오른쪽 정렬.
 * 🔴 탭 줄 **옆**에 두지 않는다: 그 줄은 좁은 폭에서 가장 먼저 눌리는 자리라 컨트롤을 옮겨 낸 이력이 있다
 *   (ScenarioTabsRow 주석, 2026-07-29).
 */
export const CompareEntry = styled.div`
  display: flex;
  justify-content: flex-end;
`;

/* 탭이 많으면(최대 10) 표가 가로로 넘친다 — 표 자체가 아니라 이 틀이 스크롤한다(첫 열은 고정). */
export const CompareScroll = styled.div`
  overflow-x: auto;
  ${subtleScrollbar}
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
`;

export const CompareTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: ${font.size.sm};
  ${font.numeric};

  /* 모든 칸이 같은 불투명 면 — 고정된 첫 열만 다른 색으로 떠 보이지 않게(2026-11-09 스크린샷). */
  th,
  td {
    padding: ${space[2]} ${space[3]};
    background: ${color.surface};
    border-bottom: 1px solid ${color.border};
    text-align: right;
    vertical-align: top;
    min-width: 128px;
  }

  thead th {
    font-weight: ${font.weight.bold};
    color: ${color.text};
    white-space: nowrap;
  }

  /* 첫 열(지표 이름)은 가로 스크롤 중에도 남는다. */
  tbody th,
  thead th:first-child {
    position: sticky;
    left: 0;
    z-index: 1;
    min-width: 112px;
    text-align: left;
    font-weight: ${font.weight.medium};
    color: ${color.textMuted};
    /* 스크롤되는 칸과의 경계 — 고정 열이 그 위로 미끄러지는 것이 보이게. */
    box-shadow: inset -1px 0 0 ${color.border};
  }

  tbody tr:last-child th,
  tbody tr:last-child td {
    border-bottom: 0;
  }
`;

export const ActiveTag = styled.span`
  display: block;
  margin-top: ${space[1]};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  color: ${color.brandText};
`;

export const HoldingsCell = styled.td`
  && {
    text-align: left;
    color: ${color.textMuted};
    font-size: ${font.size.xs};
    line-height: 1.5;
  }
`;

/* 가장 좋은 값 — 색만으로 말하지 않는다(굵기 + "최고" 글자). */
export const BestValue = styled.strong`
  font-weight: ${font.weight.extrabold};
  color: ${color.text};
`;

export const BestTag = styled.span`
  display: inline-block;
  margin-left: ${space[1]};
  padding: 0 ${space[1]};
  border-radius: ${radius.sm};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  color: ${color.brandText};
  background: ${color.brandSubtle};
`;

export const MutedValue = styled.span`
  color: ${color.textMuted};
`;

export const CompareNote = styled.p`
  margin: ${space[3]} 0 0;
  font-size: ${font.size.xs};
  line-height: 1.6;
  color: ${color.textMuted};
`;

/* 화면에는 안 보이고 화면 낭독기에만 읽히는 글자(열 이름 보충 등). */
export const SrOnly = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
`;
