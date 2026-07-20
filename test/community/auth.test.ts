import { describe, expect, it, vi } from 'vitest';
import { fetchMyProfile, signInWithOAuth, type CommunityClient } from '@/shared/lib/supabase';

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

/**
 * `fetchMyProfile` — 관리자 플래그(is_admin)의 **컬럼 부재 내성**.
 *
 * is_admin 은 마이그레이션 20260725000000 이 실행되기 전에는 DB 에 없다. 없는 컬럼을
 * select 목록에 나열하면 PostgREST 가 42703 으로 쿼리 전체를 실패시켜 프로필 조회가
 * 통째로 죽는다(로그인/프로필 화면 붕괴). 그래서 select 는 `*` 를 쓰고 응답에서만 읽는다.
 * 이 스위트가 그 두 계약(= select 인자 / 부재 시 false)을 못 박는다.
 */
const makeProfileClient = (row: unknown) => {
  const selectSpy = vi.fn(() => ({
    eq: () => ({ maybeSingle: async () => ({ data: row, error: null }) })
  }));
  const client = { from: () => ({ select: selectSpy }) } as unknown as CommunityClient;
  return { client, selectSpy };
};

describe('fetchMyProfile — is_admin', () => {
  it("select 는 컬럼을 나열하지 않고 '*' 를 쓴다 (마이그레이션 전 42703 회피)", async () => {
    const { client, selectSpy } = makeProfileClient({ id: 'u1', display_name: 'n', avatar_url: null });

    await fetchMyProfile(client, 'u1');

    expect(selectSpy).toHaveBeenCalledWith('*');
  });

  it('컬럼이 없는 응답(마이그레이션 전)은 일반 사용자(false)로 떨어진다', async () => {
    const { client } = makeProfileClient({ id: 'u1', display_name: 'n', avatar_url: null });

    await expect(fetchMyProfile(client, 'u1')).resolves.toEqual({
      id: 'u1',
      display_name: 'n',
      avatar_url: null,
      is_admin: false
    });
  });

  it('is_admin=true 만 관리자다 (null·비불리언은 false)', async () => {
    const base = { id: 'u1', display_name: 'n', avatar_url: null };

    const admin = await fetchMyProfile(makeProfileClient({ ...base, is_admin: true }).client, 'u1');
    expect(admin?.is_admin).toBe(true);

    const nulled = await fetchMyProfile(makeProfileClient({ ...base, is_admin: null }).client, 'u1');
    expect(nulled?.is_admin).toBe(false);

    // 다른 클라이언트/스키마 드리프트로 문자열이 와도 관리자로 승격되지 않는다.
    const truthy = await fetchMyProfile(makeProfileClient({ ...base, is_admin: 'true' }).client, 'u1');
    expect(truthy?.is_admin).toBe(false);
  });

  it('프로필 행이 없으면 null (기존 계약 불변)', async () => {
    const { client } = makeProfileClient(null);
    await expect(fetchMyProfile(client, 'u1')).resolves.toBeNull();
  });
});
