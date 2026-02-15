import { formatKRW } from '@/shared/utils';

export const targetYearLabel = (year: number | undefined): string => (year ? `${year}년` : '미도달');

export const formatPercent = (value: number): string => `${(value * 100).toFixed(2)}%`;

export const formatApproxKRW = (value: number): string => {
  const sign = value < 0 ? '-' : '';
  const absValue = Math.abs(value);

  if (absValue >= 100_000_000) {
    const inEok = Math.round((absValue / 100_000_000) * 10) / 10;
    const label = Number.isInteger(inEok) ? `${inEok.toFixed(0)}억` : `${inEok.toFixed(1)}억`;
    return `${sign}약 ${label}`;
  }

  if (absValue >= 10_000) {
    const inMan = Math.round(absValue / 10_000);
    return `${sign}약 ${inMan.toLocaleString()}만`;
  }

  return `${sign}약 ${Math.round(absValue).toLocaleString()}원`;
};

export const formatResultAmount = (value: number, compact: boolean): string => (compact ? formatApproxKRW(value) : formatKRW(value));
