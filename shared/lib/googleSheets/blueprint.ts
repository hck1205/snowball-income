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
import { APP_SHEET_HEADERS } from './schema';
import { BLUEPRINT_TABS, BLUEPRINT_TAB_ROLE, TAB_COLOR } from './blueprintTabs';
import {
  LEDGER_CATEGORIES,
  LEDGER_HOLDING_HEADERS,
  LEDGER_HOLDING_LABEL,
  LEDGER_INVESTMENT_HEADERS,
  LEDGER_METHOD_LABEL,
  LEDGER_PAYER_SHARED
} from '@/shared/constants/ledger';
import { CLASSIFY_RULE_HEADERS } from '@/shared/lib/ledger';

/*
 * 🔴 **탭·열 정의는 `blueprintTabs.ts`, 서식은 `blueprintFormat.ts` 로 갈라졌다**(2026-08-31).
 * 이 파일은 이제 "무엇을 만드나"(탭 구성·행·수식)만 갖는다. 배럴을 거쳐 쓰는 곳은 그대로다.
 */
export {
  BLUEPRINT_TABS,
  BLUEPRINT_TAB_ORDER,
  BLUEPRINT_TAB_ROLE,
  FIXITY_CHOICES,
  KIND_CHOICES,
  type BlueprintTabRole
} from './blueprintTabs';
export { buildFormatRequests, type SheetIdByTitle } from './blueprintFormat';

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

/*
 * 🔴 **가계부 탭은 하나다**(2026-08-09 사용자 결정). 한때 `공동 가계부` 를 둘째 장부로 두려다
 *    접었다 — `주체` 축이 이미 그 일을 한다(누가 썼나를 기록마다 적고, 화면이 사람별로 나눠 본다).
 *    장부를 둘로 쪼개면 같은 구별을 두 방식으로 하게 되고, 합계가 어느 쪽 기준인지 갈린다.
 */
const sheetSpecs = (): SheetSpec[] => [
  {
    title: BLUEPRINT_TABS.ledger,
    /* 🔴 넉넉히 잡는다. 행이 모자라면 사용자가 직접 늘려야 하고, 수식의 열 전체 참조도 그만큼만 본다. */
    grid: { rowCount: 2000, columnCount: APP_SHEET_HEADERS.length, frozenRowCount: 1 },
    rows: [[...APP_SHEET_HEADERS]]
  },
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
