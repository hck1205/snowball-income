/**
 * 앱이 만드는 스프레드시트의 **설계도** — 탭 구성 · 서식 · 수식 · 드롭다운. 전부 순수 함수.
 *
 * ## 왜 이 파일이 있나
 *
 * 종전에는 탭 하나에 헤더 글자만 쓰고 끝냈다. 사용자가 시트를 직접 열면 민짜 표 한 장이었다.
 * 그런데 가계부는 **앱에서만 보는 것이 아니다** — 널리 쓰이는 시트 템플릿들이 그렇듯, 사람들은
 * 시트를 열어 놓고 직접 채우고 눈으로 훑는다. 그 사용을 앱이 지워 버릴 이유가 없다.
 *
 * ## 관심사별 탭
 *
 * | 탭 | 무엇 | 앱이 읽나 |
 * |---|---|---|
 * | `가계부`     | 입력 본체 | ✅ 읽고 쓴다 |
 * | `분류`       | 항목·상세항목 사전(드롭다운 원본) | ❌ |
 * | `설정`       | 주체·결제수단 목록(드롭다운 원본) | ❌ |
 * | `월별 요약`  | 항목 × 월 피벗(수식) | ❌ |
 * | `현금흐름`   | 수입·지출·이체·저축률(수식) | ❌ |
 * | `고정비`     | 고정으로 표시한 것만 모아 보기(수식) | ❌ |
 * | `읽어보기`   | 사용법 | ❌ |
 *
 * 🔴 **`가계부` 가 반드시 첫 탭이다.** 연결 코드가 `tabs[0]` 을 집는다. 순서를 바꾸면 앱이 엉뚱한
 *    탭을 본다.
 * 🔴 **앱이 읽는 것은 `가계부` 하나뿐이다.** 나머지는 사람이 보는 면이고, 전부 수식이라 앱이
 *    다시 계산할 필요도 없다. 수식 탭에 앱이 쓰기를 시도하면 사용자의 수식을 덮어쓴다.
 *
 * ## 🔴 수식 규율
 *
 * - **열 전체 참조**(`가계부!$E:$E`)를 쓴다. 범위를 고정하면 사용자가 행을 늘렸을 때 조용히 빠진다.
 * - **삭제된 행을 뺀다**(`상태` 열이 빈 칸인 것만). 앱의 소프트 삭제가 요약에 남으면 숫자가 틀린다.
 * - **이체는 지출이 아니다.** 앱의 규율(`ledgerAnalysis.ts`)과 같은 정의를 수식으로도 지킨다.
 * - **수입이 0 인 달의 저축률은 0% 가 아니라 빈 칸**이다. "수입이 없어서"와 "다 써서"는 다른 사실이다.
 *
 * ⚠ 이 파일은 **네트워크를 모른다.** 요청 객체를 만들 뿐이고 보내는 것은 `sheetsApi.ts` 다.
 *   그래서 payload 를 테스트로 잠글 수 있다(실제 시트 없이).
 */
import { APP_SHEET_HEADERS, APP_SHEET_TAB_TITLE } from './schema';
import { LEDGER_CATEGORIES, LEDGER_METHOD_LABEL, LEDGER_PAYER_SHARED } from '@/shared/constants/ledger';

/* ── 탭 이름 ─────────────────────────────────────────────────────────────────── */

export const BLUEPRINT_TABS = {
  ledger: APP_SHEET_TAB_TITLE,
  categories: '분류',
  settings: '설정',
  monthly: '월별 요약',
  cashFlow: '현금흐름',
  fixed: '고정비',
  readme: '읽어보기'
} as const;

/** 탭 순서 = 화면 순서. 🔴 `가계부` 가 첫째여야 한다(연결이 `tabs[0]` 을 집는다). */
export const BLUEPRINT_TAB_ORDER: readonly string[] = [
  BLUEPRINT_TABS.ledger,
  BLUEPRINT_TABS.monthly,
  BLUEPRINT_TABS.cashFlow,
  BLUEPRINT_TABS.fixed,
  BLUEPRINT_TABS.categories,
  BLUEPRINT_TABS.settings,
  BLUEPRINT_TABS.readme
];

