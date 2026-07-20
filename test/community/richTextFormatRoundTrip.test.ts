import { describe, expect, it } from 'vitest';
import { sanitizeRichHtml } from '@/shared/lib/richtext';

/**
 * 툴바 확장(7→14 버튼)의 최대 리스크는 **저장 후 조용히 사라지는 서식**이다.
 * 에디터가 만들 수 있는 태그가 sanitize 허용 목록과 짝이 맞는지 기능 단위로 고정한다.
 *
 * (에디터가 실제로 그 태그를 만드는지는 RichTextEditor.test.tsx가 실제 클릭으로 검증한다.
 *  여기서는 sanitize 쪽 계약만 태그별로 못 박는다 — 허용 목록이 줄면 이 스위트가 먼저 깨진다.)
 */

/** 각 툴바 기능 → 그 기능이 만들어내는 HTML 조각. */
const FORMAT_FIXTURES: ReadonlyArray<{ feature: string; html: string; expected: readonly string[] }> = [
  { feature: '굵게', html: '<p><strong>굵게</strong></p>', expected: ['<strong>굵게</strong>'] },
  { feature: '기울임', html: '<p><em>기울임</em></p>', expected: ['<em>기울임</em>'] },
  { feature: '밑줄', html: '<p><u>밑줄</u></p>', expected: ['<u>밑줄</u>'] },
  { feature: '취소선', html: '<p><s>취소선</s></p>', expected: ['<s>취소선</s>'] },
  { feature: '인라인 코드', html: '<p><code>const x = 1</code></p>', expected: ['<code>const x = 1</code>'] },
  { feature: '제목(H2)', html: '<h2>제목</h2>', expected: ['<h2>제목</h2>'] },
  { feature: '소제목(H3)', html: '<h3>소제목</h3>', expected: ['<h3>소제목</h3>'] },
  { feature: '인용', html: '<blockquote><p>인용문</p></blockquote>', expected: ['<blockquote>', '<p>인용문</p>'] },
  { feature: '코드 블록', html: '<pre><code>line()</code></pre>', expected: ['<pre>', '<code>line()</code>'] },
  { feature: '글머리 목록', html: '<ul><li><p>항목</p></li></ul>', expected: ['<ul>', '<li>'] },
  { feature: '번호 목록', html: '<ol><li><p>항목</p></li></ol>', expected: ['<ol>', '<li>'] },
  { feature: '구분선', html: '<p>위</p><hr><p>아래</p>', expected: ['<hr'] },
  { feature: '줄바꿈', html: '<p>한 줄<br>다음 줄</p>', expected: ['<br'] }
];

describe('sanitize 왕복 — 툴바 서식이 저장/렌더에서 살아남는다', () => {
  it.each(FORMAT_FIXTURES)('$feature 서식의 태그가 보존된다', ({ html, expected }) => {
    const out = sanitizeRichHtml(html);
    for (const fragment of expected) {
      expect(out).toContain(fragment);
    }
  });

  it('링크는 href를 유지하고 rel/target이 강제된다', () => {
    const out = sanitizeRichHtml(
      '<p><a href="https://example.com" rel="noopener noreferrer nofollow" target="_blank">링크</a></p>'
    );

    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('target="_blank"');
    expect(out).toMatch(/rel="[^"]*noopener[^"]*"/);
    expect(out).toContain('링크');
  });

  it('한 본문에 14개 서식이 모두 섞여 있어도 전부 살아남는다', () => {
    const html = FORMAT_FIXTURES.map((fixture) => fixture.html).join('');
    const out = sanitizeRichHtml(html);

    for (const tag of ['strong', 'em', 'u', 's', 'code', 'h2', 'h3', 'blockquote', 'pre', 'ul', 'ol', 'li', 'hr']) {
      expect(out.toLowerCase()).toContain(`<${tag}`);
    }
  });

  it('sanitize를 두 번 통과시켜도 서식이 더 깎이지 않는다 (저장 전 + 렌더 시 이중 정화)', () => {
    const html = FORMAT_FIXTURES.map((fixture) => fixture.html).join('');
    const once = sanitizeRichHtml(html);
    expect(sanitizeRichHtml(once)).toBe(once);
  });
});

