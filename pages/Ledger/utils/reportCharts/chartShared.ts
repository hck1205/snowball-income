/**
 * 차트 옵션이 함께 쓰는 **조각** — 숫자 표기, 격자 여백, 범례.
 *
 * ## 🔴 이 화면의 색 규율
 *
 * - **색 단독 채널 금지.** 어떤 계열도 색만으로 구별되지 않는다 — 범례 이름과 툴팁 숫자가
 *   언제나 함께 선다. 그래서 범례를 끄지 않는다.
 * - **하드코딩 hex 0개.** 색은 전부 `ChartTheme`(=CSS 변수)에서 온다. 프리셋·다크모드가 따라온다.
 *
 * ## ⚠ 달 이름을 축약하지 않는다
 *
 * `8월` 로 줄이면 해가 넘어갈 때 작년 8월과 올해 8월이 같은 글자가 된다. `26.08` 로 적는다.
 */
import { buildLegendStyle } from '@/shared/styles';
import type { ChartTheme } from '@/shared/styles';

/** `2026-08` → `26.08`. 축에 들어갈 짧은 표기이되 **해를 버리지 않는다.** */
export const shortMonth = (month: string): string => {
  const [year, value] = month.split('-');
  return `${year.slice(2)}.${value}`;
};

export const KRW = (value: number): string => `${Math.round(value).toLocaleString('ko-KR')}원`;

/** 축 라벨용 — 만/억 단위로 접는다. 원 단위 그대로면 축이 숫자로 뒤덮인다. */
export const shortKRW = (value: number): string => {
  const abs = Math.abs(value);
  if (abs >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}억`;
  if (abs >= 10_000) return `${Math.round(value / 10_000).toLocaleString('ko-KR')}만`;
  return `${Math.round(value)}`;
};

/**
 * 격자 여백.
 *
 * 🔴 **범례가 있는 차트는 위를 더 비운다.** ECharts 의 범례는 기본으로 맨 위(top: 0)에 그려지는데,
 *    격자가 24px 에서 시작하면 축 라벨과 범례가 겹친다(2026-08-09 사용자 지적).
 * ⚠ 범례가 없는 차트에 같은 값을 쓰면 위가 휑하다 — 그래서 둘로 나눈다.
 */
export const baseGrid = { left: 8, right: 8, top: 24, bottom: 8, containLabel: true } as const;

/** 범례가 있는 차트용. 🔴 위 여백이 범례를 피한다. */
export const legendGrid = { left: 8, right: 8, top: 64, bottom: 8, containLabel: true } as const;

/** 범례 자체도 위에서 조금 내려 카드 제목과 붙지 않게 한다. */
export const topLegend = (theme: ChartTheme) => ({
  ...buildLegendStyle(theme),
  top: 4,
  type: 'scroll' as const
});
