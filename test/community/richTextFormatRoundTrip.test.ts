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
    // 표는 이제 허용 태그다. 다만 Tiptap이 함께 뱉는 colgroup/col은 style만 나르므로 계속 제거한다.
    {
      name: 'colgroup',
      html: '<table><colgroup><col style="min-width: 25px;"></colgroup><tbody><tr><td>셀</td></tr></tbody></table>',
      forbidden: '<colgroup',
      keptText: '셀'
    },
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

/**
 * 표(table) sanitize 계약.
 *
 * 픽스처는 손으로 지어낸 HTML이 아니라 **Tiptap이 실제로 뱉은 원문**이다
 * (`insertTable({ rows: 3, cols: 3, withHeaderRow: true })` 직후 `editor.getHTML()`).
 * 여기가 실물과 어긋나면 "편집기엔 보이는데 저장하면 사라지는 표"가 된다 —
 * 에디터가 진짜 이 모양을 만드는지는 RichTextEditor.test.tsx의 왕복 스위트가 증명한다.
 */
const TIPTAP_TABLE_HTML =
  '<table style="min-width: 75px;">' +
  '<colgroup><col style="min-width: 25px;"><col style="min-width: 25px;"><col style="min-width: 25px;"></colgroup>' +
  '<tbody>' +
  '<tr><th colspan="1" rowspan="1"><p>머리1</p></th><th colspan="1" rowspan="1"><p>머리2</p></th><th colspan="1" rowspan="1"><p>머리3</p></th></tr>' +
  '<tr><td colspan="1" rowspan="1"><p>A1</p></td><td colspan="1" rowspan="1"><p>A2</p></td><td colspan="1" rowspan="1"><p>A3</p></td></tr>' +
  '<tr><td colspan="1" rowspan="1"><p>B1</p></td><td colspan="1" rowspan="1"><p>B2</p></td><td colspan="1" rowspan="1"><p>B3</p></td></tr>' +
  '</tbody></table>';

