import {
  BLUEPRINT_TABS,
  BLUEPRINT_TAB_ROLE,
  COL,
  FIXITY_CHOICES,
  KIND_CHOICES,
  LEDGER_COLUMN_WIDTHS
} from './blueprintTabs';
import { APP_SHEET_HEADERS } from './schema';
import {
  LEDGER_CURRENCY_CHOICES,
  LEDGER_HOLDING_CHOICES,
  LEDGER_HOLDING_HEADERS,
  LEDGER_INVESTMENT_HEADERS
} from '@/shared/constants/ledger';
import { CLASSIFY_RULE_HEADERS } from '@/shared/lib/ledger';

/**
 * 앱이 만드는 스프레드시트의 **서식** — 헤더 굵게 · 열 너비 · 숫자 형식 · 드롭다운 · 날짜 검증.
 *
 * 🔴 `blueprint.ts` 에서 갈라 냈다(2026-08-31). 저쪽은 **무엇을 만드나**(탭·행·수식)이고
 * 여기는 **어떻게 보이나**다. 둘이 한 파일에 있을 때는 869줄이라, 수식을 고치러 온 사람이
 * 드롭다운 정의를 스크롤로 지나쳐야 했다.
 *
 * ⚠ 전부 순수 함수다 — Sheets API 의 요청 객체를 만들 뿐 아무것도 부르지 않는다.
 */

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

/**
 * 날짜 칸의 유효성 검사 — 🔴 **구글 시트가 달력 선택기를 띄우는 조건**이다.
 *
 * `DATE_IS_VALID_DATE` 규칙이 걸린 칸을 누르면 시트가 작은 달력을 띄운다. 이 규칙이 없으면
 * 날짜 열도 그냥 숫자·글자 입력칸이라, 사용자가 `8/3` 처럼 적어 로케일에 따라 다르게 읽히거나
 * 아예 글자로 저장된다 — 그러면 `SUMIFS` 의 월 구간 조건이 그 행을 못 세고 요약에서 조용히 빠진다.
 *
 * ⚠ 숫자 서식(`yyyy-mm-dd`)만으로는 달력이 뜨지 않는다. 서식은 **보이는 모양**이고
 *   유효성 검사는 **입력 방법**이라 역할이 다르다 — 둘 다 필요하다.
 * 🔴 `strict: false` 다. 다른 드롭다운과 같은 이유로, 앱이나 사용자가 넣는 값이 **거부되지 않아야**
 *   한다(거부되면 저장이 실패한다). 경고 표시만 남는다.
 */
const dateValidation = (sheetId: number, columnIndex: number) => ({
  setDataValidation: {
    range: { sheetId, startRowIndex: 1, startColumnIndex: columnIndex, endColumnIndex: columnIndex + 1 },
    rule: {
      condition: { type: 'DATE_IS_VALID_DATE' },
      inputMessage: '날짜를 고르거나 2026-08-01 처럼 적습니다.',
      showCustomUi: true,
      strict: false
    }
  }
});

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
 * 보호 범위. 🔴 **`warningOnly: true`** 다 — 막지 않고 **묻는다.**
 *
 * 완전히 잠그면(편집자 목록 지정) 두 가지가 깨진다:
 * 1. **앱이 쓸 수 없다.** 앱은 시트 소유자가 아니라 OAuth 로 대신 쓰는 처지다.
 * 2. **사용자가 자기 시트를 못 고친다.** 남의 수식이 아니라 자기 시트다 — 고치겠다면 고칠 수 있어야 한다.
 *
 * 경고만 띄우는 것으로 목적은 달성된다: "여기는 저절로 차는 곳"이라는 사실을 **실수하려는 순간에** 알린다.
 */
const protectDerived = (sheetId: number, description: string) => ({
  addProtectedRange: {
    protectedRange: {
      range: { sheetId },
      description,
      warningOnly: true
    }
  }
});

/** 열 하나에만 걸는 보호 — `가계부` 탭의 `상태` 열처럼 앱이 관리하는 칸. */
const protectColumn = (sheetId: number, columnIndex: number, description: string) => ({
  addProtectedRange: {
    protectedRange: {
      range: { sheetId, startColumnIndex: columnIndex, endColumnIndex: columnIndex + 1 },
      description,
      warningOnly: true
    }
  }
});

