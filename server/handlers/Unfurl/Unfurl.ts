import { toNodeHandler } from '@/shared/lib/server';
import { youtubeVideoId } from '@/shared/lib/youtube';
import { fetchYoutubeMeta } from './youtube';

/**
 * `/api/unfurl?url=…` — 남의 페이지에서 **제목·요약·썸네일·출처**만 뽑아 JSON 으로 돌려준다.
 *
 * ## 왜 서버인가
 * 브라우저에서 남의 사이트를 fetch 하면 CORS 로 막힌다. 그래서 이 일은 서버가 해야 한다.
 * 그리고 서버가 임의의 URL 을 대신 열어 주는 순간 이 엔드포인트는 **SSRF 대리인**이 된다 —
 * 아래 가드가 이 파일의 본체이고, 뽑아내는 로직은 곁가지다.
 *
 * ## 🔴 SSRF 가드 (지우지 마라 — 하나라도 빠지면 내부망이 열린다)
 *  ① **스킴**: http/https 만. `file:`·`gopher:`·`data:` 는 즉시 거절.
 *  ② **호스트**: localhost·사설 대역(10/8, 172.16/12, 192.168/16, 127/8, 169.254/16 = 클라우드
 *     메타데이터, ::1, fc00::/7)을 거절한다. **리다이렉트를 따라갈 때마다 다시 검사한다** —
 *     공개 도메인이 사설 IP 로 302 하는 것이 이 공격의 고전적인 형태다.
 *  ③ **리다이렉트 3회** 상한. 무한 루프와 우회 사슬을 함께 막는다.
 *  ④ **응답 256KB** 상한. og 태그는 `<head>` 에 있으므로 앞부분만 읽으면 충분하고,
 *     상한이 없으면 거대한 파일 하나로 함수 메모리를 태울 수 있다.
 *  ⑤ **5초** 타임아웃. 응답하지 않는 서버가 우리 함수를 붙잡아 두지 못하게.
 *  ⑥ **content-type** 이 html 이 아니면 파싱하지 않는다.
 *
 * ⚠ IP 리터럴만 막는 것으로는 부족하다 — 이름이 사설 IP 로 풀리는 경우(DNS rebinding)는 이
 *   레이어에서 완전히 막을 수 없다. 그래서 **저장하는 값이 텍스트뿐**이라는 점이 두 번째 방어선이다
 *   (본문을 가져와 보여 주지 않는다. LinkPayload 주석 참고).
 *
 * ## 무엇을 돌려주나
 * `{ url, title, summary?, image?, source }` — `shared/lib/supabase` 의 `LinkPayload` 와 같은 모양이다.
 * 🔴 **원문 본문은 담지 않는다**(저작권). 제목·요약 두세 줄·썸네일·출처가 전부다.
 */

/** 리다이렉트 상한. */
const MAX_REDIRECTS = 3;
/** 읽어들일 응답 상한(바이트). og 태그는 head 에 있어 이보다 훨씬 앞에서 끝난다. */
const MAX_BYTES = 256 * 1024;
/** 한 홉당 타임아웃(ms). */
const TIMEOUT_MS = 5_000;
/** 요약 길이 상한(자). 원문 복제를 막는 선이기도 하다. */
const MAX_SUMMARY = 300;

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };

const fail = (status: number, message: string): Response =>
  new Response(JSON.stringify({ error: message }), { status, headers: JSON_HEADERS });

/**
 * 이 호스트로 나가도 되는가.
 *
 * 🔴 **차단 목록이 아니라 형태 검사다.** "이 이름이 사설인가"를 문자열로 판정하므로 새 사설 대역이
 * 생겨도 규칙이 바뀌지 않는다. 이름 해석 뒤의 IP 까지는 못 보지만(런타임 제약), 리터럴 IP 와
 * 로컬 이름은 여기서 전부 걸린다.
 */
const isBlockedHost = (hostname: string): boolean => {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true;
  if (host === '::1' || host === '0.0.0.0') return true;
  /* IPv6 유니크 로컬(fc00::/7) · 링크 로컬(fe80::/10) */
  if (/^f[cd][0-9a-f]{2}:/.test(host) || /^fe[89ab][0-9a-f]:/.test(host)) return true;

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;

  const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
  if (a === 127 || a === 10 || a === 0) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  /* 169.254/16 — 클라우드 인스턴스 메타데이터. 이 한 줄이 자격증명 유출을 막는다. */
  if (a === 169 && b === 254) return true;
  return false;
};

/** 스킴·호스트를 함께 본다. **리다이렉트마다 다시 부른다.** */
const isSafeUrl = (raw: string): boolean => {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
  return !isBlockedHost(parsed.hostname);
};