/* ── 가계부 탭의 열 ──────────────────────────────────────────────────────────── */

/** A=날짜 B=구분 C=항목 D=상세항목 E=금액 F=주체 G=결제수단 H=고정 I=내용 J=상태 */
const COL = { date: 0, kind: 1, category: 2, subcategory: 3, amount: 4, payer: 5, method: 6, fixity: 7, memo: 8, status: 9 } as const;

/** 열 너비(px). 🔴 내용이 실제로 들어가는 폭에 맞춘다 — 전부 같은 폭이면 날짜가 남고 내용이 잘린다. */
const LEDGER_COLUMN_WIDTHS: readonly number[] = [110, 80, 120, 130, 120, 90, 130, 70, 260, 80];

/** 구분 드롭다운 값. 🔴 `parseLedgerKind` 가 알아보는 낱말이어야 한다. */
export const KIND_CHOICES: readonly string[] = ['수입', '지출', '이체'];

/** 고정 드롭다운 값. 빈 칸이 변동이므로 선택지는 하나뿐이다. */
export const FIXITY_CHOICES: readonly string[] = ['고정'];

/* ── 시트 만들기 요청 ────────────────────────────────────────────────────────── */

type GridProperties = {
  readonly rowCount: number;
  readonly columnCount: number;
  readonly frozenRowCount?: number;
  readonly frozenColumnCount?: number;
};

type SheetSpec = {
  readonly title: string;
  readonly grid: GridProperties;
  readonly hidden?: boolean;
  /** 1행부터 넣을 값(행 단위). 수식도 문자열로 넣는다(`USER_ENTERED` 로 보낸다). */
  readonly rows: readonly (readonly string[])[];
};

/** 분류 탭의 행 — 항목 하나에 상세항목 하나씩 펴서 적는다(원본 템플릿의 `dropdown` 과 같은 모양). */
const categoryRows = (): string[][] => {
  const rows: string[][] = [['항목', '상세항목']];
  for (const category of LEDGER_CATEGORIES) {
    for (const sub of category.subcategories) rows.push([category.label, sub.label]);
  }
  return rows;
};

const settingsRows = (): string[][] => [
  ['주체', '결제수단'],
  /* 🔴 공동은 **빈 칸**으로 저장되지만, 사람이 고를 수 있게 선택지로는 둔다(그 뜻을 아래 안내가 말한다). */
  [LEDGER_PAYER_SHARED, LEDGER_METHOD_LABEL.credit],
  ['', LEDGER_METHOD_LABEL.debit],
  ['', LEDGER_METHOD_LABEL.cash],
  ['', LEDGER_METHOD_LABEL.transfer]
];

/** `가계부` 탭을 가리키는 절대 참조 조각. 탭 이름에 공백이 없어 따옴표가 없어도 되지만 안전하게 감싼다. */
const L = `'${BLUEPRINT_TABS.ledger}'`;

/**
 * 첫 달 = 가계부의 가장 이른 날짜가 속한 달. 기록이 없으면 이번 달.
 *
 * 🔴 `IFERROR(MIN(...))` 로는 못 잡는다 — 빈 범위의 MIN 은 **오류가 아니라 0** 을 돌려주고,
 *    그 0 이 1899년으로 읽혀 표 전체가 엉뚱한 해로 채워진다. 개수를 먼저 세야 한다.
 */
const FIRST_MONTH_FORMULA = `=IF(COUNT(${L}!$A:$A)=0,EOMONTH(TODAY(),-1)+1,EOMONTH(MIN(${L}!$A:$A),-1)+1)`;

