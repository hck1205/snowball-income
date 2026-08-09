import { TickerPageShell } from '@/pages/Ticker/components';
import { useDocumentMeta } from '@/pages/Ticker/hooks';
import { useMarketPulse } from '@/pages/MarketPulse/hooks';
import { HIPPO_STATS_COPY } from '../copy';
import { HIPPO_STATS_PATH } from '../hippoStatsRoute';
import HippoStatsView from './HippoStatsPage.view';

/**
 * `/market/stats` — 히포 통계.
 *
 * 🔴 지표는 **시장 온도와 같은 훅**(`useMarketPulse`)으로 받는다. 같은 응답을 두 화면이 쓰므로
 *    엣지 캐시가 그대로 듣고, 무엇보다 두 화면의 숫자가 갈릴 수 없다 — 각자 받으면 하나는
 *    어제 값을 보여 주는 날이 생긴다.
 * ⚠ 거래 집계는 커밋된 스냅샷이라 네트워크를 타지 않는다(지표를 못 받아도 그 절은 그려진다).
 */
export default function HippoStatsPage() {
  const { state, reload } = useMarketPulse();

  useDocumentMeta({
    title: HIPPO_STATS_COPY.documentTitle,
    description: HIPPO_STATS_COPY.metaDescription,
    pathname: HIPPO_STATS_PATH
  });

  return (
    <TickerPageShell>
      <HippoStatsView state={state} onReload={reload} />
    </TickerPageShell>
  );
}
