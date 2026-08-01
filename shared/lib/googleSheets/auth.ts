/**
 * 구글 인증 — **GIS 토큰 클라이언트**(`google.accounts.oauth2.initTokenClient`).
 *
 * 🔴 액세스 토큰은 **메모리에만** 산다. localStorage·sessionStorage·쿠키·IndexedDB 어디에도 쓰지 않는다
 *    (탭을 닫으면 사라지는 것이 정상이고, 그게 이 설계의 안전 마진이다).
 * 🔴 수명을 하드코딩하지 않는다 — 응답의 `expires_in` 을 읽고, 없으면 "모른다"로 둔다.
 *    (통설의 1시간은 문서로 확인되지 않았다. 모르는 값을 지어내는 대신 401 을 받아 재요청한다.)
 * ⚠ **무음 갱신은 없다.** `prompt: ''` 도 팝업을 열 수 있어 사용자 제스처가 필요하다 — 그래서
 *    `requestAccessToken` 은 반드시 클릭 핸들러 안에서 호출해야 한다.
 *
 * Supabase `provider_token` 을 쓰지 않는 이유: ①Supabase 가 provider token 갱신을 관리하지 않는다고
 * 공식 문서가 명시하고 ②Supabase 세션은 localStorage 에 저장되어 "토큰은 메모리에만" 전제를 구조적으로
 * 깨며 ③이 앱은 카카오·네이버 로그인이 1급이라 그 경로는 사용자 절반을 배제한다.
 */
import { GOOGLE_SHEETS_SCOPE, getGoogleSheetsEnv } from './config';
import type { LedgerResult } from './types';
import { ledgerErr, ledgerOk, ledgerError } from './types';

/** GIS 스크립트 주소. 지연 로드한다 — 정적 `<script>` 는 초기 번들·요청 예산을 깬다. */
export const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

/** 만료 직전에 쓰다가 401 을 맞지 않도록 두는 여유(초). */
export const TOKEN_EXPIRY_SKEW_SECONDS = 30;

export type AccessToken = {
  readonly value: string;
  /** epoch ms. **모르면 `null`** — 수명을 지어내지 않는다. */
  readonly expiresAt: number | null;
};

/* ── 순수 부분 (fetch·DOM 없이 검증 가능) ───────────────────────────────────── */

/** 응답의 `scope` 에 우리가 요청한 스코프가 실제로 들어 있는지. 사용자가 체크를 해제할 수 있다. */
export const hasRequiredScope = (response: unknown): boolean => {
  if (!response || typeof response !== 'object') return false;
  const scope = (response as Record<string, unknown>).scope;
  if (typeof scope !== 'string') return false;
  return scope.split(/\s+/).includes(GOOGLE_SHEETS_SCOPE);
};

/**
 * GIS 토큰 응답 → `AccessToken`. `expires_in`(초)이 유한한 양수일 때만 만료 시각을 계산한다.
 * 값이 없거나 이상하면 `expiresAt: null`(= 만료를 모른다 → 쓰다가 401 이 오면 재요청).
 */
export const toAccessToken = (response: unknown, nowMs: number): AccessToken | null => {
  if (!response || typeof response !== 'object') return null;
  const record = response as Record<string, unknown>;
  const value = record.access_token;
  if (typeof value !== 'string' || value.trim().length === 0) return null;

  const expiresIn = record.expires_in;
  const seconds = typeof expiresIn === 'string' ? Number(expiresIn) : expiresIn;
  const usable = typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0;
  const expiresAt = usable ? nowMs + (seconds - TOKEN_EXPIRY_SKEW_SECONDS) * 1000 : null;

  return { value, expiresAt };
};

/** 지금 이 토큰을 써도 되는지. 만료를 모르면(`null`) 일단 쓴다 — 실패는 401 로 드러난다. */
export const isAccessTokenUsable = (token: AccessToken | null, nowMs: number): boolean => {
  if (!token || token.value.trim().length === 0) return false;
  if (token.expiresAt === null) return true;
  return token.expiresAt > nowMs;
};

/** 메모리 전용 토큰 보관소. 저장소를 주입하지 않는다 — 애초에 저장할 곳이 없다. */
export const createAccessTokenStore = (now: () => number) => {
  let current: AccessToken | null = null;
  return {
    read: (): AccessToken | null => (isAccessTokenUsable(current, now()) ? current : null),
    write: (token: AccessToken): void => {
      current = token;
    },
    clear: (): void => {
      current = null;
    }
  };
};

/* ── 브라우저 부분 ──────────────────────────────────────────────────────────── */

type TokenClient = {
  requestAccessToken: (overrides?: { prompt?: string }) => void;
  callback: (response: unknown) => void;
};

type GoogleIdentityNamespace = {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: unknown) => void;
        error_callback?: (error: unknown) => void;
      }) => TokenClient;
      revoke: (token: string, done?: () => void) => void;
    };
  };
};

