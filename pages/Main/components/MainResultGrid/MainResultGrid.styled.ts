import styled from '@emotion/styled';
import { ResultGrid } from '@/components/common';
import { motion } from '@/shared/styles';

/**
 * **첫 결과가 처음 나타나는 한 번**의 진입 연출.
 *
 * 프리셋을 고르면 빈 화면이 결과 카드 열 장으로 통째로 바뀐다. 그 교체가 무음 스냅이면
 * 사용자는 "무엇이 어디서 왔는지" 모른 채 낯선 화면을 마주한다. 위에서 아래로 80ms 씩 밀리며
 * 들어오면 시선이 요약 → 차트 → 표 순서로 자연히 흐른다.
 *
 * 🔴 **이것은 "페이지 로드 오케스트레이션"이 아니다**(그건 금지 사항이다). 새로고침·복원·
 *   첫 방문 프리필에서는 **돌지 않는다** — 발동 조건은 `MainResultGrid.utils.ts` 의
 *   `useFirstResultReveal` 이 소유하고, 거기서 세션당 한 번으로 잠근다.
 *   새로고침마다 재생되면 그 순간 금지 사항이 된다.
 *
 * ⚠ 결과 이미지 저장은 이 연출이 끝날 때까지 기다린다(`htmlCapture.ts` 의 `waitForAnimations`) —
 *   지연 구간의 계산값이 `opacity: 0` 이라 그대로 찍으면 카드가 투명한 채로 박힌다(실측 잉크 1.05%).
 *
 * 스태거 간격 80ms 는 이 레포의 유일한 선례(`TickerDetailPage.styled.ts`)와 같은 값이다.
 * 총 260ms = 지연 160ms + 지속 100ms 로 UI 전환 상한(300ms) 아래에 둔다.
 *
 * 지연 구간이 셋뿐인 이유: 카드가 열 장이어도 80ms 씩 곱하면 마지막 카드가 800ms 뒤에 온다.
 * 사용자가 기다리는 화면이 되면 연출이 아니라 지연이다 — 셋째 줄부터는 함께 들어온다.
 */
export const RevealResultGrid = styled(ResultGrid)<{ $reveal: boolean }>`
  ${({ $reveal }) =>
    $reveal
      ? `
    @media (prefers-reduced-motion: no-preference) {
      > * {
        /* 'backwards' 가 없으면 지연 동안 원래 자리에 그대로 보인다 — 스태거가 통째로 무효가 된다. */
        animation: sb-result-reveal 100ms ${motion.ease} backwards;
      }

      > *:nth-of-type(2) {
        animation-delay: 80ms;
      }

      > *:nth-of-type(n + 3) {
        animation-delay: 160ms;
      }

      @keyframes sb-result-reveal {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
      }
    }
  `
      : ''}
`;
