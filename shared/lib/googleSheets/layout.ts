/**
 * 시트 **레이아웃 감지** — 남의 가계부가 어떤 모양인지 알아본다. 전부 순수 함수.
 *
 * 왜 필요한가
 * ---------------------------------------------------------------------------
 * 지금까지 앱은 "1행 = 1건, 열은 고정"인 시트만 읽었다. 그런데 널리 쓰이는 구글 시트 가계부
 * 템플릿은 **한 달치 블록을 가로로 이어 붙인다** — 6열이 한 달이고, 그 블록이 15번 반복된다
 * (2026-01 ~ 2027-03). 그 시트를 지금 파서에 물리면 첫 달만 읽고 나머지 14달은 없는 것이 된다.
 *
 * 즉 이 파일이 없으면 **헤비 유저의 시트는 연동 자체가 성립하지 않는다.** 실측 근거와 표 전문은
 * docs/ledger-v2-design.md §1.1 / §4.1.
 *
 * 무엇을 하지 않는가
 * ---------------------------------------------------------------------------
 * 🔴 **값을 해석하지 않는다.** 여기가 답하는 것은 "이 시트는 어떤 모양인가" 하나뿐이고,
 *    셀을 도메인 값으로 바꾸는 일은 `parse.ts` 가 그대로 한다. 모양과 뜻을 한 파일에서 다루면
 *    새 레이아웃이 생길 때마다 파서 전체를 다시 건드리게 된다.
 * 🔴 **추측으로 단정하지 않는다.** 확신이 서지 않으면 `flat` 으로 떨어진다 — 잘못 감지해
 *    엉뚱한 열을 읽는 것보다, 못 알아보고 사용자에게 열 매핑을 묻는 쪽이 낫다.
 */
import { normalizeSheetHeader } from './mapping';
import type { ColumnMapping } from './types';

/** 시트가 가진 모양. */
export type LedgerLayoutKind = 'flat' | 'monthBlock';

/**
 * 가로 월별 블록 레이아웃의 치수.
 *
 * 예(실측 템플릿): `firstColumn=1, blockWidth=6, blockCount=15`
 *   → 각 달의 블록은 B~G, H~M, N~S … 로 이어진다.
 */
export type MonthBlockLayout = {
  readonly kind: 'monthBlock';
  /** 첫 블록이 시작하는 0-based 열. */
  readonly firstColumn: number;
  /** 한 블록의 열 수. */
  readonly blockWidth: number;
  readonly blockCount: number;
  /** 블록 안에서의 **상대** 열 매핑(0 = 블록의 첫 열). */
  readonly innerMapping: ColumnMapping;
  /** 데이터가 시작하는 1-based 행(헤더 행 다음). */
  readonly firstDataRow: number;
};

export type FlatLayout = { readonly kind: 'flat' };

export type LedgerLayout = FlatLayout | MonthBlockLayout;

export const FLAT_LAYOUT: FlatLayout = { kind: 'flat' };

/**
 * 비교용 정규화. 🔴 **열 매핑(`mapping.ts`)과 같은 함수를 쓴다** — 규칙이 갈리면 같은 시트를
 * 한쪽은 알아보고 한쪽은 못 알아본다(2026-08-08 P3 에서 실제로 그런 상태였다).
 */
const normalizeHeader = normalizeSheetHeader;

/**
 * 블록 헤더로 인정하는 낱말. **필수 셋**(항목·금액·날짜 계열)이 한 줄에 모여 있어야 블록이다.
 *
 * ⚠ 실측 템플릿의 헤더 줄은 `항목(복사금지) · 상세항목(복사금지) · 지출금액(원) · 상세내용` 이고
 *   날짜 칸은 라벨이 `날짜` 다. 괄호를 지우는 정규화가 이걸 받아낸다.
 */
