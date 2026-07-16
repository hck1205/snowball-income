import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { COMMUNITY_QUERY_PARAM } from '@/shared/constants/community';
import {
  fetchGalleryPage,
  getSupabaseClient,
  type CommunityClient,
  type GallerySort,
  type ScenarioListItem
} from '@/shared/lib/supabase';

export type GalleryStatus = 'loading' | 'error' | 'empty' | 'searchEmpty' | 'ready';

const toSort = (raw: string | null): GallerySort => (raw === 'popular' ? 'popular' : 'recent');

export type UseGalleryResult = {
  items: ScenarioListItem[];
  status: GalleryStatus;
  sort: GallerySort;
  query: string;
  isSearching: boolean;
  reachedEnd: boolean;
  isLoadingMore: boolean;
  loadMoreError: boolean;
  setSort: (sort: GallerySort) => void;
  loadMore: () => void;
  retry: () => void;
  clearSearch: () => void;
};

/**
 * 갤러리 데이터 훅 — 정렬/검색(URL 구독) + keyset 무한스크롤.
 * 정렬/검색이 바뀌면 목록과 커서를 초기화하고 첫 페이지를 다시 받는다.
 */
export const useGallery = (): UseGalleryResult => {
  const [searchParams, setSearchParams] = useSearchParams();
  const sort = toSort(searchParams.get(COMMUNITY_QUERY_PARAM.sort));
  const query = (searchParams.get(COMMUNITY_QUERY_PARAM.query) ?? '').trim();
  // 검색 기준(제목/전체). 검색어와 함께만 URL에 실린다. 데이터 레이어가 컬럼 선택에 사용.
  const queryFilter = searchParams.get(COMMUNITY_QUERY_PARAM.queryFilter) ?? undefined;

  const [items, setItems] = useState<ScenarioListItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<'initial' | 'more' | null>(null);

  const clientRef = useRef<CommunityClient | null>(null);
  const requestIdRef = useRef(0);
  const fetchingRef = useRef(false);

  const ensureClient = useCallback(async (): Promise<CommunityClient | null> => {
    if (clientRef.current) return clientRef.current;
    const client = await getSupabaseClient();
    clientRef.current = client;
    return client;
  }, []);

  const loadFirstPage = useCallback(async () => {
    const requestId = (requestIdRef.current += 1);
    setInitialLoading(true);
    setError(null);
    setReachedEnd(false);

    const client = await ensureClient();
    if (!client) {
      if (requestId === requestIdRef.current) {
        setError('initial');
        setInitialLoading(false);
      }
      return;
    }

    try {
      const page = await fetchGalleryPage(client, { sort, query, queryFilter, cursor: null });
      if (requestId !== requestIdRef.current) return;
      setItems(page.items);
      setCursor(page.nextCursor);
      setReachedEnd(page.nextCursor === null);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setError('initial');
    } finally {
      if (requestId === requestIdRef.current) setInitialLoading(false);
    }
  }, [ensureClient, query, queryFilter, sort]);

  // 정렬/검색 변화 → 처음부터 다시.
  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (fetchingRef.current || reachedEnd || cursor === null || initialLoading) return;
    fetchingRef.current = true;
    const requestId = requestIdRef.current;
    setIsLoadingMore(true);
    setError(null);

    const client = await ensureClient();
    if (!client) {
      setError('more');
      setIsLoadingMore(false);
      fetchingRef.current = false;
      return;
    }

    try {
      const page = await fetchGalleryPage(client, { sort, query, queryFilter, cursor });
      if (requestId !== requestIdRef.current) return;
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
      setReachedEnd(page.nextCursor === null);
    } catch {
      if (requestId === requestIdRef.current) setError('more');
    } finally {
      if (requestId === requestIdRef.current) setIsLoadingMore(false);
      fetchingRef.current = false;
    }
  }, [cursor, ensureClient, initialLoading, query, queryFilter, reachedEnd, sort]);

  const setSort = useCallback(
    (nextSort: GallerySort) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (nextSort === 'recent') next.delete(COMMUNITY_QUERY_PARAM.sort);
          else next.set(COMMUNITY_QUERY_PARAM.sort, nextSort);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const clearSearch = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(COMMUNITY_QUERY_PARAM.query);
        next.delete(COMMUNITY_QUERY_PARAM.queryFilter);
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const retry = useCallback(() => {
    if (error === 'more') void loadMore();
    else void loadFirstPage();
  }, [error, loadFirstPage, loadMore]);

  const isSearching = query.length > 0;
  let status: GalleryStatus = 'ready';
  if (initialLoading) status = 'loading';
  else if (error === 'initial') status = 'error';
  else if (items.length === 0) status = isSearching ? 'searchEmpty' : 'empty';

  return {
    items,
    status,
    sort,
    query,
    isSearching,
    reachedEnd,
    isLoadingMore,
    loadMoreError: error === 'more',
    setSort,
    loadMore,
    retry,
    clearSearch
  };
};
