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
 * 서버에서 재사용하려면 `configureRichHtmlSanitizer(createDOMPurify(jsdomWindow))` 로 별도 인스턴스를
 * 구성한다(서버 전용 모듈에서만 — jsdom import 를 이 파일에 넣지 마라). 이 파일에서 서버가 재사용해도
 * 안전한 것은 **데이터(ALLOWED_TAGS/ALLOWED_ATTR)와 순수 설정 팩토리(configureRichHtmlSanitizer)뿐**이다.
 *
 * 의도적으로 **속성을 만드는 서식은 넣지 않는다**(정렬/하이라이트/글자색 = style·class 속성 필요).
 * 속성 화이트리스트가 넓어질수록 XSS 표면과 서버 측 동기화 비용이 함께 커진다.
 *
 * ⚠ 표(table)는 위 원칙의 유일한 예외로 `colspan`/`rowspan` 두 속성을 연다. 값은 정수만
 * 허용하도록 아래 훅이 한 번 더 거른다(DOMPurify는 속성 **값**을 검증하지 않는다).
 */
export const ALLOWED_TAGS = [
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
  'hr',
  /*
   * 표. Tiptap이 실제로 뱉는 태그만 담는다(실측: `editor.getHTML()`).
   *
   *   <table style="min-width: 75px;">
   *     <colgroup><col style="min-width: 25px;">…</colgroup>
   *     <tbody><tr><th colspan="1" rowspan="1"><p></p></th>…</tr>…</tbody>
   *   </table>
   *
   * 여기서 읽을 것 3가지.
   * ① **`<thead>`는 나오지 않는다** — 헤더 행도 `<tbody>` 안의 `<tr><th>`다. 그래서 목록에 없다.
   * ② **`colgroup`/`col`은 나오지만 일부러 허용하지 않는다** — 이 둘이 나르는 정보는 `style`의
   *    min-width뿐인데 `style`은 절대 열지 않으므로(아래 참고) 허용해 봐야 **속성 없는 빈
   *    `<col>`**만 남아 렌더에 아무 영향이 없다. 태그만 늘고 얻는 게 없어 제외했다.
   *    DOMPurify는 비허용 태그의 자식을 보존하는데 `<col>`은 void라 흔적 없이 사라진다.
   * ③ **`style`은 열지 않는다** — `Table.configure({ resizable: false })`로도 `style`은 계속
   *    나온다(실측). 리사이즈 핸들만 꺼질 뿐 renderHTML이 항상 colgroup+min-width를 조립한다.
   *    이 min-width는 우리 렌더 CSS(width: max-content)가 어차피 덮으므로 정화 단계에서
   *    떨어져 나가도 표시가 달라지지 않는다. style 허용은 XSS 표면(예: `behavior`, 배경
   *    이미지 경유 트래킹)을 통째로 여는 것이라 기능을 포기하는 편이 언제나 낫다.
   */
  'table',
  'tbody',
  'tr',
  'th',
  'td'
];

export const ALLOWED_ATTR = ['href', 'target', 'rel', 'colspan', 'rowspan'];

/** `colspan`/`rowspan`을 다는 표 셀 태그. */
const TABLE_CELL_TAGS = new Set(['th', 'td']);

/** 표 셀 span 속성의 상한 — 정상 편집으로는 닿지 않는 값이며, 거대 span으로 인한 렌더 폭주를 막는다. */
const MAX_CELL_SPAN = 1000;

/** 이미 훅을 설치한 DOMPurify 인스턴스. 인스턴스별 1회 설치를 보장한다(브라우저 기본 ↔ 서버 jsdom 별개). */
const configuredInstances = new WeakSet<object>();

/**
 * 주어진 DOMPurify 인스턴스에 `afterSanitizeAttributes` 훅을 설치한다 — **DOM 비의존 순수 설정**.
 *
 * 브라우저 기본 인스턴스(`sanitizeRichHtml`)와 서버 jsdom 인스턴스(ISR 본문 주입)가 **정확히 같은
 * 훅 로직**을 공유하게 하는 단일 출처다. 허용목록(`ALLOWED_TAGS`/`ALLOWED_ATTR`)도 한 상수를 공유하므로
 * 두 표면의 정화 결과가 "같은 코드"라서 자동으로 일치한다.
 *
 * 훅은 **인스턴스별 한 번만** 설치한다(DOMPurify 훅은 인스턴스에 누적이라, 중복 설치하면 같은 로직이
 * 노드마다 여러 번 돈다). `WeakSet` 가드로 같은 인스턴스에 대한 반복 호출을 무시한다.
 *
 * - 링크: 안전한 rel/target 강제, http(s)/mailto가 아닌 href 제거.
 * - 표 셀: `colspan`/`rowspan`이 양의 정수가 아니면 제거. DOMPurify는 속성 **이름**만 화이트리스트로
 *   거르고 **값은 그대로 통과**시키므로, 값 검증은 이 훅이 유일한 방어선이다.
 */
export const configureRichHtmlSanitizer = (purify: typeof DOMPurify): void => {
  if (configuredInstances.has(purify)) return;
  configuredInstances.add(purify);

  purify.addHook('afterSanitizeAttributes', (node) => {
    // 전역 `Element` 는 Node 런타임에 없어 `instanceof Element` 는 서버 jsdom 인스턴스에서 던진다
    // (jsdom 노드는 window.Element 인스턴스지 전역 Element 가 아니다). nodeType(=ELEMENT_NODE 1)로
    // 판정해야 브라우저·서버 양쪽에서 안전하다.
    if (node.nodeType !== 1) return;

    const tag = node.tagName.toLowerCase();

    if (tag === 'a') {
      const href = node.getAttribute('href') ?? '';
      const isSafe = /^(https?:|mailto:)/i.test(href.trim());
      if (!isSafe) {
        node.removeAttribute('href');
        return;
      }

      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer nofollow');
      return;
    }

    if (TABLE_CELL_TAGS.has(tag)) {
      for (const attribute of ['colspan', 'rowspan']) {
        const raw = node.getAttribute(attribute);
        if (raw === null) continue;
        if (!isPositiveInteger(raw)) node.removeAttribute(attribute);
      }
    }
  });
};

/** 앞뒤 공백·부호·소수점·지수 표기를 모두 거부하는 엄격한 양의 정수 판정. */
const isPositiveInteger = (raw: string): boolean => {
  if (!/^\d+$/.test(raw)) return false;
  const value = Number(raw);
  return value >= 1 && value <= MAX_CELL_SPAN;
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
  configureRichHtmlSanitizer(DOMPurify);
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // data-* / style 등은 붙일 필요가 없다.
    ALLOW_DATA_ATTR: false
  });
};
