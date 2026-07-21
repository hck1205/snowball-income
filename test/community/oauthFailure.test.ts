import { describe, expect, it } from 'vitest';
import {
  buildKakaoOpenExternalUrl,
  buildNextOAuthLoginFailure,
  detectInAppBrowser,
  parseOAuthLoginFailure,
  selectOAuthFailureGuidance,
  type OAuthLoginFailure
} from '@/shared/lib/supabase';

/**
 * OAuth 콜백 실패 판정·안내 선택의 순수 함수.
 *
 * 프로덕션 장애(iOS 카카오 로그인 무한 루프)의 대응 층 — "돌아왔는데 로그인이 안 된" 실패를 감지·기록하고,
 * 인앱 브라우저 컨텍스트 분리가 원인일 때 "다른 브라우저로 열기"를 안내한다. 실기기 없이 고정 가능한 건
 * 이 순수 부품들뿐이라(실 세션 교환·실 리다이렉트는 사용자 몫) 경계를 촘촘히 못 박는다.
 */

const base = (overrides: Partial<OAuthLoginFailure> = {}): OAuthLoginFailure => ({
  provider: 'kakao',
  reason: 'no_session',
  attempts: 1,
  inAppBrowser: 'none',
  contextSwitched: false,
  ...overrides
});

describe('detectInAppBrowser', () => {
  it('카카오톡 인앱 브라우저를 감지한다', () => {
    expect(
      detectInAppBrowser(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 KAKAOTALK 10.5.0'
      )
    ).toBe('kakaotalk');
  });

  it('네이버앱 인앱 브라우저를 감지한다', () => {
    expect(detectInAppBrowser('Mozilla/5.0 ... NAVER(inapp; search; 1234; 12.0.0)')).toBe('naver');
  });

  it('라인/인스타/페이스북을 감지한다', () => {
    expect(detectInAppBrowser('... Line/12.0.0')).toBe('line');
    expect(detectInAppBrowser('... Instagram 300.0.0')).toBe('instagram');
    expect(detectInAppBrowser('... FBAN/FBIOS;FBAV/400.0')).toBe('facebook');
  });

  it('일반 사파리/크롬은 none', () => {
    expect(detectInAppBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 Version/17.0 Safari')).toBe(
      'none'
    );
    expect(detectInAppBrowser('')).toBe('none');
  });
});

describe('buildKakaoOpenExternalUrl', () => {
  it('현재 href 를 카카오 공식 스킴으로 감싼다(url 파라미터는 encodeURIComponent)', () => {
    expect(buildKakaoOpenExternalUrl('https://snowball.example/community')).toBe(
      'kakaotalk://web/openExternal?url=' + encodeURIComponent('https://snowball.example/community')
    );
    expect(buildKakaoOpenExternalUrl('https://snowball.example/community')).toBe(
      'kakaotalk://web/openExternal?url=https%3A%2F%2Fsnowball.example%2Fcommunity'
    );
  });

  it('쿼리·해시·한글이 섞인 href 의 &, #, =, 한글을 모두 퍼센트 인코딩한다(스킴 파싱이 깨지지 않도록)', () => {
    const href = 'https://snowball.example/community?share=x&sv=1#후기';
    const result = buildKakaoOpenExternalUrl(href);

    // 인코딩된 url 파라미터를 되돌리면 원본과 정확히 같다(왕복 무손실).
    expect(result.startsWith('kakaotalk://web/openExternal?url=')).toBe(true);
    const encoded = result.slice('kakaotalk://web/openExternal?url='.length);
    expect(decodeURIComponent(encoded)).toBe(href);

    // 구분자(&, #, =)와 한글이 raw 로 새지 않는다.
    expect(encoded).toContain('%26'); // &
    expect(encoded).toContain('%23'); // #
    expect(encoded).toContain('%3D'); // =
    expect(encoded).not.toContain('&');
    expect(encoded).not.toContain('#');
    expect(encoded).not.toContain('후기');
  });
});

describe('buildNextOAuthLoginFailure', () => {
  it('첫 실패는 attempts=1', () => {
    expect(buildNextOAuthLoginFailure(null, base()).attempts).toBe(1);
  });

  it('같은 프로바이더 연속 실패는 누적한다', () => {
    const first = buildNextOAuthLoginFailure(null, base());
    const second = buildNextOAuthLoginFailure(first, base());
    expect(second.attempts).toBe(2);
  });

  it('프로바이더가 바뀌면 1로 리셋한다(구글 실패 뒤 카카오 실패를 2연속으로 세지 않는다)', () => {
    const google = buildNextOAuthLoginFailure(null, base({ provider: 'google' }));
    const kakao = buildNextOAuthLoginFailure(google, base({ provider: 'kakao' }));
    expect(kakao.attempts).toBe(1);
  });
});

describe('parseOAuthLoginFailure', () => {
  it('정상 기록을 판독한다', () => {
    const raw = JSON.stringify(base({ inAppBrowser: 'kakaotalk', contextSwitched: true, errorCode: 'x' }));
    expect(parseOAuthLoginFailure(raw)).toEqual(
      base({ inAppBrowser: 'kakaotalk', contextSwitched: true, errorCode: 'x' })
    );
  });

  it('나중에 추가된 필드가 없는 구 기록도 기본값으로 연다(하위 호환)', () => {
    const legacy = JSON.stringify({ provider: 'kakao', reason: 'no_session', attempts: 1 });
    expect(parseOAuthLoginFailure(legacy)).toEqual(base());
  });

  it('형태가 깨졌으면 null(안내 때문에 로그인 흐름이 막히면 안 됨)', () => {
    expect(parseOAuthLoginFailure(null)).toBeNull();
    expect(parseOAuthLoginFailure('not json')).toBeNull();
    expect(parseOAuthLoginFailure('{}')).toBeNull();
    expect(parseOAuthLoginFailure(JSON.stringify({ provider: 'kakao', reason: 'bogus', attempts: 1 }))).toBeNull();
    expect(parseOAuthLoginFailure(JSON.stringify({ provider: 'kakao', reason: 'no_session', attempts: 0 }))).toBeNull();
  });
});

describe('selectOAuthFailureGuidance', () => {
  it('인앱 브라우저가 감지되면 "다른 브라우저로 열기" 안내', () => {
    expect(selectOAuthFailureGuidance(base({ inAppBrowser: 'kakaotalk' }))).toBe('in-app-browser');
  });

  it('세션 미생성 + 컨텍스트 전환이면 인앱 안내(UA 미매칭이어도)', () => {
    expect(selectOAuthFailureGuidance(base({ reason: 'no_session', contextSwitched: true }))).toBe('in-app-browser');
  });

  it('세션 미생성이 2회 이상 누적되면 인앱 안내로 승격', () => {
    expect(selectOAuthFailureGuidance(base({ reason: 'no_session', attempts: 2 }))).toBe('in-app-browser');
  });

  it('프로바이더 오류(취소 등)는 브라우저 탓이 아니므로 일반 안내', () => {
    expect(selectOAuthFailureGuidance(base({ reason: 'provider_error', attempts: 3, contextSwitched: true }))).toBe(
      'generic'
    );
  });

  it('첫 세션 미생성이고 컨텍스트 전환도 없으면 일반 안내', () => {
    expect(selectOAuthFailureGuidance(base({ reason: 'no_session', attempts: 1, contextSwitched: false }))).toBe(
      'generic'
    );
  });
});
