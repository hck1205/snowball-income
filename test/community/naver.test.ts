import { describe, expect, it } from 'vitest';
import {
  appendNaverLoginError,
  buildNaverAuthorizeUrl,
  isNaverCallbackPath,
  isNaverEnabled,
  NAVER_CALLBACK_PATH,
  readNaverCallbackParams,
  readNaverLoginError,
  stripNaverLoginError
} from '@/shared/lib/supabase';

/**
 * 네이버 로그인 seam 순수 함수 계약.
 *
 * 네이버는 Supabase 기본 프로바이더가 아니라 authorize 리다이렉트 + 서버 교환(/api/naver-auth)을
 * 우리가 직접 태운다. 그 흐름의 뼈대인 순수 함수(콜백 경로 판정·파라미터 추출·실패 플래그 왕복·
 * authorize URL 조립)를 env 무관하게 고정한다. 실동작(startNaverLogin/completeNaverCallback)은
 * 리다이렉트/서버 왕복이라 유닛에서 다루지 않는다.
 */
describe('네이버 seam — 순수 함수', () => {
  it('테스트 기본 env(백엔드 없는 배포)에서는 isNaverEnabled=false', () => {
    // vitest.config 가 커뮤니티/네이버 변수를 비워 "백엔드 없는 기본 배포"로 고정한다.
    // → 로그인 게이트의 네이버 버튼은 렌더되지 않는다(config-gated).
    expect(isNaverEnabled).toBe(false);
  });

  describe('isNaverCallbackPath', () => {
    it('콜백 경로를 정확히 인식한다', () => {
      expect(isNaverCallbackPath(NAVER_CALLBACK_PATH)).toBe(true);
      expect(isNaverCallbackPath('/community/auth/naver/callback')).toBe(true);
    });

    it('다른 경로는 콜백이 아니다', () => {
      expect(isNaverCallbackPath('/community')).toBe(false);
      expect(isNaverCallbackPath('/')).toBe(false);
      expect(isNaverCallbackPath('/community/auth/naver')).toBe(false);
    });
  });

  describe('readNaverCallbackParams', () => {
    it('code+state 가 둘 다 있으면 추출한다(앞의 ? 유무 무관)', () => {
      expect(readNaverCallbackParams('?code=abc&state=xyz')).toEqual({ code: 'abc', state: 'xyz' });
      expect(readNaverCallbackParams('code=abc&state=xyz')).toEqual({ code: 'abc', state: 'xyz' });
    });

    it('하나라도 없으면 null(무효 콜백)', () => {
      expect(readNaverCallbackParams('?code=abc')).toBeNull();
      expect(readNaverCallbackParams('?state=xyz')).toBeNull();
      expect(readNaverCallbackParams('')).toBeNull();
    });
  });

  describe('buildNaverAuthorizeUrl', () => {
    it('response_type=code + client_id + redirect_uri + state 를 실은 authorize URL 을 만든다', () => {
      const url = new URL(
        buildNaverAuthorizeUrl('CID', 'https://app.example/community/auth/naver/callback', 'ST8')
      );
      expect(url.origin + url.pathname).toBe('https://nid.naver.com/oauth2.0/authorize');
      expect(url.searchParams.get('response_type')).toBe('code');
      expect(url.searchParams.get('client_id')).toBe('CID');
      expect(url.searchParams.get('redirect_uri')).toBe('https://app.example/community/auth/naver/callback');
      expect(url.searchParams.get('state')).toBe('ST8');
    });
  });

  describe('실패 플래그 왕복(appendNaverLoginError ↔ readNaverLoginError)', () => {
    it('붙였다 읽으면 실패로 감지된다', () => {
      const returnTo = appendNaverLoginError('/community');
      expect(readNaverLoginError(new URL(`https://app.example${returnTo}`).search)).toBe(true);
    });

    it('기존 쿼리를 보존하며 실패 플래그를 더한다', () => {
      const returnTo = appendNaverLoginError('/community?sort=recent');
      const search = new URL(`https://app.example${returnTo}`).search;
      expect(readNaverLoginError(search)).toBe(true);
      expect(new URLSearchParams(search).get('sort')).toBe('recent');
    });

    it('플래그가 없으면 실패가 아니다', () => {
      expect(readNaverLoginError('?sort=recent')).toBe(false);
      expect(readNaverLoginError('')).toBe(false);
    });
  });

  describe('stripNaverLoginError — 안내 확인 후 URL 정리', () => {
    it('naverLogin 플래그만 지우고 실패가 더는 감지되지 않는다', () => {
      const href = `https://app.example${appendNaverLoginError('/community')}`;
      const stripped = stripNaverLoginError(href);
      expect(readNaverLoginError(new URL(stripped).search)).toBe(false);
    });

    it('share/sv·정렬 등 다른 파라미터는 보존한다', () => {
      const href = `https://app.example${appendNaverLoginError('/community?sort=recent&share=eN1&sv=3')}`;
      const params = new URL(stripNaverLoginError(href)).searchParams;
      expect(params.get('naverLogin')).toBeNull();
      expect(params.get('sort')).toBe('recent');
      expect(params.get('share')).toBe('eN1');
      expect(params.get('sv')).toBe('3');
    });

    it('플래그가 없던 URL 은 그대로 두는 no-op 이다', () => {
      const params = new URL(stripNaverLoginError('https://app.example/community?sort=recent')).searchParams;
      expect(params.get('sort')).toBe('recent');
      expect(params.get('naverLogin')).toBeNull();
    });
  });
});
