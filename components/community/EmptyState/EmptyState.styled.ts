import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/**
 * 빈 목록 자리.
 *
 * 회색 면(`surfaceMuted`)이 아니라 **파스텔 워시**를 깐다 — 빈 화면은 "고장" 이 아니라
 * "아직 시작 전"이고, 그 차이를 색이 말한다(디자인 결정 트랙 ③, 시뮬레이터 빈 상태와 같은 어휘).
 * 점선 테두리는 남긴다 — 채워질 자리임을 형태가 말한다.
 *
 * `gradient-hero-soft` 를 쓰는 이유는 시뮬레이터 빈 상태와 같다: 8프리셋 × 라이트/다크
 * 대비 검증을 이미 통과한 값이라 새 색을 지어내지 않는다.
 */
export const EmptyRoot = styled.div`
  display: grid;
  justify-items: center;
  gap: ${space[3]};
  text-align: center;
  padding: clamp(${space[8]}, 8vw, ${space[16]}) ${space[5]};
  border: 1px dashed ${color.border};
  border-radius: ${radius.lg};
  background: ${color.gradientHeroSoft};
`;

export const EmptyIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${color.brandSubtle};
  color: ${color.brandText};
`;

export const EmptyTitle = styled.p`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
`;

export const EmptySubtitle = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: ${font.leading.normal};
`;
