import { describe, expect, it } from 'vitest';
import {
  ALIAS_BOOK_STORAGE_KEY,
  EMPTY_ALIAS_BOOK,
  collectUnresolved,
  forgetAlias,
  learnAlias,
  readAliasBook,
  resolveValue,
  writeAliasBook,
  type AliasBook
} from '@/shared/lib/googleSheets';

/**
 * P3 값 매핑 — 열을 맞춘 **다음**의 문제. 남의 가계부는 같은 개념을 다른 낱말로 부른다.
 *
 * 이 파일이 지키는 것은 두 가지다:
 *   ① 모르는 값을 **조용히 기타로 뭉개지 않는다** (가계부 숫자의 신뢰가 여기 달려 있다)
 *   ② 사용자가 한 번 이어 준 답을 **기억한다** (매번 다시 묻는 매핑은 한 번 쓰고 버려진다)
 */

const memoryStorage = () => {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    raw: map
  };
};

describe('1단 — 사전 일치', () => {
  it('⭐ 실측 템플릿의 이름이 즉시 확정된다', () => {
    expect(resolveValue('식료/생필품비').status).toBe('dictionary');
    expect(resolveValue('배달음식비').status).toBe('dictionary');
    expect(resolveValue('자녀양육비').status).toBe('dictionary');
  });

  it('빈 값은 미해결이되 물을 대상은 아니다', () => {
    const resolution = resolveValue('   ');

    expect(resolution.status).toBe('unresolved');
    expect(resolution.status === 'unresolved' && resolution.raw).toBe('');
  });
});

describe('2단 — 학습된 별칭', () => {
  const book: AliasBook = learnAlias(EMPTY_ALIAS_BOOK, {
    raw: '은하수여행경비',
    categoryId: 'personal',
    subcategoryId: 'personal.travel'
  });

  it('⭐ 한 번 이어 준 값은 다음부터 자동으로 풀린다', () => {
    const resolution = resolveValue('은하수여행경비', book);

    expect(resolution.status).toBe('learned');
    expect(resolution.status === 'learned' && resolution.subcategoryId).toBe('personal.travel');
  });

  it('표기가 조금 달라도 같은 값으로 본다 (정규화)', () => {
    expect(resolveValue('은하수 여행 경비', book).status).toBe('learned');
  });

  it('🔴 사전이 학습보다 먼저다 — 실수로 이어 둔 한 줄이 표준 분류를 덮지 않는다', () => {
    const wrong = learnAlias(book, { raw: '식료품비', categoryId: 'etc' });

    expect(resolveValue('식료품비', wrong).status).toBe('dictionary');
  });

  it('같은 값을 다시 배우면 나중 것이 이긴다 (사용자가 마음을 바꿨다)', () => {
    const changed = learnAlias(book, { raw: '은하수여행경비', categoryId: 'etc' });

    expect(resolveValue('은하수여행경비', changed).status === 'learned').toBe(true);
    const resolution = resolveValue('은하수여행경비', changed);
    expect(resolution.status === 'learned' && resolution.categoryId).toBe('etc');
  });

  it('학습을 지울 수 있다 (잘못 이었을 때의 되돌릴 길)', () => {
    expect(resolveValue('은하수여행경비', forgetAlias(book, '은하수여행경비')).status).toBe('unresolved');
  });

  it('🔴 원본 표를 바꾸지 않는다', () => {
    const before = { ...book };
    learnAlias(book, { raw: '새값', categoryId: 'etc' });

    expect(book).toEqual(before);
  });
});

describe('3단 — 사용자에게 물을 것만 추린다', () => {
  it('⭐ 사전에도 학습에도 없는 값만 남는다', () => {
    const values = ['식료품비', '외식비', '은하수여행경비', '순간이동요금'];

    expect(collectUnresolved(values)).toEqual(['순간이동요금', '은하수여행경비'].sort((a, b) => a.localeCompare(b, 'ko')));
  });

  it('많이 쓰인 값부터 묻는다 (몇 개만 답해도 대부분이 풀린다)', () => {
    const values = ['희귀값', '흔한값', '흔한값', '흔한값'];

    expect(collectUnresolved(values)[0]).toBe('흔한값');
  });

  it('같은 값이 표기만 달라도 한 번만 묻는다', () => {
    expect(collectUnresolved(['순간 이동 요금', '순간이동요금'])).toHaveLength(1);
  });

  it('빈 칸은 묻지 않는다', () => {
    expect(collectUnresolved(['', '   ', undefined])).toEqual([]);
  });

  it('학습한 값은 다음 라운드에서 사라진다', () => {
    const book = learnAlias(EMPTY_ALIAS_BOOK, { raw: '순간이동요금', categoryId: 'transport' });

    expect(collectUnresolved(['순간이동요금'], book)).toEqual([]);
  });
});

describe('보관 — 손상돼도 가계부가 죽지 않는다', () => {
  it('저장한 별칭표를 그대로 읽는다', () => {
    const storage = memoryStorage();
    const book = learnAlias(EMPTY_ALIAS_BOOK, { raw: '순간이동요금', categoryId: 'transport' });
    writeAliasBook(book, storage);

    expect(resolveValue('순간이동요금', readAliasBook(storage)).status).toBe('learned');
  });

  it('🔴 깨진 JSON 이면 빈 표로 시작한다 (화면이 열리지 않는 것보다 낫다)', () => {
    const storage = memoryStorage();
    storage.raw.set(ALIAS_BOOK_STORAGE_KEY, '{망가진');

    expect(readAliasBook(storage)).toEqual(EMPTY_ALIAS_BOOK);
  });

  it('🔴 모양이 다른 항목은 건너뛰고 나머지는 살린다', () => {
    const storage = memoryStorage();
    storage.raw.set(
      ALIAS_BOOK_STORAGE_KEY,
      JSON.stringify({ 순간이동요금: { raw: '순간이동요금', categoryId: 'transport' }, 쓰레기: 42 })
    );

    expect(Object.keys(readAliasBook(storage))).toEqual(['순간이동요금']);
  });

  it('저장된 것이 없으면 빈 표다', () => {
    expect(readAliasBook(memoryStorage())).toEqual(EMPTY_ALIAS_BOOK);
  });
});
