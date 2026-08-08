/**
 * **화면 탭 모델** — 시트의 탭을 앱에서도 탭으로 보여 준다. 순수 함수만.
 *
 * ## 왜 앱에도 탭이 필요한가
 *
 * 시트는 11 탭이 되었고 그중 넷이 적는 곳이다(`가계부`·`자산`·`투자`·`분류 규칙`). 그런데 앱은
 * `가계부` 하나만 보여 주고 있었다. 그러면 사용자는 **자산과 투자를 적으려면 시트로 나가야** 하고,
 * 나간 사람은 돌아오지 않는다 — 앱이 시트의 부분집합이면 앱을 쓸 이유가 없다.
 *
 * ## 🔴 이 탭바는 `LedgerTabPicker` 와 다른 것이다 (섞지 마라)
 *
 * | | `LedgerTabPicker` | 이 탭바 |
 * |---|---|---|
 * | 무엇 | **사용자 스프레드시트의 워크시트** 고르기 | 앱이 아는 **네 가지 관심사** 전환 |
 * | 개수 | 사용자 시트에 따라 1~20+ 개 | **항상 넷** |
 * | 컨트롤 | 네이티브 `<select>` | 가로 탭바 |
 *
 * `LedgerTabPicker` 는 "가로 탭바로 바꾸지 마라"고 못 박혀 있다 — 탭 20개에서 항목이 스크롤 뒤로
 * 숨고 그 사실을 알릴 방법이 없다(헤더 `NavScroller` 에서 실측된 사고). **그 금지는 개수가 열려
 * 있는 목록에 대한 것**이고, 여기는 넷으로 닫혀 있어 해당하지 않는다. 넷은 좁은 폭에서도 다 보인다.
 *
 * ## 🔴 막혀 있으면 사유가 함께 선다 (무음 비활성 금지)
 *
 * 앱이 만든 시트가 아니면 `자산`·`투자`·`분류 규칙` 탭이 없다. 그때 탭을 흐리게만 만들면
 * 사용자는 "왜 눌리지 않는가"를 알 방법이 없다. 이유를 문장으로 들고 다닌다.
 */
import { BLUEPRINT_TABS, BLUEPRINT_TAB_ORDER } from '@/shared/lib/googleSheets';

export type LedgerViewTabId = 'entries' | 'holdings' | 'investments' | 'rules';

export const LEDGER_VIEW_TAB_IDS: readonly LedgerViewTabId[] = [
  'entries',
  'holdings',
  'investments',
  'rules'
];

/** 기본 탭. 🔴 `entries` 여야 한다 — 가계부를 열었으니 기록이 먼저 보여야 한다. */
export const DEFAULT_LEDGER_VIEW_TAB: LedgerViewTabId = 'entries';

/** 화면 탭 ↔ 시트 탭. 이름을 두 곳에 적지 않으려고 청사진에서 가져온다. */
export const LEDGER_VIEW_TAB_SHEET_TITLE: Readonly<Record<LedgerViewTabId, string>> = {
  entries: BLUEPRINT_TABS.ledger,
  holdings: BLUEPRINT_TABS.holdings,
  investments: BLUEPRINT_TABS.investments,
  rules: BLUEPRINT_TABS.rules
};

export type LedgerViewTab = {
  readonly id: LedgerViewTabId;
  /** 화면에 적히는 이름. 시트 탭 이름과 **같게** 둔다 — 두 화면을 오가는 사람이 같은 말을 봐야 한다. */
  readonly label: string;
  /** 이 탭이 무엇인지 한 줄. 탭을 고르면 그 아래에 선다. */
  readonly description: string;
  readonly isAvailable: boolean;
  /** 🔴 막혀 있을 때의 사유. 비활성이면 **반드시** 있다. */
  readonly unavailableReason?: string;
};

const TAB_LABEL: Readonly<Record<LedgerViewTabId, string>> = {
  entries: '가계부',
  holdings: '자산',
  investments: '투자',
  rules: '분류 규칙'
};

const TAB_DESCRIPTION: Readonly<Record<LedgerViewTabId, string>> = {
  entries: '들어오고 나간 돈을 적습니다. 항목을 비워 두시면 내용을 보고 채워 드립니다.',
  holdings: '달마다 한 번, 월말에 얼마 있는지 적습니다. 부채도 같은 표에 적으면 순자산이 나옵니다.',
  investments: '가진 종목과 수량을 적습니다. 배당이 얼마 들어올지 계산으로 이어집니다.',
  rules: '히포가 배운 분류 규칙입니다. 마음에 들지 않는 줄은 고치시면 다음부터 그대로 따릅니다.'
};

