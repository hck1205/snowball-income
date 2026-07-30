import styled from '@emotion/styled';
import { color, font, motion, radius, shadow, space, zIndex } from '@/shared/styles';

/* -------------------------------------------------------------------------- */
/* 오버레이                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * 투어가 도는 동안 앱 클릭을 막는 판. **부작용 방지 장치이기도 하다** —
 * 뒤쪽 버튼이 눌려서 투어 중에 앱 상태가 바뀌는 일이 없다.
 */
export const TourOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${zIndex.modal};
`;

/** 대상을 못 찾았을 때(안전 폴백) 화면 전체를 덮는 딤. */
export const TourDim = styled.div`
  position: fixed;
  inset: 0;
  background: ${color.overlay};
`;

/**
 * 스포트라이트 = **구멍**.
 *
 * 오버레이에 배경을 깔고 구멍을 뚫는 대신, 이 요소에 거대한 `box-shadow` 확산을 줘서
 * "이 사각형 바깥 전부"를 어둡게 만든다. SVG 마스크나 4분할 div보다 단순하고,
 * 크기·위치가 바뀔 때 한 요소만 움직이면 되므로 리페인트도 싸다.
 */
export const TourSpotlight = styled.div`
  position: fixed;
  border-radius: ${radius.md};
  box-shadow: 0 0 0 9999px ${color.overlay};
  outline: 2px solid ${color.brand};
  outline-offset: 0;
  pointer-events: none;
  transition: top ${motion.base} ${motion.ease}, left ${motion.base} ${motion.ease},
    width ${motion.base} ${motion.ease}, height ${motion.base} ${motion.ease};
`;

/* -------------------------------------------------------------------------- */
/* 말풍선                                                                       */
/* -------------------------------------------------------------------------- */

export const TourPopover = styled.div`
  position: fixed;
  display: grid;
  gap: ${space[3]};
  width: min(340px, calc(100vw - ${space[8]}));
  padding: ${space[5]};
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surfaceRaised};
  box-shadow: ${shadow.e3};
  color: ${color.text};
  /*
   * 아래 리본을 카드의 라운드로 잘라내기 위한 것이다.
   * 지우면 2px 리본의 각진 양끝이 둥근 모서리 밖으로 5.4px 삐져나온다(2026-07-30 실측).
   */
  overflow: hidden;

  /*
   * 상단 오로라 리본 — 온보딩은 오로라 시그니처를 소개하는 순간이다.
   *
   * 리본에 반경을 주지 않는 이유: 높이가 2px 이라 어떤 반경을 적어도 브라우저가 높이 기준으로
   * 비례 축소해 실효 2px 이 상한이다(선언 16px → 실효 2px 실측). 즉 카드의 15px 안쪽 모서리와는
   * **원리적으로** 맞출 수 없다. 그래서 반경 대신 부모의 overflow 로 잘라낸다 — Banner ·
   * PortfolioPresetBoard · TickerDetailPage 의 좌측 액센트 바가 쓰는 것과 같은 방식이다.
   */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: ${color.gradientAurora};
  }
`;

export const TourTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.semibold};
  line-height: ${font.leading.tight};
`;

export const TourBody = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: ${font.leading.relaxed};
  overflow-wrap: anywhere;
`;

export const TourFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
`;

export const TourProgress = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  ${font.numeric}
`;

export const TourActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
`;
