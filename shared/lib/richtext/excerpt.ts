import { sanitizeRichHtml } from './sanitize';

/**
 * 리치 HTML → plain text.
 * 저장 전 요약 자동 발췌와 "본문이 실제로 비었는지" 판정에 쓴다.
 * DOM 파서를 쓰되 sanitize를 먼저 통과시켜 악성 태그가 파서에 닿지 않게 한다.
 */
export const htmlToPlainText = (html: string): string => {
  if (!html) return '';
  const safe = sanitizeRichHtml(html);

  if (typeof document === 'undefined') {
    // SSR/노드 환경 폴백 — 태그만 제거한다.
    return safe
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const template = document.createElement('template');
  template.innerHTML = safe;
  const text = template.content.textContent ?? '';
  return text.replace(/\s+/g, ' ').trim();
};

/** 본문이 실질적으로 비어 있는가(공백/빈 태그만 있으면 true). */
export const isRichTextEmpty = (html: string): boolean => htmlToPlainText(html).length === 0;

/**
 * 요약 자동 발췌 — 본문 plain-text 앞 `maxLength`자.
 * 요약을 비우고 저장할 때 목록 카드에 보일 한 줄을 만든다.
 */
export const deriveExcerpt = (html: string, maxLength: number): string => {
  const text = htmlToPlainText(html);
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim();
};
