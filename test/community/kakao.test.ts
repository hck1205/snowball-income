import { describe, expect, it, vi } from 'vitest';
import {
  buildKakaoSyntheticEmail,
  handleKakaoAuth,
  parseKakaoProfileResponse,
  parseKakaoTokenResponse,
  type KakaoAuthDeps,
  type KakaoProfile
} from '@/shared/lib/community';
import {
  appendKakaoLoginError,
  buildKakaoAuthorizeUrl,
  isKakaoCallbackPath,
  isKakaoCustomAuthEnabled,
  KAKAO_CALLBACK_PATH,
  readKakaoCallbackParams,
  readKakaoLoginError,
  stripKakaoLoginError
} from '@/shared/lib/supabase';

/**
 * 카카오 커스텀 로그인 — 순수 계약.
 *
 * 카카오는 Supabase 기본 프로바이더지만, 이메일 기반 자동 identity 링크로 **구글 계정과 병합**되는 걸
 * 막으려고 네이버와 같은 커스텀 플로우(authorize 리다이렉트 + `/api/kakao-auth` 서버 교환)를 탄다.
 * 그 흐름의 뼈대(콜백 경로 판정·파라미터 추출·실패 플래그 왕복·authorize URL·서버 분기·응답 파서·
 * 합성 이메일)를 env·네트워크 무관하게 고정한다. 실동작(startKakaoLogin/completeKakaoCallback)은
 * 리다이렉트/서버 왕복이라 유닛에서 다루지 않는다.
 */

// ── 클라이언트 seam ───────────────────────────────────────────────────────────

describe('카카오 seam — 순수 함수', () => {
  it('테스트 기본 env(백엔드 없는 배포)에서는 커스텀 플로우가 꺼져 있다', () => {
    // vitest.config 가 커뮤니티 변수를 비워 "백엔드 없는 기본 배포"로 고정한다.
    // → 가로채기 없이 기존 Supabase 카카오 플로우로 폴백한다(로그인이 죽지 않는다).
    expect(isKakaoCustomAuthEnabled).toBe(false);
  });

  describe('isKakaoCallbackPath', () => {
    it('콜백 경로를 정확히 인식한다', () => {
      expect(isKakaoCallbackPath(KAKAO_CALLBACK_PATH)).toBe(true);
      expect(isKakaoCallbackPath('/community/auth/kakao/callback')).toBe(true);
    });

    it('다른 경로는 콜백이 아니다 (네이버 콜백과도 겹치지 않는다)', () => {
      expect(isKakaoCallbackPath('/community')).toBe(false);
      expect(isKakaoCallbackPath('/')).toBe(false);
      expect(isKakaoCallbackPath('/community/auth/kakao')).toBe(false);
      expect(isKakaoCallbackPath('/community/auth/naver/callback')).toBe(false);
    });
  });

  describe('readKakaoCallbackParams', () => {
    it('code+state 가 둘 다 있으면 추출한다(앞의 ? 유무 무관)', () => {
      expect(readKakaoCallbackParams('?code=abc&state=xyz')).toEqual({ code: 'abc', state: 'xyz' });
      expect(readKakaoCallbackParams('code=abc&state=xyz')).toEqual({ code: 'abc', state: 'xyz' });
    });

    it('하나라도 없으면 null(무효 콜백)', () => {
      expect(readKakaoCallbackParams('?code=abc')).toBeNull();
      expect(readKakaoCallbackParams('?state=xyz')).toBeNull();
      expect(readKakaoCallbackParams('')).toBeNull();
    });
  });

  describe('buildKakaoAuthorizeUrl', () => {
    it('response_type=code + client_id + redirect_uri + state + scope 를 실은 authorize URL 을 만든다', () => {
      const url = new URL(
        buildKakaoAuthorizeUrl('REST_KEY', 'https://app.example/community/auth/kakao/callback', 'ST8')
      );
      expect(url.origin + url.pathname).toBe('https://kauth.kakao.com/oauth/authorize');
      expect(url.searchParams.get('response_type')).toBe('code');
      expect(url.searchParams.get('client_id')).toBe('REST_KEY');
      expect(url.searchParams.get('redirect_uri')).toBe('https://app.example/community/auth/kakao/callback');
      expect(url.searchParams.get('state')).toBe('ST8');
      // 닉네임만 — 이메일 동의를 요청하면 계정 병합 위험이 되살아난다.
      expect(url.searchParams.get('scope')).toBe('profile_nickname');
    });
  });

  describe('실패 플래그 왕복(appendKakaoLoginError ↔ readKakaoLoginError)', () => {
    it('붙였다 읽으면 실패로 감지된다', () => {
      const returnTo = appendKakaoLoginError('/community');
      expect(readKakaoLoginError(new URL(`https://app.example${returnTo}`).search)).toBe(true);
    });

    it('기존 쿼리를 보존하며 실패 플래그를 더한다', () => {
      const returnTo = appendKakaoLoginError('/community?sort=recent');
      const search = new URL(`https://app.example${returnTo}`).search;
      expect(readKakaoLoginError(search)).toBe(true);
      expect(new URLSearchParams(search).get('sort')).toBe('recent');
    });

    it('플래그가 없으면 실패가 아니다', () => {
      expect(readKakaoLoginError('?sort=recent')).toBe(false);
      expect(readKakaoLoginError('')).toBe(false);
    });
  });

  describe('stripKakaoLoginError — 안내 확인 후 URL 정리', () => {
    it('kakaoLogin 플래그만 지우고 실패가 더는 감지되지 않는다', () => {
      const href = `https://app.example${appendKakaoLoginError('/community')}`;
      expect(readKakaoLoginError(new URL(stripKakaoLoginError(href)).search)).toBe(false);
    });

    it('share/sv·정렬·네이버 플래그 등 다른 파라미터는 보존한다', () => {
      const href = `https://app.example${appendKakaoLoginError('/community?sort=recent&share=eN1&naverLogin=failed')}`;
      const params = new URL(stripKakaoLoginError(href)).searchParams;
      expect(params.get('kakaoLogin')).toBeNull();
      expect(params.get('sort')).toBe('recent');
      expect(params.get('share')).toBe('eN1');
      expect(params.get('naverLogin')).toBe('failed');
    });
  });
});

