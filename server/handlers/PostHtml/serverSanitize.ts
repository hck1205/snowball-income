/*
  ⚠ **서버 전용 본문 정화 모듈** — 이 파일은 `server/handlers/PostHtml/` 로컬에만 둔다.

  jsdom 을 import 하므로 **브라우저 번들이나 다른 api 함수 번들로 새면 안 된다**:
   - `shared/lib/richtext/sanitize.ts`(브라우저 전용)에 jsdom 을 넣으면 초기 번들이 오염된다.
   - `shared/lib/og` 배럴에 넣으면 og/share-html/sitemap 번들이 모듈 스코프 side-effect(new JSDOM())
     때문에 tree-shaking 되지 않아 jsdom 을 함께 싣는다.
  그래서 여기 로컬에 두고 `PostHtml.ts` 만 `./serverSanitize` 로 import 한다 → jsdom 은 `api/post-html.js`
  에만 실린다. `PostHtml/index.ts` 도 이 파일을 재export 하지 않는다(handler 만 노출).

  ⚠ 모듈 스코프에서 `import.meta.env` 를 읽지 마라(Vercel Node 즉사 — og.tsx 함정). jsdom/dompurify
  import 과 `new JSDOM('')` 는 안전하다(순수 라이브러리 초기화, env 접근 없음).
*/
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { ALLOWED_ATTR, ALLOWED_TAGS, configureRichHtmlSanitizer } from '@/shared/lib/richtext';

/**
 * 서버 전용 DOMPurify 인스턴스(모듈 스코프 싱글턴). **클라이언트 `sanitizeRichHtml` 과 같은 엔진**을
 * jsdom window 로 돌린다 — 허용목록(`ALLOWED_TAGS`/`ALLOWED_ATTR`)과 훅(`configureRichHtmlSanitizer`)을
 * 문자 그대로 공유하므로, 브라우저·서버 정화 결과의 파리티가 "같은 코드"라서 공짜로 보장된다.
 *
 * jsdom window 는 실제 문서를 파싱하지 않는 빈 문서(`new JSDOM('')`)면 충분하다 — DOMPurify 는 정화할
 * HTML 을 `sanitize()` 호출마다 자체 파서로 처리하고, window 는 DOM API 제공자로만 쓰인다.
 */
const serverPurify = createDOMPurify(new JSDOM('').window);
configureRichHtmlSanitizer(serverPurify);

/**
 * 게시글 본문 HTML 을 **서버에서** 안전한 HTML 문자열로 정화한다.
 *
 * `posts.body` 는 anon 키로 누구나 PostgREST 에 밀어넣을 수 있는 신뢰 불가 입력이다(저장 XSS). 서버
 * 주입 전 반드시 이 함수를 통과시킨다. 반환값은 **균형 잡힌 안전 HTML**(스크립트·이벤트 핸들러·
 * `javascript:`·`style`·`data:` 전부 제거)이라 셸의 엘리먼트 content 위치에 그대로 삽입해도 구조를 깨지
 * 않는다. 빈 본문(첨부만 있는 포트폴리오 글)은 빈 문자열을 돌려준다.
 */
export const sanitizePostBody = (html: string): string => {
  if (!html) return '';
  return serverPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false
  });
};