/** 상태 열이 빈 칸(=삭제되지 않음)인 행만 센다. 이 조건을 빠뜨리면 지운 기록이 요약에 남는다. */
const ALIVE = `${L}!$J:$J,""`;

/** 월 구간 조건. `$A2` 가 그 달의 1일이다. */
const inMonth = (monthCell: string) =>
  `${L}!$A:$A,">="&${monthCell},${L}!$A:$A,"<"&EDATE(${monthCell},1)`;

const monthlyRows = (): string[][] => {
  const rows: string[][] = [];
  rows.push(['월별 요약', '', '', '', '', '', '', '']);
  rows.push([
    '이 표는 자동으로 계산됩니다. 값을 직접 고치지 마세요 — 가계부 탭을 채우면 여기가 따라옵니다.'
  ]);
  rows.push([]);
  /* 3행: 월 머리. 첫 칸은 항목 이름 열. */
  const monthHeader = ['항목'];
  for (let i = 0; i < 12; i += 1) {
    /* 🔴 첫 달은 가계부의 가장 이른 날짜가 속한 달. 비어 있으면 이번 달. */
    monthHeader.push(
      i === 0
        ? FIRST_MONTH_FORMULA
        : `=EDATE($${String.fromCharCode(66 + i - 1)}4,1)`
    );
  }
  rows.push(monthHeader);

  /*
   * 🔴 **지출 항목만** 세운다. 수입·저축·투자 항목을 함께 두면 "지출" 조건에 걸리는 것이 없어
   *    한 해 내내 0 인 줄이 생긴다 — 그건 정보가 아니라 사용자가 "왜 0 이지?"를 묻게 만드는 소음이다.
   *    수입과 이체는 아래 `현금흐름` 탭이 따로 말한다.
   */
  const expenseCategories = LEDGER_CATEGORIES.filter((category) => category.flow === 'expense');
  const FIRST_DATA_ROW = 5;

  expenseCategories.forEach((category, index) => {
    const rowNumber = FIRST_DATA_ROW + index;
    const row = [category.label];
    for (let i = 0; i < 12; i += 1) {
      const col = String.fromCharCode(66 + i);
      row.push(
        `=SUMIFS(${L}!$E:$E,${L}!$C:$C,$A${rowNumber},${L}!$B:$B,"지출",${inMonth(`${col}$4`)},${ALIVE})`
      );
    }
    rows.push(row);
  });

  const lastDataRow = FIRST_DATA_ROW + expenseCategories.length - 1;
  const totalRow = ['합계'];
  for (let i = 0; i < 12; i += 1) {
    const col = String.fromCharCode(66 + i);
    totalRow.push(`=SUM(${col}${FIRST_DATA_ROW}:${col}${lastDataRow})`);
  }
  rows.push(totalRow);
  return rows;
};

const cashFlowRows = (): string[][] => {
  const rows: string[][] = [];
  rows.push(['현금흐름']);
  rows.push(['이체(저축·투자)는 지출에 넣지 않습니다. 내 통장으로 옮긴 돈은 쓴 것이 아니기 때문입니다.']);
  rows.push([]);
  rows.push(['월', '수입', '지출', '이체', '남은 돈', '저축률']);

  for (let i = 0; i < 12; i += 1) {
    const row = 5 + i;
    const monthCell = `$A${row}`;
    rows.push([
      i === 0
        ? FIRST_MONTH_FORMULA
        : `=EDATE($A${row - 1},1)`,
      `=SUMIFS(${L}!$E:$E,${L}!$B:$B,"수입",${inMonth(monthCell)},${ALIVE})`,
      `=SUMIFS(${L}!$E:$E,${L}!$B:$B,"지출",${inMonth(monthCell)},${ALIVE})`,
      `=SUMIFS(${L}!$E:$E,${L}!$B:$B,"이체",${inMonth(monthCell)},${ALIVE})`,
      `=B${row}-C${row}`,
      /* 🔴 수입이 0 인 달은 빈 칸이다 — 0% 로 적으면 "다 써서 0%"와 구분이 사라진다. */
      `=IF(B${row}=0,"",(B${row}-C${row})/B${row})`
    ]);
  }
  return rows;
};

