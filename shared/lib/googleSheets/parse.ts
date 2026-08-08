/**
 * 시트 셀 문자열 → 도메인 값. **전부 순수 함수**라 fetch 없이 검증한다.
 *
 * 설계 원칙: **한 행이 이상해도 연결이 실패하지 않는다.** 금액 칸에 `₩1,200`·`1200원`·빈칸이 섞여 있는
 * 것은 남의 가계부에서 정상이다. 읽을 수 없는 행은 사유와 함께 `UnreadableRow` 로 표시하고 건너뛴다.
 */
import { isFixityToken, isSharedPayer, parseFixity } from '@/shared/constants/ledger';
import { LEDGER_FIRST_DATA_ROW } from './schema';
import type {
  ColumnMapping,
  LedgerDraft,
  LedgerEntry,
  LedgerField,
  LedgerKind,
  LedgerPatch,
  RowCells,
  UnreadableRow
} from './types';
import { LEDGER_FIXITY_LABEL } from '@/shared/constants/ledger';
import { classifyLedgerRow, isBackfillable } from '@/shared/lib/ledger';
import type { LedgerClassifyRule } from '@/shared/lib/ledger';
import { formatKindCell } from './format';

/** 금액에서 떼어낼 표기. 숫자·부호·소수점만 남기고 나머지는 실패로 본다. */
const AMOUNT_NOISE = /[\s ,₩￦$¥]|원|KRW/gi;
const AMOUNT_NUMERIC = /^-?\d+(?:\.\d+)?$/;

/**
 * `₩1,200` · `1,200원` · `1200` · `-500` · `(500)` · `△500` 을 숫자로 읽는다.
 * 빈 칸이나 해석 불가는 `null`(0으로 위장하지 않는다 — 0원 지출과 "못 읽은 칸"은 다르다).
 */
export const parseAmount = (raw: string | undefined): number | null => {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;

  // 회계 표기의 음수: 괄호 묶음과 △ 를 부호로 바꾼다.
  const parenthesized = /^\((.*)\)$/.exec(trimmed);
  const withoutParens = parenthesized ? parenthesized[1] : trimmed;
  const triangleNegative = /^[△▲]/.test(withoutParens);
  const body = withoutParens
    .replace(/^[△▲]/, '')
    .replace(/[−–—]/g, '-') // 유니코드 마이너스·대시 → ASCII
    .replace(AMOUNT_NOISE, '');

  if (!AMOUNT_NUMERIC.test(body)) return null;
  const value = Number(body);
  if (!Number.isFinite(value)) return null;

  const negative = parenthesized !== null || triangleNegative;
  return negative ? -Math.abs(value) : value;
};

const isRealDate = (year: number, month: number, day: number): boolean => {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const probe = new Date(Date.UTC(year, month - 1, day));
  return probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day;
};

const pad2 = (value: number): string => String(value).padStart(2, '0');

/** 연도가 먼저 오는 표기만 받는다: `2026-08-01` · `2026/8/1` · `2026. 8. 1` · `2026년 8월 1일`. */
const DATE_PATTERNS: readonly RegExp[] = [
  /^(\d{4})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{1,2})\.?$/,
  /^(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일?$/,
  /^(\d{4})(\d{2})(\d{2})$/
];

/**
 * 날짜 셀을 ISO `YYYY-MM-DD` 로 정규화한다. 해석 불가·존재하지 않는 날짜(2026-02-30)는 `null`.
 *
 * ⚠ `8/1/2026` 처럼 **연도가 뒤에 오는 표기는 일부러 받지 않는다** — 일/월 순서가 로케일마다 달라
 *   조용히 다른 날짜로 읽힐 위험이 "그 행을 못 읽는다"보다 크다.
 */
export const parseLedgerDate = (raw: string | undefined): string | null => {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;

  for (const pattern of DATE_PATTERNS) {
    const matched = pattern.exec(trimmed);
    if (!matched) continue;
    const year = Number(matched[1]);
    const month = Number(matched[2]);
    const day = Number(matched[3]);
    if (!isRealDate(year, month, day)) return null;
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }
  return null;
};

const INCOME_WORDS = new Set(['수입', '입금', '소득', '수익', 'income', 'in', 'credit', '+']);
const EXPENSE_WORDS = new Set(['지출', '출금', '소비', '비용', 'expense', 'out', 'debit', '-']);
/** 이체 = 쓴 것이 아니라 옮긴 것. 저축·투자 납입이 여기 온다(설계 §2.3). */
const TRANSFER_WORDS = new Set(['이체', '대체', '저축', '투자', 'transfer', 'move']);

