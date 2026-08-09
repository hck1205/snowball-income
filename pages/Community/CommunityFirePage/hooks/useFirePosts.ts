import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchFirePage, getSupabaseClient, type CommunityClient, type NewsListItem } from '@/shared/lib/supabase';

export type NewsStatus = 'loading' | 'error' | 'empty' | 'ready';

export type UseNewsResult = {
  items: NewsListItem[];
  status: NewsStatus;
  reachedEnd: boolean;
  isLoadingMore: boolean;
  loadMoreError: boolean;
  loadMore: () => void;
  retry: () => void;
};

/**
 * 미디어 뉴스 목록 데이터 훅 — `kind='fire'` 최신순 + keyset 무한스크롤.
 *
 * 🔴 게시판(`useBoard`)의 **분류 필터·자동 보충을 일부러 들고 오지 않았다.** 그 복잡도는 전부
 * "클라이언트에서 거른 뒤 한 화면치를 채운다"에서 나오는데, 뉴스에는 거를 분류가 없다.
 * 서버가 준 페이지가 곧 화면이라 요청-id 가드와 커서만 있으면 된다.
 *
 * ⚠ 마이그레이션(20260807000000) 전에는 `kind='fire'` 행이 존재할 수 없어 **빈 목록**이 온다 —
 *   에러가 아니라 `empty` 다. 그래서 이 화면은 스키마가 없어도 죽지 않는다.
 */
export const useFirePosts = (): UseNewsResult => {
  const [items, setItems] = useState<NewsListItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [error, setError] = useState<'initial' | 'more' | null>(null);

  const clientRef = useRef<CommunityClient | null>(null);
  /* 응답이 늦게 도착한 옛 요청이 새 목록을 덮지 않게 하는 가드(갤러리·게시판과 같은 패턴). */
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
      const page = await fetchFirePage(client, { sort: 'recent', cursor: null });
      if (requestId !== requestIdRef.current) return;
      setItems(page.items);
      setCursor(page.nextCursor);
      setReachedEnd(page.nextCursor === null);
    } catch {
      if (requestId === requestIdRef.current) setError('initial');
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
      const page = await fetchFirePage(client, { sort: 'recent', cursor });
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

  let status: NewsStatus = 'ready';
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
