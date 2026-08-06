import { describe, expect, it } from 'vitest';
import { newsHostLabel, parseNewsPayload } from '@/shared/lib/supabase';

/**
 * 뉴스 `payload` 파서 — **서버 jsonb 를 믿지 않는다**.
 *
 * 🔴 여기 들어오는 값은 두 겹으로 남의 것이다: 우리 DB 의 jsonb 이고, 그 문자열은 애초에 남의
 * 웹사이트에서 뽑아 온 것이다. 카드 전체가 `url` 로 가는 링크라, 이 파서가 `javascript:` 를
 * 놓치면 그것이 곧 스크립트 실행이다.
 */
describe('parseNewsPayload — 통과시키면 안 되는 것', () => {
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['문자열', 'https://example.com'],
    ['배열', [{ url: 'https://example.com' }]],
    ['url 없음', { title: '제목' }],
    ['url 이 문자열이 아님', { url: 123 }]
  ])('%s 은 null 이다', (_label, value) => {
    expect(parseNewsPayload(value)).toBeNull();
  });

  /** 🔴 이 계약이 이 파일에서 가장 중요하다 — 카드 전체가 이 주소로 가는 링크다. */
  it.each([
    ['javascript:', 'javascript:alert(1)'],
    ['data:', 'data:text/html,<script>alert(1)</script>'],
    ['file:', 'file:///etc/passwd'],
    ['상대 경로', '/relative/path'],
    ['빈 문자열', '']
  ])('url 이 %s 이면 통째로 버린다', (_label, url) => {
    expect(parseNewsPayload({ url, title: '제목' })).toBeNull();
  });

  it('image 가 http(s) 가 아니면 **썸네일만** 버리고 카드는 남긴다', () => {
    const parsed = parseNewsPayload({
      url: 'https://news.example.com/a',
      title: '제목',
      image: 'javascript:alert(1)'
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.image).toBeUndefined();
    expect(parsed?.title).toBe('제목');
  });
});

describe('parseNewsPayload — 좁혀서 통과시키는 것', () => {
  it('제목이 없으면 호스트로 떨어진다 — 빈 카드를 만들지 않는다', () => {
    const parsed = parseNewsPayload({ url: 'https://www.news.example.com/a' });
    expect(parsed?.title).toBe('news.example.com');
    expect(parsed?.source).toBe('news.example.com');
  });

  /** 🔴 저작권 — 원문을 통째로 담지 않는다는 약속의 마지막 방어선이다. */
  it('요약이 길면 잘라 담는다', () => {
    const parsed = parseNewsPayload({
      url: 'https://news.example.com/a',
      title: '제목',
      summary: '가'.repeat(900)
    });

    expect(parsed!.summary!.length).toBeLessThanOrEqual(300);
    expect(parsed!.summary!.endsWith('…')).toBe(true);
  });

  it('제목의 줄바꿈·연속 공백을 한 칸으로 접는다 — 카드 두 줄 제한이 무너지지 않게', () => {
    const parsed = parseNewsPayload({ url: 'https://news.example.com/a', title: ' 앞  \n 뒤 ' });
    expect(parsed?.title).toBe('앞 뒤');
  });

  it('빈 문자열 필드는 없는 것으로 다룬다', () => {
    const parsed = parseNewsPayload({ url: 'https://news.example.com/a', title: '제목', summary: '   ', image: '' });
    expect(parsed?.summary).toBeUndefined();
    expect(parsed?.image).toBeUndefined();
  });

  it('정상 payload 를 그대로 통과시킨다', () => {
    const parsed = parseNewsPayload({
      url: 'https://news.example.com/a',
      title: '오픈그래프 제목',
      summary: '요약',
      image: 'https://cdn.example.com/t.png',
      source: '어느 신문'
    });

    expect(parsed).toEqual({
      url: 'https://news.example.com/a',
      title: '오픈그래프 제목',
      summary: '요약',
      image: 'https://cdn.example.com/t.png',
      source: '어느 신문'
    });
  });
});

describe('newsHostLabel', () => {
  it('www 를 떼고 호스트만 보여 준다', () => {
    expect(newsHostLabel({ url: 'https://www.hankyung.com/article/1', title: 't', source: 's' })).toBe('hankyung.com');
  });
});
