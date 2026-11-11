import type { ReporterDraft, ReporterFacts, ReporterLedger } from './types';

/**
 * AI 리포터 초안 **검사**(순수, 2026-11-10). 하나라도 걸리면 발행하지 않는다.
 *
 * 사용자 요구: AI 지문이 없는 자연스러운 글 · 정확한 데이터와 근거 · 시각 자료 위주로 글은 짧게 ·
 * 한 번 쓴 글과 겹치지 않게. 리스크 회피: 투자 권유 표현 금지 · 지어낸 숫자 금지.
 * 문체 규칙의 근거는 게시판 글 스킬(`.claude/skills/board-post`)의 실측 AI 지문 목록이다.
 */

/**
 * 글자 수(태그 제외). 2026-11-11 사용자 피드백 "본문이 빈약하다"로 늘렸다 — 리드는 짧게 두고,
 * 표 뒤 분석 단락을 **필수**로 해서 표가 말하지 않는 맥락(이유·같이 볼 것·예외)을 채운다.
 */
export const INTRO_MAX_CHARS = 500;
export const INTRO_MIN_CHARS = 80;
export const ANALYSIS_MIN_CHARS = 450;
export const ANALYSIS_MAX_CHARS = 1800;
export const TITLE_MIN = 6;
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 120;

/** 리드에 허용하는 태그(조립이 표·출처를 따로 붙이므로 리드는 문단뿐). */
const INTRO_TAGS = new Set(['p', 'strong', 'em', 'br']);
/** 분석 단락 태그 — 소제목과 목록까지. 번호 목록(ol)은 보고서 말투라 뺀다. */
const ANALYSIS_TAGS = new Set(['h3', 'p', 'strong', 'em', 'br', 'ul', 'li']);

const tagsOf = (html: string): string[] =>
  [...html.matchAll(/<\s*\/?\s*([a-zA-Z][a-zA-Z0-9]*)/g)].map((match) => match[1]!.toLowerCase());

/** 투자 권유·약속형 표현. 계산 예시만 말한다. */
const ADVICE_PATTERNS: readonly RegExp[] = [
  /추천/,
  /매수\s*하(세요|십시오)|사(세요|십시오)|담(으세요|으십시오)/,
  /팔(으세요|으십시오)|매도\s*하(세요|십시오)/,
  /유리합니다|유망/,
  /받게\s*됩니다|보장/,
  /지금이\s*기회|놓치지\s*마/
];

/** AI 지문 — 메타 선언·총론 오프닝·보고서 말투. */
const AI_FINGERPRINTS: readonly RegExp[] = [
  /정리해\s*봤습니다|정리해\s*보았습니다|살펴보겠습니다|알아보겠습니다|소개해\s*드리겠습니다/,
  /라는\s*점입니다/,
  /요즘\s*시장|우리가\s*흔히|결론적으로|요약하자면|마무리하며|도움이\s*되(었|셨)으면/,
  /^\s*\d+\.\s/m
];

/** 사이트 공통 금지 — 제품 비유. */
const BRAND_BANNED: readonly RegExp[] = [/눈덩이|스노우볼|snowball/i];

/** 겪은 척(지어낸 경험) — AI 리포터는 경험이 없다. */
const FAKE_EXPERIENCE: readonly RegExp[] = [/제가\s*(직접|해\s*보|투자|샀|팔)|저는\s*(투자|보유|매수)|제\s*경험/];

const stripTags = (html: string): string => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const numericTokens = (text: string): string[] =>
  (text.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((token) => token.replace(/,/g, '').replace(/\.0+$/, ''));

/** 어떤 글에서든 써도 되는 작은 정수(개수·달·순서). 그 밖의 숫자는 사실 목록에 있어야 한다. */
const ALWAYS_ALLOWED = new Set(Array.from({ length: 13 }, (_unused, index) => String(index)));

const words = (text: string): Set<string> => new Set(text.replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((word) => word.length >= 2));

/** 단어 겹침 비율(자카드). 제목 중복 판정에 쓴다. */
export const titleSimilarity = (a: string, b: string): number => {
  const left = words(a);
  const right = words(b);
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const word of left) if (right.has(word)) shared += 1;
  return shared / (left.size + right.size - shared);
};

export const TITLE_SIMILARITY_LIMIT = 0.5;

export type DraftCheck = { readonly ok: boolean; readonly errors: readonly string[] };

