/**
 * Clamps a percent input to 0~100; non-finite input falls back to 0.
 *
 * `pages/Main/utils/allocation`에서 승격했다 — 재사용 컴포넌트(`components/InvestmentSettings`)가
 * 페이지 레이어를 역방향 import하지 않도록 도메인 무관 순수 유틸로 여기 둔다.
 */
export const clampPercent = (value: number): number => (Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0);
