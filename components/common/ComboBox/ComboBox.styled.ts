import styled from '@emotion/styled';
import { color, elevation, font, inputSurface, radius, space, subtleScrollbar } from '@/shared/styles';

/**
 * 검색되는 제안 목록 — `<datalist>` 를 대신한다.
 *
 * ## 왜 네이티브를 버렸나 (2026-08-08 사용자 요청)
 *
 * `<datalist>` 는 타이핑하면 걸러 주기는 하지만 **우리가 그 목록을 제어할 수 없다** —
 * 높이·스크롤·정렬·강조가 전부 브라우저 몫이고, 항목이 서른 개가 넘으면 화면을 덮을 만큼
 * 길게 그려진다. 그래서 목록만 우리가 그린다.
 *
 * ## 🔴 오버레이 층을 새로 만들지 않는다
 *
 * 종전 판단(`LedgerFormModal` 주석)이 우려한 것이 이것이다. 그래서:
 * - **포털을 쓰지 않는다.** 목록은 입력 바로 아래 `position: absolute` 로 선다 —
 *   모달 안에 살아서 z-index 다툼도, 스크롤 동기화도 없다.
 * - **ESC 를 삼킨다.** 목록이 열려 있을 때의 ESC 는 목록만 닫고 모달을 닫지 않는다
 *   (컴포넌트의 `onKeyDown` 이 `stopPropagation`).
 */

/**
 * 입력칸. 🔴 **공용 `inputSurface`** 를 쓴다 — 같은 폼에서 나란히 서는 형제 입력과 면이
 * 갈리면 높이·테두리·포커스링이 어긋나 눈에 바로 보인다(그래서 그 조각을 shared 로 올렸다).
 */
export const ComboInput = styled.input`
  ${inputSurface}
`;

export const ComboRoot = styled.div`
  position: relative;
  min-width: 0;
`;

/**
 * 목록.
 *
 * 🔴 `max-height` 가 이 컴포넌트의 존재 이유다 — 넘치면 스크롤하고 화면을 덮지 않는다.
 *    높이는 항목 수로 계산한다(픽셀을 박으면 글자 크기가 바뀔 때 반 줄이 걸린다).
 */
export const ComboList = styled.ul<{ 'data-rows': number }>`
  position: absolute;
  z-index: 2;
  top: calc(100% + ${space[1]});
  left: 0;
  right: 0;
  margin: 0;
  padding: ${space[1]};
  list-style: none;
  max-height: calc(${(props) => props['data-rows']} * 2.5rem + ${space[2]});
  overflow-y: auto;
  overscroll-behavior: contain;
  /* 🔴 공용 믹스인 — 생 overflow 만 두면 각진 네이티브 스크롤바가 나온다. */
  ${subtleScrollbar}
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  box-shadow: ${elevation[2]};
`;

/**
 * 항목 하나.
 *
 * 🔴 활성 항목을 **색만으로** 말하지 않는다 — 면과 글자 굵기가 함께 바뀐다(색 단독 채널 금지).
 * ⚠ `<li>` 에 `onMouseDown` 을 건다(`onClick` 이 아니다). 클릭은 입력의 blur 뒤에 오므로
 *   그 사이에 목록이 닫혀 선택이 삼켜진다.
 */
export const ComboOption = styled.li<{ 'data-active'?: boolean }>`
  display: block;
  padding: ${space[2]} ${space[2]};
  border-radius: ${radius.sm};
  font-size: ${font.size.base};
  font-weight: ${(props) => (props['data-active'] ? font.weight.semibold : font.weight.regular)};
  color: ${color.text};
  background: ${(props) => (props['data-active'] ? color.surfaceHover : 'transparent')};
  cursor: pointer;
`;

/** 걸러 낸 결과가 없을 때. 🔴 목록을 감추지 않고 **왜 비었는지** 말한다. */
export const ComboEmpty = styled.li`
  display: block;
  padding: ${space[2]};
  font-size: ${font.size.sm};
  color: ${color.textMuted};
`;
