import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  matchesBoardCategories,
  parseBoardCategories,
  serializeBoardCategories,
  toPostCategory,
  toggleBoardCategory
} from '@/shared/constants/community';
import {
  GALLERY_PAGE_SIZE,
  fetchBoardPage,
  getSupabaseClient,
  type CommunityClient,
  type PostCategory,
  type PostListItem
} from '@/shared/lib/supabase';

export type BoardStatus = 'loading' | 'error' | 'empty' | 'filteredEmpty' | 'ready';

export type UseBoardResult = {
  items: PostListItem[];
  status: BoardStatus;
  /** 켜진 분류들. 빈 배열이 곧 '전체'다(별도 플래그 없음). */
  categories: readonly PostCategory[];
  reachedEnd: boolean;
  isLoadingMore: boolean;
  loadMoreError: boolean;
  loadMore: () => void;
  retry: () => void;
  /** 분류 칩 하나 토글 → URL(`?cat=`) 갱신. */
  toggleCategory: (id: PostCategory) => void;
  /** '전체'로 되돌린다(분류 param 삭제). filteredEmpty CTA 도 이걸 쓴다. */
  clearCategories: () => void;
};

/**
 * 한 번의 자동 보충으로 채우려는 **보이는 글 수**. 한 페이지 분량이다.
 * 1건만 채우고 멈추면 안 되는 이유: 무한스크롤의 `IntersectionObserver` 는 **DOM 이 바뀔 때만**
 * 다시 부른다. 보충한 페이지가 전부 걸러지면 화면이 그대로라 관찰자가 다시 울리지 않아 목록이
 * 그 자리에 굳는다. 그래서 "한 화면치가 찰 때까지"를 훅이 직접 책임진다.
 */
const AUTO_FILL_TARGET = GALLERY_PAGE_SIZE;

/**
 * 자동 보충 상한(페이지 수). 폭주 방지용 안전핀이다 — 이 값에 걸리면 `filteredEmpty` 로 끝낸다.
 * 12 × 12 = 144건까지 훑고도 한 건도 없으면 "그 분류에는 글이 없다"고 말하는 편이 정직하다.
 */
const MAX_AUTO_FILL_PAGES = 12;

/**
 * 커뮤니티 게시판 목록 데이터 훅 — kind='board' 최신순 + keyset 무한스크롤 + **글 분류 필터**.
 *
 * 갤러리(useGallery)와 같은 요청-id 가드/커서 패턴을 쓴다. 2026-08-04 부터 URL(`?cat=`)을 구독해
 * 분류 필터를 반영한다(그전에는 URL 을 전혀 보지 않는 평면 최신순 목록이었다).
 *
 * ## 🔴 분류 필터가 서버 조건이 아니라 클라이언트 필터인 이유 (그리고 그 대가)
 * 서버 조건(`.in('category', …)`)이 원래 더 낫다 — 네트워크가 정확히 필요한 만큼만 돈다. 다만
 * 그 한 줄은 `shared/lib/supabase/queries.ts`(이 작업의 담당 밖)에 있고, **거기엔 함정이 하나 더
 * 있다**: `category` 는 아직 배포되지 않았을 수 있는 낙관적 컬럼이라 `selectPosts` 가 42703 을
 * 만나면 **select 목록에서만** 컬럼을 뺀다. `.in()` 조건은 그 폴백이 못 걷어내므로 재시도까지
 * 실패해 목록 전체가 에러가 된다. 클라이언트 필터는 그 경우 조용히 "전부 free" 로 읽혀
 * 화면이 죽지 않는다.
 *
 * 대가는 대역폭이다: 걸러진 페이지만큼 뒤 페이지를 더 받아야 한다. 그래서 아래 자동 보충 루프가
 * 있고 상한(MAX_AUTO_FILL_PAGES)이 있다. 글이 수천 건 규모가 되면 서버 조건으로 올려야 한다 —
 * 그때 필요한 것은 `fetchGalleryPage` 옵션에 `categories` 를 더하고 `.eq('kind')` 뒤에
 * `.in('category', categories)` 를 얹는 것, 그리고 42703 을 잡아 필터를 떨구는 가드다.
 *
 * ## 필터가 바뀌어도 커서를 리셋하지 않는다
 * 이미 받아 둔 페이지들은 **어느 분류를 골라도 그대로 유효하다**(같은 kind·같은 최신순 축).
 * 리셋하면 똑같은 행을 다시 받게 될 뿐이라, 여기서는 커서를 유지하고 화면만 다시 거른다.
 * ⚠ 서버 조건으로 올리는 날에는 이 문장이 뒤집힌다 — 그때는 반드시 커서·목록을 리셋해야 한다
 *   (조건이 다르면 키셋이 가리키는 페이지도 다르다).
 */
