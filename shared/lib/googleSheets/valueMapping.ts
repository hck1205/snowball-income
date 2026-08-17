/**
 * **값 매핑** — 열을 맞춘 다음에도 남는 문제를 푼다: 남의 가계부는 같은 개념을 다른 낱말로 부른다.
 *
 * 열 매핑(`mapping.ts`)이 "이 열이 항목이다"를 정하면, 여기는 "그 열에 적힌 `식료/생필품비` 가
 * 우리 분류의 무엇인가"를 정한다. 둘은 다른 문제이고, 섞으면 한쪽만 고쳐도 다른 쪽이 깨진다.
 *
 * 3단으로 좁힌다 (docs/ledger-v2-design.md §4.2)
 * ---------------------------------------------------------------------------
 *   1. **사전 일치** — 기본 분류 사전의 이름·별칭에 있으면 즉시 확정.
 *   2. **학습된 별칭** — 사용자가 전에 직접 이어 준 값이면 그대로 쓴다.
 *   3. **미해결** — 남은 것만 화면이 사용자에게 묻는다.
 *
 * 🔴 **2단계가 이 파일의 존재 이유다.** 사전에 없는 값을 매번 다시 묻는 매핑은 한 번 쓰고 버려진다.
 *    사용자가 한 번 고른 답을 기억해야 다음 동기화가 자동이 된다.
 * 🔴 **못 맞춘 값을 `기타`로 떨어뜨리지 않는다.** 조용한 오분류는 가계부에서 숫자 전체를 못 믿게
 *    만든다 — 모르면 모른다고 말하고 사용자에게 결정을 넘긴다.
 *
 * 저장되는 것
 * ---------------------------------------------------------------------------
 * 별칭표는 **가계부 값이 아니라 사전**이다("식료품비 → 식비"). 금액·날짜·메모는 한 글자도 담기지
 * 않으므로 로컬 저장이 데이터 소유권 원칙(행은 사용자 시트에만)과 어긋나지 않는다.
 */
import { normalizeCategoryToken, resolveCategoryName } from '@/shared/constants/ledger';
import type { LedgerCategoryId } from '@/shared/constants/ledger';
import { storageKey } from '@/shared/lib/storage';

/** 학습된 별칭 한 줄. `subcategoryId` 가 없으면 항목까지만 정한 것이다. */
export type LearnedAlias = {
  /** 시트에 적혀 있던 원문(표시용 — 사용자가 "무엇을 이었는지" 알아볼 수 있어야 한다). */
  readonly raw: string;
  readonly categoryId: LedgerCategoryId;
  readonly subcategoryId?: string;
};

/** 정규화된 토큰 → 학습된 별칭. */
export type AliasBook = Readonly<Record<string, LearnedAlias>>;

export const EMPTY_ALIAS_BOOK: AliasBook = {};

export type ValueResolution =
  | { readonly status: 'dictionary'; readonly categoryId: LedgerCategoryId; readonly subcategoryId?: string }
  | { readonly status: 'learned'; readonly categoryId: LedgerCategoryId; readonly subcategoryId?: string }
  | { readonly status: 'unresolved'; readonly raw: string };

/**
 * 값 하나를 해석한다. 사전 → 학습 → 미해결 순.
 *
 * ⚠ 사전이 학습보다 **먼저**다. 기본 분류는 앱이 보증하는 뜻이고, 학습은 그 바깥을 메우는 보충이다.
 *   순서가 뒤집히면 사용자가 실수로 이어 둔 한 줄이 표준 분류를 영구히 덮는다.
 */
export const resolveValue = (raw: string | undefined, book: AliasBook = EMPTY_ALIAS_BOOK): ValueResolution => {
  const text = (raw ?? '').trim();
  if (text.length === 0) return { status: 'unresolved', raw: '' };

  const fromDictionary = resolveCategoryName(text);
  if (fromDictionary) {
    return fromDictionary.subcategory
      ? {
          status: 'dictionary',
          categoryId: fromDictionary.category.id,
          subcategoryId: fromDictionary.subcategory.id
        }
      : { status: 'dictionary', categoryId: fromDictionary.category.id };
  }

  const learned = book[normalizeCategoryToken(text)];
  if (learned) {
    return learned.subcategoryId
      ? { status: 'learned', categoryId: learned.categoryId, subcategoryId: learned.subcategoryId }
      : { status: 'learned', categoryId: learned.categoryId };
  }

  return { status: 'unresolved', raw: text };
};

