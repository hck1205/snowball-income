/**
 * **주체 범위** — 부부·연인이 한 장부를 같이 정리할 때 "누구의 것"으로 좁혀 본다. 순수 함수만.
 *
 * ## 🔴 겹치지 않게 나눈다 (합이 맞아야 한다)
 *
 * `공동`(주체 칸이 빈 기록)을 어떻게 다룰지가 이 파일의 핵심 판단이다. 두 갈래가 있었다:
 *
 * | | 고른 사람 + 공동 | **고른 사람만** (택함) |
 * |---|---|---|
 * | "아내" 를 고르면 | 아내 것 + 공동 | 아내 것만 |
 * | 각 사람 합의 총합 | **총액보다 크다** (공동이 두 번) | 총액과 **같다** |
 * | 사용자가 검산할 수 있나 | ❌ | ✅ |
 *
 * 앞쪽이 "우리 살림에 내가 관여한 것"이라는 뜻으로는 자연스럽지만, **합이 맞지 않는다.**
 * 아내 뷰의 지출과 남편 뷰의 지출을 더했는데 전체보다 크면 사용자는 어느 숫자가 진짜인지 물어야
 * 하고, 그 질문에 우리가 줄 답이 없다. 그래서 **분할**을 택했다 — `공동` 도 하나의 선택지가 되고,
 * `아내 + 남편 + 공동 = 전체` 가 정확히 성립한다.
 *
 * ## 🔴 혼자 쓰면 이 컨트롤을 만들지 않는다
 *
 * 주체가 `공동` 하나뿐이면 선택지가 하나인 필터가 된다 — 그건 UI 의 거짓말이다
 * (같은 판단이 `LedgerAnalysisCard` 의 주체 구획에도 있다: `공동 100%` 한 줄은 정보가 아니라 소음).
 */
import { LEDGER_PAYER_SHARED, isSharedPayer } from '@/shared/constants/ledger';
import type { LedgerEntry } from '@/shared/lib/googleSheets';

/** `null` = 전체(좁히지 않음). 그 밖은 주체 이름이고, 공동은 `LEDGER_PAYER_SHARED` 다. */
export type LedgerPayerScope = string | null;

/** 전체를 뜻하는 값. `null` 을 코드 곳곳에 흩뿌리지 않으려고 이름을 준다. */
export const LEDGER_PAYER_SCOPE_ALL: LedgerPayerScope = null;

/**
 * 기록에 등장한 주체들. **가나다순**이고, `공동` 은 언제나 마지막이다.
 *
 * ⚠ 공동을 마지막에 두는 이유: 사람 이름들이 먼저 오면 목록이 "누구누구"로 읽히고, 공동은
 *   그 사람들의 공통분모라 뒤가 자연스럽다. 정렬에 섞으면 이름에 따라 자리가 오락가락한다.
 */
export const collectPayers = (entries: readonly LedgerEntry[]): readonly string[] => {
  const named = new Set<string>();
  let hasShared = false;

  for (const entry of entries) {
    /* 🔴 지운 행은 세지 않는다 — 없는 사람이 목록에 남는다. */
    if ((entry.status ?? '').trim().length > 0) continue;
    if (isSharedPayer(entry.payer)) {
      hasShared = true;
      continue;
    }
    const payer = (entry.payer ?? '').trim();
    if (payer.length > 0) named.add(payer);
  }

  const sorted = [...named].sort((left, right) => left.localeCompare(right, 'ko'));
  return hasShared ? [...sorted, LEDGER_PAYER_SHARED] : sorted;
};

/**
 * 주체 필터를 **보여 줄 만한가.**
 *
 * 🔴 둘 이상이어야 한다. 하나뿐이면 고를 것이 없고, 선택지 하나인 컨트롤은 화면의 거짓말이다.
 */
export const shouldOfferPayerScope = (payers: readonly string[]): boolean => payers.length >= 2;

/** 고른 주체의 기록만. `null` 이면 전부 그대로. */
export const filterByPayerScope = (
  entries: readonly LedgerEntry[],
  scope: LedgerPayerScope
): readonly LedgerEntry[] => {
  if (scope === null) return entries;
  if (scope === LEDGER_PAYER_SHARED) return entries.filter((entry) => isSharedPayer(entry.payer));
  return entries.filter((entry) => (entry.payer ?? '').trim() === scope);
};

/**
 * 고른 주체가 사라졌으면 전체로 되돌린다.
 *
 * 🔴 이 보정이 없으면 **빈 목록**이 나온다: `아내` 로 좁혀 보다가 그 사람의 기록이 하나도 없는
 *    달로 넘기면 화면이 텅 비고, 사용자는 기록이 사라진 줄 안다.
 *    (달을 넘기는 것과 기록이 없어진 것은 다른 사실이다.)
 */
export const resolvePayerScope = (
  requested: LedgerPayerScope,
  payers: readonly string[]
): LedgerPayerScope => {
  if (requested === null) return null;
  return payers.includes(requested) ? requested : null;
};
