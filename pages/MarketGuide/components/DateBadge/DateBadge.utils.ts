const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** `2026-11-26` → 11월 · 26 · 목 (날짜 블록 세 줄). 요일은 달력 날짜 그대로(시간대 무관). */
export const dateParts = (date: string): { readonly month: string; readonly day: string; readonly weekday: string } => {
  const [y, m, d] = date.split('-').map(Number);
  const weekday = WEEKDAY_KO[new Date(y!, m! - 1, d!).getDay()]!;
  return { month: `${m}월`, day: String(d), weekday };
};
