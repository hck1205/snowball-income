/**
 * 댓글 트리 구성 — **순수 함수**. IO 없음, 테스트 대상.
 *
 * 서버가 대댓글을 1단계로 강제하므로(enforce_comment_rules 트리거) 트리는 항상 2층이다.
 * 그래서 재귀 트리가 아니라 `루트 + replies[]` 형태로 모델링한다 —
 * 실제로 만들 수 없는 3층 구조를 타입이 허용하면 UI가 쓸데없이 재귀를 다루게 된다.
 */

export type CommentTreeInput = {
  id: string;
  parent_id: string | null;
  created_at: string;
  deleted_at: string | null;
};

export type CommentThread<T extends CommentTreeInput> = {
  comment: T;
  replies: T[];
};

/** created_at 오름차순, 같으면 id로 타이브레이크 (정렬 안정성 — 같은 ms에 들어온 댓글 대비). */
const byCreatedAtAsc = <T extends CommentTreeInput>(a: T, b: T): number => {
  if (a.created_at !== b.created_at) return a.created_at < b.created_at ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
};

/**
 * 플랫 배열 → 스레드 목록.
 *
 * 고아 대댓글(부모가 목록에 없는 경우)은 **버리지 않고 루트로 승격**한다.
 * 서버 제약상 발생할 수 없지만(부모 하드삭제가 불가능), 만약 생긴다면
 * 사용자 글이 조용히 사라지는 것보다 보이는 편이 낫다.
 */
export const buildCommentTree = <T extends CommentTreeInput>(rows: readonly T[]): CommentThread<T>[] => {
  const byId = new Set(rows.map((row) => row.id));

  const roots = rows.filter((row) => row.parent_id === null || !byId.has(row.parent_id));
  const replies = rows.filter((row) => row.parent_id !== null && byId.has(row.parent_id));

  const repliesByParent = new Map<string, T[]>();
  for (const reply of replies) {
    // parent_id는 위 filter로 non-null이 보장된다
    const parentId = reply.parent_id as string;
    const bucket = repliesByParent.get(parentId);
    if (bucket) bucket.push(reply);
    else repliesByParent.set(parentId, [reply]);
  }

  return roots
    .slice()
    .sort(byCreatedAtAsc)
    .map((comment) => ({
      comment,
      replies: (repliesByParent.get(comment.id) ?? []).slice().sort(byCreatedAtAsc)
    }));
};

/**
 * 삭제된 댓글 정리.
 *
 * - 삭제된 **대댓글**은 완전히 숨긴다 (아래에 매달린 게 없으니 남길 이유가 없다).
 * - 삭제된 **루트**는 살아있는 대댓글이 하나라도 있으면 남긴다("삭제된 댓글입니다" 자리표시자로
 *   렌더). 없으면 스레드째 숨긴다.
 *
 * 서버가 본문을 ''로 파기하므로 내용이 새지는 않는다 — 이건 순전히 표시 정리다.
 */
export const pruneDeletedThreads = <T extends CommentTreeInput>(
  threads: readonly CommentThread<T>[]
): CommentThread<T>[] =>
  threads
    .map((thread) => ({
      comment: thread.comment,
      replies: thread.replies.filter((reply) => reply.deleted_at === null)
    }))
    .filter((thread) => thread.comment.deleted_at === null || thread.replies.length > 0);

/** 실제로 보이는 댓글 수 (삭제된 자리표시자는 세지 않는다). */
export const countVisibleComments = <T extends CommentTreeInput>(
  threads: readonly CommentThread<T>[]
): number =>
  threads.reduce(
    (total, thread) => total + (thread.comment.deleted_at === null ? 1 : 0) + thread.replies.length,
    0
  );
