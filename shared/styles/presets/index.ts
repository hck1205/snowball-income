/**
 * 팔레트 프리셋 레지스트리 — "이름은 역할, 값은 프리셋".
 *
 * CSS 변수 이름(`--sb-*`)과 `color.*` 파사드는 **역할**이다. `gradient-aurora`, `bg-glow`,
 * `surface-glass` 같은 이름도 그대로 두고 프리셋이 **값만** 바꾼다 — velog에서 `gradient-aurora`는
 * "오로라"가 아니라 미묘한 틸그린 duotone이고, `bg-glow`는 사실상 단색이다. 이름을
 * 역할("표시용 시그니처 그라데이션", "페이지 배경", "유리 서피스")로 읽으면 모순이 없다.
 * **컴포넌트는 한 줄도 수정하지 않는 것**이 이 아키텍처의 성공 기준이다.
 *
 * 이 폴더의 구성:
 *  - `gradients.ts` — 그라데이션 문자열 조립 빌더 (스칼라 stop → CSS 값)
 *  - `chartSeriesTokens.ts` — `chart-series-N` 토큰 매핑 유틸
 *  - `sharedTokens.ts` — 전 프리셋 공통 토큰 (워드마크, up/down/success/warning/danger)
 *  - `<preset>.ts`(8종: aurora·velog·vivid·navyGold·forest·grape·sunset·ink) — 프리셋별 light/dark 값
 *  - 이 `index.ts` — 위 8종을 `THEME_PRESETS` 레지스트리로 조립
 *
 * 배선:
 *  - id 계약(`PalettePresetId`)은 `@/shared/constants/palette` — 상태 계층(jotai)과 공유하는 최소 계약.
 *    (배럴 `@/shared/constants` 대신 폴더 직접 import — constants/allocation → styles 역방향 참조와의
 *    순환 평가(TDZ)를 끊기 위함이다.)
 *  - `globalStyles.ts`가 이 레지스트리로 `:root[data-palette='<id>']` 변수 스코프를 생성한다.
 *  - `contrast.test.ts`가 전 프리셋(8종) × light/dark 전체를 WCAG 수치로 강제한다.
 *
 * 모든 hex는 확정 스펙 값이다(스펙: theme-presets-spec v1.0 + theme-variation-spec v1.0 —
 * 8종 확장판 검증 로그 1,276건 전 PASS).
 * **임의로 바꾸지 마라** — 바꾸면 contrast.test.ts가 떨어지고, 통과하더라도 실측 근거가 사라진다.
 */

import { DEFAULT_PALETTE_PRESET_ID, PALETTE_PRESET_IDS } from '@/shared/constants/palette';
import type { PalettePresetId } from '@/shared/constants/palette';
import { AURORA_DARK, AURORA_LIGHT } from './aurora';
import { FOREST_DARK, FOREST_LIGHT } from './forest';
import { GRAPE_DARK, GRAPE_LIGHT } from './grape';
import { INK_DARK, INK_LIGHT } from './ink';
import { NAVY_GOLD_DARK, NAVY_GOLD_LIGHT } from './navyGold';
import { SUNSET_DARK, SUNSET_LIGHT } from './sunset';
import type { ThemePreset } from './types';
import { VELOG_DARK, VELOG_LIGHT } from './velog';
import { VIVID_DARK, VIVID_LIGHT } from './vivid';

export type { ThemePreset } from './types';
/** aurora 세트 = 기존 `CHART_SERIES` 값 그대로 (tokens.ts가 하위 호환 이름으로 re-export). */
export { AURORA_CHART_SERIES } from './aurora';

/* 키 순서 = PALETTE_PRESET_IDS(스위처 노출 순서)와 동일하게 유지한다. */
export const THEME_PRESETS: Record<PalettePresetId, ThemePreset> = {
  velog: {
    /** id는 내부 식별자(velog 유지) — 표시명은 타사 서비스명을 피해 "미니멀 그린". */
    label: '미니멀 그린',
    swatch: ['#f8f9fa', '#12b886', '#212529'],
    light: VELOG_LIGHT,
    dark: VELOG_DARK
  },
  forest: {
    label: '포레스트',
    swatch: ['#eef3ec', '#2f7d4f', '#c9a978'],
    light: FOREST_LIGHT,
    dark: FOREST_DARK
  },
  aurora: {
    label: '오로라',
    swatch: ['#e4f0fc', '#0c7cb3', '#818cf8'],
    light: AURORA_LIGHT,
    dark: AURORA_DARK
  },
  vivid: {
    label: '비비드',
    swatch: ['#eef0ff', '#2d5bf5', '#00c9a7'],
    light: VIVID_LIGHT,
    dark: VIVID_DARK
  },
  'navy-gold': {
    label: '네이비 골드',
    swatch: ['#f5efdd', '#1f3a68', '#d8b04a'],
    light: NAVY_GOLD_LIGHT,
    dark: NAVY_GOLD_DARK
  },
  grape: {
    label: '그레이프',
    swatch: ['#f3effa', '#7048c8', '#d478e8'],
    light: GRAPE_LIGHT,
    dark: GRAPE_DARK
  },
  sunset: {
    label: '선셋',
    swatch: ['#fbf1e8', '#bc4c0f', '#f5b942'],
    light: SUNSET_LIGHT,
    dark: SUNSET_DARK
  },
  ink: {
    label: '잉크',
    swatch: ['#f1f1f1', '#1a1a1a', '#767676'],
    light: INK_LIGHT,
    dark: INK_DARK
  }
};

/** 기본 프리셋(velog)의 테마 맵 — globalStyles의 무스코프 `:root` 블록과 jsdom/SSR 폴백이 쓴다. */
export const DEFAULT_THEME_PRESET: ThemePreset = THEME_PRESETS[DEFAULT_PALETTE_PRESET_ID];

/** 레지스트리 순회용 id 목록 (constants/palette와 동일 소스). */
export { PALETTE_PRESET_IDS };
export type { PalettePresetId };
