import type { MarketDayCell } from '../../utils';
import type { CellTone, DotKind } from './MonthGrid.styled';

/** 거래 상태 → 칸 면색. 큐레이션 밖(=`null`)은 **모른다**이지 "열려 있다"가 아니다. */
export const toneOf = (cell: MarketDayCell): CellTone => cell.trading?.status ?? 'unknown';

/**
 * 칸에 찍을 점들. 순서가 곧 중요도다 — FOMC → 경제지표 → 실적.
 * ⚠ 실적은 하루에 수십 건이라 점 하나로만 표시한다(개수를 점으로 세면 칸이 점으로 뒤덮인다).
 *
 * ⚠ 이제 화면은 점이 아니라 **칩**(`chipsOf`)을 그린다. 이 함수는 좁은 폭에서 칩이 점으로
 *   줄어드는 형태의 근거이자 범례가 쓰는 색 목록이라 남겨 둔다.
 */
export const dotsOf = (cell: MarketDayCell): DotKind[] => {
  const dots: DotKind[] = [];
  if (cell.events.fomc) dots.push('fomc');
  if (cell.events.economic.length > 0) dots.push('economic');
  if (cell.events.earnings.length > 0) dots.push('earnings');
  return dots;
};

/**
 * 한 칸에 보여 줄 칩의 최대 개수.
 *
 * 🔴 배당 캘린더(3개)보다 **하나 적다.** 그쪽 칩은 `SCHD` 같은 티커라 짧지만 이쪽은
 * "근원 생산자물가지수" 같은 지표 이름이 섞인다 — 셋을 세우면 전부 말줄임이 되어 아무것도
 * 못 읽는 칸이 된다. 둘로 줄이고 나머지는 `+N` 과 칸 전체 `title` 이 말한다.
 */
export const MAX_DAY_CHIPS = 2;

/** 칸 안에 글자로 세우는 일정 하나. */
export type DayChip = {
  /** React key 이자 중복 제거의 기준. */
  readonly key: string;
  readonly kind: DotKind;
  readonly label: string;
};

/**
 * 칸에 세울 칩들 — **점이 말하지 못하던 "무엇이 있는가"를 글자로 말한다.**
 *
 * 순서는 `dotsOf` 와 같은 중요도다(FOMC → 경제지표 → 실적). 실적은 하루 열두 건까지 나오므로
 * **우리 앱에 소개 페이지가 있는 종목을 앞으로** 올린다 — 사용자가 아는 이름이 먼저 보여야
 * `+N` 으로 접히는 나머지가 덜 아쉽다.
 *
 * ⚠ 정렬은 원본 배열을 건드리지 않는다(스냅샷은 모듈 상수라 한 번 뒤집으면 전 화면이 바뀐다).
 */
export const chipsOf = (cell: MarketDayCell): DayChip[] => {
  const chips: DayChip[] = [];
  if (cell.events.fomc) chips.push({ key: 'fomc', kind: 'fomc', label: 'FOMC' });
  for (const event of cell.events.economic) {
    chips.push({ key: `economic:${event.nameKo}`, kind: 'economic', label: event.nameKo });
  }
  const earnings = [...cell.events.earnings].sort(
    (left, right) => Number(right.hasTickerPage) - Number(left.hasTickerPage)
  );
  for (const event of earnings) {
    chips.push({ key: `earnings:${event.ticker}`, kind: 'earnings', label: event.ticker });
  }
  return chips;
};

/**
 * 보이는 칩과 접힌 개수로 가른다.
 *
 * 🔴 접힌 것을 **숫자로 말한다**(팝오버를 만들지 않는다). 접혔다는 사실조차 숨기면 그 칸은
 * "일정이 둘뿐"이라고 거짓말한다 — 배당 캘린더의 `splitDayChips` 와 같은 판단이다.
 */
export const splitDayChips = (
  chips: readonly DayChip[],
  limit: number = MAX_DAY_CHIPS
): { visible: DayChip[]; hiddenCount: number } => ({
  visible: chips.slice(0, limit),
  hiddenCount: Math.max(chips.length - limit, 0)
});

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
