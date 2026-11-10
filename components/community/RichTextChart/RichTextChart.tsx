import { useId, useLayoutEffect, useMemo, useState } from 'react';
import { ResponsiveEChart } from '@/components/common';
import { useEffectiveColorScheme, usePalettePresetAtomValue } from '@/jotai';
import { ChartBlock, ChartFrame, TableToggle, ToggleCaret } from './RichTextChart.styled';
import { buildRichChartOption, richChartHeight } from './RichTextChart.utils';
import type { RichTextChartProps } from './RichTextChart.types';

/**
 * 본문 표(`<table data-chart>`)를 차트로 그린다(2026-11-09). 데이터는 `parseRichChartTable` 이 표에서 읽은 것뿐이다.
 * 캔버스는 CSS 변수를 다시 읽지 않아 테마가 바뀌면 옵션을 다시 만든다(useMainComputed 와 같은 이유).
 *
 * ## 표 접기(2026-11-10)
 * `table` 을 받으면 표를 접어 두고 버튼으로 펼친다. 차트 아래에 같은 숫자의 표가 늘 펼쳐져 있으면
 * 글이 두 배로 길어지고 시선이 두 번 같은 것을 읽는다. 정확한 값이 필요한 사람만 펼친다.
 */
export default function RichTextChart({ data, table }: RichTextChartProps) {
  const palettePreset = usePalettePresetAtomValue();
  const colorScheme = useEffectiveColorScheme();
  const [tableOpen, setTableOpen] = useState(false);
  const tableId = useId();
  // palettePreset·colorScheme: 차트 색을 테마에서 읽는다(위 주석).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const option = useMemo(() => buildRichChartOption(data), [data, palettePreset, colorScheme]);

  useLayoutEffect(() => {
    if (!table) return;
    table.hidden = !tableOpen;
    if (!table.id) table.id = tableId;
  }, [table, tableOpen, tableId]);

  useLayoutEffect(() => {
    if (!table) return;
    return () => {
      table.hidden = false;
    };
  }, [table]);

  return (
    <ChartBlock>
      <ChartFrame
        chartHeight={richChartHeight(data)}
        role="img"
        aria-label={`${data.series.map((item) => item.name).join(', ')} 차트`}
      >
        <ResponsiveEChart option={option} />
      </ChartFrame>
      {table ? (
        <TableToggle
          type="button"
          aria-expanded={tableOpen}
          aria-controls={table.id || tableId}
          onClick={() => setTableOpen((open) => !open)}
        >
          {tableOpen ? '표 접기' : `표로 보기 · ${data.categories.length}행`}
          <ToggleCaret open={tableOpen} aria-hidden="true">
            ▾
          </ToggleCaret>
        </TableToggle>
      ) : null}
    </ChartBlock>
  );
}
