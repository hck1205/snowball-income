import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

export const MeterRoot = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

/** 라벨 ↔ 큰 숫자 한 줄. 숫자가 커도 라벨과 같은 기준선에서 읽히게 baseline 정렬. */
export const MeterHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[3]};
  flex-wrap: wrap;
`;

export const MeterLabel = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
`;

/**
 * 이 화면의 주인공 숫자.
 *
 * ⚠ 색은 **중립(`color.text`)** 이다 — 숫자(데이터)에 accent를 칠하지 않는다(확정 결정).
 * 시선은 색이 아니라 크기·굵기가 끈다.
 */
export const MeterValue = styled.p`
  margin: 0;
  font-size: clamp(28px, 5vw, ${font.size['5xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  line-height: ${font.leading.tight};
  color: ${color.text};
  ${font.numeric}
`;

export const MeterTrack = styled.div`
  height: 10px;
  border-radius: ${radius.pill};
  background: ${color.progressTrack};
  border: 1px solid ${color.border};
  overflow: hidden;
`;

/**
 * 채움은 장식용 오로라 그라데이션(`gradient-aurora`) — CTA 그라데이션과 교차 사용 금지.
 * 0%일 때도 최소 폭을 남겨 "바가 존재한다"는 사실이 보이게 한다.
 *
 * 마운트 시 0 → 값으로 **1회** 차오르는 연출은 CSS keyframe이 한다(StatTile ProgressFill과 동일 기법).
 * JS 상태로 폭을 두 번 그리지 않으므로 리렌더가 없고, keyframes 자체를 `no-preference` 미디어 안에
 * 두어 모션 축소 선호에서는 애니메이션이 **정의되지 않는다**(값은 그대로 보인다).
 */
export const MeterFill = styled.div`
  height: 100%;
  min-width: 8px;
  border-radius: ${radius.pill};
  background: ${color.gradientAurora};
  /* 재계산으로 달성률이 바뀔 때는 부드럽게 이동. 전역 reduced-motion 규칙이 끈다. */
  transition: width ${motion.slow} ${motion.ease};

  @media (prefers-reduced-motion: no-preference) {
    animation: sb-goal-meter-fill ${motion.slow} ${motion.ease};

    @keyframes sb-goal-meter-fill {
      from {
        width: 0;
        min-width: 0;
      }
    }
  }
`;

export const MeterSentence = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
`;