/**
 * 머리 셀의 **메모와 색** — "어디를 적나"를 말한다.
 *
 * 🔴 널리 쓰이는 템플릿들은 이것을 **배너 행**(`↓입력필수↓`)으로 한다. 우리는 그럴 수 없다 —
 *    `가계부` 탭은 머리 1행 / 기록 2행부터가 계약이고, 배너를 얹으면 기록이 3행으로 밀려
 *    `APP_SHEET_MAPPING`·쓰기 경로·`A2:I` 수식이 통째로 어긋난다. 같은 뜻을 행을 늘리지 않고 전한다.
 */
type HeaderHint = { readonly note: string; readonly tone: 'required' | 'optional' | 'auto' };

/** 🔵 진한 파랑 = 꼭 적는다 · 🔵 연한 파랑 = 비워도 된다 · ⚪ 회색 = 앱이 쓴다 */
const HINT_COLOR: Readonly<Record<HeaderHint['tone'], { red: number; green: number; blue: number }>> = {
  required: { red: 0.82, green: 0.89, blue: 0.99 },
  optional: { red: 0.94, green: 0.96, blue: 0.99 },
  auto: { red: 0.9, green: 0.9, blue: 0.91 }
};

/** `가계부` 탭 머리 열별 안내. 순서는 `APP_SHEET_HEADERS` 와 같다. */
const LEDGER_HEADER_HINTS: readonly HeaderHint[] = [
  { tone: 'required', note: '꼭 적습니다. 예: 2026-08-01' },
  {
    tone: 'optional',
    note:
      '비워 두셔도 됩니다. 항목을 적으면 저절로 따라옵니다(식비→지출, 저축→이체).\n' +
      '다만 값 자체는 계산에 꼭 필요해서, 히포가 정하지 못하면 그 줄은 합계에서 빠집니다.'
  },
  { tone: 'optional', note: '비워 두셔도 됩니다. 내용을 보고 히포가 채워 여기에 적어 드립니다.' },
  { tone: 'optional', note: '비워 두셔도 됩니다. 항목과 함께 히포가 채웁니다.' },
  { tone: 'required', note: '꼭 적습니다. 숫자만 넣으시면 됩니다.' },
  { tone: 'optional', note: '여럿이 함께 쓸 때만 적습니다. 비우면 공동으로 셉니다.' },
  { tone: 'optional', note: '비워 두셔도 됩니다.' },
  { tone: 'optional', note: '매달 같은 자리에서 나가는 돈에만 “고정”을 적습니다. 월세·통신비·보험료가 그렇습니다.' },
  {
    tone: 'required',
    note: '꼭 적습니다. 🔴 히포가 분류를 정하는 유일한 재료입니다 — 여기가 비면 항목을 채워 드릴 수 없습니다.'
  },
  { tone: 'auto', note: '앱이 씁니다. 지운 기록에 “삭제됨”이 적히고 요약에서 빠집니다. 직접 고치지 마세요.' }
];

const headerHint = (sheetId: number, columnIndex: number, hint: HeaderHint) => ({
  repeatCell: {
    range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: columnIndex, endColumnIndex: columnIndex + 1 },
    cell: {
      note: hint.note,
      userEnteredFormat: { backgroundColor: HINT_COLOR[hint.tone], textFormat: { bold: true } }
    },
    fields: 'note,userEnteredFormat(backgroundColor,textFormat)'
  }
});

