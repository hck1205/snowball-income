import { useLayoutEffect, useSyncExternalStore } from 'react';
import { atom } from 'jotai/vanilla';
import { atomWithStorage, RESET } from 'jotai/utils';
import {
  normalizePalettePresetId,
  toVisiblePalettePresetId,
  DEFAULT_PALETTE_PRESET_ID,
  normalizeDisplayCurrency,
  DEFAULT_DISPLAY_CURRENCY
} from '@/shared/constants';
import type { DisplayCurrency, PalettePresetId, PresetTickerKey, YearlySeriesKey } from '@/shared/constants';
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

/**
 * **첫 방문 기본 시나리오(프리필)의 상태.** 없으면 null.
 *
 * 첫 화면을 "고르는 화면"이 아니라 "이미 돌아가는 화면"으로 열기 위해, 저장된 워크스페이스가
 * 하나도 없을 때 대표 프리셋 하나를 **적용된 상태로** 렌더한다. 이 atom 이 그 상태의 유일한 표식이고
 * 두 가지 일을 한다.
 *  ① 배너("미리 계산해 두었습니다")·결과 아래 프리셋 고르개의 표시 게이트
 *  ② 🔴 **영속 계층의 쓰기 정지 신호** — `usePortfolioPersistence` 가 이 값이 non-null 인 동안
 *     로컬(IndexedDB)·클라우드 저장을 **전혀 하지 않고**, 클라우드 세션 동기화에 넘기는 payload 도
 *     하이드레이션 당시(=비어 있던) 것으로 고정한다. 프리필은 **사용자가 만든 데이터가 아니다.**
 *
 * 🔴 **단계가 둘인 이유**(하나로 합치지 마라).
 *  - `requested` — 영속 계층이 "저장된 게 없다"를 확인하고 발행한 상태. **아직 화면은 비어 있다.**
 *  - `applied`   — 우패널이 실제로 그 구성을 커밋한 상태.
 *  승격 판정(사용자가 뭔가 바꿨나)은 "프리필 직후의 워크스페이스"와 비교하는데, 단계를 구분하지 않으면
 *  **비어 있던 시점**을 기준으로 잡아 버려 프리필이 붙는 순간 자기 자신을 사용자 편집으로 오인한다
 *  (= 프리필이 그대로 저장된다). `requested` 동안에는 저장도 멈추고 기준도 잡지 않는다.
 *
 * 승격: 사용자가 의미 있는 값을 하나라도 바꾸면 영속 계층이 이 값을 null 로 되돌린다
 * (그 순간부터 평범한 워크스페이스 = 정상 저장). 이 atom 자체는 **비영속**이다 —
 * 영속 payload·공유 URL 스키마에 절대 넣지 마라.
 */
export type ScenarioPrefillState = { presetId: string; status: 'requested' | 'applied' };

export const scenarioPrefillAtom = atomState<ScenarioPrefillState | null>(null);

/**
 * **공유 링크로 들어왔는데 시나리오를 열지 못한 이유.** 없으면 null(정상 방문 포함).
 *
 * 공유 코드가 깨졌을 때 앱이 할 수 있는 일은 빈 시뮬레이터로 떨어지는 것뿐인데, 그것만 하면
 * 사용자는 **"내 시나리오가 사라졌다"** 로 읽는다. 파싱 경계(`decodeSharedScenarioResult`·DB 스냅샷 조회)가
 * 실패를 **값으로** 돌려주고, 영속 계층이 그 값을 여기 적어 두면 우패널 배너가 한 줄로 설명한다.
 *
 * 🔴 값은 **사용자에게 의미가 다른 두 가지**만 갖는다 — 더 잘게 쪼개지 마라(그건 계측의 몫이다).
 *  - `invalid`     — 링크 자체를 읽지 못했다(잘림·손상·알 수 없는 형식). 링크를 다시 받아야 한다.
 *  - `unavailable` — 링크는 읽었지만 그 시나리오가 없다(만료·삭제·조회 실패). 기다려도 대개 안 온다.
 * 계측은 더 세분한다(`malformed`/`unsupported`/`db_snapshot_missing`/`db_fetch_failed`) — 화면은 둘로 충분하다.
 *
 * 세션 신호다. **영속 payload·공유 URL 스키마에 절대 넣지 마라.**
 */
