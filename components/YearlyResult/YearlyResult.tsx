import { Card, ToggleField } from '@/components';
import type { YearlyResultProps } from './YearlyResult.types';
import {
  ChartWrap,
  HelpMarkButton,
  SeriesFilterCheckbox,
  SeriesFilterGroup,
  SeriesFilterItem,
  SeriesFilterLabel,
  SeriesFilterRow
} from '@/pages/Main/Main.shared.styled';

export default function YearlyResult({ items, isFillOn, onToggleFill, chartOption, ResponsiveChart }: YearlyResultProps) {
  return (
    <Card title="연도별 결과">
      <SeriesFilterRow>
        <SeriesFilterGroup>
          {items.map((item) => (
            <SeriesFilterItem key={item.key}>
              <SeriesFilterLabel>
                <SeriesFilterCheckbox type="checkbox" checked={item.checked} onChange={(event) => item.onToggle(event.target.checked)} />
                {item.label}
              </SeriesFilterLabel>
              <HelpMarkButton type="button" aria-label={`${item.label} 설명 열기`} onClick={item.onHelp}>
                ?
              </HelpMarkButton>
            </SeriesFilterItem>
          ))}
        </SeriesFilterGroup>
        <ToggleField
          label="Fill"
          checked={isFillOn}
          hideLabel
          controlWidth="60px"
          stateTextColor="#111"
          onText="Color"
          offText="Blank"
          onChange={(event) => onToggleFill(event.target.checked)}
        />
      </SeriesFilterRow>
      <ChartWrap>
        <ResponsiveChart option={chartOption} replaceMerge={['series']} />
      </ChartWrap>
    </Card>
  );
}
