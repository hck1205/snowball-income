import styled from '@emotion/styled';
import { TOUCH_TARGET, color, motion, pressable, pressTransition, radius, shadow, space, zIndex } from '@/shared/styles';

/**
 * 화면 오른쪽 아래에 뜨는 원형 버튼.
 *
 * ## 자리
 * 오른쪽 아래다. 이 화면에서 `position: fixed` 인 것은 스킵 링크(왼쪽 위, 포커스 전에는 화면 밖)와
 * 복사 폴백 토스트(`ShareToast` — 위쪽 가운데)뿐이라 아래 구석은 비어 있다(1280·390 실측).
 * 오른쪽을 고른 이유는 스킵 링크가 왼쪽 위에서 내려오고, 이 앱의 주요 액션(공유·좋아요·댓글 등록)이
 * 전부 카드 안 흐름에 있어 겹칠 대상이 없기 때문이다.
 *
 * `env(safe-area-inset-bottom)` 은 iOS 홈바 대비다. 지금 `index.html` 의 뷰포트 메타에
 * `viewport-fit=cover` 가 없어 실제 값은 0 이지만, 기본 여백(16~24px)이 있어 오늘도 홈바에 닿지
 * 않고 커버 모드로 바뀌면 자동으로 따라간다(`SideDrawer.styled.ts:214` 와 같은 방어).
 *
 * ## 층위
 * `stickyAction`(10) — 본문 카드(자체 층위 없음) 위에 서고, 헤더(30)·드로어(55/60)·모달보다 낮다.
 * 공유 창이 열리면 그 아래로 깔린다.
 *
 * ## 크기
 * 44x44 를 **실제 크기로** 가진다 — 그래서 `hitArea()` 의사요소가 필요 없다. (그 의사요소는
 * `scrollWidth` 에 잡혀 오버플로 감사에 거짓 양성을 만든다: pitfalls 2026-07-29.)
 */
export const FloatingButton = styled.button`
  position: fixed;
  right: clamp(${space[4]}, 4vw, ${space[6]});
  bottom: calc(env(safe-area-inset-bottom, 0px) + clamp(${space[4]}, 4vw, ${space[6]}));
  z-index: ${zIndex.stickyAction};

  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${TOUCH_TARGET};
  height: ${TOUCH_TARGET};
  border-radius: ${radius.pill};
  border: 1px solid ${color.borderStrong};
  background: ${color.surface};
  color: ${color.textSecondary};
  box-shadow: ${shadow.e2};
  cursor: pointer;
  touch-action: manipulation;

  ${pressable}
  /*
   * pressable 이 자기 transition 을 선언하므로 **그 뒤에** 쓰는 transition 은 그것을 덮는다
   * (같은 규칙 안 마지막 선언이 이긴다). 그래서 scale 을 여기 함께 나열해 누름 피드백을 살린다.
   */
  transition: color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    box-shadow ${motion.fast} ${motion.ease}, ${pressTransition};

  &:hover {
    border-color: ${color.brand};
    color: ${color.brand};
    box-shadow: ${shadow.e3};
  }

  svg {
    flex: 0 0 auto;
  }
`;
