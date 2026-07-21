import { getSupabaseClient } from './client';
import { hasOAuthCallbackParams, readOAuthCallbackError, sanitizeOAuthRedirectTo } from './oauthCallback';

/**
 * OAuth 콜백 **착지 판정**과 실패 기록 — "돌아왔는데 로그인이 안 된" 상태를 무음으로 두지 않기 위한 층.
 *
 * ## 왜 이 파일이 필요한가 (프로덕션 장애: iOS 카카오 로그인 무한 루프)
 *
 * supabase-js 는 클라이언트를 만들 때 `_initialize()` 에서 URL 의 콜백 파라미터를 세션으로 바꾼다.
 * 문제는 **실패가 어디로도 전달되지 않는다**는 것이다:
 *
 *   1. `_initialize()` 는 생성자에서 호출되고 그 반환값을 읽는 호출부가 없다 → 오류가 증발한다.
 *   2. 성공 경로에서만 URL 을 청소한다(implicit 은 `window.location.hash=''`, pkce 는 `code` 삭제).
 *      **실패하면 콜백 파라미터가 URL 에 그대로 남는다** → 새로고침할 때마다 같은 콜백을 다시 처리하고
 *      다시 실패한다(자동 반복). 사용자에겐 "로그인이 계속 안 되는" 루프로 보인다.
 *
 * 그래서 여기서 **직접** 판정한다: 콜백 파라미터가 있었는데 `getSession()` 이 null 이면 실패다.
 * (`getSession()` 은 내부적으로 `initializePromise` 를 await 하므로 교환이 끝난 뒤의 값이 보장된다.)
 *
 * ## 실패 기록을 왜 localStorage 에 두나
 *
 * 전환 귀속 마커(`writeLoginSource`)는 sessionStorage 라 **브라우징 컨텍스트가 바뀌면 사라진다**.
 * 실패 안내는 사용자가 다음에 로그인 모달을 열 때까지 살아 있어야 하고, 새 탭에서 열어도 보여야 한다.
 * 대신 로그인이 성공하면 즉시 지운다(오래된 경고가 남지 않게).
 */

/** 실패 사유 — GA 파라미터로도 나간다(저카디널리티 라벨). */
export type OAuthFailureReason =
  /** 프로바이더/GoTrue 가 error 를 실어 되돌렸다(동의 거부, 2단계 인증 실패 등). */
  | 'provider_error'
  /** 콜백 파라미터는 왔는데 세션이 만들어지지 않았다(교환 실패, 저장소 컨텍스트 불일치 등). */
  | 'no_session'
  /** 커뮤니티 비활성/SDK 로드 실패 — 애초에 교환할 클라이언트가 없었다. */
  | 'client_unavailable';

/**
 * 인앱 브라우저 종류. **이 장애의 핵심 변수**라 실패 기록·계측·안내에 모두 싣는다.
 * 인앱 브라우저(WKWebView)는 Safari/Chrome 과 **저장소가 분리**돼 있어, 거기서 세션이 만들어져도
 * 사용자가 원래 쓰던 브라우저에는 로그인이 남지 않는다.
 */
export type InAppBrowser = 'kakaotalk' | 'naver' | 'line' | 'instagram' | 'facebook' | 'none';

export type OAuthLoginFailure = {
  /** 로그인을 시작한 프로바이더. 마커가 유실됐으면 'unknown'. */
  provider: string;
  reason: OAuthFailureReason;
  /** 같은 프로바이더로 연속 실패한 횟수(1부터). 안전장치(안내 승격)의 기준. */
  attempts: number;
  inAppBrowser: InAppBrowser;
  /**
   * 로그인 시작 마커(sessionStorage)가 착지 시점에 없었다 = **로그인을 시작한 브라우징 컨텍스트와
   * 콜백이 착지한 컨텍스트가 다르다**. 인앱 브라우저 가로채기의 직접 증거다.
   */
  contextSwitched: boolean;
  /** 프로바이더가 실은 error_code(있을 때만). */
  errorCode?: string;
};

const FAILURE_STORAGE_KEY = 'snowball:oauth-login-failure';

/** 연속 실패가 이 횟수 이상이면 UI 가 "재시도해도 같다"는 쪽으로 안내를 승격한다. */
export const OAUTH_FAILURE_ESCALATION_THRESHOLD = 2;

// ── 순수 함수 ────────────────────────────────────────────────────────────────

/**
 * userAgent 에서 인앱 브라우저를 판정한다(순수).
 *
 * 각 앱이 UA 에 심는 토큰:
 *   - 카카오톡: `... KAKAOTALK 10.5.0`
 *   - 네이버앱: `... NAVER(inapp; search; ...)`
 *   - 라인:     `... Line/12.0.0`
 *   - 인스타:   `... Instagram 300.0.0`
 *   - 페이스북: `... FBAN/FBIOS;` 또는 `FBAV/`
 * 모두 대소문자 편차가 있어 소문자로 낮춰 비교한다.
 */
