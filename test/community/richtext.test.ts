import { describe, expect, it } from 'vitest';
import { deriveExcerpt, htmlToPlainText, isRichTextEmpty } from '@/shared/lib/richtext';

/**
 * 본문 → plain text 변환은 "본문이 실제로 비었는지"(게시 규칙)와 요약 자동 발췌의 근거다.
 * 반드시 sanitize를 먼저 통과시켜 악성 태그가 파서에 닿지 않게 한다.
 */
describe('htmlToPlainText', () => {
  it('태그를 벗기고 텍스트만 남긴다', () => {
    expect(htmlToPlainText('<p>안녕 <strong>세상</strong></p>')).toBe('안녕 세상');
  });

  it('악성 태그의 텍스트는 sanitize 단계에서 제거된 뒤 파싱된다', () => {
    expect(htmlToPlainText('<script>alert(1)</script><p>본문</p>')).toBe('본문');
  });

  it('연속 공백을 접는다', () => {
    expect(htmlToPlainText('<p>a</p>\n\n<p>   b   </p>')).toBe('a b');
  });

  it('빈 문자열은 빈 문자열', () => {
    expect(htmlToPlainText('')).toBe('');
  });
});

describe('isRichTextEmpty', () => {
  it('빈 문단/줄바꿈만 있으면 비었다고 본다', () => {
    expect(isRichTextEmpty('<p></p>')).toBe(true);
    expect(isRichTextEmpty('<p><br></p>')).toBe(true);
    expect(isRichTextEmpty('   ')).toBe(true);
    expect(isRichTextEmpty('')).toBe(true);
  });

  it('실제 글자가 있으면 비지 않았다고 본다', () => {
    expect(isRichTextEmpty('<p>내용</p>')).toBe(false);
  });

  it('스크립트만 있는 본문은 비었다고 본다 (sanitize 후 텍스트 없음)', () => {
    expect(isRichTextEmpty('<script>doEvil()</script>')).toBe(true);
  });
});

describe('deriveExcerpt', () => {
  it('짧은 본문은 그대로 (plain text)', () => {
    expect(deriveExcerpt('<p>짧은 소개</p>', 120)).toBe('짧은 소개');
  });

  it('maxLength를 넘으면 앞부분만 잘라낸다', () => {
    const html = `<p>${'가'.repeat(200)}</p>`;
    const excerpt = deriveExcerpt(html, 120);
    expect(excerpt.length).toBe(120);
    expect(excerpt).toBe('가'.repeat(120));
  });

  it('경계값: 정확히 maxLength면 그대로', () => {
    const html = `<p>${'a'.repeat(120)}</p>`;
    expect(deriveExcerpt(html, 120)).toBe('a'.repeat(120));
  });
});
