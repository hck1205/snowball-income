import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { beforeEach, describe, expect, it } from 'vitest';
import { colorSchemeAtom, COLOR_SCHEME_STORAGE_KEY, useApplyColorScheme, PALETTE_STORAGE_KEY } from '@/jotai';

/**
 * 화면 밝기(라이트/다크)는 팔레트와 같은 성격의 개인 설정이다 —
 * localStorage 왕복 · `html[data-theme]` 반영 · 하위 호환 폴백만 검증한다.
 *
 * 🔴 어트리뷰트가 **없는 상태**가 곧 "OS 설정을 따름"이다(globalStyles 의
 * `:root:not([data-theme='light'])` 다크 블록이 그 전제로 쓰여 있다).
 * 기본값에서 어트리뷰트를 붙이기 시작하면 OS 다크 사용자가 라이트로 굳는다.
 */
const renderWiring = (store: ReturnType<typeof createStore>) => {
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  return renderHook(() => useApplyColorScheme(), { wrapper });
};

describe('화면 밝기 선호', () => {
  beforeEach(() => {
    window.localStorage.removeItem(COLOR_SCHEME_STORAGE_KEY);
    window.localStorage.removeItem(PALETTE_STORAGE_KEY);
    document.documentElement.removeAttribute('data-theme');
  });

  it('저장값이 없으면 system — html[data-theme]를 붙이지 않는다', () => {
    const store = createStore();
    renderWiring(store);

    expect(store.get(colorSchemeAtom)).toBe('system');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('다크를 고르면 html[data-theme]=dark 로 반영되고 원시 문자열로 저장된다', () => {
    const store = createStore();
    renderWiring(store);

    act(() => {
      store.set(colorSchemeAtom, 'dark');
    });

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    // JSON 따옴표 없음 — index.html 프리페인트 스크립트가 파싱 없이 그대로 읽는 계약.
    expect(window.localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBe('dark');
  });

  it('라이트를 고르면 OS가 다크여도 라이트로 고정된다 (data-theme=light)', () => {
    const store = createStore();
    renderWiring(store);

    act(() => {
      store.set(colorSchemeAtom, 'light');
    });

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('system 으로 되돌리면 어트리뷰트를 지운다 (다시 OS를 따른다)', () => {
    const store = createStore();
    renderWiring(store);

    act(() => {
      store.set(colorSchemeAtom, 'dark');
    });
    act(() => {
      store.set(colorSchemeAtom, 'system');
    });

    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('저장→복원 왕복: 고른 밝기가 새 세션(새 store)에서도 유지된다', () => {
    const firstSession = createStore();
    firstSession.set(colorSchemeAtom, 'dark');

    const nextSession = createStore();
    const unsubscribe = nextSession.sub(colorSchemeAtom, () => undefined);
    expect(nextSession.get(colorSchemeAtom)).toBe('dark');
    unsubscribe();
  });

  it('잘못된 저장값(구버전·오타)은 system 으로 폴백한다', () => {
    window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, 'midnight');

    const store = createStore();
    const unsubscribe = store.sub(colorSchemeAtom, () => undefined);
    expect(store.get(colorSchemeAtom)).toBe('system');
    unsubscribe();
  });

  it('다른 탭에서 바꾸면(storage 이벤트) 구독 중인 이 탭도 따라간다', () => {
    const store = createStore();
    const unsubscribe = store.sub(colorSchemeAtom, () => undefined);

    window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, 'dark');
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: COLOR_SCHEME_STORAGE_KEY,
        newValue: 'dark',
        storageArea: window.localStorage
      })
    );

    expect(store.get(colorSchemeAtom)).toBe('dark');
    unsubscribe();
  });

  it('밝기는 팔레트 저장 키를 건드리지 않는다', () => {
    const store = createStore();
    renderWiring(store);

    act(() => {
      store.set(colorSchemeAtom, 'dark');
    });

    expect(window.localStorage.getItem(PALETTE_STORAGE_KEY)).toBeNull();
  });
});
