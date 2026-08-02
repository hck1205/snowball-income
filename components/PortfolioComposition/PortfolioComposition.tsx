import { memo, useState, type CSSProperties } from 'react';
import { Info, Lock, Pin, PinOff } from 'lucide-react';
import { Card, Chip, ToggleField } from '@/components';
import { ALLOCATION_COPY, SIMULATOR_COPY, TOUR_TARGET } from '@/shared/constants';
import { CHART_SERIES_VARS } from '@/shared/styles';
import { assignSeriesIndexes } from '@/shared/lib/tickerSeries';
import { getTickerDisplayName } from '@/shared/utils';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import type { PortfolioCompositionProps } from './PortfolioComposition.types';
import {
  AllocationChartLayout,
  AllocationClearFixedButton,
  AllocationColorDot,
  AllocationFixButton,
  AllocationHint,
  AllocationLegend,
  AllocationLegendItem,
  AllocationLegendName,
  AllocationLegendSlider,
  AllocationLegendValue,
  ChartWrap,
  HintText,
  SelectedChipWrap
} from '@/components/common';

// 힌트 줄은 하나만 노출되므로 안정적인 단일 id로 슬라이더 aria-describedby와 연결한다.
const ADJUST_HINT_ID = 'allocation-adjust-hint';

const GLYPH_PROPS = { strokeWidth: 1.8, 'aria-hidden': true, focusable: false } as const;

