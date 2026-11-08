import { TickerPageShell } from '@/pages/Ticker/components';
import { useDocumentMeta } from '@/pages/Ticker/hooks';
import { Navigate, useParams } from 'react-router-dom';
import { DIVIDEND_TARGET_PATH, dividendTargetAmountPath } from '@/shared/constants/routes';
import { DIVIDEND_TARGET_COPY } from '../copy';
import { useDividendTargetState } from '../hooks';
import { formatManWon } from '../utils';
import DividendTargetView from './DividendTargetPage.view';

/**
 * `/dividend/how-much` — "월 N 원을 받으려면 얼마가 필요한가".
 *
 * 컨테이너는 **문서 메타 + 셸 + 배선**만 한다. 상태(쿼리)·계측·계산기 이동은
 * `hooks/useDividendTargetState`, 그리기는 `DividendTargetPage.view` 가 맡는다.
 */
export default function DividendTargetPage() {
  const state = useDividendTargetState();
  const { monthly: amountSegment } = useParams<{ monthly?: string }>();
  const { amountPageMan } = state;

  /*
   * 금액별 주소면 **그 금액의** 제목·설명·canonical 을 쓴다(2026-11-09) — 정적 셸(`tools/seo/routeShells`)과
   * 같은 문장이다. 기본 주소와 같은 메타를 쓰면 여섯 주소가 한 페이지의 중복으로 읽힌다.
   */
  const amountLabel = amountPageMan !== null ? formatManWon(amountPageMan) : null;
  useDocumentMeta(
    amountLabel !== null && amountPageMan !== null
      ? {
          title: DIVIDEND_TARGET_COPY.amountMeta.title(amountLabel),
          description: DIVIDEND_TARGET_COPY.amountMeta.description(amountLabel),
          pathname: dividendTargetAmountPath(amountPageMan)
        }
      : {
          title: DIVIDEND_TARGET_COPY.meta.title,
          description: DIVIDEND_TARGET_COPY.meta.description,
          pathname: DIVIDEND_TARGET_PATH
        }
  );

  /* 목록에 없는 금액 주소(`/dividend/how-much/7`·`/250`)는 기본 주소로 — 색인되는 중복·빈 지면을 만들지 않는다. */
  if (amountSegment !== undefined && amountPageMan === null) {
    return <Navigate to={DIVIDEND_TARGET_PATH} replace />;
  }

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
