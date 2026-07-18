/**
 * 네이버 로그인 서버 핸들러의 **분기 로직** — IO 없이 순수하게 테스트 가능하게 뺐다.
 * (accountDelete.ts 와 같은 규약: 실제 네트워크/admin IO 는 api/naver-auth.ts 가 deps 로 주입)
 *
 * ## 왜 서버가 필요한가
 * 네이버는 Supabase 기본 OAuth 프로바이더가 아니다(구글·카카오는 대시보드 스위치만 켜면 콜백을
 * Supabase 가 대신 받아준다). 그래서 네이버 신원에는 Supabase 세션을 **우리가 직접** 발급해야 하고,
 * 그건 service_role 권한(admin API)이 필요하다 — service_role 은 브라우저에 절대 노출 못 하므로
 * (docs/supabase/README.md §4·§7) Vercel 서버 경로가 유일한 방법이다.
 *
 * ## 세션 발급 방식 (확정: admin.generateLink(magiclink) → 클라이언트 verifyOtp)
 * 근거:
 *   - 공개 API(verifyOtp)로 외부 신원에 정식 세션(access+refresh, 자동 갱신 포함)을 발급하는 **유일한
 *     지원 경로**다. 커스텀 JWT 서명 대안은 refresh_token 을 auth.refresh_tokens 에 심을 방법이 없어
 *     자동 갱신이 깨지고, Supabase 내부(서명키·클레임)에 강결합돼 깨지기 쉽다.
 *   - service_role 은 서버(admin.generateLink)에만 있고, 클라이언트는 **공개 anon 클라이언트**로
 *     token_hash 만 검증(verifyOtp)한다. 비밀키가 브라우저로 내려가지 않는다.
 *
 * ## 신원 매핑 (네이버 id 를 안정 키로 — email 의존 금지)
 * 네이버 email 은 민감정보라 개인 앱에서는 검수 없이 못 받을 수 있다(카카오 선례와 동일 리스크).
 * 그래서 **네이버 id** 를 유일한 안정 키로 삼아 결정론적 합성 이메일(buildNaverSyntheticEmail)을
 * 만들고, 그걸로 find-or-create 한다(auth.users.email 유니크 제약이 곧 멱등 키). 합성 이메일은
 * 절대 발송하지 않으며(email_confirm:true) 공개 profiles 에도 저장되지 않는다.
 * 프로필은 **닉네임만** — 프로필 사진은 앱에서 폐기됐다(decisions.md). 닉네임이 없으면
 * 기존 handle_new_user 트리거가 결정론적 기본 닉네임을 만든다(스키마 변경 불필요).
 *
 * ## 계약
 *   POST /api/naver-auth   body: { code, state }   (Content-Type: application/json)
 *   200 { token_hash, type:'magiclink' }  ← 클라이언트가 verifyOtp 로 세션 확립
 *   400 invalid_request        (code/state 누락·본문 파싱 실패)
 *   405 method_not_allowed     (POST 외)
 *   502 naver_exchange_failed  (인가코드 → 네이버 토큰 교환 실패: 만료/위조 코드)
 *   502 naver_profile_failed   (/v1/nid/me 실패 또는 id 없음)
 *   500 session_issue_failed   (find-or-create / generateLink 실패)
 *
 * ## state CSRF
 * state 의 진짜 대조(세션 바인딩)는 **클라이언트**가 한다(sessionStorage 에 저장한 값과 콜백 state 비교
 * — shared/lib/supabase/naver.ts). 서버는 state 가 있는지 강제하고(없으면 400) 네이버 토큰 교환에
 * 그대로 전달한다(네이버 token 엔드포인트가 state 를 요구). 즉 서버는 CSRF 게이트가 아니라 통과 지점이다.
 *
 * ## 로깅 금지
 * 네이버 access_token, 발급된 token_hash, client_secret 은 어디에도 로깅하지 않는다(이 파일은 애초에
 * 그 값을 문자열로만 다루고 console 을 쓰지 않는다). api 래퍼도 동일 규칙.
 */

/** 네이버 OAuth 토큰 교환 엔드포인트. */
export const NAVER_TOKEN_ENDPOINT = 'https://nid.naver.com/oauth2.0/token';

/** 네이버 프로필 조회 엔드포인트(토큰 검증 겸용). */
export const NAVER_PROFILE_ENDPOINT = 'https://openapi.naver.com/v1/nid/me';

/** 앱별 고유 식별자(id)와 표시용 닉네임만 추린 네이버 프로필. email/사진은 의도적으로 버린다. */
export type NaverProfile = {
  id: string;
  nickname: string | null;
};

