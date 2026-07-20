import { describe, expect, it } from 'vitest';
import { hasOAuthCallbackParams, readOAuthCallbackError, sanitizeOAuthRedirectTo } from '@/shared/lib/supabase';

/**
 * OAuth 콜백 감지 순수 함수.
 *
 * 이 함수가 엔트리(main.tsx)에서 콜백을 잡아 supabase 를 이르게 당긴다 — lazy 커뮤니티
 * 라우트에서도 코드 교환이 늦지 않게 하는 핵심. 오탐/미탐 둘 다 위험하므로(오탐=불필요한 SDK 로드,
 * 미탐=버그 재발) 앱이 실제로 쓰는 쿼리 키와의 경계를 함께 고정한다.
 */
describe('hasOAuthCallbackParams', () => {
  describe('PKCE 성공 (쿼리 ?code=)', () => {
    it('쿼리의 code 를 감지한다', () => {
      expect(hasOAuthCallbackParams('?code=abc123', '')).toBe(true);
    });

    it('앞의 ? 가 없어도 감지한다', () => {
      expect(hasOAuthCallbackParams('code=abc123', '')).toBe(true);
    });

    it('다른 파라미터와 섞여 있어도 감지한다', () => {
      expect(hasOAuthCallbackParams('?foo=1&code=abc&bar=2', '')).toBe(true);
    });
  });

  describe('암묵적(implicit) 흐름 (해시 #access_token=)', () => {
    it('해시의 access_token 을 감지한다', () => {
      expect(hasOAuthCallbackParams('', '#access_token=xyz&expires_in=3600')).toBe(true);
    });

    it('앞의 # 가 없어도 감지한다', () => {
      expect(hasOAuthCallbackParams('', 'access_token=xyz')).toBe(true);
    });
  });

  describe('오류 리다이렉트 (error*)', () => {
    it('쿼리의 error 를 감지한다 (사용자 거부 등)', () => {
      expect(hasOAuthCallbackParams('?error=access_denied&error_code=user_denied', '')).toBe(true);
    });

    it('해시의 error_description 을 감지한다', () => {
      expect(hasOAuthCallbackParams('', '#error_description=something%20went%20wrong')).toBe(true);
    });
  });

  describe('콜백이 아닌 URL — 오탐 없음', () => {
    it('빈 search/hash', () => {
      expect(hasOAuthCallbackParams('', '')).toBe(false);
    });

    it('공유 링크(?share=…&sv=…)를 콜백으로 오인하지 않는다', () => {
      expect(hasOAuthCallbackParams('?share=eNabc123&sv=3', '')).toBe(false);
    });

    it('갤러리 파라미터(?sort=…&q=…&qf=…)를 콜백으로 오인하지 않는다', () => {
      expect(hasOAuthCallbackParams('?sort=popular&q=배당&qf=title', '')).toBe(false);
    });

    it('라우트 해시(#main-content 스킵링크)를 콜백으로 오인하지 않는다', () => {
      expect(hasOAuthCallbackParams('', '#main-content')).toBe(false);
    });

    it('code 를 부분 문자열로 포함하는 다른 키에 걸리지 않는다', () => {
      expect(hasOAuthCallbackParams('?share_code=nope&encoded=1', '')).toBe(false);
    });
  });
});

/**
 * redirectTo 정규화 — 재로그인 실패(로그인→로그아웃→재로그인 안 됨) 방지의 핵심.
 * 잔여 해시가 다음 콜백 URL 을 `…/#?code=…` 로 어긋나게 하는 것을 원천 차단하고, 앱 파라미터는 보존한다.
 */
describe('sanitizeOAuthRedirectTo', () => {
  it('잔여 해시(빈 #)를 제거한다', () => {
    expect(sanitizeOAuthRedirectTo('https://snowball.app/#')).toBe('https://snowball.app/');
  });

  it('implicit 토큰 잔재 해시를 제거한다', () => {
    expect(sanitizeOAuthRedirectTo('https://snowball.app/community#access_token=xyz&expires_in=3600')).toBe(
      'https://snowball.app/community'
    );
  });

  it('직전 실패의 OAuth 쿼리 잔재(code/error*)를 제거한다', () => {
    expect(sanitizeOAuthRedirectTo('https://snowball.app/?code=abc&error=denied')).toBe('https://snowball.app/');
  });

  it('앱 고유 파라미터(share/s/sort/q)는 보존한다', () => {
    expect(sanitizeOAuthRedirectTo('https://snowball.app/?s=KEY22&sort=popular')).toBe(
      'https://snowball.app/?s=KEY22&sort=popular'
    );
  });

  it('OAuth 잔재만 걷어내고 앱 파라미터는 남긴다(혼재)', () => {
    expect(sanitizeOAuthRedirectTo('https://snowball.app/community?q=dividend&code=abc#access_token=z')).toBe(
      'https://snowball.app/community?q=dividend'
    );
  });

  it('해시도 OAuth 쿼리도 없으면 그대로 둔다', () => {
    expect(sanitizeOAuthRedirectTo('https://snowball.app/?share=eNabc&sv=3')).toBe(
      'https://snowball.app/?share=eNabc&sv=3'
    );
  });

  it('파싱 불가한 입력은 원본을 그대로 반환한다(안전 실패)', () => {
    expect(sanitizeOAuthRedirectTo('not a url')).toBe('not a url');
  });
});

/**
 * 콜백 오류 판독 — supabase-js 가 조용히 삼키는 실패를 우리가 직접 읽어 표면화하기 위한 순수 함수.
 */
describe('readOAuthCallbackError', () => {
  it('쿼리의 error/error_code/error_description 를 읽는다', () => {
    expect(readOAuthCallbackError('?error=access_denied&error_code=user_cancelled&error_description=denied', '')).toEqual(
      { code: 'user_cancelled', description: 'denied' }
    );
  });

  it('해시(implicit)의 오류도 읽는다', () => {
    expect(readOAuthCallbackError('', '#error=server_error&error_description=boom')).toEqual({
      code: 'server_error',
      description: 'boom'
    });
  });

  it('error_code 가 없으면 error 를 code 로 쓴다', () => {
    expect(readOAuthCallbackError('?error=temporarily_unavailable', '')).toEqual({
      code: 'temporarily_unavailable',
      description: 'temporarily_unavailable'
    });
  });

  it('쿼리를 해시보다 우선한다', () => {
    expect(readOAuthCallbackError('?error_code=from_query', '#error_code=from_hash')).toEqual({
      code: 'from_query',
      description: ''
    });
  });

  it('오류 파라미터가 없으면 null(성공/일반 콜백)', () => {
    expect(readOAuthCallbackError('?code=abc', '')).toBeNull();
    expect(readOAuthCallbackError('', '#access_token=xyz')).toBeNull();
    expect(readOAuthCallbackError('', '')).toBeNull();
  });
});