const fixedRows = (): string[][] => [
  ['고정비'],
  ['가계부 탭에서 “고정”으로 표시한 기록만 모읍니다. 매달 같은 자리에서 나가는 돈을 한눈에 보기 위한 면입니다.'],
  [],
  /* 🔴 아래 FILTER 가 A~I 를 통째로 가져오므로 머리도 그 순서 그대로다(가계부 탭과 같은 열 순서). */
  ['날짜', '구분', '항목', '상세항목', '금액', '주체', '결제수단', '고정', '내용'],
  [
    /*
     * 🔴 배열 리터럴(`{A2:A, C2:C}`)을 쓰지 않는다. 중괄호 안의 구분자는 **스프레드시트 로케일에
     *    따라 달라져**(`,` 또는 `\`) 한국어 로케일에서 조용히 깨질 수 있다. 연속 범위 하나를
     *    통째로 가져오면 그 위험이 없다 — 열이 두 개 늘지만 정확한 쪽을 고른다.
     * 🔴 FILTER 는 맞는 행이 없으면 오류를 낸다 — 빈 가계부에서 붉은 칸이 뜨지 않게 감싼다.
     */
    `=IFERROR(FILTER(${L}!A2:I,${L}!H2:H="고정",${L}!J2:J="",${L}!A2:A<>""),"아직 고정으로 표시한 기록이 없습니다.")`
  ]
];

const readmeRows = (): string[][] => [
  ['이 시트를 쓰는 법'],
  [],
  ['1. 기록은 “가계부” 탭에만 적습니다.'],
  ['   나머지 탭은 자동으로 계산되거나 선택지를 담아 두는 곳입니다. 직접 고치지 않아도 됩니다.'],
  [],
  ['2. 항목·상세항목·구분은 칸을 누르면 목록이 나옵니다.'],
  ['   목록에 없는 말을 써도 저장은 됩니다. 다만 요약에서 따로 잡히니 “분류” 탭에 추가해 두시면 좋습니다.'],
  [],
  ['3. “주체”는 여럿이 함께 쓸 때만 채웁니다.'],
  ['   비워 두면 공동 지출로 셉니다. 혼자 쓰신다면 이 칸은 계속 비워 두셔도 됩니다.'],
  [],
  ['4. “고정”은 매달 같은 자리에서 나가는 돈에만 표시합니다.'],
  ['   월세·통신비·보험료가 그렇습니다. “고정비” 탭이 그 기록만 모아 보여 줍니다.'],
  [],
  ['5. 저축·투자로 옮긴 돈은 구분을 “이체”로 둡니다.'],
  ['   쓴 것이 아니라 옮긴 것이라, 지출 합계와 저축률에서 빠집니다.'],
  [],
  ['6. “상태” 열은 앱이 씁니다.'],
  ['   앱에서 기록을 지우면 여기에 “삭제됨”이 적히고 요약에서 빠집니다. 직접 고치지 마세요.']
];

const sheetSpecs = (): SheetSpec[] => [
  {
    title: BLUEPRINT_TABS.ledger,
    /* 🔴 넉넉히 잡는다. 행이 모자라면 사용자가 직접 늘려야 하고, 수식의 열 전체 참조도 그만큼만 본다. */
    grid: { rowCount: 2000, columnCount: APP_SHEET_HEADERS.length, frozenRowCount: 1 },
    rows: [[...APP_SHEET_HEADERS]]
  },
  { title: BLUEPRINT_TABS.monthly, grid: { rowCount: 60, columnCount: 14, frozenRowCount: 4, frozenColumnCount: 1 }, rows: monthlyRows() },
  { title: BLUEPRINT_TABS.cashFlow, grid: { rowCount: 40, columnCount: 8, frozenRowCount: 4 }, rows: cashFlowRows() },
  { title: BLUEPRINT_TABS.fixed, grid: { rowCount: 200, columnCount: 10, frozenRowCount: 4 }, rows: fixedRows() },
  { title: BLUEPRINT_TABS.categories, grid: { rowCount: 200, columnCount: 2, frozenRowCount: 1 }, rows: categoryRows() },
  { title: BLUEPRINT_TABS.settings, grid: { rowCount: 100, columnCount: 2, frozenRowCount: 1 }, rows: settingsRows() },
  { title: BLUEPRINT_TABS.readme, grid: { rowCount: 40, columnCount: 2 }, rows: readmeRows() }
];

