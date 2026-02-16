export const getTickerDisplayName = (ticker: string, name?: string): string => {
  const trimmedName = (name ?? '').trim();
  return trimmedName.length > 0 ? trimmedName : ticker;
};
