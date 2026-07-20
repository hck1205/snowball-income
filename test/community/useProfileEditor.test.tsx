import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { CommunityAuthContext } from '@/components/community/CommunityAuthProvider/CommunityAuthProvider.context';
import type { CommunityAuthContextValue } from '@/components/community/CommunityAuthProvider/CommunityAuthProvider.context';

/**
 * 편집 로직을 훅 수준에서 구동한다: 검증 경계는 **요청을 보내지 않고**(updateMyProfile 미호출),
 * 실패는 원인별 카피로 구분한다. supabase IO 만 목킹하고, 닉네임 검증은 실제 코드.
 */

vi.mock('@/shared/lib/supabase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/supabase')>();
  return {
    ...actual,
    getSupabaseClient: vi.fn(async () => ({}) as unknown),
    updateMyProfile: vi.fn(async () => {})
  };
});

// GA4 발화만 스파이한다(cloudSyncAnalytics.test 패턴). ANALYTICS_EVENT 상수는 실제 값 유지.
vi.mock('@/shared/lib/analytics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/analytics')>();
  return { ...actual, trackEvent: vi.fn() };
});

const { useProfileEditor } = await import('@/pages/Community/CommunityProfilePage/hooks/useProfileEditor');
const supa = await import('@/shared/lib/supabase');
const { sessionAtom, profileAtom } = await import('@/jotai/community');
const { ANALYTICS_EVENT, trackEvent } = await import('@/shared/lib/analytics');

const p = COMMUNITY_COPY.profile;

const makeSession = (): Session =>
  ({
    access_token: 'tok',
    user: { id: 'user-1', email: 'user@gmail.com', app_metadata: { provider: 'google' } }
  }) as unknown as Session;

const makeAuth = (over: Partial<CommunityAuthContextValue> = {}): CommunityAuthContextValue => ({
  authReady: true,
  openLoginPrompt: vi.fn(),
  login: vi.fn(async () => {}),
  logout: vi.fn(async () => {}),
  refreshProfile: vi.fn(async () => {}),
  ...over
});

const setup = (over: { auth?: CommunityAuthContextValue } = {}) => {
  const store = createStore();
  store.set(sessionAtom, makeSession());
  store.set(profileAtom, {
    id: 'user-1',
    display_name: '스노우볼러',
    avatar_url: null,
    is_admin: false
  });
  const auth = over.auth ?? makeAuth();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter>
      <Provider store={store}>
        <CommunityAuthContext.Provider value={auth}>{children}</CommunityAuthContext.Provider>
      </Provider>
    </MemoryRouter>
  );
  const view = renderHook(() => useProfileEditor(), { wrapper });
  return { ...view, auth };
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useProfileEditor — 닉네임 검증 경계', () => {
  it('2자 미만이면 요청을 보내지 않고 길이 에러를 세운다', async () => {
    const { result } = setup();

    await act(async () => {
      result.current.nickname.onChange('a');
    });
    await act(async () => {
      result.current.nickname.onSave();
    });

    expect(supa.updateMyProfile).not.toHaveBeenCalled();
    expect(result.current.nickname.error).toBe(p.errorNicknameLength);
  });

  it('유효한 새 닉네임은 trim 값으로 저장하고 성공 후 재조회한다', async () => {
    const auth = makeAuth();
    const { result } = setup({ auth });

    await act(async () => {
      result.current.nickname.onChange('  새이름  ');
    });
    await act(async () => {
      result.current.nickname.onSave();
    });

    await waitFor(() => expect(result.current.nickname.saved).toBe(true));
    expect(supa.updateMyProfile).toHaveBeenCalledWith(expect.anything(), 'user-1', {
      displayName: '새이름'
    });
    expect(auth.refreshProfile).toHaveBeenCalledTimes(1);
  });
});

describe('useProfileEditor — analytics 발화 (성공 경로에서만)', () => {
  it('닉네임은 저장 성공 시에만 profile_updated(nickname)를 발화한다 (검증 실패 시 미발화)', async () => {
    const { result } = setup();

    // 검증 실패(2자 미만) — 요청도 계측도 없다.
    await act(async () => {
      result.current.nickname.onChange('a');
    });
    await act(async () => {
      result.current.nickname.onSave();
    });
    expect(trackEvent).not.toHaveBeenCalled();

    // 유효한 변경 후 저장 — 성공 시에만 발화.
    await act(async () => {
      result.current.nickname.onChange('새이름');
    });
    await act(async () => {
      result.current.nickname.onSave();
    });
    await waitFor(() => expect(result.current.nickname.saved).toBe(true));
    expect(trackEvent).toHaveBeenCalledWith(ANALYTICS_EVENT.PROFILE_UPDATED, { field: 'nickname' });
  });

  it('탈퇴 다이얼로그 진입 시 account_delete_started를 발화한다', async () => {
    const { result } = setup();

    await act(async () => {
      result.current.deletion.onStart();
    });

    expect(trackEvent).toHaveBeenCalledWith(ANALYTICS_EVENT.ACCOUNT_DELETE_STARTED);
  });

  it('탈퇴는 200 응답에서만 account_deleted를 발화한다 (실패 응답엔 미발화·로그아웃 안 함)', async () => {
    // 실패(500): onDeleted 미실행 → account_deleted 미발화.
    vi.stubGlobal('fetch', vi.fn(async () => ({ status: 500 }) as Response));
    const failAuth = makeAuth();
    const fail = setup({ auth: failAuth });

    await act(async () => {
      fail.result.current.deletion.onConfirm();
    });

    await waitFor(() => expect(fail.result.current.deletion.error).toBeTruthy());
    expect(trackEvent).not.toHaveBeenCalledWith(ANALYTICS_EVENT.ACCOUNT_DELETED);
    expect(failAuth.logout).not.toHaveBeenCalled();

    vi.mocked(trackEvent).mockClear();

    // 성공(200): onDeleted 실행 → account_deleted 발화 + 로그아웃.
    vi.stubGlobal('fetch', vi.fn(async () => ({ status: 200 }) as Response));
    const okAuth = makeAuth();
    const ok = setup({ auth: okAuth });

    await act(async () => {
      ok.result.current.deletion.onConfirm();
    });

    await waitFor(() => expect(okAuth.logout).toHaveBeenCalledTimes(1));
    expect(trackEvent).toHaveBeenCalledWith(ANALYTICS_EVENT.ACCOUNT_DELETED);
  });
});
