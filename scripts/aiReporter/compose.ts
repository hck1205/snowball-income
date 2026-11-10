import { escapeHtml } from './html';
import type { ReporterDraft, ReporterFacts } from './types';

/**
 * ⚠ AI 작성 고지는 **본문에 넣지 않는다**(2026-11-10). 글 상세 화면이 작성자가 AI 리포터면 본문 아래에
 * 고지 상자(`AiReporterNote`)를 그린다 — 본문 끝 기울임 문단으로 두면 본문과 같은 크기로 읽혀 글이 지저분했다.
 * 문구 정본은 `shared/constants/community/aiReporter.ts` 의 `AI_REPORTER.disclaimer` 다.
 */

/**
 * 게시글 본문 조립 — 순서: LLM 본문 → 표(사실이 구운 HTML) → 더 보기 링크 → 출처.
 * 표·출처는 LLM 이 건드릴 수 없다(여기서 붙인다).
 */
export const composeBody = (draft: ReporterDraft, facts: ReporterFacts): string => {
  const links = facts.links.length
    ? `<p>${facts.links.map((link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join(' · ')}</p>`
    : '';
  return [
    draft.introHtml.trim(),
    facts.tablesHtml,
    links,
    `<p><em>출처: ${escapeHtml(facts.sourceNote)}</em></p>`
  ]
    .filter(Boolean)
    .join('');
};