export const detectInAppBrowser = (userAgent: string): InAppBrowser => {
  const ua = (userAgent ?? '').toLowerCase();
  if (ua.includes('kakaotalk')) return 'kakaotalk';
  if (ua.includes('naver(inapp')) return 'naver';
  if (ua.includes('line/') || ua.includes('line(')) return 'line';
  if (ua.includes('instagram')) return 'instagram';
  if (ua.includes('fban/') || ua.includes('fbav/')) return 'facebook';
  return 'none';
};

/**
 * 카카오톡 인앱 브라우저를 기기 기본 브라우저로 탈출시키는 딥링크를 만든다(순수).
 * 카카오 공식 스킴 `kakaotalk://web/openExternal?url=<encoded>` 는 현재 페이지를 Safari·Chrome 에서
 * 다시 연다. ⚠ 반드시 **사용자 클릭**으로만 발동할 것 — iOS 는 프로그램적 자동 탈출을 막아 두었다.
 */
export const buildKakaoOpenExternalUrl = (currentHref: string): string =>
  `kakaotalk://web/openExternal?url=${encodeURIComponent(currentHref)}`;

/**
 * 사용자에게 어떤 안내를 보일지 고른다(순수 — copy 를 import 하지 않고 **분류만** 돌려준다).
 *
 * 'in-app-browser': 인앱 브라우저 저장소 분리가 원인으로 강하게 의심되는 경우. UA 가 카카오톡 등으로
 *   잡혔거나, 세션이 안 생겼는데(no_session) 컨텍스트가 바뀌었거나 연속 실패가 누적된 경우.
 *   이 케이스는 **같은 버튼을 다시 눌러도 같은 실패**라, 재시도 대신 "다른 브라우저로 열기"를 안내한다.
 * 'generic': 프로바이더 오류/취소 등 재시도로 풀릴 수 있는 경우.
 *
 * ⚠ `provider_error`(동의 거부 등)는 인앱 여부와 무관하게 generic 으로 둔다 — 브라우저를 바꾼다고
 *   안 풀리는데 "다른 브라우저로 열라"고 하면 틀린 안내다. 인앱 가설의 지문은 어디까지나 `no_session` 이다.
 */
export const selectOAuthFailureGuidance = (failure: OAuthLoginFailure): 'in-app-browser' | 'generic' => {
  if (failure.inAppBrowser !== 'none') return 'in-app-browser';
  if (failure.reason === 'no_session' && (failure.contextSwitched || failure.attempts >= OAUTH_FAILURE_ESCALATION_THRESHOLD)) {
    return 'in-app-browser';
  }
  return 'generic';
};

const isFailureReason = (value: unknown): value is OAuthFailureReason =>
  value === 'provider_error' || value === 'no_session' || value === 'client_unavailable';

const isInAppBrowser = (value: unknown): value is InAppBrowser =>
  value === 'kakaotalk' ||
  value === 'naver' ||
  value === 'line' ||
  value === 'instagram' ||
  value === 'facebook' ||
  value === 'none';

/**
 * 저장된 실패 기록을 판독한다(순수). 형태가 조금이라도 어긋나면 null —
 * 안내는 부가 기능이라 **깨진 기록 때문에 로그인 흐름이 막히면 안 된다**.
 */
export const parseOAuthLoginFailure = (raw: string | null): OAuthLoginFailure | null => {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const record = parsed as Record<string, unknown>;
    if (typeof record.provider !== 'string') return null;
    if (!isFailureReason(record.reason)) return null;
    if (typeof record.attempts !== 'number' || !Number.isFinite(record.attempts) || record.attempts < 1) return null;

    return {
      provider: record.provider,
      reason: record.reason,
      attempts: Math.floor(record.attempts),
      // 아래 둘은 나중에 추가된 필드라 **기본값 있는 optional 로 읽는다**(구 기록도 계속 열려야 한다).
      inAppBrowser: isInAppBrowser(record.inAppBrowser) ? record.inAppBrowser : 'none',
      contextSwitched: record.contextSwitched === true,
      ...(typeof record.errorCode === 'string' ? { errorCode: record.errorCode } : {})
    };
  } catch {
    return null;
  }
};

/**
 * 다음 실패 기록을 만든다(순수). **같은 프로바이더로 연속 실패하면 attempts 를 누적**하고,
 * 프로바이더가 바뀌면 1로 리셋한다(구글 실패 뒤 카카오 실패를 "2연속"으로 세면 안내가 틀린다).
 */
export const buildNextOAuthLoginFailure = (
  previous: OAuthLoginFailure | null,
  incoming: Omit<OAuthLoginFailure, 'attempts'>
): OAuthLoginFailure => ({
  ...incoming,
  attempts: previous && previous.provider === incoming.provider ? previous.attempts + 1 : 1
});

// ── 저장소 seam ──────────────────────────────────────────────────────────────

