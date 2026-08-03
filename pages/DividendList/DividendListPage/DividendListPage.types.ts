import type { DividendList, DividendListId } from '@/shared/constants/dividendLists';
import type { DividendListPageCopy } from '../copy';
import type { DividendListRow, DividendListSummary } from '../utils';

export type DividendListPageProps = {
  /** 어느 목록인가. 라우트가 정한다 — 이 페이지 컴포넌트 하나가 세 라우트를 그린다. */
  listId: DividendListId;
};

export type DividendListViewModel = {
  list: DividendList;
  copy: DividendListPageCopy;
  rows: DividendListRow[];
  criterion: string;
  /** 이 목록을 뺀 나머지 목록. 아래쪽 "다른 목록" 링크가 쓴다. */
  others: DividendListSummary[];
};

export type DividendListViewProps = {
  viewModel: DividendListViewModel;
};
