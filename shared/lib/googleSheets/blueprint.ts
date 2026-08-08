/**
 * 앱이 만드는 스프레드시트의 **설계도** — 탭 구성 · 서식 · 수식 · 드롭다운. 전부 순수 함수.
 *
 * ## 왜 이 파일이 있나
 *
 * 종전에는 탭 하나에 헤더 글자만 쓰고 끝냈다. 사용자가 시트를 직접 열면 민짜 표 한 장이었다.
 * 그런데 가계부는 **앱에서만 보는 것이 아니다** — 널리 쓰이는 시트 템플릿들이 그렇듯, 사람들은
 * 시트를 열어 놓고 직접 채우고 눈으로 훑는다. 그 사용을 앱이 지워 버릴 이유가 없다.
 *
 * ## 관심사별 탭 — 역할이 탭 색으로 보인다
 *
 * | 탭 | 역할 | 무엇 | 앱이 |
 * |---|---|---|---|
 * | `가계부`     | 🔵 입력 | 기록 본체. **분류를 비워도 된다** | 읽고 쓴다 |
 * | `자산`       | 🔵 입력 | 월말 잔액 스냅샷(부채 포함) | 읽는다 |
 * | `투자`       | 🔵 입력 | 계좌·티커·수량 → 배당 계산으로 | 읽는다 |
 * | `분류 규칙`  | 🔵 설정 | 히포가 배운 규칙. **사용자가 고칠 수 있다** | 읽고 쓴다 |
 * | `월별 요약`  | ⚪ 자동 | 항목 × 월 피벗(수식) | ❌ |
 * | `현금흐름`   | ⚪ 자동 | 수입·지출·이체·저축률·순자산(수식) | ❌ |
 * | `고정비`     | ⚪ 자동 | 고정으로 표시한 것만 모아 보기(수식) | ❌ |
 * | `예시`       | 🟡 도움 | 채워 놓은 견본 | ❌ |
 * | `읽어보기`   | 🟡 도움 | 사용법 | ❌ |
 * | `분류`·`설정` | **숨김** | 드롭다운 원본(기계) | ❌ |
 *
 * 🔴 **`가계부` 가 반드시 첫 탭이다.** 연결 코드가 `tabs[0]` 을 집는다. 순서를 바꾸면 앱이 엉뚱한
 *    탭을 본다.
 * 🔴 **수식 탭에 앱이 쓰지 않는다.** 쓰면 사용자의 수식을 덮어쓴다. 앱이 쓰는 것은 `가계부`(기록)와
 *    `분류 규칙`(학습) 둘뿐이다.
 * 🔴 **`가계부` 탭의 머리는 1행, 기록은 2행부터다.** 널리 쓰이는 템플릿들처럼 안내 배너를 위에 얹으면
 *    기록이 3행으로 밀려 `APP_SHEET_MAPPING`·쓰기 경로·`A2:I` 수식이 통째로 어긋난다.
 *    그래서 배너 대신 **머리 셀의 색과 메모**로 "어디를 적나"를 말한다.
 *
 * ## 왜 드롭다운 원본을 숨기나
 *
 * 널리 쓰이는 템플릿들은 이 기계(`dropdown`·`2nd level`)를 숨겨 둔다. 그건 옳다 — 사용자는 만질 탭만
 * 봐야 한다. 우리가 따라가지 않는 것은 그 **333열짜리 종속 드롭다운**이다. 그 장치의 목적은
 * "입력할 때 분류를 고르게 하는 것"인데, 우리는 고르는 일 자체를 없앴다(`shared/lib/ledger/classify`).
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
import {
  LEDGER_CATEGORIES,
  LEDGER_CURRENCY_CHOICES,
  LEDGER_HOLDING_CHOICES,
  LEDGER_HOLDING_HEADERS,
  LEDGER_HOLDING_LABEL,
  LEDGER_INVESTMENT_HEADERS,
  LEDGER_METHOD_LABEL,
  LEDGER_PAYER_SHARED
} from '@/shared/constants/ledger';
import { CLASSIFY_RULE_HEADERS } from '@/shared/lib/ledger';

/* ── 탭 이름 ─────────────────────────────────────────────────────────────────── */

