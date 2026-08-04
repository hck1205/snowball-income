import { useMemo } from 'react';
import { TickerPageShell } from '@/pages/Ticker/components';
import { useDocumentMeta } from '@/pages/Ticker/hooks';
import { CONGRESS_TRADES } from '@/shared/constants/congressTrades';
import { CONGRESS_COPY } from '../copy';
import { buildCongressViewModel } from '../utils';
import CongressView from './CongressPage.view';

/**
 * `/portfolio/congress` — 미 하원 의원 주식 거래.
 *
 * 데이터는 커밋된 스냅샷이라 **조회가 없다**(네트워크 0). 갱신은 `npm run congress:trades`.
 *
 * ⚠ 셸·메타 훅은 티커 페이지의 것을 재사용한다 — 헤더·푸터·본문 폭이 앱 공통이어야
 *   라우트를 옮길 때 콘텐츠 경계가 튀지 않는다(`TickerPageShell` 의 1200px 계약).
 * ⚠ `useMemo` 의 의존성이 비어 있는 것은 의도다 — 스냅샷은 모듈 상수라 렌더 사이에 바뀌지 않는다.
 */
export default function CongressPage() {
  const viewModel = useMemo(() => buildCongressViewModel(CONGRESS_TRADES), []);

  useDocumentMeta({
    title: CONGRESS_COPY.meta.title,
    description: CONGRESS_COPY.meta.description,
    pathname: '/portfolio/congress'
  });

  return (
    <TickerPageShell>
      <CongressView viewModel={viewModel} />
    </TickerPageShell>
  );
}
