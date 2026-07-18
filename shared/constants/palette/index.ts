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