export const BLUEPRINT_TABS = {
  ledger: APP_SHEET_TAB_TITLE,
  /**
   * **둘째 가계부** — 공동 생활비용(2026-08-08 사용자 요청).
   *
   * 🔴 만들 때부터 **숨겨** 둔다. 혼자 쓰는 사람의 시트에 안 쓰는 탭이 보이면 소음이고,
   *    "이건 뭐지"를 묻게 만든다. 앱에서 공동 가계부를 켜면 그때 드러난다.
   * 🔴 **합계를 A 와 합치지 않는다.** 2026-08-02 결정(블렌딩 제거)이 그대로 살아 있다 —
   *    앱은 탭을 전환할 뿐, 두 장부를 넘어 합계를 내지 않는다. 합치고 싶으면 시트에서 한다.
   */
  ledgerShared: '공동 가계부',
  holdings: '자산',
  investments: '투자',
  rules: '분류 규칙',
  monthly: '월별 요약',
  cashFlow: '현금흐름',
  fixed: '고정비',
  example: '예시',
  readme: '읽어보기',
  categories: '분류',
  settings: '설정'
} as const;

/**
 * 탭 순서 = 화면 순서. **관심사별로 모았다** — 적는 것 → 저절로 차는 것 → 도움말 → 기계.
 *
 * 🔴 `가계부` 가 첫째여야 한다(연결이 `tabs[0]` 을 집는다).
 */
export const BLUEPRINT_TAB_ORDER: readonly string[] = [
  BLUEPRINT_TABS.ledger,
  BLUEPRINT_TABS.ledgerShared,
  BLUEPRINT_TABS.holdings,
  BLUEPRINT_TABS.investments,
  BLUEPRINT_TABS.rules,
  BLUEPRINT_TABS.monthly,
  BLUEPRINT_TABS.cashFlow,
  BLUEPRINT_TABS.fixed,
  BLUEPRINT_TABS.example,
  BLUEPRINT_TABS.readme,
  BLUEPRINT_TABS.categories,
  BLUEPRINT_TABS.settings
];

/**
 * 탭의 **역할** — 색과 보호를 여기서 한 번에 정한다.
 *
 * 🔴 역할을 두 곳(색 지정·보호 지정)에 따로 적으면 어긋난다 — 회색인데 안 잠긴 탭,
 *    파란데 잠긴 탭이 생긴다. 한 표에서 파생시킨다.
 */
export type BlueprintTabRole =
  /** 사용자가 적는 곳. 앱도 쓸 수 있다. */
  | 'input'
  /** 수식이 채우는 곳. 🔴 앱도 사용자도 쓰지 않는다 */
  | 'derived'
  /** 읽는 곳. */
  | 'help'
  /** 드롭다운 원본. 숨긴다. */
  | 'machinery';

export const BLUEPRINT_TAB_ROLE: Readonly<Record<string, BlueprintTabRole>> = {
  [BLUEPRINT_TABS.ledger]: 'input',
  [BLUEPRINT_TABS.ledgerShared]: 'input',
  [BLUEPRINT_TABS.holdings]: 'input',
  [BLUEPRINT_TABS.investments]: 'input',
  [BLUEPRINT_TABS.rules]: 'input',
  [BLUEPRINT_TABS.monthly]: 'derived',
  [BLUEPRINT_TABS.cashFlow]: 'derived',
  [BLUEPRINT_TABS.fixed]: 'derived',
  [BLUEPRINT_TABS.example]: 'help',
  [BLUEPRINT_TABS.readme]: 'help',
  [BLUEPRINT_TABS.categories]: 'machinery',
  [BLUEPRINT_TABS.settings]: 'machinery'
};