describe('sanitize 왕복 — 표(table)', () => {
  it('Tiptap 실측 표 HTML에서 표 구조 태그가 모두 살아남는다', () => {
    const out = sanitizeRichHtml(TIPTAP_TABLE_HTML).toLowerCase();

    for (const tag of ['table', 'tbody', 'tr', 'th', 'td']) {
      expect(out, `<${tag}> 가 sanitize에서 사라졌다: ${out}`).toContain(`<${tag}`);
    }
  });

  it('표 셀 텍스트가 하나도 유실되지 않는다', () => {
    const out = sanitizeRichHtml(TIPTAP_TABLE_HTML);

    for (const text of ['머리1', '머리2', '머리3', 'A1', 'A2', 'A3', 'B1', 'B2', 'B3']) {
      expect(out).toContain(text);
    }
  });

  it('style 속성과 colgroup/col은 제거된다 (렌더 CSS가 폭을 소유한다)', () => {
    const out = sanitizeRichHtml(TIPTAP_TABLE_HTML).toLowerCase();

    expect(out).not.toContain('style=');
    expect(out).not.toContain('min-width');
    expect(out).not.toContain('<colgroup');
    expect(out).not.toContain('<col');
  });

  it('정상 colspan/rowspan 정수는 보존된다', () => {
    const out = sanitizeRichHtml(
      '<table><tbody><tr><td colspan="2" rowspan="3">병합</td></tr></tbody></table>'
    ).toLowerCase();

    expect(out).toContain('colspan="2"');
    expect(out).toContain('rowspan="3"');
  });

  it('기본값 colspan="1" rowspan="1" 도 정수라 그대로 남는다', () => {
    const out = sanitizeRichHtml(TIPTAP_TABLE_HTML).toLowerCase();

    expect(out).toContain('colspan="1"');
    expect(out).toContain('rowspan="1"');
  });

  /**
   * DOMPurify는 속성 **이름**만 화이트리스트로 거르고 **값은 검증하지 않는다**.
   * 값 검증은 `afterSanitizeAttributes` 훅이 유일한 방어선이라 여기서 케이스를 촘촘히 못 박는다.
   * 불합격이면 **속성만** 떨어지고 셀 자체와 텍스트는 남아야 한다(표가 통째로 무너지면 안 된다).
   */
  const BAD_SPANS: ReadonlyArray<{ name: string; value: string }> = [
    { name: '문자열', value: 'abc' },
    { name: '음수', value: '-1' },
    { name: '소수', value: '1.5' },
    { name: '내부 공백', value: '2 2' },
    { name: '16진수 표기', value: '0x10' },
    { name: '지수 표기', value: '1e3' },
    { name: '0', value: '0' },
    { name: '빈 문자열', value: '' },
    { name: '상한 초과', value: '99999' }
  ];

  it.each(BAD_SPANS)('colspan="$value"($name)는 제거되고 셀은 남는다', ({ value }) => {
    const out = sanitizeRichHtml(
      `<table><tbody><tr><td colspan="${value}">셀내용</td></tr></tbody></table>`
    ).toLowerCase();

    expect(out, `잘못된 colspan이 통과했다: ${out}`).not.toContain('colspan');
    expect(out).toContain('<td');
    expect(sanitizeRichHtml(`<table><tbody><tr><td colspan="${value}">셀내용</td></tr></tbody></table>`)).toContain(
      '셀내용'
    );
  });

  it.each(BAD_SPANS)('rowspan="$value"($name)는 제거되고 셀은 남는다', ({ value }) => {
    const out = sanitizeRichHtml(
      `<table><tbody><tr><th rowspan="${value}">셀내용</th></tr></tbody></table>`
    ).toLowerCase();

    expect(out, `잘못된 rowspan이 통과했다: ${out}`).not.toContain('rowspan');
    expect(out).toContain('<th');
  });

  /**
   * ⚠ 앞뒤 공백은 **제거가 아니라 정규화**된다 — DOMPurify가 훅보다 먼저 속성 값을 trim 하므로
   * 우리 훅은 이미 `"2"`가 된 값을 본다(실측: `colspan=" 2"` → `colspan="2"`).
   * 결과가 항상 유효한 정수라 안전하지만, "공백이 붙으면 속성이 떨어진다"고 가정하면 틀린다.
   * 값 **안쪽** 공백(`"2 2"`)은 trim으로 안 없어져 위 BAD_SPANS대로 제거된다.
   */
  it('앞뒤 공백이 붙은 span은 정수로 정규화되어 살아남는다 (제거가 아니다)', () => {
    expect(
      sanitizeRichHtml('<table><tbody><tr><td colspan=" 2">셀</td></tr></tbody></table>').toLowerCase()
    ).toContain('colspan="2"');
    expect(
      sanitizeRichHtml('<table><tbody><tr><td colspan="\t3\n">셀</td></tr></tbody></table>').toLowerCase()
    ).toContain('colspan="3"');
  });

  it('상한 경계값 1000은 통과하고 1001은 제거된다', () => {
    const ok = sanitizeRichHtml('<table><tbody><tr><td colspan="1000">셀</td></tr></tbody></table>').toLowerCase();
    const over = sanitizeRichHtml('<table><tbody><tr><td colspan="1001">셀</td></tr></tbody></table>').toLowerCase();

    expect(ok).toContain('colspan="1000"');
    expect(over).not.toContain('colspan');
  });

  it('한 셀에서 잘못된 span만 떨어지고 정상 span은 남는다', () => {
    const out = sanitizeRichHtml(
      '<table><tbody><tr><td colspan="abc" rowspan="2">셀</td></tr></tbody></table>'
    ).toLowerCase();

    expect(out).not.toContain('colspan');
    expect(out).toContain('rowspan="2"');
  });

  it('sanitize를 두 번 통과시켜도 표 결과가 동일하다 (저장 전 + 렌더 시 이중 정화)', () => {
    const once = sanitizeRichHtml(TIPTAP_TABLE_HTML);
    expect(sanitizeRichHtml(once)).toBe(once);
  });

  /**
   * ⚠ **알려진 손실**: `<thead>`가 들어오면 껍데기뿐 아니라 **안의 헤더 행까지 통째로 사라진다**.
   *
   * "비허용 태그는 자식이 보존된다"는 DOMPurify의 일반 규칙이 표 내부에서는 성립하지 않는다
   * (실측: 우리 설정 없이 `DOMPurify.sanitize(..., { ALLOWED_TAGS: ['table','tbody','tr','th','td'] })`
   * 만 돌려도 같은 결과 — 우리 훅이 아니라 DOMPurify 쪽 동작이다. keep-content가 `<tr>`을
   * `<table>` 직하로 옮기면 HTML 파서가 유효하지 않은 표 내용으로 보고 버린다).
   *
   * 실사용 영향은 낮다 — 저장 경로에 들어오는 HTML은 Tiptap `getHTML()` 출력이고, Tiptap은
   * 붙여넣기를 자기 스키마로 파싱하며 `<thead>` 행을 `<tbody>` 안 `<tr><th>`로 바꿔 놓는다
   * (그래서 애초에 `thead`를 허용 목록에 넣지 않은 결정 자체는 타당하다).
   * 이 테스트는 그 손실을 **의도된 현상태로 고정**해, 나중에 thead 경로가 바뀌면 알아채게 한다.
   */
  it('붙여넣기로 들어온 <thead>는 헤더 행까지 사라진다 (알려진 손실 — tbody는 온전)', () => {
    const out = sanitizeRichHtml(
      '<table><thead><tr><th>머리</th></tr></thead><tbody><tr><td>본문</td></tr></tbody></table>'
    );

    expect(out.toLowerCase()).not.toContain('<thead');
    expect(out, '헤더 행이 살아났다면 sanitize 동작이 바뀐 것 — 주석을 갱신할 것').not.toContain('머리');
    // 나머지 표는 멀쩡해야 한다(표가 통째로 무너지면 안 된다).
    expect(out.toLowerCase()).toContain('<table');
    expect(out.toLowerCase()).toContain('<td');
    expect(out).toContain('본문');
  });
});

