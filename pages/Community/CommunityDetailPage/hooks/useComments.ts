import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildCommentTree,
  countVisibleComments,
  createComment,
  fetchComments,
  fetchMyCommentLikes,
  getSupabaseClient,
  pruneDeletedThreads,
  softDeleteComment,
  toggleCommentLike,
  type CommentThread,
  type CommentWithAuthor,
  type CommunityClient
} from '@/shared/lib/supabase';
import { useProfileAtomValue, useSessionAtomValue } from '@/jotai/community';

export type CommentsStatus = 'loading' | 'ready' | 'error';

export type UseComments = {
  status: CommentsStatus;
  threads: CommentThread<CommentWithAuthor>[];
  visibleCount: number;
  likedCommentIds: Set<string>;
  /** 좋아요 요청이 진행 중인 댓글 id 집합(disabled 표시용). */
  likePendingIds: Set<string>;
  submitting: boolean;
  isPending: (commentId: string) => boolean;
  retry: () => void;
  addComment: (body: string, parentId?: string | null) => Promise<boolean>;
  toggleLike: (commentId: string) => void;
  remove: (commentId: string) => Promise<void>;
};

const TEMP_PREFIX = 'temp-';
const makeTempId = () => `${TEMP_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * 댓글 데이터 훅. 플랫 rows를 상태로 두고 트리(buildCommentTree→pruneDeletedThreads)를 파생한다.
 * 작성/좋아요/삭제는 낙관적으로 rows를 갱신하고 실패 시 되돌린다.
 */
export const useComments = (scenarioId: string | undefined): UseComments => {
  const session = useSessionAtomValue();
  const profile = useProfileAtomValue();
  const clientRef = useRef<CommunityClient | null>(null);

  const [status, setStatus] = useState<CommentsStatus>('loading');
  const [rows, setRows] = useState<CommentWithAuthor[]>([]);
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set());
  const [likePendingIds, setLikePendingIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // 진행 중인 좋아요 요청 가드(동기 판정). state와 별개로 경쟁조건을 막는다.
  const likeInFlightRef = useRef<Set<string>>(new Set());

  const ensureClient = useCallback(async () => {
    if (clientRef.current) return clientRef.current;
    const client = await getSupabaseClient();
    clientRef.current = client;
    return client;
  }, []);

  useEffect(() => {
    if (!scenarioId) return;
    let cancelled = false;
    setStatus('loading');

    void (async () => {
      const client = await ensureClient();
      if (!client || cancelled) {
        if (!cancelled) setStatus('error');
        return;
      }
      try {
        const list = await fetchComments(client, scenarioId);
        if (cancelled) return;
        setRows(list);
        setStatus('ready');

        if (session && list.length > 0) {
          fetchMyCommentLikes(client, session.user.id, list.map((row) => row.id))
            .then((set) => {
              if (!cancelled) setLikedCommentIds(set);
            })
            .catch(() => undefined);
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ensureClient, reloadKey, scenarioId, session]);

  const threads = useMemo(() => pruneDeletedThreads(buildCommentTree(rows)), [rows]);
  const visibleCount = useMemo(() => countVisibleComments(threads), [threads]);

  const addComment = useCallback(
    async (body: string, parentId?: string | null): Promise<boolean> => {
      const trimmed = body.trim();
      if (!trimmed || !scenarioId || !session) return false;

      const tempId = makeTempId();
      const nowIso = new Date().toISOString();
      const optimistic: CommentWithAuthor = {
        id: tempId,
        scenario_id: scenarioId,
        user_id: session.user.id,
        parent_id: parentId ?? null,
        body: trimmed,
        like_count: 0,
        created_at: nowIso,
        updated_at: nowIso,
        deleted_at: null,
        author: profile
      };
      setRows((prev) => [...prev, optimistic]);
      setSubmitting(true);

      try {
        const client = await ensureClient();
        if (!client) throw new Error('no client');
        const saved = await createComment(client, { scenarioId, body: trimmed, parentId: parentId ?? null });
        setRows((prev) => prev.map((row) => (row.id === tempId ? saved : row)));
        return true;
      } catch {
        setRows((prev) => prev.filter((row) => row.id !== tempId));
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [ensureClient, profile, scenarioId, session]
  );

  const toggleLike = useCallback(
    (commentId: string) => {
      if (!session || commentId.startsWith(TEMP_PREFIX)) return;
      // 진행 중인 같은 댓글의 재클릭은 무시(시나리오 좋아요의 likePending과 동일한 가드).
      if (likeInFlightRef.current.has(commentId)) return;
      likeInFlightRef.current.add(commentId);
      setLikePendingIds(new Set(likeInFlightRef.current));

      const wasLiked = likedCommentIds.has(commentId);
      const nextLiked = !wasLiked;

      setLikedCommentIds((prev) => {
        const next = new Set(prev);
        if (nextLiked) next.add(commentId);
        else next.delete(commentId);
        return next;
      });
      setRows((prev) =>
        prev.map((row) =>
          row.id === commentId ? { ...row, like_count: Math.max(0, row.like_count + (nextLiked ? 1 : -1)) } : row
        )
      );

      const rollback = () => {
        setLikedCommentIds((prev) => {
          const next = new Set(prev);
          if (wasLiked) next.add(commentId);
          else next.delete(commentId);
          return next;
        });
        setRows((prev) =>
          prev.map((row) =>
            row.id === commentId ? { ...row, like_count: Math.max(0, row.like_count + (nextLiked ? -1 : 1)) } : row
          )
        );
      };

      const clearInFlight = () => {
        likeInFlightRef.current.delete(commentId);
        setLikePendingIds(new Set(likeInFlightRef.current));
      };

      void (async () => {
        const client = await ensureClient();
        if (!client) {
          rollback();
          clearInFlight();
          return;
        }
        try {
          const serverLiked = await toggleCommentLike(client, commentId);
          if (serverLiked !== nextLiked) {
            setLikedCommentIds((prev) => {
              const next = new Set(prev);
              if (serverLiked) next.add(commentId);
              else next.delete(commentId);
              return next;
            });
            setRows((prev) =>
              prev.map((row) =>
                row.id === commentId
                  ? { ...row, like_count: Math.max(0, row.like_count + (serverLiked ? 1 : -1) - (nextLiked ? 1 : -1)) }
                  : row
              )
            );
          }
        } catch {
          rollback();
        } finally {
          clearInFlight();
        }
      })();
    },
    [ensureClient, likedCommentIds, session]
  );

  const remove = useCallback(
    async (commentId: string) => {
      if (commentId.startsWith(TEMP_PREFIX)) return;
      const nowIso = new Date().toISOString();
      const previous = rows;
      setRows((prev) =>
        prev.map((row) => (row.id === commentId ? { ...row, deleted_at: nowIso, body: '' } : row))
      );
      try {
        const client = await ensureClient();
        if (!client) throw new Error('no client');
        await softDeleteComment(client, commentId);
      } catch {
        setRows(previous);
      }
    },
    [ensureClient, rows]
  );

  const retry = useCallback(() => setReloadKey((key) => key + 1), []);
  const isPending = useCallback((commentId: string) => commentId.startsWith(TEMP_PREFIX), []);

  return {
    status,
    threads,
    visibleCount,
    likedCommentIds,
    likePendingIds,
    submitting,
    isPending,
    retry,
    addComment,
    toggleLike,
    remove
  };
};