/**
 * 셀 하나의 값. 🔴 **수식은 `formulaValue` 로 보내야 한다.**
 *
 * `stringValue` 로 보내면 구글이 그것을 **글자 그대로** 저장한다 — 요약 탭에 `=SUMIFS(...)` 가
 * 계산되지 않고 텍스트로 보인다. `spreadsheets.create` 에는 `valueInputOption` 이 없어서
 * (그건 `values.update` 쪽 옵션이다) 값의 종류를 여기서 직접 갈라 줘야 한다.
 */
const toCellValue = (cell: string): Record<string, string> =>
  cell.startsWith('=') ? { formulaValue: cell } : { stringValue: cell };

/**
 * 각 탭의 격자 열 수가 **실제로 쓰는 열 수 이상**인지 확인한다.
 *
 * 🔴 이 가드가 없어서 실제로 시트 생성이 400 으로 죽었다 —
 *    `Attempting to write column: 8, beyond the last requested column of: 7`.
 *    고정비 탭의 머리를 7열에서 9열로 늘리면서 `columnCount` 를 안 고쳤기 때문이다.
 *    격자와 내용은 **함께** 바뀌어야 하는데 코드상 그 둘이 떨어져 있어 어긋날 수 있다.
 */
export const findGridOverflow = (): { title: string; columnCount: number; used: number }[] =>
  sheetSpecs()
    .map((spec) => ({
      title: spec.title,
      columnCount: spec.grid.columnCount,
      used: spec.rows.reduce((max, row) => Math.max(max, row.length), 0)
    }))
    .filter((spec) => spec.used > spec.columnCount);

/**
 * `spreadsheets.create` 본문. 탭·격자·고정행·초기값을 **한 번의 요청**으로 만든다.
 *
 * ⚠ 서식·드롭다운·줄무늬는 여기서 못 한다(생성 응답으로 sheetId 를 받아야 지정할 수 있다).
 *   그건 `buildFormatRequests` 가 만드는 두 번째 요청이 맡는다.
 */
export const buildCreateSpreadsheetBody = (title: string): Record<string, unknown> => ({
  properties: {
    title,
    /* 날짜·통화가 한국 표기로 나오게 한다. 이걸 안 잡으면 `2026-08-03` 이 미국식으로 읽힌다. */
    locale: 'ko_KR',
    timeZone: 'Asia/Seoul'
  },
  sheets: sheetSpecs().map((spec) => ({
    properties: {
      title: spec.title,
      gridProperties: spec.grid,
      ...(spec.hidden ? { hidden: true } : {})
    },
    data: [
      {
        startRow: 0,
        startColumn: 0,
        rowData: spec.rows.map((row) => ({
          values: row.map((cell) => ({ userEnteredValue: toCellValue(cell) }))
        }))
      }
    ]
  }))
});

/* ── 서식 요청 ───────────────────────────────────────────────────────────────── */

/** 탭 제목 → sheetId. 생성 응답에서 만든다. */
export type SheetIdByTitle = Readonly<Record<string, number>>;

const headerFormat = (sheetId: number, columnCount: number) => ({
  repeatCell: {
    range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: columnCount },
    cell: {
      userEnteredFormat: {
        backgroundColor: { red: 0.94, green: 0.95, blue: 0.97 },
        textFormat: { bold: true },
        verticalAlignment: 'MIDDLE'
      }
    },
    fields: 'userEnteredFormat(backgroundColor,textFormat,verticalAlignment)'
  }
});

