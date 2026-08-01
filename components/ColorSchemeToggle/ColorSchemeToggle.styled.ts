import styled from '@emotion/styled';
import { iconSwapIn } from '@/shared/styles';

/**
 * 헤더 밝기 토글 슬롯 — 모든 폭에서 노출한다(형제인 `⋯` 더보기와 같은 규격).
 *
 * 폭을 32px 로 고정하는 이유는 구 테마 트리거와 같다: `iconOnly` `sm` 버튼의 기본 상자는
 * 28×32(세로가 더 김)라, 정사각으로 맞춰야 옆 버튼과 시각적으로 정렬된다.
 */
export const ToggleRoot = styled.span`
  display: inline-flex;

  & > button {
    width: 32px;
  }

  /* 해·달 글리프는 상태가 갈릴 때만 새로 마운트된다 — 그 한 번을 작게 시작해 시선을 데려온다. */
  svg {
    ${iconSwapIn}
  }
`;
