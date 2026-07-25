import type { EChartsOption } from 'echarts';
import type { ComponentType } from 'react';
import type { YearlyCashflowByTicker } from '@/shared/lib/charts';

export type MonthlyCashflowProps = {
  chartOption?: EChartsOption;
  yearlyCashflowByTicker: YearlyCashflowByTicker;
  hasData?: boolean;
  emptyMessage?: string;
  /**
   * 금액 표기(축·툴팁·배당 합계). 미지정 = 원화.
   * ⚠ 합계는 **원화에서 합산한 값**을 받아 마지막에 한 번 환산한다 — 달러로 바꾼 뒤 더하면 오차가 쌓인다.
   */
  formatAmount?: (value: number) => string;
  /** 달러 표시 중일 때 차트 `aria-label` 에 붙는 접미(시각적으로만 바뀌는 통화를 스크린리더에도 알린다). */
  chartLabelSuffix?: string;
  /**
   * 지급 일정 스트립에 보여줄 종목들(포함된 종목). 비우면 스트립 자체를 렌더하지 않는다.
   * 차트(시뮬레이션 분배)와 달리 이 스트립은 **관측된 실제 지급월**을 보여준다 — 데이터가 없는
   * 종목은 utils 가 걸러낸다(지어내지 않는다).
   */
  scheduleTickers?: readonly { ticker: string; displayName: string }[];
  ResponsiveChart: ComponentType<{ option: EChartsOption; replaceMerge?: string[] }>;
};
