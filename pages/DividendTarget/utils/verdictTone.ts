import { color } from '@/shared/styles';
import type { InflationVerdict } from '@/shared/lib/dividendTarget';

/**
 * 물가 판정(이김 / 못 이김 / 자료 없음)의 색 — 상세 카드의 판정 줄과 비교 카드의 칩이 **같은 표**를 본다.
 *
 * 🔴 success / warning 이다 — dataPositive·dataNegative 가 아니다. 그 둘은 한국 시세 관례
 *    (상승=빨강·하락=파랑)를 따르므로 "물가를 이겼다"가 빨간 경고처럼 읽혔다(2026-11-01 실물 확인).
 *    이김/못 이김은 시세 방향이 아니라 판정이라 판정 색을 쓴다.
 * ⚠ 자료 없음은 중립색이다. 경고색으로 칠하면 "못 이김"과 같은 말이 된다.
 * ⚠ 글자는 틴트 면 위라 본문색이다 — 채움 위 컬러 글자는 대비가 보장되지 않는다.
 */
export type VerdictTone = { readonly surface: string; readonly edge: string; readonly text: string };

export const VERDICT_TONE: Record<InflationVerdict, VerdictTone> = {
  beats: { surface: color.successSurface, edge: color.success, text: color.text },
  trails: { surface: color.warningSurface, edge: color.warning, text: color.text },
  unknown: { surface: color.surfaceMuted, edge: color.border, text: color.textSecondary }
};