const columnWidth = (sheetId: number, index: number, pixelSize: number) => ({
  updateDimensionProperties: {
    range: { sheetId, dimension: 'COLUMNS', startIndex: index, endIndex: index + 1 },
    properties: { pixelSize },
    fields: 'pixelSize'
  }
});

const numberFormat = (sheetId: number, columnIndex: number, type: string, pattern: string) => ({
  repeatCell: {
    range: { sheetId, startRowIndex: 1, startColumnIndex: columnIndex, endColumnIndex: columnIndex + 1 },
    cell: { userEnteredFormat: { numberFormat: { type, pattern } } },
    fields: 'userEnteredFormat.numberFormat'
  }
});

/**
 * 드롭다운. 🔴 **`strict: false`** 다 — 목록에 없는 값도 저장되고 표시만 남는다.
 *
 * 엄격 모드로 걸면 앱이 사전에 없는 값을 쓸 때 **거부**되어 저장이 실패한다. 사용자 시트의 어휘는
 * 사용자 것이고, 앱이 그걸 강제할 자리가 아니다. 목록은 제안이지 규칙이 아니다.
 */
const dropdownFromRange = (
  sheetId: number,
  columnIndex: number,
  sourceTitle: string,
  sourceColumnIndex: number
) => {
  const letter = String.fromCharCode(65 + sourceColumnIndex);
  return {
    setDataValidation: {
      range: { sheetId, startRowIndex: 1, startColumnIndex: columnIndex, endColumnIndex: columnIndex + 1 },
      rule: {
        condition: {
          type: 'ONE_OF_RANGE',
          values: [{ userEnteredValue: `='${sourceTitle}'!$${letter}$2:$${letter}` }]
        },
        showCustomUi: true,
        strict: false
      }
    }
  };
};

const dropdownFromValues = (sheetId: number, columnIndex: number, choices: readonly string[]) => ({
  setDataValidation: {
    range: { sheetId, startRowIndex: 1, startColumnIndex: columnIndex, endColumnIndex: columnIndex + 1 },
    rule: {
      condition: { type: 'ONE_OF_LIST', values: choices.map((value) => ({ userEnteredValue: value })) },
      showCustomUi: true,
      strict: false
    }
  }
});

/**
 * 생성 뒤에 보낼 서식 요청 묶음.
 *
 * 순서가 뜻을 갖지는 않지만(각 요청이 독립적이다), 읽기 좋게 탭 순서대로 모았다.
 */
