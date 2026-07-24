import { createClient } from '@supabase/supabase-js';
/*
  ⚠ NaverAuth.ts / account-delete 와 동일 규약: 배럴(`@/shared/lib/community`)이 재export 하는 모듈은
  전부 **순수**라 모듈 스코프에서 `import.meta.env` 를 읽지 않는다(Vercel Node 런타임에서 함수 즉사 방지
  — og 함정). 카카오 로그인의 **분기 로직**(handleKakaoAuth)과 파서/합성이메일은 여기서 순수 모듈로만
  참조하고, 네트워크/admin IO 는 아래에서 deps 로 주입한다.
*/
import {
  handleKakaoAuth,
  parseKakaoProfileResponse,
  parseKakaoTokenResponse,
  buildKakaoSyntheticEmail,
  KAKAO_PROFILE_ENDPOINT,
  KAKAO_TOKEN_ENDPOINT,
  type KakaoAuthDeps,
  type KakaoProfile
} from '@/shared/lib/community';
import { logAuthFailure, toNodeHandler } from '@/shared/lib/server';

/**
 * 카카오 로그인 세션 발급 — `POST /api/kakao-auth`, body { code, state } (application/json).
 *
 * ## 런타임: Node.js — **`toNodeHandler` 어댑터 필수**
 * `export const config` 가 없으므로 Vercel 은 Node 런타임으로 배포하고 `(req, res)` 로 호출한다. 아래 웹 표준
 * `handler` 를 그대로 default export 하면 `res.end()` 가 없어 **무응답 타임아웃**이 된다(2026-07-20 실제 장애).
 * 근거: `@/shared/lib/server` nodeHandler.ts. 이 함수는 **POST 본문**(JSON `{ code, state }`)을 읽는다 —
 * 어댑터가 `req.body`(Vercel 선파싱) 또는 요청 스트림에서 본문을 복원해 `Request` 에 실어 준다.
 *
 * ## 왜 커스텀 서버 경로인가 (카카오는 Supabase 기본 프로바이더인데)
 * 기본 경로는 이메일로 identity 를 기존 계정에 자동 링크해 **구글 계정과 병합**된다(실측).
 * 카카오 id 기반 합성 이메일로 계정을 분리하려면 admin API(service_role)가 필요하고, service_role 은
 * 브라우저에 절대 노출하지 않는다(docs/supabase/README.md §7) → 이 서버 경로가 유일한 방법이다.
 * 상세 배경·기각된 대안은 `shared/lib/community/kakaoAuth.ts` 상단 주석.
 *
 * ## 처리 (deps 로 주입, 순수 분기는 handleKakaoAuth)
 *   1) 인가코드 → 카카오 token 교환(REST API 키 + client_secret[있으면], x-www-form-urlencoded POST)
 *   2) access token → GET /v2/user/me → 프로필(id 필수, nickname 선택, **email/사진 미사용**)
 *   3) 카카오 id 로 결정론적 합성 이메일 → admin.createUser(find-or-create, email_confirm) →
 *      admin.generateLink(magiclink) → token_hash 반환
 *   클라이언트는 그 token_hash 로 verifyOtp 해서 세션을 확립한다.
 *
 * ## 환경변수 (Vercel 서버 — secret 은 VITE_ 금지·Sensitive)
 *   - VITE_KAKAO_CLIENT_ID (공개값 — REST API 키. authorize URL 에 실려 나가므로 VITE_ 가능. KAKAO_CLIENT_ID 로도 폴백)
 *   - KAKAO_CLIENT_SECRET  (🚫 서버 전용. **선택** — 카카오 콘솔에서 client_secret 을 "사용함"으로 켠 앱만 필요)
 *   - SUPABASE_URL (없으면 VITE_SUPABASE_URL 폴백)
 *   - SUPABASE_SERVICE_ROLE_KEY (🚫 서버 전용)
 *   - KAKAO_SYNTHETIC_EMAIL_DOMAIN (선택 — 합성 이메일 도메인. 기본값 사용 가능, GoTrue 형식검증만 통과하면 됨)
 *   필수 셋(client_id·supabaseUrl·serviceKey) 중 하나라도 없으면 500(성공 위장 금지).
 *
 * ## redirect_uri
 * 카카오 token 교환은 authorize 때와 **같은 redirect_uri** 를 요구한다. 그 값은 브라우저 origin 에
 * 의존하므로(로컬/프리뷰/프로덕션이 다르다) 서버 env 로 박지 않고 **클라이언트가 보낸 요청의 Origin**
 * 에서 만든다(`<origin>` + KAKAO_CALLBACK_PATH). Origin 헤더가 없으면 KAKAO_REDIRECT_URI env 로 폴백한다.
 *
 * ## 보안
 *   - client_secret / 카카오 access_token / 발급 token_hash 는 **어디에도 로깅하지 않는다.**
 *   - client_secret 은 URL 이 아니라 POST 본문으로 전송(프록시 URL 로깅 회피).
 *   - state 는 필수(handleKakaoAuth 가 강제)지만 카카오 token 엔드포인트엔 전달하지 않는다(요구하지 않음).
 *     진짜 CSRF 대조는 클라이언트가 sessionStorage 로 한다(shared/lib/supabase/kakao.ts).
 */