/**
 * 앱이 만든 시트가 아닐 때의 사유.
 *
 * ⚠ "권한이 없습니다"라고 말하지 않는다 — 권한 문제가 아니라 **그 탭이 아예 없는** 것이다.
 *   원인을 틀리게 말하면 사용자가 엉뚱한 곳(공유 설정)을 고치려 든다.
 */
const NEEDS_APP_SHEET = (label: string): string =>
  `연결한 시트에 “${label}” 탭이 없습니다. 히포가 만든 시트에서 쓸 수 있습니다.`;

/**
 * 탭 목록을 만든다.
 *
 * @param createdByApp 앱이 만든 시트인가. 아니면 `가계부` 탭만 쓸 수 있다.
 */
export const buildLedgerViewTabs = (createdByApp: boolean): readonly LedgerViewTab[] =>
  LEDGER_VIEW_TAB_IDS.map((id) => {
    /* `가계부` 는 언제나 있다 — 그것이 연결의 조건이다. */
    const isAvailable = id === 'entries' ? true : createdByApp;
    return {
      id,
      label: TAB_LABEL[id],
      description: TAB_DESCRIPTION[id],
      isAvailable,
      ...(isAvailable ? {} : { unavailableReason: NEEDS_APP_SHEET(TAB_LABEL[id]) })
    };
  });

/**
 * 고른 탭이 쓸 수 없으면 기본 탭으로 되돌린다.
 *
 * 🔴 이 보정이 없으면 **빈 화면**이 나온다: 앱 시트로 `투자` 탭을 보다가 다른 시트로 바꾸면
 *    고른 탭은 `investments` 인데 그 탭이 없어 아무것도 안 그려진다. 사용자는 앱이 고장 난 줄 안다.
 */
export const resolveLedgerViewTab = (
  requested: LedgerViewTabId,
  tabs: readonly LedgerViewTab[]
): LedgerViewTabId => {
  const found = tabs.find((tab) => tab.id === requested);
  return found?.isAvailable ? requested : DEFAULT_LEDGER_VIEW_TAB;
};

/* ── 🔴 탭 피커에서 빼야 하는 것 ─────────────────────────────────────────────── */

/**
 * **앱이 만든 시트에서 워크시트 피커에 보여선 안 되는 탭 제목.**
 *
 * ## 왜 필요한가 (2026-08-08 사용자 지적으로 발견한 결함)
 *
 * `fetchSpreadsheetMeta` 는 워크시트를 **하나도 거르지 않고** 다 돌려준다. 앱이 만든 시트의 탭이
 * 11 개가 되면서, 워크시트 피커(`LedgerTabPicker`)에 `월별 요약`·`읽어보기`·`분류 규칙` 까지 다
 * 나오게 됐다. 거기서 `월별 요약` 을 고르면 앱은 **그것을 가계부로 읽으려** 한다 —
 * 헤더가 안 맞아 매핑 화면으로 떨어지고, 최악에는 수식 탭에 쓰기를 시도한다.
 *
 * 이름이 겹치는 것보다 나쁜 것은 **두 컨트롤이 같은 탭을 다르게 다루는** 것이다: 화면 탭바는
 * 전용 파서로 옳게 읽고, 워크시트 피커는 가계부로 오해한다.
 *
 * ## 🔴 앱이 만든 시트에서만 거른다
 *
 * 사용자가 고른 기존 시트의 탭 이름은 **우리가 판단할 근거가 없다.** 어쩌다 `월별 요약` 이라는
 * 탭이 있더라도 그건 그 사람의 가계부일 수 있다 — 추측으로 선택지를 빼앗지 않는다.
 */
const NON_LEDGER_BLUEPRINT_TITLES: ReadonlySet<string> = new Set(
  BLUEPRINT_TAB_ORDER.filter((title) => title !== BLUEPRINT_TABS.ledger)
);

/**
 * 워크시트 피커에 실을 탭만 남긴다.
 *
 * @param createdByApp 앱이 만든 시트인가. `false` 면 **하나도 거르지 않는다**(위 머리말).
 *
 * ⚠ 앱 시트에서는 남는 것이 `가계부` 하나가 되고, 그때 `LedgerTabPicker` 는 드롭다운을 만들지
 *   않고 이름만 말한다(그 컴포넌트의 규칙) — 겹침이 화면에서 사라진다.
 */
export const selectableLedgerTabs = <T extends { readonly title: string }>(
  tabs: readonly T[],
  createdByApp: boolean
): readonly T[] => (createdByApp ? tabs.filter((tab) => !NON_LEDGER_BLUEPRINT_TITLES.has(tab.title)) : tabs);
