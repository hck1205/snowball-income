import type { ThemeTokens } from '../semantic';

export type ThemePreset = {
  /** 스위처에 노출되는 한국어 이름 */
  label: string;
  /** 스위처 미리보기 스와치 3색 (bg 틴트 / 시그니처 / 보조) — 표시 전용 */
  swatch: readonly [string, string, string];
  light: ThemeTokens;
  dark: ThemeTokens;
};