const FIELD_WORDS: Readonly<Record<keyof ColumnMapping, readonly string[]>> = {
  date: ['날짜', '일자', '거래일'],
  kind: ['구분', '유형', '수입지출'],
  amount: ['지출금액', '금액', '수입금액', '거래금액'],
  category: ['항목', '분류', '카테고리'],
  subcategory: ['상세항목', '소분류', '세부항목'],
  payer: ['주체', '지출자', '결제자'],
  method: ['결제수단', '결제방법', '수단'],
  fixity: ['고정', '고정여부'],
  memo: ['상세내용', '내용', '메모', '비고'],
  status: ['상태']
};

const matchField = (header: string): (keyof ColumnMapping) | null => {
  const normalized = normalizeHeader(header);
  if (normalized.length === 0) return null;
  /*
   * 🔴 긴 이름을 **먼저** 본다. `상세항목` 이 `항목` 에, `지출금액` 이 `금액` 에 잡아먹히면
   *    두 열이 한 필드로 뭉쳐 데이터가 통째로 어긋난다.
   */
  const entries = Object.entries(FIELD_WORDS) as [keyof ColumnMapping, readonly string[]][];
  let best: { field: keyof ColumnMapping; length: number } | null = null;
  for (const [field, words] of entries) {
    for (const word of words) {
      if (normalized !== word) continue;
      if (best === null || word.length > best.length) best = { field, length: word.length };
    }
  }
  return best?.field ?? null;
};

/** 한 줄에서 필드가 잡힌 위치들. */
const readFieldRow = (row: readonly string[]): Map<keyof ColumnMapping, number> => {
  const found = new Map<keyof ColumnMapping, number>();
  row.forEach((cell, index) => {
    const field = matchField(cell ?? '');
    if (field !== null && !found.has(field)) found.set(field, index);
  });
  return found;
};

/** 블록 하나로 인정하기 위한 최소 조건 — 항목과 금액이 있어야 가계부 줄이다. */
const isUsableBlock = (fields: Map<keyof ColumnMapping, number>): boolean =>
  fields.has('category') && fields.has('amount');

/**
 * 헤더 줄에서 **반복 주기**를 찾는다. 같은 필드가 일정 간격으로 다시 나타나면 그 간격이 블록 폭이다.
 *
 * 🔴 간격이 일정하지 않으면 `null` 을 준다 — "대충 6쯤" 으로 밀어붙이면 마지막 블록에서 한 열씩
 *    밀려 남의 열을 금액으로 읽는다.
 */
const detectStride = (positions: readonly number[]): number | null => {
  if (positions.length < 2) return null;
  const stride = positions[1] - positions[0];
  if (stride <= 0) return null;
  for (let i = 1; i < positions.length; i += 1) {
    if (positions[i] - positions[i - 1] !== stride) return null;
  }
  return stride;
};

/**
 * 헤더 줄 하나를 보고 레이아웃을 판정한다.
 *
 * @param headerRow 헤더가 있는 줄의 셀 값(0-based 열 순서).
 * @param headerRowNumber 그 줄의 1-based 행 번호. 데이터는 그 **다음 줄**부터다.
 *
 * 판정 규칙:
 *   1. `항목`(category)이 **두 번 이상** 같은 간격으로 나타나면 가로 월별 블록이다.
 *   2. 각 블록 안에서 필드 위치를 다시 읽어 **상대 매핑**을 만든다.
 *   3. 하나라도 조건이 어긋나면 `flat`.
 */
export const detectLedgerLayout = (
  headerRow: readonly string[],
  headerRowNumber: number
): LedgerLayout => {
  const categoryPositions: number[] = [];
  headerRow.forEach((cell, index) => {
    if (matchField(cell ?? '') === 'category') categoryPositions.push(index);
  });

  if (categoryPositions.length < 2) return FLAT_LAYOUT;

  const stride = detectStride(categoryPositions);
  if (stride === null) return FLAT_LAYOUT;

  const firstColumn = categoryPositions[0];
  const blockCount = categoryPositions.length;

  /*
   * 블록 폭은 주기와 같다. 첫 블록의 구간을 잘라 필드 위치를 읽고, 그 **상대** 위치를 매핑으로 쓴다.
   * ⚠ 블록의 시작은 `항목` 이 아니라 그 왼쪽의 `날짜` 일 수 있다(실측 템플릿이 그렇다).
   *   그래서 첫 블록 구간을 주기만큼 **왼쪽으로도** 넓혀 본다.
   */
  const blockStart = Math.max(0, firstColumn - (stride - 1));
  const slice = headerRow.slice(blockStart, blockStart + stride);
  const fields = readFieldRow(slice);
  if (!isUsableBlock(fields)) return FLAT_LAYOUT;

  const innerMapping = toInnerMapping(fields);
  if (innerMapping === null) return FLAT_LAYOUT;

  return {
    kind: 'monthBlock',
    firstColumn: blockStart,
    blockWidth: stride,
    blockCount,
    innerMapping,
    firstDataRow: headerRowNumber + 1
  };
};

