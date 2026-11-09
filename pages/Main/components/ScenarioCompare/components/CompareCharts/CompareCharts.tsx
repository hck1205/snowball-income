import { memo, useMemo } from 'react';
import { ResponsiveEChart } from '@/components/common';
import { useEffectiveColorScheme, usePalettePresetAtomValue } from '@/jotai';
import { buildScenarioCompareLineOption, type ScenarioComparePoint } from '@/pages/Main/utils';
import { ChartBox, ChartCaption, ChartCard, ChartGrid } from './CompareCharts.styled';
import type { CompareChartsProps } from './CompareCharts.types';

/**
 * 탭 비교의 **연도별 추이** 두 장 — 자산 · 월 배당(세후). 탭마다 선 하나(색은 표 머리 점과 같은 인덱스).
 * 계산 불가 탭은 선이 없다. 계산 가능한 탭이 하나도 없으면 아무것도 그리지 않는다.
 */
function CompareChartsComponent({ columns, formatValue, formatCompact }: CompareChartsProps) {
  /* 캔버스는 CSS 변수를 다시 읽지 않는다 — 테마가 바뀌면 옵션을 다시 만든다(useMainComputed 와 같은 이유). */
  const palettePreset = usePalettePresetAtomValue();
  const colorScheme = useEffectiveColorScheme();

  const options = useMemo(() => {
    const lines = (pick: (point: ScenarioComparePoint) => number) =>
      columns.flatMap((column, index) =>
        column.result ? [{ name: column.name, colorIndex: index, values: column.result.yearly.map(pick) }] : []
      );
    const asset = lines((point) => point.assetValue);
    if (asset.length === 0) return null;

    return {
      asset: buildScenarioCompareLineOption({ series: asset, formatValue, formatCompact }),
      dividend: buildScenarioCompareLineOption({
        series: lines((point) => point.monthlyDividend),
        formatValue,
        formatCompact
      })
    };
    // palettePreset·colorScheme: 차트 색을 테마에서 읽는다(위 주석).
  }, [colorScheme, columns, formatCompact, formatValue, palettePreset]);

  if (!options) return null;

  return (
    <ChartGrid>
      <ChartCard>
        <ChartCaption>자산 추이</ChartCaption>
        <ChartBox>
          <ResponsiveEChart option={options.asset} />
        </ChartBox>
      </ChartCard>
      <ChartCard>
        <ChartCaption>월 배당 추이(세후)</ChartCaption>
        <ChartBox>
          <ResponsiveEChart option={options.dividend} />
        </ChartBox>
      </ChartCard>
    </ChartGrid>
  );
}

const CompareCharts = memo(CompareChartsComponent);

export default CompareCharts;
