import type { MarketDayCell } from '../../utils';
import type { CellTone, DotKind } from './MonthGrid.styled';

/** 거래 상태 → 칸 면색. 큐레이션 밖(=`null`)은 **모른다**이지 "열려 있다"가 아니다. */
export const toneOf = (cell: MarketDayCell): CellTone => cell.trading?.status ?? 'unknown';

/**
 * 칸에 찍을 점들. 순서가 곧 중요도다 — FOMC → 경제지표 → 실적.
 * ⚠ 실적은 하루에 수십 건이라 점 하나로만 표시한다(개수를 점으로 세면 칸이 점으로 뒤덮인다).
 */
export const dotsOf = (cell: MarketDayCell): DotKind[] => {
  const dots: DotKind[] = [];
  if (cell.events.fomc) dots.push('fomc');
  if (cell.events.economic.length > 0) dots.push('economic');
  if (cell.events.earnings.length > 0) dots.push('earnings');
  return dots;
};

/**
 * 칸 안에 글자로 적을 상태 이름.
 *
 * 🔴 이 글자가 **색의 백업**이다. 색각 이상·흑백 인쇄에서 면색이 사라져도 "휴장 · 추수감사절"은
 * 남는다. 정상 거래일에는 아무것도 적지 않는다 — 42칸 중 대부분이 정상이라, 거기까지 적으면
 * 예외가 묻힌다.
 */
export const labelOf = (cell: MarketDayCell): string | null => {
  const trading = cell.trading;
  if (!trading) return null;
  if (trading.status === 'closed') return `휴장 · ${trading.labelKo ?? '휴일'}`;
  if (trading.status === 'early') return `조기 폐장 · ${trading.labelKo ?? ''}`.trim();
  return null;
};

/**
 * 마우스를 올렸을 때 뜨는 그 날의 요약.
 *
 * 점만 있으면 "무슨 일정인지"를 알 방법이 없다 — 점이 색 단독 채널이 되지 않게 이 문자열이
 * `title` 로 붙는다. 실적은 개수만 말한다(종목 수십 개를 툴팁에 늘어놓을 수는 없다).
 */
export const summaryOf = (cell: MarketDayCell): string | undefined => {
  const parts: string[] = [];
  const label = labelOf(cell);
  if (label) parts.push(label);
  if (cell.events.fomc) parts.push('FOMC 금리 결정');
  for (const event of cell.events.economic) parts.push(event.nameKo);
  if (cell.events.earnings.length > 0) parts.push(`실적 발표 ${cell.events.earnings.length}건`);
  return parts.length > 0 ? parts.join(' · ') : undefined;
};
