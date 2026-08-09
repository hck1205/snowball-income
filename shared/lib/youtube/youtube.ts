/**
 * 유튜브 주소 다루기 — **순수 함수만**. 네트워크를 타지 않는다.
 *
 * 🔴 서버와 클라이언트가 **같은 함수**를 써야 한다. 서버는 이 ID 로 oEmbed 를 부르고
 *    (`server/handlers/Unfurl/youtube.ts`), 화면은 같은 ID 로 임베드 주소를 만든다
 *    (`FireLinkBlock`). 둘이 각자 정규식을 들면 한쪽만 고쳐질 때 조용히 갈린다.
 * 🔴 이 파일이 **파이어족들 지면의 보안 경계**다. 여기서 유튜브가 아닌 것을 통과시키면
 *    그 주소가 뒤에서 그대로 열리거나 iframe 에 박힌다. 가드: test/community/youtubeUnfurl.test.ts
 */

/**
 * 유튜브 주소에서 **영상 ID**를 뽑는다. 유튜브가 아니면 `null`.
 *
 * 받아들이는 형태:
 *   - `youtube.com/watch?v=ID`
 *   - `youtu.be/ID`
 *   - `youtube.com/shorts/ID` · `youtube.com/live/ID` · `youtube.com/embed/ID`
 *
 * 🔴 호스트를 **정확히 대조**한다(`endsWith('youtube.com')` 같은 느슨한 검사를 쓰지 않는다) —
 *    `evil-youtube.com` 이 통과하면 이 파일이 지키려던 것이 무너진다.
 * ⚠ ID 는 11자 영숫자·`-`·`_` 다. 형태가 다르면 버린다 — 뒤에서 우리가 만드는 주소에 그대로
 *   들어가는 값이라, 여기서 좁히는 것이 곧 주입 방어다.
 */
export const youtubeVideoId = (raw: string): string | null => {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

  const host = url.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
  const path = url.pathname.split('/').filter(Boolean);

  const candidate =
    host === 'youtu.be'
      ? path[0]
      : host === 'youtube.com' || host === 'music.youtube.com'
        ? path[0] === 'watch'
          ? (url.searchParams.get('v') ?? '')
          : ['shorts', 'live', 'embed', 'v'].includes(path[0] ?? '')
            ? path[1]
            : ''
        : '';

  if (!candidate) return null;
  return /^[A-Za-z0-9_-]{11}$/.test(candidate) ? candidate : null;
};

/** 뽑은 ID 로 **우리가 만든** 정규 주소. 사용자가 준 문자열을 그대로 쓰지 않는다. */
export const youtubeWatchUrl = (videoId: string): string => `https://www.youtube.com/watch?v=${videoId}`;

/**
 * 개인정보 강화 임베드 주소.
 *
 * 🔴 `youtube-nocookie.com` 이다. 표준 `youtube.com/embed` 는 **페이지가 뜨는 순간** 쿠키를
 *    심는다 — 사용자가 재생을 누르지 않아도. 이쪽은 재생 전까지 심지 않는다.
 * ⚠ 그래도 **재생하면 쿠키가 생긴다.** 그래서 화면은 클릭 전까지 이 주소를 아예 부르지 않고
 *   (썸네일만 그린다), 개인정보처리방침이 그 사실을 적는다. 셋이 한 벌이다.
 */
export const youtubeEmbedUrl = (videoId: string): string =>
  `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
