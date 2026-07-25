import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

type BadgeTone = 'pay' | 'ex' | 'unavailable';

/**
 * 톤은 전부 **대비가 검증된 토큰 쌍**만 쓴다(`shared/styles/contrast.test.ts`):
 * success/success-surface, accent-alt-text/accent-alt-subtle, text-muted/surface-muted.
 * 세 상태가 색으로도 확실히 갈리게 하되(사용자 피드백 2026-07-25 — 회색 일변도는 밋밋하다),
 * 의미는 언제나 텍스트가 말한다.
 */
const TONE_COLOR: Record<BadgeTone, string> = {
  pay: color.success,
  ex: color.accentAltText,
  unavailable: color.textMuted
};

const TONE_BACKGROUND: Record<BadgeTone, string> = {
  pay: color.successSurface,
  ex: color.accentAltSubtle,
  unavailable: color.surfaceMuted
};

/** 데이터 준비 중은 테두리도 점선 — 색을 못 보는 사람에게도 "확정 아님"이 형태로 남는다. */
const TONE_BORDER: Record<BadgeTone, string> = {
  pay: `1px solid ${color.successSurface}`,
  ex: `1px solid ${color.accentAltBorder}`,
  unavailable: `1px dashed ${color.border}`
};

/**
 * 실측 / 추정 / 데이터 준비 중을 한 단어로 가르는 배지.
 * 색은 보조일 뿐이고 **텍스트가 정보를 전부 말한다**(색만으로 전달 금지).
 */
export const SourceBadgeRoot = styled.span<{ $tone: BadgeTone }>`
  display: inline-block;
  padding: 0 ${space[2]};
  border: ${({ $tone }) => TONE_BORDER[$tone]};
  border-radius: ${radius.pill};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  color: ${({ $tone }) => TONE_COLOR[$tone]};
  background: ${({ $tone }) => TONE_BACKGROUND[$tone]};
`;
