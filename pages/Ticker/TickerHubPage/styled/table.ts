import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, motion, radius, space, subtleScrollbar } from '@/shared/styles';
import { ACCENT_DERIVATION } from './accent';

/* -------------------------------------------------------------------------- */
/* 표 보기 — 읽는 면                                                             */
/* -------------------------------------------------------------------------- */

/**
 * 표 보기의 바깥 상자. 좁은 화면에서 표가 지면을 밀지 않게 **자기 안에서만** 가로로 흐른다.
 */
export const TableScroll = styled.div`
  min-width: 0;
  overflow-x: auto;
  ${subtleScrollbar}
`;

/**
 * 티커 표 — 상세 페이지의 `HoldingsTable` 과 **같은 문법**이다(머리 행 · 헤어라인 · 값 우측정렬 ·
 * 등폭 숫자). 27종을 배당률·운용보수로 **비교할 때** 카드 격자보다 압도적으로 빠르다.
 *
 * 🔴 티커 셀은 여전히 상세로 가는 **링크**다. 보기를 바꿔도 진입점은 하나도 줄지 않는다.
 */
export const TickerTable = styled.table`
  width: 100%;
  min-width: 520px;
  border-collapse: collapse;
  font-size: ${font.size.sm};

  caption {
    text-align: left;
    padding-bottom: ${space[2]};
    color: ${color.textMuted};
    font-size: ${font.size.xs};
  }

  thead th {
    padding: ${space[2]} ${space[3]};
    border-bottom: 1px solid ${color.borderStrong};
    background: ${color.surfaceMuted};
    color: ${color.textMuted};
    font-size: ${font.size['2xs']};
    font-weight: ${font.weight.bold};
    letter-spacing: 0.06em;
    text-transform: uppercase;
    text-align: left;
    white-space: nowrap;
  }

  thead th:nth-of-type(n + 3) {
    text-align: right;
  }

  tbody tr {
    border-bottom: 1px solid ${color.border};
    transition: background ${motion.fast} ${motion.ease};
  }

  tbody tr:hover {
    background: ${color.surfaceHover};
  }

  tbody td {
    padding: ${space[3]};
    color: ${color.text};
    vertical-align: middle;
  }
`;

/** 표의 한 행 — 카드와 **같은 파생 블록**을 받아 티커 색이 두 보기에서 어긋나지 않는다. */
export const TableRow = styled.tr`
  ${ACCENT_DERIVATION}
`;

/**
 * 티커 셀 — 왼쪽 3px 컬러 귀 + 심볼 링크.
 * 귀는 폭 3px 이라 면으로 세어지지 않는다(색면 사다리 L1). 색은 카드 리본과 같은 값이다.
 */
export const TableTickerCell = styled.td`
  position: relative;
  padding-left: calc(${space[3]} + 7px) !important;
  white-space: nowrap;

  &::before {
    content: '';
    position: absolute;
    inset: 10px auto 10px 0;
    width: 3px;
    border-radius: ${radius.pill};
    background: linear-gradient(180deg, var(--tk-ribbon-from), var(--tk-ribbon-to));
  }
`;

export const TableTickerLink = styled(Link)`
  color: var(--tk-text);
  font-size: ${font.size.base};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  text-decoration: none;
  ${font.numeric};

  &:hover {
    text-decoration: underline;
  }
`;

/** 종목명 셀 — 한글명 위, 영문명 아래. 좁을 때 둘 다 한 줄로 자른다. */
export const TableNameCell = styled.td`
  min-width: 0;
  max-width: 260px;
`;

export const TableKorean = styled.span`
  display: block;
  font-weight: ${font.weight.semibold};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const TableEnglish = styled.span`
  display: block;
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** 숫자 셀 — 우측정렬 + 등폭. 열이 한 축에 서야 위아래로 비교가 된다. */
export const TableNumberCell = styled.td`
  text-align: right;
  white-space: nowrap;
  font-weight: ${font.weight.bold};
  ${font.numeric};
`;

/** 값이 없는 칸. `-` 를 숫자처럼 굵게 쓰지 않는다 — 없는 값은 없어 보여야 한다. */
export const TableMuted = styled.span`
  color: ${color.textMuted};
  font-weight: ${font.weight.regular};
`;
