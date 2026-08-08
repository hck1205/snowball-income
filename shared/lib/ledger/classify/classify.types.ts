/**
 * 분류 사다리의 **타입과 어휘**. 순수 타입만 — 로직도 IO 도 여기 없다.
 *
 * ⚠ **`shared/lib/googleSheets` 를 import 하지 않는다.** 의존은 한 방향이어야 한다:
 *   `constants/ledger`(어휘) ← `lib/ledger`(규칙) ← `lib/googleSheets`(시트).
 *   시트가 분류를 쓰지, 분류가 시트를 알 필요는 없다. CSV 를 받게 되면 같은 규칙을 그대로 쓴다.
 */
import type {
  LedgerCategory,
  LedgerCategoryId,
  LedgerFixity,
  LedgerSubcategory
} from '@/shared/constants/ledger';

/**
 * 구분 — 수입·지출·이체.
 *
 * `LedgerCategory['flow']` 를 그대로 쓴다. 이 둘이 같은 타입인 것이 **이 설계에서 가장 중요한 사실**이다:
 * 항목이 정해지면 구분은 계산이 아니라 **조회**다(`category.flow`). 그래서 사용자가 구분을 적지
 * 않아도 된다.
 *
 * ⚠ `googleSheets` 의 `LedgerKind` 와 문자열 집합이 같다. 같게 유지해야 하고, 어긋나면
 *   `test/ledger/classify.test.ts` 의 대조 검사가 먼저 빨개진다.
 */
export type LedgerFlow = LedgerCategory['flow'];

/**
 * 사용자가 만든 분류 규칙 한 줄. 시트의 `분류 규칙` 탭 한 행과 1:1 이다.
 *
 * 🔴 `contains` 는 **부분 일치**로 쓴다. 내장 사전(`resolveCategoryName`)이 부분 일치를 **금지**하는
 *    것과 정반대인데, 그 차이가 이 설계의 핵심이다:
 *
 *    - 내장 사전은 우리가 미리 넣은 이름들이다. 부분 일치를 허용하면 `보험료` 가 `보험(차)` 에
 *      걸리는 식의 **조용한 오분류**가 우리 책임으로 난다(그 판단의 근거가 `categories.ts` 에 있다).
 *    - 규칙은 **사용자가 직접 적은 말**이다. "스타벅스가 들어가면 카페"라고 적은 사람은 부분 일치를
 *      의도한 것이고, 틀리면 자기가 적은 줄을 고칠 수 있다.
 *
 *    즉 부분 일치의 위험은 **누가 그 말을 골랐나**에 달려 있다. 우리가 고른 말엔 안 쓰고,
 *    사용자가 고른 말엔 쓴다.
 */
export type LedgerClassifyRule = {
  /** 내용에 이 말이 들어 있으면 이 규칙이 걸린다. */
  readonly contains: string;
  readonly categoryId: LedgerCategoryId;
  readonly subcategoryId?: string;
  /**
   * 이 규칙에 걸린 기록을 **고정비로 볼지.** 정하지 않았으면 `undefined`.
   *
   * 🔴 **`'fixed'` 만 가능하다** — `'variable'` 은 일부러 뺐다. 이 레포에서 변동비는 `고정` 열의
   *    **빈 칸**이다(`LEDGER_FIXITY_LABEL.variable === ''`). 그래서 "변동비다"라고 말하는 규칙은
   *    빈 칸을 쓰게 되는데, 그건 **아무것도 안 쓴 것과 같다** — 관측 가능한 효과가 없다.
   *    표현할 수 없는 상태를 타입에 두면 왕복(적었다 다시 읽기)에서 조용히 사라진다.
   */
  readonly fixity?: Extract<LedgerFixity, 'fixed'>;
};

/**
 * 분류가 **어디서 왔나**. 화면이 이것으로 말투를 가른다 —
 * 사용자가 적은 것은 조용히 두고, 히포가 채운 것은 "이렇게 봤습니다"라고 밝힌다.
 */
export type ClassifySource =
  /** 시트에 이미 적혀 있었다. 🔴 이 경우 히포는 아무것도 하지 않는다. */
  | 'sheet'
  /** 사용자가 만든 규칙에 걸렸다. */
  | 'rule'
  /** 내장 별칭 사전과 정확히 일치했다. */
  | 'dictionary'
  /** 못 정했다. 🔴 `기타`로 떨어뜨리지 않는다 — 물어야 한다. */
  | 'none';

/** 분류 한 건의 결과. */
export type LedgerClassification = {
  readonly category: LedgerCategory | null;
  readonly subcategory: LedgerSubcategory | null;
  /**
   * 구분. **항목이 정해지면 저절로 따라온다**(`category.flow`).
   *
   * 🔴 사용자가 직접 적을 필요는 없지만 **계산에는 반드시 필요하다** — 수입·지출·이체를 못 가르면
   *    합계가 뒤집힌다(이체를 지출로 세면 저축한 돈이 쓴 돈이 된다). 그래서 "입력은 선택, 값은 필수"고,
   *    못 정하면 `null` 로 두고 **계산에서 뺀다.**
   */
  readonly flow: LedgerFlow | null;
  /** 고정비인가. 못 정했으면 `null`(= 모른다) — `'variable'`(= 변동비다)과 다르다. */
  readonly fixity: LedgerFixity | null;
  readonly source: ClassifySource;
};

/** 아무것도 못 정한 결과. */
export const UNCLASSIFIED: LedgerClassification = {
  category: null,
  subcategory: null,
  flow: null,
  fixity: null,
  source: 'none'
};

/** 분류에 넣을 원본 칸들 — 시트 한 행에서 온다. 전부 없을 수 있다. */
export type ClassifyInput = {
  /** 시트의 `구분` 칸(사용자가 적었을 수 있다). */
  readonly kind?: string;
  /** 시트의 `항목` 칸. */
  readonly category?: string;
  /** 시트의 `상세항목` 칸. */
  readonly subcategory?: string;
  /** 시트의 `내용` 칸. **분류를 추론하는 유일한 재료다.** */
  readonly memo?: string;
  /** 시트의 `고정` 칸. */
  readonly fixity?: string;
};
