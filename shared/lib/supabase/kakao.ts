import { getSupabaseClient, isCommunityEnabled } from './client';

/**
 * 카카오 로그인 **클라이언트 seam** — UI(SocialLoginButton/LoginModal)가 소비하는 진입점.
 *
 * ## 왜 커스텀 플로우인가 (카카오는 Supabase 기본 프로바이더인데)
 * Supabase 기본 카카오 경로는 GoTrue 의 자동 identity 링크 때문에 **같은 이메일의 구글 계정과 한
 * 계정으로 병합**된다(2026-07-24 실측). 카카오 콘솔의 이메일 선택동의가 켜져 있으면 scope 에서 빼도
 * 이메일이 넘어오기 때문이라 코드로는 못 막는다. 그래서 **네이버와 동일한 완전 분리 구조**로 간다 —
 * 카카오 id 기반 합성 이메일 find-or-create(서버 `/api/kakao-auth`). 상세는
 * `shared/lib/community/kakaoAuth.ts` 상단 주석.
 *
 * 흐름(네이버와 동형):
 *   1) startKakaoLogin: state(CSRF) 발급 → 카카오 authorize 로 풀 리다이렉트.
 *   2) 카카오가 redirect_uri(KAKAO_CALLBACK_PATH)로 `?code=&state=` 을 붙여 되돌린다.
 *   3) completeKakaoCallback(main.tsx 엔트리): state 대조 → 서버(/api/kakao-auth)에 code POST →
 *      돌려받은 token_hash 로 verifyOtp → Supabase 세션 확립 → returnTo 로 이동.
 *   이후는 기존 흐름에 합류한다 — verifyOtp 가 세션을 localStorage 에 저장하므로, 이동한 페이지에서
 *   CommunityAuthProvider 의 getSession()/onAuthStateChange 가 그대로 로그인 상태를 집어든다.
 *
 * ⚠ client_secret 은 여기 없다. 이 파일은 **공개값**만 다룬다(REST API 키는 authorize URL 에 실려
 *   브라우저로 나가는 공개값이라 VITE_ 로 노출해도 된다). 비밀 교환은 전부 서버(/api/kakao-auth).
 */

/** 카카오가 인가코드를 되돌릴 SPA 경로. 카카오 개발자 콘솔의 Redirect URI 는 `<origin>` + 이 경로다. */
export const KAKAO_CALLBACK_PATH = '/community/auth/kakao/callback';

/** 로그인 성공/실패 후 기본 복귀 지점. returnTo 가 없을 때. */
const DEFAULT_RETURN_TO = '/community';

/** 우리 서버 엔드포인트(같은 도메인). */
const KAKAO_AUTH_ENDPOINT = '/api/kakao-auth';

const STATE_STORAGE_KEY = 'snowball:kakao_oauth_state';
const RETURN_TO_STORAGE_KEY = 'snowball:kakao_return_to';

/** 로그인 시 요청하는 동의항목. 닉네임만 — 이메일·프로필사진은 받지 않는다(계정 병합·avatar 사고 방지). */
const KAKAO_SCOPE = 'profile_nickname';

/** 실패를 사용자에게 보이게 하는 쿼리 플래그(무음 실패 금지). 콜백 실패 시 returnTo 에 붙여 보낸다. */
export const KAKAO_LOGIN_ERROR_PARAM = 'kakaoLogin';
const KAKAO_LOGIN_ERROR_VALUE = 'failed';

/**
 * 실패 **사유** 파라미터(진단용). 사용자 카피는 이 값으로 갈리지 않는다 — 안내는 하나뿐이고,
 * 이건 "어느 단계에서 깨졌나"를 사람이 읽을 수 있게 URL 에 남기는 용도다.
 */
const KAKAO_LOGIN_REASON_PARAM = 'kakaoLoginReason';

/**
 * 공개 client_id(REST API 키)를 환경변수 소스에서 읽는다(순수 — 주입받아 테스트 가능).
 * client.ts 의 readCommunityEnv / naver.ts 의 readNaverClientId 와 같은 규약.
 */
export const readKakaoClientId = (source: Record<string, unknown>): string | null => {
  const value = source['VITE_KAKAO_CLIENT_ID'];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const KAKAO_CLIENT_ID = readKakaoClientId(import.meta.env as unknown as Record<string, unknown>);

/**
 * **폴백 게이트** — 커스텀 카카오 플로우를 탈지 여부.
 *
 * false 면 `signInWithOAuth` 는 가로채지 않고 **기존 Supabase 카카오 플로우**로 그대로 간다.
 * env(`VITE_KAKAO_CLIENT_ID`)를 아직 안 넣은 배포/프리뷰에서 로그인이 죽으면 안 되기 때문이다
 * (네이버처럼 버튼을 '준비 중'으로 만들면 안 된다 — 카카오는 이미 동작하던 로그인이다).
 * 커뮤니티가 꺼져 있으면(Supabase 세션 발급 불가) 당연히 false.
 */
export const isKakaoCustomAuthEnabled: boolean = isCommunityEnabled && KAKAO_CLIENT_ID !== null;

/** 카카오 authorize URL(순수). response_type=code + state(CSRF) + scope. */
export const buildKakaoAuthorizeUrl = (clientId: string, redirectUri: string, state: string): string => {
  const url = new URL('https://kauth.kakao.com/oauth/authorize');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);
  url.searchParams.set('scope', KAKAO_SCOPE);
  return url.toString();
};

