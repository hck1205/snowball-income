import { memo } from 'react';
import { Card, ToggleField } from '@/components';
import type { YearlyResultProps } from './YearlyResult.types';
import {
  ChartWrap,
  HintText,
  HelpMarkButton,
  SeriesFilterCheckbox,
  SeriesFilterGroup,
  SeriesFilterItem,
  SeriesFilterLabel,
  SeriesFilterRow
} from '@/pages/Main/Main.shared.styled';

function YearlyResultComponent({
  items,
  isFillOn,
  onToggleFill,
  chartOption,
  hasData = true,
  emptyMessage,
  ResponsiveChart
}: YearlyResultProps) {
  return (
    <Card title="연도별 결과">
      {hasData ? (
        <>
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
          <ChartWrap role="img" aria-label="연도별 자산 및 배당 추이 차트">
            <ResponsiveChart option={chartOption} replaceMerge={['series']} />
          </ChartWrap>
        </>
      ) : (
        <HintText>{emptyMessage ?? '좌측 티커 생성을 통해 포트폴리오를 구성해주세요.'}</HintText>
      )}
    </Card>
  );
}

const YearlyResult = memo(YearlyResultComponent);

export default YearlyResult;