/** 탭 색. 열자마자 "적는 곳인가 보는 곳인가"가 보인다. */
const TAB_COLOR: Readonly<Record<BlueprintTabRole, { red: number; green: number; blue: number } | null>> = {
  /* 🔵 적는 곳 */
  input: { red: 0.29, green: 0.53, blue: 0.91 },
  /* ⚪ 저절로 차는 곳 */
  derived: { red: 0.72, green: 0.74, blue: 0.77 },
  /* 🟡 도움말 */
  help: { red: 0.98, green: 0.79, blue: 0.31 },
  /* 숨김 탭은 색이 보이지 않으니 칠하지 않는다. */
  machinery: null
};

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
  rows.push(['월', '수입', '지출', '이체', '남은 돈', '저축률', '순자산']);

  for (let i = 0; i < 12; i += 1) {
    const row = 5 + i;
    const monthCell = `$A${row}`;
    /* 자산 탭의 그 달 구간. 자산은 흐름이 아니라 **스냅샷**이라 합계가 아니라 그 달 기록을 본다. */
    const holdingsInMonth = `${H}!$A:$A,">="&${monthCell},${H}!$A:$A,"<"&EDATE(${monthCell},1)`;
    rows.push([
      i === 0
        ? FIRST_MONTH_FORMULA
        : `=EDATE($A${row - 1},1)`,
      `=SUMIFS(${L}!$E:$E,${L}!$B:$B,"수입",${inMonth(monthCell)},${ALIVE})`,
      `=SUMIFS(${L}!$E:$E,${L}!$B:$B,"지출",${inMonth(monthCell)},${ALIVE})`,
      `=SUMIFS(${L}!$E:$E,${L}!$B:$B,"이체",${inMonth(monthCell)},${ALIVE})`,
      `=B${row}-C${row}`,
      /* 🔴 수입이 0 인 달은 빈 칸이다 — 0% 로 적으면 "다 써서 0%"와 구분이 사라진다. */
      `=IF(B${row}=0,"",(B${row}-C${row})/B${row})`,
      /*
       * 순자산 = 그 달에 적은 자산 합 − 부채 합.
       *
       * 🔴 **자산을 안 적은 달은 빈 칸이다.** 0 으로 적으면 "빈털터리"로 읽힌다 —
       *    "안 적었다"와 "0원이다"는 완전히 다른 사실이고, 그 둘을 섞으면 순자산 추이 그래프가
       *    적지 않은 달마다 바닥을 찍는다.
       * 🔴 앞 달 값을 끌어오지도 않는다. 스냅샷은 **그 달에 실제로 센 값**이어야 한다.
       */
      `=IF(COUNTIFS(${holdingsInMonth})=0,"",SUMIFS(${H}!$D:$D,${H}!$B:$B,"<>"&"${LEDGER_HOLDING_LABEL.debt}",${holdingsInMonth})-SUMIFS(${H}!$D:$D,${H}!$B:$B,"${LEDGER_HOLDING_LABEL.debt}",${holdingsInMonth}))`
    ]);
  }
  return rows;
};

/** `자산` 탭을 가리키는 참조 조각. */
const H = `'${BLUEPRINT_TABS.holdings}'`;

/**
 * 자산 탭 — 월말 잔액 스냅샷. **세로로 쌓는다**(가로 월 블록을 쓰지 않는 이유는 `holdings.ts` 머리말).
 *
 * 머리는 1행, 기록은 2행부터다 — `가계부` 탭과 같은 규약이라 앱이 같은 방식으로 읽는다.
 */
const holdingRows = (): string[][] => [[...LEDGER_HOLDING_HEADERS]];

/** 투자 탭 — 계좌·티커·수량. 🔴 평가금액·수익률 열은 두지 않는다(`holdings.ts` 머리말). */
const investmentRows = (): string[][] => [[...LEDGER_INVESTMENT_HEADERS]];

/**
 * 분류 규칙 탭 — 히포가 배운 규칙. **비어 있게 시작한다.**
 *
 * 🔴 견본 규칙을 미리 넣지 않는다. "스타벅스 → 카페" 같은 줄을 우리가 심어 두면 그것은
 *    **우리가 고른 말로 부분 일치**를 하는 것이고, 정확히 우리가 금지한 조용한 오분류가 된다
 *    (근거: `classify.types.ts` 의 `LedgerClassifyRule` 머리말). 규칙은 사용자의 것이다.
 */
const ruleRows = (): string[][] => [
  [...CLASSIFY_RULE_HEADERS],
];