/** 콜백 경로인지(순수). main.tsx 가 supabase 표준 콜백과 구분하려고 쓴다. */
export const isKakaoCallbackPath = (pathname: string): boolean => pathname === KAKAO_CALLBACK_PATH;

/** 콜백 쿼리에서 code/state 를 추린다(순수). 둘 다 있어야 유효, 아니면 null. */
export const readKakaoCallbackParams = (search: string): { code: string; state: string } | null => {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const code = params.get('code');
  const state = params.get('state');
  if (!code || !state) return null;
  return { code, state };
};

/**
 * returnTo 에 실패 플래그를 붙인다(순수). UI 가 readKakaoLoginError 로 감지해 안내를 띄운다.
 *
 * `reason` 을 주면 `kakaoLoginReason` 파라미터로 **URL 에 남긴다.** 콘솔 로그만으로는 진단이 안 되기
 * 때문이다 — 실패 직후 `location.replace` 로 페이지가 넘어가면서 콘솔이 지워져(Preserve log 를 켜지
 * 않는 한) 사유가 사라진다. URL 에 있으면 사용자가 주소창을 그대로 읽어 알려줄 수 있다.
 * 담기는 값은 **사유 코드뿐**이다 — 토큰·비밀값은 절대 싣지 않는다.
 */
export const appendKakaoLoginError = (returnTo: string, reason?: string): string => {
  const [path, existing = ''] = returnTo.split('?');
  const params = new URLSearchParams(existing);
  params.set(KAKAO_LOGIN_ERROR_PARAM, KAKAO_LOGIN_ERROR_VALUE);
  if (reason) params.set(KAKAO_LOGIN_REASON_PARAM, reason);
  return `${path}?${params.toString()}`;
};

/** URL 에 남은 실패 사유(순수). 진단용 — 없으면 null. */
export const readKakaoLoginReason = (search: string): string | null => {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return params.get(KAKAO_LOGIN_REASON_PARAM);
};

/** returnTo 로 온 URL 에 카카오 로그인 실패 플래그가 있는지(순수). UI 소비용. */
export const readKakaoLoginError = (search: string): boolean => {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return params.get(KAKAO_LOGIN_ERROR_PARAM) === KAKAO_LOGIN_ERROR_VALUE;
};

/**
 * 실패 플래그를 URL 에서 걷어낸다(순수 — appendKakaoLoginError 의 역). **kakaoLogin 만** 지우고
 * share/sv·정렬·검색 등 다른 파라미터는 보존한다(stripNaverLoginError 와 같은 규약, 대상만 다름).
 * UI 가 에러 안내를 닫은 뒤 history.replaceState 로 호출해 새로고침·공유 시 에러가 되살아나지 않게 한다.
 */
