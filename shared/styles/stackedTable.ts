import { color, radius, space } from './tokens';

/**
 * **좁은 폭에서 표를 행 단위 카드로 접는 골격.**
 *
 * `headerSolidSurface`(headerSurface.ts)와 같은 방식의 공용 CSS 조각이다 — styled 안에 `${}` 로 끼운다.
 *
 * 🔴 **`minmax(0, 1fr)` 은 장식이 아니다.** 기본 암시 트랙(`auto`)은 최소 크기가 `min-content` 라
 * 긴 셀 하나(종목명·분류·메모)가 카드 폭을 래퍼(`overflow-x: auto`) 밖으로 밀어낸다. 보유 표에서
 * 실제로 20~41px 가로 스크롤이 생겼던 원인이고, **이 레포에서 반복해 재발한 버그다.** 네 개의 표가
 * 각자 같은 주석을 복붙해 두고 있었다 — 그래서 그 근거를 여기 한 곳에 둔다.
 *
 * ## 쓰는 곳과 안 쓰는 곳
 * - `DataTable`(공용) · `DividendListTable` — **이 골격을 그대로 쓴다**(원래 두 파일의 CSS 가
 *   바이트 단위로 같았다. `DividendListTable` 은 `caption { display: block; }` 만 더한다).
 * - `LedgerTable` · `HoldingsTable` — **일부러 안 쓴다.** 카드 외형이 진짜로 다르다(가계부는
 *   `grid-template-areas` 로 날짜·금액·분류를 배치하고, 보유 표는 카드 왼쪽 변 전체가 종목 색이다).
 *   억지로 공유하면 오버라이드가 골격보다 길어진다. 다만 위 `minmax(0, 1fr)` 근거는 그 둘에도
 *   똑같이 적용되므로, 그쪽 주석은 이 파일을 가리킨다.
 */
export const stackedTableShell = `
  display: block;
  min-width: 0;

  thead {
    display: none;
  }

  tbody {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: ${space[2]};
  }

  tbody tr {
    display: block;
    border: 1px solid ${color.border};
    border-radius: ${radius.md};
    padding: ${space[1]} ${space[3]};
    background: ${color.surfaceMuted};
  }

  tbody tr:hover {
    background: ${color.surfaceMuted};
  }
`;