/** 응답 앞부분만 읽는다(최대 MAX_BYTES). 본문을 통째로 메모리에 올리지 않는다. */
const readHead = async (response: Response): Promise<string> => {
  const reader = response.body?.getReader();
  if (!reader) return '';

  const decoder = new TextDecoder('utf-8');
  let text = '';
  let read = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      read += value.byteLength;
      text += decoder.decode(value, { stream: true });
      /* head 를 지났으면 더 읽을 이유가 없다 — 대부분 첫 청크에서 끝난다. */
      if (read >= MAX_BYTES || /<\/head>/i.test(text)) break;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }

  return text;
};

/**
 * 리다이렉트를 **손으로** 따라간다(`redirect: 'manual'`).
 * 🔴 자동 추적(`follow`)을 쓰면 중간 홉을 검사할 수 없다 — 그게 이 가드의 구멍이 된다.
 */
const fetchHtml = async (startUrl: string): Promise<{ finalUrl: string; html: string } | null> => {
  let target = startUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    if (!isSafeUrl(target)) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(target, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          /* 봇을 막는 사이트가 많아 평범한 UA 를 쓴다. 크롤링이 아니라 사용자가 붙인 링크 한 건이다. */
          'user-agent': 'Mozilla/5.0 (compatible; HungryHippoBot/1.0; +https://hungry-hippo.xyz)',
          accept: 'text/html,application/xhtml+xml'
        }
      });
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) return null;
      target = new URL(location, target).toString();
      continue;
    }

    if (!response.ok) return null;
    if (!/text\/html|application\/xhtml/i.test(response.headers.get('content-type') ?? '')) return null;

    return { finalUrl: target, html: await readHead(response) };
  }

  return null;
};

/* ── 태그 뽑기 — 정규식으로 충분하다(head 의 meta 는 중첩이 없다) ────────────────── */

const decodeEntities = (value: string): string =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');

const metaContent = (html: string, property: string): string | undefined => {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${escaped}["']`, 'i')
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeEntities(match[1]).trim();
  }
  return undefined;
};

const titleTag = (html: string): string | undefined => {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1] ? decodeEntities(match[1]).replace(/\s+/g, ' ').trim() : undefined;
};

const clamp = (value: string | undefined, max: number): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (!trimmed) return undefined;
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`;
};

/** 썸네일은 절대 URL 로 만들고, **다시 안전한지 본다**(og:image 도 남이 준 값이다). */
const resolveImage = (raw: string | undefined, base: string): string | undefined => {
  if (!raw) return undefined;
  try {
    const absolute = new URL(raw, base).toString();
    return isSafeUrl(absolute) ? absolute : undefined;
  } catch {
    return undefined;
  }
};

export async function handler(request: Request): Promise<Response> {
  const target = new URL(request.url).searchParams.get('url')?.trim();
  if (!target) return fail(400, 'url 파라미터가 필요합니다.');

  /*
   * 🔴 **유튜브는 여기서 갈라진다.** 영상 ID 만 뽑아 우리가 만든 oEmbed 주소를 부르므로,
   *    아래의 "남의 주소를 대신 연다"는 경로를 아예 타지 않는다 — 이 분기에는 SSRF 표면이 없다.
   *    근거와 ID 추출 규칙은 `./youtube.ts` 머리말에 있다.
   * ⚠ 순서가 중요하다. `isSafeUrl` 뒤에 두면 유튜브도 일반 경로의 제약(리다이렉트·바이트 상한)을
   *   함께 받게 되는데, 그건 우리가 부르는 주소가 유튜브 한 곳이라 의미가 없다.
   */
  const videoId = youtubeVideoId(target);
  if (videoId) {
    const meta = await fetchYoutubeMeta(videoId);
    if (!meta) return fail(422, '이 영상의 정보를 읽지 못했습니다.');
    return new Response(JSON.stringify(meta), { status: 200, headers: JSON_HEADERS });
  }

  if (!isSafeUrl(target)) return fail(400, '열 수 없는 주소입니다.');

  const fetched = await fetchHtml(target);
  if (!fetched) return fail(422, '이 주소에서 정보를 읽지 못했습니다.');

  const { finalUrl, html } = fetched;
  const host = new URL(finalUrl).hostname.replace(/^www\./, '');

  return new Response(
    JSON.stringify({
      url: finalUrl,
      /* 제목이 없으면 도메인으로 떨어진다 — 빈 카드를 만들지 않는다. */
      title: clamp(metaContent(html, 'og:title') ?? titleTag(html), 200) ?? host,
      summary: clamp(metaContent(html, 'og:description') ?? metaContent(html, 'description'), MAX_SUMMARY),
      image: resolveImage(metaContent(html, 'og:image'), finalUrl),
      source: clamp(metaContent(html, 'og:site_name'), 60) ?? host
    }),
    { status: 200, headers: JSON_HEADERS }
  );
}

/** ⚠ Vercel 이 실제로 호출하는 진입점. 어댑터를 벗기면 무응답으로 되돌아간다. */
export default toNodeHandler(handler);
