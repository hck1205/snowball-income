/**
 * 카카오 로그인 서버 핸들러의 **분기 로직** — IO 없이 순수하게 테스트 가능하게 뺐다.
 * (naverAuth.ts 와 **같은 템플릿**이다: 실제 네트워크/admin IO 는 server/handlers/KakaoAuth 가 deps 로 주입)
 *
 * ## 왜 커스텀 플로우인가 (카카오는 Supabase 기본 프로바이더인데도)
 * 카카오는 Supabase 대시보드 스위치만 켜면 붙는 기본 프로바이더다. 그런데 그 기본 경로에서
 * **같은 이메일을 쓰는 구글 계정과 한 계정으로 병합**되는 문제가 실측됐다(2026-07-24: user_id 하나에
 * email/google/kakao identity 3개). GoTrue 는 새 identity 를 **이메일로** 기존 계정에 붙이는데,
 * 카카오 콘솔의 "카카오계정(이메일)" 선택동의가 켜져 있으면 우리가 scope 에서 요청하지 않아도
 * 이메일이 넘어오기 때문이다(shared/lib/supabase/auth.ts OAUTH_SCOPES 주석). 코드로는 못 막는다.
 *
 * 그래서 **네이버와 동일한 "완전 분리"** 를 택했다(사용자 결정): 카카오 id 기반 결정론적 합성
 * 이메일로 find-or-create 한다 → 구글 계정과 구조적으로 절대 겹치지 않는다. 같은 사람이어도
 * 구글/카카오는 **별개 계정**이 되는 트레이드오프를 알고 승인했다.
 *
 * ## 세션 발급 방식 (네이버와 동일: admin.generateLink(magiclink) → 클라이언트 verifyOtp)
 * 근거:
 *   - 공개 API(verifyOtp)로 외부 신원에 정식 세션(access+refresh, 자동 갱신 포함)을 발급하는 **유일한
 *     지원 경로**다. 커스텀 JWT 서명 대안은 refresh_token 을 auth.refresh_tokens 에 심을 방법이 없어
 *     자동 갱신이 깨진다(naverAuth.ts 에서 이미 기각된 대안 — 다시 검토하지 말 것).
 *   - service_role 은 서버(admin.generateLink)에만 있고, 클라이언트는 **공개 anon 클라이언트**로
 *     token_hash 만 검증(verifyOtp)한다. 비밀키가 브라우저로 내려가지 않는다.
 *
 * ## 신원 매핑 (카카오 id 만 안정 키 — email 절대 사용 금지)
 * 카카오 응답에 `kakao_account.email` 이 실려 와도 **읽지 않는다**. 이메일을 쓰는 순간 위 병합이
 * 그대로 재현되기 때문이다. **카카오 id**(응답 `id`, 숫자 → 문자열화)만으로 결정론적 합성 이메일
 * (buildKakaoSyntheticEmail)을 만들고 그걸로 find-or-create 한다(auth.users.email 유니크 제약이 곧
 * 멱등 키). 합성 이메일은 절대 발송하지 않으며(email_confirm:true) 공개 profiles 에도 저장되지 않는다.
 *
 * 프로필은 **닉네임만** 받는다. **아바타/프로필 사진은 받지도 저장하지도 않는다** — 앱에서 프로필
 * 사진 기능이 폐기됐고(이니셜 아바타 통일), 과거 카카오 아바타 URL(`http://k.kakaocdn.net/...`)이
 * profiles.avatar_url 의 `^https://` CHECK 를 위반해 가입 트리거가 죽고 콜백이 500 나던 사고가 있다.
 * 닉네임이 없으면 기존 handle_new_user 트리거가 결정론적 기본 닉네임을 만든다(스키마 변경 불필요).
 *
 * ## 계약
 *   POST /api/kakao-auth   body: { code, state }   (Content-Type: application/json)
 *   200 { token_hash, type:'magiclink' }  ← 클라이언트가 verifyOtp 로 세션 확립
 *   400 invalid_request        (code/state 누락·본문 파싱 실패)
 *   405 method_not_allowed     (POST 외)
 *   502 kakao_exchange_failed  (인가코드 → 카카오 토큰 교환 실패: 만료/위조 코드)
 *   502 kakao_profile_failed   (/v2/user/me 실패 또는 id 없음)
 *   500 session_issue_failed   (find-or-create / generateLink 실패)
 *
 * ## state CSRF
 * state 의 진짜 대조(세션 바인딩)는 **클라이언트**가 한다(sessionStorage 에 저장한 값과 콜백 state 비교
 * — shared/lib/supabase/kakao.ts). 서버는 state 가 있는지만 강제한다(없으면 400). ⚠ 네이버와 달리
 * 카카오 token 엔드포인트는 state 를 받지 않으므로 **교환에 전달하지 않는다**(그래서 deps 의
 * exchangeCodeForToken 은 code 만 받는다). 즉 서버는 CSRF 게이트가 아니라 통과 지점이다.
 *
 * ## 로깅 금지
 * 카카오 access_token, 발급된 token_hash, client_secret 은 어디에도 로깅하지 않는다(이 파일은 애초에
 * 그 값을 문자열로만 다루고 console 을 쓰지 않는다). 에러 응답 본문에도 싣지 않는다 — 위 계약의
 * 고정 코드 문자열만 나간다. 서버 래퍼도 동일 규칙.
 */