/**
 * 예시 탭 — **채워 놓은 견본.** 널리 쓰이는 템플릿들의 가장 좋은 아이디어다(`가계부 예시` ↔ `가계부 작성`).
 *
 * 빈 표 앞에서 사람은 얼어붙는다. 옆 탭에 답이 있으면 시작할 수 있다.
 *
 * 🔴 여기서 보여 줄 것은 "예쁜 표"가 아니라 **분류를 비워도 된다는 사실**이다. 그게 이 시트의
 *    다른 점이고, 말로 설명하는 것보다 채워진 줄 하나가 빠르다.
 */
const exampleRows = (): string[][] => [
  ['이렇게 적으면 됩니다'],
  ['아래는 견본입니다. 이 탭은 계산에 쓰이지 않으니 마음대로 고쳐 보셔도 됩니다.'],
  [],
  [...APP_SHEET_HEADERS, '', '이 줄이 말하는 것'],
  [
    '2026-08-01', '지출', '', '', '780000', '', '자동이체', '고정', '월세',
    '', '', '🔴 항목을 비워 뒀습니다 — 내용을 보고 히포가 채웁니다.'
  ],
  [
    '2026-08-02', '지출', '', '', '5600', '', '신용카드', '', '스타벅스 아메리카노',
    '', '', '“분류 규칙” 탭에 스타벅스 줄을 만들면 이후로는 저절로 잡힙니다.'
  ],
  [
    '2026-08-03', '지출', '식비', '외식', '32000', '', '신용카드', '', '친구랑 저녁',
    '', '', '직접 적으셔도 됩니다. 적힌 것은 히포가 건드리지 않습니다.'
  ],
  [
    '2026-08-05', '수입', '근로소득', '급여', '3200000', '', '계좌입금', '고정', '8월 급여',
    '', '', '수입도 같은 표에 적습니다.'
  ],
  [
    '2026-08-05', '이체', '저축·투자', '적금', '500000', '', '자동이체', '고정', '주택청약',
    '', '', '🔴 저축은 “이체”입니다 — 쓴 돈이 아니라 옮긴 돈이라 지출 합계에서 빠집니다.'
  ],
  [
    '2026-08-10', '지출', '', '', '12000', '아내', '체크카드', '', '약국',
    '', '', '여럿이 쓸 때만 “주체”를 적습니다. 비우면 공동입니다.'
  ]
];

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
  ['★ 꼭 적어야 하는 것은 세 칸입니다 — 날짜 · 금액 · 내용.'],
  ['   항목과 상세항목은 비워 두셔도 됩니다. 내용을 보고 히포가 채워 이 시트에 적어 드립니다.'],
  ['   히포가 정하지 못한 것은 비워 둔 채로 앱에서 여쭙습니다. 그럴듯하게 지어 넣지 않습니다.'],
  [],
  ['★ 탭 색이 역할입니다.'],
  ['   파란 탭은 적는 곳, 회색 탭은 저절로 차는 곳, 노란 탭은 읽는 곳입니다.'],
  ['   회색 탭을 고치려 하면 경고가 뜹니다 — 수식이 들어 있어서 그렇습니다.'],
  [],
  ['1. 기록은 “가계부” 탭에 적습니다. 잔액은 “자산”, 보유 종목은 “투자” 탭입니다.'],
  ['   “예시” 탭에 채워 놓은 견본이 있습니다. 처음에는 그것을 보고 따라 적으시면 됩니다.'],
  [],
  ['2. 항목·상세항목·구분은 칸을 누르면 목록이 나옵니다.'],
  ['   목록에 없는 말을 써도 저장은 됩니다. 적어 두신 말은 그대로 지킵니다.'],
  [],
  ['2-1. “분류 규칙” 탭에 “포함하는 말”을 적어 두시면 이후로 저절로 분류됩니다.'],
  ['   예를 들어 포함하는 말에 “스타벅스”, 항목에 “식비”를 적어 두면 내용에 스타벅스가 든 기록이 식비로 잡힙니다.'],
  ['   앱에서 분류를 고치시면 이 탭에 그 줄이 쌓입니다. 기기를 바꾸셔도 따라옵니다.'],
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
  ['   앱에서 기록을 지우면 여기에 “삭제됨”이 적히고 요약에서 빠집니다. 직접 고치지 마세요.'],
  [],
  ['7. “자산” 탭은 달마다 한 번, 월말 잔액을 적는 곳입니다.'],
  ['   부채도 같은 표에 “종류 = 부채”로 적습니다. 그래야 순자산이 나옵니다.'],
  ['   적지 않은 달의 순자산은 빈 칸으로 둡니다 — 0원과 “안 적었다”는 다른 사실이라서 그렇습니다.'],
  [],
  ['8. “투자” 탭에 티커와 수량을 적으시면 앱에서 배당 계산으로 이어집니다.'],
  ['   평가금액·수익률 칸은 두지 않았습니다. 시세를 받아 오지 않으므로 채울 수 없는 칸입니다.']
];

