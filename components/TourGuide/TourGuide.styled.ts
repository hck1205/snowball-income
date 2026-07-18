import styled from '@emotion/styled';
import { color, font, media, motion, radius, shadow, space, zIndex } from '@/shared/styles';

/* -------------------------------------------------------------------------- */
/* 진입점 — 헤더의 나침반 아이콘                                                  */
/* -------------------------------------------------------------------------- */

/** 뱃지를 버튼 모서리에 걸기 위한 기준점. 버튼 자체는 `Button` 프리미티브가 그린다. */
export const LaunchSlot = styled.span`
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
`;

/**
 * 첫 방문 유도 점. **자동 실행 팝업 대신 이것만 쓴다** — 작업을 가로막지 않고 아이콘의 존재만 알린다.
 * 투어를 한 번 시작하면 사라진다(`localStorage`).
 *
 * `aria-hidden`: 시각적 힌트일 뿐이고, 버튼의 `aria-label`이 이미 무엇인지 말한다.
 * 점 하나를 스크린리더가 "점"이라고 읽어봐야 도움이 되지 않는다.
 */
/** 튜토리얼 버튼 라벨. 모바일에서는 숨겨 아이콘만 남긴다(아이콘 버튼 형태). */
export const LaunchLabel = styled.span`
  ${media.down('mobileWide')} {
    display: none;
  }
`;

export const LaunchDot = styled.span`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  border-radius: ${radius.pill};
  /* "새 것" 신호는 오로라 teal — 포커스/선택 의미의 brand와 어휘를 분리한다. */
  background: ${color.accent};
  /* 아이콘 위에 겹쳐도 점으로 읽히도록 서피스 색 링을 두른다. */
  border: 2px solid ${color.surface};
  pointer-events: none;
`;

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

  /* 상단 오로라 리본 — 온보딩은 오로라 시그니처를 소개하는 순간이다. */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    border-radius: ${radius.lg} ${radius.lg} 0 0;
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
