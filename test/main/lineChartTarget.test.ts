import { describe, expect, it } from 'vitest';
import type { EChartsOption, LineSeriesOption } from 'echarts';
import { buildLineChartOption } from '@/pages/Main/utils/charts';
import { getChartTheme } from '@/shared/styles';

/**
 * `buildLineChartOption`의 목표선(markLine)·도달마커(markPoint)·y축 max 가드 단위 테스트.
 * 순수 함수라 캔버스 없이 옵션 객체만 단정한다 — 가장 빠르고 신뢰도 높은 층.
 * (jsdom matchMedia는 setup.ts에서 matches:false로 고정 → isNarrowViewport=false)
 */

type Row = { x: string; y: number };

const ROWS: Row[] = [
  { x: '2026', y: 100 },
  { x: '2027', y: 200 },
  { x: '2028', y: 300 }
];

const build = (params: Partial<Parameters<typeof buildLineChartOption<Row>>[0]> = {}): EChartsOption =>
  buildLineChartOption<Row>({
    rows: ROWS,
    getXValue: (row) => row.x,
    getYValue: (row) => row.y,
    ...params
  });

/** 옵션의 첫 라인 시리즈를 꺼낸다(markLine/markPoint는 시리즈에 달린다). */
const firstSeries = (option: EChartsOption): LineSeriesOption => {
  const series = option.series as LineSeriesOption[];
  return series[0];
};

const yAxisMax = (option: EChartsOption): number | undefined =>
  (option.yAxis as { max?: number }).max;

describe('buildLineChartOption — 목표선/도달마커 없이(기본)', () => {
  it('referenceLine·reachMarker를 안 주면 markLine·markPoint가 없다', () => {
    const series = firstSeries(build());
    expect(series.markLine).toBeUndefined();
    expect(series.markPoint).toBeUndefined();
  });

  it('목표가 없으면 yAxis.max 가드를 걸지 않는다(자동 스케일)', () => {
    expect(yAxisMax(build())).toBeUndefined();
  });
});

describe('buildLineChartOption — 목표선(referenceLine)', () => {
  it('value>0이면 markLine을 목표값 위치에 그린다', () => {
    const series = firstSeries(
      build({ referenceLine: { value: 250, label: '목표 300만', reached: false } })
    );
    expect(series.markLine).toBeDefined();
    expect((series.markLine!.data as { yAxis: number }[])[0].yAxis).toBe(250);
  });

  it('미도달이면 목표선을 warning(앰버)색으로 칠한다', () => {
    const theme = getChartTheme();
    const series = firstSeries(
      build({ referenceLine: { value: 250, label: '목표', reached: false } })
    );
    const markLine = series.markLine as {
      lineStyle: { color: string };
      label: { color: string };
    };
    expect(markLine.lineStyle.color).toBe(theme.warning);
    expect(markLine.label.color).toBe(theme.warning);
  });

  it('도달이면 목표선을 success(초록)색으로 칠한다', () => {
    const theme = getChartTheme();
    const series = firstSeries(
      build({ referenceLine: { value: 250, label: '목표', reached: true } })
    );
    const markLine = series.markLine as { lineStyle: { color: string } };
    expect(markLine.lineStyle.color).toBe(theme.success);
    // 미도달 색과 반드시 달라야 의미색 구분이 성립한다.
    expect(markLine.lineStyle.color).not.toBe(theme.warning);
  });

  it('value<=0(목표 미설정)이면 markLine·yAxis.max를 모두 생략한다', () => {
    const series = firstSeries(
      build({ referenceLine: { value: 0, label: '목표', reached: false } })
    );
    expect(series.markLine).toBeUndefined();
    expect(yAxisMax(build({ referenceLine: { value: 0, label: '목표', reached: false } }))).toBeUndefined();
  });
});

describe('buildLineChartOption — yAxis.max = max(dataMax, target) * 1.1', () => {
  it('목표가 데이터 최댓값보다 크면 목표 기준으로 헤드룸을 준다', () => {
    // dataMax=300, target=1000 → 1000*1.1
    expect(yAxisMax(build({ referenceLine: { value: 1000, label: '목표', reached: false } }))).toBeCloseTo(1100);
  });

  it('데이터 최댓값이 목표보다 크면 데이터 기준으로 헤드룸을 준다', () => {
    // dataMax=300, target=100 → 300*1.1
    expect(yAxisMax(build({ referenceLine: { value: 100, label: '목표', reached: true } }))).toBeCloseTo(330);
  });
});

describe('buildLineChartOption — 도달마커(reachMarker)', () => {
  it('목표가 설정되고 reachMarker가 있으면 markPoint를 도달 좌표에 찍는다', () => {
    const theme = getChartTheme();
    const series = firstSeries(
      build({
        referenceLine: { value: 250, label: '목표', reached: true },
        reachMarker: { xCategory: '2028', value: 300, label: '달성' }
      })
    );
    expect(series.markPoint).toBeDefined();
    const markPoint = series.markPoint as {
      itemStyle: { color: string };
      data: { xAxis: string; yAxis: number }[];
    };
    expect(markPoint.itemStyle.color).toBe(theme.success);
    expect(markPoint.data[0].xAxis).toBe('2028');
    expect(markPoint.data[0].yAxis).toBe(300);
  });

  it('목표가 없으면 reachMarker를 줘도 markPoint를 그리지 않는다', () => {
    const series = firstSeries(
      build({ reachMarker: { xCategory: '2028', value: 300, label: '달성' } })
    );
    expect(series.markPoint).toBeUndefined();
  });

  it('jsdom(matchMedia matches:false)에선 markPoint 라벨을 보인다(모바일 숨김은 실브라우저 항목)', () => {
    const series = firstSeries(
      build({
        referenceLine: { value: 250, label: '목표', reached: true },
        reachMarker: { xCategory: '2028', value: 300, label: '달성' }
      })
    );
    const markPoint = series.markPoint as { label: { show: boolean } };
    expect(markPoint.label.show).toBe(true);
  });
});