// ── 합성 이메일 (계정 분리의 핵심 키) ─────────────────────────────────────────

describe('buildKakaoSyntheticEmail', () => {
  it('같은 카카오 id 는 항상 같은 주소를 만든다(결정론적 = find-or-create 키)', () => {
    expect(buildKakaoSyntheticEmail('123456789', 'kakao-oauth.snowball.invalid')).toBe(
      'kakao_123456789@kakao-oauth.snowball.invalid'
    );
    expect(buildKakaoSyntheticEmail('123456789', 'x.invalid')).toBe(
      buildKakaoSyntheticEmail('123456789', 'x.invalid')
    );
  });

  it('다른 id 는 다른 주소다', () => {
    const a = buildKakaoSyntheticEmail('1', 'x.invalid');
    const b = buildKakaoSyntheticEmail('2', 'x.invalid');
    expect(a).not.toBe(b);
  });

  it('네이버 합성 주소와 접두어가 달라 프로바이더 간에도 겹치지 않는다', () => {
    // 같은 숫자 id 를 쓰는 네이버 사용자가 있어도 같은 계정으로 합쳐지지 않아야 한다.
    expect(buildKakaoSyntheticEmail('7', 'x.invalid')).not.toBe('naver_7@x.invalid');
    expect(buildKakaoSyntheticEmail('7', 'x.invalid').startsWith('kakao_')).toBe(true);
  });
});

// ── 응답 파서 ─────────────────────────────────────────────────────────────────

describe('parseKakaoTokenResponse', () => {
  it('access_token 을 추린다', () => {
    expect(parseKakaoTokenResponse({ access_token: 'AT', token_type: 'bearer' })).toBe('AT');
    expect(parseKakaoTokenResponse({ access_token: '  AT  ' })).toBe('AT');
  });

  it('기형 응답은 null (에러 본문·빈 토큰·비객체)', () => {
    expect(parseKakaoTokenResponse({ error: 'invalid_grant' })).toBeNull();
    expect(parseKakaoTokenResponse({ access_token: '   ' })).toBeNull();
    expect(parseKakaoTokenResponse({ access_token: 123 })).toBeNull();
    expect(parseKakaoTokenResponse(null)).toBeNull();
    expect(parseKakaoTokenResponse('AT')).toBeNull();
  });
});

