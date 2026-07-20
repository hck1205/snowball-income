/**
 * OAuth 콜백 파라미터 감지 — **순수 문자열 검사**(supabase 를 import 하지 않는다).
 *
 * 왜 필요한가:
 *   OAuth 로그인을 마치면 브라우저는 `redirectTo`(현재 페이지)로 **풀 리로드**되며 돌아온다.
 *   PKCE 성공은 쿼리의 `?code=...`, 암묵적(implicit) 흐름은 해시의 `#access_token=...`,
 *   사용자 거부/오류는 `error*` 로 실린다. supabase-js 는 클라이언트 생성 시점에 이 URL 을
 *   읽어 코드를 세션으로 교환한다(detectSessionInUrl).
 *
 *   문제는 커뮤니티 라우트가 `React.lazy` 라는 것이다. `/community?code=...` 로 돌아오면
 *   lazy 청크 + supabase-js 동적 import 가 로드될 때까지 `CommunityAuthProvider` 가
 *   마운트되지 않아 클라이언트 생성이 늦어진다. 메인(`/`)은 provider 가 eager 라 즉시
 *   교환되는데 커뮤니티만 이 지연을 탄다(관측된 증상: 메인은 로그인되고 커뮤니티는 안 됨).
 *
 *   그래서 앱 엔트리(`main.tsx`)에서 이 함수로 콜백을 감지해, **콜백일 때만** supabase 를
 *   당겨 코드 교환을 라우트/lazy 경계와 무관하게 즉시 시작한다.
 *
 * 파라미터 이름은 supabase-js GoTrueClient 의 콜백 판정(_isPKCECallback /
 * _isImplicitGrantCallback)이 쓰는 것을 그대로 따른다.
 *
 * 순수 함수라 `window` 에 의존하지 않는다(테스트 가능). 앞의 `?`/`#` 는 있어도 없어도 된다.
 * 오탐은 무해하다 — supabase 를 한 번 이르게 만들 뿐이고, 실제 콜백(코드+저장된 verifier)이
 * 아니면 교환 없이 기존 세션 복구로 끝난다. 게다가 이 앱은 `code`/`access_token`/`error` 라는
 * 쿼리 키를 쓰지 않는다(공유=share/sv, 갤러리=sort/q/qf).
 */

const CALLBACK_KEYS = ['code', 'access_token', 'error', 'error_description', 'error_code'] as const;

const stripLeading = (value: string, prefix: string): string =>
  value.startsWith(prefix) ? value.slice(prefix.length) : value;

const hasAnyCallbackKey = (raw: string, leading: string): boolean => {
  const params = new URLSearchParams(stripLeading(raw, leading));
  return CALLBACK_KEYS.some((key) => params.has(key));
};

/**
 * `location.search` / `location.hash` 에 OAuth 콜백 파라미터가 있는지.
 * (둘 중 어느 쪽에 있어도 true — PKCE 는 쿼리, implicit 는 해시)
 */
export const hasOAuthCallbackParams = (search: string, hash: string): boolean =>
  hasAnyCallbackKey(search ?? '', '?') || hasAnyCallbackKey(hash ?? '', '#');

/**
 * 로그인 시작 시 넘길 `redirectTo` 를 정규화한다(순수 — window 비의존, 테스트 가능).
 *
 * 왜: 로그인을 마치고 돌아오면 URL 에 **잔여 해시**가 남을 수 있다(implicit 토큰 정리 후의 빈 `#`,
 * 또는 supabase 가 걷어내다 남긴 `#`). 다음 로그인에서 `redirectTo = location.href` 로 그 `#` 를
 * 그대로 넘기면, 프로바이더가 콜백을 `?code=` 로 덧붙일 때 URL 이 `…/#?code=…` 처럼 어긋나
 * supabase 가 코드를 못 읽어 **재로그인이 조용히 실패**한다(로그인→로그아웃→재로그인 안 됨).
 * 그래서:
 *   - **해시를 통째로 제거**(BrowserRouter 라 해시는 라우팅에 안 쓰인다).
 *   - 쿼리의 OAuth 콜백 키(code/access_token/error*)를 제거(직전 실패의 error 잔재가 새는 것 방지).
 * 앱 고유 파라미터(share/s/sort/q/qf 등)는 **보존**한다.
 */
export const sanitizeOAuthRedirectTo = (href: string): string => {
  try {
    const url = new URL(href);
    url.hash = '';
    for (const key of CALLBACK_KEYS) url.searchParams.delete(key);
    return url.toString();
  } catch {
    return href; // 파싱 불가(비정상 입력) → 원본 그대로(안전 실패)
  }
};

/**
 * 프로바이더/GoTrue 가 URL 에 실어보낸 **오류**를 읽는다(순수).
 *
 * 왜 필요한가: supabase-js 는 콜백에서 오류를 만나면 `_initialize()` 안에서 조용히 삼킨다
 * (`_getSessionFromURL` 이 throw → `_initialize` 가 error 를 반환하지만 **아무도 그 반환값을 읽지 않는다** —
 * 클라이언트는 생성자에서 초기화되므로 호출부에 error 가 전달되는 경로 자체가 없다). 그 결과 사용자는
 * "그냥 로그인이 안 되네"만 본다. 우리가 URL 을 직접 읽어야 실패를 표면화할 수 있다.
 *
 * 암묵적(implicit) 흐름은 오류도 **해시**에 실린다(`#error=access_denied&error_code=...`).
 * 프로바이더가 쿼리로 붙이는 경우도 있어 둘 다 본다(쿼리 우선).
 */
export const readOAuthCallbackError = (
  search: string,
  hash: string
): { code: string; description: string } | null => {
  const fromQuery = new URLSearchParams(stripLeading(search ?? '', '?'));
  const fromHash = new URLSearchParams(stripLeading(hash ?? '', '#'));
  const pick = (key: string): string | null => fromQuery.get(key) ?? fromHash.get(key);

  const error = pick('error');
  const code = pick('error_code');
  const description = pick('error_description');
  if (!error && !code && !description) return null;

  return {
    // GA 카디널리티를 위해 error_code(저카디널리티) 를 우선 쓴다. 둘 다 없으면 'unspecified'.
    code: code ?? error ?? 'unspecified',
    description: description ?? error ?? ''
  };
};
