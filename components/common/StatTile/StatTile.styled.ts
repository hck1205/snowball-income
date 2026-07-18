import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';
import type { StatEmphasis, StatTone } from './StatTile.types';

/**
 * 지표 타일.
 *
 * 고치려는 문제: 예전에는 "최종 자산 가치"(사용자가 이 앱을 켠 이유)와 "누적 세금"(부연 정보)이
 * **완전히 같은 카드·같은 글자 크기**였다. 위계가 없으면 사용자는 매번 6개를 다 읽어야 한다.
 *
 * 위계를 만드는 수단(색이 아니라 **크기·무게·서피스**):
 *  - hero: 값 30~38px + 좌측 브랜드 액센트 바 + raised 서피스. 한눈에 먼저 잡힌다.
 *  - default: 값 16px. 조용히 뒤로 물러난다.
 * 색은 방향성(상승/하락)에만 남겨둔다 — 색까지 위계에 쓰면 데이터의 색이 의미를 잃는다.
 */

const TONE: Record<StatTone, string> = {
  neutral: color.text,
  positive: color.dataPositive,
  negative: color.dataNegative
};

export const TileRoot = styled.div<{ emphasis: StatEmphasis }>`
  position: relative;
  min-width: 0;
  display: grid;
  gap: ${({ emphasis }) => (emphasis === 'hero' ? space[1] : '2px')};
  align-content: start;
  border: 1px solid ${({ emphasis }) => (emphasis === 'hero' ? color.brandBorder : color.border)};
  border-radius: ${radius.md};
  background: ${({ emphasis }) => (emphasis === 'hero' ? color.brandSubtle : color.surfaceMuted)};
  padding: ${({ emphasis }) => (emphasis === 'hero' ? `${space[4]} ${space[4]} ${space[4]} ${space[5]}` : space[3])};
  transition: border-color ${motion.fast} ${motion.ease};

  /* hero 타일의 좌측 오로라 리본 바 — 시그니처를 화면당 한 군데(주인공 지표)에만 쓴다. */
  ${({ emphasis }) =>
    emphasis === 'hero'
      ? `
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: ${space[3]};
      bottom: ${space[3]};
      width: 4px;
      border-radius: 0 ${radius.pill} ${radius.pill} 0;
      background: ${color.gradientAurora};
    }

    /*
     * hero 로드 모션(§5.1) — CSS animation이라 마운트 시 1회만 돈다.
     * 재계산으로 숫자가 바뀌어도 요소가 리마운트되지 않는 한 반복되지 않는다.
     * keyframes까지 no-preference 미디어 안에 두어 reduced-motion에서는 아예 정의되지 않는다.
     */
    @media (prefers-reduced-motion: no-preference) {
      animation: sb-stat-hero-enter 300ms ${motion.ease};

      &::before {
        transform-origin: top;
        animation: sb-stat-hero-bar 320ms ${motion.ease} 80ms backwards;
      }

      @keyframes sb-stat-hero-enter {
        from {
          opacity: 0;
          transform: translateY(6px);
        }
      }

      @keyframes sb-stat-hero-bar {
        from {
          transform: scaleY(0);
        }
      }
    }
  `
      : `
    &:hover {
      border-color: ${color.borderStrong};
    }
  `};
`;

/**
 * 라벨 줄은 `div`가 아니라 `span`(flex)이다.
 *
 * 이유: 타일의 **가장 가까운 `div` 조상은 타일 루트여야 한다**. 라벨을 div로 감싸면
 * "라벨과 값이 같은 컨테이너에 있다"는 구조가 깨진다 — 실제로 앱 테스트가
 * `getByText(label).closest('div')`로 타일 전체를 읽어 값을 꺼낸다.
 */
export const TileLabelRow = styled.span`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
  width: 100%;
`;

export const TileLabel = styled.span<{ emphasis: StatEmphasis }>`
  display: block;
  flex: 1 1 auto;
  min-width: 0;
  font-size: ${({ emphasis }) => (emphasis === 'hero' ? font.size.sm : font.size.xs)};
  font-weight: ${({ emphasis }) => (emphasis === 'hero' ? font.weight.semibold : font.weight.medium)};
  color: ${({ emphasis }) => (emphasis === 'hero' ? color.brandText : color.textMuted)};
  line-height: ${font.leading.snug};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const TileValue = styled.p<{ emphasis: StatEmphasis; tone: StatTone }>`
  margin: 0;
  /* hero도 값 색은 text 그대로 — 그라데이션 텍스트 금지(핵심 숫자의 가독이 시그니처보다 우선). */
  color: ${({ tone }) => TONE[tone]};
  font-weight: ${({ emphasis }) => (emphasis === 'hero' ? font.weight.extrabold : font.weight.bold)};
  line-height: ${font.leading.tight};
  letter-spacing: ${({ emphasis }) => (emphasis === 'hero' ? '-0.03em' : '-0.02em')};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  ${font.numeric};

  /* hero는 화면 폭에 따라 자란다. 좁은 화면에서 숫자가 잘리지 않도록 clamp(상한 44px). */
  font-size: ${({ emphasis }) => (emphasis === 'hero' ? `clamp(28px, 4vw, ${font.size['6xl']})` : font.size.lg)};
`;

/**
 * 목표 달성 진행률 바(§4.4).
 *
 * `div`가 아니라 `span`인 이유: 타일의 가장 가까운 `div` 조상은 타일 루트여야 한다
 * (TileLabelRow 주석 참고 — 앱 테스트가 `closest('div')`로 타일 전체를 읽는다).
 * 색만으로 전달하지 않는다 — 호출부(StatTile.tsx)가 hint 문장을 반드시 병기한다.
 */
export const ProgressTrack = styled.span`
  display: block;
  width: 100%;
  height: 6px;
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.progressTrack};
`;

export const ProgressFill = styled.span`
  display: block;
  height: 100%;
  min-width: 6px;
  border-radius: ${radius.pill};
  /* 표시용 리본 — progress-track 위 stop 최저 대비 3.19:1(라이트)/6.01:1(다크). */
  background: ${color.gradientAurora};
  /* 재계산으로 달성률이 바뀔 때는 부드럽게 이동. reduced-motion 전역 규칙이 끈다. */
  transition: width ${motion.slow} ${motion.ease};

  /* 마운트 시 0 → 목표값으로 1회 차오른다(§5.2). to가 없으면 현재 폭이 종점이 된다. */
  @media (prefers-reduced-motion: no-preference) {
    animation: sb-stat-progress-fill ${motion.slow} ${motion.ease};

    @keyframes sb-stat-progress-fill {
      from {
        width: 0;
        min-width: 0;
      }
    }
  }
`;

export const TileHint = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