describe('parseKakaoProfileResponse', () => {
  it('숫자 id 를 문자열로 정규화한다(회원번호는 숫자로 온다)', () => {
    expect(parseKakaoProfileResponse({ id: 1234567890 })).toEqual({ id: '1234567890', nickname: null });
  });

  it('닉네임은 kakao_account.profile.nickname 을 우선한다', () => {
    const parsed = parseKakaoProfileResponse({
      id: 1,
      kakao_account: { profile: { nickname: '계정닉' } },
      properties: { nickname: '프로퍼티닉' }
    });
    expect(parsed).toEqual({ id: '1', nickname: '계정닉' });
  });

  it('kakao_account 가 없으면 properties.nickname 으로 폴백한다', () => {
    expect(parseKakaoProfileResponse({ id: 2, properties: { nickname: '프로퍼티닉' } })).toEqual({
      id: '2',
      nickname: '프로퍼티닉'
    });
  });

  it('닉네임이 없거나 공백뿐이면 null (가입 트리거가 기본 닉네임을 만든다)', () => {
    expect(parseKakaoProfileResponse({ id: 3 })?.nickname).toBeNull();
    expect(parseKakaoProfileResponse({ id: 3, kakao_account: { profile: { nickname: '   ' } } })?.nickname).toBeNull();
    expect(parseKakaoProfileResponse({ id: 3, properties: { nickname: 42 } })?.nickname).toBeNull();
  });

  it('이메일은 응답에 있어도 절대 읽지 않는다(계정 병합 원인)', () => {
    const parsed = parseKakaoProfileResponse({
      id: 4,
      kakao_account: { email: 'someone@example.com', profile: { nickname: '닉', profile_image_url: 'http://x/y.png' } }
    });
    // 반환 객체에 id/nickname 외 필드가 없다 = 이메일·사진이 하류로 새지 않는다.
    expect(parsed).toEqual({ id: '4', nickname: '닉' });
    expect(Object.keys(parsed ?? {}).sort()).toEqual(['id', 'nickname']);
  });

  it('id 가 없거나 기형이면 null (→ 502)', () => {
    expect(parseKakaoProfileResponse({ kakao_account: { profile: { nickname: '닉' } } })).toBeNull();
    expect(parseKakaoProfileResponse({ id: '   ' })).toBeNull();
    expect(parseKakaoProfileResponse({ id: null })).toBeNull();
    expect(parseKakaoProfileResponse({ msg: 'invalid token', code: -401 })).toBeNull();
    expect(parseKakaoProfileResponse(null)).toBeNull();
  });
});

// ── 서버 분기 계약(handleKakaoAuth) ───────────────────────────────────────────

const PROFILE: KakaoProfile = { id: '999', nickname: '카카오유저' };

const makeDeps = (overrides: Partial<KakaoAuthDeps> = {}): KakaoAuthDeps => ({
  exchangeCodeForToken: vi.fn(async () => 'ACCESS_TOKEN'),
  fetchKakaoProfile: vi.fn(async () => PROFILE),
  issueMagicLink: vi.fn(async () => 'TOKEN_HASH'),
  ...overrides
});

const postRequest = (body: unknown): Request =>
  new Request('https://app.example/api/kakao-auth', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });

