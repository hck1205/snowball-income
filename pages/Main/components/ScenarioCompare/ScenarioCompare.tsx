import { memo, useCallback, useId, useMemo, useState, type CSSProperties } from 'react';
import { Columns3 } from 'lucide-react';
import { Button } from '@/components/common';
import { useDisplayCurrencyViewAtomValue } from '@/jotai';
import { useWorkspaceSnapshot } from '@/pages/Main/hooks';
import {
  buildScenarioComparison,
  createResultAmountFormatter,
  findBestColumnIds,
  type ScenarioCompareColumn,
  type ScenarioCompareMetric
} from '@/pages/Main/utils';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import {
  ActiveTag,
  BarFill,
  BarList,
  BarName,
  BarRow,
  BarTrack,
  BarValue,
  BestTag,
  CompareEntry,
  CompareNote,
  ComparePanel,
  Legend,
  LegendItem,
  LegendMeta,
  LegendName,
  MetricBlock,
  MetricGrid,
  MetricTitle,
  MutedValue,
  PanelHead,
  PanelTitle,
  SrOnly,
  Swatch
} from './ScenarioCompare.styled';
import type { ScenarioCompareProps } from './ScenarioCompare.types';

const TITLE = '탭 비교';
const SERIES_COUNT = 8;

/** 탭 색 = 차트 시리즈 토큰(테마·프리셋을 따른다). 순서는 탭 순서 — 탭을 옮기면 색도 따라간다. */
const swatchOf = (index: number): string => `var(--sb-chart-series-${index % SERIES_COUNT})`;

type MetricSpec = {
  readonly metric: ScenarioCompareMetric;
  readonly title: string;
  readonly bestLabel: string;
};

const METRICS: readonly MetricSpec[] = [
  { metric: 'finalAssetValue', title: '최종 자산', bestLabel: '최고' },
  { metric: 'finalMonthlyDividend', title: '마지막 해 월 배당(세후)', bestLabel: '최고' },
  { metric: 'totalNetDividend', title: '누적 배당(세후)', bestLabel: '최고' },
  { metric: 'targetReachedYear', title: '목표 월 배당 달성', bestLabel: '가장 빠름' }
];

/**
 * 시나리오 탭 **비교**(2026-11-09) — 결과 위에 펼쳐지는 패널. 탭마다 색 하나, 지표마다 막대 하나.
 *
 * 실사용자가 탭을 14분에 83번 오가며 조건을 비교하고 있었다(GA 11/8). 숫자는
 * `buildScenarioComparison`(메인 화면과 같은 계산)에서 온다 — 여기는 그리기만 한다.
 *
 * ## 모달이 아니라 펼침 패널인 이유 (사용자 지시 2026-11-09)
 * 비교는 **보면서 고치는** 일이다. 모달은 결과를 가리고 닫아야 고칠 수 있다. 펼쳐 둔 채로 설정을 바꾸면
 * 막대가 그 자리에서 따라 움직인다(지금 탭의 저장 전 편집까지 — `useWorkspaceSnapshot`).
 *
 * ## 막대
 * - 금액 지표: 그 지표의 최댓값을 100% 로 한 상대 길이. 값 글자가 정확한 숫자를 말한다.
 * - 목표 달성: 연차가 **짧을수록 좋다** — 막대는 연차 그대로(최댓값 기준)이고 "가장 빠름"이 방향을 말한다.
 * - "최고"는 색이 아니라 **글자**로도 말한다. ⚠ 권유가 아니라 숫자의 방향이다 — 그래서 범례에 넣은 돈을 같이 둔다.
 */
