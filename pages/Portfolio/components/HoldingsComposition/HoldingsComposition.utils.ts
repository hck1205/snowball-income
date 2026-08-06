import { color } from '@/shared/styles';
import { assignSeries } from '@/shared/lib/tickerSeries';
import { PORTFOLIO_COPY } from '../../copy';
import type { PortfolioHoldingRowModel } from '../HoldingsTable';
import type { CompositionSlice } from './HoldingsComposition.types';

const copy = PORTFOLIO_COPY;

/**
 * 도넛에 따로 그리는 조각 수의 상한.
 *
 * 왜 6인가: 팔레트는 8색이고 조각이 그보다 많아지면 색이 반드시 겹친다(`assignSeries` 가 9번째부터
 * 고향 색으로 되돌아간다). 겹친 순간 "이 색 = 그 종목"이라는 약속이 거짓이 되므로, 그 전에
 * **나머지를 하나로 접는다**. 6 을 고른 이유는 접힌 조각(`그 외`)까지 세어 7 조각 — 도넛에서 사람이
 * 한눈에 세어지는 상한이고, 남는 2색은 색 배정의 충돌 회피가 쓸 여유로 남긴다.
 */
export const COMPOSITION_MAX_SLICES = 6;

/**
 * 행 목록 → 도넛/범례 조각.
 *
 * 🔴 색 배정의 입력 집합은 **비중이 있는 행이 아니라 표에 보이는 행 전체**다. 표는 수량이 없는 행도
 * 그리고 거기에도 색 귀가 붙기 때문에, 여기서 집합을 좁히면 같은 종목이 표와 도넛에서 다른 색이 된다
 * (`assignSeries` 는 집합 내 충돌 회피를 하므로 집합이 달라지면 답이 달라진다).
 */
export const buildCompositionSlices = (
  rows: readonly PortfolioHoldingRowModel[],
  maxSlices: number = COMPOSITION_MAX_SLICES
): CompositionSlice[] => {
  const seriesByTicker = assignSeries(rows.map((row) => row.ticker));

  const weighted = rows
    .filter((row): row is PortfolioHoldingRowModel & { weightPercent: number } => (row.weightPercent ?? 0) > 0)
    .sort((left, right) => right.weightPercent - left.weightPercent);

  if (weighted.length === 0) return [];

  const head = weighted.slice(0, maxSlices).map((row) => ({
    label: row.ticker,
    percent: row.weightPercent,
    paint: seriesByTicker.get(row.ticker) ?? color.borderStrong,
    isRest: false
  }));

  const restTotal = weighted.slice(maxSlices).reduce((sum, row) => sum + row.weightPercent, 0);
  if (restTotal <= 0) return head;

  /* 접힌 조각은 **중립색**이다 — 팔레트 밖 색을 만들지 않는다(대비 검증 밖이다). */
  return [...head, { label: copy.summary.composition.others, percent: restTotal, paint: color.borderStrong, isRest: true }];
};

/**
 * 조각 → `conic-gradient` 색 정지점 문자열.
 *
 * ECharts 를 쓰지 않는 이유: 이 도넛은 **값을 읽는 차트가 아니라 짝짓기 단서**다(정확한 각도를
 * 읽을 사람은 바로 옆 범례의 숫자를 본다). 캔버스를 띄우면 라이트/다크 전환마다 테마 hex 를 다시
 * 넣어야 하고 lazy 청크가 하나 는다 — CSS 변수는 테마 전환을 **공짜로** 따라간다.
 *
 * ⚠ 마지막 조각은 언제나 `100%` 로 닫는다. 부동소수 합이 99.9997% 로 끝나면 마지막 각도에
 * 머리카락만 한 틈이 생기고, 그 틈에 뒤 면색이 비쳐 "조각 하나가 더 있는 것"처럼 보인다.
 */
export const buildConicStops = (slices: readonly CompositionSlice[]): string => {
  if (slices.length === 0) return '';

  const stops: string[] = [];
  let cursor = 0;

  slices.forEach((slice, index) => {
    const start = cursor;
    cursor = index === slices.length - 1 ? 100 : Math.min(100, cursor + slice.percent);
    stops.push(`${slice.paint} ${start}% ${cursor}%`);
  });

  return stops.join(', ');
};
