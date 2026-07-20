import DOMPurify from 'dompurify';

/**
 * 본문 리치 HTML 정화 (XSS 경계).
 *
 * 본문은 Tiptap이 만든 HTML로 저장/렌더된다. anon 키로 누구나 raw HTML을 PostgREST에 밀어넣을 수
 * 있으므로 **렌더 시 반드시 sanitize** 한다(저장 전에도 defense-in-depth로 한 번 더 돌린다).
 *
 * 화이트리스트는 에디터가 실제로 만들 수 있는 태그로 최소화한다. 스크립트/이벤트 핸들러/
 * `javascript:` URL은 DOMPurify가 제거한다. 링크는 훅에서 안전한 rel/target을 강제한다.
 */

/** 에디터 툴바가 만들 수 있는 태그만 허용한다. */
const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  's',
  'u',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'a',
  'blockquote',
  'code',
  'pre'
];

const ALLOWED_ATTR = ['href', 'target', 'rel'];

let hookInstalled = false;

/** 링크에 안전한 rel/target을 강제하고, http(s)/mailto가 아닌 href는 제거한다. */
const ensureLinkHardening = (): void => {
  if (hookInstalled) return;
  hookInstalled = true;

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (!(node instanceof Element) || node.tagName.toLowerCase() !== 'a') return;

    const href = node.getAttribute('href') ?? '';
    const isSafe = /^(https?:|mailto:)/i.test(href.trim());
    if (!isSafe) {
      node.removeAttribute('href');
      return;
    }

    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer nofollow');
  });
};

/**
 * 본문 HTML을 안전한 HTML 문자열로 정화한다.
 * 서버/브라우저 어느 쪽에서도 안전하게 문자열만 반환한다.
 */
export const sanitizeRichHtml = (html: string): string => {
  if (!html) return '';
  ensureLinkHardening();
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // data-* / style 등은 붙일 필요가 없다.
    ALLOW_DATA_ATTR: false
  });
};
