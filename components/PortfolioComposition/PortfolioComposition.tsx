import { memo, useState, type CSSProperties } from 'react';
import { Card, Chip, ToggleField } from '@/components';
import { TOUR_TARGET } from '@/shared/constants';
import { CHART_SERIES_VARS } from '@/shared/styles';
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
  CardHeaderToggles,
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
  onSetTickerWeight,
  onToggleTickerFixed,
  onRemoveIncludedTicker,
  ResponsiveChart
}: PortfolioCompositionProps) {
  // 모바일(≤960px, drawer 레이아웃)에서만 기본 잠금 — 세로 스크롤 중 슬라이더 오조작 방지. 데스크톱은 기본 조절.
  // matchMedia 미지원(jsdom/test)이면 false(조절)로 떨어뜨려 기존 슬라이더 상호작용 테스트를 보존한다.
  const [isLocked, setIsLocked] = useState<boolean>(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(max-width: 960px)').matches
  );

  return (
    <Card
      title="포트폴리오 구성"
      dataTour={TOUR_TARGET.portfolioComposition}
      titleRight={
        <CardHeaderToggles>
          {/* 비율 조절 잠금 — 기본 ON(잠금). 모바일 세로 스크롤 중 슬라이더 오조작을 막고, 풀 때만 조절 가능. */}
          <ToggleField
            label="비율 조절 잠금"
            checked={isLocked}
            hideLabel
            controlWidth="58px"
            onText="잠금"
            offText="조절"
            onChange={(event) => {
              trackEvent(ANALYTICS_EVENT.TOGGLE_CHANGED, {
                field_name: 'allocationLocked',
                value: event.target.checked
              });
              setIsLocked(event.target.checked);
            }}
          />
        </CardHeaderToggles>
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
                    {/* var(--sb-chart-series-N) — 파이 조각(theme.series)과 같은 인덱스 규칙(% 8), 프리셋 자동 추종 */}
                    <AllocationColorDot color={CHART_SERIES_VARS[index % CHART_SERIES_VARS.length]} />
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
                        isLocked ||
                        includedProfiles.length <= 1 ||
                        fixedByTickerId[profile.id] ||
                        (!fixedByTickerId[profile.id] && adjustableTickerCount <= 1)
                      }
                      onChange={(event) => onSetTickerWeight(profile.id, Number(event.target.value))}
                    />
                    <AllocationLegendValue>{`${(weight * 100).toFixed(1)}%`}</AllocationLegendValue>
                    {/* 시각 순서(슬라이더 → % → 고정)와 DOM 순서를 일치시켜 탭 이동·낭독 순서가 어긋나지 않게 한다. */}
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
