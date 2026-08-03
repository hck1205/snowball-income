import styled from '@emotion/styled';
import { DATA_RADIUS, color, media, space } from '@/shared/styles';

/**
 * 결과 영역의 **틀**.
 *
 * 왜 생겼나(2026-08-03 2차 리워크): 시뮬레이터의 결과는 [시나리오 탭] · [알림] · [카드 여덟 장]이
 * 페이지 배경 위에 **각자 떠 있는 형제들**이었다. 그래서 탭이 무엇을 전환하는지, 카드가 어디까지
 * 한 덩어리인지 화면이 말하지 않았다 — 탭의 아래 봉합선은 1px 실선 하나로 끝나고 그 아래는 다시
 * 페이지 배경이었다.
 *
 * 이 보드는 그 셋을 **문서 하나**로 묶는다: 머리(탭) → 알림 → 본문(격자). 시나리오 탭의 활성 봉합선이
 * 실제로 이 보드의 안쪽 면에 닿기 때문에 "탭을 바꾸면 이 판이 통째로 바뀐다"가 형태로 읽힌다.
 *
 * 🔴 면은 **채우지 않는다**(2026-08-03 검증에서 되돌림). 처음에는 `surfaceSunken` 으로 깔았는데,
 * 그 값은 **부속 카드(`Card tone="sunken"`)의 배경과 같은 토큰**이다. 그래서 이 보드 위에 놓인
 * `전량 매도한다면` 카드 — 테두리도 그림자도 없이 면색만으로 격을 말하는 유일한 카드 — 가 배경과
 * 정확히 같은 색이 되어 **화면에서 사라졌다**(실측 rgb(241,243,245) : rgb(241,243,245)).
 * 하필 같은 리워크에서 그 카드를 7:5 짝으로 옆에 세웠기 때문에, 행의 오른쪽 절반이 빈 것처럼 보였다.
 *
 * 채도를 얹는 것도 답이 아니고(틴트 예산은 카드가 써야 한다), 다른 중립 토큰도 답이 아니다 —
 * `surfaceMuted` 는 **다크에서 `surface` 보다 밝아** 카드가 보드보다 가라앉아 보인다.
 * 그래서 이 보드는 면이 아니라 **틀**로 말한다: 1px 테두리 + `DATA_RADIUS` + 머리(탭)의 봉합선.
 * 카드의 격(주역=그림자 · 본문=테두리 · 부속=면색)은 전부 **페이지 배경을 기준으로** 정해져 있으므로,
 * 배경을 비워 두어야 그 세 격이 하나도 안 죽는다.
 *
 * ⚠ 여기에 다시 배경을 깔려거든 먼저 `Card` 의 `sunken` 톤과 값이 겹치지 않는지 확인하라.
 *
 */
export const BoardRoot = styled.section`
  display: grid;
  gap: 0;
  min-width: 0;
  border: 1px solid ${color.border};
  border-radius: ${DATA_RADIUS};
  background: transparent;

  /*
   * 🔴 좁은 폭에서는 틀을 **벗는다**. 390px 에서 좌우 테두리 + 패딩은 카드가 쓸 수 있는 폭을
   * 30px 넘게 깎는데, 그 폭에서는 어차피 1열이라 "묶음"이 세로 순서만으로도 읽힌다.
   * 틀은 여러 열이 동시에 보이는 폭에서만 정보가 된다.
   */
  ${media.down('layout')} {
    border: 0;
    border-radius: 0;
    background: transparent;
  }
`;

/**
 * 보드 머리 — 시나리오 탭 줄이 앉는 자리.
 *
 * 아래쪽 패딩이 0 인 것이 의도다: 탭의 밑줄(`ScenarioTabsRow` 의 border-bottom)이 곧 머리와 본문의
 * 경계선이라, 그 아래에 여백을 더 주면 선이 허공에 뜬다.
 */
export const BoardHeader = styled.div`
  padding: ${space[3]} clamp(${space[3]}, 2vw, ${space[5]}) 0;
  min-width: 0;

  ${media.down('layout')} {
    padding: 0;
  }
`;

/**
 * 알림 줄. 두 알림 컴포넌트가 모두 `null` 이면 이 요소는 **자식이 없어져** `:empty` 로 사라진다 —
 * 그래야 평상시(대부분의 세션)에 빈 여백 한 줄이 머리와 본문 사이에 남지 않는다.
 */
export const BoardNotices = styled.div`
  display: grid;
  gap: ${space[2]};
  padding: clamp(${space[3]}, 2vw, ${space[5]}) clamp(${space[3]}, 2vw, ${space[5]}) 0;
  min-width: 0;

  &:empty {
    display: none;
  }

  ${media.down('layout')} {
    padding: ${space[3]} 0 0;
  }
`;

export const BoardBody = styled.div`
  padding: clamp(${space[3]}, 2vw, ${space[5]});
  min-width: 0;

  ${media.down('layout')} {
    padding: ${space[3]} 0 0;
  }
`;
