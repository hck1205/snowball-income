export type RedistributeAllocationWeightsParams = {
  /** Ticker whose slider was moved. */
  targetId: string;
  /** Raw slider value in percent; may be NaN or out of the 0~100 range. */
  rawValue: number;
  /** Ids currently included in the portfolio, in display order. */
  includedIds: string[];
  fixedById: Record<string, boolean>;
  /** Current (unrounded) allocation percent per ticker. */
  percentExactById: Record<string, number>;
};

/** Clamps a percent input to 0~100; non-finite input falls back to 0. */
export const clampPercent = (value: number): number => (Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0);

/**
 * Rebuilds the allocation percent map after one slider moves.
 *
 * - Fixed tickers keep their current percent.
 * - The remaining budget (100 - fixed sum) is split between the target and the other mutable tickers.
 * - Other mutable tickers share the leftover proportionally to their current percent,
 *   or equally when their current percents all sum to 0.
 * - When the target is the only mutable ticker it absorbs the whole remaining budget.
 */
export const redistributeAllocationWeights = ({
  targetId,
  rawValue,
  includedIds,
  fixedById,
  percentExactById
}: RedistributeAllocationWeightsParams): Record<string, number> => {
  const nextTarget = clampPercent(rawValue);
  const fixedIds = includedIds.filter((id) => fixedById[id] && id !== targetId);
  const otherMutableIds = includedIds.filter((id) => !fixedById[id] && id !== targetId);

  const fixedSum = fixedIds.reduce((sum, id) => sum + (percentExactById[id] ?? 0), 0);
  const maxTarget = Math.max(0, 100 - fixedSum);
  const targetValue = otherMutableIds.length === 0 ? maxTarget : Math.min(nextTarget, maxTarget);
  const remaining = Math.max(0, maxTarget - targetValue);

  const nextMap: Record<string, number> = {};
  fixedIds.forEach((id) => {
    nextMap[id] = percentExactById[id] ?? 0;
  });
  nextMap[targetId] = targetValue;

  if (otherMutableIds.length > 0) {
    const otherBase = otherMutableIds.reduce((sum, id) => sum + (percentExactById[id] ?? 0), 0);
    if (otherBase === 0) {
      const equalWeight = remaining / otherMutableIds.length;
      otherMutableIds.forEach((id) => {
        nextMap[id] = equalWeight;
      });
    } else {
      otherMutableIds.forEach((id) => {
        nextMap[id] = (remaining * (percentExactById[id] ?? 0)) / otherBase;
      });
    }
  }

  return nextMap;
};
