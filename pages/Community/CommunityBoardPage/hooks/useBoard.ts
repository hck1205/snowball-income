import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchBoardPage,
  getSupabaseClient,
  type CommunityClient,
  type PostListItem
} from '@/shared/lib/supabase';

export type BoardStatus = 'loading' | 'error' | 'empty' | 'ready';

export type UseBoardResult = {
  items: PostListItem[];
  status: BoardStatus;
  reachedEnd: boolean;
  isLoadingMore: boolean;
  loadMoreError: boolean;
  loadMore: () => void;
  retry: () => void;
};

/**
 * 자유게시판 목록 데이터 훅 — kind='board' 최신순 + keyset 무한스크롤.
 *
 * 갤러리(useGallery)와 같은 요청-id 가드/커서 패턴을 쓰되, 평면 게시판이라 URL 정렬·검색·facet
 * 구독은 없다(항상 최신순). 데이터·페이지네이션은 fetchBoardPage(=fetchGalleryPage kind:'board')로
 * 단일 원천을 재사용하고, 렌더는 PostRow를 재사용한다.
 */
export const useBoard = (): UseBoardResult => {
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
      const page = await fetchBoardPage(client, { sort: 'recent', cursor: null });
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
  }, [ensureClient]);

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
      const page = await fetchBoardPage(client, { sort: 'recent', cursor });
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
  }, [cursor, ensureClient, initialLoading, reachedEnd]);

  const retry = useCallback(() => {
    if (error === 'more') void loadMore();
    else void loadFirstPage();
  }, [error, loadFirstPage, loadMore]);

  let status: BoardStatus = 'ready';
  if (initialLoading) status = 'loading';
  else if (error === 'initial') status = 'error';
  else if (items.length === 0) status = 'empty';

  return {
    items,
    status,
    reachedEnd,
    isLoadingMore,
    loadMoreError: error === 'more',
    loadMore,
    retry
  };
};