/**
 * 가계부 탭 하나의 스펙. **A 와 B 가 글자 하나 다르지 않다** — 같은 머리, 같은 격자, 같은 서식.
 *
 * 🔴 둘을 따로 적으면 한쪽만 고쳐진다. 이 레포가 "손으로 나열한 목록"으로 여섯 번 조용히 틀렸다.
 */
const ledgerSpec = (title: string, hidden: boolean): SheetSpec => ({
  title,
  /* 🔴 넉넉히 잡는다. 행이 모자라면 사용자가 직접 늘려야 하고, 수식의 열 전체 참조도 그만큼만 본다. */
  grid: { rowCount: 2000, columnCount: APP_SHEET_HEADERS.length, frozenRowCount: 1 },
  ...(hidden ? { hidden: true } : {}),
  rows: [[...APP_SHEET_HEADERS]]
});

const sheetSpecs = (): SheetSpec[] => [
  ledgerSpec(BLUEPRINT_TABS.ledger, false),
  /* 🔴 공동 가계부는 숨겨서 만든다 — 앱에서 켜면 드러난다. */
  ledgerSpec(BLUEPRINT_TABS.ledgerShared, true),
  {
    title: BLUEPRINT_TABS.holdings,
    grid: { rowCount: 500, columnCount: LEDGER_HOLDING_HEADERS.length, frozenRowCount: 1 },
    rows: holdingRows()
  },
  {
    title: BLUEPRINT_TABS.investments,
    grid: { rowCount: 300, columnCount: LEDGER_INVESTMENT_HEADERS.length, frozenRowCount: 1 },
    rows: investmentRows()
  },
  {
    title: BLUEPRINT_TABS.rules,
    grid: { rowCount: 500, columnCount: CLASSIFY_RULE_HEADERS.length, frozenRowCount: 1 },
    rows: ruleRows()
  },
  { title: BLUEPRINT_TABS.monthly, grid: { rowCount: 60, columnCount: 14, frozenRowCount: 4, frozenColumnCount: 1 }, rows: monthlyRows() },
  { title: BLUEPRINT_TABS.cashFlow, grid: { rowCount: 40, columnCount: 10, frozenRowCount: 4 }, rows: cashFlowRows() },
  { title: BLUEPRINT_TABS.fixed, grid: { rowCount: 200, columnCount: 10, frozenRowCount: 4 }, rows: fixedRows() },
  { title: BLUEPRINT_TABS.example, grid: { rowCount: 40, columnCount: 14, frozenRowCount: 4 }, rows: exampleRows() },
  { title: BLUEPRINT_TABS.readme, grid: { rowCount: 60, columnCount: 2 }, rows: readmeRows() },
  /* 🔴 아래 둘은 드롭다운 원본이다 — 숨긴다. 사용자는 만질 탭만 봐야 한다. */
  { title: BLUEPRINT_TABS.categories, hidden: true, grid: { rowCount: 200, columnCount: 2, frozenRowCount: 1 }, rows: categoryRows() },
  { title: BLUEPRINT_TABS.settings, hidden: true, grid: { rowCount: 100, columnCount: 2, frozenRowCount: 1 }, rows: settingsRows() }
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

/** 탭 색 조각. 역할표에서 파생시켜 색과 보호가 어긋나지 않게 한다. */
const tabColorProperty = (title: string): Record<string, unknown> => {
  const color = TAB_COLOR[BLUEPRINT_TAB_ROLE[title] ?? 'machinery'];
  return color ? { tabColorStyle: { rgbColor: color } } : {};
};

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
      ...(spec.hidden ? { hidden: true } : {}),
      ...tabColorProperty(spec.title)
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
