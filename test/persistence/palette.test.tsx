import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  colorSchemeAtom,
  COLOR_SCHEME_STORAGE_KEY,
  normalizePersistedAppState,
  palettePresetAtom,
  useApplyPalettePreset,
  PALETTE_STORAGE_KEY
} from '@/jotai';
import { PALETTE_PRESET_IDS, VISIBLE_PALETTE_PRESET_IDS } from '@/shared/constants';

/**
 * 팔레트 프리셋은 개인 설정이다 — localStorage 왕복·폴백·DOM 반영만 검증한다.
 * (시뮬레이션 영속 페이로드/공유 링크 스키마와는 무관해야 한다.)
 *
 * 🔒 이 파일은 **지금 상태 = 색 프리셋을 화면에서 감춘 상태**를 단정한다(2026-08-01 사용자 결정).
 * 감추기를 되돌린 상태의 계약(저장값이 그대로 적용됨 · 탭 간 동기화)은
 * `paletteVisibilityRestore.test.tsx` 가 노출 목록을 복원한 조건에서 그대로 지킨다 —
 * 두 파일이 합쳐져 "읽을 때만 폴백하고 저장값은 보존한다"는 왕복 계약이 된다.
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

/** 지금 화면에 노출되지 않는 프리셋 하나 — 예전 사용자의 저장값을 재현하는 데 쓴다. */
const HIDDEN_PRESET = PALETTE_PRESET_IDS.find((id) => !VISIBLE_PALETTE_PRESET_IDS.includes(id));

describe('팔레트 프리셋 상태', () => {
  beforeEach(() => {
    // atomWithStorage는 localStorage를 읽는다. 테스트 간 오염을 막기 위해 키를 비운다.
    window.localStorage.removeItem(PALETTE_STORAGE_KEY);
    window.localStorage.removeItem(COLOR_SCHEME_STORAGE_KEY);
    document.documentElement.removeAttribute('data-palette');
    document.documentElement.removeAttribute('data-theme');
  });

  it('저장값이 없으면 기본 팔레트는 velog다', () => {
    expect(readAsNewSession()).toBe('velog');
  });

  it('잘못된 저장값(구버전·오타)은 기본 velog로 폴백한다', () => {
    window.localStorage.setItem(PALETTE_STORAGE_KEY, 'legacy-purple');
    expect(readAsNewSession()).toBe('velog');
  });

  it('화면에 노출하는 프리셋은 기본 팔레트 하나뿐이다 (감추기의 단일 지점)', () => {
    expect(VISIBLE_PALETTE_PRESET_IDS).toEqual(['velog']);
    // 🔴 값·토큰·대비 게이트는 그대로 살아 있어야 한다 — 감추기는 삭제가 아니다.
    expect(PALETTE_PRESET_IDS).toHaveLength(8);
    expect(HIDDEN_PRESET).toBeDefined();
  });

  it('노출되지 않는 저장값(예전 선택)은 화면에서만 기본 팔레트로 폴백한다 — 저장값은 그대로 남는다', () => {
    window.localStorage.setItem(PALETTE_STORAGE_KEY, HIDDEN_PRESET as string);

    expect(readAsNewSession()).toBe('velog');
    // 🔴 읽기 폴백이지 마이그레이션이 아니다. 여기서 덮어쓰면 감추기를 되돌려도 선택이 돌아오지 않는다.
    expect(window.localStorage.getItem(PALETTE_STORAGE_KEY)).toBe(HIDDEN_PRESET);
  });

  it('useApplyPalettePreset: 마운트해도 노출되지 않는 저장값을 덮어쓰지 않는다', () => {
    window.localStorage.setItem(PALETTE_STORAGE_KEY, HIDDEN_PRESET as string);
    const store = createStore();
    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

    renderHook(() => useApplyPalettePreset(), { wrapper });

    expect(document.documentElement.getAttribute('data-palette')).toBe('velog');
    expect(window.localStorage.getItem(PALETTE_STORAGE_KEY)).toBe(HIDDEN_PRESET);
  });

  /**
   * 🔴 테마 폴백이 **영속 페이로드 정규화 경로를 건드리지 않는다**는 확인.
   * `appStateNormalize` 는 모르는 값을 만나면 그 조각을 통째로 버리는 성질이 있어(사고 이력),
   * 테마가 그 경로에 끼어들면 "테마 하나 때문에 보유 종목이 사라지는" 사고가 재현될 수 있다.
   * 팔레트·밝기는 처음부터 페이로드 밖(localStorage 개인 설정)이고 그대로 유지한다.
   */
  it('숨은 팔레트가 저장돼 있어도 영속 페이로드의 보유 종목·시나리오는 그대로다', () => {
    window.localStorage.setItem(PALETTE_STORAGE_KEY, HIDDEN_PRESET as string);
    window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, 'dark');

    const result = normalizePersistedAppState({
      portfolio: {
        tickerProfiles: [
          {
            id: 'ticker-1',
            ticker: 'SCHD',
            name: '슈드',
            initialPrice: 100,
            dividendYield: 3.5,
            dividendGrowth: 5,
            expectedTotalReturn: 8.5,
            frequency: 'quarterly'
          }
        ],
        includedTickerIds: ['ticker-1'],
        weightByTickerId: { 'ticker-1': 100 },
        fixedByTickerId: {},
        selectedTickerId: 'ticker-1'
      },
      investmentSettings: { durationYears: 7 },
      scenarios: []
    });

    expect(result.portfolio.tickerProfiles.map((profile) => profile.ticker)).toEqual(['SCHD']);
    expect(result.scenarios).toHaveLength(1);
    expect(result.investmentSettings.durationYears).toBe(7);
    // 팔레트·밝기는 영속 스키마에 존재하지 않는다 — 여기 새 키가 생기면 공유 URL 길이까지 늘어난다.
    expect(Object.keys(result).sort()).toEqual([
      'activeScenarioId',
      'investmentSettings',
      'portfolio',
      'savedName',
      'scenarios'
    ]);
  });

  it('밝기를 바꿔도 팔레트 저장값은 건드리지 않는다 (두 선호는 서로 다른 키다)', () => {
    window.localStorage.setItem(PALETTE_STORAGE_KEY, HIDDEN_PRESET as string);
    const store = createStore();
    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

    renderHook(() => useApplyPalettePreset(), { wrapper });
    act(() => {
      store.set(colorSchemeAtom, 'dark');
    });

    expect(window.localStorage.getItem(PALETTE_STORAGE_KEY)).toBe(HIDDEN_PRESET);
    expect(window.localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBe('dark');
  });
});
