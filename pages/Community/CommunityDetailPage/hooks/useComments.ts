import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { ANALYTICS_EVENT, setUserProperties, track } from '@/shared/lib/analytics';
import {
  buildCommentTree,
  createComment,
  fetchCommentsPage,
  fetchMyCommentLikes,
  fetchVisibleCommentCount,
  getSupabaseClient,
  mergeCommentRows,
  pruneDeletedThreads,
  softDeleteComment,
  toggleCommentLike,
  type CommentCursor,
  type CommentThread,
  type CommentWithAuthor,
  type CommunityClient
} from '@/shared/lib/supabase';
import { useProfileAtomValue, useSessionAtomValue } from '@/jotai/community';

const c = COMMUNITY_COPY.comments;

export type CommentsStatus = 'loading' | 'ready' | 'error';

export type UseComments = {
  status: CommentsStatus;
  threads: CommentThread<CommentWithAuthor>[];
  /** 서버 총계(삭제 제외) — 페이지네이션으로 일부만 로드돼도 "댓글 N"은 전체 수를 말한다. */
  totalCount: number;
  /** 아직 로드하지 않은 루트 댓글 페이지가 남아 있는가. */
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMoreError: boolean;
  likedCommentIds: Set<string>;
  /** 좋아요 요청이 진행 중인 댓글 id 집합(disabled 표시용). */
  likePendingIds: Set<string>;
  submitting: boolean;
  /** 댓글 등록 실패 사유 — 서버의 한국어 안내(레이트리밋 등)는 그대로, 그 외엔 일반 문구. */
  submitError: string | null;
  /** 삭제/좋아요 실패 사유 — 같은 표면화 규칙. */
  actionError: string | null;
  isPending: (commentId: string) => boolean;
  retry: () => void;
  loadMore: () => void;
  addComment: (body: string, parentId?: string | null) => Promise<boolean>;
  toggleLike: (commentId: string) => void;
  remove: (commentId: string) => Promise<void>;
};

