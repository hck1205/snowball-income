/**
 * Clamps a percent input to 0~100; non-finite input falls back to 0.
 *
 * `pages/Main/utils/allocation`에서 승격했다 — 재사용 컴포넌트(`components/InvestmentSettings`)가
 * 페이지 레이어를 역방향 import하지 않도록 도메인 무관 순수 유틸로 여기 둔다.
 */
export const clampPercent = (value: number): number => (Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0);

/**
 * 전일 대비 변동률 표시 문자열. `shared/lib/fx`(FxChange)와 `shared/lib/marketIndices`(IndexChange)가
 * 구조적으로 같은 모양이라 **한 포맷터가 두 표면을 다 덮는다** — 복제하면 두 화면 표기가 조용히 어긋난다
 * (formatSummaryKRW 단일 포맷터 결정과 같은 취지).
 *
 * 부호는 `direction` 에서만 뽑는다(숫자에서 뽑으면 -0.001 이 "-0.00%" 로 찍힌다).
 * ⚠ 음수 부호는 **ASCII 하이픈(U+002D)** 이다. 타이포상 U+2212 가 더 낫지만 기존 부호 표기
 *   (formatApproxKRW/formatApproxUSD)가 ASCII 라 표기를 갈라놓지 않는다.
 */
export const formatChangePercent = (change: { percent: number; direction: 'up' | 'down' | 'flat' }): string => {
  const sign = change.direction === 'up' ? '+' : change.direction === 'down' ? '-' : '';
  return `${sign}${Math.abs(change.percent).toFixed(2)}%`;
};