/** `수입`/`지출`/`이체` 계열 표기를 정규화한다. 모르는 말이면 `null`(임의로 지출로 몰지 않는다). */
export const parseLedgerKind = (raw: string | undefined): LedgerKind | null => {
  if (typeof raw !== 'string') return null;
  const normalized = raw.trim().toLowerCase().replace(/\s+/g, '');
  if (normalized.length === 0) return null;
  if (INCOME_WORDS.has(normalized)) return 'income';
  if (EXPENSE_WORDS.has(normalized)) return 'expense';
  if (TRANSFER_WORDS.has(normalized)) return 'transfer';
  return null;
};

/** 매핑된 열만 뽑아 `RowCells` 로 만든다 — 매핑되지 않은 열은 애초에 여기 들어오지 않는다(AC-W2). */
export const pickRowCells = (
  mapping: ColumnMapping,
  readColumn: (columnIndex: number) => string | undefined
): RowCells => {
  const cells: Partial<Record<LedgerField, string>> = {
    date: readColumn(mapping.date) ?? '',
    kind: readColumn(mapping.kind) ?? '',
    amount: readColumn(mapping.amount) ?? '',
    category: readColumn(mapping.category) ?? ''
  };
  if (mapping.subcategory !== undefined) cells.subcategory = readColumn(mapping.subcategory) ?? '';
  if (mapping.payer !== undefined) cells.payer = readColumn(mapping.payer) ?? '';
  if (mapping.method !== undefined) cells.method = readColumn(mapping.method) ?? '';
  if (mapping.fixity !== undefined) cells.fixity = readColumn(mapping.fixity) ?? '';
  if (mapping.memo !== undefined) cells.memo = readColumn(mapping.memo) ?? '';
  if (mapping.status !== undefined) cells.status = readColumn(mapping.status) ?? '';
  return cells;
};

/** 매핑된 열의 셀이 전부 빈 칸인지. 빈 행은 "읽을 수 없는 행"이 아니라 그냥 없는 행이다. */
export const isBlankRow = (cells: RowCells): boolean =>
  Object.values(cells).every((value) => (value ?? '').trim().length === 0);

export type ParsedRow =
  | { readonly ok: true; readonly entry: Omit<LedgerEntry, 'ref'> & { readonly rowNumber: number } }
  | { readonly ok: false; readonly unreadable: UnreadableRow };

/**
 * 한 행을 해석한다. **날짜·금액**을 못 읽으면 그 행만 실패다.
 *
 * ## 🔴 구분과 항목은 비어 있어도 된다 (2026-08-08)
 *
 * 종전에는 `구분` 이 비면 그 행을 "읽을 수 없음"으로 버렸다. 이제는 **분류 사다리**가 채운다 —
 * 항목이 정해지면 구분은 조회이기 때문이다(`category.flow`). 사다리 전문은
 * `shared/lib/ledger/classify` 머리말에 있다.
 *
 * 다만 **값 자체는 여전히 필수다.** 사다리를 다 내려가도 구분을 못 정하면 그 행은 실패다 —
 * 수입·지출·이체를 못 가르면 이체가 지출로 세어져 저축한 돈이 쓴 돈이 되고 저축률이 무너진다.
 * "입력은 선택, 값은 필수"이고, 그 사이를 사다리가 메운다.
 *
 * ## 🔴 적힌 것은 다시 쓰지 않는다
 *
 * 사다리가 채운 값을 쓰는 것은 **원래 빈 칸이던 자리**뿐이다. 사람이 적어 둔 말은 그 사람의
 * 어휘이므로, 사전의 정규 이름으로 바꿔 적지 않는다 — 시트에 `주거비` 라고 쓴 사람의 화면에
 * `주거` 가 나오면 그건 우리가 남의 기록을 고친 것이다.
 *
 * @param rules 사용자 분류 규칙(`분류 규칙` 탭). 없으면 사다리가 내장 사전까지만 쓴다.
 *   ⚠ 여러 행을 돌 때는 호출부가 `sortRulesBySpecificity` 로 **한 번** 정렬해 넘긴다.
 */