const tokenStore = createAccessTokenStore(() => Date.now());

let scriptPromise: Promise<GoogleIdentityNamespace> | null = null;
let tokenClient: TokenClient | null = null;

const readGoogleNamespace = (): GoogleIdentityNamespace | null => {
  if (typeof window === 'undefined') return null;
  const candidate = (window as unknown as Record<string, unknown>).google;
  if (!candidate || typeof candidate !== 'object') return null;
  const accounts = (candidate as Record<string, unknown>).accounts;
  if (!accounts || typeof accounts !== 'object') return null;
  return candidate as GoogleIdentityNamespace;
};

/** 스크립트를 한 번만 넣고 프로미스를 메모이즈한다(`getSupabaseClient` 와 같은 패턴). */
export const loadGoogleIdentityServices = (): Promise<GoogleIdentityNamespace> => {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<GoogleIdentityNamespace>((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('브라우저 환경에서만 구글 인증을 초기화할 수 있습니다.'));
      return;
    }

    const existing = readGoogleNamespace();
    if (existing) {
      resolve(existing);
      return;
    }

    const script = document.createElement('script');
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const namespace = readGoogleNamespace();
      if (namespace) resolve(namespace);
      else reject(new Error('구글 인증 스크립트를 불러오지 못했습니다.'));
    };
    script.onerror = () => {
      reject(new Error('구글 인증 스크립트를 불러오지 못했습니다.'));
    };
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    // 실패한 프로미스를 메모이즈하면 영원히 재시도할 수 없다.
    scriptPromise = null;
    throw error;
  });

  return scriptPromise;
};

/** 이미 받아 둔 토큰(유효할 때만). 없으면 `null` — 호출부가 사용자 제스처로 재요청해야 한다. */
export const getCachedAccessToken = (): AccessToken | null => tokenStore.read();

export const clearAccessToken = (): void => {
  tokenStore.clear();
};

/**
 * 토큰을 요청한다. **사용자 제스처(클릭) 안에서 불러야 한다** — 팝업이 열린다.
 * 이미 유효한 토큰이 있으면 그대로 돌려준다(팝업을 다시 열지 않는다).
 */
export const requestAccessToken = async (options?: {
  /** `''`(기본, 이미 허용했으면 조용히) 또는 `'consent'`(권한을 다시 받아야 할 때). */
  readonly prompt?: '' | 'consent';
  /** 캐시를 무시하고 새로 받는다(401 복구 경로). */
  readonly force?: boolean;
}): Promise<LedgerResult<AccessToken>> => {
  const env = getGoogleSheetsEnv();
  if (!env) return ledgerErr(ledgerError('disabled'));

  if (!options?.force) {
    const cached = tokenStore.read();
    if (cached) return ledgerOk(cached);
  }

  let namespace: GoogleIdentityNamespace;
  try {
    namespace = await loadGoogleIdentityServices();
  } catch {
    return ledgerErr(ledgerError('network-error'));
  }

  return new Promise<LedgerResult<AccessToken>>((resolve) => {
    let settled = false;
    const settle = (result: LedgerResult<AccessToken>): void => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const handleResponse = (response: unknown): void => {
      const token = toAccessToken(response, Date.now());
      if (!token) {
        settle(ledgerErr(ledgerError('not-authorized')));
        return;
      }
      if (!hasRequiredScope(response)) {
        // 사용자가 동의 화면에서 체크를 해제했다 — 토큰은 있지만 시트에 접근할 수 없다.
        settle(ledgerErr(ledgerError('not-authorized')));
        return;
      }
      tokenStore.write(token);
      settle(ledgerOk(token));
    };

    if (!tokenClient) {
      tokenClient = namespace.accounts.oauth2.initTokenClient({
        client_id: env.clientId,
        scope: GOOGLE_SHEETS_SCOPE,
        callback: handleResponse,
        error_callback: () => settle(ledgerErr(ledgerError('not-authorized')))
      });
    } else {
      tokenClient.callback = handleResponse;
    }

    tokenClient.requestAccessToken({ prompt: options?.prompt ?? '' });
  });
};

/** 사용자가 연결을 끊을 때. 서버 쪽 권한까지 회수하고 메모리 토큰을 버린다. */
export const revokeAccessToken = async (): Promise<void> => {
  const token = tokenStore.read();
  tokenStore.clear();
  if (!token) return;
  const namespace = readGoogleNamespace();
  if (!namespace) return;
  await new Promise<void>((resolve) => {
    namespace.accounts.oauth2.revoke(token.value, () => resolve());
  });
};

/** 테스트용 — 메모이즈된 스크립트 프로미스·토큰 클라이언트·토큰을 버린다. */
export const resetGoogleAuthForTest = (): void => {
  scriptPromise = null;
  tokenClient = null;
  tokenStore.clear();
};
