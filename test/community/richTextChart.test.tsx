import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { RichTextContent } from '@/components/community/RichTextContent';
import { sanitizePostBody } from '@/server/handlers/PostHtml/serverSanitize';
import { parseCellNumber, parseRichChartTable, sanitizeRichHtml } from '@/shared/lib/richtext';

/**
 * 본문 표 차트(`<table data-chart="bar|line">`, 2026-11-09).
 *
 * 잠그는 것: ① `data-chart` 는 **표에만, 정해진 값으로만** 산다(클라이언트·서버 정화 둘 다) ② 칸 숫자를
 * 통화·퍼센트·억/만·막대 기호 섞여도 읽는다 ③ 차트는 표 **앞에 덧그려지고** 표는 남는다 ④ 차트 표가 없는
 * 글은 DOM 이 이전과 같다(본문 스타일이 직계 자식 선택자에 기댄다).
 */
const chartTable = (kind: string, rows: string[][]) =>
  `<table data-chart="${kind}"><tbody>${rows
    .map((row, index) => `<tr>${row.map((cell) => (index === 0 ? `<th>${cell}</th>` : `<td>${cell}</td>`)).join('')}</tr>`)
    .join('')}</tbody></table>`;

const SAMPLE = chartTable('bar', [
  ['종목', '배당률'],
  ['SCHD', '3.23%'],
  ['JEPI', '▇▇▇▇ 7.55%'],
  ['O', '6.07%']
]);

describe('정화 — data-chart 는 표에만, 정해진 값으로만', () => {
  it('🔴 표의 bar·line 은 남는다', () => {
    expect(sanitizeRichHtml(SAMPLE)).toContain('data-chart="bar"');
    expect(sanitizeRichHtml(chartTable('line', [['a', 'b'], ['x', '1'], ['y', '2']]))).toContain('data-chart="line"');
  });

  it('🔴 정해지지 않은 값·표가 아닌 곳의 data-chart 는 지워진다', () => {
    expect(sanitizeRichHtml(chartTable('pie', [['a', 'b'], ['x', '1'], ['y', '2']]))).not.toContain('data-chart');
    expect(sanitizeRichHtml('<p data-chart="bar">글</p>')).not.toContain('data-chart');
    expect(sanitizeRichHtml('<table data-chart="bar&quot; onclick=&quot;x"><tbody><tr><td>1</td></tr></tbody></table>')).not.toContain(
      'data-chart'
    );
  });

  it('다른 data-* 는 여전히 열리지 않는다', () => {
    expect(sanitizeRichHtml('<table data-foo="1" data-chart="bar"><tbody><tr><td>1</td></tr></tbody></table>')).not.toContain('data-foo');
  });

  it('서버 정화(크롤러 HTML)도 같은 규칙이다', () => {
    expect(sanitizePostBody(SAMPLE)).toContain('data-chart="bar"');
    expect(sanitizePostBody('<p data-chart="bar">글</p>')).not.toContain('data-chart');
  });
});

describe('parseCellNumber', () => {
  it('통화·퍼센트·쉼표·막대 기호를 무시하고 억·만을 원으로 푼다', () => {
    expect(parseCellNumber('3.23%')).toBe(3.23);
    expect(parseCellNumber('$35.17')).toBe(35.17);
    expect(parseCellNumber('1,200')).toBe(1200);
    expect(parseCellNumber('-4.5%')).toBe(-4.5);
    expect(parseCellNumber('▇▇▇ 7.6%')).toBe(7.6);
    expect(parseCellNumber('4억 3,708만원')).toBe(437_080_000);
    expect(parseCellNumber('21만원')).toBe(210_000);
    expect(parseCellNumber('없음')).toBeNull();
  });
});

describe('parseRichChartTable', () => {
  const tableOf = (html: string) => {
    const host = document.createElement('div');
    host.innerHTML = sanitizeRichHtml(html);
    return host.querySelector('table')!;
  };

  it('첫 행은 시리즈 이름, 첫 열은 항목, 숫자 아닌 열은 빠진다', () => {
    const data = parseRichChartTable(
      tableOf(chartTable('line', [['연차', '자산', '메모'], ['1년', '1억', '시작'], ['2년', '1억 2,000만', '중간'], ['3년', '1.5억', '끝']]))
    )!;
    expect(data.kind).toBe('line');
    expect(data.categories).toEqual(['1년', '2년', '3년']);
    expect(data.series).toEqual([{ name: '자산', values: [100_000_000, 120_000_000, 150_000_000] }]);
  });

  it('데이터 행이 2개 미만이거나 숫자 열이 없으면 차트를 만들지 않는다', () => {
    expect(parseRichChartTable(tableOf(chartTable('bar', [['a', 'b'], ['x', '1']])))).toBeNull();
    expect(parseRichChartTable(tableOf(chartTable('bar', [['a', 'b'], ['x', '가'], ['y', '나']])))).toBeNull();
  });
});

describe('RichTextContent — 차트 덧그리기', () => {
  it('🔴 차트 표 바로 앞에 차트 자리가 생기고, 표는 그대로 남는다', () => {
    const { container } = render(<RichTextContent html={`<p>본문</p>${SAMPLE}`} />);
    const table = container.querySelector('table[data-chart]')!;

    expect(table).not.toBeNull();
    expect(table.previousElementSibling?.hasAttribute('data-rich-chart')).toBe(true);
    expect(container.querySelector('[data-rich-chart] [role="img"]')).not.toBeNull();
    expect(table.textContent).toContain('7.55%');
  });

  it('🔴 차트 표가 없는 글은 DOM 이 이전과 같다 (차트 자리 0)', () => {
    const html = '<p>첫 문단</p><table><tbody><tr><th>a</th><th>b</th></tr><tr><td>x</td><td>1</td></tr></tbody></table>';
    const { container } = render(<RichTextContent html={html} />);

    expect(container.querySelector('[data-rich-chart]')).toBeNull();
    expect(container.firstElementChild!.innerHTML).toBe(sanitizeRichHtml(html));
  });
});