export type NaverAuthDeps = {
  /** 인가코드 → 네이버 access token. 실패 시 null(→ 502 naver_exchange_failed). */
  exchangeCodeForToken: (code: string, state: string) => Promise<string | null>;
  /** access token → 네이버 프로필(id 필수). 실패/id 없음 시 null(→ 502 naver_profile_failed). */
  fetchNaverProfile: (accessToken: string) => Promise<NaverProfile | null>;
  /** 네이버 id 로 Supabase 사용자 find-or-create → magiclink token_hash. 실패 시 null(→ 500). */
  issueMagicLink: (profile: NaverProfile) => Promise<string | null>;
};

/**
 * 네이버 id 로 만드는 **결정론적 합성 이메일**. auth.users.email 유니크 제약을 find-or-create 키로 쓴다.
 * 절대 발송하지 않는 주소다(email_confirm:true). domain 은 운영자가 소유한(또는 라우팅 불가한)
 * 도메인을 쓰고, GoTrue 의 이메일 형식 검증만 통과하면 된다(MX 조회 없음).
 */
export const buildNaverSyntheticEmail = (naverId: string, domain: string): string =>
  `naver_${naverId}@${domain}`;

/** 네이버 토큰 응답에서 access_token 만 안전하게 추린다. 없으면 null. */
export const parseNaverTokenResponse = (raw: unknown): string | null => {
  if (!raw || typeof raw !== 'object') return null;
  const token = (raw as Record<string, unknown>).access_token;
  if (typeof token !== 'string') return null;
  const trimmed = token.trim();
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * /v1/nid/me 응답 파싱. resultcode==='00' 이고 response.id 가 있어야 유효.
 * nickname 은 선택(동의 안 함/미승인이면 null → 트리거가 기본 닉네임 생성).
 */
export const parseNaverProfileResponse = (raw: unknown): NaverProfile | null => {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (obj.resultcode !== '00') return null;
  const response = obj.response;
  if (!response || typeof response !== 'object') return null;
  const r = response as Record<string, unknown>;
  const id = typeof r.id === 'string' ? r.id.trim() : '';
  if (!id) return null;
  const nickname =
    typeof r.nickname === 'string' && r.nickname.trim().length > 0 ? r.nickname.trim() : null;
  return { id, nickname };
};

/** 본문에서 code/state 를 문자열로만 추린다(둘 다 trim). */
const readCodeState = (body: unknown): { code: string; state: string } => {
  if (!body || typeof body !== 'object') return { code: '', state: '' };
  const obj = body as Record<string, unknown>;
  const code = typeof obj.code === 'string' ? obj.code.trim() : '';
  const state = typeof obj.state === 'string' ? obj.state.trim() : '';
  return { code, state };
};

const json = (status: number, body: Record<string, unknown>): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });

/**
 * 요청 → 응답. 순수 분기(위 계약):
 *   1) POST 아님             → 405
 *   2) 본문 파싱 실패/누락    → 400
 *   3) 토큰 교환 실패         → 502 naver_exchange_failed
 *   4) 프로필 조회 실패/id 없음 → 502 naver_profile_failed
 *   5) 세션 발급 실패         → 500 session_issue_failed (성공 위장 금지)
 *   6) 성공                  → 200 { token_hash, type:'magiclink' }
 */
export const handleNaverAuth = async (request: Request, deps: NaverAuthDeps): Promise<Response> => {
  if (request.method !== 'POST') {
    return json(405, { error: 'method_not_allowed' });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'invalid_request' });
  }

  const { code, state } = readCodeState(body);
  if (!code || !state) {
    return json(400, { error: 'invalid_request' });
  }

  let accessToken: string | null;
  try {
    accessToken = await deps.exchangeCodeForToken(code, state);
  } catch {
    accessToken = null;
  }
  if (!accessToken) {
    return json(502, { error: 'naver_exchange_failed' });
  }

  let profile: NaverProfile | null;
  try {
    profile = await deps.fetchNaverProfile(accessToken);
  } catch {
    profile = null;
  }
  if (!profile) {
    return json(502, { error: 'naver_profile_failed' });
  }

  let tokenHash: string | null;
  try {
    tokenHash = await deps.issueMagicLink(profile);
  } catch {
    tokenHash = null;
  }
  if (!tokenHash) {
    return json(500, { error: 'session_issue_failed' });
  }

  return json(200, { token_hash: tokenHash, type: 'magiclink' });
};
