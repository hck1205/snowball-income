/**
 * 가로 월별 블록 시트 **읽기**. `layout.ts` 가 알아본 치수로 블록을 하나씩 펴서 이어 붙인다.
 *
 * 🔴 **읽기 전용이다.** 이 경로로 들어온 스냅샷에는 쓰기를 허용하지 않는다.
 *
 *   왜: 블록 레이아웃에서는 **행 번호가 행을 식별하지 못한다.** 12행은 1월 블록에도 있고 7월
 *   블록에도 있으며, 두 칸은 서로 다른 기록이다. 앱의 쓰기 안전 규칙(`LedgerRowRef` = 스냅샷 +
 *   행 번호)은 "행 번호 하나가 행 하나"라는 전제 위에 서 있고, 그 전제가 여기서는 성립하지 않는다.
 *   전제를 억지로 늘려 열 좌표까지 참조에 넣으면, 그 순간 물리 삭제·충돌 감지·재시도 대기열이
 *   전부 두 좌표계를 알아야 한다 — 남의 시트에 쓰다 한 칸이 어긋나면 그건 남의 가계부가 망가지는
 *   일이다. **읽어서 보여 주는 것까지가 이 기능의 약속이고, 그 약속을 코드가 지킨다.**
 *
 *   쓰려는 사용자에게는 앱 스키마 시트를 새로 만들어 주는 길이 이미 있다(`createLedgerSheet`).
 *
 * ⚠ 이 파일은 **네트워크만 담당**한다. 모양 판정은 `layout.ts`, 값 해석은 `parse.ts` 다.
 */
import { openColumnRange } from './a1';
import { allBlockMappings, type MonthBlockLayout } from './layout';
import { mappedColumnIndices } from './mapping';
import { parseLedgerColumns } from './parse';
import { fetchColumnValues, type SheetsRequestContext } from './sheetsApi';
import { ledgerErr, ledgerOk } from './types';
import type { LedgerEntry, LedgerKind, LedgerResult, UnreadableRow } from './types';

/**
 * 실제 열과 절대 겹치지 않는 합성 열 자리. 시트의 열 수가 이 값에 닿는 일은 없다
 * (구글 시트의 열 상한은 18,278이다).
 */
const SYNTHETIC_KIND_COLUMN = Number.MAX_SAFE_INTEGER;

/** 합성 구분 열에 채울 글자. `parseLedgerKind` 가 알아보는 낱말이어야 한다. */
const KIND_CELL: Readonly<Record<LedgerKind, string>> = {
  income: '수입',
  expense: '지출',
  transfer: '이체'
};

/** 블록 시트에서 읽어 온 결과. 스냅샷과 달리 **쓰기 참조가 없다**(읽기 전용). */
export type MonthBlockReadResult = {
  /** 읽은 항목. 블록 순서 → 행 순서로 이어 붙인 것이다. */
  readonly entries: readonly Omit<LedgerEntry, 'ref'>[];
  readonly unreadableRows: readonly UnreadableRow[];
  /** 실제로 값이 하나라도 있던 블록 수 — "15개월 중 3개월만 쓰셨습니다"를 말하기 위한 값. */
  readonly blocksWithData: number;
};

export type MonthBlockReadParams = {
  readonly spreadsheetId: string;
  readonly sheetTitle: string;
  readonly layout: MonthBlockLayout;
  /**
   * `구분` 열이 없는 시트를 무엇으로 읽을지. **호출부가 사용자에게 물어서** 넘긴다 —
   * 여기서 기본값을 정하면 수입이 섞인 시트에서 숫자가 조용히 틀어진다(`needsKindAssumption` 참고).
   */
  readonly assumeKind?: LedgerKind;
};

/**
 * 블록 전부를 읽어 한 줄기로 편다.
 *
 * 요청 수: 블록마다 매핑된 열 수만큼. 15블록 × 5열이면 75범위인데, `values:batchGet` 은 이를
 * **한 번의 호출**로 받는다(범위 목록을 한 요청에 싣는다). 429 예산을 지키는 자리다.
 */
export const readMonthBlockSheet = async (
  context: SheetsRequestContext,
  params: MonthBlockReadParams
): Promise<LedgerResult<MonthBlockReadResult>> => {
  const { spreadsheetId, sheetTitle, layout, assumeKind } = params;
  const mappings = allBlockMappings(layout);

  /* 블록별 열 인덱스를 한 벌로 모아 **한 번에** 요청한다. */
  const perBlockIndices = mappings.map((mapping) => mappedColumnIndices(mapping));
  const ranges = perBlockIndices.flatMap((indices) =>
    indices.map((columnIndex) => openColumnRange(sheetTitle, columnIndex, layout.firstDataRow))
  );

  const read = await fetchColumnValues(context, { spreadsheetId, ranges });
  if (!read.ok) return ledgerErr(read.error);

  const entries: Omit<LedgerEntry, 'ref'>[] = [];
  const unreadableRows: UnreadableRow[] = [];
  let blocksWithData = 0;
  let cursor = 0;

  mappings.forEach((mapping, blockIndex) => {
    const indices = perBlockIndices[blockIndex];
    const columns = new Map<number, readonly string[]>();
    let height = 0;
    indices.forEach((columnIndex) => {
      const values = read.value[cursor] ?? [];
      columns.set(columnIndex, values);
      if (values.length > height) height = values.length;
      cursor += 1;
    });

    /*
     * 🔴 `구분` 열이 없는 시트를 위한 **합성 열**.
     *
     * 그런 시트에서 `innerMapping.kind` 는 날짜 열을 빌려 쓰고 있다(layout.ts 참고). 그대로 파싱하면
     * 구분 칸에서 `2026-01-03` 을 읽어 **모든 행이 "구분을 읽을 수 없습니다"로 떨어진다** —
     * 시트는 멀쩡한데 한 줄도 안 들어오는, 가장 알아채기 어려운 실패다.
     * 그래서 실제 열과 겹치지 않는 자리에 가짜 열을 하나 만들어 호출부가 정한 구분을 채운다.
     * 요청 범위(`perBlockIndices`)는 **진짜 열만** 쓰므로 네트워크에는 영향이 없다.
     */
    const hasOwnKindColumn = mapping.kind !== mapping.date;
    const parseMapping = hasOwnKindColumn ? mapping : { ...mapping, kind: SYNTHETIC_KIND_COLUMN };
    if (!hasOwnKindColumn) {
      columns.set(SYNTHETIC_KIND_COLUMN, Array.from({ length: height }, () => KIND_CELL[assumeKind ?? 'expense']));
    }

    const parsed = parseLedgerColumns({ mapping: parseMapping, columns, firstDataRow: layout.firstDataRow });
    if (parsed.rows.length > 0) blocksWithData += 1;

    for (const row of parsed.rows) {
      if (row.ok) {
        const { rowNumber: _rowNumber, ...rest } = row.entry;
        entries.push(assumeKind ? { ...rest, kind: assumeKind } : rest);
      } else {
        /*
         * 🔴 행 번호에 블록을 함께 말해야 한다. 그냥 "12행"이라고 하면 사용자가 시트에서 15칸 중
         *    어디를 봐야 할지 알 수 없다 — 못 읽은 행을 못 찾으면 보고가 소음이 된다.
         */
        unreadableRows.push({
          rowNumber: row.unreadable.rowNumber,
          reasons: row.unreadable.reasons.map((reason) => `${blockIndex + 1}번째 달 · ${reason}`)
        });
      }
    }
  });

  return ledgerOk({ entries, unreadableRows, blocksWithData });
};
