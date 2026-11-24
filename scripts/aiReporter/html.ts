/**
 * AI 리포터 글의 HTML 조각 — 게시판 정화 규칙(`shared/lib/richtext/sanitize.ts` ALLOWED_TAGS)이 남기는
 * 태그만 만든다: table · tbody · tr · th · td · p · strong · a. `data-chart` 는 표에만 붙는다.
 */

/** 여는·닫는 태그 이름들(소문자). 허용 태그 검사에 쓴다(`rules.ts` · `marketNews.ts`). */
export const tagsOf = (html: string): string[] =>
  [...html.matchAll(/<\s*\/?\s*([a-zA-Z][a-zA-Z0-9]*)/g)].map((match) => match[1]!.toLowerCase());

/** 태그를 지운 글 — 글자 수·문장 검사에 쓴다. */
export const stripTags = (html: string): string => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export type ReporterTable = {
  /** 표 위 소제목(h3). */
  readonly caption: string;
  /** 차트로도 그릴지. 숫자 열이 있는 표에만 준다. */
  readonly chart?: 'bar' | 'line';
  readonly head: readonly string[];
  readonly rows: readonly (readonly string[])[];
};

export const renderTable = ({ caption, chart, head, rows }: ReporterTable): string => {
  const headRow = `<tr>${head.map((cell) => `<th>${escapeHtml(cell)}</th>`).join('')}</tr>`;
  const bodyRows = rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('');
  const chartAttr = chart ? ` data-chart="${chart}"` : '';
  return `<h3>${escapeHtml(caption)}</h3><table${chartAttr}><tbody>${headRow}${bodyRows}</tbody></table>`;
};
