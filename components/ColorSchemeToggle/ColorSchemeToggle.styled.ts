import styled from '@emotion/styled';
import { iconSwapIn } from '@/shared/styles';

/**
 * 헤더 밝기 토글 슬롯 — 모든 폭에서 노출한다(형제인 `⋯` 더보기와 같은 규격).
 *
 * 폭을 32px 로 고정하는 이유는 구 테마 트리거와 같다: `iconOnly` `sm` 버튼의 기본 상자는
 * 28×32(세로가 더 김)라, 정사각으로 맞춰야 옆 버튼과 시각적으로 정렬된다.
 */
export const ToggleRoot = styled.span<{ $animateIcon: boolean }>`
  display: inline-flex;

  & > button {
    width: 32px;
  }

  /*
   * 🔴 **애니메이션은 사용자가 실제로 토글했을 때만** 건다(2026-08-02 사용자 지적으로 수정).
   *
   * 예전에는 svg 에 무조건 걸려 있었고 주석은 "상태가 갈릴 때만 새로 마운트된다"고 가정했다.
   * 그 가정이 틀렸다 — **페이지마다 자기 AppHeader 를 렌더**하므로 라우트를 옮길 때마다 토글이
   * 통째로 다시 마운트되고, 그때마다 해·달 글리프가 튀어 들어와 깜빡이는 것처럼 보였다.
   *
   * 마운트 시점에는 false 라 라우트 이동에서는 조용하고, 사용자가 누른 뒤에만 true 가 된다
   * (컨테이너의 hasToggled 참고 — 라우트가 바뀌면 그 상태도 함께 초기화된다).
   */
  ${({ $animateIcon }) =>
    $animateIcon
      ? `
  svg {
    ${iconSwapIn}
  }
`
      : ''}
`;
