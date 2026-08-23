import { memo, useCallback, useState, type CSSProperties } from 'react';
import { Info, Lock, Pin, PinOff } from 'lucide-react';
import { Card, Chip, ToggleField } from '@/components';
import { ALLOCATION_COPY, SIMULATOR_COPY, TOUR_TARGET } from '@/shared/constants';
import { useDividendCenterModeAtomValue, useSetDividendCenterModeWrite } from '@/jotai';
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
  AllocationHoldingBasis,
  AllocationHoldingDivider,
  AllocationHoldingDividend,
  AllocationHoldingNotice,
  AllocationHoldingTotal,
  AllocationHoldingTotalLabel,
  AllocationLegend,
  AllocationLegendColumn,
  AllocationLegendItem,
  AllocationLegendName,
  AllocationLegendSlider,
  AllocationLegendValue,
  AllocationSrOnly,
  ChartWrap,
  HintText,
  SelectedChipWrap
} from '@/components/common';
import { TitleRightGroup } from './PortfolioComposition.styled';
import { toSharesCommitValue } from './PortfolioComposition.utils';
import HoldingRow from './components/HoldingRow';

// 힌트 줄은 하나만 노출되므로 안정적인 단일 id로 슬라이더 aria-describedby와 연결한다.
const ADJUST_HINT_ID = 'allocation-adjust-hint';
// 잠긴 수량 입력이 사유를 가리키는 곳. 줄이 하나뿐이라 안정적인 단일 id 로 묶는다.
const HOLDING_NOTICE_ID = 'allocation-holding-notice';

const GLYPH_PROPS = { strokeWidth: 1.8, 'aria-hidden': true, focusable: false } as const;

