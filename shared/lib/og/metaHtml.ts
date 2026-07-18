/**
 * OG 메타태그 문자열 치환 — **순수 함수, 의존성 0**.
 *
 * middleware.ts(Edge)와 api/share-html.ts(Node)가 **공유**한다. 이 파일은 아무것도 import 하지 않으므로
 * 양쪽 런타임에서 안전하다(Edge 는 Node 내장 모듈을 못 쓰고, 모듈 스코프에서 import.meta.env 를 읽으면
 * Vercel Node 함수가 즉사한다 — og.tsx 함정). 그래서 여기엔 순수 문자열 로직만 둔다.
 *
 * 원래 middleware.ts 에 있던 두 함수를 그대로 옮긴 것이다 — `?share=` 경로 동작은 **바뀌지 않는다**
 * (동일 함수, 호출부만 import 로 바뀜).
 */

/** HTML 속성값 이스케이프. 공유 코드/텍스트는 URL·DB 에서 온 신뢰할 수 없는 입력이다. */
export const escapeHtmlAttribute = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * `content="..."` 값만 바꾼다. 태그를 새로 삽입하지 않고 **기존 태그를 치환**하므로 중복 메타가 생기지 않는다
 * (스크래퍼는 보통 첫 번째 태그를 읽기 때문에, 뒤에 덧붙이는 방식은 조용히 무시당한다).
 *
 * 닫는 따옴표를 패턴에 포함하므로 `og:image` 와 `og:image:alt` 처럼 접두가 겹치는 키도 정확히 구분한다
 * (`property="og:image"` 는 `og:image` 뒤에 `"` 가 와야 매치 → `og:image:alt` 를 삼키지 않는다).
 */
export const replaceMetaContent = (
  html: string,
  attribute: 'property' | 'name',
  key: string,
  value: string
): string => {
  const pattern = new RegExp(`(<meta[^>]*\\s${attribute}="${key}"[^>]*\\scontent=")[^"]*(")`, 'i');
  return html.replace(pattern, `$1${escapeHtmlAttribute(value)}$2`);
};
