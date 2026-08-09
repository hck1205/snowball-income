/**
 * 유튜브 링크 → 제목·썸네일. **oEmbed 만 쓴다.**
 *
 * ## 🔴 왜 따로 두나 — SSRF 표면이 없어진다
 *
 * 형제 파일 `Unfurl.ts` 는 **임의의 주소를 서버가 대신 여는** 엔드포인트라, 파일의 본체가
 * SSRF 가드다(사설 대역·리다이렉트마다 재검사·바이트 상한·타임아웃…). 그런데 파이어족들 지면은
 * **유튜브 영상만** 받는다. 그러면 우리가 여는 주소는 언제나 `youtube.com` 한 곳이므로,
 * 남의 서버를 대신 열어 줄 일이 아예 없다 — **가드가 필요 없는 게 아니라 표면이 사라진다.**
 *
 * 입력에서 뽑는 것은 **영상 ID 하나**뿐이고, 그 ID 로 우리가 만든 주소만 부른다.
 * 사용자가 준 주소를 그대로 fetch 하지 않는다는 점이 이 파일의 핵심이다.
 *
 * ## 왜 og 태그가 아니라 oEmbed 인가
 *
 * oEmbed 는 유튜브가 **계약으로 제공하는 엔드포인트**라 마크업이 바뀌어도 깨지지 않는다.
 * API 키도 필요 없다. og 파싱은 페이지 구조에 기대는 방식이라 언젠가 조용히 어긋난다.
 *
 * ⚠ 썸네일을 **우리가 저장하지 않는다.** oEmbed 가 준 유튜브 CDN 주소를 그대로 가리킨다 —
 *   복제하면 저작권과 용량이 둘 다 문제가 되고, 유튜브 CDN 이 우리보다 빠르다.
 */

import { youtubeWatchUrl } from '@/shared/lib/youtube';

/** oEmbed 응답 대기 상한(ms). 형제 핸들러와 같은 값. */
const TIMEOUT_MS = 5_000;

export type YoutubeMeta = {
  url: string;
  title: string;
  image?: string;
  source: string;
};

/**
 * oEmbed 로 제목·썸네일·채널명을 받아 온다. 실패하면 `null`.
 *
 * ⚠ 응답을 믿지 않는다 — 남의 서버가 준 JSON 이라 필드가 없거나 형태가 다를 수 있다.
 *   제목이 없으면 통째로 실패로 본다(제목 없는 카드는 만들지 않는다).
 */
export const fetchYoutubeMeta = async (videoId: string): Promise<YoutubeMeta | null> => {
  const watch = youtubeWatchUrl(videoId);
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(watch)}&format=json`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, { signal: controller.signal });
    /* 비공개·삭제된 영상은 401/404 를 준다 — 그것도 실패다. */
    if (!response.ok) return null;

    const data = (await response.json()) as { title?: unknown; thumbnail_url?: unknown; author_name?: unknown };
    const title = typeof data.title === 'string' ? data.title.trim() : '';
    if (!title) return null;

    const thumbnail = typeof data.thumbnail_url === 'string' ? data.thumbnail_url : '';
    const author = typeof data.author_name === 'string' ? data.author_name.trim() : '';

    return {
      url: watch,
      title: title.slice(0, 200),
      /* ⚠ 썸네일도 https 인지 다시 본다 — 남이 준 문자열이 그대로 `<img src>` 로 간다. */
      image: thumbnail.startsWith('https://') ? thumbnail : undefined,
      /* 출처는 **채널 이름**이다. 없으면 플랫폼 이름으로 떨어진다(빈 칸을 두지 않는다). */
      source: (author || 'YouTube').slice(0, 60)
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};