const TEMP_PREFIX = 'temp-';
const makeTempId = () => `${TEMP_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * 실패를 사용자 문장으로 바꾼다. DB 트리거의 raise exception 메시지는 한국어로 작성돼 있어
 * (예: 레이트리밋 "댓글을 너무 빠르게 작성하고 있습니다…") 그대로 보여줄 수 있다.
 * 식별 불가(영문/네트워크) 에러는 일반 문구로 뭉갠다 — 내부 메시지를 사용자에게 흘리지 않는다.
 */
const toUserMessage = (error: unknown, fallback: string): string => {
  const message = error instanceof Error ? error.message : '';
  return /[가-힣]/.test(message) ? message : fallback;
};

/**
 * 댓글 데이터 훅 — 루트 댓글 20개 keyset 무한 스크롤 + 로드된 루트의 대댓글 동반 로드.
 * 플랫 rows를 상태로 두고 트리(buildCommentTree→pruneDeletedThreads)를 파생한다.
 * 작성/좋아요/삭제는 낙관적으로 rows를 갱신하고 실패 시 되돌린다 — 실패는 무음이 아니라
 * submitError/actionError로 표면화한다(입력은 뷰가 보존).
 */
export const useComments = (postId: string | undefined): UseComments => {
  const session = useSessionAtomValue();
  const profile = useProfileAtomValue();
  const clientRef = useRef<CommunityClient | null>(null);

  const [status, setStatus] = useState<CommentsStatus>('loading');
  const [rows, setRows] = useState<CommentWithAuthor[]>([]);
  const [nextCursor, setNextCursor] = useState<CommentCursor | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set());
  const [likePendingIds, setLikePendingIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // 진행 중인 좋아요 요청 가드(동기 판정). state와 별개로 경쟁조건을 막는다.
  const likeInFlightRef = useRef<Set<string>>(new Set());
  // 추가 로드 중복 트리거 가드(IntersectionObserver + "더 보기" 버튼 동시 발화 대비).
  const loadMoreInFlightRef = useRef(false);

  const ensureClient = useCallback(async () => {
    if (clientRef.current) return clientRef.current;
    const client = await getSupabaseClient();
    clientRef.current = client;
    return client;
  }, []);

  useEffect(() => {
    if (!postId) return;
    let cancelled = false;
    setStatus('loading');
    setLoadMoreError(false);

    void (async () => {
      const client = await ensureClient();
      if (!client || cancelled) {
        if (!cancelled) setStatus('error');
        return;
      }
      try {
        const [page, total] = await Promise.all([
          fetchCommentsPage(client, postId),
          fetchVisibleCommentCount(client, postId)
        ]);
        if (cancelled) return;
        setRows(page.comments);
        setNextCursor(page.nextCursor);
        setTotalCount(total);
        setStatus('ready');

        if (session && page.comments.length > 0) {
          fetchMyCommentLikes(client, session.user.id, page.comments.map((row) => row.id))
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
  }, [ensureClient, reloadKey, postId, session]);

  const threads = useMemo(() => pruneDeletedThreads(buildCommentTree(rows)), [rows]);

  const loadMore = useCallback(() => {
    if (loadMoreInFlightRef.current) return;
    const cursor = nextCursor;
    if (!postId || !cursor) return;

    loadMoreInFlightRef.current = true;
    setIsLoadingMore(true);
    setLoadMoreError(false);

    void (async () => {
      try {
        const client = await ensureClient();
        if (!client) throw new Error('no client');
        const page = await fetchCommentsPage(client, postId, { cursor });
        setRows((prev) => mergeCommentRows(prev, page.comments));
        setNextCursor(page.nextCursor);

        if (session && page.comments.length > 0) {
          fetchMyCommentLikes(client, session.user.id, page.comments.map((row) => row.id))
            .then((set) => setLikedCommentIds((prev) => new Set([...prev, ...set])))
            .catch(() => undefined);
        }
      } catch {
        setLoadMoreError(true);
      } finally {
        loadMoreInFlightRef.current = false;
        setIsLoadingMore(false);
      }
    })();
  }, [ensureClient, nextCursor, postId, session]);

  const addComment = useCallback(
    async (body: string, parentId?: string | null): Promise<boolean> => {
      const trimmed = body.trim();
      if (!trimmed || !postId || !session) return false;

      const tempId = makeTempId();
      const nowIso = new Date().toISOString();
      const optimistic: CommentWithAuthor = {
        id: tempId,
        post_id: postId,
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
      setSubmitError(null);

      try {
        const client = await ensureClient();
        if (!client) throw new Error('no client');
        const saved = await createComment(client, { postId, body: trimmed, parentId: parentId ?? null });
        setRows((prev) => prev.map((row) => (row.id === tempId ? saved : row)));
        setTotalCount((count) => count + 1);
        // 댓글 작성 성공 후에만 계측(낙관적 실패 시 미발화). 본문·PII는 보내지 않는다.
        track(ANALYTICS_EVENT.COMMUNITY_COMMENT);
        setUserProperties({ community_active: true });
        return true;
      } catch (error) {
        // 낙관적 댓글은 되돌리되, 이유는 삼키지 않는다 — 뷰가 입력을 보존하므로 재시도 가능.
        setRows((prev) => prev.filter((row) => row.id !== tempId));
        setSubmitError(toUserMessage(error, c.submitFailed));
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [ensureClient, profile, postId, session]
  );

  const toggleLike = useCallback(
    (commentId: string) => {
      if (!session || commentId.startsWith(TEMP_PREFIX)) return;
      // 진행 중인 같은 댓글의 재클릭은 무시(시나리오 좋아요의 likePending과 동일한 가드).
      if (likeInFlightRef.current.has(commentId)) return;
      likeInFlightRef.current.add(commentId);
      setLikePendingIds(new Set(likeInFlightRef.current));
      setActionError(null);

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
          setActionError(c.likeFailed);
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
        } catch (error) {
          rollback();
          setActionError(toUserMessage(error, c.likeFailed));
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
      setActionError(null);
      setRows((prev) =>
        prev.map((row) => (row.id === commentId ? { ...row, deleted_at: nowIso, body: '' } : row))
      );
      try {
        const client = await ensureClient();
        if (!client) throw new Error('no client');
        await softDeleteComment(client, commentId);
        setTotalCount((count) => Math.max(0, count - 1));
      } catch (error) {
        setRows(previous);
        setActionError(toUserMessage(error, c.deleteFailed));
      }
    },
    [ensureClient, rows]
  );

  const retry = useCallback(() => setReloadKey((key) => key + 1), []);
  const isPending = useCallback((commentId: string) => commentId.startsWith(TEMP_PREFIX), []);

  return {
    status,
    threads,
    totalCount,
    hasMore: nextCursor !== null,
    isLoadingMore,
    loadMoreError,
    likedCommentIds,
    likePendingIds,
    submitting,
    submitError,
    actionError,
    isPending,
    retry,
    loadMore,
    addComment,
    toggleLike,
    remove
  };
};
