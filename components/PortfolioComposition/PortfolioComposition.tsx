import { memo, type CSSProperties } from 'react';
import { Card, Chip, ToggleField } from '@/components';
import { ALLOCATION_COLORS, TOUR_TARGET } from '@/shared/constants';
import { getTickerDisplayName } from '@/shared/utils';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
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
  HintText,
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
      dataTour={TOUR_TARGET.portfolioComposition}
      titleRight={
        <ToggleField
          label="포트폴리오 중앙표시"
          checked={showPortfolioDividendCenter}
          hideLabel
          controlWidth="58px"
          onText="배당"
          offText="Blank"
          onChange={(event) => {
            trackEvent(ANALYTICS_EVENT.TOGGLE_CHANGED, {
              field_name: 'showPortfolioDividendCenter',
              value: event.target.checked
            });
            onToggleCenterDisplay(event.target.checked);
          }}
        />
      }
    >
      {includedProfiles.length === 0 ? (
        <HintText>좌측 티커 생성을 통해 포트폴리오를 구성해주세요.</HintText>
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
                    <AllocationLegendName>{getTickerDisplayName(profile.ticker, profile.name)}</AllocationLegendName>
                    <AllocationLegendSlider
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      aria-label={`${getTickerDisplayName(profile.ticker, profile.name)} 비율`}
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
                      aria-label={`티커 ${getTickerDisplayName(profile.ticker, profile.name)} 비율 고정`}
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
            {includedProfiles.map((profile) => {
              const displayName = getTickerDisplayName(profile.ticker, profile.name);

              return (
                <Chip
                  key={profile.id}
                  selected
                  // 접근성 이름은 기존 그대로 유지한다(테스트가 이 문구로 칩의 삭제 버튼을 잡는다).
                  removeAriaLabel={`티커 ${displayName} 삭제`}
                  onRemove={() => onRemoveIncludedTicker(profile.id)}
                >
                  {displayName}
                </Chip>
              );
            })}
          </SelectedChipWrap>
        </>
      )}
    </Card>
  );
}

const PortfolioComposition = memo(PortfolioCompositionComponent);

export default PortfolioComposition;
