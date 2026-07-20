import { describe, expect, it } from 'vitest';
import { sanitizePostBody } from '@/server/handlers/PostHtml/serverSanitize';
import { sanitizeRichHtml } from '@/shared/lib/richtext';

/**
 * 서버 본문 정화(`sanitizePostBody`, jsdom + DOMPurify) — 상세 ISR 이 `#root` 에 주입하기 전에 반드시
 * 통과시키는 XSS 경계.
 *
 * `posts.body` 는 anon 키로 누구나 PostgREST 에 밀어넣을 수 있는 신뢰 불가 입력이다(저장 XSS). 순수
 * 함수라 Node 에서 직접 호출해 각 페이로드가 무력화되는지 단정한다. 클라이언트(`sanitizeRichHtml`)와
 * **같은 허용목록·같은 훅**을 쓰므로 출력이 문자 그대로 일치함도 대조한다(파리티 증명).
 */

/** 알려진 XSS 페이로드 배열 — in → out 을 순수 함수로 직접 단정한다. */
const XSS_PAYLOADS: { name: string; input: string; forbidden: string[] }[] = [
  { name: 'script 태그', input: '<script>alert(1)</script>', forbidden: ['<script', 'alert(1)'] },
  { name: 'img onerror', input: '<img src=x onerror=alert(1)>', forbidden: ['<img', 'onerror', 'alert(1)'] },
  { name: 'javascript: 링크', input: '<a href="javascript:alert(1)">x</a>', forbidden: ['javascript:', 'alert(1)'] },
  { name: 'iframe', input: '<iframe src="https://evil.test"></iframe>', forbidden: ['<iframe'] },
  { name: 'onclick 이벤트 핸들러', input: '<p onclick="alert(1)">hi</p>', forbidden: ['onclick', 'alert(1)'] },
  {
    name: 'onmouseover 이벤트 핸들러',
    input: '<p onmouseover="alert(1)">hi</p>',
    forbidden: ['onmouseover', 'alert(1)']
  },
  { name: 'svg > script', input: '<svg><script>alert(1)</script></svg>', forbidden: ['<svg', '<script', 'alert(1)'] },
  { name: 'style 속성', input: '<p style="background:url(javascript:alert(1))">x</p>', forbidden: ['style=', 'javascript:'] },
  {
    name: 'data: URI 링크',
    input: '<a href="data:text/html,<script>alert(1)</script>">x</a>',
    forbidden: ['data:', '<script', 'alert(1)']
  },
  { name: 'vbscript: 링크', input: '<a href="vbscript:msgbox(1)">x</a>', forbidden: ['vbscript:'] },
  {
    name: 'form + formaction',
    input: '<form action="javascript:alert(1)"><button>x</button></form>',
    forbidden: ['<form', '<button', 'javascript:']
  },
  {
    name: 'a target 오버라이드 시도',
    input: '<a href="https://ok.test" onclick="alert(1)">x</a>',
    forbidden: ['onclick', 'alert(1)']
  }
];

/** 에디터가 실제로 만드는 정상 서식 — 표·목록·링크·h2/h3·blockquote·code·pre·hr 를 모두 담는다. */
const NORMAL_BODY = [
  '<h2>제목</h2>',
  '<h3>소제목</h3>',
  '<p>본문 <strong>굵게</strong> <em>기울임</em> <s>취소</s> <u>밑줄</u> <code>코드</code></p>',
  '<ul><li>항목1</li><li>항목2</li></ul>',
  '<ol><li>가</li></ol>',
  '<blockquote>인용</blockquote>',
  '<pre>코드블록</pre>',
  '<a href="https://example.com">링크</a>',
  '<hr>',
  '<table><tbody><tr><th colspan="2">헤더</th></tr><tr><td>a</td><td>b</td></tr></tbody></table>'
].join('');

describe('sanitizePostBody — XSS 무력화', () => {
  for (const { name, input, forbidden } of XSS_PAYLOADS) {
    it(`${name} 를 제거한다`, () => {
      const out = sanitizePostBody(input);
      for (const needle of forbidden) {
        expect(out.toLowerCase()).not.toContain(needle.toLowerCase());
      }
    });
  }

  it('빈 본문은 빈 문자열', () => {
    expect(sanitizePostBody('')).toBe('');
    expect(sanitizePostBody('<p></p>')).toBe('<p></p>');
  });
});

describe('sanitizePostBody — 정상 서식 보존', () => {
  it('표(table/tbody/tr/th/td + colspan)·목록·헤딩·인용·코드를 살린다', () => {
    const out = sanitizePostBody(NORMAL_BODY);

    expect(out).toContain('<h2>제목</h2>');
    expect(out).toContain('<h3>소제목</h3>');
    expect(out).toContain('<strong>굵게</strong>');
    expect(out).toContain('<em>기울임</em>');
    expect(out).toContain('<u>밑줄</u>');
    expect(out).toContain('<code>코드</code>');
    expect(out).toContain('<ul>');
    expect(out).toContain('<ol>');
    expect(out).toContain('<blockquote>인용</blockquote>');
    expect(out).toContain('<pre>코드블록</pre>');
    expect(out).toContain('<hr>');
    expect(out).toContain('<table>');
    expect(out).toContain('<th colspan="2">');
    expect(out).toContain('<td>a</td>');
  });

  it('링크에 안전한 rel/target 을 강제한다', () => {
    const out = sanitizePostBody('<a href="https://example.com">링크</a>');
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
  });

  it('표 셀 span 은 양의 정수만 통과한다(비정수 span 제거)', () => {
    const out = sanitizePostBody('<table><tbody><tr><td colspan="abc" rowspan="2">x</td></tr></tbody></table>');
    expect(out).not.toContain('colspan="abc"');
    expect(out).toContain('rowspan="2"');
  });
});

describe('클라이언트 ↔ 서버 정화 파리티', () => {
  it('정상 본문에 대해 sanitizePostBody 와 sanitizeRichHtml 출력이 문자 그대로 일치한다', () => {
    // 같은 ALLOWED_TAGS/ALLOWED_ATTR/훅(configureRichHtmlSanitizer)을 공유하므로 동일 출력이어야 한다.
    expect(sanitizePostBody(NORMAL_BODY)).toBe(sanitizeRichHtml(NORMAL_BODY));
  });

  it('모든 XSS 페이로드에 대해 두 엔진의 출력이 동일하다', () => {
    for (const { input } of XSS_PAYLOADS) {
      expect(sanitizePostBody(input)).toBe(sanitizeRichHtml(input));
    }
  });
});
