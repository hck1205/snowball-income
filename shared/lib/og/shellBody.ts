/**
 * 크롤러용 HTML 에서 **랜딩 셸 본문**을 걷어낸다 — 순수 문자열 함수, 의존성 0(metaHtml.ts 와 같은 규약).
 *
 * ## 왜 필요한가
 * `index.html` 은 SPA 전 라우트가 공유하는 셸이고, `#root` 안에 **랜딩(`/`)의 본문**(`.app-shell-fallback`)이
 * 통째로 들어 있다. 서버 렌더 핸들러들은 고유 콘텐츠를 `<div id="root">` **여는 태그 직후**에 삽입하므로
 * 그 랜딩 본문이 **뒤에 그대로 남는다** — 즉 `/ticker/schd`·`/guide/*`·`/community/*` 가 내려주는 HTML 은
 * 고유 콘텐츠 + 랜딩 본문(가시 텍스트 약 6.5KB)을 함께 싣는다. 결과는 셋이다.
 *
 * 1. **`<h1>` 이 두 개**가 되고 두 번째는 전 페이지가 동일하다(랜딩 h1).
 * 2. 페이지당 고유 텍스트 비중이 희석된다 — YMYL(금융) 영역의 중복 콘텐츠 판정은 특히 엄격하다.
 * 3. 랜딩 전용 `FAQPage` JSON-LD 가 함께 남아, 자기 FAQ 를 따로 내는 티커 페이지에서 **FAQPage 가 둘**이 된다.
 *
 * ⚠ JS 를 실행하는 크롤러는 하이드레이션 후 결과를 보므로 영향이 없다. 이 처방의 대상은 **초기 HTML 과
 * JS 를 실행하지 않는 크롤러**(네이버 Yeti·다음 Daumoa 등)다.
 *
 * ## 🔴 둘은 반드시 함께 지운다
 * `shared/lib/seo/faqStructuredData.ts` 는 *"JS 를 실행하지 않는 크롤러에게는 셸 본문의 FAQ 가 함께
 * 내려가므로 보이지 않는 콘텐츠가 아니다"* 를 근거로 랜딩 FAQ JSON-LD 를 정적 HTML 에 남겨 둔다.
 * 그러니 **본문만 지우고 JSON-LD 를 남기면 그 근거가 깨져** 정확히 그 함수가 경고한 상태가 된다.
 * `stripLandingShellBody` 가 둘을 한 번에 처리하는 이유이고, 호출부는 이 함수만 쓰면 된다.
 *
 * ## 적용 대상
 * **자기 본문을 주입하는 핸들러만** 쓴다(TickerHtml·GuideHtml·DividendListHtml·PostHtml·PostList).
 * 🔴 `ShareHtml` 은 쓰지 마라 — 그쪽은 본문을 주입하지 않는 **실제 시뮬레이터 셸**이라, 지우면 JS 없는
 * 방문자에게 빈 화면이 된다.
 */

/** `index.html` 의 랜딩 본문 래퍼 class. 한쪽만 바꾸면 이 모듈은 조용히 아무것도 하지 않는다. */
export const SHELL_FALLBACK_CLASS_NAME = 'app-shell-fallback';

/**
 * `index.html` 의 랜딩 전용 FAQPage script id.
 * `shared/lib/seo/faqStructuredData.ts` 의 `FAQ_STRUCTURED_DATA_ID` 와 **같은 값이어야 한다**
 * (여기서 다시 선언하는 이유: 이 모듈은 Edge/Node 서버 번들에 들어가므로 DOM 을 다루는 모듈을
 * import 하지 않는다. 두 상수의 일치는 `test/seo/crawlerShellBody.test.ts` 가 잠근다).
 */
export const LANDING_FAQ_SCRIPT_ID = 'faq-structured-data';

const DIV_TAG_PATTERN = /<\/?div\b[^>]*>/gi;

/**
 * 여는 태그 끝(`openTagEnd`)부터 **깊이를 세어** 짝이 맞는 `</div>` 의 끝 인덱스를 찾는다.
 * 닫는 태그를 정규식으로 바로 매칭하면 중첩 div 에서 첫 `</div>` 를 잘못 집는데, 깊이 계산은 그 함정이 없다.
 * 짝을 못 찾으면 `null` — 호출부는 **원문을 그대로 둔다**(반쯤 잘린 HTML 을 내보내는 것보다 안전하다).
 */