describe('handleKakaoAuth — 계약', () => {
  it('성공하면 200 + magiclink token_hash 를 돌려준다', async () => {
    const res = await handleKakaoAuth(postRequest({ code: 'C', state: 'S' }), makeDeps());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ token_hash: 'TOKEN_HASH', type: 'magiclink' });
  });

  it('POST 가 아니면 405', async () => {
    const res = await handleKakaoAuth(
      new Request('https://app.example/api/kakao-auth', { method: 'GET' }),
      makeDeps()
    );

    expect(res.status).toBe(405);
    await expect(res.json()).resolves.toEqual({ error: 'method_not_allowed' });
  });

  it('code 또는 state 가 없으면 400 (state 는 CSRF 게이트라 필수)', async () => {
    for (const body of [{ code: 'C' }, { state: 'S' }, { code: '', state: 'S' }, { code: 'C', state: '  ' }, {}]) {
      const res = await handleKakaoAuth(postRequest(body), makeDeps());
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({ error: 'invalid_request' });
    }
  });

  it('본문이 JSON 이 아니면 400', async () => {
    const res = await handleKakaoAuth(
      new Request('https://app.example/api/kakao-auth', { method: 'POST', body: 'not-json' }),
      makeDeps()
    );

    expect(res.status).toBe(400);
  });

  it('토큰 교환 실패(null·throw)는 502 kakao_exchange_failed', async () => {
    const nulled = await handleKakaoAuth(
      postRequest({ code: 'C', state: 'S' }),
      makeDeps({ exchangeCodeForToken: async () => null })
    );
    expect(nulled.status).toBe(502);
    await expect(nulled.json()).resolves.toEqual({ error: 'kakao_exchange_failed' });

    const thrown = await handleKakaoAuth(
      postRequest({ code: 'C', state: 'S' }),
      makeDeps({
        exchangeCodeForToken: async () => {
          throw new Error('network down');
        }
      })
    );
    expect(thrown.status).toBe(502);
    await expect(thrown.json()).resolves.toEqual({ error: 'kakao_exchange_failed' });
  });

  it('프로필 실패/ id 없음은 502 kakao_profile_failed', async () => {
    const res = await handleKakaoAuth(
      postRequest({ code: 'C', state: 'S' }),
      makeDeps({ fetchKakaoProfile: async () => null })
    );

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({ error: 'kakao_profile_failed' });
  });

  it('세션 발급 실패는 500 — 성공으로 위장하지 않는다', async () => {
    const res = await handleKakaoAuth(
      postRequest({ code: 'C', state: 'S' }),
      makeDeps({ issueMagicLink: async () => null })
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'session_issue_failed' });
  });

  it('실패 응답에 비밀값(인가코드·access token·client_secret·token_hash)이 실리지 않는다', async () => {
    const bodies = await Promise.all(
      [
        makeDeps({ exchangeCodeForToken: async () => null }),
        makeDeps({ fetchKakaoProfile: async () => null }),
        makeDeps({ issueMagicLink: async () => null })
      ].map(async (deps) => (await handleKakaoAuth(postRequest({ code: 'SECRET_CODE', state: 'S' }), deps)).text())
    );

    for (const body of bodies) {
      expect(body).not.toContain('SECRET_CODE');
      expect(body).not.toContain('ACCESS_TOKEN');
      expect(body).not.toContain('TOKEN_HASH');
      // 에러 본문은 고정 코드 문자열 하나뿐이다.
      expect(Object.keys(JSON.parse(body))).toEqual(['error']);
    }
  });

  it('state 는 카카오 토큰 교환에 전달하지 않는다(카카오 token 엔드포인트가 요구하지 않음)', async () => {
    const deps = makeDeps();
    await handleKakaoAuth(postRequest({ code: 'C', state: 'S' }), deps);

    expect(deps.exchangeCodeForToken).toHaveBeenCalledWith('C');
  });

  it('같은 카카오 id 로 두 번 로그인하면 같은 신원으로 세션을 발급한다(멱등 find-or-create)', async () => {
    // 서버는 카카오 id 만 신원 키로 넘긴다 — 두 번째 로그인에서 닉네임이 바뀌어도 id 가 같으면
    // 같은 합성 이메일(= 같은 사용자)로 수렴한다. 이메일은 어느 쪽에도 개입하지 않는다.
    const seen: KakaoProfile[] = [];
    const issueMagicLink = async (profile: KakaoProfile) => {
      seen.push(profile);
      return 'TOKEN_HASH';
    };
    const first = makeDeps({ issueMagicLink });
    const second = makeDeps({
      issueMagicLink,
      fetchKakaoProfile: async () => ({ id: PROFILE.id, nickname: '닉네임바꿈' })
    });

    await handleKakaoAuth(postRequest({ code: 'C1', state: 'S1' }), first);
    await handleKakaoAuth(postRequest({ code: 'C2', state: 'S2' }), second);

    const emails = seen.map((profile) => buildKakaoSyntheticEmail(profile.id, 'kakao-oauth.snowball.invalid'));
    expect(seen.map((profile) => profile.id)).toEqual([PROFILE.id, PROFILE.id]);
    expect(emails).toEqual(['kakao_999@kakao-oauth.snowball.invalid', 'kakao_999@kakao-oauth.snowball.invalid']);
  });
});
