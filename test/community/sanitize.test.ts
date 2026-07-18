import { describe, expect, it } from 'vitest';
import { sanitizeRichHtml } from '@/shared/lib/richtext';

/**
 * XSS 경계. 본문은 anon 키로 누구나 raw HTML을 밀어넣을 수 있으므로 렌더 전 반드시 정화된다.
 * DOMPurify 설정(화이트리스트 + 링크 하드닝 훅)이 실제로 위험 요소를 제거하는지 실행 확인한다.
 */
describe('sanitizeRichHtml — 위험 요소 제거', () => {
  it('<script>를 통째로 제거한다', () => {
    const out = sanitizeRichHtml('<p>안전</p><script>alert(1)</script>');
    expect(out).toContain('안전');
    expect(out.toLowerCase()).not.toContain('<script');
    expect(out).not.toContain('alert(1)');
  });

  it('이벤트 핸들러 속성(onerror/onclick)을 제거한다', () => {
    const out = sanitizeRichHtml('<p onclick="steal()">클릭</p>');
    expect(out).toContain('클릭');
    expect(out.toLowerCase()).not.toContain('onclick');
    expect(out).not.toContain('steal');
  });

  it('허용되지 않은 <img onerror> 는 태그째 제거된다', () => {
    const out = sanitizeRichHtml('<img src="x" onerror="alert(1)">본문');
    expect(out.toLowerCase()).not.toContain('<img');
    expect(out.toLowerCase()).not.toContain('onerror');
    expect(out).toContain('본문');
  });

  it('<iframe>을 제거한다', () => {
    const out = sanitizeRichHtml('<iframe src="https://evil.example"></iframe><p>글</p>');
    expect(out.toLowerCase()).not.toContain('<iframe');
    expect(out).toContain('글');
  });

  it('javascript: href 링크는 href를 제거한다 (텍스트는 유지)', () => {
    const out = sanitizeRichHtml('<a href="javascript:alert(1)">눌러</a>');
    expect(out).toContain('눌러');
    expect(out.toLowerCase()).not.toContain('javascript:');
    expect(out).not.toContain('href');
  });

  it('data: href 같은 비허용 스킴도 href를 제거한다', () => {
    const out = sanitizeRichHtml('<a href="data:text/html;base64,PHN2Zz4=">x</a>');
    expect(out).toContain('x');
    expect(out).not.toContain('href');
  });
});

describe('sanitizeRichHtml — 링크 하드닝', () => {
  it('http(s) 링크에 rel(noopener/noreferrer)과 target=_blank를 강제한다', () => {
    const out = sanitizeRichHtml('<a href="https://example.com">링크</a>');
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('target="_blank"');
    expect(out).toMatch(/rel="[^"]*noopener[^"]*"/);
    expect(out).toMatch(/rel="[^"]*noreferrer[^"]*"/);
  });

  it('mailto 링크도 허용한다', () => {
    const out = sanitizeRichHtml('<a href="mailto:a@b.com">메일</a>');
    expect(out).toContain('href="mailto:a@b.com"');
    expect(out).toContain('메일');
  });
});

describe('sanitizeRichHtml — 허용 서식 보존', () => {
  it('굵게/기울임/제목/목록/문단/링크를 보존한다', () => {
    const html =
      '<h2>제목</h2><h3>소제목</h3><p><strong>굵게</strong> <em>기울임</em></p>' +
      '<ul><li>항목1</li></ul><ol><li>항목2</li></ol><blockquote>인용</blockquote>';
    const out = sanitizeRichHtml(html);

    expect(out).toContain('<h2>제목</h2>');
    expect(out).toContain('<h3>소제목</h3>');
    expect(out).toContain('<strong>굵게</strong>');
    expect(out).toContain('<em>기울임</em>');
    expect(out).toContain('<ul>');
    expect(out).toContain('<li>항목1</li>');
    expect(out).toContain('<ol>');
    expect(out).toContain('<blockquote>인용</blockquote>');
  });

  it('data-* 속성은 제거한다', () => {
    const out = sanitizeRichHtml('<p data-x="y">본문</p>');
    expect(out).toContain('본문');
    expect(out).not.toContain('data-x');
  });

  it('빈 입력은 빈 문자열', () => {
    expect(sanitizeRichHtml('')).toBe('');
  });

  it('여러 번 호출해도 결과가 동일하다 (링크 훅 중복 설치 안전)', () => {
    const html = '<a href="https://example.com">x</a>';
    expect(sanitizeRichHtml(sanitizeRichHtml(html))).toBe(sanitizeRichHtml(html));
  });
});