export const parseLedgerRow = (
  cells: RowCells,
  rowNumber: number,
  rules: readonly LedgerClassifyRule[] = []
): ParsedRow => {
  const reasons: string[] = [];

  const date = parseLedgerDate(cells.date);
  if (date === null) reasons.push('날짜를 읽을 수 없습니다.');

  const amount = parseAmount(cells.amount);
  if (amount === null) reasons.push('금액을 읽을 수 없습니다.');

  /*
   * 사다리를 태운다. 0단이 "적혀 있으면 그것"이라 **적힌 값이 언제나 이긴다** —
   * 이 호출이 사용자의 구분·분류를 뒤집는 일은 없다.
   */
  const classification = classifyLedgerRow(
    {
      kind: cells.kind,
      category: cells.category,
      subcategory: cells.subcategory,
      memo: cells.memo,
      fixity: cells.fixity
    },
    rules
  );

  const kind = classification.flow;
  if (kind === null) {
    reasons.push('구분(수입/지출)을 읽을 수 없습니다. 항목이나 내용을 적어 주시면 채워 드립니다.');
  }

  if (date === null || kind === null || amount === null) {
    return { ok: false, unreadable: { rowNumber, reasons } };
  }

  const memo = cells.memo?.trim();
  const status = cells.status?.trim();
  const subcategory = cells.subcategory?.trim();
  const method = cells.method?.trim();
  /* 공동은 값이 아니라 기본값이다 — 빈 칸도 `공동`이라 굳이 들고 다니지 않는다(§axes). */
  const payer = isSharedPayer(cells.payer) ? undefined : cells.payer?.trim();

  /*
   * 고정 여부는 두 곳에서 온다:
   *   ① 전용 `고정` 열 (v2 시트)
   *   ② **날짜 칸의 `고정지출` 토큰** — 분석한 원본 템플릿의 관습이다. 그 시트에서는 날짜 대신
   *      그 글자가 들어 있어 날짜 파싱이 실패하는데, 위에서 이미 실패로 걸러졌으므로 여기까지
   *      오지 않는다. 그래도 두 경로를 함께 보는 이유는 매핑 단계(P3)가 그 토큰을 날짜에서
   *      떼어 이 칸으로 옮겨 넣을 것이고, 그때 이 코드가 이미 서 있어야 하기 때문이다.
   */
  const writtenFixityCell = (cells.fixity ?? '').trim();
  const fixity =
    writtenFixityCell.length > 0
      ? parseFixity(writtenFixityCell)
      : (classification.fixity ?? parseFixity(isFixityToken(cells.date) ? '고정' : ''));

  /* 🔴 빈 칸이던 자리만 사다리 값으로 채운다. 적힌 말은 그대로 둔다. */
  const rawCategory = (cells.category ?? '').trim();
  const category = rawCategory.length > 0 ? rawCategory : (classification.category?.label ?? '');
  const subcategoryValue =
    subcategory && subcategory.length > 0 ? subcategory : classification.subcategory?.label;

  /*
   * **히포가 채운 칸들.** 되적기(`planBackfill`)가 정확히 이것만 쓴다.
   *
   * 🔴 `seen` 이 빈 칸이었던 것만 담는다 — 여기에 적혀 있던 칸이 섞이면 되적기가 사용자의 말을
   *    덮어쓴다. 그 실수는 되돌릴 수 없다(원본이 사라지므로).
   */
  const filled: Record<string, string> = {};
  if (isBackfillable(classification)) {
    if (rawCategory.length === 0 && classification.category) filled.category = classification.category.label;
    if ((subcategory ?? '').length === 0 && classification.subcategory) {
      filled.subcategory = classification.subcategory.label;
    }
    if ((cells.kind ?? '').trim().length === 0) filled.kind = formatKindCell(kind);
    if (writtenFixityCell.length === 0 && classification.fixity === 'fixed') {
      filled.fixity = LEDGER_FIXITY_LABEL.fixed;
    }
  }

  return {
    ok: true,
    entry: {
      rowNumber,
      date,
      kind,
      amount,
      category,
      ...(subcategoryValue && subcategoryValue.length > 0 ? { subcategory: subcategoryValue } : {}),
      ...(payer && payer.length > 0 ? { payer } : {}),
      ...(method && method.length > 0 ? { method } : {}),
      fixity,
      ...(memo && memo.length > 0 ? { memo } : {}),
      ...(status && status.length > 0 ? { status } : {}),
      /* 사다리가 관여했을 때만 붙는다 — 화면이 "히포가 이렇게 봤습니다"라고 말할 근거다. */
      ...(classification.source === 'rule' || classification.source === 'dictionary'
        ? { filledBy: classification.source }
        : {}),
      ...(Object.keys(filled).length > 0 ? { filled } : {}),
      seen: cells
    }
  };
};

