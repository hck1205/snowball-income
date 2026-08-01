/**
 * 도메인 값 → 시트 셀 문자열. 순수 함수.
 *
 * 쓰기는 `valueInputOption: USER_ENTERED` 로 보낸다 — 사용자가 직접 타이핑한 것과 같게 해석되어
 * 날짜는 날짜로, 금액은 숫자로 들어간다(사용자 시트의 SUM·피벗이 계속 동작한다).
 *
 * 🔴 그 대가로 **자유 입력(분류·메모)이 수식으로 해석될 수 있다**. `=`·`+`·`-`·`@` 로 시작하는 글자는
 *    앞에 작은따옴표를 붙여 "글자 그대로"로 고정한다(시트에서 그 따옴표는 보이지 않고, 다시 읽으면
 *    원래 문자열이 돌아온다). 남의 가계부에 수식을 심지 않기 위한 최소 방어다.
 */
import type { LedgerDraft, LedgerField, LedgerKind, LedgerPatch, RowCells } from './types';

/** 수식으로 해석될 수 있는 첫 글자. */
const FORMULA_LEAD = /^[=+\-@]/;

/** 자유 입력 텍스트를 글자 그대로 고정한다. */
export const escapeFormulaText = (value: string): string => (FORMULA_LEAD.test(value) ? `'${value}` : value);

/** 날짜는 ISO 로만 쓴다 — 사용자 로케일과 무관하게 시트가 날짜로 인식한다. */
export const formatDateCell = (isoDate: string): string => isoDate;

/** 구분은 사람이 읽는 한국어로 쓴다(시트를 열어 보는 사람이 첫 독자다). */
export const formatKindCell = (kind: LedgerKind): string => (kind === 'income' ? '수입' : '지출');

/**
 * 금액은 **부호 있는 순수 숫자 문자열**로 쓴다. 통화 기호·천단위 구분은 넣지 않는다 —
 * 표시 서식은 사용자 시트의 권한이고, 앱이 서식을 바꾸지 않는다(AC-W2).
 */
export const formatAmountCell = (amount: number): string => {
  if (!Number.isFinite(amount)) throw new RangeError('금액은 유한한 숫자여야 합니다.');
  return String(amount);
};

/** 분류·메모 등 자유 입력. */
export const formatTextCell = (text: string): string => escapeFormulaText(text.trim());

/** 새 항목 1건을 매핑된 필드의 셀 문자열로 만든다. `status` 는 앱이 만든 시트에서 빈 칸으로 시작한다. */
export const draftToCells = (draft: LedgerDraft, options?: { readonly withStatus?: boolean }): RowCells => {
  const cells: Partial<Record<LedgerField, string>> = {
    date: formatDateCell(draft.date),
    kind: formatKindCell(draft.kind),
    amount: formatAmountCell(draft.amount),
    category: formatTextCell(draft.category),
    memo: formatTextCell(draft.memo ?? '')
  };
  if (options?.withStatus) cells.status = '';
  return cells;
};

/** 수정 요청을 **넣은 필드만** 셀 문자열로 만든다(행 단위 덮어쓰기 금지, AC-W3). */
export const patchToCells = (patch: LedgerPatch): RowCells => {
  const cells: Partial<Record<LedgerField, string>> = {};
  if (patch.date !== undefined) cells.date = formatDateCell(patch.date);
  if (patch.kind !== undefined) cells.kind = formatKindCell(patch.kind);
  if (patch.amount !== undefined) cells.amount = formatAmountCell(patch.amount);
  if (patch.category !== undefined) cells.category = formatTextCell(patch.category);
  if (patch.memo !== undefined) cells.memo = formatTextCell(patch.memo);
  return cells;
};
