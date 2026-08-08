/**
 * `자산` · `투자` 탭에 **직접 적는** 폼의 스펙과 검증. 순수 함수만.
 *
 * ## 왜 앱에서도 적게 됐나 (2026-08-09 사용자 결정)
 *
 * 처음에는 "적는 것은 시트에서 한다"였다 — 앱에 입력 폼을 또 만들면 같은 값을 넣는 길이 둘이
 * 되고, 두 길의 검증이 갈리는 순간 어느 쪽이 맞는지 아무도 모른다는 이유였다.
 *
 * 사용자가 앱에서도 적기를 요청했고, 그건 타당하다 — 자산을 적으려고 시트로 나가면 돌아오지
 * 않는다. 그래서 **원래 우려했던 것을 실제로 막는다**: 검증 규칙을 이 파일 **한 곳**에 두고,
 * 화면·저장이 같은 함수를 쓴다. 길은 둘이어도 규칙은 하나다.
 *
 * ## 🔴 시트의 열 순서가 계약이다
 *
 * `LEDGER_HOLDING_HEADERS` · `LEDGER_INVESTMENT_HEADERS` 와 **같은 순서**로 행을 만든다.
 * 순서를 손으로 다시 적으면 머리와 값이 어긋나 금액이 이름 칸에 들어간다 — 그래서 필드 정의가
 * 그 상수를 그대로 따르고, 아래 대조 검사가 그것을 잠근다.
 */
import {
  LEDGER_CURRENCY_CHOICES,
  LEDGER_HOLDING_CHOICES,
  LEDGER_HOLDING_HEADERS,
  LEDGER_INVESTMENT_HEADERS
} from '@/shared/constants/ledger';

/** 어느 탭의 폼인가. `entries`(가계부)는 자기 폼이 따로 있다. */
export type LedgerSideFormKind = 'holdings' | 'investments';

export type LedgerSideFieldKind = 'date' | 'text' | 'number' | 'choice';

export type LedgerSideField = {
  readonly id: string;
  readonly label: string;
  readonly kind: LedgerSideFieldKind;
  /** 🔴 비면 막는 칸. 나머지는 비워도 저장된다. */
  readonly required: boolean;
  /** `choice` 일 때의 선택지. */
  readonly choices?: readonly string[];
  readonly placeholder?: string;
  readonly hint?: string;
};

/**
 * 자산 폼.
 *
 * ⚠ 순서가 `LEDGER_HOLDING_HEADERS` 와 같아야 한다 — 아래 `sideFormRow` 가 이 순서로 행을 만든다.
 */
const HOLDING_FIELDS: readonly LedgerSideField[] = [
  { id: 'date', label: '날짜', kind: 'date', required: true, hint: '월말 잔액이라면 그 달의 마지막 날로 적습니다.' },
  { id: 'kind', label: '종류', kind: 'choice', required: true, choices: LEDGER_HOLDING_CHOICES },
  { id: 'name', label: '이름', kind: 'text', required: false, placeholder: '예: 주거래통장' },
  {
    id: 'amount',
    label: '금액',
    kind: 'number',
    required: true,
    /* 🔴 부채도 **양수**로 적는다. 순자산 계산이 종류를 보고 빼므로, 여기서 음수를 받으면 두 번 뺀다. */
    hint: '부채도 양수로 적습니다. 순자산에서는 종류를 보고 빼 드립니다.'
  },
  { id: 'memo', label: '내용', kind: 'text', required: false }
];

/** 투자 폼. 🔴 평가금액·수익률 칸은 없다 — 시세를 받아 오지 않으므로 채울 수 없다. */
const INVESTMENT_FIELDS: readonly LedgerSideField[] = [
  { id: 'account', label: '계좌', kind: 'text', required: false, placeholder: '예: 연금저축' },
  { id: 'ticker', label: '티커', kind: 'text', required: true, placeholder: '예: SCHD' },
  { id: 'shares', label: '수량', kind: 'number', required: true, hint: '소수점 매수도 그대로 적습니다.' },
  { id: 'unitCost', label: '매입단가', kind: 'number', required: false },
  { id: 'currency', label: '통화', kind: 'choice', required: false, choices: LEDGER_CURRENCY_CHOICES },
  { id: 'memo', label: '내용', kind: 'text', required: false }
];

export const LEDGER_SIDE_FIELDS: Readonly<Record<LedgerSideFormKind, readonly LedgerSideField[]>> = {
  holdings: HOLDING_FIELDS,
  investments: INVESTMENT_FIELDS
};

/** 시트 탭의 머리 — 대조 검사가 쓴다. */
export const LEDGER_SIDE_HEADERS: Readonly<Record<LedgerSideFormKind, readonly string[]>> = {
  holdings: LEDGER_HOLDING_HEADERS,
  investments: LEDGER_INVESTMENT_HEADERS
};

export type LedgerSideDraft = Readonly<Record<string, string>>;

/** 빈 초안. `choice` 는 첫 선택지로 시작한다(고르지 않고 저장하는 실수를 줄인다). */
export const emptySideDraft = (kind: LedgerSideFormKind): LedgerSideDraft => {
  const draft: Record<string, string> = {};
  for (const field of LEDGER_SIDE_FIELDS[kind]) {
    draft[field.id] = field.kind === 'choice' ? (field.choices?.[0] ?? '') : '';
  }
  return draft;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 검증. 필드별 첫 오류만 돌려준다(통과하면 빈 객체).
 *
 * 🔴 **네트워크를 쓰기 전에** 말할 수 있는 것만 본다. 시트가 실제로 받아 주는지는 응답이 답한다.
 */
export const validateSideDraft = (
  kind: LedgerSideFormKind,
  draft: LedgerSideDraft
): Readonly<Record<string, string>> => {
  const errors: Record<string, string> = {};

  for (const field of LEDGER_SIDE_FIELDS[kind]) {
    const value = (draft[field.id] ?? '').trim();

    if (field.required && value.length === 0) {
      errors[field.id] = `${field.label}을(를) 입력해 주세요.`;
      continue;
    }
    if (value.length === 0) continue;

    if (field.kind === 'date' && !ISO_DATE.test(value)) {
      errors[field.id] = '날짜를 2026-08-31 형식으로 적어 주세요.';
      continue;
    }
    if (field.kind === 'number') {
      const parsed = Number(value.replace(/,/g, ''));
      if (!Number.isFinite(parsed)) {
        errors[field.id] = `${field.label}은(는) 숫자로 적어 주세요.`;
        continue;
      }
      /* 🔴 0 과 음수를 막는다. 부채도 양수로 적고(종류가 부호를 정한다), 수량 0 은 안 가진 것이다. */
      if (parsed <= 0) errors[field.id] = `${field.label}은(는) 0보다 커야 합니다.`;
    }
  }

  return errors;
};

/**
 * 초안 → 시트 행.
 *
 * 🔴 **필드 정의 순서 그대로** 만든다. 순서를 여기서 다시 적으면 머리와 값이 어긋나 금액이 이름
 *    칸에 들어간다 — 조용히 틀리고, 시트를 열어 보기 전에는 아무도 모른다.
 */
export const sideFormRow = (kind: LedgerSideFormKind, draft: LedgerSideDraft): readonly string[] =>
  LEDGER_SIDE_FIELDS[kind].map((field) => {
    const value = (draft[field.id] ?? '').trim();
    /* 숫자는 쉼표를 걷어 낸다 — `USER_ENTERED` 가 `1,000` 을 글자로 읽는 로케일이 있다. */
    return field.kind === 'number' ? value.replace(/,/g, '') : value;
  });
