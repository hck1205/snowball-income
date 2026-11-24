/**
 * HTML 이스케이프 — 스크립트 공용(2026-11-25 정리: aiReporter · gaReport 에 따로 있었다).
 *
 * ⚠ `shared/lib/og` 의 같은 함수를 쓰지 않는 이유: 그 배럴이 브라우저 전용 모듈(analytics — window ·
 *   import.meta.env)까지 끌어와 node 로 타입체크되는 스크립트가 깨진다.
 */

/** 본문 글자용 — `& < >`. 텔레그램 HTML 메시지처럼 속성에 넣지 않을 때. */
export const escapeHtmlText = (value: string): string => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** 속성값까지 — `& < > "`. 게시판 글의 href 처럼 따옴표 안에 들어갈 때. */
export const escapeHtmlAttribute = (value: string): string => escapeHtmlText(value).replace(/"/g, '&quot;');