export const checkDraft = (draft: ReporterDraft, facts: ReporterFacts, ledger: ReporterLedger): DraftCheck => {
  const errors: string[] = [];
  const intro = stripTags(draft.introHtml);
  const analysisHtml = draft.analysisHtml ?? '';
  const analysis = stripTags(analysisHtml);
  const everything = `${draft.title}\n${draft.description}\n${intro}\n${analysis}`;

  if (draft.factKey !== facts.factKey) errors.push(`factKey 불일치: 초안 ${draft.factKey} / 사실 ${facts.factKey}`);

  // 길이
  const title = draft.title.trim();
  if (title.length < TITLE_MIN || title.length > TITLE_MAX) errors.push(`제목 길이 ${title.length}자 — ${TITLE_MIN}~${TITLE_MAX}자`);
  if (draft.description.trim().length === 0 || draft.description.length > DESCRIPTION_MAX) {
    errors.push(`요약 길이 ${draft.description.length}자 — 1~${DESCRIPTION_MAX}자`);
  }
  if (intro.length < INTRO_MIN_CHARS || intro.length > INTRO_MAX_CHARS) {
    errors.push(`리드 ${intro.length}자 — ${INTRO_MIN_CHARS}~${INTRO_MAX_CHARS}자`);
  }
  if (analysis.length < ANALYSIS_MIN_CHARS || analysis.length > ANALYSIS_MAX_CHARS) {
    errors.push(`분석 ${analysis.length}자 — ${ANALYSIS_MIN_CHARS}~${ANALYSIS_MAX_CHARS}자(표가 말하지 않는 맥락을 채운다)`);
  }
  if (!tagsOf(analysisHtml).includes('h3')) errors.push('분석에 소제목(h3)이 없다 — 2~3개로 나눈다');

  // 태그
  for (const tag of tagsOf(draft.introHtml)) {
    if (!INTRO_TAGS.has(tag)) errors.push(`리드에 허용되지 않은 태그 <${tag}> — p·strong·em·br 만`);
  }
  for (const tag of tagsOf(analysisHtml)) {
    if (!ANALYSIS_TAGS.has(tag)) errors.push(`분석에 허용되지 않은 태그 <${tag}> — h3·p·strong·em·br·ul·li 만`);
  }

  // 표현
  for (const [label, patterns] of [
    ['투자 권유 표현', ADVICE_PATTERNS],
    ['AI 지문', AI_FINGERPRINTS],
    ['금지 비유', BRAND_BANNED],
    ['지어낸 경험', FAKE_EXPERIENCE]
  ] as const) {
    for (const pattern of patterns) {
      const hit = everything.match(pattern);
      if (hit) errors.push(`${label}: "${hit[0].trim()}"`);
    }
  }
  if ((title.match(/—|–/g) ?? []).length > 0 && ledger.entries.slice(-2).some((entry) => /—|–/.test(entry.title))) {
    errors.push('제목 대시(—)는 세 편에 한 번 이하 — 직전 두 편 중에 이미 있다');
  }

  // 숫자 — 본문·제목·요약의 숫자는 전부 사실 목록에 있어야 한다
  const allowed = new Set([
    ...ALWAYS_ALLOWED,
    ...facts.numbers.flatMap(numericTokens),
    ...facts.background.flatMap(numericTokens)
  ]);
  const unknown = [...new Set(numericTokens(everything))].filter((token) => !allowed.has(token));
  if (unknown.length > 0) errors.push(`사실 목록에 없는 숫자: ${unknown.join(', ')}`);

  // 중복 — 고쳐 쓰기(replacesPostId)는 그 글 자신과는 비교하지 않는다.
  if (draft.replacesPostId) {
    const target = ledger.entries.find((entry) => entry.postId === draft.replacesPostId);
    if (!target) errors.push(`고쳐 쓸 글이 대장에 없다: ${draft.replacesPostId}`);
    else if (target.factKey !== facts.factKey) errors.push(`고쳐 쓸 글의 회차가 다르다: ${target.factKey}`);
  }
  const others = ledger.entries.filter((entry) => !draft.replacesPostId || entry.postId !== draft.replacesPostId);
  if (others.some((entry) => entry.factKey === facts.factKey)) errors.push(`이미 발행한 회차: ${facts.factKey}`);
  const last = others[others.length - 1];
  if (!draft.replacesPostId && last && last.topic === facts.topic) {
    errors.push(`같은 주제 연속(${facts.topic}) — 주제를 돌려 쓴다`);
  }
  for (const entry of others) {
    const similarity = titleSimilarity(title, entry.title);
    if (similarity >= TITLE_SIMILARITY_LIMIT) {
      errors.push(`기존 글과 제목이 비슷하다(${Math.round(similarity * 100)}%): "${entry.title}"`);
    }
  }

  return { ok: errors.length === 0, errors };
};
