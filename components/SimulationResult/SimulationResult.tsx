import { memo, useCallback, useMemo, useState } from 'react';
import type { EChartsOption } from 'echarts';
import { CircleCheck, CircleDashed, Target, type LucideIcon } from 'lucide-react';
import { Banner, Card, StatTile, ToggleField } from '@/components';
import type { StatTone } from '@/components';
import { toProgressPercent } from '@/components/common';
import { ResponsiveEChart } from '@/pages/Main/components';
import type { SimulationResultProps } from './SimulationResult.types';
import { CompactSummaryHelpButton } from '@/components/common';
import { usePalettePresetAtomValue, useSetActiveHelpWrite } from '@/jotai';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { formatApproxKRW } from '@/shared/utils';
import { getChartTheme } from '@/shared/styles';
import {
  CAPITAL_GAINS_ANNUAL_DEDUCTION,
  FINANCIAL_INCOME_TAX_THRESHOLD,
  OVERSEAS_CAPITAL_GAINS_TAX_RATE,
  TOUR_TARGET
} from '@/shared/constants';
import {
  GaugeWrapper,
  HeroSlot,
  NarrativeBlock,
  NarrativeBody,
  NarrativeIcon,
  NarrativeText,
  NarrativeToggleSlot,
  SummaryGrid,
  TaxAssumptionNote,
  TaxSection,
  TaxSectionHeader,
  TaxSectionTitle,
  WarningSlot
} from './SimulationResult.styled';
import type { NarrativeTone } from './SimulationResult.styled';

const toManWon = (won: number): string => `${(won / 10_000).toLocaleString()}만원`;

