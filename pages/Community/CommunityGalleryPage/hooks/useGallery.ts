import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  COMMUNITY_QUERY_PARAM,
  hasAnyFilter,
  parseGalleryFilters,
  serializeGalleryFilters,
  toFacetFilters
} from '@/shared/constants/community';
import {
  fetchGalleryPage,
  getSupabaseClient,
  type CommunityClient,
  type GallerySort,
  type PostListItem
} from '@/shared/lib/supabase';

export type GalleryStatus = 'loading' | 'error' | 'empty' | 'searchEmpty' | 'filteredEmpty' | 'ready';

const toSort = (raw: string | null): GallerySort => (raw === 'popular' ? 'popular' : 'recent');

export type UseGalleryResult = {
  items: PostListItem[];
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
  /** 정밀 검색 필터 파라미터만 지운다(정렬·텍스트검색 보존) — filteredEmpty CTA용. */
  clearFilters: () => void;
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
  // 정밀 검색 facet 필터(원/년). URL이 유일한 진실 — PrecisionSearch가 쓰고 여기가 읽어 조회에 얹는다.
  const filters = parseGalleryFilters(searchParams);
  const hasFilters = hasAnyFilter(filters);
  // useCallback 의존성은 원시값으로 — filters 객체는 매 렌더 새로 생겨 참조 비교가 흔들린다.
  const { mdMin, mdMax, tgtMin, durMin, durMax } = filters;

  const [items, setItems] = useState<PostListItem[]>([]);
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
      const facets = toFacetFilters({ mdMin, mdMax, tgtMin, durMin, durMax });
      const page = await fetchGalleryPage(client, { sort, query, queryFilter, facets, cursor: null });
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
  }, [ensureClient, query, queryFilter, sort, mdMin, mdMax, tgtMin, durMin, durMax]);

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
      const facets = toFacetFilters({ mdMin, mdMax, tgtMin, durMin, durMax });
      const page = await fetchGalleryPage(client, { sort, query, queryFilter, facets, cursor });
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
  }, [cursor, ensureClient, initialLoading, query, queryFilter, reachedEnd, sort, mdMin, mdMax, tgtMin, durMin, durMax]);

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

  // 필터 파라미터만 비운다(빈 필터 직렬화) — 정렬·텍스트검색(sort/q/qf)은 prev 그대로 보존.
  const clearFilters = useCallback(() => {
    setSearchParams((prev) => serializeGalleryFilters(prev, {}), { replace: true });
  }, [setSearchParams]);

  const retry = useCallback(() => {
    if (error === 'more') void loadMore();
    else void loadFirstPage();
  }, [error, loadFirstPage, loadMore]);

  const isSearching = query.length > 0;
  let status: GalleryStatus = 'ready';
  if (initialLoading) status = 'loading';
  else if (error === 'initial') status = 'error';
  else if (items.length === 0) {
    // 필터가 걸린 빈결과는 filteredEmpty(정렬·q 보존 CTA)로 분기 — 텍스트검색 유무보다 우선한다.
    if (hasFilters) status = 'filteredEmpty';
    else if (isSearching) status = 'searchEmpty';
    else status = 'empty';
  }

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
    clearSearch,
    clearFilters
  };
};
