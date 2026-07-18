import { describe, expect, it } from 'vitest';
import {
  buildCommentKeysetFilter,
  buildGalleryFacetFilters,
  buildKeysetFilter,
  decodeGalleryCursor,
  encodeGalleryCursor,
  getGalleryOrderKeys,
  splitCommentRootsPage,
  splitPage,
  toGalleryCursor
} from '@/shared/lib/supabase';
import type { GalleryCursor, ScenarioListItem } from '@/shared/lib/supabase';

const item = (id: string, createdAt: string, likeCount = 0): ScenarioListItem => ({
  id,
  user_id: 'u1',
  title: `시나리오 ${id}`,
  description: null,
  is_public: true,
  has_payload: true,
  sim_summary: null,
  like_count: likeCount,
  view_count: 0,
  comment_count: 0,
  created_at: createdAt,
  updated_at: createdAt,
  author: null
});

describe('갤러리 커서 인코딩', () => {
  it('인코딩 → 디코딩 왕복이 값을 보존한다', () => {
    const cursor: GalleryCursor = { createdAt: '2026-07-14T12:00:00.123456+00:00', id: 'abc-123', likeCount: 42 };

    expect(decodeGalleryCursor(encodeGalleryCursor(cursor))).toEqual(cursor);
  });

  it('likeCount가 없는 커서도 왕복한다', () => {
    const cursor: GalleryCursor = { createdAt: '2026-07-14T12:00:00Z', id: 'abc' };

    expect(decodeGalleryCursor(encodeGalleryCursor(cursor))).toEqual(cursor);
  });

  it('URL에 안전한 문자만 쓴다 (base64url)', () => {
    const encoded = encodeGalleryCursor({ createdAt: '2026-07-14T12:00:00+09:00', id: 'a/b+c' });

    expect(encoded).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  it('한글이 들어가도 왕복한다', () => {
    const cursor: GalleryCursor = { createdAt: '2026-07-14T12:00:00Z', id: '시나리오-1' };

    expect(decodeGalleryCursor(encodeGalleryCursor(cursor))).toEqual(cursor);
  });

  it('망가진 커서는 던지지 않고 null을 준다 (첫 페이지로 폴백)', () => {
    expect(decodeGalleryCursor('!!!not-base64!!!')).toBeNull();
    expect(decodeGalleryCursor(null)).toBeNull();
    expect(decodeGalleryCursor(undefined)).toBeNull();
    expect(decodeGalleryCursor('')).toBeNull();
  });

  it('필수 키가 빠진 커서는 null', () => {
    const bad = btoa(JSON.stringify({ id: 'only-id' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    expect(decodeGalleryCursor(bad)).toBeNull();
  });

  it('likeCount 타입이 틀리면 null (조작된 커서)', () => {
    const bad = btoa(JSON.stringify({ createdAt: '2026-01-01', id: 'a', likeCount: 'many' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    expect(decodeGalleryCursor(bad)).toBeNull();
  });
});

describe('toGalleryCursor', () => {
  it('recent 정렬에서는 likeCount를 넣지 않는다', () => {
    expect(toGalleryCursor(item('a', '2026-01-01T00:00:00Z', 7), 'recent')).toEqual({
      createdAt: '2026-01-01T00:00:00Z',
      id: 'a'
    });
  });

  it('popular 정렬에서는 likeCount를 포함한다', () => {
    expect(toGalleryCursor(item('a', '2026-01-01T00:00:00Z', 7), 'popular')).toEqual({
      createdAt: '2026-01-01T00:00:00Z',
      id: 'a',
      likeCount: 7
    });
  });
});

describe('buildKeysetFilter', () => {
  it('recent: created_at 튜플 비교를 OR로 펼친다', () => {
    const filter = buildKeysetFilter('recent', { createdAt: '2026-01-01T00:00:00Z', id: 'x' });

    expect(filter).toBe('created_at.lt."2026-01-01T00:00:00Z",and(created_at.eq."2026-01-01T00:00:00Z",id.lt."x")');
  });

  it('popular: like_count → created_at → id 3단 튜플 비교', () => {
    const filter = buildKeysetFilter('popular', { createdAt: '2026-01-01T00:00:00Z', id: 'x', likeCount: 5 });

    expect(filter).toBe(
      'like_count.lt.5,' +
        'and(like_count.eq.5,created_at.lt."2026-01-01T00:00:00Z"),' +
        'and(like_count.eq.5,created_at.eq."2026-01-01T00:00:00Z",id.lt."x")'
    );
  });

  it('타임스탬프를 따옴표로 감싼다 (+ : 같은 문자가 필터 문법을 깨뜨리지 않도록)', () => {
    const filter = buildKeysetFilter('recent', { createdAt: '2026-07-14T12:00:00.123+09:00', id: 'x' });

    expect(filter).toContain('"2026-07-14T12:00:00.123+09:00"');
  });

  it('popular인데 likeCount가 없으면 recent 규칙으로 폴백한다 (정렬 전환 시 커서 불일치)', () => {
    const filter = buildKeysetFilter('popular', { createdAt: '2026-01-01T00:00:00Z', id: 'x' });

    expect(filter).toBe(buildKeysetFilter('recent', { createdAt: '2026-01-01T00:00:00Z', id: 'x' }));
  });
});

describe('buildGalleryFacetFilters (정밀 검색)', () => {
  it('필터가 없거나 빈 객체면 경계를 만들지 않는다 (기존 목록 동작)', () => {
    expect(buildGalleryFacetFilters(undefined)).toEqual([]);
    expect(buildGalleryFacetFilters(null)).toEqual([]);
    expect(buildGalleryFacetFilters({})).toEqual([]);
  });

  it('월배당 range는 final_monthly_dividend gte/lte로 펼친다', () => {
    expect(buildGalleryFacetFilters({ monthlyMin: 3_000_000, monthlyMax: 5_000_000 })).toEqual([
      { column: 'final_monthly_dividend', op: 'gte', value: 3_000_000 },
      { column: 'final_monthly_dividend', op: 'lte', value: 5_000_000 }
    ]);
  });

  it('목표는 이상(gte) 단일 경계만 만든다 (상한 없음)', () => {
    expect(buildGalleryFacetFilters({ targetMin: 2_000_000 })).toEqual([
      { column: 'target_monthly_dividend', op: 'gte', value: 2_000_000 }
    ]);
  });

  it('투자기간 range는 duration_years gte/lte로 펼친다', () => {
    expect(buildGalleryFacetFilters({ durationMin: 10, durationMax: 25 })).toEqual([
      { column: 'duration_years', op: 'gte', value: 10 },
      { column: 'duration_years', op: 'lte', value: 25 }
    ]);
  });

  it('세 facet을 모두 주면 컬럼별 경계를 순서대로 모은다', () => {
    expect(
      buildGalleryFacetFilters({
        monthlyMin: 1_000_000,
        monthlyMax: 9_000_000,
        targetMin: 3_000_000,
        durationMin: 5,
        durationMax: 30
      })
    ).toEqual([
      { column: 'final_monthly_dividend', op: 'gte', value: 1_000_000 },
      { column: 'final_monthly_dividend', op: 'lte', value: 9_000_000 },
      { column: 'target_monthly_dividend', op: 'gte', value: 3_000_000 },
      { column: 'duration_years', op: 'gte', value: 5 },
      { column: 'duration_years', op: 'lte', value: 30 }
    ]);
  });

  it('0은 유효한 경계로 유지한다 (미지정과 구분)', () => {
    expect(buildGalleryFacetFilters({ monthlyMin: 0 })).toEqual([
      { column: 'final_monthly_dividend', op: 'gte', value: 0 }
    ]);
  });

  it('NaN·Infinity 같은 비유한 값은 무필터로 떨군다', () => {
    expect(
      buildGalleryFacetFilters({ monthlyMin: Number.NaN, monthlyMax: Number.POSITIVE_INFINITY, durationMin: 12 })
    ).toEqual([{ column: 'duration_years', op: 'gte', value: 12 }]);
  });
});

describe('getGalleryOrderKeys', () => {
  it('recent는 (created_at, id) 내림차순', () => {
    expect(getGalleryOrderKeys('recent')).toEqual([
      { column: 'created_at', ascending: false },
      { column: 'id', ascending: false }
    ]);
  });

  it('popular는 (like_count, created_at, id) 내림차순 — 인덱스 순서와 일치해야 한다', () => {
    expect(getGalleryOrderKeys('popular')).toEqual([
      { column: 'like_count', ascending: false },
      { column: 'created_at', ascending: false },
      { column: 'id', ascending: false }
    ]);
  });
});

describe('splitPage', () => {
  it('pageSize+1개가 오면 마지막을 잘라내고 다음 커서를 만든다', () => {
    const rows = [
      item('a', '2026-01-03T00:00:00Z'),
      item('b', '2026-01-02T00:00:00Z'),
      item('c', '2026-01-01T00:00:00Z') // 초과분 (다음 페이지 존재 신호)
    ];

    const page = splitPage(rows, 2, 'recent');

    expect(page.items.map((row) => row.id)).toEqual(['a', 'b']);
    expect(page.nextCursor).not.toBeNull();
    // 커서는 **잘라낸 뒤의 마지막 항목**(b)을 가리켜야 한다 — c를 가리키면 c가 통째로 누락된다
    expect(decodeGalleryCursor(page.nextCursor)).toEqual({ createdAt: '2026-01-02T00:00:00Z', id: 'b' });
  });

  it('pageSize 이하면 마지막 페이지 (nextCursor = null)', () => {
    const page = splitPage([item('a', '2026-01-01T00:00:00Z')], 2, 'recent');

    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).toBeNull();
  });

  it('빈 결과도 안전하다', () => {
    const page = splitPage([], 12, 'recent');

    expect(page.items).toEqual([]);
    expect(page.nextCursor).toBeNull();
  });

  it('popular 정렬의 커서에는 like_count가 실린다', () => {
    const rows = [item('a', '2026-01-02T00:00:00Z', 9), item('b', '2026-01-01T00:00:00Z', 3), item('c', '2026-01-01T00:00:00Z', 1)];

    const page = splitPage(rows, 2, 'popular');

    expect(decodeGalleryCursor(page.nextCursor)).toEqual({
      createdAt: '2026-01-01T00:00:00Z',
      id: 'b',
      likeCount: 3
    });
  });
});

describe('댓글 keyset (루트 20개 단위, 오름차순)', () => {
  const root = (id: string, createdAt: string) => ({ id, created_at: createdAt });

  it('buildCommentKeysetFilter — (created_at, id) > (T, I) 튜플 비교를 or로 펼친다', () => {
    expect(buildCommentKeysetFilter({ createdAt: '2026-07-14T00:00:00Z', id: 'c20' })).toBe(
      'created_at.gt."2026-07-14T00:00:00Z",and(created_at.eq."2026-07-14T00:00:00Z",id.gt."c20")'
    );
  });

  it('splitCommentRootsPage — limit+1개가 오면 pageSize로 자르고 마지막 루트로 커서를 만든다', () => {
    const rows = [
      root('a', '2026-07-01T00:00:00Z'),
      root('b', '2026-07-02T00:00:00Z'),
      root('c', '2026-07-03T00:00:00Z')
    ];

    const page = splitCommentRootsPage(rows, 2);

    expect(page.roots.map((row) => row.id)).toEqual(['a', 'b']);
    expect(page.nextCursor).toEqual({ createdAt: '2026-07-02T00:00:00Z', id: 'b' });
  });

  it('splitCommentRootsPage — pageSize 이하면 전부 반환하고 커서는 null (마지막 페이지)', () => {
    const rows = [root('a', '2026-07-01T00:00:00Z'), root('b', '2026-07-02T00:00:00Z')];

    const page = splitCommentRootsPage(rows, 2);

    expect(page.roots.map((row) => row.id)).toEqual(['a', 'b']);
    expect(page.nextCursor).toBeNull();
  });

  it('splitCommentRootsPage — 커서 경계에서 페이지가 이어져도 중복이 없다', () => {
    const all = Array.from({ length: 5 }, (_, i) => root(`c${i}`, `2026-07-0${i + 1}T00:00:00Z`));

    const first = splitCommentRootsPage(all.slice(0, 3), 2);
    // 다음 페이지 = 커서 이후 행(gt 비교라 커서 행 자신은 제외)
    const rest = all.filter(
      (row) =>
        row.created_at > first.nextCursor!.createdAt ||
        (row.created_at === first.nextCursor!.createdAt && row.id > first.nextCursor!.id)
    );
    const second = splitCommentRootsPage(rest, 2);

    const merged = [...first.roots, ...second.roots].map((row) => row.id);
    expect(merged).toEqual(['c0', 'c1', 'c2', 'c3']);
    expect(new Set(merged).size).toBe(merged.length);
  });
});