/** 부호 있는 값의 방향성(한국 증권 관례: 상승 적색 / 하락 청색). 0은 중립. */
const toneOf = (value: number): StatTone => (value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral');

function SimulationResultComponent({
  simulation,
  showQuickEstimate,
  isResultCompact,
  targetMonthlyDividend,
  onToggleCompact,
  formatResultAmount,
  formatPercent,
  targetYearLabel
}: SimulationResultProps) {
  const title = showQuickEstimate ? '시뮬레이션 결과 (간편)' : '시뮬레이션 결과 (정밀)';
  const setActiveHelp = useSetActiveHelpWrite();
  const openMonthlyAverageDividendHelp = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'open_help_simulation_monthly_average_dividend',
      placement: 'simulation_result'
    });
    setActiveHelp('simulationMonthlyAverageDividend');
  }, [setActiveHelp]);
  const openRecentPayoutMonthDividendHelp = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'open_help_simulation_recent_payout_month_dividend',
      placement: 'simulation_result'
    });
    setActiveHelp('simulationRecentPayoutMonthDividend');
  }, [setActiveHelp]);
  const openCapitalGainsTaxHelp = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'open_help_simulation_capital_gains_tax',
      placement: 'simulation_result'
    });
    setActiveHelp('simulationCapitalGainsTax');
  }, [setActiveHelp]);
  const openTotalCostBasisHelp = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'open_help_simulation_total_cost_basis',
      placement: 'simulation_result'
    });
    setActiveHelp('simulationTotalCostBasis');
  }, [setActiveHelp]);
  const openFinancialIncomeTaxHelp = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'open_help_simulation_financial_income_tax',
      placement: 'simulation_result'
    });
    setActiveHelp('simulationFinancialIncomeTax');
  }, [setActiveHelp]);

  const { summary } = simulation;
  const { financialIncomeThresholdYear } = summary;
  // 양도세 블록은 정밀 결과의 '상세' 모드에서만 보여준다 (간략 모드는 핵심 숫자만 남긴다).
  const showTaxSection = !showQuickEstimate && !isResultCompact;
  /*
   * 목표 월배당 달성률 — **표시용 비율**이라 이미 받은 결과값으로만 계산한다(엔진 재계산 없음).
   * 목표가 0 이하면 비율이 의미가 없으므로 바를 아예 그리지 않는다.
   * 도달 연도가 존재하면(타일 값에 "N년차"가 표기되면) 비율과 무관하게 달성으로 본다 —
   * 엔진은 "기간 중 도달"을 판정하고 비율의 분자는 "마지막 해 월평균"이라, 도달 후 배당이
   * 다시 내려간 시나리오에서 "2031년 도달"과 "97% 도달"이 동시에 보이는 모순을 막는다.
   */
  const targetProgress =
    targetMonthlyDividend > 0
      ? summary.targetMonthDividendReachedYear !== undefined
        ? 1
        : Math.min(1, Math.max(0, summary.finalMonthlyAverageDividend / targetMonthlyDividend))
      : undefined;

  const hasTarget = targetMonthlyDividend > 0;
  const reached = summary.targetMonthDividendReachedYear !== undefined;
  const reachedYear = summary.targetMonthDividendReachedYear;
  const durationYears = simulation.yearly.length;

  /* 진행률 뷰(수평바 ↔ 원형 게이지). 로컬 상태(영속 안 함), 기본은 수평바(false). */
  const [isGaugeView, setIsGaugeView] = useState(false);
  /* 좁은 화면(≤360px)에선 게이지 대신 바를 강제한다. matchMedia 미지원(jsdom)이면 false → 게이지 허용. */
  const [isNarrowScreen] = useState<boolean>(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(max-width: 360px)').matches
  );
  const showGauge = hasTarget && isGaugeView && !isNarrowScreen;
  /* 바와 게이지가 반드시 같은 숫자를 쓰도록 단일 출처(toProgressPercent)에서 퍼센트를 뽑는다. */
  const targetProgressPercent = targetProgress !== undefined ? toProgressPercent(targetProgress) : 0;

  /* 캔버스는 CSS 변수를 다시 읽지 않는다 — 팔레트 프리셋 전환 시 게이지 옵션을 다시 빌드한다. */
  const palettePreset = usePalettePresetAtomValue();
  const gaugeOption = useMemo<EChartsOption>(() => {
    const theme = getChartTheme();
    const gaugeColor = reached ? theme.success : theme.warning;
    return {
      series: [
        {
          type: 'gauge',
          min: 0,
          max: 100,
          startAngle: 220,
          endAngle: -40,
          radius: '100%',
          center: ['50%', '58%'],
          progress: { show: true, width: 12, roundCap: true, itemStyle: { color: gaugeColor } },
          axisLine: { lineStyle: { width: 12, color: [[1, theme.progressTrack]] as [number, string][] } },
          pointer: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          anchor: { show: false },
          title: {
            show: true,
            offsetCenter: [0, '26%'],
            fontSize: 11,
            color: theme.textMuted,
            fontFamily: theme.fontFamily
          },
          detail: {
            valueAnimation: true,
            offsetCenter: [0, '-6%'],
            fontSize: 28,
            fontWeight: 'bolder',
            color: gaugeColor,
            fontFamily: theme.fontFamily,
            formatter: '{value}%'
          },
          data: [{ value: targetProgressPercent, name: '목표 달성률' }]
        }
      ]
    };
  }, [palettePreset, reached, targetProgressPercent]);

  /* 서사 하이라이트 — 상태별 톤/아이콘/문장. 금액은 항상 formatApproxKRW(compact 토글 무관). */
  const narrative: { tone: NarrativeTone; Icon: LucideIcon; text: string } = !hasTarget
    ? {
        tone: 'muted',
        Icon: CircleDashed,
        text: "목표 월배당을 정하면 달성 시점을 계산해 드려요. 왼쪽 투자 설정의 '목표 월배당'에 금액을 입력해 보세요."
      }
    : !reached
      ? {
          tone: 'warning',
          Icon: Target,
          text: `지금 조건으로는 ${durationYears}년 안에 목표 월배당 ${formatApproxKRW(targetMonthlyDividend)}에 닿지 못해요. 마지막 해 월배당은 ${formatApproxKRW(summary.finalMonthlyAverageDividend)}입니다. 월 적립이나 투자 기간을 늘리면 도달 시점이 앞당겨져요.`
        }
      : (() => {
          const yearsToReach = simulation.yearly.findIndex((row) => row.year === reachedYear) + 1;
          const reachSuffix = yearsToReach > 0 ? ` (투자 ${yearsToReach}년차)` : '';
          return {
            tone: 'success' as NarrativeTone,
            Icon: CircleCheck,
            text: `목표 월배당 ${formatApproxKRW(targetMonthlyDividend)}을 ${targetYearLabel(reachedYear)}에 달성해요.${reachSuffix}`
          };
        })();

  return (
    <Card
      title={title}
      dataTour={TOUR_TARGET.simulationResult}
      titleRight={
        <ToggleField
          label="결과 상세도"
          checked={isResultCompact}
          hideLabel
          controlWidth="54px"
          onText="간략"
          offText="상세"
          onChange={(event) => {
            trackEvent(ANALYTICS_EVENT.TOGGLE_CHANGED, {
              field_name: 'isResultCompact',
              value: event.target.checked
            });
            onToggleCompact(event.target.checked);
          }}
        />
      }
    >
      {showQuickEstimate ? (
        <SummaryGrid>
          <HeroSlot>
            <StatTile
              emphasis="hero"
              label="최종 자산 추정"
              value={formatResultAmount(simulation.quickEstimate.endValue, isResultCompact)}
            />
          </HeroSlot>
          <StatTile
            label="연 배당 추정(세후)"
            value={formatResultAmount(simulation.quickEstimate.annualDividendApprox, isResultCompact)}
          />
          <StatTile
            label="월 배당 추정(세후)"
            value={formatResultAmount(simulation.quickEstimate.monthlyDividendApprox, isResultCompact)}
          />
          <StatTile
            label="종료 시점 배당률(가격 기준)"
            value={formatPercent(simulation.quickEstimate.yieldOnPriceAtEnd)}
          />
        </SummaryGrid>
      ) : (
        <SummaryGrid>
          {/* 사용자가 이 앱을 켠 이유. 유일한 hero 지표다. */}
          <HeroSlot>
            <StatTile
              emphasis="hero"
              label="최종 자산 가치"
              value={formatResultAmount(summary.finalAssetValue, isResultCompact)}
            />
          </HeroSlot>
          {/* 목표 도달 서사 — hero 바로 아래, 그리드 한 줄 전체. 우측 상단에 진행률 뷰 토글. */}
          <NarrativeBlock tone={narrative.tone}>
            <NarrativeIcon tone={narrative.tone} aria-hidden="true">
              <narrative.Icon size={20} strokeWidth={1.8} />
            </NarrativeIcon>
            <NarrativeBody>
              <NarrativeText tone={narrative.tone}>{narrative.text}</NarrativeText>
              {showGauge ? (
                <GaugeWrapper
                  role="img"
                  aria-label={reached ? '목표 달성' : `목표의 ${targetProgressPercent}% 도달`}
                >
                  <ResponsiveEChart option={gaugeOption} />
                </GaugeWrapper>
              ) : null}
            </NarrativeBody>
            {hasTarget ? (
              <NarrativeToggleSlot>
                <ToggleField
                  label="진행률 표시 방식"
                  hideLabel
                  checked={isGaugeView}
                  controlWidth="60px"
                  offText="바"
                  onText="게이지"
                  onChange={(event) => {
                    trackEvent(ANALYTICS_EVENT.TOGGLE_CHANGED, {
                      field_name: 'targetProgressView',
                      value: event.target.checked
                    });
                    setIsGaugeView(event.target.checked);
                  }}
                />
              </NarrativeToggleSlot>
            ) : null}
          </NarrativeBlock>
          <StatTile
            label="월배당(월평균: 연/12)"
            value={formatResultAmount(summary.finalMonthlyAverageDividend, isResultCompact)}
            action={
              <CompactSummaryHelpButton type="button" aria-label="월배당 설명" onClick={openMonthlyAverageDividendHelp}>
                ?
              </CompactSummaryHelpButton>
            }
          />
          <StatTile
            label="최근 실지급 배당"
            value={formatResultAmount(summary.finalPayoutMonthDividend, isResultCompact)}
            action={
              <CompactSummaryHelpButton
                type="button"
                aria-label="최근 실지급 배당 설명"
                onClick={openRecentPayoutMonthDividendHelp}
              >
                ?
              </CompactSummaryHelpButton>
            }
          />
          <StatTile label="누적 순배당" value={formatResultAmount(summary.totalNetDividend, isResultCompact)} />
          <StatTile label="누적 세금" value={formatResultAmount(summary.totalTaxPaid, isResultCompact)} />
          <StatTile
            label={
              hasTarget
                ? `목표 월배당 도달 (${formatResultAmount(targetMonthlyDividend, isResultCompact)})`
                : '목표 월배당'
            }
            value={hasTarget ? targetYearLabel(summary.targetMonthDividendReachedYear) : '미설정'}
            progress={showGauge ? undefined : targetProgress}
            progressLabel="목표 월배당 달성률"
          />
        </SummaryGrid>
      )}

      {showTaxSection ? (
        <TaxSection aria-label="양도소득세 추정">
          <TaxSectionHeader>
            <TaxSectionTitle>전량 매도한다면</TaxSectionTitle>
            <CompactSummaryHelpButton
              type="button"
              aria-label="전량 매도 시 예상 양도세 설명"
              onClick={openCapitalGainsTaxHelp}
            >
              ?
            </CompactSummaryHelpButton>
          </TaxSectionHeader>

          <SummaryGrid>
            <StatTile
              label="취득원가"
              value={formatResultAmount(summary.totalCostBasis, isResultCompact)}
              action={
                <CompactSummaryHelpButton type="button" aria-label="취득원가 설명" onClick={openTotalCostBasisHelp}>
                  ?
                </CompactSummaryHelpButton>
              }
            />
            {/* 평가이익은 부호가 있는 유일한 지표다 → 방향성 색을 쓴다. */}
            <StatTile
              label="평가이익"
              value={formatResultAmount(summary.unrealizedGain, isResultCompact)}
              tone={toneOf(summary.unrealizedGain)}
            />
            <StatTile
              label="전량 매도 시 예상 양도세"
              value={formatResultAmount(summary.estimatedCapitalGainsTax, isResultCompact)}
            />
            <StatTile
              label="세후 실현 가능 자산"
              value={formatResultAmount(summary.afterCapitalGainsTaxValue, isResultCompact)}
            />
          </SummaryGrid>

          <TaxAssumptionNote>
            {`해외주식 양도세 ${OVERSEAS_CAPITAL_GAINS_TAX_RATE}%, 기본공제 연 ${toManWon(CAPITAL_GAINS_ANNUAL_DEDUCTION)}, 마지막 해에 전량 매도 가정. ` +
              '계속 보유하면 내지 않는 세금이라 위쪽 자산·누적 세금에는 반영되지 않았습니다.'}
          </TaxAssumptionNote>
        </TaxSection>
      ) : null}

      {financialIncomeThresholdYear === undefined ? null : (
        <WarningSlot>
          <Banner tone="warning" role="note" aria-label="금융소득종합과세 안내">
            {/* 도움말 버튼을 문단 안에 둔다 — Banner 본문은 grid라서 형제로 두면 아래로 떨어진다. */}
            <p>
              {`이 시나리오는 ${financialIncomeThresholdYear}년차에 세전 연 배당이 ${toManWon(FINANCIAL_INCOME_TAX_THRESHOLD)}을 넘습니다. ` +
                '금융소득종합과세 대상이 되어 실제 세율이 입력한 값보다 높아질 수 있습니다. '}
              <CompactSummaryHelpButton
                type="button"
                aria-label="금융소득종합과세 설명"
                onClick={openFinancialIncomeTaxHelp}
              >
                ?
              </CompactSummaryHelpButton>
            </p>
          </Banner>
        </WarningSlot>
      )}
    </Card>
  );
}

const SimulationResult = memo(SimulationResultComponent);

export default SimulationResult;