describe('sanitize 왕복 — 표 안의 XSS', () => {
  it('셀 안 <script>는 제거되고 셀 텍스트는 남는다', () => {
    const out = sanitizeRichHtml('<table><tbody><tr><td>안전<script>alert(1)</script></td></tr></tbody></table>');

    expect(out.toLowerCase()).not.toContain('<script');
    expect(out.toLowerCase()).not.toContain('alert(1)');
    expect(out).toContain('안전');
  });

  it('셀의 이벤트 핸들러 속성(onclick/onmouseover)은 제거된다', () => {
    const out = sanitizeRichHtml(
      '<table><tbody><tr><td onclick="alert(1)" onmouseover="alert(2)">셀</td></tr></tbody></table>'
    ).toLowerCase();

    expect(out).not.toContain('onclick');
    expect(out).not.toContain('onmouseover');
    expect(out).toContain('<td');
  });

  it('표/셀의 style·class·id 속성은 제거된다', () => {
    const out = sanitizeRichHtml(
      '<table class="evil" id="t1"><tbody><tr><td style="background:url(https://tracker.example/x)">셀</td></tr></tbody></table>'
    ).toLowerCase();

    expect(out).not.toContain('style=');
    expect(out).not.toContain('class=');
    expect(out).not.toContain('id=');
    expect(out).not.toContain('tracker.example');
  });

  it('셀 안 javascript: 링크는 href가 떨어지고 텍스트만 남는다', () => {
    const out = sanitizeRichHtml(
      '<table><tbody><tr><td><a href="javascript:alert(1)">눌러</a></td></tr></tbody></table>'
    );

    expect(out.toLowerCase()).not.toContain('javascript:');
    expect(out).not.toContain('href');
    expect(out).toContain('눌러');
  });

  it('셀 안 정상 링크는 href를 유지하고 rel/target이 강제된다 (표가 링크 훅을 안 깼다)', () => {
    const out = sanitizeRichHtml(
      '<table><tbody><tr><td><a href="https://example.com">출처</a></td></tr></tbody></table>'
    );

    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('target="_blank"');
    expect(out).toMatch(/rel="[^"]*noopener[^"]*"/);
  });

  it('셀 안 <img onerror>는 제거된다', () => {
    const out = sanitizeRichHtml('<table><tbody><tr><td><img src="x" onerror="alert(1)">셀</td></tr></tbody></table>');

    expect(out.toLowerCase()).not.toContain('<img');
    expect(out.toLowerCase()).not.toContain('onerror');
    expect(out).toContain('셀');
  });
});

