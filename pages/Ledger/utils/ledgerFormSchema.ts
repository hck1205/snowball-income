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

const categorySchema = z
  .string()
  .refine((value) => value.trim().length > 0, { message: errors.categoryRequired })
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
