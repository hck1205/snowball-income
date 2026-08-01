import type { PageHueName } from '@/shared/styles';

/**
 * 라우트가 배정받는 hue. `null` = **배정하지 않는다**(변수를 지운다) — 소비처는
 * `var(--sb-page-hue, var(--sb-brand))` 의 폴백으로 돌아간다.
 */
export type ResolvedPageHue = PageHueName | null;
