import { color } from '@/shared/styles';
import type { PickCapAxis, PickCardCap } from './PickCard.types';

/**
 * 캡 한 벌이 쓰는 색 4개. **부품은 색을 만들지 않는다** — 역할 토큰 또는 호출부가 준 변수를 고를 뿐이다.
 */
export type PickCapPaint = {
  /** 레일(6px 줄)의 색. 채도가 있는 솔리드 — 비텍스트라 L1 로 취급된다. */
  rail: string;
  /** 틴트 캡 면의 색. L2 틴트. */
  fill: string;
  /** 캡 위의 글자·글리프 색. */
  ink: string;
  /** 캡과 바디 사이 1px 경계. */
  edge: string;
};

/**
 * 축 → 토큰 4종. 이 표가 "색을 고를 수 있는 전부"다.
 *
 * `identity` 의 `ink` 가 `identity`(솔리드)가 아니라 `identityText` 인 것이 중요하다 —
 * identity 채움 위 텍스트는 다크에서 2.79:1 이라 `semantic.ts` 가 명시적으로 금지한다.
 */
const AXIS_PAINT: Record<Exclude<PickCapAxis, 'scoped'>, PickCapPaint> = {
  brand: { rail: color.brand, fill: color.brandSubtle, ink: color.brandText, edge: color.brandBorder },
  accent: { rail: color.accent, fill: color.accentSubtle, ink: color.accentText, edge: color.accentBorder },
  accentAlt: {
    rail: color.accentAlt,
    fill: color.accentAltSubtle,
    ink: color.accentAltText,
    edge: color.accentAltBorder
  },
  identity: { rail: color.identity, fill: color.identitySubtle, ink: color.identityText, edge: color.identityBorder }
};

/**
 * 캡 정의 → 실제 CSS 색 값 4개.
 *
 * 🔴 `scoped` 의 `ink` 기본값이 **중립 텍스트**인 이유: 호출부가 주는 변수의 실제 색을 부품은 모른다.
 * 모르는 면 위에 색 글자를 얹으면 대비를 보장할 수 없다. 색 글자가 필요하면 호출부가
 * `scopedInkVar` 로 **자기가 대비를 검증한 변수**를 함께 준다(예: 티커 상세의 `--tk-text`).
 *
 * `scopedVar` 를 빠뜨린 `scoped` 축은 브랜드 축으로 떨어진다 — 색이 사라져 카드가 무채색이 되는
 * 것보다, 앱의 기본 축으로 그려지는 편이 화면에서 덜 틀리다.
 */
export const resolveCapPaint = (cap: PickCardCap): PickCapPaint => {
  if (cap.axis !== 'scoped') return AXIS_PAINT[cap.axis];
  if (!cap.scopedVar) return AXIS_PAINT.brand;

  const scoped = `var(${cap.scopedVar})`;
  return {
    rail: scoped,
    fill: scoped,
    ink: cap.scopedInkVar ? `var(${cap.scopedInkVar})` : color.text,
    edge: `color-mix(in srgb, ${scoped} 60%, transparent)`
  };
};

/**
 * 세 갈래 중 어느 컨트롤로 렌더할지. 우선순위는 `to` > `href` > `onClick` 이고,
 * 셋 다 없으면 카드는 **누를 수 없는 면**이다(정보 카드로도 쓰이기 때문이다).
 */
export type PickControlKind = 'router' | 'anchor' | 'button' | 'none';

export const resolveControlKind = ({
  to,
  href,
  onClick
}: {
  to?: string;
  href?: string;
  onClick?: () => void;
}): PickControlKind => {
  if (to) return 'router';
  if (href) return 'anchor';
  if (onClick) return 'button';
  return 'none';
};
