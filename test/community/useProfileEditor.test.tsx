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
    updateMyProfile: vi.fn(async () => {}),
    // 기본은 "사용 가능" — 중복 시나리오는 각 테스트가 개별로 덮어쓴다.
    isNicknameTaken: vi.fn(async () => false)
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
    // 중복 검사(디바운스)를 통과해야 저장 버튼이 열린다.
    await waitFor(() => expect(result.current.nickname.canSave).toBe(true), { timeout: 3000 });
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

describe('useProfileEditor — 닉네임 중복 확인', () => {
  it('이미 쓰이는 닉네임이면 저장이 잠기고 사유를 알린다 (요청 미발생)', async () => {
    vi.mocked(supa.isNicknameTaken).mockResolvedValue(true);
    const { result } = setup();

    await act(async () => {
      result.current.nickname.onChange('중복이름');
    });

    await waitFor(() => expect(result.current.nickname.availability).toBe('taken'), { timeout: 3000 });
    expect(result.current.nickname.canSave).toBe(false);
    expect(result.current.nickname.error).toBe(p.errorNicknameTaken);

    // 잠긴 상태에서 굳이 저장을 눌러도 갱신 요청은 나가지 않는다.
    await act(async () => {
      result.current.nickname.onSave();
    });
    expect(supa.updateMyProfile).not.toHaveBeenCalled();
  });

  it('저장 직전 검사를 통과해도 DB 가 23505 로 거절하면 "이미 사용 중"으로 알린다', async () => {
    // 경합의 패자 시나리오 — 재확인과 update 사이에 다른 사람이 같은 닉네임을 확정했다.
    // UNIQUE 인덱스(profiles_display_name_lower_key)가 마지막에 막는다.
    vi.mocked(supa.isNicknameTaken).mockResolvedValue(false);
    vi.mocked(supa.updateMyProfile).mockRejectedValueOnce(
      Object.assign(new Error('duplicate key value violates unique constraint'), { code: '23505' })
    );
    const { result } = setup();

    await act(async () => {
      result.current.nickname.onChange('선점당한이름');
    });
    await waitFor(() => expect(result.current.nickname.canSave).toBe(true), { timeout: 3000 });
    await act(async () => {
      result.current.nickname.onSave();
    });

    // 네트워크 오류 카피로 뭉뚱그리지 않는다 — 사용자는 재시도가 아니라 다른 이름을 골라야 한다.
    await waitFor(() => expect(result.current.nickname.error).toBe(p.errorNicknameTaken));
    expect(result.current.nickname.availability).toBe('taken');
    expect(result.current.nickname.saved).toBe(false);
  });

  it('본인 id 는 검사에서 제외해 자기 닉네임과 충돌하지 않는다', async () => {
    const { result } = setup();

    await act(async () => {
      result.current.nickname.onChange('새이름');
    });

    await waitFor(() => expect(result.current.nickname.availability).toBe('available'), { timeout: 3000 });
    expect(supa.isNicknameTaken).toHaveBeenCalledWith(expect.anything(), '새이름', 'user-1');
  });

  it('검사가 실패하면 사용 가능으로 위장하지 않고 저장을 막는다', async () => {
    vi.mocked(supa.isNicknameTaken).mockRejectedValue(new Error('network'));
    const { result } = setup();

    await act(async () => {
      result.current.nickname.onChange('새이름');
    });

    await waitFor(() => expect(result.current.nickname.availability).toBe('failed'), { timeout: 3000 });
    expect(result.current.nickname.canSave).toBe(false);
    expect(result.current.nickname.error).toBe(p.errorNicknameCheckFailed);
  });

  it('검사 통과 뒤라도 저장 직전 재확인에서 선점되면 저장하지 않는다', async () => {
    // 디바운스 검사는 통과(false) → 저장 직전 재확인에서 선점(true).
    vi.mocked(supa.isNicknameTaken).mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const { result } = setup();

    await act(async () => {
      result.current.nickname.onChange('새이름');
    });
    await waitFor(() => expect(result.current.nickname.canSave).toBe(true), { timeout: 3000 });

    await act(async () => {
      result.current.nickname.onSave();
    });

    await waitFor(() => expect(result.current.nickname.error).toBe(p.errorNicknameTaken));
    expect(supa.updateMyProfile).not.toHaveBeenCalled();
    expect(result.current.nickname.saved).toBe(false);
  });

  it('입력이 다시 바뀌면 직전 검사 결과를 버린다 (미검사 값이 저장되지 않게)', async () => {
    const { result } = setup();

    await act(async () => {
      result.current.nickname.onChange('새이름');
    });
    await waitFor(() => expect(result.current.nickname.availability).toBe('available'), { timeout: 3000 });

    await act(async () => {
      result.current.nickname.onChange('또다른이름');
    });
    expect(result.current.nickname.canSave).toBe(false);
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
    await waitFor(() => expect(result.current.nickname.canSave).toBe(true), { timeout: 3000 });
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
