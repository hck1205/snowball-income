/**
 * **고정비 이어가기** — 지난달의 고정비를 이번 달 초안으로 만든다. 순수 함수.
 *
 * 왜 필요한가
 * ---------------------------------------------------------------------------
 * 고정비는 정의상 매달 같은 자리에서 같은 돈이 나간다. 그런데 분석한 시트에서 사람들은 그것을
 * **매달 손으로 다시 적고 있었다** — 월세·관리비·통신비·보험료를 열두 번씩. 우리는 `fixity` 축을
 * 이미 갖고 있으니, 그 반복을 한 번의 확인으로 접을 수 있다. 헤비 유저 체감이 가장 큰 자리다.
 *
 * 🔴 이 파일은 **제안만 만든다.** 시트에 쓰는 것은 호출부이고, 쓰기 전에 사용자가 목록을 보고
 *    확인한다 — 남의 시트에 열 줄을 한 번에 넣는 일이라 되돌리기가 비싸다.
 */
import type { LedgerDraft, LedgerEntry } from '@/shared/lib/googleSheets';
import { LEDGER_PAYER_SHARED } from '@/shared/constants/ledger';
import { addMonths, monthCursorOfISO, type LedgerMonthCursor } from './ledgerFormat';

/**
 * 반복 거래의 **정체성**. 같은 정체성이 이번 달에 이미 있으면 다시 넣지 않는다.
 *
 * 🔴 **금액을 빼고 본다.** 관리비처럼 달마다 액수가 바뀌는 고정비가 있는데, 금액까지 넣어 비교하면
 *    "이미 넣었는데 액수를 고친" 항목이 새것으로 보여 두 줄이 된다. 무엇에·누가·무엇으로가 같으면
 *    같은 청구다.
 */
const identityOf = (entry: { category: string; subcategory?: string; payer?: string; method?: string }): string =>
  [
    entry.category.trim(),
    (entry.subcategory ?? '').trim(),
    (entry.payer ?? '').trim() || LEDGER_PAYER_SHARED,
    (entry.method ?? '').trim()
  ].join('');

/** 그 달의 마지막 날. 31일 고정비를 2월로 옮길 때 28/29일로 접기 위해 쓴다. */
const lastDayOf = (cursor: LedgerMonthCursor): number => new Date(cursor.year, cursor.month, 0).getDate();

const pad2 = (value: number): string => String(value).padStart(2, '0');

/**
 * 같은 **일(day)** 을 목표 달로 옮긴다. 그 달에 없는 날짜면 말일로 접는다.
 *
 * ⚠ 31일 → 2월 28일이 되는 것은 의도다. 청구일이 말일인 고정비를 다음 달 1일로 밀면 그 달의
 *   합계에서 빠져 월 비교가 어긋난다.
 */
const moveToMonth = (isoDate: string, target: LedgerMonthCursor): string => {
  const day = Number(isoDate.slice(8, 10));
  const safeDay = Number.isFinite(day) && day >= 1 ? Math.min(day, lastDayOf(target)) : 1;
  return `${target.year}-${pad2(target.month)}-${pad2(safeDay)}`;
};

/** 이어갈 후보 한 건. 화면이 목록으로 보여 주고, 사용자가 확인하면 그대로 초안이 된다. */
export type CarryOverCandidate = {
  /** 목록의 key. 정체성 그대로라 같은 청구가 두 줄로 서지 않는다. */
  readonly id: string;
  readonly draft: LedgerDraft;
  /** 화면 표시용 — 어디서 왔는지 사용자가 알아볼 수 있게. */
  readonly label: string;
};

/**
 * 지난달 고정비 중 **이번 달에 아직 없는 것**을 초안으로 만든다.
 *
 * @param entries 시트에서 읽은 전부.
 * @param target  이어 넣을 달(보통 지금 보고 있는 달).
 *
 * 규칙:
 *   - 대상은 **`fixity === 'fixed'`** 인 것뿐이다. 사용자가 고정이라고 표시한 것만 반복한다 —
 *     앱이 "매달 나오는 것 같다"고 추측해 넣으면 그건 사용자가 적지 않은 기록이 된다.
 *   - 수입·지출·이체를 가리지 않는다. 급여도 자동이체 저축도 고정일 수 있고, 그 판단은 사용자 것이다.
 *   - 이번 달에 **같은 정체성**이 이미 있으면 뺀다(두 번 눌러도 두 줄이 되지 않는다).
 *   - 지난달에 같은 정체성이 여러 건이면 **한 건으로 접는다**(가장 마지막 것).
 */
export const collectCarryOverCandidates = (
  entries: readonly LedgerEntry[],
  target: LedgerMonthCursor
): CarryOverCandidate[] => {
  const source = addMonths(target, -1);

  const inMonth = (entry: LedgerEntry, cursor: LedgerMonthCursor): boolean => {
    const entryCursor = monthCursorOfISO(entry.date);
    return entryCursor !== null && entryCursor.year === cursor.year && entryCursor.month === cursor.month;
  };

  /* 이번 달에 이미 있는 정체성 — 고정 여부를 가리지 않는다(손으로 먼저 넣었을 수 있다). */
  const alreadyHere = new Set(entries.filter((entry) => inMonth(entry, target)).map(identityOf));

  /* 지난달 고정비를 정체성별로 접는다. 나중 것이 이긴다(가장 최근 금액을 물려준다). */
  const byIdentity = new Map<string, LedgerEntry>();
  for (const entry of entries) {
    if (entry.fixity !== 'fixed') continue;
    if (!inMonth(entry, source)) continue;
    byIdentity.set(identityOf(entry), entry);
  }

  const candidates: CarryOverCandidate[] = [];
  for (const [id, entry] of byIdentity) {
    if (alreadyHere.has(id)) continue;

    const subcategory = (entry.subcategory ?? '').trim();
    const payer = (entry.payer ?? '').trim();
    const method = (entry.method ?? '').trim();
    const memo = (entry.memo ?? '').trim();

    candidates.push({
      id,
      draft: {
        date: moveToMonth(entry.date, target),
        kind: entry.kind,
        amount: Math.abs(entry.amount),
        category: entry.category.trim(),
        ...(subcategory ? { subcategory } : {}),
        ...(payer ? { payer } : {}),
        ...(method ? { method } : {}),
        fixity: 'fixed',
        ...(memo ? { memo } : {})
      },
      label: subcategory ? `${entry.category.trim()} · ${subcategory}` : entry.category.trim()
    });
  }

  /* 금액 큰 것부터 — 월세처럼 큰 고정비를 먼저 확인하게 된다. */
  return candidates.sort((left, right) => right.draft.amount - left.draft.amount);
};
