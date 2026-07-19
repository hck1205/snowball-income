import { useLayoutEffect } from 'react';
import { atom } from 'jotai/vanilla';
import { atomWithStorage, RESET } from 'jotai/utils';
import { normalizePalettePresetId, DEFAULT_PALETTE_PRESET_ID } from '@/shared/constants';
import type { PalettePresetId, PresetTickerKey, YearlySeriesKey } from '@/shared/constants';
import type { TickerModalMode } from '@/shared/types/snowball';
import { atomState, useAtomValue, useAtomWrite } from '@/jotai/atom';

export const activeHelpAtom = atomState<string | null>(null);
export const isTickerModalOpenAtom = atomState(false);
export const isConfigDrawerOpenAtom = atomState(false);
export const tickerModalModeAtom = atomState<TickerModalMode>('create');
export const editingTickerIdAtom = atomState<string | null>(null);
export const showQuickEstimateAtom = atomState(false);
export const visibleYearlySeriesAtom = atomState<Record<YearlySeriesKey, boolean>>({
  totalContribution: true,
  assetValue: true,
  annualDividend: false,
  monthlyDividend: false,
  cumulativeDividend: false
});
export const isYearlyAreaFillOnAtom = atomState(true);
export const isResultCompactAtom = atomState(false);
export const showSplitGraphsAtom = atomState(false);
export const showPortfolioDividendCenterAtom = atomState(true);
export const selectedPresetAtom = atomState<'custom' | PresetTickerKey>('custom');

/**
 * 가이드 투어 실행 요청 신호 — **단조 증가 카운터**.
 *
 * 투어 오버레이(`TourGuide`)와 그 실행 트리거(헤더 "더보기" 메뉴의 "튜토리얼 보기")가 서로 다른
 * 컴포넌트라, 트리거가 이 값을 1 올리면(`(n) => n + 1`) `TourGuide`가 변화를 감지해 투어를 연다.
 * 값 자체에는 의미가 없다 — "직전에 처리한 값과 달라졌다"만 본다(초기 마운트값은 skip).
 * 영속/공유 페이로드와 무관한 순수 세션 신호다.
 */
export const tourLaunchRequestAtom = atomState(0);

// ── 팔레트 프리셋 (localStorage 유지 — 개인 설정) ──────────────────────────────
// ⚠ 시뮬레이션 영속 페이로드/공유 링크 스키마에 넣지 않는다. 팔레트는 기기별 취향이고,
//   공유 URL·저장 슬롯의 하위 호환에 영향을 주면 안 된다.

/** 팔레트 저장 키 (테스트/index.html 프리페인트 스크립트가 참조 — 값은 따옴표 없는 원시 문자열). */
export const PALETTE_STORAGE_KEY = 'snowball:palette';

/**
 * JSON 직렬화 대신 원시 문자열로 저장하는 커스텀 storage.
 * - index.html의 프리페인트 인라인 스크립트가 파싱 없이 그대로 읽을 수 있게 한다.
 * - 잘못된 저장값(구버전·오타)은 읽을 때 기본 팔레트로 폴백한다 (하위 호환).
 * - localStorage를 못 쓰는 환경(사파리 프라이빗 등)에서도 기본값으로 안전하게 동작한다.
 */
