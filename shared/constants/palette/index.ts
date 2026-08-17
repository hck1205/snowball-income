/**
 * 팔레트 프리셋 id — 상태 계층(jotai)과 스타일 레지스트리(shared/styles)가 공유하는 **최소 계약**.
 *
 * - 여기에는 id만 둔다. label·스와치 등 표시용 메타데이터는 shared/styles 레지스트리 담당.
 * - 선택값은 `html[data-palette]` 어트리뷰트로 표현되고, globalStyles가
 *   `:root[data-palette='...']` 스코프로 변수를 주입한다.
 * - ⚠ 프리셋을 추가/삭제하면 index.html의 프리페인트 인라인 스크립트(유효값 목록 하드코딩)도
 *   함께 갱신해야 한다.
 */
/** 순서 = 스위처 노출 순서 — 기본(velog) 첫 항목, 이후 색상군 논리(그린 → 블루 → 퍼플 → 웜 → 모노). */
export const PALETTE_PRESET_IDS = ['velog', 'forest', 'aurora', 'vivid', 'navy-gold', 'grape', 'sunset', 'ink'] as const;

export type PalettePresetId = (typeof PALETTE_PRESET_IDS)[number];

/** 저장값이 없거나 잘못됐을 때의 기본 팔레트. */
export const DEFAULT_PALETTE_PRESET_ID: PalettePresetId = 'velog';

export const isPalettePresetId = (value: unknown): value is PalettePresetId =>
  typeof value === 'string' && (PALETTE_PRESET_IDS as readonly string[]).includes(value);

/** 구버전·오타 저장값을 기본 팔레트로 폴백시킨다 (하위 호환 — 절대 throw 하지 않는다). */
export const normalizePalettePresetId = (value: unknown): PalettePresetId =>
  isPalettePresetId(value) ? value : DEFAULT_PALETTE_PRESET_ID;

/**
 * 🔒 **화면에 노출하는 프리셋 목록 — "감추기"의 단일 지점.**
 *
 * 왜 줄였나 (2026-08-01, 사용자가 화면을 직접 보고 내린 결정):
 *   "설정을 고를 수 있는 옵션이 너무 많다. 그냥 라이트·다크 두 개만 있으면 좋겠다."
 * 그래서 색 프리셋 선택을 화면에서 걷어내고, 헤더의 취향 축은 **라이트/다크 하나**로 남겼다
 * (`components/ColorSchemeToggle`).
 *
 * 🔴 **삭제가 아니라 감추기다.** 8종 프리셋의 hex·토큰·`contrast.test.ts` 의 16조합 대비 게이트는
 * 전부 그대로 살아 있다 — 값이 살아 있는 한 게이트도 살아 있어야 되살릴 때 안전하다.
 * 노출을 막는 조건문은 **이 배열 하나**이고, 소비처(스위처 UI · 팔레트 atom 읽기)는 전부 여기를 본다.
 *
 * ↩ **되살리는 법 — 1 상수 + 6 지점.** 기계적이라 쉽지만 "한 줄"은 아니다.
 *   ⚠ 이 배열만 되돌리면 **화면에는 아무 일도 일어나지 않는다** — `ThemePresetSwitcher` 는
 *   지금 **어디에서도 마운트되지 않기 때문이다**(소비처 0). 진입점을 함께 되돌려야 보인다.
 *
 *   ① 이 배열을 `PALETTE_PRESET_IDS` 로 되돌린다(아래 상수).
 *   ② `components/AppHeader/AppHeader.tsx` — `Actions` 에 `ThemePresetSwitcher` 를 다시 배치한다
 *      (`ColorSchemeToggle` 대신, 또는 함께 — 진입점이 둘이 되는 것을 감수할지 결정할 것).
 *   ③ `test/persistence/palette.test.tsx` — `HIDDEN_PRESET`(노출 안 된 프리셋 찾기)이 `undefined` 가
 *      되어 3케이스가 빨개진다. 감추기 전용 케이스라 함께 걷어낸다.
 *   ④ `components/AppHeader/AppHeader.test.tsx` — 가드 2건("밝기 토글이 헤더에 상시 있다" ·
 *      "🔒 헤더 어디에도 색 프리셋을 고르는 진입점이 없다").
 *   ⑤ `components/ColorSchemeToggle/ColorSchemeToggle.test.tsx` — "🔒 색 프리셋을 고르는 진입점을
 *      만들지 않는다" 가드.
 *   ⑥ `components/HeaderOverflowMenu/HeaderOverflowMenu.test.tsx` — "테마 항목은 더 이상 이 메뉴에
 *      없다" 가드(구 진입점을 서랍으로 되돌릴 경우).
 *
 *   저장돼 있던 선택(예: `grape`)은 **그대로 다시 적용된다** — 감추는 동안에도 저장값을 덮어쓰지
 *   않기 때문이다(`toVisiblePalettePresetId` 는 읽기 전용 폴백).
 */
export const VISIBLE_PALETTE_PRESET_IDS: readonly PalettePresetId[] = [DEFAULT_PALETTE_PRESET_ID];

export const isVisiblePalettePresetId = (value: unknown): value is PalettePresetId =>
  typeof value === 'string' && (VISIBLE_PALETTE_PRESET_IDS as readonly string[]).includes(value);

/**
 * 저장값을 **화면에 적용할 값**으로 바꾼다 — 노출 목록에 없으면 기본 팔레트로 폴백한다.
 *
 * 🔴 폴백은 **읽을 때만** 한다. 저장값(localStorage `hungryhippo:palette`)은 절대 덮어쓰지 않는다 —
 * 감추기를 되돌리는 순간 사용자가 고른 프리셋이 그대로 복원돼야 하기 때문이다.
 * (`normalizePalettePresetId` 는 "존재하지 않는 값"을, 이 함수는 "존재하지만 지금 안 보이는 값"을 다룬다.)
 */
export const toVisiblePalettePresetId = (value: unknown): PalettePresetId =>
  isVisiblePalettePresetId(value) ? value : DEFAULT_PALETTE_PRESET_ID;
