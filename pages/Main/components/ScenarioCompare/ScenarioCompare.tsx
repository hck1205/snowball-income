import { memo, useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Columns3, X } from 'lucide-react';
import { Button, ModalActions, ModalBackdrop, ModalTitle, ResponsiveEChart } from '@/components/common';
import { useDisplayCurrencyViewAtomValue, useEffectiveColorScheme, usePalettePresetAtomValue } from '@/jotai';
import { useWorkspaceSnapshot } from '@/pages/Main/hooks';
import {
  SCENARIO_COMPARE_DIRECTION,
  buildScenarioCompareLineOption,
  buildScenarioComparison,
  createChartCompactFormatter,
  createResultAmountFormatter,
  findBestColumnIds,
  type ScenarioCompareColumn,
  type ScenarioCompareMetric
} from '@/pages/Main/utils';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import {
  ActiveTag,
  BestTag,
  BestValue,
  ChartBox,
  ChartCard,
  ChartGrid,
  CompareEntry,
  CompareNote,
  CompareScroll,
  CompareTable,
  GroupRow,
  HoldingsCell,
  MetricCell,
  MiniFill,
  MiniTrack,
  MutedValue,
  PanelHead,
  PanelSub,
  SectionTitle,
  SrOnly,
  Swatch,
  TabHead,
  TabName,
  TableSection,
  WidePanel
} from './ScenarioCompare.styled';
import type { ScenarioCompareProps } from './ScenarioCompare.types';

const TITLE = '탭 비교';
const SERIES_COUNT = 8;

/** 탭 색 = 차트 시리즈 토큰. 차트의 선(`buildScenarioCompareLineOption`)과 같은 인덱스 규칙이다. */
const swatchOf = (index: number): string => `var(--sb-chart-series-${index % SERIES_COUNT})`;

type ResultRowSpec = {
  readonly metric: ScenarioCompareMetric;
  readonly label: string;
  /** 표시 문자열. 값이 없을 때의 문구도 여기서 정한다. */
  readonly render: (column: ScenarioCompareColumn, money: (value: number) => string) => ReactNode;
};

const percentText = (ratio: number): string => `${ratio >= 0 ? '+' : ''}${(ratio * 100).toFixed(1)}%`;

const RESULT_ROWS: readonly ResultRowSpec[] = [
  { metric: 'finalAssetValue', label: '최종 자산', render: (c, money) => money(c.result!.finalAssetValue) },
  { metric: 'totalContribution', label: '총 납입', render: (c, money) => money(c.result!.totalContribution) },
  { metric: 'gain', label: '수익(자산 − 납입)', render: (c, money) => money(c.result!.gain) },
  {
    metric: 'gainRate',
    label: '수익률',
    render: (c) => (c.result!.gainRate === null ? <MutedValue>-</MutedValue> : percentText(c.result!.gainRate))
  },
  { metric: 'finalMonthlyDividend', label: '마지막 해 월 배당(세후)', render: (c, money) => money(c.result!.finalMonthlyDividend) },
  { metric: 'finalPayoutDividend', label: '최근 실지급 배당(세후)', render: (c, money) => money(c.result!.finalPayoutDividend) },
  { metric: 'totalNetDividend', label: '누적 배당(세후)', render: (c, money) => money(c.result!.totalNetDividend) },
  { metric: 'totalTaxPaid', label: '누적 세금', render: (c, money) => money(c.result!.totalTaxPaid) },
  {
    metric: 'targetReachedYear',
    label: '목표 월 배당 달성',
    render: (c, money) =>
      c.targetMonthlyDividend <= 0 ? (
        <MutedValue>목표 없음</MutedValue>
      ) : c.result!.targetReachedYear === null ? (
        <MutedValue>{money(c.targetMonthlyDividend)} 미도달</MutedValue>
      ) : (
        `${c.result!.targetReachedYear}년차`
      )
  },
  {
    metric: 'requiredMonthlyContribution',
    label: '목표까지 필요한 월 적립',
    render: (c, money) =>
      c.result!.requiredMonthlyContribution === null ? (
        <MutedValue>{c.targetMonthlyDividend <= 0 ? '-' : c.result!.targetReachedYear !== null ? '이미 도달' : '계산 불가'}</MutedValue>
      ) : (
        `월 ${money(c.result!.requiredMonthlyContribution)}`
      )
  }
];

/**
 * 시나리오 탭 **비교**(2026-11-09) — 큰 모달 하나에 차트 둘 + 전체 지표 표.
 *
 * 실사용자가 탭을 14분에 83번 오가며 조건을 비교하고 있었다(GA 11/8). 숫자는 `buildScenarioComparison`
 * (메인 화면과 같은 계산)에서 온다 — 여기는 그리기만 한다.
 *
 * ## 구성 (사용자 결정 2026-11-09: "큰 모달 + 데이터 대폭 확장")
 * 1. 연도별 자산 추이 · 연도별 월 배당 추이 — 탭마다 선 하나(N년차 축).
 * 2. 표 — 조건 9행 · 결과 10행. 결과 칸마다 그 행의 최댓값 대비 작은 막대와 "최고"(색이 아니라 글자로도).
 *    ⚠ 권유가 아니라 숫자의 방향이다 — 그래서 조건(넣은 돈)을 같은 표 위에 둔다.
 *
 * 표는 **열 때 한 번** 만든다(목표 역산까지 탭마다 돌아 가볍지 않다). 지금 탭의 저장 전 편집도 담는다.
 */
