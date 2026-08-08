/**
 * `분류 규칙` 탭 ↔ 규칙 객체. 순수 변환만.
 *
 * ## 왜 규칙을 시트에 두나
 *
 * 학습한 규칙은 원래 `localStorage` 에 있었다(`valueMapping.ts` 의 `ALIAS_BOOK_STORAGE_KEY`). 그러면
 * 두 가지가 안 된다:
 *
 * 1. **기기를 바꾸면 사라진다.** 사용자 자산인데 이 브라우저에만 있다.
 * 2. **왜 그렇게 분류됐는지 볼 수 없다.** 히포가 조용히 정하고 사용자는 결과만 본다.
 *
 * 시트 탭에 두면 둘 다 해결된다. 널리 쓰이는 템플릿들이 이 자리에 **숨긴 333열**을 두는 것과
 * 반대 선택이다 — 우리는 **보여 준다.** 마음에 안 들면 한 줄 고치면 되고, 그것이 곧 다음 분류에 쓰인다.
 *
 * 🔴 **사용자가 고친 줄이 정본이다.** 앱이 다시 덮어쓰지 않는다. 규칙 탭은 앱의 캐시가 아니라
 *    사용자의 설정이다.
 */
import { LEDGER_FIXITY_LABEL, findCategory, parseFixity, resolveCategoryPair } from '@/shared/constants/ledger';

import type { LedgerClassifyRule } from './classify.types';

/** `분류 규칙` 탭의 머리. 열 순서가 곧 아래 파서·포매터의 계약이다. */
export const CLASSIFY_RULE_HEADERS = ['포함하는 말', '항목', '상세항목', '고정'] as const;

/** A=포함하는 말 B=항목 C=상세항목 D=고정 */
const RULE_COL = { contains: 0, category: 1, subcategory: 2, fixity: 3 } as const;

const cell = (row: readonly string[], index: number): string => (row[index] ?? '').trim();

/**
 * 규칙 탭의 행들 → 규칙 목록. **머리 행은 호출부가 잘라서 넘긴다.**
 *
 * 알아볼 수 없는 줄은 **조용히 버린다** — 사용자가 손으로 적는 탭이라 오타·빈 줄이 있는 것이 정상이고,
 * 그것 때문에 분류 전체가 멈추면 안 된다.
 *
 * ⚠ 버린 줄을 세어 돌려준다. 화면이 "3줄은 알아보지 못했습니다"라고 말할 수 있어야 한다 —
 *   조용히 버리는 것과 **버린 사실을 숨기는 것**은 다르다.
 */
export const parseClassifyRules = (
  rows: readonly (readonly string[])[]
): { readonly rules: readonly LedgerClassifyRule[]; readonly skipped: number } => {
  const rules: LedgerClassifyRule[] = [];
  let skipped = 0;

  for (const row of rows) {
    const contains = cell(row, RULE_COL.contains);
    if (contains.length === 0) {
      /* 빈 줄은 버리되 **세지 않는다** — 시트 아래쪽 빈 행 수백 개를 "알아보지 못했다"고 말하면 거짓말이다. */
      const hasAnything = row.some((value) => (value ?? '').trim().length > 0);
      if (hasAnything) skipped += 1;
      continue;
    }

    const resolved = resolveCategoryPair(cell(row, RULE_COL.category), cell(row, RULE_COL.subcategory));
    if (!resolved) {
      skipped += 1;
      continue;
    }

    /*
     * 🔴 빈 칸은 `undefined` 다 — "변동비다"가 아니라 "정하지 않았다"다.
     *    그리고 `고정` 이라고 적힌 것만 받는다. 변동을 말하는 규칙은 표현할 수 없다
     *    (이유는 `LedgerClassifyRule.fixity` 머리말).
     */
    const isFixed = parseFixity(cell(row, RULE_COL.fixity)) === 'fixed';
    rules.push({
      contains,
      categoryId: resolved.category.id,
      ...(resolved.subcategory ? { subcategoryId: resolved.subcategory.id } : {}),
      ...(isFixed ? { fixity: 'fixed' as const } : {})
    });
  }

  return { rules, skipped };
};

/**
 * 규칙 하나 → 탭 한 행.
 *
 * ⚠ **id 로 찾고 라벨을 적는다.** `resolveCategoryPair` 는 사람이 쓰는 **이름**을 받는 함수라
 *   `'saving.deposit'` 같은 id 를 넘기면 못 찾는다 — 왕복(적었다 다시 읽기)이 조용히 깨진다.
 */
export const formatClassifyRuleRow = (rule: LedgerClassifyRule): readonly string[] => {
  const category = findCategory(rule.categoryId);
  const subcategory = rule.subcategoryId
    ? category?.subcategories.find((sub) => sub.id === rule.subcategoryId)
    : undefined;
  return [
    rule.contains,
    category?.label ?? '',
    subcategory?.label ?? '',
    rule.fixity ? LEDGER_FIXITY_LABEL.fixed : ''
  ];
};