const safeLocal = (): Storage | null => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null; // 사생활 보호 모드 등
  }
};

export const readOAuthLoginFailure = (): OAuthLoginFailure | null => {
  try {
    return parseOAuthLoginFailure(safeLocal()?.getItem(FAILURE_STORAGE_KEY) ?? null);
  } catch {
    return null;
  }
};

export const clearOAuthLoginFailure = (): void => {
  try {
    safeLocal()?.removeItem(FAILURE_STORAGE_KEY);
  } catch {
    /* noop — 안내 정리 실패는 무해하다 */
  }
};

/** 실패를 누적 기록하고 확정된 기록을 돌려준다(계측용). */
export const recordOAuthLoginFailure = (incoming: Omit<OAuthLoginFailure, 'attempts'>): OAuthLoginFailure => {
  const next = buildNextOAuthLoginFailure(readOAuthLoginFailure(), incoming);
  try {
    safeLocal()?.setItem(FAILURE_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* noop — 저장 못 해도 이번 회차 안내(반환값)는 그대로 쓴다 */
  }
  return next;
};

// ── 콜백 착지 판정 ───────────────────────────────────────────────────────────

export type OAuthCallbackOutcome =
  | { status: 'success' }
  | { status: 'failed'; failure: OAuthLoginFailure }
  /** 콜백 파라미터가 없었다 — 일반 방문. */
  | { status: 'not-a-callback' };

/**
 * 콜백 파라미터를 URL 에서 **반드시** 걷어낸다.
 *
 * 이것이 자동 반복(무한 루프)을 끊는 지점이다 — 실패한 콜백이 URL 에 남아 있으면 새로고침·뒤로가기마다
 * supabase 가 같은 코드로 다시 교환을 시도하고 다시 실패한다. `sanitizeOAuthRedirectTo` 는 해시를 통째로
 * 비우고 쿼리의 콜백 키만 지우므로(앱 파라미터 share/s/sort 등은 보존) 그대로 재사용한다.
 */
const stripCallbackFromUrl = (): void => {
  if (typeof window === 'undefined') return;
  const cleaned = sanitizeOAuthRedirectTo(window.location.href);
  if (cleaned === window.location.href) return;
  try {
    window.history.replaceState(window.history.state, '', cleaned);
  } catch {
    /* noop */
  }
};

/**
 * 엔트리(main.tsx)에서 부팅 직후 1회 호출한다. 콜백으로 돌아왔는지 판정하고,
 * **세션이 실제로 생겼는지까지 확인**한 뒤 결과를 돌려준다. 계측·UI 는 호출부의 몫이다
 * (이 모듈이 analytics 를 import 하면 supabase 레이어가 계측에 결합된다).
 *
 * @param startedProvider 로그인 시작 시 심어둔 마커(sessionStorage). 없으면 null —
 *   그 자체가 "다른 브라우징 컨텍스트에 착지했다"는 신호라 `contextSwitched` 로 기록된다.
 */
export const finalizeOAuthCallback = async (startedProvider: string | null): Promise<OAuthCallbackOutcome> => {
  if (typeof window === 'undefined') return { status: 'not-a-callback' };

  const { search, hash } = window.location;
  if (!hasOAuthCallbackParams(search, hash)) return { status: 'not-a-callback' };

  const urlError = readOAuthCallbackError(search, hash);
  const context = {
    provider: startedProvider ?? 'unknown',
    inAppBrowser: detectInAppBrowser(window.navigator?.userAgent ?? ''),
    contextSwitched: startedProvider === null
  };

  const fail = (reason: OAuthFailureReason): OAuthCallbackOutcome => {
    stripCallbackFromUrl();
    return {
      status: 'failed',
      failure: recordOAuthLoginFailure({
        ...context,
        reason,
        ...(urlError ? { errorCode: urlError.code } : {})
      })
    };
  };

  const client = await getSupabaseClient();
  // 커뮤니티 비활성(백엔드 없는 배포)이면 애초에 콜백이 올 수 없다 — 오탐이므로 조용히 정리만 한다.
  if (!client) {
    stripCallbackFromUrl();
    return { status: 'not-a-callback' };
  }

  // getSession() 이 initializePromise 를 await 하므로, 이 시점의 값은 "교환이 끝난 뒤"의 결과다.
  let session = null;
  try {
    const { data } = await client.auth.getSession();
    session = data.session;
  } catch {
    return fail('client_unavailable');
  }

  if (!session) return fail(urlError ? 'provider_error' : 'no_session');

  clearOAuthLoginFailure();
  // 성공 시에도 잔여 해시/쿼리를 정리한다(supabase 는 implicit 에서 `hash=''` 만 해 빈 `#` 가 남는다 —
  // 그게 다음 로그인의 redirectTo 로 새면 콜백 URL 이 `…/#?code=…` 로 어긋난다).
  stripCallbackFromUrl();
  return { status: 'success' };
};
