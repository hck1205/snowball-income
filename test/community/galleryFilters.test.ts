import { describe, expect, it } from 'vitest';
import {
  COMMUNITY_QUERY_PARAM,
  countActiveFilters,
  hasAnyFilter,
  parseGalleryFilters,
  serializeGalleryFilters,
  toFacetFilters,
  type GalleryFilters
} from '@/shared/constants/community';

const parse = (search: string): GalleryFilters => parseGalleryFilters(new URLSearchParams(search));

describe('parseGalleryFilters — URL → 필터(원/년)', () => {
  it('정수 파라미터를 원/년 경계로 읽는다', () => {
    expect(parse('mdmin=1000000&mdmax=5000000&tgtmin=3000000&durmin=5&durmax=30')).toEqual({
      mdMin: 1_000_000,
      mdMax: 5_000_000,
      tgtMin: 3_000_000,
      durMin: 5,
      durMax: 30
    });
  });

  it('음수·소수·0·비수·빈 값은 조용히 버린다(무필터, 오염 URL 방어)', () => {
    expect(parse('mdmin=-1&mdmax=abc&tgtmin=1.5&durmin=0&durmax=')).toEqual({
      mdMin: undefined,
      mdMax: undefined,
      tgtMin: undefined,
      durMin: undefined,
      durMax: undefined
    });
  });
});

describe('serializeGalleryFilters — 필터만 세팅/삭제, 나머지 보존', () => {
  it('활성 경계는 원 정수로 싣고, 정렬·텍스트검색(sort/q/qf)은 prev 그대로 둔다', () => {
    const prev = new URLSearchParams('q=배당&sort=popular&qf=title');
    const next = serializeGalleryFilters(prev, { mdMin: 1_000_000, durMax: 20 });

    expect(next.get(COMMUNITY_QUERY_PARAM.mdMin)).toBe('1000000');
    expect(next.get(COMMUNITY_QUERY_PARAM.durMax)).toBe('20');
    expect(next.get('q')).toBe('배당');
    expect(next.get('sort')).toBe('popular');
    expect(next.get('qf')).toBe('title');
  });

  it('빈 필터를 직렬화하면 필터 param만 삭제하고 sort/q는 남긴다(초기화 계약)', () => {
    const prev = new URLSearchParams('q=배당&sort=popular&mdmin=1000000&durmax=20');
    const next = serializeGalleryFilters(prev, {});

    expect(next.has(COMMUNITY_QUERY_PARAM.mdMin)).toBe(false);
    expect(next.has(COMMUNITY_QUERY_PARAM.durMax)).toBe(false);
    expect(next.get('q')).toBe('배당');
    expect(next.get('sort')).toBe('popular');
  });

  it('parse → serialize 왕복이 값을 보존한다', () => {
    const original = 'mdmin=1000000&mdmax=5000000&tgtmin=3000000&durmin=5&durmax=30';
    const roundtrip = serializeGalleryFilters(new URLSearchParams(), parse(original));
    expect(parseGalleryFilters(roundtrip)).toEqual(parse(original));
  });
});

describe('countActiveFilters / hasAnyFilter — 활성 그룹 수(0~3)', () => {
  it('range는 min|max가 있으면 그룹 1로 센다(경계 2개를 2로 부풀리지 않는다)', () => {
    expect(countActiveFilters({ mdMin: 1, mdMax: 2 })).toBe(1);
    expect(countActiveFilters({ mdMin: 1, tgtMin: 2, durMin: 3 })).toBe(3);
    expect(countActiveFilters({})).toBe(0);
    expect(hasAnyFilter({})).toBe(false);
    expect(hasAnyFilter({ durMax: 30 })).toBe(true);
  });
});

describe('toFacetFilters — UI 키 → 데이터 레이어 키(값·단위 동일)', () => {
  it('mdMin→monthlyMin 등으로 매핑한다', () => {
    expect(toFacetFilters({ mdMin: 1_000_000, mdMax: 5_000_000, tgtMin: 3_000_000, durMin: 5, durMax: 30 })).toEqual({
      monthlyMin: 1_000_000,
      monthlyMax: 5_000_000,
      targetMin: 3_000_000,
      durationMin: 5,
      durationMax: 30
    });
  });
});
