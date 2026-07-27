import { ToggleField } from '@/components';
import { Select } from '@/components/common';
import { ChartPanel } from '@/pages/Main/components/ChartPanel';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import type { PostInvestmentDividendProjectionRow } from '@/pages/Main/utils';
import type { PostInvestmentProjectionPanelProps } from './PostInvestmentProjectionPanel.types';
import { ProjectionControls, ProjectionYearField, ProjectionYearSuffix } from './PostInvestmentProjectionPanel.styled';

/* 행 getter — 부모의 useCallback에서 모듈 스코프 순수 함수로 옮겼다(참조 안정성·동작 동일). */
const getProjectedYear = (row: PostInvestmentDividendProjectionRow) => `${row.year}`;
const getProjectedMonthlyDividend = (row: PostInvestmentDividendProjectionRow) => row.monthlyDividend;
const getProjectedAssetValue = (row: PostInvestmentDividendProjectionRow) => row.assetValue;

/**
 * "투자 종료 후 월배당/자산가치 추정" 차트 섹션 — 기간(년) 셀렉트 + 배당/자산 토글 컨트롤 포함.
 * MainRightPanel 본체에서 뷰 조각만 분리했다 — 추정 행 계산·제목(성장률) 계산은 부모에 있다.
 */
function PostInvestmentProjectionPanel({
  title,
  rows,
  hasData,
  emptyMessage,
  projectionYears,
  onProjectionYearsChange,
  isAssetView,
  onAssetViewChange,
  yAxisLabelFormatter,
  chartLabelSuffix
}: PostInvestmentProjectionPanelProps) {
  return (
    <ChartPanel
      title={title}
      titleRight={
        <ProjectionControls>
          <ProjectionYearField>
            <Select
              size="sm"
              width="64px"
              aria-label="향후 확인 기간 선택 (년)"
              value={projectionYears}
              onChange={(event) => onProjectionYearsChange(Number(event.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={40}>40</option>
              <option value={50}>50</option>
            </Select>
            <ProjectionYearSuffix>년</ProjectionYearSuffix>
          </ProjectionYearField>
          <ToggleField
            label="자산"
            accessibleName="자산가치로 보기"
            checked={isAssetView}
            onChange={(event) => {
              trackEvent(ANALYTICS_EVENT.TOGGLE_CHANGED, {
                field_name: 'postInvestmentProjectionView',
                value: event.target.checked
              });
              onAssetViewChange(event.target.checked);
            }}
          />
        </ProjectionControls>
      }
      rows={rows}
      hasData={hasData}
      emptyMessage={emptyMessage}
      getXValue={getProjectedYear}
      getYValue={isAssetView ? getProjectedAssetValue : getProjectedMonthlyDividend}
      yAxisLabelFormatter={yAxisLabelFormatter}
      chartLabelSuffix={chartLabelSuffix}
    />
  );
}

export default PostInvestmentProjectionPanel;