function ScenarioCompareComponent({ tabCount, onSelectScenario }: ScenarioCompareProps) {
  const { buildCurrentScenariosSnapshot } = useWorkspaceSnapshot();
  const display = useDisplayCurrencyViewAtomValue();
  /* 캔버스는 CSS 변수를 다시 읽지 않는다 — 테마가 바뀌면 차트 옵션을 다시 만든다(useMainComputed 와 같은 이유). */
  const palettePreset = usePalettePresetAtomValue();
  const colorScheme = useEffectiveColorScheme();
  const [columns, setColumns] = useState<ScenarioCompareColumn[] | null>(null);
  const isOpen = columns !== null;

  const open = useCallback(() => {
    const { scenarios, activeScenarioId } = buildCurrentScenariosSnapshot();
    trackEvent(ANALYTICS_EVENT.SCENARIO_TAB_ACTION, { action: 'compare_open', tab_count: scenarios.length });
    setColumns(buildScenarioComparison(scenarios, activeScenarioId));
  }, [buildCurrentScenariosSnapshot]);

  const close = useCallback(() => setColumns(null), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [close, isOpen]);

  const select = useCallback(
    (scenarioId: string) => {
      trackEvent(ANALYTICS_EVENT.SCENARIO_TAB_ACTION, { action: 'compare_select', scenario_id: scenarioId });
      onSelectScenario(scenarioId);
      close();
    },
    [close, onSelectScenario]
  );

  const formatAmount = useMemo(() => createResultAmountFormatter(display.currency, display.rate), [display.currency, display.rate]);
  const formatCompact = useMemo(() => createChartCompactFormatter(display.currency, display.rate), [display.currency, display.rate]);
  const money = useCallback((value: number) => formatAmount(value, true), [formatAmount]);

  const charts = useMemo(() => {
    if (!columns) return null;
    const lines = (pick: (point: { assetValue: number; monthlyDividend: number }) => number) =>
      columns.flatMap((column, index) =>
        column.result ? [{ name: column.name, colorIndex: index, values: column.result.yearly.map(pick) }] : []
      );
    return {
      asset: buildScenarioCompareLineOption({
        series: lines((point) => point.assetValue),
        formatValue: money,
        formatCompact
      }),
      dividend: buildScenarioCompareLineOption({
        series: lines((point) => point.monthlyDividend),
        formatValue: money,
        formatCompact
      })
    };
    // palettePreset·colorScheme: 차트 색을 테마에서 읽는다(위 주석).
  }, [colorScheme, columns, formatCompact, money, palettePreset]);

  if (tabCount < 2) return null;

  const modalRoot = typeof document !== 'undefined' ? document.body : null;
  const calculable = columns?.filter((column) => column.result !== null).length ?? 0;

  const conditionRow = (label: string, render: (column: ScenarioCompareColumn) => ReactNode) => (
    <tr>
      <th scope="row">{label}</th>
      {(columns ?? []).map((column) => (
        <td key={column.id}>{render(column)}</td>
      ))}
    </tr>
  );

  const resultRow = ({ metric, label, render }: ResultRowSpec) => {
    const all = columns ?? [];
    const best = findBestColumnIds(all, metric);
    const bestLabel = SCENARIO_COMPARE_DIRECTION[metric] === 'lower' ? (metric === 'targetReachedYear' ? '가장 빠름' : '가장 적음') : '최고';
    const values = all.map((column) => {
      const value = column.result?.[metric];
      return typeof value === 'number' && Number.isFinite(value) ? value : null;
    });
    const maxAbs = Math.max(0, ...values.map((value) => (value === null ? 0 : Math.abs(value))));

    return (
      <tr key={metric}>
        <th scope="row">{label}</th>
        {all.map((column, index) => {
          if (!column.result) {
            return (
              <td key={column.id}>
                <MutedValue>계산 불가</MutedValue>
              </td>
            );
          }
          const value = values[index];
          const isBest = best.has(column.id);
          const percent = value !== null && maxAbs > 0 ? Math.max(3, (Math.abs(value) / maxAbs) * 100) : 0;
          const text = render(column, money);

          return (
            <td key={column.id}>
              <MetricCell style={{ '--swatch': swatchOf(index), '--bar': `${percent}%` } as CSSProperties}>
                <span>
                  {isBest ? <BestValue>{text}</BestValue> : text}
                  {isBest ? <BestTag>{bestLabel}</BestTag> : null}
                </span>
                {value !== null ? (
                  <MiniTrack aria-hidden>
                    <MiniFill />
                  </MiniTrack>
                ) : null}
              </MetricCell>
            </td>
          );
        })}
      </tr>
    );
  };

  return (
    <>
      <CompareEntry>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          startIcon={<Columns3 size={16} strokeWidth={1.8} aria-hidden focusable={false} />}
          onClick={open}
        >
          {TITLE} ({tabCount}개)
        </Button>
      </CompareEntry>

      {isOpen && modalRoot
        ? createPortal(
            <ModalBackdrop
              role="dialog"
              aria-modal="true"
              aria-label={TITLE}
              onClick={(event) => {
                if (event.target === event.currentTarget) close();
              }}
            >
              <WidePanel>
                <PanelHead>
                  <div>
                    <ModalTitle>{TITLE}</ModalTitle>
                    <PanelSub>
                      탭 {columns.length}개 · 계산 가능 {calculable}개 · 세후, 각 탭의 조건 그대로 계산한 값
                    </PanelSub>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    iconOnly
                    aria-label="탭 비교 닫기"
                    startIcon={<X size={18} strokeWidth={1.8} aria-hidden focusable={false} />}
                    onClick={close}
                  />
                </PanelHead>

                {charts && calculable > 0 ? (
                  <ChartGrid>
                    <ChartCard>
                      <SectionTitle as="figcaption">자산 추이</SectionTitle>
                      <ChartBox>
                        <ResponsiveEChart option={charts.asset} />
                      </ChartBox>
                    </ChartCard>
                    <ChartCard>
                      <SectionTitle as="figcaption">월 배당 추이(세후)</SectionTitle>
                      <ChartBox>
                        <ResponsiveEChart option={charts.dividend} />
                      </ChartBox>
                    </ChartCard>
                  </ChartGrid>
                ) : null}

                <TableSection aria-label="탭별 조건과 결과">
                  <SectionTitle>조건과 결과</SectionTitle>
                  <CompareScroll>
                    <CompareTable aria-label="탭별 조건과 결과">
                      <thead>
                        <tr>
                          <th scope="col">항목</th>
                          {columns.map((column, index) => (
                            <th key={column.id} scope="col">
                              <TabHead style={{ '--swatch': swatchOf(index) } as CSSProperties}>
                                <TabName>
                                  <Swatch aria-hidden />
                                  {column.name}
                                </TabName>
                                {column.isActive ? (
                                  <ActiveTag>보는 중</ActiveTag>
                                ) : (
                                  <Button type="button" variant="secondary" size="sm" onClick={() => select(column.id)}>
                                    이 탭 보기<SrOnly> ({column.name})</SrOnly>
                                  </Button>
                                )}
                              </TabHead>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <GroupRow>
                          <th scope="rowgroup" colSpan={columns.length + 1}>
                            조건
                          </th>
                        </GroupRow>
                        <tr>
                          <th scope="row">종목 구성</th>
                          {columns.map((column) => (
                            <HoldingsCell key={column.id}>{column.holdingsLine || '종목 없음'}</HoldingsCell>
                          ))}
                        </tr>
                        {conditionRow('종목 수', (column) => `${column.tickerCount}종목`)}
                        {conditionRow('시작일', (column) => column.investmentStartDate)}
                        {conditionRow('초기 투자금', (column) => money(column.initialInvestment))}
                        {conditionRow('월 적립금', (column) => money(column.monthlyContribution))}
                        {conditionRow('투자 기간', (column) => `${column.durationYears}년`)}
                        {conditionRow('목표 월 배당', (column) =>
                          column.targetMonthlyDividend > 0 ? money(column.targetMonthlyDividend) : <MutedValue>없음</MutedValue>
                        )}
                        {conditionRow('배당 재투자', (column) =>
                          column.reinvestPercent > 0 ? `${column.reinvestPercent}%` : <MutedValue>안 함</MutedValue>
                        )}
                        {conditionRow('배당소득세', (column) =>
                          column.taxRatePercent === null ? <MutedValue>종목별 기본</MutedValue> : `${column.taxRatePercent}%`
                        )}

                        <GroupRow>
                          <th scope="rowgroup" colSpan={columns.length + 1}>
                            결과
                          </th>
                        </GroupRow>
                        {RESULT_ROWS.map(resultRow)}
                      </tbody>
                    </CompareTable>
                  </CompareScroll>
                  <CompareNote>
                    막대는 그 행에서 가장 큰 값 대비 길이입니다. "최고"·"가장 적음"·"가장 빠름"은 숫자의 방향일 뿐 권유가
                    아닙니다 — 넣는 돈과 기간이 다르면 결과도 다릅니다. 수익률 = 최종 자산 ÷ 총 납입 − 1.
                  </CompareNote>
                </TableSection>

                <ModalActions>
                  <Button type="button" variant="secondary" onClick={close}>
                    닫기
                  </Button>
                </ModalActions>
              </WidePanel>
            </ModalBackdrop>,
            modalRoot
          )
        : null}
    </>
  );
}

const ScenarioCompare = memo(ScenarioCompareComponent);

export default ScenarioCompare;