describe('sanitize 왕복 — 허용 목록 밖은 제거된다', () => {
  const REMOVED: ReadonlyArray<{ name: string; html: string; forbidden: string; keptText: string }> = [
    { name: 'script', html: '<p>글</p><script>alert(1)</script>', forbidden: '<script', keptText: '글' },
    { name: 'img', html: '<p>글</p><img src="x" onerror="alert(1)">', forbidden: '<img', keptText: '글' },
    { name: 'table', html: '<table><tr><td>셀</td></tr></table><p>글</p>', forbidden: '<table', keptText: '글' },
    { name: 'div', html: '<div><p>글</p></div>', forbidden: '<div', keptText: '글' },
    { name: 'span', html: '<p><span>글</span></p>', forbidden: '<span', keptText: '글' },
    { name: 'h1', html: '<h1>큰제목</h1>', forbidden: '<h1', keptText: '큰제목' }
  ];

  it.each(REMOVED)('$name 은 제거되고 텍스트는 남는다', ({ html, forbidden, keptText }) => {
    const out = sanitizeRichHtml(html);
    expect(out.toLowerCase()).not.toContain(forbidden);
    expect(out).toContain(keptText);
  });

  const STRIPPED_ATTRS: ReadonlyArray<{ name: string; html: string; forbidden: string }> = [
    { name: 'style', html: '<p style="color:red">글</p>', forbidden: 'style=' },
    { name: 'class', html: '<p class="evil">글</p>', forbidden: 'class=' },
    { name: 'onerror', html: '<p onerror="alert(1)">글</p>', forbidden: 'onerror' },
    { name: 'onclick', html: '<p onclick="alert(1)">글</p>', forbidden: 'onclick' },
    { name: 'id', html: '<p id="x">글</p>', forbidden: 'id=' },
    { name: 'data-*', html: '<p data-x="y">글</p>', forbidden: 'data-x' }
  ];

  it.each(STRIPPED_ATTRS)('$name 속성은 제거된다', ({ html, forbidden }) => {
    const out = sanitizeRichHtml(html);
    expect(out.toLowerCase()).not.toContain(forbidden);
    expect(out).toContain('글');
  });

  it('구분선(hr)에 붙은 속성은 제거되고 태그만 남는다', () => {
    const out = sanitizeRichHtml('<hr class="page-break" style="border:10px" onclick="alert(1)">');
    expect(out.toLowerCase()).toContain('<hr');
    expect(out.toLowerCase()).not.toContain('class=');
    expect(out.toLowerCase()).not.toContain('style=');
    expect(out.toLowerCase()).not.toContain('onclick');
  });

  it('javascript: href 는 여전히 제거된다 (hr 추가가 링크 훅을 건드리지 않았다)', () => {
    const out = sanitizeRichHtml('<p><a href="javascript:alert(1)">눌러</a></p><hr>');
    expect(out).toContain('눌러');
    expect(out.toLowerCase()).not.toContain('javascript:');
    expect(out).not.toContain('href');
    expect(out.toLowerCase()).toContain('<hr');
  });
});

describe('sanitize 왕복 — 하위 호환 (툴바 확장 이전에 저장된 본문)', () => {
  /** 확장 전 7버튼 시절 에디터가 만들 수 있던 본문 전형. */
  const LEGACY_BODY =
    '<h2>내 배당 전략</h2>' +
    '<p><strong>SCHD</strong> 위주로 <em>10년</em> 모을 계획입니다.</p>' +
    '<ul><li><p>매달 100만원</p></li><li><p>배당 재투자</p></li></ul>' +
    '<ol><li><p>1단계</p></li></ol>' +
    '<h3>참고</h3>' +
    '<p><a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow">출처</a></p>';

  it('구 본문이 태그 손실 없이 그대로 통과한다', () => {
    const out = sanitizeRichHtml(LEGACY_BODY);

    expect(out).toContain('<h2>내 배당 전략</h2>');
    expect(out).toContain('<strong>SCHD</strong>');
    expect(out).toContain('<em>10년</em>');
    expect(out).toContain('<ul>');
    expect(out).toContain('<ol>');
    expect(out).toContain('<h3>참고</h3>');
    expect(out).toContain('href="https://example.com"');
  });

  it('구 본문의 sanitize 결과는 자기 자신과 동일하다 (재정화 안정)', () => {
    expect(sanitizeRichHtml(sanitizeRichHtml(LEGACY_BODY))).toBe(sanitizeRichHtml(LEGACY_BODY));
  });

  it('빈 본문 계약은 그대로다', () => {
    expect(sanitizeRichHtml('')).toBe('');
  });
});
