import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

type BadgeTone = 'pay' | 'ex' | 'unavailable' | 'nonDividend';

/**
 * 톤은 전부 **대비가 검증된 토큰 쌍**만 쓴다(`shared/styles/contrast.test.ts`):
 * success/success-surface, text-secondary/surface-sunken, text-muted/surface-muted.
 * 의미는 언제나 텍스트가 말하고, 색·테두리 모양은 보조다.
 *
 * ⚠ `ex`(추정)를 **accent-alt에서 중립(text-secondary/surface-sunken)으로 옮겼다**
 * (2026-07-28 아이덴티티 패스). 이유 두 가지:
 *  ① accent-alt가 그린이 되면서 "추정"이 **확정·양호(초록)로 오독**된다 — 이 배지는
 *    신뢰도가 낮다는 표시라 긍정색이 붙으면 안 된다. 정보 위계상으로도 보조 정보다.
 *  ② 남은 유채 대안이 전부 다른 것과 충돌한다(실측): brand 계열은 바로 위
 *    `AgendaDateBadge`(brand-subtle/brand-border/brand-text pill)와 같은 배지가 되고,
 *    accent(틸) 계열은 velog에서 accent==brand라 그 날짜 배지와 **hex가 동일**해진다.
 *
 * ⚠ `pay` 톤은 현재 **렌더되지 않는다** — 컴포넌트가 `source==='pay'`에서 null을 반환한다
 * (2026-07-26 결정: 기본값엔 배지를 달지 않는다). 되살릴 때는 success(초록)와
 * 다른 배지들의 거리를 다시 재라.
 */
const TONE_COLOR: Record<BadgeTone, string> = {
  pay: color.success,
  ex: color.textSecondary,
  unavailable: color.textMuted,
  nonDividend: color.textMuted
};

const TONE_BACKGROUND: Record<BadgeTone, string> = {
  pay: color.successSurface,
  ex: color.surfaceSunken,
  unavailable: color.surfaceMuted,
  nonDividend: color.surfaceMuted
};

/**
 * 데이터 준비 중은 테두리가 **점선** — 색을 못 보는 사람에게도 "확정 아님"이 형태로 남는다.
 *
 * `nonDividend`(배당 없음)는 같은 중립 색쌍에 **실선**을 쓴다: 둘 다 "캘린더에 놓을 수 없음"이라
 * 위계는 같지만, 점선=미확정 / 실선=확정된 사실이라는 이 배지의 어법을 그대로 따른다.
 * 새 색을 만들지 않은 이유 = 대비가 검증된 토큰 쌍(`contrast.test.ts`) 밖으로 나가지 않기 위해서다.
 * 의미의 본체는 언제나 텍스트가 말한다("배당 없음" vs "데이터 준비 중").
 */
const TONE_BORDER: Record<BadgeTone, string> = {
  pay: `1px solid ${color.successSurface}`,
  ex: `1px solid ${color.border}`,
  unavailable: `1px dashed ${color.border}`,
  nonDividend: `1px solid ${color.border}`
};

/**
 * 실측 / 추정 / 데이터 준비 중 / 배당 없음을 한 단어로 가르는 배지.
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
