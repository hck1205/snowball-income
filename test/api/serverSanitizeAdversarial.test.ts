import { describe, expect, it } from 'vitest';
import { sanitizePostBody } from '@/server/handlers/PostHtml/serverSanitize';
import { sanitizeRichHtml } from '@/shared/lib/richtext';

/**
 * `sanitizePostBody`(서버 jsdom+DOMPurify) 적대적 XSS 검증 — serverSanitize.test.ts 의 기본 페이로드를
 * **뛰어넘어** mXSS/DOM clobbering/인코딩 우회/속성 주입/표 함정/링크 스킴을 공격한다.
 *
 * 두 함수는 순수라 Node 에서 직접 호출한다. 각 케이스는 ①실행 벡터가 출력에 남지 않음 + ②클라이언트
 * `sanitizeRichHtml` 과 문자 그대로 동일(같은 엔진·같은 상수라 파리티가 공짜) 를 단정한다. 모든 in→out
 * 은 실측(probe)으로 관찰한 실제 출력에 못박았다.
 */

/** 정화 출력에 실행 가능한 벡터가 없음을 단정한다. */
const assertNoExecutableVector = (out: string): void => {
  const lower = out.toLowerCase();
  const forbidden = [
    '<script',
    '<style',
    '<iframe',
    '<img',
    '<svg',
    '<math',
    '<object',
    '<embed',
    '<form',
    '<base',
    '<meta',
    '<template',
    '<noscript',
    'javascript:',
    'vbscript:',
    'srcdoc',
    'onerror',
    'onmouseover',
    'ontoggle',
    'onclick',
    'onload',
    'alert(1)',
    'style='
  ];
  for (const needle of forbidden) {
    expect(lower, `벡터 "${needle}" 가 정화 출력에 남았다: ${out}`).not.toContain(needle);
  }
  // 일반화한 이벤트 핸들러 속성(on*=)이 하나도 없어야 한다.
  expect(out, `이벤트 핸들러 속성이 남았다: ${out}`).not.toMatch(/\son[a-z]+\s*=/i);
};

/** 무력화만 확인하는 적대적 페이로드(출력이 무해하기만 하면 됨). */
const NEUTRALIZED: { name: string; input: string }[] = [
  // ── mXSS / mutation XSS ─────────────────────────────────────────────
  { name: 'noscript 안 title 로 태그 탈출', input: '<noscript><p title="</noscript><img src=x onerror=alert(1)>">' },
  { name: 'style 자기중첩 mXSS', input: '<style><style/><img src=x onerror=alert(1)>' },
  { name: '주석 안 script 페이로드', input: '<!--><script>alert(1)</script>-->' },
  { name: 'svg > style 미완결', input: '<svg><style>{' },
  {
    name: 'math mglyph style mXSS 체인',
    input: '<math><mtext><table><mglyph><style><!--</style><img src onerror=alert(1)>'
  },
  { name: 'template 안 img onerror', input: '<template><img src=x onerror=alert(1)></template>' },
  { name: 'iframe srcdoc 중첩 script', input: '<iframe srcdoc="<script>alert(1)</script>"></iframe>' },
  { name: 'object data javascript', input: '<object data="javascript:alert(1)"></object>' },
  { name: 'base href 하이재킹', input: '<base href="https://evil.test/">' },
  { name: 'meta refresh javascript', input: '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">' },
  { name: 'details ontoggle', input: '<details open ontoggle=alert(1)>x</details>' },
  // ── 인코딩/공백 href 우회 ────────────────────────────────────────────
  { name: 'href 선행 공백 javascript', input: '<a href="  javascript:alert(1)">x</a>' },
  { name: 'href 스킴 내부 탭', input: '<a href="java\tscript:alert(1)">x</a>' },
  { name: 'href 엔티티 탭(&#x09;)', input: '<a href="jav&#x09;ascript:alert(1)">x</a>' },
  { name: 'href 대소문자 JavaScript', input: '<a href="JavaScript:alert(1)">x</a>' },
  { name: 'href 엔티티 인코딩 j(&#106;)', input: '<a href="&#106;avascript:alert(1)">x</a>' },
  { name: 'href 스킴 내부 개행', input: '<a href="java\nscript:alert(1)">x</a>' }
];

/** DOM clobbering — id/name 은 ALLOWED_ATTR 에 없어 제거돼야 한다(document.getElementById 오염 차단). */
const CLOBBERING: { name: string; input: string; forbidden: string[] }[] = [
  { name: 'a id="location"', input: '<a id="location" href="https://ok.test">x</a>', forbidden: ['id='] },
  { name: 'a name="body"', input: '<a name="body">x</a>', forbidden: ['name='] },
  {
    name: 'form + input name="attributes"',
    input: '<form><input name="attributes"></form>',
    forbidden: ['<form', '<input', 'name=']
  },
  { name: 'form id="attributes"', input: '<form id="attributes"></form>', forbidden: ['<form', 'id='] }
];

describe('sanitizePostBody 적대적 — mXSS/인코딩 우회 무력화', () => {
  for (const { name, input } of NEUTRALIZED) {
    it(`${name}`, () => {
      assertNoExecutableVector(sanitizePostBody(input));
    });
  }
});

describe('sanitizePostBody 적대적 — DOM clobbering(id/name 제거)', () => {
  for (const { name, input, forbidden } of CLOBBERING) {
    it(`${name}`, () => {
      const out = sanitizePostBody(input).toLowerCase();
      for (const needle of forbidden) {
        expect(out, `clobbering 벡터 "${needle}" 잔존: ${out}`).not.toContain(needle);
      }
    });
  }
});