describe('sanitize 왕복 — 표 허용이 기존 본문을 깨지 않는다', () => {
  /** 표 도입 **이전** 에디터가 만들 수 있던 전 서식 총집합. 허용 목록 확장의 하위 호환 증거. */
  const PRE_TABLE_BODY =
    '<h2>제목</h2><h3>소제목</h3>' +
    '<p><strong>굵게</strong> <em>기울임</em> <u>밑줄</u> <s>취소선</s> <code>코드</code></p>' +
    '<ul><li><p>글머리</p></li></ul><ol><li><p>번호</p></li></ol>' +
    '<blockquote><p>인용</p></blockquote>' +
    '<pre><code>block()</code></pre>' +
    '<p><a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow">링크</a></p>' +
    '<hr>';

  it('표 없는 기존 서식이 태그 손실 없이 그대로 통과한다', () => {
    const out = sanitizeRichHtml(PRE_TABLE_BODY).toLowerCase();

    for (const tag of ['h2', 'h3', 'strong', 'em', 'u', 's', 'code', 'ul', 'ol', 'li', 'blockquote', 'pre', 'a', 'hr']) {
      expect(out, `<${tag}> 가 표 허용 확장 이후 사라졌다`).toContain(`<${tag}`);
    }
    expect(sanitizeRichHtml(PRE_TABLE_BODY)).toContain('href="https://example.com"');
  });

  it('기존 본문의 재정화 결과가 자기 자신과 동일하다', () => {
    const once = sanitizeRichHtml(PRE_TABLE_BODY);
    expect(sanitizeRichHtml(once)).toBe(once);
  });

  it('표와 기존 서식이 한 본문에 섞여도 양쪽 다 살아남는다', () => {
    const out = sanitizeRichHtml(`${PRE_TABLE_BODY}${TIPTAP_TABLE_HTML}`).toLowerCase();

    expect(out).toContain('<h2');
    expect(out).toContain('<table');
    expect(out).toContain('<th');
    expect(out).toContain('<hr');
  });

  /**
   * ⚠ ALLOWED_ATTR은 **전역**이라 `colspan`/`rowspan`이 th/td가 아닌 허용 태그에도 붙을 수 있고,
   * 값 검증 훅은 th/td에서만 도는지라 `<p colspan="abc">` 같은 쓰레기 속성이 그대로 통과한다.
   * 렌더에는 아무 영향이 없는 무해한 잉여지만(표 밖 colspan은 브라우저가 무시한다),
   * "값 검증이 모든 태그를 덮는다"고 가정하면 틀린다 — 현상태를 그대로 고정한다.
   */
  it('표 밖 태그의 colspan은 값 검증 없이 통과한다 (무해한 잉여 — 현상태 고정)', () => {
    expect(sanitizeRichHtml('<p colspan="abc">문단</p>').toLowerCase()).toContain('colspan');
    expect(sanitizeRichHtml('<p colspan="abc">문단</p>')).toContain('문단');
  });

  it('그래도 위험한 span 값은 태그와 무관하게 제거된다 (XSS 경계는 유지)', () => {
    const out = sanitizeRichHtml('<p colspan="javascript:alert(1)">문단</p>').toLowerCase();

    expect(out).not.toContain('javascript:');
    expect(out).not.toContain('colspan');
    expect(sanitizeRichHtml('<p colspan="javascript:alert(1)">문단</p>')).toContain('문단');
  });
});
