import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import {
  color,
  font,
  motion,
  radius,
  scrollFadeRight,
  space,
  stickyCellTable,
  stickyColumn,
  subtleScrollbar
} from '@/shared/styles';
import { ACCENT_DERIVATION } from './accent';

/* -------------------------------------------------------------------------- */
/* 표 보기 — 읽는 면                                                             */
/* -------------------------------------------------------------------------- */

/**
 * 표 보기의 바깥 상자. 좁은 화면에서 표가 지면을 밀지 않게 **자기 안에서만** 가로로 흐른다.
 *
 * 끝 흐림은 앱 공통 처방이다(`scrollAffordance`) — 왼쪽은 흐리지 않는다. 그 자리는 아래
 * 고정된 티커 열이 제 면으로 덮는다.
 */
export const TableScroll = styled.div`
  min-width: 0;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  ${subtleScrollbar}
  ${scrollFadeRight}
`;

/**
 * 티커 표 — 상세 페이지의 `HoldingsTable` 과 **같은 문법**이다(머리 행 · 헤어라인 · 값 우측정렬 ·
 * 등폭 숫자). 27종을 배당률·운용보수로 **비교할 때** 카드 격자보다 압도적으로 빠르다.
 *
 * 🔴 티커 셀은 여전히 상세로 가는 **링크**다. 보기를 바꿔도 진입점은 하나도 줄지 않는다.
 */
export const TickerTable = styled.table`
  width: 100%;
  /* 520 → 600: 배당성장 열이 하나 붙었다(2026-08-17). 좁은 폭에서는 어차피 가로로 밀고,
     고정된 티커 열이 그 동안 행의 이름을 지킨다. */
  min-width: 600px;
  /* 🔴 티커 열을 고정하려면 이 표는 separate 여야 한다 — 이유는 stickyCellTable 주석. */
  ${stickyCellTable}
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

  /*
   * 머리 행의 티커 칸도 같이 고정한다 — 값 칸만 붙이면 가로로 미는 동안 머리와 값이 어긋나
   * "이 열이 무엇인지"를 말하는 글자가 먼저 사라진다.
   * ⚠ 면색은 공용 처방의 기본값(surface)이 아니라 **머리 행 제 색**(surfaceMuted)이다.
   *   고정 칸만 다른 색이면 머리 행 한가운데 색이 튄다.
   */
  thead th:first-of-type {
    ${stickyColumn('0', true)}
    background: ${color.surfaceMuted};
    z-index: 2;
  }

  tbody tr {
    transition: background ${motion.fast} ${motion.ease};
  }

  tbody tr:hover {
    background: ${color.surfaceHover};
  }

  tbody td {
    padding: ${space[3]};
    /* ⚠ separate 모드에서는 tr 의 border 가 그려지지 않는다 — 줄 사이 선은 칸이 진다. */
    border-bottom: 1px solid ${color.border};
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
 *
 * 🔴 **가로로 미는 동안 이 열은 제자리에 남는다**(min-width 520px 이라 좁은 화면에서는 반드시
 *    민다). 티커가 흘러나가면 배당률·운용보수가 **누구 것인지** 알 방법이 사라진다 —
 *    좁은 폭에서 열을 지키는 값은 숫자가 아니라 그 행의 이름이다.
 * ⚠ `position: sticky` 가 `relative` 를 대신한다(둘 다 positioned 라 아래 `::before` 귀는
 *   그대로 이 칸을 기준으로 잡는다). 순서를 바꿔 `relative` 를 뒤에 두면 고정이 죽는다.
 * ⚠ 면색은 표 **뒤에 있는 것**(지면 = bg)이다. 이 표는 카드 위가 아니라 지면 위에 선다 —
 *   공용 기본값(surface)을 그대로 쓰면 고정 열만 밝은 띠로 남는다.
 */
export const TableTickerCell = styled.td`
  ${stickyColumn('0', true)}
  background: ${color.bg};
  padding-left: calc(${space[3]} + 7px) !important;
  white-space: nowrap;

  /* 고정 칸은 제 면색이 있어 행 배경을 못 받는다 — 호버를 여기서 직접 되받는다. */
  tr:hover & {
    background: ${color.surfaceHover};
  }

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

/**
 * 비교 담기 칸.
 *
 * 🔴 **맨 끝 열이다.** 첫 열(`TableTickerCell`)이 `stickyColumn('0')` 으로 좌측에 고정돼 있어서,
 * 앞에 열을 하나 끼우면 그 고정 오프셋이 통째로 어긋난다(좁은 폭에서 티커가 흘러나간다).
 * 의원거래 표와 열 순서가 다른 것은 그래서다 — 그쪽 표에는 고정 열이 없다.
 */
export const TableSelectCell = styled.td`
  width: 1%;
  text-align: center;
  white-space: nowrap;
`;
