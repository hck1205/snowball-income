import styled from '@emotion/styled';
import { media } from '@/shared/styles';

/**
 * 결과 카드가 앉는 12열 그리드. 카드가 각자 자기 폭(`$span`)을 말하고, 좁은 폭에서는 전부 1열로 접힌다.
 *
 * ⚠ `contain: layout style` 은 `position: fixed` 자손의 컨테이닝 블록을 가로챈다(뷰포트가 아니라 이 박스
 *   기준으로 배치된다) — 그리드 **안에서** 오버레이(툴팁·토스트·모달)를 띄울 때는 반드시
 *   `createPortal(document.body)` 로 뽑아라. 지금 결과 영역의 fixed 오버레이가 전부 포털인 이유다.
 */
export const ResultGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: clamp(12px, 1.8vw, 20px);
  min-width: 0;
  contain: layout style;

  > * {
    min-width: 0;
  }

  ${media.down('layout')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

/** `$span` 은 **transient prop** 이어야 한다 — `$` 가 없으면 emotion 이 DOM 으로 흘려 React 경고가 난다. */
export const ResultGridCell = styled.div<{ $span: number }>`
  grid-column: span ${({ $span }) => $span};
  min-width: 0;

  ${media.down('layout')} {
    grid-column: 1 / -1;
  }
`;