/**
 * 시트에 등장한 값 전부를 훑어 **사용자에게 물어야 할 것만** 추린다.
 *
 * 반환은 원문 기준 중복을 제거하고 **등장 빈도 내림차순**이다 — 많이 쓰인 값부터 물어야 몇 개만
 * 답해도 대부분이 해결된다(가계부 값은 심하게 치우쳐 있다. 실측에서 상위 5개가 절반을 넘었다).
 */
export const collectUnresolved = (
  values: readonly (string | undefined)[],
  book: AliasBook = EMPTY_ALIAS_BOOK
): string[] => {
  const counts = new Map<string, { raw: string; count: number }>();
  for (const value of values) {
    const resolution = resolveValue(value, book);
    if (resolution.status !== 'unresolved' || resolution.raw.length === 0) continue;
    const key = normalizeCategoryToken(resolution.raw);
    const seen = counts.get(key);
    if (seen) seen.count += 1;
    else counts.set(key, { raw: resolution.raw, count: 1 });
  }
  return [...counts.values()]
    .sort((left, right) => right.count - left.count || left.raw.localeCompare(right.raw, 'ko'))
    .map((entry) => entry.raw);
};

/**
 * 사용자가 고른 답을 별칭표에 더한다. **원본을 바꾸지 않는다**(새 객체를 준다).
 *
 * ⚠ 같은 토큰을 다시 배우면 **나중 것이 이긴다** — 사용자가 마음을 바꾼 것이고, 그게 정답이다.
 *   (사전 충돌과는 다르다. 사전은 위 `resolveValue` 에서 항상 먼저 이긴다.)
 */
export const learnAlias = (book: AliasBook, alias: LearnedAlias): AliasBook => {
  const key = normalizeCategoryToken(alias.raw);
  if (key.length === 0) return book;
  return { ...book, [key]: alias };
};

/** 학습을 지운다(사용자가 잘못 이었을 때 되돌릴 길). */
export const forgetAlias = (book: AliasBook, raw: string): AliasBook => {
  const key = normalizeCategoryToken(raw);
  if (!(key in book)) return book;
  const next = { ...book };
  delete next[key];
  return next;
};

/* ── 로컬 보관 ──────────────────────────────────────────────────────────────── */

/** 별칭표 저장 키. 시트별로 나누지 않는다 — 사람의 어휘는 시트를 옮겨도 그대로다. */
export const ALIAS_BOOK_STORAGE_KEY = storageKey('ledger-alias-book');

/**
 * 저장된 별칭표를 읽는다. **어떤 실패도 던지지 않는다** — 손상된 값 하나가 가계부 화면 전체를
 * 못 열게 만들면 안 된다. 못 읽으면 빈 표로 시작하고, 사용자는 다시 이어 주면 된다.
 */
export const readAliasBook = (storage?: Pick<Storage, 'getItem'>): AliasBook => {
  try {
    const store = storage ?? (typeof localStorage === 'undefined' ? null : localStorage);
    if (!store) return EMPTY_ALIAS_BOOK;
    const raw = store.getItem(ALIAS_BOOK_STORAGE_KEY);
    if (!raw) return EMPTY_ALIAS_BOOK;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return EMPTY_ALIAS_BOOK;

    const book: Record<string, LearnedAlias> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!value || typeof value !== 'object') continue;
      const record = value as Record<string, unknown>;
      if (typeof record.raw !== 'string' || typeof record.categoryId !== 'string') continue;
      book[key] =
        typeof record.subcategoryId === 'string'
          ? { raw: record.raw, categoryId: record.categoryId as LedgerCategoryId, subcategoryId: record.subcategoryId }
          : { raw: record.raw, categoryId: record.categoryId as LedgerCategoryId };
    }
    return book;
  } catch {
    return EMPTY_ALIAS_BOOK;
  }
};

/** 별칭표를 저장한다. 실패는 조용히 넘긴다(사생활 모드·용량 초과에서 가계부가 죽지 않는다). */
export const writeAliasBook = (book: AliasBook, storage?: Pick<Storage, 'setItem'>): void => {
  try {
    const store = storage ?? (typeof localStorage === 'undefined' ? null : localStorage);
    if (!store) return;
    store.setItem(ALIAS_BOOK_STORAGE_KEY, JSON.stringify(book));
  } catch {
    /* 저장하지 못해도 이번 세션의 매핑은 그대로 동작한다. */
  }
};
