/**
 * 진행률 표시용 순수 함수들.
 *
 * StatTile은 값을 포맷하지 않는 컴포넌트지만(포맷은 호출부 소유), 진행률의 클램프와
 * "색만으로 전달 금지" 병기 문구(§4.4 카피 확정)는 **표시 규칙**이라 타일이 소유한다 —
 * 호출부마다 문구가 달라지면 같은 바가 다른 말을 하게 된다.
 */

/** 진행률을 0~1로 클램프. 비정상 값(NaN/Infinity)은 0으로 취급한다 — 바는 항상 그릴 수 있어야 한다. */
export const clampProgress = (value: number): number =>
  Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;

/**
 * 0~1 → 0~100 정수 퍼센트. aria-valuenow·바 폭·병기 문구가 같은 숫자를 쓰게 하는 단일 출처.
 *
 * 100%는 **진짜 달성(≥1)에만** 허락한다 — 0.995~0.999를 반올림으로 100에 올려붙이면
 * "목표의 100% 도달"(미달성 문구)이라는 모순이 생기므로 미달성은 99에서 캡한다.
 */
export const toProgressPercent = (value: number): number => {
  const clamped = clampProgress(value);
  return clamped >= 1 ? 100 : Math.min(99, Math.round(clamped * 100));
};

/** 진행률 병기 문구 — 달성 전 "목표의 N% 도달", 달성(≥1) 시 "목표 달성". */
export const formatProgressHint = (value: number): string => {
  const clamped = clampProgress(value);
  return clamped >= 1 ? '목표 달성' : `목표의 ${toProgressPercent(clamped)}% 도달`;
};
