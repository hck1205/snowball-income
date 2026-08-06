import styled from '@emotion/styled';
import { color, font, media, motion, radius, space } from '@/shared/styles';

/**
 * 달성률 미터 — **가로 막대가 아니라 링**이다(2026-08-03 개편).
 *
 * ## 왜 링으로 바꿨나 (두 가지 이유가 같은 방향을 가리켰다)
 * ① **서사**: 이 카드는 화면의 정점이고, 가로 막대는 카드 안에서 "또 하나의 줄"로 묻힌다.
 *    링은 숫자를 한가운데 앉히므로 달성률과 그 값이 **한 덩어리**로 읽힌다.
 * ② **색면 예산**: 종전 막대는 높이 10px · 전폭이라 `tintscan` 의 면 판정(폭 ≥180 AND 높이 ≥8)을
 *    **양 축 모두 넘겼다** — 즉 이 화면의 2면 중 하나를 채움 막대가 먹고 있었다.
 *    링은 지름 132px 라 폭 축에서 걸리지 않는다. 🔴 132px 를 180px 이상으로 키우지 마라.
 *
 * 트랙은 `progressTrack`(중립 판정 토큰)이고 채움만 색을 갖는다 — 종전 규칙 그대로다.
 */
export const MeterRoot = styled.div`
  display: flex;
  align-items: center;
  gap: clamp(16px, 3vw, 24px);
  min-width: 0;

  ${media.down('mobileWide')} {
    flex-direction: column;
    align-items: stretch;
    gap: ${space[3]};
  }
`;

export const MeterRingFrame = styled.div`
  flex: 0 0 auto;
  position: relative;
  width: 132px;
  height: 132px;
  align-self: center;
`;

/**
 * 링 자체. 채움 각도는 연속값이라 인라인 `background` 로 준다(재계산마다 스타일시트가 불어나지 않게).
 * 가운데는 `mask` 로 뚫는다 — 면색 원을 덮으면 카드 배경(surfaceRaised/surface)이 갈릴 때 가운데만
 * 다른 밝기로 떠오른다. `mask` 미지원에서는 원판(파이)이 되고 뜻은 그대로다.
 */
export const MeterRing = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  mask: radial-gradient(circle, transparent 68%, currentColor 68.5%);
  -webkit-mask: radial-gradient(circle, transparent 68%, currentColor 68.5%);
  transition: background ${motion.slow} ${motion.ease};

  @media (prefers-reduced-motion: no-preference) {
    animation: sb-goal-ring-in ${motion.slow} ${motion.ease};

    @keyframes sb-goal-ring-in {
      from {
        transform: rotate(-24deg) scale(0.96);
        opacity: 0;
      }
    }
  }
`;

export const MeterRingCenter = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 2px;
  text-align: center;
  pointer-events: none;
`;

export const MeterLabel = styled.p`
  margin: 0;
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  letter-spacing: 0.02em;
  color: ${color.textMuted};
`;

/**
 * 링 한가운데의 큰 숫자.
 *
 * ⚠ 색은 **중립(`color.text`)** 이다 — 숫자(데이터)에 accent 를 칠하지 않는다(확정 결정).
 * 시선은 색이 아니라 크기·굵기와 링이 끈다.
 */
export const MeterValue = styled.p`
  margin: 0;
  font-family: ${font.dataNumeric};
  font-size: clamp(26px, 4.4vw, ${font.size['4xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  line-height: ${font.leading.tight};
  color: ${color.text};
  ${font.numeric}
`;

/** 링 오른쪽 — 병기 문장이 사는 자리. 좁은 폭에서는 링 아래로 내려온다. */
export const MeterBody = styled.div`
  flex: 1 1 220px;
  min-width: 0;
  display: grid;
  gap: ${space[2]};
`;

export const MeterSentence = styled.p`
  margin: 0;
  font-size: ${font.size.base};
  font-weight: ${font.weight.medium};
  color: ${color.textSecondary};
  line-height: ${font.leading.normal};
`;

/*
 * 🔴 눈금(0 · 50 · 100) 줄을 두지 마라 — 한 번 넣었다가 뺀 자리다.
 * 100% 도달 화면에서 눈금의 '100%' 가 링 한가운데 값 '100%' 와 **같은 문자열**이 되어,
 * "화면에 보이는 달성률" 을 텍스트로 찾는 테스트가 두 개를 잡는다
 * (`test/portfolio/portfolioGoalCard.states.test.tsx:254`). 같은 사실은 이미 세 채널
 * (가운데 숫자 · 병기 문장 · 링 각도)이 말하고 있어 네 번째는 소음이기도 하다.
 */

/** 값이 아직 없을 때(로딩)의 자리. 링 대신 중립 원만 남긴다 — 0% 링은 "0% 달성"으로 읽힌다. */
export const MeterRingPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  border-radius: ${radius.pill};
  background: ${color.progressTrack};
  mask: radial-gradient(circle, transparent 68%, currentColor 68.5%);
  -webkit-mask: radial-gradient(circle, transparent 68%, currentColor 68.5%);
`;
