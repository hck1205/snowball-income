/**
 * **분류 사다리** — 적지 않은 칸을 히포가 채운다. 전부 순수 함수.
 *
 * ## 왜 이 파일이 있나
 *
 * 가계부가 실패하는 첫째 이유는 **분류 고르기가 귀찮아서**다. 널리 쓰이는 시트 템플릿들은 이 귀찮음과
 * 싸우려고 숨은 탭 333열을 동원해 종속 드롭다운을 만든다 — 고르는 **수고를 줄이는** 접근이다.
 *
 * 우리는 고르는 **일 자체를 없앤다.** 적어야 하는 것은 셋뿐이다:
 *
 * ```
 * 필수   날짜 · 금액 · 내용
 * 선택   항목 · 상세항목 · 구분 · 고정   ← 비워 두면 여기가 채운다
 * ```
 *
 * ## 사다리 — 위에서 아래로, 걸리면 멈춘다
 *
 * | 단 | 무엇 | 부분 일치 | 근거 |
 * |---|---|---|---|
 * | 0 | **시트에 이미 적혀 있다** | — | 🔴 사용자가 적은 것은 건드리지 않는다 |
 * | 1 | **사용자 규칙** (`분류 규칙` 탭) | ✅ 쓴다 | 사용자가 고른 말이다 |
 * | 2 | **내장 별칭 사전** | ❌ 안 쓴다 | 우리가 고른 말이다 — 오분류가 우리 책임이 된다 |
 * | 3 | **미분류** | — | 🔴 `기타`로 떨어뜨리지 않는다. 묻는다 |
 *
 * 1단과 2단의 부분 일치 여부가 정반대인 이유는 `classify.types.ts` 의 `LedgerClassifyRule` 머리말에 있다.
 *
 * ## 🔴 지어내지 않는다
 *
 * 사다리를 다 내려가도 모르면 `source: 'none'` 이다. 그럴듯한 분류를 꽂아 넣으면 사용자는 **자기 기록이
 * 잘못 분류된 사실조차 모른다.** 미분류는 결함이 아니라 정직한 상태이고, 화면이 모아서 묻는다.
 */
import {
  findCategory,
  normalizeCategoryToken,
  parseFixity,
  resolveCategoryPair
} from '@/shared/constants/ledger';
import type { LedgerFixity } from '@/shared/constants/ledger';

import type {
  ClassifyInput,
  LedgerClassification,
  LedgerClassifyRule,
  LedgerFlow
} from './classify.types';
import { UNCLASSIFIED } from './classify.types';

/* ── 구분 ────────────────────────────────────────────────────────────────────── */

/** 시트의 `구분` 칸 글자 → flow. 모르는 말이면 `null`. */
const parseFlowCell = (raw: string | undefined): LedgerFlow | null => {
  if (typeof raw !== 'string') return null;
  const token = normalizeCategoryToken(raw);
  if (token.length === 0) return null;
  if (token === '수입' || token === '소득' || token === 'income') return 'income';
  if (token === '지출' || token === '비용' || token === 'expense') return 'expense';
  if (token === '이체' || token === '저축' || token === '투자' || token === 'transfer') return 'transfer';
  return null;
};

/* ── 규칙 ────────────────────────────────────────────────────────────────────── */

/**
 * 규칙을 **긴 말부터** 보게 정렬한다.
 *
 * 🔴 순서가 결과를 바꾼다. `배달음식` 과 `음식` 두 규칙이 있을 때 짧은 쪽이 먼저 걸리면
 *    `배달음식` 규칙은 **영영 쓰이지 않는다** — 사용자는 자기가 적은 줄이 무시되는 걸 보게 된다.
 *    긴 말이 더 구체적이므로 긴 쪽을 먼저 본다.
 *
 * ⚠ 길이가 같으면 **먼저 적은 쪽**이 이긴다(안정 정렬). 시트의 위아래가 곧 우선순위이고,
 *   사용자가 줄을 옮겨 우선순위를 바꿀 수 있다.
 */
export const sortRulesBySpecificity = (
  rules: readonly LedgerClassifyRule[]
): readonly LedgerClassifyRule[] =>
  [...rules].sort(
    (left, right) =>
      normalizeCategoryToken(right.contains).length - normalizeCategoryToken(left.contains).length
  );

/** 규칙 하나가 이 내용에 걸리나. */
const ruleMatches = (rule: LedgerClassifyRule, normalizedMemo: string): boolean => {
  const needle = normalizeCategoryToken(rule.contains);
  /* 빈 규칙은 모든 것에 걸린다 — 그건 규칙이 아니라 사고다. 걸리지 않게 막는다. */
  if (needle.length === 0) return false;
  return normalizedMemo.includes(needle);
};

/* ── 사다리 ──────────────────────────────────────────────────────────────────── */

