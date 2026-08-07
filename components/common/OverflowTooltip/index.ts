export { default as OverflowTooltip } from './OverflowTooltip';
export type { OverflowTooltipProps } from './OverflowTooltip.types';
/* 🔴 툴팁을 다는 요소의 CSS 계약. 가로로 넘쳐야 잘림 판정이 성립한다 — 그 파일 주석 참고. */
export { isTextClipped, overflowTooltipTarget } from './OverflowTooltip.utils';