const findMatchingDivEnd = (html: string, openTagEnd: number): number | null => {
  const pattern = new RegExp(DIV_TAG_PATTERN.source, DIV_TAG_PATTERN.flags);
  pattern.lastIndex = openTagEnd;

  let depth = 1;
  let match = pattern.exec(html);

  while (match !== null) {
    if (match[0].startsWith('</')) {
      depth -= 1;
      if (depth === 0) return match.index + match[0].length;
    } else if (!match[0].endsWith('/>')) {
      // `<div ... />` 는 HTML 에선 무의미하지만(void 요소가 아니다) 방어적으로 깊이를 올리지 않는다.
      depth += 1;
    }
    match = pattern.exec(html);
  }

  return null;
};

/**
 * `class` 에 해당 이름이 든 `<div>` 블록을 **통째로** 제거한다. 없으면 원문 그대로(빈 `#root` 픽스처 대응).
 *
 * ⚠ class 목록을 **공백 구분 토큰**으로 매칭한다(`(?:[^"]*\\s)?이름(?:\\s[^"]*)?`).
 * `\\b` 를 쓰면 안 된다 — `-` 는 단어 문자가 아니라서 `app-shell-fallback` 이 `app-shell-fallback-x` 의
 * 접두에도 경계로 걸린다(가드 테스트가 실제로 잡은 결함이다).
 */
export const removeDivByClassName = (html: string, className: string): string => {
  const openTag = html.match(
    new RegExp(`<div[^>]*\\sclass="(?:[^"]*\\s)?${className}(?:\\s[^"]*)?"[^>]*>`, 'i')
  );
  if (!openTag || openTag.index === undefined) return html;

  const end = findMatchingDivEnd(html, openTag.index + openTag[0].length);
  if (end === null) return html;

  return html.slice(0, openTag.index) + html.slice(end);
};

/** `id` 가 일치하는 `<script>` 블록을 제거한다. script 는 중첩되지 않으므로 첫 `</script>` 가 곧 짝이다. */
export const removeScriptById = (html: string, id: string): string => {
  const openTag = html.match(new RegExp(`<script[^>]*\\sid="${id}"[^>]*>`, 'i'));
  if (!openTag || openTag.index === undefined) return html;

  const closeIndex = html.indexOf('</script>', openTag.index + openTag[0].length);
  if (closeIndex === -1) return html;

  return html.slice(0, openTag.index) + html.slice(closeIndex + '</script>'.length);
};

/**
 * 랜딩 셸 본문(`.app-shell-fallback`)과 랜딩 전용 FAQPage JSON-LD 를 **함께** 걷어낸다.
 * 자기 본문을 주입하는 핸들러가 주입 **직전**에 한 번 부른다. 멱등이고, 둘 다 없으면 원문 그대로다.
 */
export const stripLandingShellBody = (html: string): string =>
  removeScriptById(removeDivByClassName(html, SHELL_FALLBACK_CLASS_NAME), LANDING_FAQ_SCRIPT_ID);

/**
 * 랜딩 본문을 걷어내고 그 자리에 **이 페이지의 본문**을 넣는다.
 *
 * 삽입 지점은 `<div id="root">` **여는 태그 직후**다. 닫는 태그를 매칭하는 방식은 `#root` 안의 중첩
 * div 에 취약한 반면, 여는 태그 직후 삽입은 빈 `<div id="root"></div>`(테스트 픽스처)와 실제 셸
 * 양쪽에서 결정적이다. 여는 태그가 없으면(방어) 본문만 걷어낸 HTML 을 그대로 돌려준다.
 *
 * 🔴 핸들러 5곳(Ticker·Guide·DividendList·Post·PostList)이 **똑같이 복사해 두었던 함수**다
 * (2026-08-14 통합). 복사본이 늘면 그중 하나만 `stripLandingShellBody` 를 빠뜨리는 식으로 조용히
 * 갈라진다 — 실제로 이 결함이 그렇게 생겼다.
 */
export const injectIntoRoot = (shell: string, body: string): string => {
  const stripped = stripLandingShellBody(shell);
  const rootOpenTag = stripped.match(/<div\s+id="root"[^>]*>/i);
  if (!rootOpenTag || rootOpenTag.index === undefined) return stripped;

  const insertAt = rootOpenTag.index + rootOpenTag[0].length;
  return stripped.slice(0, insertAt) + body + stripped.slice(insertAt);
};