/**
 * 한 행을 분류한다. **사다리 0~3단.**
 *
 * @param input 시트 한 행의 칸들. 전부 비어 있어도 된다.
 * @param rules 사용자 규칙. 정렬은 여기서 하지 않는다 — 여러 행을 돌 때 매번 정렬하면 낭비이므로
 *   호출부가 `sortRulesBySpecificity` 로 한 번 정렬해 넘긴다. (정렬 안 된 것을 넘겨도 동작은 하고,
 *   다만 구체적인 규칙이 밀릴 수 있다.)
 */
export const classifyLedgerRow = (
  input: ClassifyInput,
  rules: readonly LedgerClassifyRule[] = []
): LedgerClassification => {
  const writtenFixity: LedgerFixity | null =
    typeof input.fixity === 'string' && input.fixity.trim().length > 0
      ? parseFixity(input.fixity)
      : null;
  const writtenFlow = parseFlowCell(input.kind);

  /* ── 0단: 시트에 이미 적혀 있다 ─────────────────────────────────────────────
   * 🔴 사용자가 적은 것은 건드리지 않는다. 히포의 판단이 더 맞다고 생각되더라도,
   *    덮어쓰는 것은 남의 기록을 지우는 일이다. 화면에서 표시만 하고 결정은 사용자가 한다. */
  const written = resolveCategoryPair(input.category, input.subcategory);
  if (written) {
    return {
      category: written.category,
      subcategory: written.subcategory ?? null,
      /* 적힌 구분이 이긴다. 없으면 항목에서 따라온다. */
      flow: writtenFlow ?? written.category.flow,
      fixity: writtenFixity,
      source: 'sheet'
    };
  }

  const memo = typeof input.memo === 'string' ? input.memo : '';
  const normalizedMemo = normalizeCategoryToken(memo);

  if (normalizedMemo.length > 0) {
    /* ── 1단: 사용자 규칙 (부분 일치) ───────────────────────────────────────── */
    for (const rule of rules) {
      if (!ruleMatches(rule, normalizedMemo)) continue;
      const category = findCategory(rule.categoryId);
      /* 규칙이 없어진 분류를 가리키면 그 줄은 무시한다 — 사전이 바뀌어도 조용히 틀리지 않게. */
      if (!category) continue;
      const subcategory = rule.subcategoryId
        ? (category.subcategories.find((sub) => sub.id === rule.subcategoryId) ?? null)
        : null;
      return {
        category,
        subcategory,
        flow: writtenFlow ?? category.flow,
        fixity: writtenFixity ?? rule.fixity ?? null,
        source: 'rule'
      };
    }

    /* ── 2단: 내장 별칭 사전 (정확 일치만) ─────────────────────────────────────
     * 내용 전체가 아는 이름일 때만 걸린다 — `월세`, `통신비` 처럼 적는 사람이 실제로 있다.
     * 🔴 부분 일치를 쓰지 않는 이유는 `categories.ts` 의 `normalizeCategoryToken` 머리말에 있다. */
    const fromDictionary = resolveCategoryPair(undefined, memo);
    if (fromDictionary) {
      return {
        category: fromDictionary.category,
        subcategory: fromDictionary.subcategory ?? null,
        flow: writtenFlow ?? fromDictionary.category.flow,
        fixity: writtenFixity,
        source: 'dictionary'
      };
    }
  }

  /* ── 3단: 미분류 ────────────────────────────────────────────────────────────
   * 구분이나 고정이 적혀 있으면 그것만이라도 살린다 — 분류를 못 정한 것이 그 사실까지
   * 버릴 이유는 아니다. */
  if (writtenFlow || writtenFixity) {
    return { ...UNCLASSIFIED, flow: writtenFlow, fixity: writtenFixity };
  }
  return UNCLASSIFIED;
};

/**
 * 이 분류가 **계산에 들어갈 수 있나.**
 *
 * 🔴 구분(`flow`)이 없으면 못 들어간다. 수입·지출·이체를 못 가르면 합계가 뒤집히기 때문이다 —
 *    이체를 지출로 세면 저축한 돈이 쓴 돈이 되고 저축률이 무너진다.
 *    그래서 미분류는 **0 으로 세는 것이 아니라 빼고**, 몇 건이 빠졌는지 화면이 말한다.
 */
export const isCountable = (classification: LedgerClassification): boolean =>
  classification.flow !== null;

/**
 * 히포가 **시트에 되적어 줄 것이 있나.**
 *
 * `sheet` 는 이미 적혀 있으니 없고, `none` 은 정한 게 없으니 없다.
 * 규칙·사전으로 정한 것만 되적는다.
 */
export const isBackfillable = (classification: LedgerClassification): boolean =>
  classification.source === 'rule' || classification.source === 'dictionary';
