import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * 🔓 **감추기를 되돌린 상태의 계약** — "저장값은 보존된다"의 나머지 반쪽.
 *
 * 2026-08-01 사용자 결정으로 색 프리셋 선택은 화면에서 감춰졌고, 팔레트 atom 은 **읽을 때만**
 * 기본 팔레트로 폴백한다(`palette.test.tsx` 가 그 상태를 단정한다). 그것만으로는
 * "되돌리면 예전 선택이 살아난다"를 증명할 수 없다 — 노출 목록은 상수라 런타임에 못 바꾸기 때문이다.
 *
 * 그래서 이 파일은 **노출 목록만 원래대로(8종) 돌려놓은 세계**를 모듈 목으로 재현하고,
 * 그 조건에서 예전 계약이 하나도 상하지 않았음을 그대로 검증한다.
 * ⚠ 이 목은 "한 줄"이 아니라 **노출 게이트 3개를 통째로** 갈아끼운다 — 배열(`VISIBLE_PALETTE_PRESET_IDS`)과
 * 그 배열로 판정하는 파생 함수 둘(`isVisiblePalettePresetId`·`toVisiblePalettePresetId`)이다.
 * 파생까지 바꾸는 이유는 그 함수들이 **모듈 로드 시점에 배열을 캡처**해 목 배열을 보지 않기 때문이다.
 * 실제로 되살릴 때 사람이 고치는 것은 배열 하나뿐이고(파생은 자동으로 따라온다), 되살리기의 전체
 * 체크리스트는 `shared/constants/palette/index.ts` 의 `VISIBLE_PALETTE_PRESET_IDS` 주석에 있다.
 */
vi.mock('@/shared/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/constants')>();
  return {
    ...actual,
    VISIBLE_PALETTE_PRESET_IDS: actual.PALETTE_PRESET_IDS,
    isVisiblePalettePresetId: actual.isPalettePresetId,
    toVisiblePalettePresetId: actual.normalizePalettePresetId
  };
});

const { palettePresetAtom, useApplyPalettePreset, PALETTE_STORAGE_KEY } = await import('@/jotai');

describe('노출 목록을 되돌리면 (팔레트 감추기 해제)', () => {
  beforeEach(() => {
    window.localStorage.removeItem(PALETTE_STORAGE_KEY);
    document.documentElement.removeAttribute('data-palette');
  });

  it('감추는 동안 보존돼 있던 선택(grape)이 그대로 다시 적용된다', () => {
    // 감추기 이전에 사용자가 골라 둔 값 — 감추는 동안에도 이 문자열이 localStorage 에 그대로 남아 있다.
    window.localStorage.setItem(PALETTE_STORAGE_KEY, 'grape');

    const store = createStore();
    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
    renderHook(() => useApplyPalettePreset(), { wrapper });

    expect(store.get(palettePresetAtom)).toBe('grape');
    expect(document.documentElement.getAttribute('data-palette')).toBe('grape');
  });

  it('저장→복원 왕복: 선택한 팔레트가 새 세션(새 store)에서도 유지된다', () => {
    const firstSession = createStore();
    firstSession.set(palettePresetAtom, 'aurora');

    // 원시 문자열로 저장된다 (JSON 따옴표 없음 — index.html 프리페인트 스크립트가 그대로 읽는 계약).
    expect(window.localStorage.getItem(PALETTE_STORAGE_KEY)).toBe('aurora');

    const nextSession = createStore();
    const unsubscribe = nextSession.sub(palettePresetAtom, () => undefined);
    expect(nextSession.get(palettePresetAtom)).toBe('aurora');
    unsubscribe();
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