function ScenarioCompareComponent({ tabCount, onSelectScenario }: ScenarioCompareProps) {
  const { buildCurrentScenariosSnapshot } = useWorkspaceSnapshot();
  const display = useDisplayCurrencyViewAtomValue();
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  /*
   * 펼쳐 둔 동안에는 렌더마다 스냅샷을 다시 조립한다(편집이 바로 반영되게). 비싼 것은 탭별 시뮬레이션이라
   * **스냅샷 내용이 같으면** 다시 돌리지 않는다 — 키는 직렬화한 스냅샷이다.
   */
  const snapshot = isOpen ? buildCurrentScenariosSnapshot() : null;
  const snapshotKey = snapshot ? JSON.stringify(snapshot) : '';
  const columns = useMemo<ScenarioCompareColumn[]>(
    () => (snapshot ? buildScenarioComparison(snapshot.scenarios, snapshot.activeScenarioId) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 내용이 같으면 같은 결과다(위 주석)
    [snapshotKey]
  );

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) trackEvent(ANALYTICS_EVENT.SCENARIO_TAB_ACTION, { action: 'compare_open', tab_count: tabCount });
      return !prev;
    });
  }, [tabCount]);

  const select = useCallback(
    (scenarioId: string) => {
      trackEvent(ANALYTICS_EVENT.SCENARIO_TAB_ACTION, { action: 'compare_select', scenario_id: scenarioId });
      onSelectScenario(scenarioId);
    },
    [onSelectScenario]
  );

  if (tabCount < 2) return null;

  const formatAmount = createResultAmountFormatter(display.currency, display.rate);
  const money = (value: number) => formatAmount(value, true);

  const valueText = (column: ScenarioCompareColumn, metric: ScenarioCompareMetric): string | null => {
    if (!column.result) return null;
    if (metric === 'targetReachedYear') {
      if (column.targetMonthlyDividend <= 0) return null;
      return column.result.targetReachedYear === null ? null : `${column.result.targetReachedYear}년차`;
    }
    return money(column.result[metric]);
  };

  const emptyText = (column: ScenarioCompareColumn, metric: ScenarioCompareMetric): string => {
    if (!column.result) return '계산 불가';
    if (metric === 'targetReachedYear') {
      return column.targetMonthlyDividend <= 0 ? '목표 없음' : `${money(column.targetMonthlyDividend)} 미도달`;
    }
    return '계산 불가';
  };

  return (
    <div>
      <CompareEntry>
        <Button
          type="button"
          variant={isOpen ? 'secondary' : 'ghost'}
          size="sm"
          aria-expanded={isOpen}
          aria-controls={panelId}
          startIcon={<Columns3 size={16} strokeWidth={1.8} aria-hidden focusable={false} />}
          onClick={toggle}
        >
          {isOpen ? `${TITLE} 접기` : `${TITLE} (${tabCount}개)`}
        </Button>
      </CompareEntry>

      {isOpen ? (
        <ComparePanel id={panelId} aria-label={TITLE}>
          <PanelHead>
            <PanelTitle>{TITLE}</PanelTitle>
          </PanelHead>

          {/* 범례 = 탭의 조건. 같은 색이 아래 막대마다 그 탭을 가리킨다. */}
          <Legend aria-label="비교하는 탭">
            {columns.map((column, index) => (
              <LegendItem key={column.id} $active={column.isActive} style={{ '--swatch': swatchOf(index) } as CSSProperties}>
                <Swatch aria-hidden />
                <LegendName>
                  {column.name}
                  {column.isActive ? <ActiveTag>보는 중</ActiveTag> : null}
                </LegendName>
                {column.isActive ? null : (
                  <Button type="button" variant="ghost" size="sm" onClick={() => select(column.id)}>
                    보기<SrOnly> ({column.name})</SrOnly>
                  </Button>
                )}
                <LegendMeta>
                  {column.holdingsLine || '종목 없음'}
                  <br />
                  초기 {money(column.initialInvestment)} · 월 {money(column.monthlyContribution)} · {column.durationYears}년
                </LegendMeta>
              </LegendItem>
            ))}
          </Legend>

          <MetricGrid>
            {METRICS.map(({ metric, title, bestLabel }) => {
              const best = findBestColumnIds(columns, metric);
              const max = Math.max(0, ...columns.map((column) => (valueText(column, metric) ? column.result![metric] ?? 0 : 0)));

              return (
                <MetricBlock key={metric}>
                  <MetricTitle>{title}</MetricTitle>
                  <BarList aria-label={title}>
                    {columns.map((column, index) => {
                      const text = valueText(column, metric);
                      const raw = text ? (column.result![metric] ?? 0) : 0;
                      const percent = text && max > 0 ? Math.max(2, (raw / max) * 100) : 0;
                      const isBest = best.has(column.id);

                      return (
                        <BarRow
                          key={column.id}
                          style={{ '--swatch': swatchOf(index), '--bar': `${percent}%` } as CSSProperties}
                        >
                          <BarName>{column.name}</BarName>
                          <BarTrack aria-hidden>
                            <BarFill />
                          </BarTrack>
                          <BarValue $best={isBest}>
                            {text ?? <MutedValue>{emptyText(column, metric)}</MutedValue>}
                            {isBest ? <BestTag>{bestLabel}</BestTag> : null}
                          </BarValue>
                        </BarRow>
                      );
                    })}
                  </BarList>
                </MetricBlock>
              );
            })}
          </MetricGrid>

          <CompareNote>
            각 탭의 조건 그대로 계산한 값입니다(세후, 가정 기반). 펼쳐 둔 채로 설정을 바꾸면 바로 반영됩니다. "최고"는 숫자가
            가장 큰(달성은 가장 빠른) 탭일 뿐 권유가 아닙니다 — 넣는 돈이 다르면 결과도 다릅니다.
          </CompareNote>
        </ComparePanel>
      ) : null}
    </div>
  );
}

const ScenarioCompare = memo(ScenarioCompareComponent);

export default ScenarioCompare;
