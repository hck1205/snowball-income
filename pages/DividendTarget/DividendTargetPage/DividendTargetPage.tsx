import { TickerPageShell } from '@/pages/Ticker/components';
import { useDocumentMeta } from '@/pages/Ticker/hooks';
import { DIVIDEND_TARGET_PATH } from '@/shared/constants/routes';
import { DIVIDEND_TARGET_COPY } from '../copy';
import { useDividendTargetState } from '../hooks';
import DividendTargetView from './DividendTargetPage.view';

/**
 * `/dividend/how-much` — "월 N 원을 받으려면 얼마가 필요한가".
 *
 * 컨테이너는 **문서 메타 + 셸 + 배선**만 한다. 상태(쿼리)·계측·계산기 이동은
 * `hooks/useDividendTargetState`, 그리기는 `DividendTargetPage.view` 가 맡는다.
 */
export default function DividendTargetPage() {
  const state = useDividendTargetState();

  useDocumentMeta({
    title: DIVIDEND_TARGET_COPY.meta.title,
    description: DIVIDEND_TARGET_COPY.meta.description,
    pathname: DIVIDEND_TARGET_PATH
  });

  return (
    <TickerPageShell>
      {state.selected ? (
        <DividendTargetView
          model={state.model}
          monthlyMan={state.query.monthlyMan}
          selected={state.selected}
          inflationRate={state.query.inflationRate}
          onMonthlyChange={state.changeMonthly}
          onSelectTicker={state.selectTicker}
          onInflationChange={state.changeInflation}
          onSimulate={state.simulate}
        />
      ) : null}
    </TickerPageShell>
  );
}
