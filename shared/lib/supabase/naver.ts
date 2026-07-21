import { getSupabaseClient, isCommunityEnabled } from './client';

/**
 * 네이버 로그인 **클라이언트 seam** — UI(SocialLoginButton/LoginModal)가 소비하는 진입점.
 *
 * 네이버는 Supabase 기본 프로바이더가 아니라서 구글·카카오와 경로가 다르다:
 *   1) startNaverLogin: state(CSRF) 발급 → 네이버 authorize 로 풀 리다이렉트.
 *   2) 네이버가 redirect_uri(NAVER_CALLBACK_PATH)로 `?code=&state=` 을 붙여 되돌린다.
 *   3) completeNaverCallback(main.tsx 엔트리): state 대조 → 서버(/api/naver-auth)에 code POST →
 *      돌려받은 token_hash 로 verifyOtp → Supabase 세션 확립 → returnTo 로 이동.
 *   이후는 기존 흐름에 합류한다 — verifyOtp 가 세션을 localStorage 에 저장하므로, 이동한 페이지에서
 *   CommunityAuthProvider 의 getSession()/onAuthStateChange 가 그대로 로그인 상태를 집어든다.
 *
 * ⚠ client_secret 은 여기 없다. 이 파일은 **공개값**만 다룬다(client_id 는 authorize URL 에 실려
 *   브라우저로 나가는 공개값이라 VITE_ 로 노출해도 된다). 비밀 교환은 전부 서버(/api/naver-auth).
 */

/** 네이버가 인가코드를 되돌릴 SPA 경로. 네이버 개발자센터의 Callback URL 은 `<origin>` + 이 경로다. */
export const NAVER_CALLBACK_PATH = '/community/auth/naver/callback';

/** 로그인 성공/실패 후 기본 복귀 지점. returnTo 가 없을 때. */
const DEFAULT_RETURN_TO = '/community';

/** 우리 서버 엔드포인트(같은 도메인). */
const NAVER_AUTH_ENDPOINT = '/api/naver-auth';

const STATE_STORAGE_KEY = 'snowball:naver_oauth_state';
const RETURN_TO_STORAGE_KEY = 'snowball:naver_return_to';

/** 실패를 사용자에게 보이게 하는 쿼리 플래그(무음 실패 금지). 콜백 실패 시 returnTo 에 붙여 보낸다. */
export const NAVER_LOGIN_ERROR_PARAM = 'naverLogin';
const NAVER_LOGIN_ERROR_VALUE = 'failed';

/**
 * 공개 client_id 를 환경변수 소스에서 읽는다(순수 — 주입받아 테스트 가능).
 * client.ts 의 readCommunityEnv 와 같은 규약(문자열·trim·비어있지 않음).
 */
export const readNaverClientId = (source: Record<string, unknown>): string | null => {
  const value = source['VITE_NAVER_CLIENT_ID'];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const NAVER_CLIENT_ID = readNaverClientId(import.meta.env as unknown as Record<string, unknown>);

/**
 * UI 게이트 플래그. 네이버 로그인은 **Supabase 세션 발급이 전제**이므로 커뮤니티가 켜져 있어야 하고
 * (isCommunityEnabled) client_id 도 있어야 한다. 둘 중 하나라도 없으면 네이버 버튼은 '준비 중'으로 둔다.
 */
export const isNaverEnabled: boolean = isCommunityEnabled && NAVER_CLIENT_ID !== null;

/**
 * 네이버 로그인 UI 게이트. true 면 네이버 버튼을 '검수중'으로 노출하고 클릭을 무동작으로 막아,
 * 아직 authorize 가 승인되지 않은 기간에 사용자가 실패하는 로그인을 시도하지 않게 한다.
 *
 * **현재 값 `false`(2026-07-21)**: 네이버 재검수(사전검수) 제출을 위해 게이트를 내렸다. 리뷰어가
 * 실제로 네이버 로그인을 눌러 authorize→콜백 흐름을 캡처·시연할 수 있어야 하므로, 버튼이 '검수중'
 * pending 이 아니라 실제 `onSelectProvider('naver')` 로 동작해야 한다(구글·카카오와 동일 경로).
 * 상수는 향후 다시 검수 대기 상태로 되돌릴 수 있게 남겨 둔다 — 그때 이 값을 `true` 로 올린다.
 */
export const NAVER_UNDER_REVIEW = false;

/** 네이버 authorize URL(순수). response_type=code + state(CSRF). */
export const buildNaverAuthorizeUrl = (clientId: string, redirectUri: string, state: string): string => {
  const url = new URL('https://nid.naver.com/oauth2.0/authorize');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);
  return url.toString();
};

/** 콜백 경로인지(순수). main.tsx 가 supabase 표준 콜백과 구분하려고 쓴다. */
export const isNaverCallbackPath = (pathname: string): boolean => pathname === NAVER_CALLBACK_PATH;

/** 콜백 쿼리에서 code/state 를 추린다(순수). 둘 다 있어야 유효, 아니면 null. */
export const readNaverCallbackParams = (search: string): { code: string; state: string } | null => {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const code = params.get('code');
  const state = params.get('state');
  if (!code || !state) return null;
  return { code, state };
};

/** returnTo 에 실패 플래그를 붙인다(순수). UI 가 readNaverLoginError 로 감지해 안내를 띄운다. */
export const appendNaverLoginError = (returnTo: string): string => {
  const [path, existing = ''] = returnTo.split('?');
  const params = new URLSearchParams(existing);
  params.set(NAVER_LOGIN_ERROR_PARAM, NAVER_LOGIN_ERROR_VALUE);
  return `${path}?${params.toString()}`;
};