function PortfolioCompositionComponent({
  includedProfiles,
  normalizedAllocation,
  allocationPieOption,
  allocationPercentByTickerId,
  fixedByTickerId,
  adjustableTickerCount,
  onSetTickerWeight,
  onToggleTickerFixed,
  onClearAllFixed,
  onRemoveIncludedTicker,
  chartLabelSuffix = '',
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

  /*
   * 종목 → 팔레트 인덱스. 🔴 파이 조각과 **같은 함수**를 부른다(근거는 아래 범례 주석).
   * 순수·결정적이라 memo 로 감싸지 않아도 매 렌더 같은 값이고, 종목 8개 수준에서 비용도 없다.
   */
  const seriesIndexes = assignSeriesIndexes(
    normalizedAllocation.map(({ profile }) => profile.ticker),
    CHART_SERIES_VARS.length
  );

  // 비활성 사유는 우선순위로 하나만 노출한다(줄마다 반복 금지).
  // 단일 종목을 잠금보다 먼저 분기한다 — 단일 종목은 잠금을 풀어도 length<=1로 계속 disabled라
  // "잠금을 풀면 드래그할 수 있어요"(hintLocked)는 거짓 안내가 된다(단일이면 항상 single 힌트).
  const hintCause: 'locked' | 'oneAdjustable' | 'single' | null =
    includedProfiles.length === 1
      ? 'single'
      : isLocked
        ? 'locked'
        : adjustableTickerCount <= 1 && includedProfiles.length > 1
          ? 'oneAdjustable'
          : null;

  const fixedCount = Object.values(fixedByTickerId).filter(Boolean).length;
  const showClearAllFixed = fixedCount >= 1 && !isLocked;
  const hintVisible = hintCause !== null || showClearAllFixed;

  return (
    <Card
      title="포트폴리오 구성"
      dataTour={TOUR_TARGET.portfolioComposition}
      titleRight={
        /* 비율 조절 잠금 — 기본값은 위 useState 참고(모바일 ≤960px만 ON). 잠금을 풀 때만 슬라이더 조절 가능.
           상태(잠김/조절)는 토글 자신의 on/off 와 라벨이 말한다 — 옆에 자물쇠·연필 글리프를 덧대면
           같은 말을 두 번 하는 장식이라 두지 않는다(2026-07-28 사용자 결정). */
        <ToggleField
          label={ALLOCATION_COPY.lockToggleShortLabel}
          accessibleName={ALLOCATION_COPY.lockToggleLabel}
          checked={isLocked}
          onChange={(event) => {
            trackEvent(ANALYTICS_EVENT.TOGGLE_CHANGED, {
              field_name: 'allocationLocked',
              value: event.target.checked
            });
            setIsLocked(event.target.checked);
          }}
        />
      }
    >
      {includedProfiles.length === 0 ? (
        <HintText>{SIMULATOR_COPY.emptyPortfolioHint}</HintText>
      ) : (
        <>
          {allocationPieOption ? (
            <AllocationChartLayout>
              <ChartWrap role="img" aria-label={`포트폴리오 비중 원형 차트${chartLabelSuffix}`}>
                <ResponsiveChart option={allocationPieOption} replaceMerge={['graphic']} />
              </ChartWrap>
              <AllocationLegend>
                {normalizedAllocation.map(({ profile, weight }) => {
                  const displayName = getTickerDisplayName(profile.ticker, profile.name);
                  /*
                   * 🔴 파이 조각(`pages/Main/utils/charts.ts`)과 **같은 배정**을 쓴다.
                   * 종전엔 양쪽 다 `index % 8` 이라 우연히 맞았는데, 그건 두 곳이 **같은 순서**를
                   * 받을 때만 성립하는 계약이었다(순서가 갈리면 조용히 어긋난다).
                   * 지금은 둘 다 `assignSeriesIndexes` 를 각자 불러 같은 값을 얻는다 — 순수·결정적이라
                   * 맵을 넘겨받을 필요가 없고, 순서가 달라져도 어긋나지 않는다.
                   */
                  const seriesColor = CHART_SERIES_VARS[
                    (seriesIndexes.get(profile.ticker) ?? 0) % CHART_SERIES_VARS.length
                  ];
                  const selfFixed = Boolean(fixedByTickerId[profile.id]);
                  const isDisabled =
                    isLocked ||
                    includedProfiles.length <= 1 ||
                    selfFixed ||
                    (!selfFixed && adjustableTickerCount <= 1);

                  return (
                    <AllocationLegendItem key={profile.id}>
                      {/* var(--sb-chart-series-N) — 프리셋·다크 전환을 리렌더 없이 따라간다 */}
                      <AllocationColorDot color={seriesColor} />
                      <AllocationLegendName>{displayName}</AllocationLegendName>
                      <AllocationLegendSlider
                        type="range"
                        $seriesColor={seriesColor}
                        min={0}
                        max={100}
                        step={1}
                        aria-label={`${displayName} 비율`}
                        // 자기 고정 행은 active Pin + aria-pressed가 사유를 전달하므로 힌트를 참조하지 않는다.
                        aria-describedby={isDisabled && !selfFixed && hintCause ? ADJUST_HINT_ID : undefined}
                        value={allocationPercentByTickerId[profile.id] ?? 0}
                        style={{ '--slider-progress': `${allocationPercentByTickerId[profile.id] ?? 0}%` } as CSSProperties}
                        disabled={isDisabled}
                        onChange={(event) => onSetTickerWeight(profile.id, Number(event.target.value))}
                      />
                      <AllocationLegendValue>{`${(weight * 100).toFixed(1)}%`}</AllocationLegendValue>
                      {/* 시각 순서(슬라이더 → % → 고정)와 DOM 순서를 일치시켜 탭 이동·낭독 순서가 어긋나지 않게 한다. */}
                      <AllocationFixButton
                        type="button"
                        active={selfFixed}
                        aria-pressed={selfFixed}
                        aria-label={
                          selfFixed
                            ? ALLOCATION_COPY.fixButtonAriaUnfix(displayName)
                            : ALLOCATION_COPY.fixButtonAriaFix(displayName)
                        }
                        title={selfFixed ? ALLOCATION_COPY.fixButtonTitleUnfix : ALLOCATION_COPY.fixButtonTitleFix}
                        onClick={() => onToggleTickerFixed(profile.id)}
                      >
                        <Pin size={14} {...GLYPH_PROPS} />
                        {ALLOCATION_COPY.fixButtonText}
                      </AllocationFixButton>
                    </AllocationLegendItem>
                  );
                })}
              </AllocationLegend>
            </AllocationChartLayout>
          ) : null}
          {hintVisible ? (
            <AllocationHint id={ADJUST_HINT_ID}>
              {hintCause === 'locked' ? (
                <>
                  <Lock size={16} {...GLYPH_PROPS} />
                  <span>{ALLOCATION_COPY.hintLocked}</span>
                </>
              ) : null}
              {hintCause === 'oneAdjustable' ? (
                <>
                  <Pin size={16} {...GLYPH_PROPS} />
                  <span>{ALLOCATION_COPY.hintOneAdjustable}</span>
                </>
              ) : null}
              {hintCause === 'single' ? (
                <>
                  <Info size={16} {...GLYPH_PROPS} />
                  <span>{ALLOCATION_COPY.hintSingleTicker}</span>
                </>
              ) : null}
              {showClearAllFixed ? (
                <AllocationClearFixedButton
                  type="button"
                  aria-label={ALLOCATION_COPY.clearAllFixedAria}
                  onClick={onClearAllFixed}
                >
                  <PinOff size={14} {...GLYPH_PROPS} />
                  {ALLOCATION_COPY.clearAllFixedLabel}
                </AllocationClearFixedButton>
              ) : null}
            </AllocationHint>
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
