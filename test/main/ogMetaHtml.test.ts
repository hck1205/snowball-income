import { DB_SHARE_KEY_PATTERN, escapeHtmlAttribute, isDbShareKey, replaceMetaContent } from '@/shared/lib/og';

/**
 * OG 메타 치환 + DB 공유 key 판별 (트랙 F, 순수 문자열 로직).
 * middleware(Edge)와 api/share-html(Node)이 공유하는 함수라, `?share=` 회귀 방지와 함께 못박는다.
 */

describe('replaceMetaContent', () => {
  it('property 메타의 content 만 바꾼다', () => {
    const html = '<meta property="og:title" content="기본 제목" />';
    expect(replaceMetaContent(html, 'property', 'og:title', '새 제목')).toBe(
      '<meta property="og:title" content="새 제목" />'
    );
  });

  it('name 메타(twitter:*)도 바꾼다', () => {
    const html = '<meta name="twitter:image" content="/old.png" />';
    expect(replaceMetaContent(html, 'name', 'twitter:image', 'https://x/new.png')).toBe(
      '<meta name="twitter:image" content="https://x/new.png" />'
    );
  });

  it('속성 순서가 달라도(id 가 앞) 매치한다', () => {
    const html = '<meta id="og-url" property="og:url" content="https://x/" />';
    expect(replaceMetaContent(html, 'property', 'og:url', 'https://x/?s=KEY')).toBe(
      '<meta id="og-url" property="og:url" content="https://x/?s=KEY" />'
    );
  });

  it('여러 줄에 걸친 메타도 매치한다(index.html 실제 포맷)', () => {
    const html = '<meta\n  property="og:image:alt"\n  content="기본 alt"\n/>';
    expect(replaceMetaContent(html, 'property', 'og:image:alt', '새 alt')).toContain('content="새 alt"');
  });

  it('접두가 겹치는 키를 삼키지 않는다 — og:image 치환이 og:image:alt 를 건드리지 않는다', () => {
    const html =
      '<meta property="og:image" content="/old.png" />\n<meta property="og:image:alt" content="원본 alt" />';
    const result = replaceMetaContent(html, 'property', 'og:image', '/new.png');
    expect(result).toContain('<meta property="og:image" content="/new.png" />');
    expect(result).toContain('<meta property="og:image:alt" content="원본 alt" />');
  });

  it('값을 HTML 속성 안전하게 이스케이프한다(신뢰불가 입력)', () => {
    const html = '<meta property="og:title" content="x" />';
    const result = replaceMetaContent(html, 'property', 'og:title', 'a"b<c>&d');
    expect(result).toBe('<meta property="og:title" content="a&quot;b&lt;c&gt;&amp;d" />');
  });

  it('매치되는 태그가 없으면 원문을 그대로 둔다(무치환 폴백)', () => {
    const html = '<meta property="og:title" content="x" />';
    expect(replaceMetaContent(html, 'property', 'og:description', '없음')).toBe(html);
  });
});

describe('escapeHtmlAttribute', () => {
  it('& < > " 를 엔티티로 바꾼다', () => {
    expect(escapeHtmlAttribute('<a href="x">&')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;');
  });
});

describe('DB_SHARE_KEY_PATTERN / isDbShareKey', () => {
  it('base64url key(~22자)를 통과시킨다', () => {
    expect(isDbShareKey('AbC123_xyz-KEY0123456')).toBe(true);
    expect(DB_SHARE_KEY_PATTERN.test('0123456789abcdef')).toBe(true); // 16자 하한
  });

  it('구 lz-string 코드(특수문자)·빈 값·너무 짧은 값은 막는다', () => {
    expect(isDbShareKey("N4Ig+dg$.")).toBe(false); // + $ . 는 key 문자셋 아님
    expect(isDbShareKey('short')).toBe(false); // 16자 미만
    expect(isDbShareKey('')).toBe(false);
    expect(isDbShareKey(null)).toBe(false);
    expect(isDbShareKey(undefined)).toBe(false);
  });
});