export type ParsedColumns = {
  readonly rows: readonly ParsedRow[];
  /** 매핑된 열 기준 마지막 데이터 행. 데이터가 없으면 헤더 행 번호(= `firstDataRow - 1`). */
  readonly lastDataRow: number;
};

/**
 * 열 단위로 받아온 값(`values.batchGet` + `majorDimension=COLUMNS`)을 행으로 세운다.
 *
 * ⚠ 열마다 길이가 다르다 — 마지막 값 뒤의 빈 칸은 응답에서 잘려 온다. 가장 긴 열을 기준으로 맞추고,
 *   짧은 열은 빈 문자열로 채운다. 이 정렬을 틀리면 **다른 행의 값을 한 행으로 합치는** 사고가 난다.
 */
export const parseLedgerColumns = (params: {
  readonly mapping: ColumnMapping;
  /** 요청한 열 인덱스 → 그 열의 값 배열(첫 원소가 `firstDataRow`). */
  readonly columns: ReadonlyMap<number, readonly string[]>;
  readonly firstDataRow?: number;
}): ParsedColumns => {
  const firstDataRow = params.firstDataRow ?? LEDGER_FIRST_DATA_ROW;
  const lengths = Array.from(params.columns.values(), (values) => values.length);
  const height = lengths.length === 0 ? 0 : Math.max(...lengths);

  const rows: ParsedRow[] = [];
  for (let offset = 0; offset < height; offset += 1) {
    const rowNumber = firstDataRow + offset;
    const cells = pickRowCells(params.mapping, (columnIndex) => params.columns.get(columnIndex)?.[offset] ?? '');
    if (isBlankRow(cells)) continue;
    rows.push(parseLedgerRow(cells, rowNumber));
  }

  return { rows, lastDataRow: firstDataRow - 1 + height };
};

/**
 * 새로 넣을 항목이 시트에 쓸 수 있는 값인지. **문제가 된 필드 목록**을 돌려준다(빈 배열 = 통과).
 * 여기서 걸린 건은 네트워크를 쓰지 않고 그 건만 실패로 보고된다(AC-W5 의 부분 실패).
 */
const KINDS: readonly LedgerKind[] = ['income', 'expense', 'transfer'];

/** v2 의 자유 텍스트 축들 — 검사 규칙이 같아서 한 곳에서 돈다. */
const TEXT_AXES = ['subcategory', 'payer', 'method'] as const;

export const validateLedgerDraft = (draft: LedgerDraft): LedgerField[] => {
  const invalid: LedgerField[] = [];
  if (parseLedgerDate(draft.date) !== draft.date) invalid.push('date');
  if (!KINDS.includes(draft.kind)) invalid.push('kind');
  if (typeof draft.amount !== 'number' || !Number.isFinite(draft.amount)) invalid.push('amount');
  if (typeof draft.category !== 'string') invalid.push('category');
  for (const axis of TEXT_AXES) {
    if (draft[axis] !== undefined && typeof draft[axis] !== 'string') invalid.push(axis);
  }
  if (draft.fixity !== undefined && draft.fixity !== 'fixed' && draft.fixity !== 'variable') invalid.push('fixity');
  if (draft.memo !== undefined && typeof draft.memo !== 'string') invalid.push('memo');
  return invalid;
};

/** 수정 요청도 같은 규칙으로 검사한다. 넣지 않은 필드는 검사하지 않는다. */
export const validateLedgerPatch = (patch: LedgerPatch): LedgerField[] => {
  const invalid: LedgerField[] = [];
  if (patch.date !== undefined && parseLedgerDate(patch.date) !== patch.date) invalid.push('date');
  if (patch.kind !== undefined && !KINDS.includes(patch.kind)) invalid.push('kind');
  if (patch.amount !== undefined && (typeof patch.amount !== 'number' || !Number.isFinite(patch.amount))) {
    invalid.push('amount');
  }
  if (patch.category !== undefined && typeof patch.category !== 'string') invalid.push('category');
  for (const axis of TEXT_AXES) {
    if (patch[axis] !== undefined && typeof patch[axis] !== 'string') invalid.push(axis);
  }
  if (patch.fixity !== undefined && patch.fixity !== 'fixed' && patch.fixity !== 'variable') invalid.push('fixity');
  if (patch.memo !== undefined && typeof patch.memo !== 'string') invalid.push('memo');
  return invalid;
};
