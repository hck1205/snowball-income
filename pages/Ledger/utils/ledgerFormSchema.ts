import { z } from 'zod';
import { LEDGER_COPY } from '../copy';
import type { LedgerDraftForm } from '../types';

/**
 * 항목 추가·수정 폼의 검증(순수). 메시지는 `LEDGER_COPY.form.errors` 를 **그대로 참조**한다 —
 * 리터럴을 여기에 다시 적으면 카피가 두 벌이 되어 한쪽만 바뀐다.
 *
 * 🔴 시트에 실제로 쓸 수 있는지는 데이터 계층(`validateLedgerDraft`)이 다시 본다. 여기 검증은
 * "네트워크를 쓰기 전에 사용자에게 말해 줄 수 있는 것"만 담당한다.
 */
const errors = LEDGER_COPY.form.errors;

/** 1조 원. 시트 셀에 들어가는 값이라 상한을 둔다(오타로 자릿수가 늘어난 값이 그대로 저장되지 않게). */
export const LEDGER_AMOUNT_MAX = 1_000_000_000_000;

export const LEDGER_CATEGORY_MAX_LENGTH = 40;
export const LEDGER_MEMO_MAX_LENGTH = 200;
/** 상세항목은 항목과 같은 폭이면 충분하다(같은 성격의 이름이다). */
export const LEDGER_SUBCATEGORY_MAX_LENGTH = 40;
/** 주체는 사람 이름 한 칸 — 길면 표에서 줄바꿈이 나 목록이 흔들린다. */
export const LEDGER_PAYER_MAX_LENGTH = 20;
export const LEDGER_METHOD_MAX_LENGTH = 40;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const dateSchema = z
  .string()
  .refine((value) => value.trim().length > 0, { message: errors.dateRequired })
  .refine((value) => value.trim().length === 0 || ISO_DATE.test(value.trim()), { message: errors.dateFormat });

/**
 * 금액은 문자열로 받는다 — 지우는 중(빈 문자열)을 숫자로 접으면 `Number('') === 0` 이라
 * "0원"이 저장될 수 있다. 천 단위 쉼표만 걷어내고 나머지 문자는 **오류로 말한다**.
 */
const amountSchema = z
  .string()
  .refine((value) => value.trim().length > 0, { message: errors.amountRequired })
  .refine((value) => value.trim().length === 0 || Number.isFinite(Number(value.replace(/,/g, ''))), {
    message: errors.amountNumber
  })
  .refine(
    (value) => {
      const parsed = Number(value.replace(/,/g, ''));
      return !Number.isFinite(parsed) || parsed > 0;
    },
    { message: errors.amountPositive }
  )
  .refine(
    (value) => {
      const parsed = Number(value.replace(/,/g, ''));
      return !Number.isFinite(parsed) || parsed < LEDGER_AMOUNT_MAX;
    },
    { message: errors.amountTooLarge }
  );

/**
 * 항목.
 *
 * 🔴 **혼자서는 필수가 아니다**(2026-08-08). 비워 두면 분류 사다리가 내용을 보고 채운다
 *    (`shared/lib/ledger/classify`). 대신 채울 재료가 있어야 하므로, "항목과 내용이 둘 다 비면
 *    막는다"는 **교차 규칙**이 아래 `superRefine` 에 있다.
 *
 * ⚠ 이 스키마만 보고 "항목은 선택"이라고 읽으면 안 된다 — 규칙이 객체 수준에 있다.
 */
const categorySchema = z
  .string()
  .refine((value) => value.trim().length <= LEDGER_CATEGORY_MAX_LENGTH, { message: errors.categoryTooLong });

const memoSchema = z.string().refine((value) => value.length <= LEDGER_MEMO_MAX_LENGTH, {
  message: errors.memoTooLong
});

/**
 * v2 축의 자유 텍스트 셋. **비어 있어도 통과한다** — 선택 축이라 빈 값이 정상이고,
 * 길이만 본다(값의 뜻은 앱이 정하지 않는다. 사용자가 쓰던 낱말이 정본이다).
 */
const optionalTextSchema = (max: number, message: string) =>
  z.string().refine((value) => value.trim().length <= max, { message });

export const ledgerFormSchema = z.object({
  date: dateSchema,
  /* 🔴 `transfer` 가 v2 에서 늘었다 — 빠뜨리면 이체 저장이 폼 단계에서 막힌다. */
  kind: z.union([z.literal('income'), z.literal('expense'), z.literal('transfer')]),
  amount: amountSchema,
  category: categorySchema,
  subcategory: optionalTextSchema(LEDGER_SUBCATEGORY_MAX_LENGTH, errors.subcategoryTooLong),
  payer: optionalTextSchema(LEDGER_PAYER_MAX_LENGTH, errors.payerTooLong),
  method: optionalTextSchema(LEDGER_METHOD_MAX_LENGTH, errors.methodTooLong),
  isFixed: z.boolean(),
  memo: memoSchema
})
  /**
   * 🔴 **항목과 내용이 둘 다 비면 막는다.**
   *
   * 항목을 비워도 되는 것은 히포가 채워 주기 때문인데, 채우는 유일한 재료가 **내용**이다.
   * 둘 다 비면 사다리가 아무것도 못 하고 그 줄은 구분을 못 정해 **합계에서 통째로 빠진다** —
   * 저장은 됐는데 요약에 안 잡히는 것이 사용자에게 가장 나쁜 결과라, 그 전에 막는다.
   *
   * ⚠ 오류를 `category` 에 붙인다. `firstInvalidField` 가 그 칸으로 포커스를 옮기는데,
   *   둘 중 먼저 눈에 들어오는 칸이 항목이라 거기서 시작하는 편이 자연스럽다.
   *   문구는 "내용을 적어도 된다"를 함께 말한다.
   */
  .superRefine((draft, ctx) => {
    if (draft.category.trim().length > 0) return;
    if (draft.memo.trim().length > 0) return;
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['category'], message: errors.categoryRequired });
  });

/** 필드별 첫 오류 메시지. 통과하면 빈 객체다(제출 시도 전에는 호출하지 않는다). */
export const validateLedgerForm = (draft: LedgerDraftForm): Partial<Record<keyof LedgerDraftForm, string>> => {
  const result = ledgerFormSchema.safeParse(draft);
  if (result.success) return {};

  const messages: Partial<Record<keyof LedgerDraftForm, string>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field !== 'string') continue;
    const key = field as keyof LedgerDraftForm;
    if (messages[key] === undefined) messages[key] = issue.message;
  }
  return messages;
};

/** 검증을 통과한 폼 → 시트에 쓸 숫자. 쉼표만 걷어낸다. */
export const parseLedgerAmount = (raw: string): number => Number(raw.replace(/,/g, ''));

/** 오류가 있는 첫 필드(제출 시 포커스를 옮길 대상). 없으면 `null`. */
export const firstInvalidField = (
  messages: Partial<Record<keyof LedgerDraftForm, string>>
): keyof LedgerDraftForm | null => {
  for (const field of ['date', 'kind', 'amount', 'category', 'subcategory', 'payer', 'method', 'memo'] as const) {
    if (messages[field] !== undefined) return field;
  }
  return null;
};
