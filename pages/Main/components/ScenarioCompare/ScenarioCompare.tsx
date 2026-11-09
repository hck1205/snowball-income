import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Columns3, X } from 'lucide-react';
import { Button, ModalActions, ModalBackdrop, ModalTitle } from '@/components/common';
import { useDisplayCurrencyViewAtomValue } from '@/jotai';
import { useWorkspaceSnapshot } from '@/pages/Main/hooks';
import {
  buildScenarioComparison,
  createChartCompactFormatter,
  createResultAmountFormatter,
  type ScenarioCompareColumn
} from '@/pages/Main/utils';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { CompareCharts, CompareTable } from './components';
import { CompareEntry, PanelHead, PanelSub, WidePanel } from './ScenarioCompare.styled';
import type { ScenarioCompareProps } from './ScenarioCompare.types';

const TITLE = '탭 비교';

/**
 * 시나리오 탭 **비교**(2026-11-09) — 진입 버튼 + 큰 모달. 모달 안은 연도별 추이(`CompareCharts`)와
 * 조건·결과 표(`CompareTable`) 둘이다(사용자 결정: "큰 모달 + 데이터 대폭 확장").
 *
 * 실사용자가 탭을 14분에 83번 오가며 조건을 비교하고 있었다(GA 11/8). 숫자는 `buildScenarioComparison`
 * (메인 화면과 같은 계산)에서 온다 — 이 파일은 **열고 닫기와 상태**만 갖는다.
 *
 * - 비교는 **열 때 한 번** 만든다(목표 역산까지 탭마다 돌아 가볍지 않다). 지금 탭의 저장 전 편집도 담는다
 *   (`useWorkspaceSnapshot` — 탭을 바꿀 때 저장되는 그 스냅샷과 같은 조립).
 * - 닫기: Esc · 닫기 버튼 · 바깥 클릭. "이 탭 보기"는 그 탭으로 옮기고 닫는다.
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

  const formatAmount = useMemo(() => createResultAmountFormatter(display.currency, display.rate), [display.currency, display.rate]);
  const formatCompact = useMemo(() => createChartCompactFormatter(display.currency, display.rate), [display.currency, display.rate]);
  const money = useCallback((value: number) => formatAmount(value, true), [formatAmount]);

  if (tabCount < 2) return null;

  const modalRoot = typeof document !== 'undefined' ? document.body : null;
  const calculable = columns?.filter((column) => column.result !== null).length ?? 0;

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

                <CompareCharts columns={columns} formatValue={money} formatCompact={formatCompact} />
                <CompareTable columns={columns} money={money} onSelect={select} />

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