describe('sanitizePostBody 적대적 — 표 span 속성 주입/경계', () => {
  const cell = (attrs: string) => `<table><tbody><tr><td ${attrs}>x</td></tr></tbody></table>`;

  it('colspan 값에 이벤트 핸들러를 끼운 주입은 제거된다', () => {
    const out = sanitizePostBody(cell('colspan="2 onmouseover=alert(1)"'));
    assertNoExecutableVector(out);
    expect(out).not.toContain('colspan');
    expect(out).toContain('<td>x</td>');
  });

  it('거대 colspan(99999 > MAX_CELL_SPAN 1000)은 제거된다', () => {
    expect(sanitizePostBody(cell('colspan="99999"'))).toBe('<table><tbody><tr><td>x</td></tr></tbody></table>');
  });

  it('음수/소수/지수 표기 span 은 모두 제거된다', () => {
    for (const bad of ['colspan="-1"', 'colspan="2.5"', 'colspan="1e3"', 'colspan="0"']) {
      expect(sanitizePostBody(cell(bad)), bad).toBe('<table><tbody><tr><td>x</td></tr></tbody></table>');
    }
  });

  it('상한 경계값 1000 은 통과, 1001 은 제거된다', () => {
    expect(sanitizePostBody(cell('colspan="1000"'))).toContain('colspan="1000"');
    expect(sanitizePostBody(cell('colspan="1001"'))).not.toContain('colspan');
  });

  it('colspan=" 2"(선행 공백)는 제거가 아니라 정규화된다 — DOMPurify 가 훅보다 먼저 trim', () => {
    // pitfalls 표 sanitize 함정 ②: 앞뒤 공백은 정규화, 내부 공백만 제거.
    expect(sanitizePostBody(cell('colspan=" 2"'))).toContain('colspan="2"');
    expect(sanitizePostBody(cell('colspan="2 2"'))).not.toContain('colspan');
  });
});

describe('sanitizePostBody 적대적 — 표 구조 함정(문서화된 실동작 못박기)', () => {
  it('<thead> 유입 시 헤더 행(tr>th)까지 통째로 사라진다', () => {
    // pitfalls 표 sanitize 함정 ①: 비허용 thead 는 껍데기뿐 아니라 헤더 행도 버려진다(DOMPurify keep-content).
    const out = sanitizePostBody(
      '<table><thead><tr><th>헤더</th></tr></thead><tbody><tr><td>본문</td></tr></tbody></table>'
    );
    expect(out).not.toContain('<thead');
    expect(out).not.toContain('<th');
    expect(out).not.toContain('헤더');
    expect(out).toContain('<td>본문</td>');
  });

  it('th/td 가 아닌 태그의 colspan 은 전역 ALLOWED_ATTR 라 통과한다(렌더 무해)', () => {
    // pitfalls 함정 ③: 값검증 훅은 th/td 한정이라 <p colspan> 은 안 걸러진다 — 실동작을 못박는다.
    expect(sanitizePostBody('<p colspan="99999">x</p>')).toBe('<p colspan="99999">x</p>');
  });
});

describe('sanitizePostBody 적대적 — 링크 스킴/rel·target 강제', () => {
  it('정상 https 링크에 target=_blank + rel=noopener noreferrer nofollow 를 강제한다', () => {
    const out = sanitizePostBody('<a href="https://ok.test/path">x</a>');
    expect(out).toContain('href="https://ok.test/path"');
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
  });

  it('mailto: 는 허용된다', () => {
    expect(sanitizePostBody('<a href="mailto:a@b.test">m</a>')).toContain('href="mailto:a@b.test"');
  });

  it('그 외 스킴(tel/ftp/relative)의 href 는 제거되고 앵커만 남는다', () => {
    for (const href of ['tel:123', 'ftp://evil.test/x', '/relative/path', '#frag']) {
      const out = sanitizePostBody(`<a href="${href}">x</a>`);
      expect(out, href).not.toContain('href=');
      expect(out, href).toContain('>x</a>');
    }
  });
});

describe('클라이언트 ↔ 서버 파리티 — 적대적 페이로드 전부', () => {
  const ALL_INPUTS = [
    ...NEUTRALIZED.map((p) => p.input),
    ...CLOBBERING.map((p) => p.input),
    '<table><tbody><tr><td colspan="2 onmouseover=alert(1)">x</td></tr></tbody></table>',
    '<table><tbody><tr><td colspan="99999">x</td></tr></tbody></table>',
    '<table><tbody><tr><td colspan=" 2">x</td></tr></tbody></table>',
    '<table><tbody><tr><td colspan="2 2">x</td></tr></tbody></table>',
    '<table><thead><tr><th>헤더</th></tr></thead><tbody><tr><td>본문</td></tr></tbody></table>',
    '<p colspan="99999">x</p>',
    '<a href="https://ok.test/path">x</a>',
    '<a href="mailto:a@b.test">m</a>',
    '<a href="tel:123">x</a>'
  ];

  it('모든 적대적 입력에서 sanitizePostBody 출력이 sanitizeRichHtml 과 문자 그대로 일치한다', () => {
    for (const input of ALL_INPUTS) {
      expect(sanitizePostBody(input), `파리티 어긋남: ${input}`).toBe(sanitizeRichHtml(input));
    }
  });
});