/** 통화 서식 한 열. */
const currencyColumn = (sheetId: number, columnIndex: number) =>
  numberFormat(sheetId, columnIndex, 'CURRENCY', '₩#,##0');

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

  /*
   * 🔴 머리 셀에 **색과 메모**를 함께 넣는다 — 색만으로는 뜻이 전해지지 않는다(색 단독 채널 금지).
   *    메모가 그 색이 무슨 뜻인지 말한다.
   */
  LEDGER_HEADER_HINTS.forEach((hint, index) => requests.push(headerHint(ledger, index, hint)));
  LEDGER_COLUMN_WIDTHS.forEach((width, index) => requests.push(columnWidth(ledger, index, width)));
  /* `상태` 열은 앱이 관리한다 — 손대려 하면 묻는다. */
  requests.push(protectColumn(ledger, COL.status, '앱이 쓰는 칸입니다. 지운 기록을 표시합니다.'));
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

  /* 🔴 날짜 칸은 달력으로 고른다 — 글자로 적히면 월 구간 SUMIFS 가 그 행을 못 센다. */
  requests.push(dateValidation(ledger, COL.date));
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
    /* 순자산(G열)도 통화다. */
    requests.push(currencyColumn(cashFlow, 6));
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

  /* ── 자산 탭 ─────────────────────────────────────────────────────────────── */
  const holdings = sheetIds[BLUEPRINT_TABS.holdings];
  if (holdings !== undefined) {
    requests.push(headerFormat(holdings, LEDGER_HOLDING_HEADERS.length));
    [110, 100, 200, 140, 260].forEach((width, index) => requests.push(columnWidth(holdings, index, width)));
    requests.push(numberFormat(holdings, 0, 'DATE', 'yyyy-mm-dd'));
    /* 자산도 같은 처방 — 월말 스냅샷의 달을 못 읽으면 순자산 추이가 통째로 빈다. */
    requests.push(dateValidation(holdings, 0));
    requests.push(currencyColumn(holdings, 3));
    requests.push(dropdownFromValues(holdings, 1, LEDGER_HOLDING_CHOICES));
  }

  /* ── 투자 탭 ─────────────────────────────────────────────────────────────── */
  const investments = sheetIds[BLUEPRINT_TABS.investments];
  if (investments !== undefined) {
    requests.push(headerFormat(investments, LEDGER_INVESTMENT_HEADERS.length));
    [140, 100, 100, 140, 80, 240].forEach((width, index) => requests.push(columnWidth(investments, index, width)));
    /* 🔴 수량은 소수가 나온다(소수점 매수). 정수로 잘라 보이면 사용자가 자기 수량을 의심한다. */
    requests.push(numberFormat(investments, 2, 'NUMBER', '#,##0.####'));
    requests.push(numberFormat(investments, 3, 'NUMBER', '#,##0.##'));
    requests.push(dropdownFromValues(investments, 4, LEDGER_CURRENCY_CHOICES));
  }

  /* ── 분류 규칙 탭 ────────────────────────────────────────────────────────── */
  const rules = sheetIds[BLUEPRINT_TABS.rules];
  if (rules !== undefined) {
    requests.push(headerFormat(rules, CLASSIFY_RULE_HEADERS.length));
    [220, 140, 160, 80].forEach((width, index) => requests.push(columnWidth(rules, index, width)));
    if (categories !== undefined) {
      requests.push(dropdownFromRange(rules, 1, BLUEPRINT_TABS.categories, 0));
      requests.push(dropdownFromRange(rules, 2, BLUEPRINT_TABS.categories, 1));
    }
    requests.push(dropdownFromValues(rules, 3, FIXITY_CHOICES));
    /*
     * 🔴 이 탭은 **보호하지 않는다.** 앱이 쓰기도 하지만 **사용자가 고치는 것이 설계 의도**다 —
     *    "왜 그렇게 분류됐나"가 여기 보이고, 마음에 안 들면 한 줄 고치는 것이 정상 사용이다.
     *    경고를 띄우면 그 정상 사용이 잘못처럼 보인다.
     */
  }

  /* ── 예시 탭 ─────────────────────────────────────────────────────────────── */
  const example = sheetIds[BLUEPRINT_TABS.example];
  if (example !== undefined) {
    requests.push(columnWidth(example, 8, 220));
    /* 마지막 열이 설명이라 넓어야 한다. */
    requests.push(columnWidth(example, 11, 520));
  }

  /* 안내 탭은 글이라 폭을 넓게. */
  const readme = sheetIds[BLUEPRINT_TABS.readme];
  if (readme !== undefined) requests.push(columnWidth(readme, 0, 720));

  /*
   * ── 저절로 차는 탭 보호 ───────────────────────────────────────────────────
   * 🔴 역할표에서 파생시킨다. 여기에 탭 이름을 손으로 나열하면 탭이 늘 때 빠뜨린다 —
   *    이 레포가 "손으로 나열한 목록"으로 여섯 번 조용히 틀린 이력이 있다.
   */
  for (const [title, role] of Object.entries(BLUEPRINT_TAB_ROLE)) {
    if (role !== 'derived') continue;
    const sheetId = sheetIds[title];
    if (sheetId === undefined) continue;
    requests.push(protectDerived(sheetId, '저절로 계산되는 표입니다. 값을 직접 고치면 수식이 사라집니다.'));
  }

  return requests;
};
