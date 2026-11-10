import { isRichTableChartKind, type RichTableChartKind } from './sanitize';

/**
 * 본문 표 → 차트 데이터(2026-11-09). `<table data-chart="bar|line">` 을 렌더러가 차트로도 그린다.
 *
 * ## 표의 모양(약속)
 * - **첫 행** = 머리. 첫 칸은 항목 이름의 머리("종목"), 나머지 칸은 시리즈 이름("배당률" …).
 * - **첫 열** = 항목(가로축 라벨). 나머지 열 = 숫자.
 * - 숫자로 읽히지 않는 열(예: "메모")은 시리즈에서 **빠진다**. 숫자 열이 하나도 없으면 차트를 만들지 않는다.
 *
 * ## 숫자 읽기 (`parseCellNumber`)
 * `3.23%` · `$35.17` · `1,200` · `-4.5` · `4억 3,708만원` · `▇▇▇ 7.6%` 를 읽는다. 억·만 단위는 원 단위로 푼다.
 * 읽을 수 없으면 `null` — 차트에서 그 점은 비운다(0 으로 그리지 않는다).
 *
 * ⚠ 이 모듈은 **정화된** 표만 받는다(호출부가 `sanitizeRichHtml` 뒤에 부른다). 여기서 하는 것은 읽기뿐이다.
 */

/** 차트로 그릴 항목·시리즈의 상한 — 그보다 큰 표는 차트가 읽히지 않는다(표는 그대로 남는다). */
export const RICH_CHART_MAX_CATEGORIES = 24;
export const RICH_CHART_MAX_SERIES = 6;

export type RichChartSeries = {
  readonly name: string;
  readonly values: readonly (number | null)[];
};

export type RichChartData = {
  readonly kind: RichTableChartKind;
  readonly categories: readonly string[];
  readonly series: readonly RichChartSeries[];
};

const EOK = 100_000_000;
const MAN = 10_000;

/** 칸 글자 → 숫자. 억·만 단위를 풀고, 통화·퍼센트·막대 기호·쉼표를 무시한다. 못 읽으면 null. */
export const parseCellNumber = (raw: string): number | null => {
  const text = raw.replace(/,/g, '').trim();
  if (!text) return null;

  const eok = /(-?\d+(?:\.\d+)?)\s*억/.exec(text);
  const man = /(-?\d+(?:\.\d+)?)\s*만/.exec(text);
  if (eok || man) {
    const value = (eok ? Number(eok[1]) * EOK : 0) + (man ? Number(man[1]) * MAN : 0);
    return Number.isFinite(value) ? value : null;
  }

  const plain = /-?\d+(?:\.\d+)?/.exec(text);
  if (!plain) return null;
  const value = Number(plain[0]);
  return Number.isFinite(value) ? value : null;
};

const cellText = (cell: Element): string => (cell.textContent ?? '').replace(/\s+/g, ' ').trim();

/** 표 하나를 차트 데이터로. 약속에 맞지 않거나 그릴 게 없으면 `null`. */
export const parseRichChartTable = (table: Element): RichChartData | null => {
  const kind = table.getAttribute('data-chart');
  if (!isRichTableChartKind(kind)) return null;

  const rows = Array.from(table.querySelectorAll('tr')).map((row) => Array.from(row.querySelectorAll('th, td')));
  const [head, ...body] = rows;
  if (!head || head.length < 2 || body.length < 2 || body.length > RICH_CHART_MAX_CATEGORIES) return null;

  const categories = body.map((cells) => (cells[0] ? cellText(cells[0]) : ''));
  const series: RichChartSeries[] = [];
  for (let column = 1; column < head.length; column += 1) {
    const values = body.map((cells) => (cells[column] ? parseCellNumber(cellText(cells[column]!)) : null));
    if (values.every((value) => value === null)) continue;
    series.push({ name: cellText(head[column]!), values });
  }
  if (series.length === 0 || series.length > RICH_CHART_MAX_SERIES) return null;

  return { kind, categories, series };
};
