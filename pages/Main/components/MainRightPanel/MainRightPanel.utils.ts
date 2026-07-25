import { TARGET_MONTHLY_DIVIDEND_INPUT_ID } from '@/shared/constants';

/** 좌측 설정 패널이 드로어로 접히는 폭. 이 아래에서는 "왼쪽 설정" 안내가 성립하지 않는다. */
const CONFIG_DRAWER_MEDIA = '(max-width: 960px)';

const matchesMedia = (query: string): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches;

/** 설정 패널이 드로어로 접혀 있는 폭인가(= 목표 입력이 화면에 없다). jsdom은 항상 false. */
export const isConfigDrawerLayout = (): boolean => matchesMedia(CONFIG_DRAWER_MEDIA);

const prefersReducedMotion = (): boolean => matchesMedia('(prefers-reduced-motion: reduce)');

/**
 * 목표 월배당 입력으로 스크롤 + 포커스를 옮긴다.
 *
 * 스크롤만으로는 키보드 포커스가 따라가지 않으므로 `focus`까지 한다(`preventScroll`로 두 번 튀지 않게).
 * jsdom에는 `scrollIntoView`가 없어 옵셔널 가드가 필수다. 필드를 못 찾으면 조용히 아무것도 안 한다
 * (드로어 애니메이션 중이거나 id가 바뀐 경우) — 호출부에서 rAF로 한 프레임 미룬 뒤에 부른다.
 */
export const focusTargetMonthlyDividendInput = (): void => {
  const field = typeof document === 'undefined' ? null : document.getElementById(TARGET_MONTHLY_DIVIDEND_INPUT_ID);
  if (!field) return;

  field.scrollIntoView?.({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
  field.focus?.({ preventScroll: true });
};
