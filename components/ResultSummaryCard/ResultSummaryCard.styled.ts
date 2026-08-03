import styled from '@emotion/styled';
import { pageHue, radius, space } from '@/shared/styles';

/**
 * 결과 요약 카드의 **바깥 껍데기** — 카드 자체에는 손대지 않고 좌측에 6px 세로 레일 하나만 얹는다.
 *
 * 왜 있는가: 이 카드는 시뮬레이터에서 유일한 주역(raised)인데 그 격을 만드는 수단이 그림자 하나뿐이라,
 * 라이트 모드에서는 아래 본문 카드들과 거의 같은 무게로 보였다. 레일은 **면이 아니라 선**이라
 * 색면 예산(tintscan 은 폭 180px 이상만 면으로 센다)을 한 칸도 쓰지 않으면서 "여기가 시작점"을 말한다.
 * 색은 페이지 얼굴색(--sb-page-hue, 시뮬레이터는 identity)이라 히어로·활성 내비와 같은 말을 한다.
 *
 * 🔴 이 레일 위에는 **아무것도 얹지 마라.** 대비 테스트가 볼 수 없는 파생값이라 텍스트를 올릴 수
 * 없다(shared/styles/pageHue.ts 의 계약 — 정당한 소비처는 비텍스트 장식뿐이다).
 *
 * 위아래로 24px 씩 물려 두는 이유: 카드 반경이 24~28px 라 그보다 끝까지 붙이면 레일이 둥근 모서리
 * 바깥으로 삐져나온다.
 */
export const SummaryCardShell = styled.div`
  position: relative;
  min-width: 0;
  width: 100%;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 24px;
    bottom: 24px;
    width: 6px;
    /* 네 모서리 균일 pill = 폭 6px 의 캡슐. 비균일 선언은 얇은 면에서 조용히 각져 보인다. */
    border-radius: ${radius.pill};
    background: ${pageHue};
    pointer-events: none;
    /*
     * 🔴 z-index 가 없으면 **레일이 카드 뒤로 사라진다**(2026-08-03 실측: 계산값은 6px·identity 인데
     * 화면에는 한 픽셀도 안 보였다). 공용 Card 는 contain: layout 을 걸어 스택 컨텍스트를 만들고,
     * 그런 요소는 위치 지정이 없어도 **z-index:0 자리에서** 칠해진다 — 같은 층에서는 트리 순서가
     * 이기므로 뒤에 오는 카드가 앞선 이 의사요소를 덮는다. 1 로 올려 카드 위에 세운다.
     */
    z-index: 1;
  }
`;

/**
 * 결과 카드의 지표 그리드.
 *
 * hero 타일(최종 자산 가치)은 **한 줄을 통째로 차지**한다(`grid-column: 1 / -1`).
 * 나머지 지표는 그 아래에 작게 깔린다. 이렇게 해야 "이 앱을 켠 이유"가 첫눈에 들어온다.
 */
export const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(170px, 100%), 1fr));
  gap: ${space[2]};
`;

/** hero 지표는 그리드 한 줄 전체를 쓴다. */
export const HeroSlot = styled.div`
  grid-column: 1 / -1;
  min-width: 0;
`;
