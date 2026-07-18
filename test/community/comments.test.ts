import { describe, expect, it } from 'vitest';
import {
  buildCommentTree,
  countVisibleComments,
  mergeCommentRows,
  pruneDeletedThreads
} from '@/shared/lib/supabase';
import type { CommentTreeInput } from '@/shared/lib/supabase';

const comment = (
  id: string,
  parentId: string | null,
  createdAt: string,
  deletedAt: string | null = null
): CommentTreeInput => ({
  id,
  parent_id: parentId,
  created_at: createdAt,
  deleted_at: deletedAt
});

describe('buildCommentTree', () => {
  it('플랫 배열을 루트 + 대댓글 스레드로 묶는다', () => {
    const rows = [
      comment('r1', null, '2026-01-01T00:00:00Z'),
      comment('c1', 'r1', '2026-01-01T00:01:00Z'),
      comment('r2', null, '2026-01-01T00:02:00Z'),
      comment('c2', 'r1', '2026-01-01T00:03:00Z')
    ];

    const threads = buildCommentTree(rows);

    expect(threads).toHaveLength(2);
    expect(threads[0].comment.id).toBe('r1');
    expect(threads[0].replies.map((reply) => reply.id)).toEqual(['c1', 'c2']);
    expect(threads[1].comment.id).toBe('r2');
    expect(threads[1].replies).toEqual([]);
  });

  it('루트와 대댓글을 작성 시각 오름차순으로 정렬한다 (입력 순서와 무관)', () => {
    const rows = [
      comment('c2', 'r1', '2026-01-01T00:03:00Z'),
      comment('r2', null, '2026-01-01T00:02:00Z'),
      comment('c1', 'r1', '2026-01-01T00:01:00Z'),
      comment('r1', null, '2026-01-01T00:00:00Z')
    ];

    const threads = buildCommentTree(rows);

    expect(threads.map((thread) => thread.comment.id)).toEqual(['r1', 'r2']);
    expect(threads[0].replies.map((reply) => reply.id)).toEqual(['c1', 'c2']);
  });

  it('작성 시각이 같으면 id로 안정 정렬한다', () => {
    const rows = [
      comment('b', null, '2026-01-01T00:00:00Z'),
      comment('a', null, '2026-01-01T00:00:00Z'),
      comment('c', null, '2026-01-01T00:00:00Z')
    ];

    expect(buildCommentTree(rows).map((thread) => thread.comment.id)).toEqual(['a', 'b', 'c']);
  });

  it('부모가 목록에 없는 고아 대댓글은 버리지 않고 루트로 올린다', () => {
    const rows = [comment('r1', null, '2026-01-01T00:00:00Z'), comment('orphan', 'missing', '2026-01-01T00:01:00Z')];

    const threads = buildCommentTree(rows);

    expect(threads.map((thread) => thread.comment.id)).toEqual(['r1', 'orphan']);
  });

  it('빈 배열이면 빈 트리', () => {
    expect(buildCommentTree([])).toEqual([]);
  });

  it('입력 배열을 변형하지 않는다 (순수 함수)', () => {
    const rows = [comment('c1', 'r1', '2026-01-01T00:01:00Z'), comment('r1', null, '2026-01-01T00:00:00Z')];
    const snapshot = rows.map((row) => row.id);

    buildCommentTree(rows);

    expect(rows.map((row) => row.id)).toEqual(snapshot);
  });
});

describe('pruneDeletedThreads', () => {
  it('삭제된 대댓글은 숨긴다', () => {
    const threads = buildCommentTree([
      comment('r1', null, '2026-01-01T00:00:00Z'),
      comment('c1', 'r1', '2026-01-01T00:01:00Z', '2026-01-02T00:00:00Z'),
      comment('c2', 'r1', '2026-01-01T00:02:00Z')
    ]);

    const pruned = pruneDeletedThreads(threads);

    expect(pruned[0].replies.map((reply) => reply.id)).toEqual(['c2']);
  });

  it('삭제된 루트라도 살아있는 대댓글이 있으면 자리표시자로 남긴다 (트리 유지)', () => {
    const threads = buildCommentTree([
      comment('r1', null, '2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z'),
      comment('c1', 'r1', '2026-01-01T00:01:00Z')
    ]);

    const pruned = pruneDeletedThreads(threads);

    expect(pruned).toHaveLength(1);
    expect(pruned[0].comment.id).toBe('r1');
    expect(pruned[0].comment.deleted_at).not.toBeNull();
    expect(pruned[0].replies.map((reply) => reply.id)).toEqual(['c1']);
  });

  it('삭제된 루트에 살아있는 대댓글이 없으면 스레드째 숨긴다', () => {
    const threads = buildCommentTree([
      comment('r1', null, '2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z'),
      comment('c1', 'r1', '2026-01-01T00:01:00Z', '2026-01-02T00:00:00Z'),
      comment('r2', null, '2026-01-01T00:03:00Z')
    ]);

    const pruned = pruneDeletedThreads(threads);

    expect(pruned.map((thread) => thread.comment.id)).toEqual(['r2']);
  });
});

describe('mergeCommentRows — 페이지 병합', () => {
  it('id 기준으로 중복 없이 뒤에 이어붙인다', () => {
    const prev = [comment('a', null, '2026-01-01T00:00:00Z'), comment('b', null, '2026-01-02T00:00:00Z')];
    const incoming = [comment('b', null, '2026-01-02T00:00:00Z'), comment('c', null, '2026-01-03T00:00:00Z')];

    expect(mergeCommentRows(prev, incoming).map((row) => row.id)).toEqual(['a', 'b', 'c']);
  });

  it('입력 배열을 변형하지 않는다 (순수 함수)', () => {
    const prev = [comment('a', null, '2026-01-01T00:00:00Z')];
    const incoming = [comment('a', null, '2026-01-01T00:00:00Z')];

    mergeCommentRows(prev, incoming);

    expect(prev).toHaveLength(1);
    expect(incoming).toHaveLength(1);
  });
});

describe('countVisibleComments', () => {
  it('삭제된 자리표시자는 세지 않는다', () => {
    const threads = pruneDeletedThreads(
      buildCommentTree([
        comment('r1', null, '2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z'),
        comment('c1', 'r1', '2026-01-01T00:01:00Z'),
        comment('r2', null, '2026-01-01T00:02:00Z')
      ])
    );

    // r1은 삭제됨(자리표시자) → c1 + r2 = 2
    expect(countVisibleComments(threads)).toBe(2);
  });
});
