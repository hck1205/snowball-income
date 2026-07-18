import { describe, expect, it, vi } from 'vitest';
import { signInWithOAuth, type CommunityClient } from '@/shared/lib/supabase';

/**
 * OAuth scope 계약. 프로필 사진 기능 제거로 **카카오는 닉네임만** 요청한다(profile_image 제거).
 * 구글은 기본 scope(이메일·프로필)로 충분해 별도 지정하지 않는다(undefined).
 *
 * scope 를 늘리면 카카오 콘솔 동의항목과 어긋나 로그인이 막힐 수 있으므로(KOE 계열),
 * 이 단정으로 회귀를 막는다.
 */
const makeClient = () => {
  const signInSpy = vi.fn(async () => ({ error: null }));
  const client = { auth: { signInWithOAuth: signInSpy } } as unknown as CommunityClient;
  return { client, signInSpy };
};

describe('signInWithOAuth — scope', () => {
  it('카카오는 profile_nickname 만 요청한다 (profile_image 미요청)', async () => {
    const { client, signInSpy } = makeClient();

    await signInWithOAuth(client, 'kakao', 'https://app.example/community');

    expect(signInSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'kakao',
        options: expect.objectContaining({ scopes: 'profile_nickname' })
      })
    );
  });

  it('구글은 scope 를 지정하지 않는다 (기본 scope 사용)', async () => {
    const { client, signInSpy } = makeClient();

    await signInWithOAuth(client, 'google', 'https://app.example/community');

    expect(signInSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google',
        options: expect.objectContaining({ scopes: undefined })
      })
    );
  });
});

/**
 * 네이버 라우팅 계약. 네이버는 Supabase 기본 프로바이더가 아니다 — `signInWithOAuth` 에 'naver' 를
 * 흘리면 Supabase 가 타입·런타임 모두에서 거부한다. auth.ts 의 provider==='naver' 분기가 이를 가로채
 * `startNaverLogin`(우리 authorize 리다이렉트)으로 보내므로, client.auth.signInWithOAuth 는 **절대**
 * 호출되면 안 된다(네이버 code 가 Supabase 로 새면 로그인이 깨진다). 테스트 env 는 client_id 미설정이라
 * startNaverLogin 이 리다이렉트 없이 no-op → 이 단정만 남는다.
 */
describe('signInWithOAuth — 네이버 라우팅', () => {
  it("'naver' 는 Supabase signInWithOAuth 로 새지 않는다", async () => {
    const { client, signInSpy } = makeClient();

    await signInWithOAuth(client, 'naver', 'https://app.example/community');

    expect(signInSpy).not.toHaveBeenCalled();
  });
});
