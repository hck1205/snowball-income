import type { RichChartData } from '@/shared/lib/richtext';

export type RichTextChartProps = {
  readonly data: RichChartData;
  /**
   * 이 차트가 그려진 본문 표. 주면 표를 **접어 두고** "표로 보기" 버튼으로 펼친다.
   * 표는 DOM 에 그대로 남는다(hidden 속성만 바뀐다) — 본문 HTML 을 다시 쓰지 않는다.
   */
  readonly table?: HTMLTableElement;
};