/** returnTo 로 온 URL 에 네이버 로그인 실패 플래그가 있는지(순수). UI 소비용. */
export const readNaverLoginError = (search: string): boolean => {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return params.get(NAVER_LOGIN_ERROR_PARAM) === NAVER_LOGIN_ERROR_VALUE;
};

/**
 * 실패 플래그를 URL 에서 걷어낸다(순수 — appendNaverLoginError 의 역). **naverLogin 만** 지우고
 * share/sv·정렬·검색 등 다른 파라미터는 보존한다(stripShareParams 와 같은 규약, 대상만 다름).
 * UI 가 에러 안내를 닫은 뒤 history.replaceState 로 호출해 새로고침·공유 시 에러가 되살아나지 않게 한다.
 */
export const stripNaverLoginError = (href: string): string => {
  const url = new URL(href);
  url.searchParams.delete(NAVER_LOGIN_ERROR_PARAM);
  return url.toString();
};

// ── 브라우저 상태(sessionStorage) 헬퍼 ─────────────────────────────────────────

const createState = (): string => {
  const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoObj.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  // 폴백(테스트 등 crypto 부재): 예측 가능하지만 CSRF 방어는 same-origin sessionStorage 비교가 담당.
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
};

const safeSession = (): Storage | null => {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null; // 사생활 보호 모드 등에서 접근 예외
  }
};

/** state + returnTo 를 저장하고 새 state 를 반환한다. */
const persistLoginState = (returnTo: string): string => {
  const state = createState();
  const store = safeSession();
  try {
    store?.setItem(STATE_STORAGE_KEY, state);
    store?.setItem(RETURN_TO_STORAGE_KEY, returnTo);
  } catch {
    // 저장 실패해도 authorize 는 진행 — 콜백에서 state 부재로 걸러진다(안전 실패).
  }
  return state;
};

/** 저장했던 state 를 읽고 즉시 지운다(1회용). */
const consumeStoredState = (): string | null => {
  const store = safeSession();
  const value = store?.getItem(STATE_STORAGE_KEY) ?? null;
  try {
    store?.removeItem(STATE_STORAGE_KEY);
  } catch {
    /* noop */
  }
  return value;
};

const consumeReturnTo = (): string => {
  const store = safeSession();
  const value = store?.getItem(RETURN_TO_STORAGE_KEY) ?? null;
  try {
    store?.removeItem(RETURN_TO_STORAGE_KEY);
  } catch {
    /* noop */
  }
  return value && value.startsWith('/') ? value : DEFAULT_RETURN_TO;
};

// ── 로그인 시작 / 콜백 완료 ────────────────────────────────────────────────────

/**
 * 네이버 로그인 시작 — authorize 로 풀 리다이렉트.
 * (signInWithOAuth(client,'naver')가 이걸 호출한다 — auth.ts 의 분기)
 *
 * returnTo: 로그인 후 돌아올 곳. 미지정 시 현재 경로.
 */
export const startNaverLogin = (returnTo?: string): void => {
  if (typeof window === 'undefined' || !NAVER_CLIENT_ID) return;
  const target = returnTo ?? `${window.location.pathname}${window.location.search}`;
  const state = persistLoginState(target);
  const redirectUri = `${window.location.origin}${NAVER_CALLBACK_PATH}`;
  window.location.assign(buildNaverAuthorizeUrl(NAVER_CLIENT_ID, redirectUri, state));
};

/** 서버에 code 를 POST 해 magiclink token_hash 를 받는다. 실패 시 throw. */
const requestNaverSession = async (code: string, state: string): Promise<string> => {
  const res = await fetch(NAVER_AUTH_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code, state })
  });
  if (!res.ok) throw new Error('naver_auth_server_error');
  const data = (await res.json().catch(() => null)) as { token_hash?: unknown } | null;
  const tokenHash = typeof data?.token_hash === 'string' ? data.token_hash : '';
  if (!tokenHash) throw new Error('naver_auth_no_token');
  return tokenHash;
};

/**
 * 콜백 완료 — 엔트리(main.tsx)에서 호출한다. 항상 returnTo(성공) 또는 returnTo+실패플래그로
 * `location.replace` 한다(사용자를 콜백 화면에 가두지 않는다).
 *
 * ⚠ URL 의 code/state 는 supabase-js 클라이언트를 만들기 **전에** 제거한다 — detectSessionInUrl 이
 *   네이버 `code` 를 PKCE 코드로 오인해 삼키지 못하게(교환 실패 + URL 스트립 레이스 회피).
 */
export const completeNaverCallback = async (): Promise<void> => {
  const params = readNaverCallbackParams(window.location.search);
  const returnTo = consumeReturnTo();
  const expectedState = consumeStoredState();

  // supabase 클라이언트 생성 전에 콜백 파라미터를 URL 에서 걷어낸다.
  window.history.replaceState({}, '', NAVER_CALLBACK_PATH);

  const fail = () => window.location.replace(appendNaverLoginError(returnTo));

  if (!params || !expectedState || params.state !== expectedState) {
    fail();
    return;
  }

  try {
    const client = await getSupabaseClient();
    if (!client) {
      fail();
      return;
    }
    const tokenHash = await requestNaverSession(params.code, params.state);
    const { error } = await client.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' });
    if (error) {
      fail();
      return;
    }
    window.location.replace(returnTo);
  } catch {
    fail();
  }
};
