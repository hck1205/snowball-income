import { useMemo } from 'react';
import { TickerPageShell } from '@/pages/Ticker/components';
import { useDocumentMeta } from '@/pages/Ticker/hooks';
import { INVESTOR_SNAPSHOT } from '@/shared/constants/investors';
import { INVESTORS_COPY } from '../copy';
import { buildInvestorCards } from '../utils';
import InvestorsView from './InvestorsPage.view';
import type { InvestorsViewModel } from './InvestorsPage.types';

const copy = INVESTORS_COPY;

/**
 * `/portfolio/investors` — 대가들의 포트폴리오.
 *
 * 데이터는 커밋된 스냅샷이라 조회가 없다(네트워크 0). 갱신은 크론이 분기마다 PR 로 올린다.
 *
 * ⚠ `today` 를 컨테이너가 만들어 넘긴다 — 계산 계층이 스스로 `new Date()` 를 부르면 테스트가
 *   실제 날짜에 매인다(이 레포가 캘린더·목표에서 쓰는 같은 규율).
 * ⚠ 셸·메타 훅은 티커 페이지의 것을 재사용한다. 같은 "종목 정보" 축이라 레이아웃이 같아야 한다.
 */
export default function InvestorsPage() {
  const viewModel = useMemo<InvestorsViewModel>(
    () => ({ cards: buildInvestorCards(new Date()), generatedAt: INVESTOR_SNAPSHOT.generatedAt }),
    []
  );

  useDocumentMeta({
    title: copy.meta.title,
    description: copy.meta.description,
    pathname: '/portfolio/investors'
  });

  return (
    <TickerPageShell>
      <InvestorsView viewModel={viewModel} />
    </TickerPageShell>
  );
}
