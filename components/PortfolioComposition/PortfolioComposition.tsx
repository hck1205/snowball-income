import { memo, type CSSProperties } from 'react';
import { Card, ToggleField } from '@/components';
import { ALLOCATION_COLORS } from '@/shared/constants';
import type { PortfolioCompositionProps } from './PortfolioComposition.types';
import {
  AllocationChartLayout,
  AllocationColorDot,
  AllocationFixButton,
  AllocationLegend,
  AllocationLegendItem,
  AllocationLegendName,
  AllocationLegendSlider,
  AllocationLegendValue,
  ChartWrap,
  ChipRemoveButton,
  HintText,
  SelectedChip,
  SelectedChipLabel,
  SelectedChipWrap
} from '@/pages/Main/Main.shared.styled';

function PortfolioCompositionComponent({
  includedProfiles,
  normalizedAllocation,
  allocationPieOption,
  allocationPercentByTickerId,
  fixedByTickerId,
  adjustableTickerCount,
  showPortfolioDividendCenter,
  onToggleCenterDisplay,
  onSetTickerWeight,
  onToggleTickerFixed,
  onRemoveIncludedTicker,
  ResponsiveChart
}: PortfolioCompositionProps) {
  return (
    <Card
      title="포트폴리오 구성"
      titleRight={
        <ToggleField
          label="포트폴리오 중앙표시"
          checked={showPortfolioDividendCenter}
          hideLabel
          controlWidth="58px"
          onText="배당"
          offText="Blank"
          onChange={(event) => onToggleCenterDisplay(event.target.checked)}
        />
      }
    >
      {includedProfiles.length === 0 ? (
        <HintText>좌측 티커 chip을 눌러 포트폴리오에 추가하세요.</HintText>
      ) : (
        <>
          {allocationPieOption ? (
            <AllocationChartLayout>
              <ChartWrap role="img" aria-label="포트폴리오 비중 원형 차트">
                <ResponsiveChart option={allocationPieOption} replaceMerge={['graphic']} />
              </ChartWrap>
              <AllocationLegend>
                {normalizedAllocation.map(({ profile, weight }, index) => (
                  <AllocationLegendItem key={profile.id}>
                    <AllocationColorDot color={ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]} />
                    <AllocationLegendName>{profile.ticker}</AllocationLegendName>
                    <AllocationLegendSlider
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      aria-label={`${profile.ticker} 비율`}
                      value={allocationPercentByTickerId[profile.id] ?? 0}
                      style={{ '--slider-progress': `${allocationPercentByTickerId[profile.id] ?? 0}%` } as CSSProperties}
                      disabled={
                        includedProfiles.length <= 1 || fixedByTickerId[profile.id] || (!fixedByTickerId[profile.id] && adjustableTickerCount <= 1)
                      }
                      onChange={(event) => onSetTickerWeight(profile.id, Number(event.target.value))}
                    />
                    <AllocationFixButton
                      type="button"
                      active={Boolean(fixedByTickerId[profile.id])}
                      aria-pressed={Boolean(fixedByTickerId[profile.id])}
                      aria-label={`티커 ${profile.ticker} 비율 고정`}
                      title={fixedByTickerId[profile.id] ? '고정 해제' : '비율 고정'}
                      onClick={() => onToggleTickerFixed(profile.id)}
                    >
                      고정
                    </AllocationFixButton>
                    <AllocationLegendValue>{`${(weight * 100).toFixed(1)}%`}</AllocationLegendValue>
                  </AllocationLegendItem>
                ))}
              </AllocationLegend>
            </AllocationChartLayout>
          ) : null}
          <SelectedChipWrap>
            {includedProfiles.map((profile) => (
              <SelectedChip key={profile.id}>
                <SelectedChipLabel>{profile.ticker}</SelectedChipLabel>
                <ChipRemoveButton type="button" aria-label={`티커 ${profile.ticker} 삭제`} onClick={() => onRemoveIncludedTicker(profile.id)}>
                  x
                </ChipRemoveButton>
              </SelectedChip>
            ))}
          </SelectedChipWrap>
        </>
      )}
    </Card>
  );
}

const PortfolioComposition = memo(PortfolioCompositionComponent);

export default PortfolioComposition;
