import { useMemo } from 'react';
import { TickerPageShell } from '@/pages/Ticker/components';
import { useDocumentMeta } from '@/pages/Ticker/hooks';
import { NPS_PORTFOLIO } from '@/shared/constants/npsPortfolio';
import { NPS_COPY } from '../copy';
import { buildNpsViewModel } from '../utils';
import NpsView from './NpsPage.view';

/**
 * `/portfolio/nps` — 국민연금 미국 주식 포트폴리오.
 *
 * 데이터는 커밋된 13F 스냅샷이라 **조회가 없다**(네트워크 0). 갱신은 `npm run nps:portfolio`
 * (분기마다 한 번이면 충분하다 — 13F 는 분기 데이터다).
 *
 * ⚠ 셸·메타 훅은 티커 페이지의 것을 재사용한다(`/portfolio/investors` 와 같은 이유·같은 형태).
 */
export default function NpsPage() {
  const viewModel = useMemo(() => buildNpsViewModel(NPS_PORTFOLIO), []);

  useDocumentMeta({
    title: NPS_COPY.meta.title,
    description: NPS_COPY.meta.description,
    pathname: '/portfolio/nps'
  });

  return (
    <TickerPageShell>
      <NpsView viewModel={viewModel} />
    </TickerPageShell>
  );
}
