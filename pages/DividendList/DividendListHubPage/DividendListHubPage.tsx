import { useMemo } from 'react';
import { TickerPageShell } from '@/pages/Ticker/components';
import { useDocumentMeta } from '@/pages/Ticker/hooks';
import { DIVIDEND_LIST_ALL, DIVIDEND_LIST_HUB_PATH } from '@/shared/constants/dividendLists';
import { DIVIDEND_LIST_COPY } from '../copy';
import { toDividendListSummary } from '../utils';
import DividendListHubView from './DividendListHubPage.view';
import type { DividendListHubViewModel } from './DividendListHubPage.types';

/**
 * `/dividend/lists` — 배당킹·배당귀족·배당챔피언 세 목록의 진입점.
 *
 * 세 목록을 나란히 두는 화면이 따로 필요한 이유: 사용자가 처음 만나는 질문이 "무엇이 다른가"이고,
 * 목록 하나만 열면 그 답을 얻을 수 없다. 종목 수·기준일도 여기서 한 번에 비교된다.
 */
export default function DividendListHubPage() {
  const viewModel = useMemo<DividendListHubViewModel>(
    () => ({ summaries: DIVIDEND_LIST_ALL.map(toDividendListSummary) }),
    []
  );

  useDocumentMeta({
    title: DIVIDEND_LIST_COPY.hub.meta.title,
    description: DIVIDEND_LIST_COPY.hub.meta.description,
    pathname: DIVIDEND_LIST_HUB_PATH
  });

  return (
    <TickerPageShell>
      <DividendListHubView viewModel={viewModel} />
    </TickerPageShell>
  );
}
