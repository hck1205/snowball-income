/**
 * Keeps the user's chosen year while it still exists, otherwise falls back to the latest year.
 * Returns null when there is no cashflow data at all.
 */
export const resolveSelectedYear = (years: number[], previousYear: number | null): number | null => {
  if (years.length === 0) return null;
  if (previousYear !== null && years.includes(previousYear)) return previousYear;

  return years[years.length - 1] ?? null;
};
