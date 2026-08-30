import { APP_SHEET_TAB_TITLE } from './schema';

/**
 * 앱이 만드는 스프레드시트의 **탭과 열 정의** — 설계도와 서식이 함께 보는 어휘.
 *
 * 🔴 `blueprint.ts`(869줄)에서 갈라 냈다(2026-08-31). 그 파일은 두 일을 했다 — **무엇을 만드나**
 * (탭·행·수식)와 **어떻게 보이나**(서식·드롭다운·너비). 둘은 서로를 거의 안 보고, 실제로 공유하던
 * 것은 이 파일의 상수 여섯뿐이었다.
 *
 * ⚠ `COL` 과 `LEDGER_COLUMN_WIDTHS` 는 종전에 파일 안 private 이었다. 갈라지면서 export 가 됐지만
 *   **배럴(`index.ts`)에는 내보내지 않는다** — 바깥에서 열 번호를 직접 세는 코드가 생기면 안 된다.
 */

/* ── 탭 이름 ─────────────────────────────────────────────────────────────────── */

export const BLUEPRINT_TABS = {
  ledger: APP_SHEET_TAB_TITLE,
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
export const TAB_COLOR: Readonly<Record<BlueprintTabRole, { red: number; green: number; blue: number } | null>> = {
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
export const COL = { date: 0, kind: 1, category: 2, subcategory: 3, amount: 4, payer: 5, method: 6, fixity: 7, memo: 8, status: 9 } as const;

/** 열 너비(px). 🔴 내용이 실제로 들어가는 폭에 맞춘다 — 전부 같은 폭이면 날짜가 남고 내용이 잘린다. */
export const LEDGER_COLUMN_WIDTHS: readonly number[] = [110, 80, 120, 130, 120, 90, 130, 70, 260, 80];

/** 구분 드롭다운 값. 🔴 `parseLedgerKind` 가 알아보는 낱말이어야 한다. */
export const KIND_CHOICES: readonly string[] = ['수입', '지출', '이체'];

/** 고정 드롭다운 값. 빈 칸이 변동이므로 선택지는 하나뿐이다. */
export const FIXITY_CHOICES: readonly string[] = ['고정'];
