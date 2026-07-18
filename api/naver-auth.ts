import { createClient } from '@supabase/supabase-js';
/*
  ⚠ account-delete.ts 와 동일 규약: 배럴(`@/shared/lib/community`)이 재export 하는 모듈은 전부 **순수**라
  모듈 스코프에서 `import.meta.env` 를 읽지 않는다(Vercel Node 런타임에서 함수 즉사 방지 — og.tsx 함정).
  네이버 로그인의 **분기 로직**(handleNaverAuth)과 파서/합성이메일은 여기서 순수 모듈로만 참조하고,
  네트워크/admin IO 는 아래에서 deps 로 주입한다.
*/
import {
  handleNaverAuth,
  parseNaverProfileResponse,
  parseNaverTokenResponse,
  buildNaverSyntheticEmail,
  NAVER_PROFILE_ENDPOINT,
  NAVER_TOKEN_ENDPOINT,
  type NaverAuthDeps,
  type NaverProfile
} from '@/shared/lib/community';

/**
 * 네이버 로그인 세션 발급 — `POST /api/naver-auth`, body { code, state } (application/json).
 *
 * ## 런타임: Node.js (account-delete.ts / og.tsx 와 동일 — `export const config` 없음)
 *
 * ## 왜 서버인가
 * 네이버는 Supabase 기본 OAuth 프로바이더가 아니라, 네이버 신원에 Supabase 세션을 **우리가** 발급해야
 * 한다. 그건 service_role(admin API)이 필요하고, service_role 은 브라우저에 절대 노출하지 않는다
 * (docs/supabase/README.md §7). 그래서 이 서버 경로가 유일한 방법이다.
 *
 * ## 처리 (deps 로 주입, 순수 분기는 handleNaverAuth)
 *   1) 인가코드 + state → 네이버 token 교환(client_secret 사용, x-www-form-urlencoded POST)
 *   2) access token → GET /v1/nid/me → 프로필(id 필수, nickname 선택)
 *   3) 네이버 id 로 결정론적 합성 이메일 → admin.createUser(find-or-create, email_confirm) →
 *      admin.generateLink(magiclink) → token_hash 반환
 *   클라이언트는 그 token_hash 로 verifyOtp 해서 세션을 확립한다.
 *
 * ## 환경변수 (Vercel 서버 — secret 은 VITE_ 금지·Sensitive)
 *   - VITE_NAVER_CLIENT_ID (공개값 — client_id 는 authorize URL 에 실려 나가므로 VITE_ 가능. NAVER_CLIENT_ID 로도 폴백)
 *   - NAVER_CLIENT_SECRET  (🚫 서버 전용. VITE_ 금지)
 *   - SUPABASE_URL (없으면 VITE_SUPABASE_URL 폴백)
 *   - SUPABASE_SERVICE_ROLE_KEY (🚫 서버 전용)
 *   - NAVER_SYNTHETIC_EMAIL_DOMAIN (선택 — 합성 이메일 도메인. 기본값 사용 가능, GoTrue 형식검증만 통과하면 됨)
 *   필수 넷 중 하나라도 없으면 500(성공 위장 금지).
 *
 * ## 보안
 *   - client_secret / 네이버 access_token / 발급 token_hash 는 **어디에도 로깅하지 않는다.**
 *   - client_secret 은 URL 이 아니라 POST 본문으로 전송(프록시 URL 로깅 회피).
 *   - state 는 필수(handleNaverAuth 가 강제)이고 네이버 token 교환에 그대로 전달한다. 진짜 CSRF 대조는
 *     클라이언트가 sessionStorage 로 한다(shared/lib/supabase/naver.ts).
 */

const readEnv = (name: string): string | undefined => {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
};

const DEFAULT_SYNTHETIC_EMAIL_DOMAIN = 'naver-oauth.snowball.invalid';

type NaverConfig = {
  clientId: string;
  clientSecret: string;
  supabaseUrl: string;
  serviceKey: string;
  emailDomain: string;
};

const readConfig = (): NaverConfig | null => {
  const clientId = readEnv('VITE_NAVER_CLIENT_ID') ?? readEnv('NAVER_CLIENT_ID');
  const clientSecret = readEnv('NAVER_CLIENT_SECRET');
  const supabaseUrl = readEnv('SUPABASE_URL') ?? readEnv('VITE_SUPABASE_URL');
  const serviceKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');
  const emailDomain = readEnv('NAVER_SYNTHETIC_EMAIL_DOMAIN') ?? DEFAULT_SYNTHETIC_EMAIL_DOMAIN;
  if (!clientId || !clientSecret || !supabaseUrl || !serviceKey) return null;
  return { clientId, clientSecret, supabaseUrl, serviceKey, emailDomain };
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

export default async function handler(request: Request): Promise<Response> {
  const config = readConfig();
  if (!config) {
    console.error(
      '[naver-auth] 환경변수 미설정 (VITE_NAVER_CLIENT_ID / NAVER_CLIENT_SECRET / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)'
    );
    return jsonError(500, 'internal_error');
  }

  const admin = createClient(config.supabaseUrl, config.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const deps: NaverAuthDeps = {
    exchangeCodeForToken: async (code, state) => {
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        state
      });
      const res = await fetch(NAVER_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: body.toString()
      });
      if (!res.ok) return null;
      return parseNaverTokenResponse(await res.json().catch(() => null));
    },

    fetchNaverProfile: async (accessToken) => {
      const res = await fetch(NAVER_PROFILE_ENDPOINT, {
        headers: { authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) return null;
      return parseNaverProfileResponse(await res.json().catch(() => null));
    },

    issueMagicLink: async (profile: NaverProfile) => {
      const email = buildNaverSyntheticEmail(profile.id, config.emailDomain);

      // find-or-create: 네이버 id 가 안정 키. 이미 있으면 email_exists → 'found' 로 취급(멱등).
      // user_metadata.name(닉네임)은 handle_new_user 트리거가 profiles.display_name 으로 승격한다
      // (신규 사용자만; 재로그인 시엔 사용자가 편집한 닉네임을 덮어쓰지 않는다).
      const created = await admin.auth.admin.createUser({
        email,
        email_confirm: true, // 합성 이메일 — 확인메일 발송 안 함
        user_metadata: profile.nickname ? { name: profile.nickname } : {},
        app_metadata: { provider: 'naver', naver_id: profile.id }
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

  return handleNaverAuth(request, deps);
}
