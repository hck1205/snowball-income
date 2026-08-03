import { useMemo } from 'react';
import { TickerPageShell } from '@/pages/Ticker/components';
import { useDocumentMeta } from '@/pages/Ticker/hooks';
import { DIVIDEND_LIST_ALL, DIVIDEND_LISTS, dividendListPath } from '@/shared/constants/dividendLists';
import { DIVIDEND_LIST_COPY } from '../copy';
import { formatStreakCriterion, toDividendListRow, toDividendListSummary } from '../utils';
import DividendListView from './DividendListPage.view';
import type { DividendListPageProps, DividendListViewModel } from './DividendListPage.types';

/**
 * `/dividend/kings` · `/dividend/aristocrats` · `/dividend/champions` — 세 라우트가 **같은 컴포넌트**다.
 *
 * 세 화면의 차이는 데이터와 문구뿐이라 컴포넌트를 셋으로 복제할 이유가 없다. 라우트는 `listId` 만
 * 넘긴다(`router/routes.tsx`).
 *
 * ⚠ 셸·메타 훅은 티커 페이지의 것을 재사용한다 — 헤더·푸터·본문 폭이 앱 공통이어야 라우트를 옮길 때
 *   콘텐츠 경계가 튀지 않는다(`TickerPageShell` 주석의 1200px 계약).
 *
 * 데이터는 커밋된 목록이라 **조회가 없다**(네트워크 0). 갱신은 `npm run dividend:lists -- --write`.
 */
export default function DividendListPage({ listId }: DividendListPageProps) {
  const list = DIVIDEND_LISTS[listId];
  const listCopy = DIVIDEND_LIST_COPY.lists[listId];

  const viewModel = useMemo<DividendListViewModel>(
    () => ({
      list,
      copy: listCopy,
      rows: list.members.map(toDividendListRow),
      criterion: formatStreakCriterion(list),
      others: DIVIDEND_LIST_ALL.filter((other) => other.id !== listId).map(toDividendListSummary)
    }),
    [list, listCopy, listId]
  );

  useDocumentMeta({
    title: listCopy.metaTitle,
    description: listCopy.metaDescription,
    pathname: dividendListPath(listId)
  });

  return (
    <TickerPageShell>
      <DividendListView viewModel={viewModel} />
    </TickerPageShell>
  );
}
