import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import type { ReactNode } from 'react';

/**
 * **회귀(수정 A — 레이스 창 닫기)**: 로컬 autosave(120ms)는 편집(탭 삭제)을 즉시 반영하지만 클라우드
 * push는 4초 디바운스라, 새로고침이 디바운스를 앞지르면 삭제가 클라우드에 안 가 다음 세션에 거짓 충돌이
 * 뜬다. `usePortfolioPersistence`가 **pagehide / visibilitychange→hidden**에서 대기 중인 클라우드 저장을
 * 즉시 flush해 그 레이스 창을 좁힌다. 여기서는 리스너 등록/조건/해제와 flush 호출을 고정한다.
 */

const flushSpy = vi.fn(async () => {});
const scheduleSpy = vi.fn();

// useCloudSync를 스파이로 대체(실 supabase·스케줄러 없이 flush 호출만 관측). 나머지 export는 real 유지.
vi.mock('@/jotai/snowball/cloud', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/jotai/snowball/cloud')>();
  return {
    ...actual,
    useCloudSync: () => ({ scheduleCloudSave: scheduleSpy, flushCloudSave: flushSpy })
  };
});

import { usePortfolioPersistence } from '@/pages/Main/hooks/persistence';

const store = createStore();
const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

const setVisibility = (state: 'visible' | 'hidden') => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
};

describe('usePortfolioPersistence — 페이지 이탈 시 대기 중 클라우드 저장 flush', () => {
  beforeEach(() => {
    flushSpy.mockClear();
    setVisibility('visible');
  });
  afterEach(() => setVisibility('visible'));

  it('pagehide에서 flushCloudSave를 부른다(새로고침·닫기·bfcache 진입)', () => {
    renderHook(() => usePortfolioPersistence(), { wrapper });

    window.dispatchEvent(new Event('pagehide'));

    expect(flushSpy).toHaveBeenCalledTimes(1);
  });

  it('visibilitychange가 hidden으로 가면 flush한다(모바일 백그라운드·앱 전환 보강)', () => {
    renderHook(() => usePortfolioPersistence(), { wrapper });

    setVisibility('hidden');
    document.dispatchEvent(new Event('visibilitychange'));

    expect(flushSpy).toHaveBeenCalledTimes(1);
  });

  it('visibilitychange가 여전히 visible이면 flush하지 않는다(탭 재활성 등 오탐 방지)', () => {
    renderHook(() => usePortfolioPersistence(), { wrapper });

    setVisibility('visible');
    document.dispatchEvent(new Event('visibilitychange'));

    expect(flushSpy).not.toHaveBeenCalled();
  });

  it('언마운트하면 리스너를 제거한다 — 이후 이벤트는 flush를 부르지 않는다(누수 방지)', () => {
    const { unmount } = renderHook(() => usePortfolioPersistence(), { wrapper });

    unmount();
    window.dispatchEvent(new Event('pagehide'));
    setVisibility('hidden');
    document.dispatchEvent(new Event('visibilitychange'));

    expect(flushSpy).not.toHaveBeenCalled();
  });
});