export const buildFormatRequests = (sheetIds: SheetIdByTitle): Record<string, unknown>[] => {
  const ledger = sheetIds[BLUEPRINT_TABS.ledger];
  const categories = sheetIds[BLUEPRINT_TABS.categories];
  const settings = sheetIds[BLUEPRINT_TABS.settings];
  const requests: Record<string, unknown>[] = [];

  if (ledger === undefined) return requests;

  requests.push(headerFormat(ledger, APP_SHEET_HEADERS.length));
  LEDGER_COLUMN_WIDTHS.forEach((width, index) => requests.push(columnWidth(ledger, index, width)));
  requests.push(numberFormat(ledger, COL.date, 'DATE', 'yyyy-mm-dd'));
  /* 🔴 통화 기호를 붙이되 **소수점은 두지 않는다** — 원 단위 가계부에 `.00` 은 소음이다. */
  requests.push(numberFormat(ledger, COL.amount, 'CURRENCY', '₩#,##0'));

  /* 줄무늬 — 행이 많아지면 눈이 줄을 잃는다. */
  requests.push({
    addBanding: {
      bandedRange: {
        range: { sheetId: ledger, startRowIndex: 0, startColumnIndex: 0, endColumnIndex: APP_SHEET_HEADERS.length },
        rowProperties: {
          headerColor: { red: 0.94, green: 0.95, blue: 0.97 },
          firstBandColor: { red: 1, green: 1, blue: 1 },
          secondBandColor: { red: 0.98, green: 0.98, blue: 0.99 }
        }
      }
    }
  });

  requests.push(dropdownFromValues(ledger, COL.kind, KIND_CHOICES));
  requests.push(dropdownFromValues(ledger, COL.fixity, FIXITY_CHOICES));
  if (categories !== undefined) {
    requests.push(dropdownFromRange(ledger, COL.category, BLUEPRINT_TABS.categories, 0));
    requests.push(dropdownFromRange(ledger, COL.subcategory, BLUEPRINT_TABS.categories, 1));
  }
  if (settings !== undefined) {
    requests.push(dropdownFromRange(ledger, COL.payer, BLUEPRINT_TABS.settings, 0));
    requests.push(dropdownFromRange(ledger, COL.method, BLUEPRINT_TABS.settings, 1));
  }

  /* 요약·현금흐름의 숫자 서식. 월 머리는 날짜, 나머지는 통화·백분율. */
  const monthly = sheetIds[BLUEPRINT_TABS.monthly];
  if (monthly !== undefined) {
    requests.push({
      repeatCell: {
        range: { sheetId: monthly, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 1, endColumnIndex: 13 },
        cell: { userEnteredFormat: { numberFormat: { type: 'DATE', pattern: 'yyyy"년" m"월"' }, textFormat: { bold: true } } },
        fields: 'userEnteredFormat(numberFormat,textFormat)'
      }
    });
    requests.push({
      repeatCell: {
        range: { sheetId: monthly, startRowIndex: 4, startColumnIndex: 1, endColumnIndex: 13 },
        cell: { userEnteredFormat: { numberFormat: { type: 'CURRENCY', pattern: '₩#,##0' } } },
        fields: 'userEnteredFormat.numberFormat'
      }
    });
  }

  const cashFlow = sheetIds[BLUEPRINT_TABS.cashFlow];
  if (cashFlow !== undefined) {
    requests.push({
      repeatCell: {
        range: { sheetId: cashFlow, startRowIndex: 4, startColumnIndex: 0, endColumnIndex: 1 },
        cell: { userEnteredFormat: { numberFormat: { type: 'DATE', pattern: 'yyyy"년" m"월"' } } },
        fields: 'userEnteredFormat.numberFormat'
      }
    });
    requests.push({
      repeatCell: {
        range: { sheetId: cashFlow, startRowIndex: 4, startColumnIndex: 1, endColumnIndex: 5 },
        cell: { userEnteredFormat: { numberFormat: { type: 'CURRENCY', pattern: '₩#,##0' } } },
        fields: 'userEnteredFormat.numberFormat'
      }
    });
    requests.push({
      repeatCell: {
        range: { sheetId: cashFlow, startRowIndex: 4, startColumnIndex: 5, endColumnIndex: 6 },
        cell: { userEnteredFormat: { numberFormat: { type: 'PERCENT', pattern: '0.0%' } } },
        fields: 'userEnteredFormat.numberFormat'
      }
    });
  }

  const fixed = sheetIds[BLUEPRINT_TABS.fixed];
  if (fixed !== undefined) {
    requests.push({
      repeatCell: {
        range: { sheetId: fixed, startRowIndex: 4, startColumnIndex: 3, endColumnIndex: 4 },
        cell: { userEnteredFormat: { numberFormat: { type: 'CURRENCY', pattern: '₩#,##0' } } },
        fields: 'userEnteredFormat.numberFormat'
      }
    });
  }

  /* 안내 탭은 글이라 폭을 넓게. */
  const readme = sheetIds[BLUEPRINT_TABS.readme];
  if (readme !== undefined) requests.push(columnWidth(readme, 0, 720));

  return requests;
};
