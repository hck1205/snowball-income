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

  /* hero 타일의 좌측 액센트 바 — 브랜드를 아주 절제해서 한 군데만 쓴다. */
  ${({ emphasis }) =>
    emphasis === 'hero'
      ? `
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: ${space[3]};
      bottom: ${space[3]};
      width: 3px;
      border-radius: 0 ${radius.pill} ${radius.pill} 0;
      background: ${color.brand};
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
  color: ${({ tone }) => TONE[tone]};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  ${font.numeric};

  /* hero는 화면 폭에 따라 자란다. 좁은 화면에서 숫자가 잘리지 않도록 clamp. */
  font-size: ${({ emphasis }) => (emphasis === 'hero' ? 'clamp(24px, 3.4vw, 30px)' : font.size.lg)};
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