export const stripKakaoLoginError = (href: string): string => {
  const url = new URL(href);
  url.searchParams.delete(KAKAO_LOGIN_ERROR_PARAM);
  url.searchParams.delete(KAKAO_LOGIN_REASON_PARAM);
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
 * 카카오 로그인 시작 — authorize 로 풀 리다이렉트.
 * (signInWithOAuth(client,'kakao')가 **커스텀 게이트가 켜진 경우에만** 이걸 호출한다 — auth.ts 의 분기)
 *
 * returnTo: 로그인 후 돌아올 곳. 미지정 시 현재 경로.
 */
export const startKakaoLogin = (returnTo?: string): void => {
  if (typeof window === 'undefined' || !KAKAO_CLIENT_ID) return;
  const target = returnTo ?? `${window.location.pathname}${window.location.search}`;
  const state = persistLoginState(target);
  const redirectUri = `${window.location.origin}${KAKAO_CALLBACK_PATH}`;
  window.location.assign(buildKakaoAuthorizeUrl(KAKAO_CLIENT_ID, redirectUri, state));
};

/**
 * 실패 사유 — **단계별로 구분한다.**
 *
 * 처음엔 모든 실패를 하나로 뭉개 `?kakaoLogin=failed` 만 남겼는데, 실사용에서 재로그인이 실패했을 때
 * state 불일치인지·카카오 코드 교환 실패인지·세션 발급 실패인지·verifyOtp 실패인지 **구분할 방법이
 * 없어 원인을 못 짚었다**. 사용자에게 보이는 카피는 하나로 뭉뚱그리더라도 내부적으로는 갈라 둔다.
 */
export type KakaoLoginFailureReason =
  /** 콜백 파라미터 없음 / state 불일치 · 부재(재진입·CSRF 의심 포함). */
  | 'state_mismatch'
  /** 커뮤니티 비활성 등으로 supabase 클라이언트를 못 만들었다. */
  | 'client_unavailable'
  /** 서버가 4xx/5xx — 세부 코드는 `serverCode` 로 따라온다. */
  | 'server_error'
  /** 서버는 200 인데 token_hash 가 비어 있다. */
  | 'no_token'
  /** token_hash 로 세션 확립 실패(만료·이미 사용·형식 오류). */
  | 'verify_failed'
  /** 위 어디에도 안 잡힌 예외(네트워크 등). */
  | 'unknown';

/** 서버 응답 본문의 `error` 코드를 그대로 실어 나른다(`kakao_exchange_failed` 등). 비밀값은 담기지 않는다. */
type KakaoSessionResult = { ok: true; tokenHash: string } | { ok: false; reason: KakaoLoginFailureReason; serverCode?: string };

/** 서버에 code 를 POST 해 magiclink token_hash 를 받는다. 실패를 **사유와 함께** 돌려준다(throw 하지 않는다). */
const requestKakaoSession = async (code: string, state: string): Promise<KakaoSessionResult> => {
  const res = await fetch(KAKAO_AUTH_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code, state })
  });

  const data = (await res.json().catch(() => null)) as { token_hash?: unknown; error?: unknown } | null;

  if (!res.ok) {
    const serverCode = typeof data?.error === 'string' ? data.error : `http_${res.status}`;
    return { ok: false, reason: 'server_error', serverCode };
  }

  const tokenHash = typeof data?.token_hash === 'string' ? data.token_hash : '';
  return tokenHash ? { ok: true, tokenHash } : { ok: false, reason: 'no_token' };
};

/**
 * 콜백 완료 — 엔트리(main.tsx)에서 호출한다. 항상 returnTo(성공) 또는 returnTo+실패플래그로
 * `location.replace` 한다(사용자를 콜백 화면에 가두지 않는다).
 *
 * ⚠ URL 의 code/state 는 supabase-js 클라이언트를 만들기 **전에** 제거한다 — detectSessionInUrl 이
 *   카카오 `code` 를 자기 콜백 파라미터로 오인해 삼키지 못하게(교환 실패 + URL 스트립 레이스 회피).
 */
export const completeKakaoCallback = async (): Promise<void> => {
  const params = readKakaoCallbackParams(window.location.search);
  const returnTo = consumeReturnTo();
  const expectedState = consumeStoredState();

  // supabase 클라이언트 생성 전에 콜백 파라미터를 URL 에서 걷어낸다.
  window.history.replaceState({}, '', KAKAO_CALLBACK_PATH);

  /**
   * 실패를 **관측 가능하게** 남기고 돌려보낸다.
   *
   * 사용자에게는 기존과 같은 하나의 실패 배너를 보여주되(카피 이중화 금지), 원인은
   * `login_failed` 계측과 개발 콘솔에 남겨 다음에 같은 일이 나면 단계를 짚을 수 있게 한다.
   * ⚠ 여기 실리는 값은 사유 코드뿐이다 — access_token·token_hash 는 절대 담지 않는다.
   */
  const fail = (reason: KakaoLoginFailureReason, serverCode?: string) => {
    void import('@/shared/lib/analytics').then(({ ANALYTICS_EVENT, trackEvent }) => {
      trackEvent(ANALYTICS_EVENT.LOGIN_FAILED, {
        provider: 'kakao',
        reason: 'provider_error',
        in_app_browser: 'unknown',
        context_switched: false,
        attempts: 1,
        error_code: serverCode ? `${reason}:${serverCode}` : reason
      });
    });
    const detail = serverCode ? `${reason}:${serverCode}` : reason;
    if (import.meta.env?.DEV) {
      console.error('[kakao-login] 실패', detail);
    }
    // 사유를 URL 에 실어 보낸다 — 리다이렉트로 콘솔이 지워져도 주소창에 남아 진단할 수 있다.
    window.location.replace(appendKakaoLoginError(returnTo, detail));
  };

  if (!params || !expectedState || params.state !== expectedState) {
    fail('state_mismatch');
    return;
  }

  try {
    const client = await getSupabaseClient();
    if (!client) {
      fail('client_unavailable');
      return;
    }

    const session = await requestKakaoSession(params.code, params.state);
    if (!session.ok) {
      fail(session.reason, session.serverCode);
      return;
    }

    const { error } = await client.auth.verifyOtp({ token_hash: session.tokenHash, type: 'magiclink' });
    if (error) {
      fail('verify_failed', error.message);
      return;
    }
    window.location.replace(returnTo);
  } catch {
    fail('unknown');
  }
};