const readEnv = (name: string): string | undefined => {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
};

const DEFAULT_SYNTHETIC_EMAIL_DOMAIN = 'kakao-oauth.snowball.invalid';

/** 클라이언트 seam(shared/lib/supabase/kakao.ts)의 KAKAO_CALLBACK_PATH 와 **같은 리터럴**이어야 한다. */
const KAKAO_CALLBACK_PATH = '/community/auth/kakao/callback';

type KakaoConfig = {
  clientId: string;
  /** 선택 — 콘솔에서 client_secret 을 켠 앱만 존재한다(없으면 교환 본문에서 생략). */
  clientSecret?: string;
  supabaseUrl: string;
  serviceKey: string;
  emailDomain: string;
  /** Origin 이 없을 때 쓰는 폴백 redirect_uri(선택). */
  fallbackRedirectUri?: string;
};

const readConfig = (): KakaoConfig | null => {
  const clientId = readEnv('VITE_KAKAO_CLIENT_ID') ?? readEnv('KAKAO_CLIENT_ID');
  const clientSecret = readEnv('KAKAO_CLIENT_SECRET');
  const supabaseUrl = readEnv('SUPABASE_URL') ?? readEnv('VITE_SUPABASE_URL');
  const serviceKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');
  const emailDomain = readEnv('KAKAO_SYNTHETIC_EMAIL_DOMAIN') ?? DEFAULT_SYNTHETIC_EMAIL_DOMAIN;
  const fallbackRedirectUri = readEnv('KAKAO_REDIRECT_URI');
  if (!clientId || !supabaseUrl || !serviceKey) return null;
  return { clientId, clientSecret, supabaseUrl, serviceKey, emailDomain, fallbackRedirectUri };
};

/**
 * authorize 때 쓴 redirect_uri 를 **요청에서** 복원한다 — 로컬/프리뷰/프로덕션 origin 이 다 달라
 * 서버 env 로 박을 수 없기 때문. 순서: Origin 헤더 → 요청 URL 의 origin → 폴백 env.
 *
 * 2단계가 있는 이유: Origin 헤더는 브라우저의 same-origin POST 에서 대체로 실려 오지만 보장은 아니다.
 * `request.url` 은 어댑터가 `x-forwarded-host`/`host` + proto 로 절대 URL 을 만들어 두므로
 * (shared/lib/server nodeHandler.ts resolveRequestUrl) 배포 도메인이 그대로 복원된다.
 */
const resolveRedirectUri = (request: Request, config: KakaoConfig): string | null => {
  const origin = request.headers.get('origin')?.trim();
  if (origin) return `${origin}${KAKAO_CALLBACK_PATH}`;

  try {
    const requestOrigin = new URL(request.url).origin;
    if (requestOrigin && requestOrigin !== 'null') return `${requestOrigin}${KAKAO_CALLBACK_PATH}`;
  } catch {
    // 상대 URL 등 — 아래 env 폴백으로.
  }

  return config.fallbackRedirectUri ?? null;
};

const jsonError = (status: number, code: string): Response =>
  new Response(JSON.stringify({ error: code }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });

/** admin.createUser 의 "이미 가입됨" 판정. 이 경우는 실패가 아니라 find-or-create 의 'found'. */
const isAlreadyRegistered = (error: { status?: number; code?: string; message?: string } | null): boolean => {
  if (!error) return false;
  if (error.code === 'email_exists') return true;
  if (error.status === 422) return true;
  return typeof error.message === 'string' && /already\s+been\s+registered|already\s+registered/i.test(error.message);
};

