import { describe, expect, it } from 'vitest';
import { getSupabaseClient, isCommunityEnabled, readCommunityEnv, requireSupabaseClient } from '@/shared/lib/supabase';

/**
 * 이 앱의 핵심 불변식: **환경변수가 없으면 커뮤니티는 존재하지 않는다.**
 * (백엔드 없는 정적 배포가 이 앱의 강점 — 커뮤니티는 덧붙이는 기능이다)
 */
describe('readCommunityEnv', () => {
  it('URL과 anon 키가 둘 다 있으면 설정을 반환한다', () => {
    expect(
      readCommunityEnv({
        VITE_SUPABASE_URL: 'https://proj.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'anon-key'
      })
    ).toEqual({ url: 'https://proj.supabase.co', anonKey: 'anon-key' });
  });

  it('신형 publishable 키 이름도 받는다 (Supabase 대시보드가 키 발급 방식을 바꿨다)', () => {
    expect(
      readCommunityEnv({
        VITE_SUPABASE_URL: 'https://proj.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_abc'
      })
    ).toEqual({ url: 'https://proj.supabase.co', anonKey: 'sb_publishable_abc' });
  });

  it('둘 다 있으면 신형 publishable 키를 쓴다', () => {
    expect(
      readCommunityEnv({
        VITE_SUPABASE_URL: 'https://proj.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_abc',
        VITE_SUPABASE_ANON_KEY: 'legacy-anon'
      })
    ).toEqual({ url: 'https://proj.supabase.co', anonKey: 'sb_publishable_abc' });
  });

  it('둘 다 없으면 null', () => {
    expect(readCommunityEnv({})).toBeNull();
  });

  it('하나만 있으면 null — 설정 실수를 "반쯤 켜진 상태"로 두지 않는다', () => {
    expect(readCommunityEnv({ VITE_SUPABASE_URL: 'https://proj.supabase.co' })).toBeNull();
    expect(readCommunityEnv({ VITE_SUPABASE_ANON_KEY: 'anon-key' })).toBeNull();
  });

  it('빈 문자열/공백은 값으로 치지 않는다 (CI에서 빈 변수를 주입하는 흔한 실수)', () => {
    expect(readCommunityEnv({ VITE_SUPABASE_URL: '   ', VITE_SUPABASE_ANON_KEY: 'anon-key' })).toBeNull();
    expect(readCommunityEnv({ VITE_SUPABASE_URL: 'https://proj.supabase.co', VITE_SUPABASE_ANON_KEY: '' })).toBeNull();
  });

  it('문자열이 아닌 값은 무시한다', () => {
    expect(readCommunityEnv({ VITE_SUPABASE_URL: 123, VITE_SUPABASE_ANON_KEY: true })).toBeNull();
  });

  it('앞뒤 공백을 제거한다', () => {
    expect(
      readCommunityEnv({
        VITE_SUPABASE_URL: '  https://proj.supabase.co  ',
        VITE_SUPABASE_ANON_KEY: '  anon-key  '
      })
    ).toEqual({ url: 'https://proj.supabase.co', anonKey: 'anon-key' });
  });
});

describe('환경변수가 없을 때 (현재 테스트/기본 배포 환경)', () => {
  it('커뮤니티가 비활성이다', () => {
    expect(isCommunityEnabled).toBe(false);
  });

  it('getSupabaseClient()는 null을 준다 — SDK를 내려받지도 않는다', async () => {
    await expect(getSupabaseClient()).resolves.toBeNull();
  });

  it('requireSupabaseClient()는 명시적으로 던진다 (조용히 실패하지 않는다)', async () => {
    await expect(requireSupabaseClient()).rejects.toThrow(/커뮤니티 기능이 비활성화/);
  });
});
