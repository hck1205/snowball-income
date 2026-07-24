import { useCallback, useEffect, useRef, useState } from 'react';
import { useSessionAtomValue } from '@/jotai/community';
import {
  fetchMyPosts,
  getSupabaseClient,
  type CommunityClient,
  type PostListItem
} from '@/shared/lib/supabase';

export type MyPostsStatus = 'loading' | 'error' | 'empty' | 'ready';

export type MyPosts = {
  /** 공개·비공개를 **모두** 포함한 내 글(최신순). */
  items: PostListItem[];
  status: MyPostsStatus;
  retry: () => void;
};

/**
 * "내 글" 데이터 훅 — 로그인한 사용자의 글을 공개 여부와 무관하게 최신순으로 가져온다.
 *
 * 갤러리/게시판 목록(fetchGalleryPage)은 partial index 를 타려고 `is_public = true` 를 명시하므로
 * **내 비공개 글이 어디에도 안 보인다**. RLS 는 본인 글을 이미 허용하므로(20260714000000_community.sql
 * `using (is_public or user_id = auth.uid())`) 필터 없는 `fetchMyPosts` 로 조회하면 그대로 내려온다.
 *
 * 페이지네이션은 두지 않는다 — 내가 쓴 글은 갤러리 전체와 달리 한 화면에 들어오는 규모다.
 * 규모가 커지면 useBoard 의 keyset 패턴을 그대로 얹으면 된다.
 *
 * 요청 id 가드는 useBoard/useGallery 와 같은 이유(응답 역전 방지)로 둔다.
 */
export const useMyPosts = (): MyPosts => {
  const session = useSessionAtomValue();
  const userId = session?.user.id ?? null;

  const [items, setItems] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const clientRef = useRef<CommunityClient | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = (requestIdRef.current += 1);

    // 비로그인이면 조회할 대상이 없다(섹션 자체가 렌더되지 않는다). 실패로 위장하지 않는다.
    if (!userId) {
      setItems([]);
      setLoading(false);
      setFailed(false);
      return;
    }

    setLoading(true);
    setFailed(false);

    const client = clientRef.current ?? (await getSupabaseClient());
    clientRef.current = client;
    if (!client) {
      if (requestId === requestIdRef.current) {
        setFailed(true);
        setLoading(false);
      }
      return;
    }

    try {
      const rows = await fetchMyPosts(client, userId);
      if (requestId !== requestIdRef.current) return;
      setItems(rows);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setFailed(true);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const retry = useCallback(() => {
    void load();
  }, [load]);

  let status: MyPostsStatus = 'ready';
  if (loading) status = 'loading';
  else if (failed) status = 'error';
  else if (items.length === 0) status = 'empty';

  return { items, status, retry };
};