export const useBoard = (): UseBoardResult => {
  const [searchParams, setSearchParams] = useSearchParams();
  // URL 이 유일한 진실 — 칩이 쓰고 여기가 읽는다. 오염 값은 parse 단계에서 조용히 떨어진다.
  const categoryKey = parseBoardCategories(searchParams).join(',');
  // useCallback/useEffect 의존성은 원시값(categoryKey)으로 — 배열은 매 렌더 새 참조라
  // 그대로 넣으면 참조 비교가 매번 어긋나 무한 리페치가 난다(useGallery 가 같은 이유로 원시값을 쓴다).
  const categories = useMemo<readonly PostCategory[]>(
    () => (categoryKey ? (categoryKey.split(',') as PostCategory[]) : []),
    [categoryKey]
  );
  const hasFilter = categories.length > 0;

  const [rawItems, setRawItems] = useState<PostListItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<'initial' | 'more' | null>(null);
  /** 이번 필터에서 자동 보충으로 더 받은 페이지 수(상한 판정용). 필터가 바뀌면 0으로 되돌린다. */
  const [autoFillPages, setAutoFillPages] = useState(0);

  const clientRef = useRef<CommunityClient | null>(null);
  const requestIdRef = useRef(0);
  const fetchingRef = useRef(false);

  const items = useMemo(
    // 서버 값을 신뢰하지 않는다 — 컬럼이 없거나 미지의 값이면 toPostCategory 가 'free' 로 정규화한다.
    () => rawItems.filter((item) => matchesBoardCategories(categories, toPostCategory(item.category))),
    [categories, rawItems]
  );

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
      setRawItems(page.items);
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
      setRawItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
      setReachedEnd(page.nextCursor === null);
    } catch {
      if (requestId === requestIdRef.current) setError('more');
    } finally {
      if (requestId === requestIdRef.current) setIsLoadingMore(false);
      fetchingRef.current = false;
    }
  }, [cursor, ensureClient, initialLoading, reachedEnd]);

  // 필터가 바뀌면 보충 예산을 새로 준다(다른 분류는 걸리는 밀도가 다르다).
  useEffect(() => {
    setAutoFillPages(0);
  }, [categoryKey]);

  /**
   * 자동 보충 — 필터가 켜져 있고 보이는 글이 한 화면치에 못 미치면 다음 페이지를 스스로 받는다.
   * 루프는 `isLoadingMore` 가 true→false 로 돌 때마다 이 효과가 다시 평가되며 굴러가고,
   * `reachedEnd`·에러·상한에서 멈춘다.
   */
  useEffect(() => {
    if (!hasFilter) return;
    if (initialLoading || isLoadingMore || reachedEnd || error !== null) return;
    if (items.length >= AUTO_FILL_TARGET) return;
    if (autoFillPages >= MAX_AUTO_FILL_PAGES) return;
    setAutoFillPages((count) => count + 1);
    void loadMore();
  }, [autoFillPages, error, hasFilter, initialLoading, isLoadingMore, items.length, loadMore, reachedEnd]);

  const toggleCategory = useCallback(
    (id: PostCategory) => {
      setSearchParams(
        // 필터 토글은 뒤로가기 스택을 오염시키지 않는다(replace) — 정렬 토글과 같은 관례.
        (prev) => serializeBoardCategories(prev, toggleBoardCategory(parseBoardCategories(prev), id)),
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const clearCategories = useCallback(() => {
    setSearchParams((prev) => serializeBoardCategories(prev, []), { replace: true });
  }, [setSearchParams]);

  const retry = useCallback(() => {
    if (error === 'more') void loadMore();
    else void loadFirstPage();
  }, [error, loadFirstPage, loadMore]);

  /** 아직 뒤 페이지를 훑는 중인가 — 보충 중에 'filteredEmpty' 를 띄우면 결론이 성급하다. */
  const isAutoFilling = hasFilter && !reachedEnd && error === null && autoFillPages < MAX_AUTO_FILL_PAGES;

  let status: BoardStatus = 'ready';
  if (initialLoading) status = 'loading';
  else if (error === 'initial') status = 'error';
  else if (items.length === 0) {
    if (!hasFilter) status = 'empty';
    else if (isAutoFilling) status = 'loading';
    else status = 'filteredEmpty';
  }

  return {
    items,
    status,
    categories,
    reachedEnd,
    isLoadingMore,
    loadMoreError: error === 'more',
    loadMore,
    retry,
    toggleCategory,
    clearCategories
  };
};
