import styled from '@emotion/styled';
import { motion } from '@/shared/styles';

/**
 * 하마 + 금화 연출의 배치.
 *
 * ⚠ styled 템플릿 **안** 주석에 백틱을 쓰지 마라 — 템플릿이 그 자리에서 끊겨 앱이 부팅하지 않는다.
 * 🔴 하드코딩 hex 금지 — 이 부품은 색을 아예 정하지 않는다(두 이미지가 자기 색을 갖고 온다).
 */

/**
 * 무대. 정사각 상자를 잡고 그 안에서 두 이미지를 절대배치한다.
 *
 * 🔴 overflow 를 자르지 않는다 — 금화가 상자 오른쪽 위로 **살짝 나가는** 것이 이 연출의 핵심이다.
 *   자르면 금화가 모서리에서 잘려 "실수로 넘친 그림"으로 보인다.
 * ⚠ 그래서 호출부는 이 부품 오른쪽 위에 **여유 공간**을 남겨야 한다(대략 크기의 12%).
 */
export const SceneRoot = styled.div<{ $size: number }>`
  position: relative;
  flex: 0 0 auto;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  /* 그림이 컨테이너 폭을 넘지 않게 — 좁은 화면에서 상자째 줄어든다. */
  max-width: 100%;
`;

export const Hippo = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  /* 하마가 물에 앉아 있으므로 아래쪽을 기준으로 맞춘다(위를 맞추면 물웅덩이가 잘린 듯 뜬다). */
  object-position: bottom center;
`;

/**
 * 금화 — 하마 시선 끝(오른쪽 위).
 *
 * 좌표 근거: 원본 하마의 주둥이가 상자의 약 70% 폭 · 25% 높이 지점에서 오른쪽 위를 향한다.
 * 금화를 그 연장선(우상단 바깥)에 두면 "보고 있다"가 성립한다.
 *
 * ⚠ 애니메이션은 **거들 뿐**이다. 끄더라도(prefers-reduced-motion) 배치만으로 연출이 성립해야 한다 —
 *   움직임에 의미를 싣지 마라.
 */
export const Coin = styled.img`
  position: absolute;
  top: -6%;
  right: -8%;
  width: 34%;
  height: auto;
  object-fit: contain;
  animation: hippoCoinFloat 3.2s ${motion.ease} infinite;

  @keyframes hippoCoinFloat {
    0%,
    100% {
      transform: translateY(0) rotate(-4deg);
    }
    50% {
      transform: translateY(-7%) rotate(4deg);
    }
  }

  /* 🔴 움직임을 줄이라는 사용자 설정을 존중한다 — 이 앱의 다른 연출과 같은 규율. */
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
