import { TickerPageShell } from '@/pages/Ticker/components';
import { useDocumentMeta } from '@/pages/Ticker/hooks';
import { MARKET_PULSE_COPY } from '../copy';
import { MARKET_PULSE_PATH } from '../marketPulseRoute';
import { useMarketPulse } from '../hooks';
import MarketPulseView from './MarketPulsePage.view';

/**
 * `/market/pulse` — 시장 온도.
 *
 * 컨테이너는 조회와 메타만 맡고, 그리는 일은 전부 view 가 한다(레포의 컨테이너↔뷰 분리).
 */
export default function MarketPulsePage() {
  const { state, reload } = useMarketPulse();

  useDocumentMeta({
    title: MARKET_PULSE_COPY.documentTitle,
    description: MARKET_PULSE_COPY.metaDescription,
    pathname: MARKET_PULSE_PATH
  });

  return (
    <TickerPageShell>
      <MarketPulseView state={state} onReload={reload} />
    </TickerPageShell>
  );
}