const paletteStorage = {
  getItem: (key: string, initialValue: PalettePresetId): PalettePresetId => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? initialValue : normalizePalettePresetId(raw);
    } catch {
      return initialValue;
    }
  },
  setItem: (key: string, value: PalettePresetId): void => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // 저장 실패해도 런타임 전환(현재 세션)은 계속 동작한다.
    }
  },
  removeItem: (key: string): void => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // noop
    }
  },
  /** 다른 탭에서 팔레트를 바꾸면 이 탭도 따라간다. */
  subscribe: (key: string, callback: (value: PalettePresetId) => void) => {
    const handler = (event: StorageEvent) => {
      if (event.key !== key) return;
      if (event.storageArea !== null && event.storageArea !== window.localStorage) return;
      callback(normalizePalettePresetId(event.newValue));
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
};

/**
 * 저장 atom (비공개). 공개 atom인 `palettePresetAtom`이 읽기/쓰기를 감싼다.
 * `getOnInit: true` — 첫 렌더부터 저장값을 들고 시작해 기본 팔레트가 번쩍이는 걸 막는다.
 */
const palettePresetStorageAtom = atomWithStorage<PalettePresetId>(
  PALETTE_STORAGE_KEY,
  DEFAULT_PALETTE_PRESET_ID,
  paletteStorage,
  { getOnInit: true }
);

/** `html[data-palette]` 반영 — 쓰기 경로(동기)와 useApplyPalettePreset(마운트/외부 변경)이 공유한다. */
const applyPaletteToDocument = (palette: PalettePresetId): void => {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.palette = palette;
};

type PalettePresetUpdate =
  | PalettePresetId
  | typeof RESET
  | ((prev: PalettePresetId) => PalettePresetId | typeof RESET);

/**
 * 선택된 팔레트 프리셋. 기본 `velog`.
 * 쓰면 ① localStorage 저장(storage atom 경유) ② `html[data-palette]` **동기** 갱신까지 한다.
 *
 * DOM 반영을 useLayoutEffect(커밋 단계)에만 맡기면, 같은 커밋의 **렌더 단계**에서
 * getComputedStyle로 CSS 변수를 읽는 차트 옵션 useMemo(useMainComputed → getChartTheme)가
 * 이전 프리셋 변수를 읽어 캐시한다 — 캔버스 차트만 한 박자 늦는 stale-by-one.
 * 쓰기 경로에서 어트리뷰트를 먼저 바꿔, 리렌더 시점에는 새 변수가 보이게 한다.
 */
export const palettePresetAtom = atom(
  (get) => get(palettePresetStorageAtom),
  (get, set, update: PalettePresetUpdate) => {
    set(palettePresetStorageAtom, update);
    // RESET·함수 업데이트도 storage atom이 해석한 확정값을 되읽어 그대로 반영한다.
    applyPaletteToDocument(get(palettePresetStorageAtom));
  }
);

/**
 * atom 값을 `html[data-palette]`로 반영하는 배선 훅. 앱 루트(AppRouter)에서 1회 마운트한다.
 * 초기 마운트와 **외부발 변경**(탭 간 storage 이벤트 등 쓰기 경로를 안 타는 갱신) 동기화 담당.
 * globalStyles의 `:root[data-palette='...']` 변수 스코프와 짝이며,
 * 최초 페인트 이전 적용은 index.html의 프리페인트 인라인 스크립트가 담당한다.
 */
export const useApplyPalettePreset = (): void => {
  const palette = useAtomValue(palettePresetAtom);
  useLayoutEffect(() => {
    applyPaletteToDocument(palette);
  }, [palette]);
};

export const useActiveHelpAtomValue = () => useAtomValue(activeHelpAtom);
export const useSetActiveHelpWrite = () => useAtomWrite(activeHelpAtom);
export const useIsTickerModalOpenAtomValue = () => useAtomValue(isTickerModalOpenAtom);
export const useSetIsTickerModalOpenWrite = () => useAtomWrite(isTickerModalOpenAtom);
export const useIsConfigDrawerOpenAtomValue = () => useAtomValue(isConfigDrawerOpenAtom);
export const useSetIsConfigDrawerOpenWrite = () => useAtomWrite(isConfigDrawerOpenAtom);
export const useTickerModalModeAtomValue = () => useAtomValue(tickerModalModeAtom);
export const useSetTickerModalModeWrite = () => useAtomWrite(tickerModalModeAtom);
export const useEditingTickerIdAtomValue = () => useAtomValue(editingTickerIdAtom);
export const useSetEditingTickerIdWrite = () => useAtomWrite(editingTickerIdAtom);
export const useShowQuickEstimateAtomValue = () => useAtomValue(showQuickEstimateAtom);
export const useSetShowQuickEstimateWrite = () => useAtomWrite(showQuickEstimateAtom);
export const useVisibleYearlySeriesAtomValue = () => useAtomValue(visibleYearlySeriesAtom);
export const useSetVisibleYearlySeriesWrite = () => useAtomWrite(visibleYearlySeriesAtom);
export const useIsYearlyAreaFillOnAtomValue = () => useAtomValue(isYearlyAreaFillOnAtom);
export const useSetIsYearlyAreaFillOnWrite = () => useAtomWrite(isYearlyAreaFillOnAtom);
export const useIsResultCompactAtomValue = () => useAtomValue(isResultCompactAtom);
export const useSetIsResultCompactWrite = () => useAtomWrite(isResultCompactAtom);
export const useShowSplitGraphsAtomValue = () => useAtomValue(showSplitGraphsAtom);
export const useSetShowSplitGraphsWrite = () => useAtomWrite(showSplitGraphsAtom);
export const useShowPortfolioDividendCenterAtomValue = () => useAtomValue(showPortfolioDividendCenterAtom);
export const useSetShowPortfolioDividendCenterWrite = () => useAtomWrite(showPortfolioDividendCenterAtom);
export const useSelectedPresetAtomValue = () => useAtomValue(selectedPresetAtom);
export const useSetSelectedPresetWrite = () => useAtomWrite(selectedPresetAtom);
export const useTourLaunchRequestAtomValue = () => useAtomValue(tourLaunchRequestAtom);
export const useSetTourLaunchRequestWrite = () => useAtomWrite(tourLaunchRequestAtom);
export const usePalettePresetAtomValue = () => useAtomValue(palettePresetAtom);
export const useSetPalettePresetWrite = () => useAtomWrite(palettePresetAtom);
