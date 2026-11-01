import type { CSSProperties } from 'react';
import { color } from '@/shared/styles';
import type { DividendTargetCategoryId } from '@/shared/lib/dividendTarget';

/**
 * 네 묶음의 색 — 묶음마다 다른 hue 를 준다(사용자 취향: 단색 절제는 "허접"하게 읽힌다).
 *
 * 🔴 **색은 묶음을 구분할 뿐 우열을 말하지 않는다.** 그래서 빨강·초록(위험·안전으로 읽히는 쌍)을
 *    묶음에 쓰지 않고, 데이터 색(`dataPositive`·`dataNegative`)은 물가 비교의 사실(이김/못 이김)에만 쓴다.
 * ⚠ 값은 전부 `color.*` 토큰이다 — 라이트/다크·프리셋을 따라간다. 틴트 면 위 글자는 `*Text` 만 쓴다
 *   (채움 위 글자는 대비가 보장되지 않는다).
 */
export type CategoryTone = {
  readonly solid: string;
  readonly subtle: string;
  readonly border: string;
  readonly text: string;
};

export const CATEGORY_TONE: Record<DividendTargetCategoryId, CategoryTone> = {
  growth: { solid: color.accent, subtle: color.accentSubtle, border: color.accentBorder, text: color.accentText },
  highYield: { solid: color.brand, subtle: color.brandSubtle, border: color.brandBorder, text: color.brandText },
  coveredCall: {
    solid: color.identity,
    subtle: color.identitySubtle,
    border: color.identityBorder,
    text: color.identityText
  },
  monthly: {
    solid: color.accentAlt,
    subtle: color.accentAltSubtle,
    border: color.accentAltBorder,
    text: color.accentAltText
  }
};

/**
 * 묶음 색을 **CSS 변수**(--tone-*)로 심는 style 객체. 상세 카드와 비교 묶음이 이것 하나를 쓴다.
 *
 * 변수로 내리는 이유: 자식 styled 부품이 묶음을 몰라도 같은 색을 쓰게 하려는 것이다. 컴포넌트
 * 셀렉터로 부모 색을 읽는 길은 막혀 있다(Emotion babel 플러그인 없음 — 런타임에서 깨진다).
 */
export const toneVars = (categoryId: DividendTargetCategoryId): CSSProperties => {
  const tone = CATEGORY_TONE[categoryId];
  return {
    '--tone-solid': tone.solid,
    '--tone-subtle': tone.subtle,
    '--tone-border': tone.border,
    '--tone-text': tone.text
  } as CSSProperties;
};
