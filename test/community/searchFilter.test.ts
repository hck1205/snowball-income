import { describe, expect, it } from 'vitest';
import { buildSearchFilter } from '@/shared/lib/supabase';

/**
 * 검색 필터는 supabase-js `.or(...)` 에 그대로 실린다. 실제 PostgREST 없이 도는 유닛 테스트로
 * **문자열 형태를 고정**한다 (필터 주입/와일드카드 폭주 방지).
 */
describe('buildSearchFilter', () => {
  it('기준 미지정/알 수 없는 값은 제목+요약(description)으로 폴백한다', () => {
    expect(buildSearchFilter('배당')).toBe('title.ilike.%배당%,description.ilike.%배당%');
    // 하위호환: 옛 링크의 qf=all 도 폴백으로 동작한다
    expect(buildSearchFilter('배당', 'all')).toBe('title.ilike.%배당%,description.ilike.%배당%');
  });

  it('검색 기준(qf)별로 대상 컬럼을 스코프한다: 제목/내용(body)/요약(description)', () => {
    expect(buildSearchFilter('배당', 'title')).toBe('title.ilike.%배당%');
    expect(buildSearchFilter('배당', 'body')).toBe('body.ilike.%배당%');
    expect(buildSearchFilter('배당', 'description')).toBe('description.ilike.%배당%');
  });

  it('빈/공백/누락 검색어는 null → 호출부는 일반 목록으로 폴백', () => {
    expect(buildSearchFilter('')).toBeNull();
    expect(buildSearchFilter('   ')).toBeNull();
    expect(buildSearchFilter(null)).toBeNull();
    expect(buildSearchFilter(undefined)).toBeNull();
  });

  it('`.or` 목록 문법을 쪼개는 메타문자(, ( ))를 공백으로 중화한다 (필터 주입 방지)', () => {
    expect(buildSearchFilter('a,b(c)')).toBe('title.ilike.%a b c%,description.ilike.%a b c%');
  });

  it('SQL/PostgREST 와일드카드(% _ *)를 리터럴 공백으로 중화한다 (매칭 폭주 방지)', () => {
    expect(buildSearchFilter('50%_up*')).toBe('title.ilike.%50 up%,description.ilike.%50 up%');
  });

  it('따옴표/역슬래시를 중화한다 (값 인용/이스케이프 보호)', () => {
    // 소스의 'a"b\\c' 는 실제 문자열 a"b\c
    expect(buildSearchFilter('a"b\\c')).toBe('title.ilike.%a b c%,description.ilike.%a b c%');
  });

  it('전부 메타문자면 null', () => {
    expect(buildSearchFilter('%%%')).toBeNull();
    expect(buildSearchFilter('(),')).toBeNull();
  });

  it('앞뒤 공백 제거 + 내부 공백 접기', () => {
    expect(buildSearchFilter('  월  배당  ')).toBe('title.ilike.%월 배당%,description.ilike.%월 배당%');
  });

  it('한글/영문/숫자/점/하이픈은 보존한다 (티커명 검색)', () => {
    expect(buildSearchFilter('BRK.B-2')).toBe('title.ilike.%BRK.B-2%,description.ilike.%BRK.B-2%');
  });
});