/** 웹 표준 핸들러 — 계약 테스트는 순수 분기(`handleKakaoAuth`) 쪽에 있다(test/community/kakao.test.ts). */
export async function handler(request: Request): Promise<Response> {
  const config = readConfig();
  if (!config) {
    console.error(
      '[kakao-auth] 환경변수 미설정 (VITE_KAKAO_CLIENT_ID / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)'
    );
    return jsonError(500, 'internal_error');
  }

  const admin = createClient(config.supabaseUrl, config.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  /**
   * 토큰 교환이 실패했을 때 **카카오가 준 사유**를 담아 둔다(진단용).
   *
   * 이게 없으면 클라이언트는 `kakao_exchange_failed` 만 받아 "카카오가 거절했다"까지만 알 뿐,
   * redirect_uri 불일치(KOE006)인지·인가코드 재사용/만료(KOE320)인지·client_secret 문제(KOE010)인지
   * 구분할 수 없다. 실제로 그 구분이 안 돼 원인 추적이 막혔다.
   * ⚠ 담기는 값은 **카카오 에러 코드/사유 문자열뿐**이다 — access_token·client_secret 은 담지 않는다.
   */
  let kakaoExchangeError: string | null = null;

  const deps: KakaoAuthDeps = {
    exchangeCodeForToken: async (code) => {
      const redirectUri = resolveRedirectUri(request, config);
      if (!redirectUri) {
        kakaoExchangeError = 'no_redirect_uri';
        return null; // → 502. redirect_uri 없이 교환하면 카카오가 KOE006 으로 거절한다.
      }
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.clientId,
        redirect_uri: redirectUri,
        code
      });
      // client_secret 은 콘솔에서 켠 앱만 쓴다. 꺼진 앱에 빈 값을 보내면 오히려 거절당하므로 조건부.
      if (config.clientSecret) body.set('client_secret', config.clientSecret);

      const res = await fetch(KAKAO_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded;charset=utf-8' },
        body: body.toString()
      });

      if (!res.ok) {
        const detail = (await res.json().catch(() => null)) as
          | { error?: unknown; error_code?: unknown; error_description?: unknown }
          | null;
        const code = typeof detail?.error_code === 'string' ? detail.error_code : `http_${res.status}`;
        const kind = typeof detail?.error === 'string' ? detail.error : 'unknown';
        kakaoExchangeError = `${code}/${kind}`;
        // 서버 로그에는 redirect_uri 도 남긴다 — KOE006(불일치) 진단의 결정적 단서이고 공개 URL 이라 안전하다.
        console.error(
          '[kakao-auth] 토큰 교환 실패',
          kakaoExchangeError,
          'redirect_uri=',
          redirectUri,
          'client_secret_사용=',
          Boolean(config.clientSecret)
        );
        return null;
      }

      // 200 인데 access_token 이 없는 경우도 있다(응답 형식 변경·부분 실패) — 이때도 사유를 남긴다.
      const parsed = parseKakaoTokenResponse(await res.json().catch(() => null));
      if (!parsed) {
        kakaoExchangeError = 'ok_but_no_access_token';
        console.error('[kakao-auth] 토큰 응답에 access_token 이 없다', 'redirect_uri=', redirectUri);
      }
      return parsed;
    },

    fetchKakaoProfile: async (accessToken) => {
      const res = await fetch(KAKAO_PROFILE_ENDPOINT, {
        headers: { authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) return null;
      return parseKakaoProfileResponse(await res.json().catch(() => null));
    },

    issueMagicLink: async (profile: KakaoProfile) => {
      const email = buildKakaoSyntheticEmail(profile.id, config.emailDomain);

      // find-or-create: 카카오 id 가 안정 키. 이미 있으면 email_exists → 'found' 로 취급(멱등).
      // user_metadata.name(닉네임)은 handle_new_user 트리거가 profiles.display_name 으로 승격한다
      // (신규 사용자만; 재로그인 시엔 사용자가 편집한 닉네임을 덮어쓰지 않는다).
      // ⚠ 아바타는 넣지 않는다 — 프로필 사진 폐기 + avatar_url `^https://` CHECK 위반 사고 이력.
      const created = await admin.auth.admin.createUser({
        email,
        email_confirm: true, // 합성 이메일 — 확인메일 발송 안 함
        user_metadata: profile.nickname ? { name: profile.nickname } : {},
        app_metadata: { provider: 'kakao', kakao_id: profile.id }
      });
      if (created.error && !isAlreadyRegistered(created.error)) {
        return null;
      }

      // 공개 anon 클라이언트가 verifyOtp 할 수 있는 magiclink token_hash 발급.
      const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
      const tokenHash = data?.properties?.hashed_token;
      if (error || typeof tokenHash !== 'string' || tokenHash.length === 0) return null;
      return tokenHash;
    }
  };

  const response = await handleKakaoAuth(request, deps);

  /*
   * 502(kakao_exchange_failed)에 **카카오가 준 사유를 덧붙여** 돌려준다. 순수 분기 로직
   * (handleKakaoAuth)의 계약은 그대로 두고 여기서만 코드를 확장하므로, 성공 경로와 다른 실패
   * 코드는 건드리지 않는다. 클라이언트는 이 값을 URL 의 kakaoLoginReason 으로 남겨 진단에 쓴다.
   */
  if (kakaoExchangeError && response.status === 502) {
    return logAuthFailure('kakao-auth', jsonError(502, `kakao_exchange_failed:${kakaoExchangeError}`));
  }

  // 나머지 실패(400 invalid_request · 405 · 502 profile · 500 session)도 빠짐없이 서버 로그에 남긴다.
  return logAuthFailure('kakao-auth', response);
}

/** ⚠ Vercel 이 실제로 호출하는 진입점. 어댑터를 벗기면 무응답으로 되돌아간다(위 "런타임" 주석). */
export default toNodeHandler(handler);
