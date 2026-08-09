// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import { youtubeVideoId, youtubeWatchUrl } from '@/shared/lib/youtube';

/**
 * 유튜브 영상 ID 추출 — **이 함수가 파이어족들 지면의 보안 경계다.**
 *
 * 🔴 형제 경로(`Unfurl.ts`)는 남의 주소를 서버가 대신 여는 SSRF 대리인이라 가드가 여섯 겹이다.
 *    유튜브 분기는 그 경로를 아예 타지 않는데, **그럴 수 있는 이유가 이 함수 하나**다 —
 *    여기서 유튜브가 아닌 것을 통과시키면 그 주소가 뒤에서 그대로 열린다.
 * ⚠ 그래서 "된다"보다 **"안 된다"를 더 많이 잠근다.**
 */

describe('🔴 유튜브가 아닌 것은 통과하지 못한다', () => {
  it.each([
    ['비슷한 이름의 다른 도메인', 'https://evil-youtube.com/watch?v=dQw4w9WgXcQ'],
    ['하위 도메인으로 위장', 'https://youtube.com.evil.io/watch?v=dQw4w9WgXcQ'],
    ['경로에 youtube.com 을 넣은 남의 사이트', 'https://evil.io/youtube.com/watch?v=dQw4w9WgXcQ'],
    ['사설 대역', 'http://192.168.0.1/watch?v=dQw4w9WgXcQ'],
    ['클라우드 메타데이터', 'http://169.254.169.254/latest/meta-data'],
    ['javascript 스킴', 'javascript:alert(1)'],
    ['file 스킴', 'file:///etc/passwd'],
    ['주소가 아님', '그냥 글자'],
    ['빈 문자열', '']
  ])('%s → null', (_label, raw) => {
    expect(youtubeVideoId(raw)).toBeNull();
  });

  it('⭐ 유튜브 도메인이라도 ID 형태가 아니면 버린다 — 그 값이 뒤에서 주소에 박힌다', () => {
    expect(youtubeVideoId('https://www.youtube.com/watch?v=short')).toBeNull();
    expect(youtubeVideoId('https://www.youtube.com/watch?v=' + 'a'.repeat(40))).toBeNull();
    /* 경로 주입 시도 — 11자를 넘거나 허용 문자 밖이면 걸린다. */
    expect(youtubeVideoId('https://www.youtube.com/watch?v=../../etc')).toBeNull();
  });

  it('영상이 아닌 유튜브 화면은 받지 않는다', () => {
    expect(youtubeVideoId('https://www.youtube.com/')).toBeNull();
    expect(youtubeVideoId('https://www.youtube.com/results?search_query=fire')).toBeNull();
    expect(youtubeVideoId('https://www.youtube.com/@somechannel')).toBeNull();
  });
});

describe('⭐ 유튜브 영상 주소는 형태가 달라도 같은 ID 로 모인다', () => {
  const ID = 'dQw4w9WgXcQ';

  it.each([
    ['watch', `https://www.youtube.com/watch?v=${ID}`],
    ['www 없이', `https://youtube.com/watch?v=${ID}`],
    ['모바일', `https://m.youtube.com/watch?v=${ID}`],
    ['단축 주소', `https://youtu.be/${ID}`],
    ['쇼츠', `https://www.youtube.com/shorts/${ID}`],
    ['라이브', `https://www.youtube.com/live/${ID}`],
    ['임베드', `https://www.youtube.com/embed/${ID}`],
    ['다른 파라미터가 붙어도', `https://www.youtube.com/watch?v=${ID}&t=42s&list=PLabc`]
  ])('%s', (_label, raw) => {
    expect(youtubeVideoId(raw)).toBe(ID);
  });
});

describe('🔴 우리가 만든 주소만 부른다', () => {
  it('⭐ 사용자가 준 문자열이 아니라 ID 로 조립한 정규 주소다 — 추적 파라미터도 함께 떨어진다', () => {
    const messy = 'https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&si=trackingtoken';

    const id = youtubeVideoId(messy);
    expect(id).toBe('dQw4w9WgXcQ');
    expect(youtubeWatchUrl(id as string)).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });
});
