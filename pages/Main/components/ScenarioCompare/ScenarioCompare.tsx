import { memo, useCallback, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Columns3 } from 'lucide-react';
import { Button, ModalActions, ModalBackdrop, ModalPanel, ModalTitle } from '@/components/common';
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
  BestTag,
  BestValue,
  CompareEntry,
  CompareNote,
  CompareScroll,
  CompareTable,
  HoldingsCell,
  MutedValue,
  SrOnly
} from './ScenarioCompare.styled';
import type { ScenarioCompareProps } from './ScenarioCompare.types';

const TITLE = '탭 비교';
const BEST_LABEL = '최고';
const FASTEST_LABEL = '가장 빠름';

/**
 * 시나리오 탭 **비교**(2026-11-09) — 탭마다 핵심 결과를 한 표에 나란히 놓는다.
 *
 * 실사용자가 탭을 14분에 83번 오가며 조건을 비교하고 있었다(GA 11/8). 탭은 하나씩만 보이니 비교는 기억에
 * 기대야 했다. 숫자는 `buildScenarioComparison`(메인 화면과 같은 계산)에서 온다 — 여기는 그리기만 한다.
 *
 * - 표는 **열 때 한 번** 만든다. 지금 탭의 아직 저장 안 된 편집까지 담으려고 `useWorkspaceSnapshot` 을 쓴다
 *   (탭을 바꿀 때 저장되는 그 스냅샷과 같은 조립).
 * - "최고"는 색이 아니라 **글자**로도 말한다. ⚠ 권유가 아니라 숫자의 방향이다 — 그래서 넣은 돈(초기·월 적립)을
 *   같은 표에 둔다(돈을 더 넣으면 결과가 커지는 것은 당연하다).
 */
function ScenarioCompareComponent({ tabCount, onSelectScenario }: ScenarioCompareProps) {
  const { buildCurrentScenariosSnapshot } = useWorkspaceSnapshot();
  const display = useDisplayCurrencyViewAtomValue();
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

  if (tabCount < 2) return null;

  const formatAmount = createResultAmountFormatter(display.currency, display.rate);
  const money = (value: number) => formatAmount(value, true);

  const metricRow = (
    label: string,
    metric: ScenarioCompareMetric,
    render: (column: ScenarioCompareColumn) => ReactNode,
    bestLabel = BEST_LABEL
  ) => {
    const best = findBestColumnIds(columns ?? [], metric);
    return (
      <tr>
        <th scope="row">{label}</th>
        {(columns ?? []).map((column) => (
          <td key={column.id}>
            {column.result === null ? (
              <MutedValue>계산 불가</MutedValue>
            ) : best.has(column.id) ? (
              <>
                <BestValue>{render(column)}</BestValue>
                <BestTag>{bestLabel}</BestTag>
              </>
            ) : (
              render(column)
            )}
          </td>
        ))}
      </tr>
    );
  };

  const modalRoot = typeof document !== 'undefined' ? document.body : null;

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
              <ModalPanel $size="lg">
                <ModalTitle>{TITLE}</ModalTitle>
                <CompareScroll>
                  <CompareTable aria-label="탭별 투자 조건과 결과">
                    <thead>
                      <tr>
                        <th scope="col">항목</th>
                        {columns.map((column) => (
                          <th key={column.id} scope="col">
                            {column.name}
                            {column.isActive ? <ActiveTag>보는 중</ActiveTag> : null}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th scope="row">종목 구성</th>
                        {columns.map((column) => (
                          <HoldingsCell key={column.id}>{column.holdingsLine || '종목 없음'}</HoldingsCell>
                        ))}
                      </tr>
                      <tr>
                        <th scope="row">초기 투자금</th>
                        {columns.map((column) => (
                          <td key={column.id}>{money(column.initialInvestment)}</td>
                        ))}
                      </tr>
                      <tr>
                        <th scope="row">월 적립금</th>
                        {columns.map((column) => (
                          <td key={column.id}>{money(column.monthlyContribution)}</td>
                        ))}
                      </tr>
                      <tr>
                        <th scope="row">투자 기간</th>
                        {columns.map((column) => (
                          <td key={column.id}>{column.durationYears}년</td>
                        ))}
                      </tr>
                      {metricRow('최종 자산', 'finalAssetValue', (column) => money(column.result!.finalAssetValue))}
                      {metricRow('마지막 해 월 배당(세후)', 'finalMonthlyDividend', (column) =>
                        money(column.result!.finalMonthlyDividend)
                      )}
                      {metricRow('누적 배당(세후)', 'totalNetDividend', (column) => money(column.result!.totalNetDividend))}
                      {metricRow(
                        '목표 월 배당 달성',
                        'targetReachedYear',
                        (column) =>
                          column.targetMonthlyDividend <= 0 ? (
                            <MutedValue>목표 없음</MutedValue>
                          ) : column.result!.targetReachedYear === null ? (
                            <MutedValue>{money(column.targetMonthlyDividend)} 미도달</MutedValue>
                          ) : (
                            `${column.result!.targetReachedYear}년차`
                          ),
                        FASTEST_LABEL
                      )}
                      <tr>
                        <th scope="row">
                          <SrOnly>이동</SrOnly>
                        </th>
                        {columns.map((column) => (
                          <td key={column.id}>
                            {column.isActive ? (
                              <MutedValue>지금 탭</MutedValue>
                            ) : (
                              <Button type="button" variant="secondary" size="sm" onClick={() => select(column.id)}>
                                이 탭 보기<SrOnly> ({column.name})</SrOnly>
                              </Button>
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </CompareTable>
                </CompareScroll>
                <CompareNote>
                  각 탭의 조건 그대로 계산한 값입니다(세후, 가정 기반). "최고"는 숫자가 가장 큰(달성은 가장 빠른) 탭일 뿐
                  권유가 아닙니다 — 넣는 돈이 다르면 결과도 다릅니다.
                </CompareNote>
                <ModalActions>
                  <Button type="button" variant="secondary" onClick={close}>
                    닫기
                  </Button>
                </ModalActions>
              </ModalPanel>
            </ModalBackdrop>,
            modalRoot
          )
        : null}
    </>
  );
}

const ScenarioCompare = memo(ScenarioCompareComponent);

export default ScenarioCompare;
