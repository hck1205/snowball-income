import styled from '@emotion/styled';
import { color, elevation as elevationToken, font, radius, space } from '@/shared/styles';
import type { CardElevation, CardTone } from './Card.types';

/**
 * `tone='default'` 일 때 나오는 CSS 는 tone 도입 **이전과 완전히 같다** — 기존 카드 수십 곳의
 * 회귀를 0으로 두기 위한 조건이다. 새 값은 `sunken` 분기에만 들어간다.
 * (새 prop 은 `$` 접두 transient 로 둔다 — `$` 가 없으면 DOM 으로 새는 사고가 반복됐다.)
 */
export const CardContainer = styled.section<{ elevation: CardElevation; $tone: CardTone }>`
  background: ${({ $tone }) => ($tone === 'sunken' ? color.surfaceSunken : color.surface)};
  border: 1px solid ${color.border};
  border-radius: ${({ $tone }) => ($tone === 'sunken' ? radius.md : radius.lg)};
  padding: clamp(16px, 1.8vw, 20px);
  box-shadow: ${({ elevation, $tone }) => ($tone === 'sunken' ? 'none' : elevationToken[elevation])};
  color: ${color.text};
  min-width: 0;
  width: 100%;
  content-visibility: auto;
  contain-intrinsic-size: 280px;
  contain: layout paint style;
`;

export const CardHeader = styled.div<{ inlineTitleRight?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${({ inlineTitleRight }) => (inlineTitleRight ? 'flex-start' : 'space-between')};
  gap: ${space[2]};
  margin: 0 0 ${space[4]};
  min-height: 28px;
`;

export const CardTitleGroup = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const CardTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.02em;
  /* 320px에서 titleRight(라벨 달린 토글)에 밀려 제목이 2줄이 될 때, 한국어를 음절이 아니라
     어절 단위로 꺾는다. 그래도 안 맞는 긴 토큰(티커 등)은 anywhere로 넘치지 않게 끊는다. */
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

export const CardSubtitle = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.snug};
`;