/**
 * 필드 위치 → `ColumnMapping`. 필수 넷 중 없는 것은 **추측하지 않는다**.
 *
 * 🔴 `kind`(수입/지출) 가 없는 시트가 흔하다 — 분석한 템플릿에는 지출 전용이라 그 열이 아예 없다.
 *    그 경우 여기서 `null` 을 주고 호출부가 "이 시트는 전부 지출로 읽겠다"를 **사용자에게 묻는다**.
 *    임의로 지출로 단정하면 수입이 섞인 시트에서 숫자가 조용히 틀어진다.
 */
const toInnerMapping = (fields: Map<keyof ColumnMapping, number>): ColumnMapping | null => {
  const date = fields.get('date');
  const amount = fields.get('amount');
  const category = fields.get('category');
  const kind = fields.get('kind');
  if (date === undefined || amount === undefined || category === undefined) return null;

  const optional = (field: keyof ColumnMapping) => {
    const index = fields.get(field);
    return index === undefined ? {} : { [field]: index };
  };

  return {
    date,
    /* kind 열이 없으면 date 자리를 빌려 둔다 — 값 해석은 호출부가 `assumeKind` 로 덮는다. */
    kind: kind ?? date,
    amount,
    category,
    ...optional('subcategory'),
    ...optional('payer'),
    ...optional('method'),
    ...optional('fixity'),
    ...optional('memo'),
    ...optional('status')
  } as ColumnMapping;
};

/** 이 시트에 `구분` 열이 없어 "전부 지출"로 읽어야 하는가. */
export const needsKindAssumption = (layout: LedgerLayout, headerRow: readonly string[]): boolean => {
  if (layout.kind !== 'monthBlock') return false;
  const slice = headerRow.slice(layout.firstColumn, layout.firstColumn + layout.blockWidth);
  return !readFieldRow(slice).has('kind');
};

/**
 * 블록 n 의 **절대** 열 매핑. 상대 매핑에 블록 시작 열을 더한다.
 *
 * 이 함수가 있어서 나머지 파서를 재사용할 수 있다 — 블록마다 절대 매핑을 만들어 기존 `flat` 경로에
 * 그대로 태우면 되고, 월별 블록을 아는 코드는 이 파일 하나로 끝난다.
 */
export const blockMapping = (layout: MonthBlockLayout, blockIndex: number): ColumnMapping => {
  const offset = layout.firstColumn + layout.blockWidth * blockIndex;
  const shift = (index: number | undefined) => (index === undefined ? undefined : index + offset);
  const inner = layout.innerMapping;

  const optional = (field: 'subcategory' | 'payer' | 'method' | 'fixity' | 'memo' | 'status') => {
    const moved = shift(inner[field]);
    return moved === undefined ? {} : { [field]: moved };
  };

  return {
    date: inner.date + offset,
    kind: inner.kind + offset,
    amount: inner.amount + offset,
    category: inner.category + offset,
    ...optional('subcategory'),
    ...optional('payer'),
    ...optional('method'),
    ...optional('fixity'),
    ...optional('memo'),
    ...optional('status')
  } as ColumnMapping;
};

/** 블록 전부의 절대 매핑. 조회는 이 목록을 순회해 각 블록을 읽고 결과를 이어 붙인다. */
export const allBlockMappings = (layout: MonthBlockLayout): ColumnMapping[] =>
  Array.from({ length: layout.blockCount }, (_, index) => blockMapping(layout, index));