export type ShareLinkFailureReason = 'invalid' | 'unavailable';

export const shareLinkFailureAtom = atomState<ShareLinkFailureReason | null>(null);

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
 *
 * 🔒 **읽기에는 노출 게이트(`toVisiblePalettePresetId`)가 걸려 있다** — 2026-08-01 이후 화면에는
 * 기본 프리셋만 노출하므로, 예전에 `grape` 를 골라 둔 사용자가 앱을 열면 기본 팔레트로 **우아하게
 * 폴백**한다. **저장값은 건드리지 않는다**(storage atom 은 여전히 `grape` 를 들고 있다) — 노출 목록
 * (`shared/constants/palette` 의 `VISIBLE_PALETTE_PRESET_IDS`)을 되돌리면 그 선택이 그대로 살아난다.
 * 그래서 폴백은 storage 의 `getItem`(=쓰기 유발 없음)이 아니라 이 **읽기 경로**에 둔다.
 */
export const palettePresetAtom = atom(
  (get) => toVisiblePalettePresetId(get(palettePresetStorageAtom)),
  (get, set, update: PalettePresetUpdate) => {
    set(palettePresetStorageAtom, update);
    // RESET·함수 업데이트도 storage atom이 해석한 확정값을 되읽어 그대로 반영한다.
    applyPaletteToDocument(toVisiblePalettePresetId(get(palettePresetStorageAtom)));
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

// ── 화면 밝기: 라이트 / 다크 (localStorage 유지 — 팔레트와 같은 성격의 기기별 취향) ──────────
// ⚠ 팔레트와 마찬가지로 시뮬레이션 영속 페이로드/공유 링크 스키마에 넣지 않는다.
//   이 값은 **새 축이 아니다** — globalStyles가 예전부터 갖고 있던 탈출구
//   (`:root[data-theme='light'|'dark']`, OS 다크는 `:not([data-theme='light'])`)에
//   비로소 조종간을 붙인 것이다. 어트리뷰트가 **없는 상태 = OS 설정을 따름**이고,
//   그것이 이 선호의 기본값(`system`)이다.

/** 화면 밝기 선호. `system` = OS 설정을 따름(= `html`에 `data-theme` 없음). */
export type ColorSchemePreference = 'system' | 'light' | 'dark';

/** 화면 밝기 저장 키 (index.html 프리페인트 스크립트가 참조 — 값은 따옴표 없는 원시 문자열). */
export const COLOR_SCHEME_STORAGE_KEY = 'snowball:color-scheme';

/** 저장값이 없거나 잘못됐을 때: OS를 따른다. */
export const DEFAULT_COLOR_SCHEME_PREFERENCE: ColorSchemePreference = 'system';

/** 구버전·오타 저장값을 `system`으로 폴백시킨다 (하위 호환 — 절대 throw 하지 않는다). */
const normalizeColorSchemePreference = (value: unknown): ColorSchemePreference =>
  value === 'light' || value === 'dark' ? value : DEFAULT_COLOR_SCHEME_PREFERENCE;

/** 팔레트와 동일한 원시 문자열 storage — index.html 프리페인트가 파싱 없이 그대로 읽는다. */
const colorSchemeStorage = {
  getItem: (key: string, initialValue: ColorSchemePreference): ColorSchemePreference => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? initialValue : normalizeColorSchemePreference(raw);
    } catch {
      return initialValue;
    }
  },
  setItem: (key: string, value: ColorSchemePreference): void => {
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
  /** 다른 탭에서 밝기를 바꾸면 이 탭도 따라간다. */
  subscribe: (key: string, callback: (value: ColorSchemePreference) => void) => {
    const handler = (event: StorageEvent) => {
      if (event.key !== key) return;
      if (event.storageArea !== null && event.storageArea !== window.localStorage) return;
      callback(normalizeColorSchemePreference(event.newValue));
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
};

const colorSchemeStorageAtom = atomWithStorage<ColorSchemePreference>(
  COLOR_SCHEME_STORAGE_KEY,
  DEFAULT_COLOR_SCHEME_PREFERENCE,
  colorSchemeStorage,
  { getOnInit: true }
);

/** `html[data-theme]` 반영 — 쓰기 경로(동기)와 useApplyColorScheme(마운트/외부 변경)이 공유한다. */
const applyColorSchemeToDocument = (preference: ColorSchemePreference): void => {
  if (typeof document === 'undefined') return;
  // `system`은 어트리뷰트를 **지운다** — 있고 없고가 곧 "OS를 따르는가"의 표현이다.
  if (preference === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = preference;
};

type ColorSchemeUpdate =
  | ColorSchemePreference
  | typeof RESET
  | ((prev: ColorSchemePreference) => ColorSchemePreference | typeof RESET);

/**
 * 화면 밝기 선호. 기본 `system`.
 * 쓰면 ① localStorage 저장 ② `html[data-theme]` **동기** 갱신까지 한다.
 *
 * 동기 갱신 이유는 팔레트와 같다(위 `palettePresetAtom` 주석) — 라이트/다크는 `--sb-*` 토큰을
 * 통째로 갈아치우므로, 렌더 단계에서 `getComputedStyle`로 그 변수를 읽는 캔버스 차트가
 * useLayoutEffect(커밋 단계) 반영을 기다리면 한 박자 늦는다.
 */
export const colorSchemeAtom = atom(
  (get) => get(colorSchemeStorageAtom),
  (get, set, update: ColorSchemeUpdate) => {
    set(colorSchemeStorageAtom, update);
    applyColorSchemeToDocument(get(colorSchemeStorageAtom));
  }
);

/**
 * atom 값을 `html[data-theme]`로 반영하는 배선 훅. 앱 루트(AppRouter)에서 1회 마운트한다.
 * `useApplyPalettePreset`과 같은 자리·같은 역할(초기 마운트 + 탭 간 storage 이벤트 동기화)이고,
 * 최초 페인트 이전 적용은 index.html의 프리페인트 인라인 스크립트가 담당한다.
 */
export const useApplyColorScheme = (): void => {
  const preference = useAtomValue(colorSchemeAtom);
  useLayoutEffect(() => {
    applyColorSchemeToDocument(preference);
  }, [preference]);
};

const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

const getSystemPrefersDark = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(DARK_MEDIA_QUERY).matches;
};

/** OS 설정 변경 구독. 구형 사파리(addListener만 있는)까지 받되, 없으면 조용히 정적 값으로 산다. */
const subscribeSystemColorScheme = (onStoreChange: () => void): (() => void) => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => undefined;
  const query = window.matchMedia(DARK_MEDIA_QUERY);
  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', onStoreChange);
    return () => query.removeEventListener('change', onStoreChange);
  }
  if (typeof query.addListener === 'function') {
    query.addListener(onStoreChange);
    return () => query.removeListener(onStoreChange);
  }
  return () => undefined;
};

/**
 * **지금 화면에 실제로 적용된 밝기.** 선호가 `system`이면 OS를 읽어 해석한다.
 *
 * 파생 계산을 컴포넌트에 두지 않으려고 상태 계층에 둔다. 다만 OS 설정은 atom이 아니라
 * 브라우저 외부 저장소라 `useSyncExternalStore`로 구독한다 — 전역 atom을 하나 더 만들어
 * 두 곳에서 동기화하는 것보다 값이 갈릴 여지가 없다.
 */
export const useEffectiveColorScheme = (): 'light' | 'dark' => {
  const preference = useAtomValue(colorSchemeAtom);
  const systemPrefersDark = useSyncExternalStore(
    subscribeSystemColorScheme,
    getSystemPrefersDark,
    () => false // 서버/프리렌더에는 OS 설정이 없다 — 라이트로 시작한다(첫 페인트는 프리페인트가 맡는다).
  );

  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light';
  return preference;
};

// ── 표시 통화 (localStorage 유지 — 기기별 표시 취향, 팔레트와 같은 성격) ──────────────
// ⚠ 시뮬레이션 영속 페이로드/공유 링크 스키마에 넣지 않는다. 계산은 언제나 원화 기준이고
//   이 값은 결과 **표시**만 바꾼다 — 토글이 클라우드 저장을 유발해서도 안 된다
//   (의미있는 액션 배제 목록: 탭 전환·뷰 토글·테마 옆).

/** 표시 통화 저장 키. */
export const DISPLAY_CURRENCY_STORAGE_KEY = 'snowball:display-currency';

/**
 * 팔레트와 동일한 원시 문자열 storage — JSON 직렬화 없이 `"KRW"`/`"USD"` 그대로 저장한다.
 * 잘못된 저장값(구버전·오타)과 localStorage 접근 실패는 모두 기본값(원화)으로 폴백한다.
 */
const displayCurrencyStorage = {
  getItem: (key: string, initialValue: DisplayCurrency): DisplayCurrency => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? initialValue : normalizeDisplayCurrency(raw);
    } catch {
      return initialValue;
    }
  },
  setItem: (key: string, value: DisplayCurrency): void => {
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
  /** 다른 탭에서 표시 통화를 바꾸면 이 탭도 따라간다. */
  subscribe: (key: string, callback: (value: DisplayCurrency) => void) => {
    const handler = (event: StorageEvent) => {
      if (event.key !== key) return;
      if (event.storageArea !== null && event.storageArea !== window.localStorage) return;
      callback(normalizeDisplayCurrency(event.newValue));
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
};

/**
 * 표시 통화 **선호**(preference). 기본 `KRW`.
 *
 * ⚠ 화면 포맷에 쓰는 값은 이게 아니라 `effectiveDisplayCurrencyAtom`이다 — 환율이 없을 때
 *   달러 포맷터가 불려 `$NaN`이 나오는 경로를 구조적으로 막는다. 환율 조회가 실패해도 이
 *   선호는 지우지 않는다(다음 세션에 환율이 복구되면 자동으로 달러 표시로 돌아온다).
 */
export const displayCurrencyAtom = atomWithStorage<DisplayCurrency>(
  DISPLAY_CURRENCY_STORAGE_KEY,
  DEFAULT_DISPLAY_CURRENCY,
  displayCurrencyStorage,
  { getOnInit: true }
);

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
export const useScenarioPrefillAtomValue = () => useAtomValue(scenarioPrefillAtom);
export const useSetScenarioPrefillWrite = () => useAtomWrite(scenarioPrefillAtom);
export const useShareLinkFailureAtomValue = () => useAtomValue(shareLinkFailureAtom);
export const useSetShareLinkFailureWrite = () => useAtomWrite(shareLinkFailureAtom);
export const usePalettePresetAtomValue = () => useAtomValue(palettePresetAtom);
export const useSetPalettePresetWrite = () => useAtomWrite(palettePresetAtom);
export const useColorSchemeAtomValue = () => useAtomValue(colorSchemeAtom);
export const useSetColorSchemeWrite = () => useAtomWrite(colorSchemeAtom);
export const useDisplayCurrencyAtomValue = () => useAtomValue(displayCurrencyAtom);
export const useSetDisplayCurrencyWrite = () => useAtomWrite(displayCurrencyAtom);