function PortfolioCompositionComponent({
  includedProfiles,
  normalizedAllocation,
  allocationPieOption,
  allocationPercentByTickerId,
  fixedByTickerId,
  adjustableTickerCount,
  onSetTickerWeight,
  onSetTickerShares,
  holdings,
  formatAmount,
  fxRate,
  onToggleTickerFixed,
  onClearAllFixed,
  onRemoveIncludedTicker,
  chartLabelSuffix = '',
  ResponsiveChart
}: PortfolioCompositionProps) {
  // 모바일(≤960px, drawer 레이아웃)에서만 기본 잠금 — 세로 스크롤 중 슬라이더 오조작 방지. 데스크톱은 기본 조절.
  // matchMedia 미지원(jsdom/test)이면 false(조절)로 떨어뜨려 기존 슬라이더 상호작용 테스트를 보존한다.
  /* 파이 중앙 표시 모드 — 카드 헤더 토글이 쓰고 `useMainComputed` 가 읽어 옵션을 만든다. */
  const dividendCenterMode = useDividendCenterModeAtomValue();
  const setDividendCenterMode = useSetDividendCenterModeWrite();

  /*
   * 타이핑 중인 수량 문자열. 화면에 서는 값은 배분에서 되읽은 주식 수지만, 그 값을 그대로 입력창에
   * 물리면 `120.` 같은 **중간 상태를 찍을 수가 없다**(숫자로 접히면서 점이 사라진다).
   * 그래서 포커스가 있는 동안만 사용자가 친 원문을 들고 있다가 blur 에서 놓는다 —
   * 그 순간 표시값이 다시 배분에서 파생돼 반올림이 정리된다.
   */
  const [sharesDraftById, setSharesDraftById] = useState<Record<string, string>>({});

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

  /*
   * 🔴 `useCallback` 이 **장식이 아니다** — 이 두 함수가 `HoldingRow` 의 `memo` 를 실제로 작동시킨다.
   *    JSX 안에서 `(next) => handleSharesChange(id, next)` 를 만들면 매 렌더 새 참조라 모든 줄이
   *    항상 다시 그려진다. id 를 인자로 받으면 참조가 고정된다.
   */
  const handleSharesChange = useCallback(
    (profileId: string, next: string) => {
      setSharesDraftById((prev) => ({ ...prev, [profileId]: next }));

      const commitValue = toSharesCommitValue(next);
      if (commitValue === null) return;
      onSetTickerShares(profileId, commitValue);
    },
    [onSetTickerShares]
  );

  const handleSharesBlur = useCallback((profileId: string) => {
    setSharesDraftById((prev) => {
      if (!(profileId in prev)) return prev;
      const next = { ...prev };
      delete next[profileId];
      return next;
    });
  }, []);

  const fixedCount = Object.values(fixedByTickerId).filter(Boolean).length;
  const showClearAllFixed = fixedCount >= 1 && !isLocked;
  const hintVisible = hintCause !== null || showClearAllFixed;

  return (
    <Card
      title="포트폴리오 구성"
      dataTour={TOUR_TARGET.portfolioComposition}
      titleRight={
        <TitleRightGroup>
          {/* 파이 중앙 배당 표시 — 켜짐(기본)이면 **종료 시점 보유 기준 예상 월배당**, 끄면 월평균(연÷12).
              🔴 값만 바뀌는 게 아니라 중앙 **라벨도 함께** 바뀐다(useMainComputed) — 런레이트는
                 추정이라 이름에 '예상'이 붙어야 한다. */}
          <ToggleField
            label={ALLOCATION_COPY.dividendCenterToggleShortLabel}
            accessibleName={ALLOCATION_COPY.dividendCenterToggleLabel}
            checked={dividendCenterMode === 'runRate'}
            onChange={(event) => {
              const next = event.target.checked ? 'runRate' : 'average';
              trackEvent(ANALYTICS_EVENT.TOGGLE_CHANGED, {
                field_name: 'dividendCenterMode',
                value: event.target.checked
              });
              setDividendCenterMode(next);
            }}
          />
          {/* 비율 조절 잠금 — 기본값은 위 useState 참고(모바일 ≤960px만 ON). 잠금을 풀 때만 슬라이더 조절 가능.
              상태(잠김/조절)는 토글 자신의 on/off 와 라벨이 말한다 — 옆에 자물쇠·연필 글리프를 덧대면
              같은 말을 두 번 하는 장식이라 두지 않는다(2026-07-28 사용자 결정). */}
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
        </TitleRightGroup>
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
              <AllocationLegendColumn>
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
                    const holding = holdings.byTickerId[profile.id] ?? { shares: 0, amount: 0, monthlyDividend: 0 };
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
                        <HoldingRow
                        profileId={profile.id}
                        displayName={displayName}
                        shares={holding.shares}
                        amount={holding.amount}
                        monthlyDividend={holding.monthlyDividend}
                        draftValue={sharesDraftById[profile.id]}
                        formatAmount={formatAmount}
                        noticeId={HOLDING_NOTICE_ID}
                        onChange={handleSharesChange}
                        onBlur={handleSharesBlur}
                      />
                      </AllocationLegendItem>
                    );
                  })}
                </AllocationLegend>
                <AllocationHoldingTotal>
                  <AllocationHoldingTotalLabel>{ALLOCATION_COPY.holdingTotalLabel}</AllocationHoldingTotalLabel>
                  <span>
                    <AllocationSrOnly>{ALLOCATION_COPY.holdingAmountSrLabel}</AllocationSrOnly>
                    {formatAmount(holdings.totalAmount)}
                  </span>
                  <AllocationHoldingDivider aria-hidden>·</AllocationHoldingDivider>
                  <AllocationHoldingDividend>
                    <AllocationSrOnly>{ALLOCATION_COPY.holdingDividendSrLabel}</AllocationSrOnly>
                    {`${ALLOCATION_COPY.holdingDividendPrefix} ${formatAmount(holdings.totalMonthlyDividend)}`}
                  </AllocationHoldingDividend>
                  <AllocationHoldingBasis>
                    {holdings.usesFxRate && fxRate !== null
                      ? `${ALLOCATION_COPY.holdingBasisNote} · ${ALLOCATION_COPY.holdingFxBasis(Math.round(fxRate).toLocaleString())}`
                      : ALLOCATION_COPY.holdingBasisNote}
                  </AllocationHoldingBasis>
                </AllocationHoldingTotal>
                {holdings.hasUnpricedShares ? (
                  <AllocationHoldingNotice id={HOLDING_NOTICE_ID}>
                    <Info size={14} {...GLYPH_PROPS} />
                    <span>{ALLOCATION_COPY.holdingFxUnavailable}</span>
                  </AllocationHoldingNotice>
                ) : null}
              </AllocationLegendColumn>
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
