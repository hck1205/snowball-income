import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render } from '@testing-library/react';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { cloudSyncStateAtom } from '@/jotai/snowball/cloud';
import { useCloudSyncAnalytics } from '@/pages/Main/hooks';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';

vi.mock('@/shared/lib/analytics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/analytics')>();
  return { ...actual, trackEvent: vi.fn() };
});

function Probe() {
  useCloudSyncAnalytics();
  return null;
}

describe('useCloudSyncAnalytics — 상태 전이 계측 (엔진 순수, 경계에서 발화)', () => {
  beforeEach(() => vi.mocked(trackEvent).mockClear());

  it('idle 초기값은 전이가 아니라 무발화', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <Probe />
      </Provider>
    );
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('saved 전이 → cloud_save_completed, error 전이 → operation_error(cloud_save)', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <Probe />
      </Provider>
    );

    act(() => store.set(cloudSyncStateAtom, { status: 'saving', lastSavedAt: null }));
    act(() => store.set(cloudSyncStateAtom, { status: 'saved', lastSavedAt: Date.now() }));
    expect(trackEvent).toHaveBeenCalledWith(ANALYTICS_EVENT.CLOUD_SAVE_COMPLETED, {});

    act(() => store.set(cloudSyncStateAtom, { status: 'error', lastSavedAt: null }));
    expect(trackEvent).toHaveBeenCalledWith(ANALYTICS_EVENT.OPERATION_ERROR, { operation: 'cloud_save' });

    // saving은 완료/실패가 아니므로 그 자체로는 계측 이벤트를 만들지 않는다.
    const events = vi.mocked(trackEvent).mock.calls.map((call) => call[0]);
    expect(events).not.toContain('cloud_save_started');
  });
});