/** 카카오 OAuth 토큰 교환 엔드포인트. */
export const KAKAO_TOKEN_ENDPOINT = 'https://kauth.kakao.com/oauth/token';

/** 카카오 프로필 조회 엔드포인트(토큰 검증 겸용). */
export const KAKAO_PROFILE_ENDPOINT = 'https://kapi.kakao.com/v2/user/me';

/**
 * 앱별 고유 식별자(id)와 표시용 닉네임만 추린 카카오 프로필.
 * email/프로필사진은 응답에 있어도 **의도적으로 버린다**(위 주석 참고).
 */
export type KakaoProfile = {
  /** 카카오 회원번호. 응답에선 숫자지만 여기서는 항상 문자열로 다룬다(정밀도·키 일관성). */
  id: string;
  nickname: string | null;
};

export type KakaoAuthDeps = {
  /**
   * 인가코드 → 카카오 access token. 실패 시 null(→ 502 kakao_exchange_failed).
   * ⚠ state 를 받지 않는다 — 카카오 token 엔드포인트가 state 를 요구하지 않기 때문(네이버와 다른 점).
   */
  exchangeCodeForToken: (code: string) => Promise<string | null>;
  /** access token → 카카오 프로필(id 필수). 실패/id 없음 시 null(→ 502 kakao_profile_failed). */
  fetchKakaoProfile: (accessToken: string) => Promise<KakaoProfile | null>;
  /** 카카오 id 로 Supabase 사용자 find-or-create → magiclink token_hash. 실패 시 null(→ 500). */
  issueMagicLink: (profile: KakaoProfile) => Promise<string | null>;
};

/**
 * 카카오 id 로 만드는 **결정론적 합성 이메일**. auth.users.email 유니크 제약을 find-or-create 키로 쓴다.
 * 절대 발송하지 않는 주소다(email_confirm:true). domain 은 운영자가 소유한(또는 라우팅 불가한)
 * 도메인을 쓰고, GoTrue 의 이메일 형식 검증만 통과하면 된다(MX 조회 없음).
 * 네이버(`naver_<id>@…`)와 접두어가 달라 **두 프로바이더의 합성 계정도 서로 겹치지 않는다.**
 */
export const buildKakaoSyntheticEmail = (kakaoId: string, domain: string): string =>
  `kakao_${kakaoId}@${domain}`;

/** 카카오 토큰 응답에서 access_token 만 안전하게 추린다. 없으면 null. */
export const parseKakaoTokenResponse = (raw: unknown): string | null => {
  if (!raw || typeof raw !== 'object') return null;
  const token = (raw as Record<string, unknown>).access_token;
  if (typeof token !== 'string') return null;
  const trimmed = token.trim();
  return trimmed.length > 0 ? trimmed : null;
};

/** 문자열이고 trim 후 비어있지 않을 때만 값으로 인정한다. */
const readNickname = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * /v2/user/me 응답 파싱. `id` 가 있어야 유효하다.
 *
 * - `id` 는 **숫자**로 온다(카카오 회원번호). 문자열로 정규화해 다룬다 — 합성 이메일 키가 문자열이고,
 *   숫자로 두면 큰 값에서 정밀도 손실 위험이 있다. 문자열로 오는 변형도 받아들인다(관대한 파싱).
 * - 닉네임은 `kakao_account.profile.nickname` → `properties.nickname` 순으로 본다(동의항목 구성에 따라
 *   한쪽만 채워진다). 둘 다 없으면 null → 가입 트리거가 기본 닉네임을 만든다.
 * - **이메일·프로필 사진은 응답에 있어도 읽지 않는다**(계정 병합·avatar CHECK 사고 방지).
 */
export const parseKakaoProfileResponse = (raw: unknown): KakaoProfile | null => {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const rawId = obj.id;
  const id =
    typeof rawId === 'number' && Number.isFinite(rawId)
      ? String(rawId)
      : typeof rawId === 'string'
        ? rawId.trim()
        : '';
  if (!id) return null;

  const account = obj.kakao_account;
  const accountProfile =
    account && typeof account === 'object'
      ? (account as Record<string, unknown>).profile
      : undefined;
  const accountNickname =
    accountProfile && typeof accountProfile === 'object'
      ? readNickname((accountProfile as Record<string, unknown>).nickname)
      : null;

  const properties = obj.properties;
  const propertyNickname =
    properties && typeof properties === 'object'
      ? readNickname((properties as Record<string, unknown>).nickname)
      : null;

  return { id, nickname: accountNickname ?? propertyNickname };
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
 *   3) 토큰 교환 실패         → 502 kakao_exchange_failed
 *   4) 프로필 조회 실패/id 없음 → 502 kakao_profile_failed
 *   5) 세션 발급 실패         → 500 session_issue_failed (성공 위장 금지)
 *   6) 성공                  → 200 { token_hash, type:'magiclink' }
 */
export const handleKakaoAuth = async (request: Request, deps: KakaoAuthDeps): Promise<Response> => {
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
    accessToken = await deps.exchangeCodeForToken(code);
  } catch {
    accessToken = null;
  }
  if (!accessToken) {
    return json(502, { error: 'kakao_exchange_failed' });
  }

  let profile: KakaoProfile | null;
  try {
    profile = await deps.fetchKakaoProfile(accessToken);
  } catch {
    profile = null;
  }
  if (!profile) {
    return json(502, { error: 'kakao_profile_failed' });
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
