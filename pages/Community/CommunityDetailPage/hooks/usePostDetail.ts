import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sanitizeScenarioState } from '@/jotai';
import { ANALYTICS_EVENT, setUserProperties, track } from '@/shared/lib/analytics';
import { encodeSharedScenario, SHARE_QUERY_PARAM, SHARED_SCENARIO_ID } from '@/pages/Main/hooks/persistence';
import {
  deletePost,
  fetchMyPostLikes,
  fetchPostDetail,
  fromPostPayload,
  getSupabaseClient,
  registerPostView,
  togglePostLike,
  type CommunityClient,
  type PostWithAuthor
} from '@/shared/lib/supabase';
import { useSessionAtomValue } from '@/jotai/community';

export type DetailStatus = 'loading' | 'ready' | 'notfound' | 'error';

export type UsePostDetail = {
  status: DetailStatus;
  post: PostWithAuthor | null;
  viewCount: number;
  likeCount: number;
  liked: boolean;
  likePending: boolean;
  isOwner: boolean;
  deleting: boolean;
  openInSimulatorHref: string | null;
  retry: () => void;
  toggleLike: () => void;
  remove: () => Promise<void>;
};

/**
 * 상세 데이터 훅: 시나리오 조회 + 조회수 등록(마운트 1회) + 좋아요(낙관적) + 삭제.
 * 좋아요는 비로그인 시 `onRequireLogin`으로 로그인 유도만 하고 낙관적 토글은 하지 않는다.
 *
 * `listPath`는 삭제 성공 후 돌아갈 목록 경로다(갤러리='/community', 게시판='/community/board').
 * 상세는 갤러리(`/community/:id`)와 게시판(`/community/board/:id`)이 공유하므로 섹션별로 다르다.
 */
export const usePostDetail = (
  id: string | undefined,
  onRequireLogin: () => void,
  listPath = '/community/portfolio'
): UsePostDetail => {
  const session = useSessionAtomValue();
  const navigate = useNavigate();
  const clientRef = useRef<CommunityClient | null>(null);
  const viewRegisteredRef = useRef(false);

  const [status, setStatus] = useState<DetailStatus>('loading');
  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [viewCount, setViewCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likePending, setLikePending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const ensureClient = useCallback(async () => {
    if (clientRef.current) return clientRef.current;
    const client = await getSupabaseClient();
    clientRef.current = client;
    return client;
  }, []);

  useEffect(() => {
    if (!id) {
      setStatus('notfound');
      return;
    }
    let cancelled = false;
    setStatus('loading');

    void (async () => {
      const client = await ensureClient();
      if (!client || cancelled) {
        if (!cancelled) setStatus('error');
        return;
      }
      try {
        const detail = await fetchPostDetail(client, id);
        if (cancelled) return;
        setPost(detail);
        setLikeCount(detail.like_count);
        setViewCount(detail.view_count);
        setStatus('ready');

        // 조회수 등록(마운트당 1회, 서버가 1시간 dedupe).
        if (!viewRegisteredRef.current) {
          viewRegisteredRef.current = true;
          // 상세 진입 계측(마운트당 1회). has_sim = 시뮬 시나리오 첨부 여부 — 첨부 글의 조회 성과 비교.
          track(ANALYTICS_EVENT.COMMUNITY_POST_VIEW, { has_sim: Boolean(detail.payload) });
          registerPostView(client, id)
            .then((count) => {
              if (!cancelled) setViewCount(count);
            })
            .catch(() => undefined);
        }

        // 로그인 상태면 내가 좋아요했는지 조회.
        if (session) {
          fetchMyPostLikes(client, session.user.id, [id])
            .then((set) => {
              if (!cancelled) setLiked(set.has(id));
            })
            .catch(() => undefined);
        } else {
          setLiked(false);
        }
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : '';
        setStatus(/no rows|0 rows|not found|PGRST116/i.test(message) ? 'notfound' : 'error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ensureClient, id, reloadKey, session]);

  const toggleLike = useCallback(() => {
    if (!session) {
      onRequireLogin();
      return;
    }
    if (!id || likePending) return;

    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((count) => count + (nextLiked ? 1 : -1));
    setLikePending(true);

    void (async () => {
      const client = await ensureClient();
      if (!client) {
        setLiked(!nextLiked);
        setLikeCount((count) => count + (nextLiked ? -1 : 1));
        setLikePending(false);
        return;
      }
      try {
        const serverLiked = await togglePostLike(client, id);
        if (serverLiked !== nextLiked) {
          setLiked(serverLiked);
          setLikeCount((count) => count + (serverLiked ? 1 : -1) - (nextLiked ? 1 : -1));
        }
        // 서버 확정 후에만 발화(낙관적 실패 시 미발화). like_action = 서버의 최종 상태.
        track(ANALYTICS_EVENT.COMMUNITY_LIKE, { like_action: serverLiked ? 'like' : 'unlike' });
        setUserProperties({ community_active: true });
      } catch {
        setLiked(!nextLiked);
        setLikeCount((count) => count + (nextLiked ? -1 : 1));
      } finally {
        setLikePending(false);
      }
    })();
  }, [ensureClient, id, liked, likePending, onRequireLogin, session]);

  const remove = useCallback(async () => {
    if (!id) return;
    setDeleting(true);
    try {
      const client = await ensureClient();
      if (!client) {
        setDeleting(false);
        return;
      }
      await deletePost(client, id);
      navigate(listPath, { replace: true });
    } catch {
      setDeleting(false);
    }
  }, [ensureClient, id, listPath, navigate]);

  const retry = useCallback(() => setReloadKey((key) => key + 1), []);

  const isOwner = Boolean(session && post && session.user.id === post.user_id);

  // 첨부(payload)가 있으면 기존 공유 링크 경로(`?share=`)를 재사용해 대시보드에 새 탭으로 적재한다.
  // 좋아요/조회수/다이얼로그 리렌더마다 lz-string 재압축하지 않도록 post 기준으로 memoize.
  const openInSimulatorHref = useMemo<string | null>(() => {
    if (!post?.payload) return null;
    const restored = sanitizeScenarioState(
      fromPostPayload(post.payload, {
        id: SHARED_SCENARIO_ID,
        name: post.title || '공유 시나리오'
      })
    );
    if (!restored) return null;
    return `/?${SHARE_QUERY_PARAM}=${encodeSharedScenario(restored)}`;
  }, [post]);

  return {
    status,
    post,
    viewCount,
    likeCount,
    liked,
    likePending,
    isOwner,
    deleting,
    openInSimulatorHref,
    retry,
    toggleLike,
    remove
  };
};
