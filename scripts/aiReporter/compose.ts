import { escapeHtml } from './html';
import type { ReporterDraft, ReporterFacts } from './types';

/** 모든 글 끝에 붙는 고지. AI 가 쓴 글이라는 사실과 권유가 아니라는 사실을 함께 말한다. */
export const REPORTER_DISCLAIMER =
  'AI 리포터가 Hungry Hippo의 데이터와 계산으로 작성한 글입니다. 투자 권유가 아닌 계산 예시이며, 배당·주가는 바뀝니다.';

/**
 * 게시글 본문 조립 — 순서: LLM 본문 → 표(사실이 구운 HTML) → 더 보기 링크 → 출처 → 고지.
 * 표·출처·고지는 LLM 이 건드릴 수 없다(여기서 붙인다).
 */
export const composeBody = (draft: ReporterDraft, facts: ReporterFacts): string => {
  const links = facts.links.length
    ? `<p>${facts.links.map((link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join(' · ')}</p>`
    : '';
  return [
    draft.introHtml.trim(),
    facts.tablesHtml,
    links,
    `<p><em>출처: ${escapeHtml(facts.sourceNote)}</em></p>`,
    `<p><em>${escapeHtml(REPORTER_DISCLAIMER)}</em></p>`
  ]
    .filter(Boolean)
    .join('');
};
