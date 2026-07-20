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

/**
 * 에디터 툴바가 만들 수 있는 태그만 허용한다.
 *
 * ⚠ 이 목록은 허용 태그의 **단일 소스**다. 툴바에 기능을 추가하면 여기 태그를 함께 늘려야 하고,
 * 반대로 여기 없는 태그를 만드는 기능을 툴바에 노출하면 사용자는 "편집기에선 보이는데 저장하면
 * 사라지는" 경험을 한다.
 *
 * ⚠⚠ **이 모듈 자체는 브라우저 전용이다** — 서버(ISR 본문 주입 등)에서 그대로 부르면 안 된다.
 * dompurify는 `window`가 없으면 `createDOMPurify`가 **`sanitize`·`addHook`을 정의하기 전에 조기
 * return** 한다(실측: Node에서 `isSupported=false`, `sanitize=undefined`). 즉 "정화가 느슨해지는"
 * 정도가 아니라 TypeError로 죽고, 그걸 try/catch로 삼키면 **raw HTML 패스스루(XSS)** 가 된다.
 * 서버에서 재사용하려면 `createDOMPurify(jsdomWindow)` 주입형 팩토리로 먼저 리팩터링할 것.
 * 재사용해도 안전한 것은 아래 **데이터(ALLOWED_TAGS/ALLOWED_ATTR)뿐**이다.
 *
 * 의도적으로 **속성을 만드는 서식은 넣지 않는다**(정렬/하이라이트/글자색 = style·class 속성 필요).
 * 속성 화이트리스트가 넓어질수록 XSS 표면과 서버 측 동기화 비용이 함께 커진다.
 */
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
  'pre',
  // 수평선(구분선) — 속성 없는 void 태그라 추가 비용이 없다.
  'hr'
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
 * 본문 HTML을 안전한 HTML 문자열로 정화한다. **브라우저 전용**(위 ⚠⚠ 참고).
 *
 * DOM이 없는 환경에서는 조용히 통과시키지 않고 **즉시 throw** 한다. 정화되지 않은 본문이
 * 정화된 척 흘러나가는 것보다, 호출한 쪽이 배포 전에 터지는 편이 언제나 낫다.
 */
export const sanitizeRichHtml = (html: string): string => {
  if (!html) return '';
  if (!DOMPurify.isSupported) {
    throw new Error(
      'sanitizeRichHtml은 DOM이 있는 환경에서만 동작한다(dompurify.isSupported=false). ' +
        '서버에서 쓰려면 createDOMPurify(jsdomWindow) 주입형 팩토리가 필요하다.'
    );
  }
  ensureLinkHardening();
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // data-* / style 등은 붙일 필요가 없다.
    ALLOW_DATA_ATTR: false
  });
};
