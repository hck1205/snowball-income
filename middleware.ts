import { next } from '@vercel/functions';

/**
 * 공유 링크(`/?share=<코드>`)에만 붙는 라우팅 미들웨어.
 * 요청한 share 코드를 가리키는 `og:image` 를 **HTML 에 미리 박아서** 내려준다.
 *
 * ## 왜 미들웨어여야 하는가 (rewrite 로는 불가능하다)
 * 크롤러/스크래퍼는 JS 를 실행하지 않는다. React 가 런타임에 메타태그를 바꿔도 카카오톡·페이스북·네이버는
 * 절대 보지 못한다. 그래서 **HTML 이 나가는 시점에** og:image 가 이미 그 share 코드를 가리켜야 한다.
 *
 * `vercel.json` 의 `rewrites` 는 **파일시스템 조회 다음**에 평가된다(Vercel 문서: "rewrites … checks the
 * filesystem by default"). `/?share=abc` 는 경로가 `/` 이고 `dist/index.html` 이 존재하므로 파일시스템에서
 * 즉시 히트한다 → rewrite 단계에 **도달하지 못한다**. (쿼리스트링은 파일시스템 매칭에 관여하지 않는다.)
 * 반면 미들웨어는 캐시·파일시스템보다 **앞에서** 돌고, 커스텀 body 를 가진 `Response` 를 그대로 반환할 수 있다.
 * 따라서 SPA 의 URL별 메타태그 주입은 미들웨어가 사실상 유일한 수단이다.
 *
 * ## 왜 여기서 숫자를 계산하지 않는가
 * 시나리오 요약(월 배당/자산)을 og:title 에 넣으려면 디코더 → 시뮬레이션 엔진을 들고 와야 하고, 그건
 * `@/jotai` → `@/shared/constants` → `@/shared/styles`(Emotion) 까지 끌고 온다. 미들웨어는 **모든 `/` 요청**에
 * 대해 실행되므로(=일반 방문자 포함), 그 무게를 일반 방문자에게 지우는 건 손해다.
 * 숫자는 이미지 안에 들어가고(`/api/og` 는 Node 런타임이라 무제한), 미들웨어는 문자열 치환만 한다 → 의존성 0.
 * 나중에 og:title 에도 실제 숫자를 넣고 싶으면 이 요청을 `/api/share-html` 로 rewrite 하면 된다(확장 지점).
 *
 * ## 재귀 방지
 * `matcher: '/'` 는 **경로가 정확히 `/`** 일 때만 이 함수를 태운다. 아래에서 `/index.html` 을 fetch 하는데
 * 그 경로는 matcher 에 걸리지 않으므로 미들웨어가 다시 돌지 않는다(Vercel 의 508 INFINITE_LOOP_DETECTED 회피).
 * ⚠ 이 설계 때문에 `vercel.json` 에 `cleanUrls: true` 를 켜면 안 된다 — `/index.html` → `/` 로 308 되면서
 *   요청이 미들웨어로 되돌아와 무한 루프가 된다.
 */
export const config = {
  // 경로만 매칭한다(쿼리스트링은 matcher 문법에 존재하지 않는다) → share 여부는 아래 코드에서 판별.
  matcher: '/'
};

/** lz-string 의 compressToEncodedURIComponent 출력 문자셋. 이걸 벗어나면 우리 공유 코드가 아니다. */
const SHARE_CODE_PATTERN = /^[A-Za-z0-9+\-$._~*'()!]{1,4000}$/;

/** HTML 속성값 이스케이프. share 코드는 URL 에서 온 신뢰할 수 없는 입력이다. */
const escapeHtmlAttribute = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * `content="..."` 값만 바꾼다. 태그를 새로 삽입하지 않고 **기존 태그를 치환**하므로 중복 메타가 생기지 않는다
 * (스크래퍼는 보통 첫 번째 태그를 읽기 때문에, 뒤에 덧붙이는 방식은 조용히 무시당한다).
 */
const replaceMetaContent = (html: string, attribute: 'property' | 'name', key: string, value: string): string => {
  const pattern = new RegExp(`(<meta[^>]*\\s${attribute}="${key}"[^>]*\\scontent=")[^"]*(")`, 'i');
  return html.replace(pattern, `$1${escapeHtmlAttribute(value)}$2`);
};

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const shareCode = url.searchParams.get('share');

  // 공유 링크가 아니면 손대지 않는다 → 정적 index.html 이 그대로 나간다(일반 방문자 비용 0).
  if (!shareCode || !SHARE_CODE_PATTERN.test(shareCode)) return next();

  try {
    // matcher('/') 에 걸리지 않는 경로라 미들웨어가 재진입하지 않는다.
    const shell = await fetch(new URL('/index.html', url.origin));
    if (!shell.ok) return next();

    const ogImageUrl = new URL('/api/og', url.origin);
    ogImageUrl.searchParams.set('share', shareCode);

    const shareUrl = new URL('/', url.origin);
    shareUrl.searchParams.set('share', shareCode);

    let html = await shell.text();
    html = replaceMetaContent(html, 'property', 'og:image', ogImageUrl.toString());
    html = replaceMetaContent(html, 'name', 'twitter:image', ogImageUrl.toString());
    html = replaceMetaContent(html, 'property', 'og:url', shareUrl.toString());

    return new Response(html, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        // 같은 share 코드 → 같은 HTML. 엣지 캐시에 태워서 미들웨어 재실행을 줄인다.
        // (canonical 은 여전히 클린 URL 을 가리키므로 공유 링크가 따로 색인되지는 않는다.)
        'cache-control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'
      }
    });
  } catch {
    // 무슨 일이 있어도 앱은 떠야 한다. 실패하면 그냥 정적 셸.
    return next();
  }
}
