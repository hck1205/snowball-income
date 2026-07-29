import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';
import type { PortfolioFreshnessTone } from './FreshnessBadge.types';

/**
 * 톤은 **대비가 검증된 토큰 쌍**만 쓴다(`shared/styles/contrast.test.ts`):
 * warning/warning-surface · text-muted/surface-muted.
 * 색은 보조일 뿐이고 **텍스트가 사실을 전부 말한다**(색 단독 전달 금지).
 *
 * ⚠ `manual`(사용자가 손으로 넣어 앱이 갱신하지 않는 값)은 **중립**이다 — 예전의 accent-alt(그린)는
 * "최신·정상"이라는 긍정 신호로 오독됐다. 같은 이유로 ScheduleSourceBadge 의 `ex`(추정)도 중립으로 옮겼다.
 * 테두리를 점선으로 두는 것은 `stale-price`(warning·실선)와 **형태로도** 갈라 색 단독 전달을 피하기 위함이다.
 */
const TONE_COLOR: Record<PortfolioFreshnessTone, string> = {
  'stale-price': color.warning,
  manual: color.textMuted
};

const TONE_BACKGROUND: Record<PortfolioFreshnessTone, string> = {
  'stale-price': color.warningSurface,
  manual: color.surfaceMuted
};

const TONE_BORDER: Record<PortfolioFreshnessTone, string> = {
  'stale-price': `1px solid ${color.warningSurface}`,
  manual: `1px dashed ${color.border}`
};

export const FreshnessBadgeRoot = styled.span<{ $tone: PortfolioFreshnessTone }>`
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
