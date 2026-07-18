import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { beforeEach, describe, expect, it } from 'vitest';
import { palettePresetAtom, useApplyPalettePreset, PALETTE_STORAGE_KEY } from '@/jotai';

/**
 * 팔레트 프리셋은 개인 설정이다 — localStorage 왕복·폴백·DOM 반영만 검증한다.
 * (시뮬레이션 영속 페이로드/공유 링크 스키마와는 무관해야 한다.)
 *
 * atomWithStorage는 마운트(구독) 시점에 storage를 읽는다 — 실제 앱에서는 항상 훅으로
 * 구독하므로, "새 세션에서 읽기"는 store.sub 로 마운트해 실사용과 같게 검증한다.
 */
const readAsNewSession = (): string => {
  const store = createStore();
  const unsubscribe = store.sub(palettePresetAtom, () => undefined);
  const value = store.get(palettePresetAtom);
  unsubscribe();
  return value;
};

describe('팔레트 프리셋 상태', () => {
  beforeEach(() => {
    // atomWithStorage는 localStorage를 읽는다. 테스트 간 오염을 막기 위해 키를 비운다.
    window.localStorage.removeItem(PALETTE_STORAGE_KEY);
    document.documentElement.removeAttribute('data-palette');
  });

  it('저장값이 없으면 기본 팔레트는 velog다', () => {
    expect(readAsNewSession()).toBe('velog');
  });

  it('저장→복원 왕복: 선택한 팔레트가 새 세션(새 store)에서도 유지된다', () => {
    const firstSession = createStore();
    firstSession.set(palettePresetAtom, 'aurora');

    // 원시 문자열로 저장된다 (JSON 따옴표 없음 — index.html 프리페인트 스크립트가 그대로 읽는 계약).
    expect(window.localStorage.getItem(PALETTE_STORAGE_KEY)).toBe('aurora');

    expect(readAsNewSession()).toBe('aurora');
  });

  it('잘못된 저장값(구버전·오타)은 기본 velog로 폴백한다', () => {
    window.localStorage.setItem(PALETTE_STORAGE_KEY, 'legacy-purple');
    expect(readAsNewSession()).toBe('velog');
  });

  it('useApplyPalettePreset: 마운트 시 저장값을 html[data-palette]에 즉시 적용한다', () => {
    window.localStorage.setItem(PALETTE_STORAGE_KEY, 'vivid');
    const store = createStore();
    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

    renderHook(() => useApplyPalettePreset(), { wrapper });

    expect(document.documentElement.getAttribute('data-palette')).toBe('vivid');
  });

  it('useApplyPalettePreset: 팔레트를 바꾸면 html[data-palette]가 갱신되고 저장된다', () => {
    const store = createStore();
    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

    renderHook(() => useApplyPalettePreset(), { wrapper });
    expect(document.documentElement.getAttribute('data-palette')).toBe('velog');

    act(() => {
      store.set(palettePresetAtom, 'navy-gold');
    });

    expect(document.documentElement.getAttribute('data-palette')).toBe('navy-gold');
    expect(window.localStorage.getItem(PALETTE_STORAGE_KEY)).toBe('navy-gold');
  });

  it('다른 탭에서 바꾸면(storage 이벤트) 구독 중인 이 탭도 따라간다', () => {
    const store = createStore();
    // atomWithStorage의 storage 구독은 atom이 마운트(구독)돼야 활성화된다.
    const unsubscribe = store.sub(palettePresetAtom, () => undefined);

    window.localStorage.setItem(PALETTE_STORAGE_KEY, 'aurora');
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: PALETTE_STORAGE_KEY,
        newValue: 'aurora',
        storageArea: window.localStorage
      })
    );

    expect(store.get(palettePresetAtom)).toBe('aurora');
    unsubscribe();
  });
});
