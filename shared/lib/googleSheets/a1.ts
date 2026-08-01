/**
 * A1 표기 순수 함수.
 *
 * 앱이 만드는 범위는 **한 열 × 한 구간**뿐이다(AC-W2/W3). 그래서 여기엔 "여러 열을 걸치는 범위"를
 * 만드는 함수가 아예 없다 — 만들 수 없으면 실수로 쓸 수도 없다.
 */

/** 0 → `A`, 25 → `Z`, 26 → `AA`. */
export const columnLetter = (columnIndex: number): string => {
  if (!Number.isInteger(columnIndex) || columnIndex < 0) {
    throw new RangeError('열 인덱스는 0 이상의 정수여야 합니다.');
  }
  let remaining = columnIndex;
  let letters = '';
  while (remaining >= 0) {
    letters = String.fromCharCode(65 + (remaining % 26)) + letters;
    remaining = Math.floor(remaining / 26) - 1;
  }
  return letters;
};

/** `A` → 0, `AA` → 26. 알파벳이 아니면 `null`. */
export const columnIndexFromLetter = (letters: string): number | null => {
  if (!/^[A-Z]+$/.test(letters)) return null;
  let index = 0;
  for (const char of letters) index = index * 26 + (char.charCodeAt(0) - 64);
  return index - 1;
};

/**
 * 탭 제목을 A1 범위에 넣을 수 있게 감싼다.
 * 사용자가 고른 시트의 탭 이름에는 공백·따옴표·`!` 가 들어갈 수 있다 — 작은따옴표는 두 번 써서 이스케이프한다.
 */
export const quoteSheetTitle = (sheetTitle: string): string => `'${sheetTitle.replace(/'/g, "''")}'`;

/** 셀 1개. 예: `'가계부'!C5` */
export const cellRange = (sheetTitle: string, columnIndex: number, rowNumber: number): string => {
  if (!Number.isInteger(rowNumber) || rowNumber < 1) throw new RangeError('행 번호는 1 이상의 정수여야 합니다.');
  return `${quoteSheetTitle(sheetTitle)}!${columnLetter(columnIndex)}${rowNumber}`;
};

/** 한 열의 닫힌 구간. 예: `'가계부'!C5:C8` */
export const columnSpanRange = (
  sheetTitle: string,
  columnIndex: number,
  startRow: number,
  endRow: number
): string => {
  if (!Number.isInteger(startRow) || startRow < 1) throw new RangeError('행 번호는 1 이상의 정수여야 합니다.');
  if (!Number.isInteger(endRow) || endRow < startRow) throw new RangeError('끝 행은 시작 행 이상이어야 합니다.');
  const letter = columnLetter(columnIndex);
  return `${quoteSheetTitle(sheetTitle)}!${letter}${startRow}:${letter}${endRow}`;
};

/** 한 열의 열린 구간(끝까지). 예: `'가계부'!C2:C` — 조회에만 쓴다. */
export const openColumnRange = (sheetTitle: string, columnIndex: number, startRow: number): string => {
  if (!Number.isInteger(startRow) || startRow < 1) throw new RangeError('행 번호는 1 이상의 정수여야 합니다.');
  const letter = columnLetter(columnIndex);
  return `${quoteSheetTitle(sheetTitle)}!${letter}${startRow}:${letter}`;
};

/** 헤더 행 전체(열 수를 모르므로 행 단위). 매핑 후보를 만들 때 한 번만 읽는다. */
export const headerRowRange = (sheetTitle: string, headerRow: number): string =>
  `${quoteSheetTitle(sheetTitle)}!${headerRow}:${headerRow}`;

/** 이 파일이 만든 범위를 되읽는다(가드·테스트용). 한 열을 넘어가면 `null`. */
export type ParsedRange = {
  readonly sheetTitle: string;
  readonly columnIndex: number;
  readonly startRow: number;
  /** 열린 구간이면 `null`. */
  readonly endRow: number | null;
};

const RANGE_PATTERN = /^'((?:[^']|'')*)'!([A-Z]+)(\d+)(?::([A-Z]+)(\d*))?$/;

/**
 * `'제목'!C2:C8` 형태를 되읽는다. **두 열을 걸치면 `null`** — 이 성질이 곧
 * "앱은 절대 행 단위로 덮어쓰지 않는다"(AC-W3)를 기계적으로 검사할 수 있게 해 준다.
 */
export const parseSingleColumnRange = (range: string): ParsedRange | null => {
  const matched = RANGE_PATTERN.exec(range);
  if (!matched) return null;

  const [, quotedTitle, startLetter, startRowText, endLetter, endRowText] = matched;
  if (endLetter !== undefined && endLetter !== startLetter) return null;

  const columnIndex = columnIndexFromLetter(startLetter);
  if (columnIndex === null) return null;

  const startRow = Number(startRowText);
  const endRow = endLetter === undefined ? startRow : endRowText ? Number(endRowText) : null;
  if (endRow !== null && endRow < startRow) return null;

  return { sheetTitle: quotedTitle.replace(/''/g, "'"), columnIndex, startRow, endRow };
};
