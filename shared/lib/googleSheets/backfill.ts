/**
 * **되채워 쓰기** — 히포가 정한 분류를 시트의 그 행에 적어 준다. 순수 계획만(네트워크 없음).
 *
 * ## 왜 되적나
 *
 * 분류를 앱 안에서만 알고 있으면 두 세계가 어긋난다. 시트를 단독으로 열면 항목 칸이 비어 있고,
 * `월별 요약`·`현금흐름` 의 `SUMIFS` 는 그 빈 칸을 못 세어 **요약이 통째로 0** 이 된다.
 * 시트에 적어 주면 앱과 시트가 같은 것을 본다.
 *
 * ## 🔴 규칙 셋 — 어기면 남의 기록이 사라진다
 *
 * 1. **빈 칸만 채운다.** 적혀 있던 칸은 절대 건드리지 않는다. 앱의 판단이 더 맞다고 생각되더라도
 *    덮어쓰는 것은 남의 기록을 지우는 일이고, 원본이 사라지므로 되돌릴 수 없다.
 *    이 규칙은 `parse.ts` 가 `filled` 를 만들 때 이미 지켜지고, 여기서 한 번 더 확인한다
 *    (두 겹으로 막는 이유: 하나가 뚫리면 조용히 데이터가 상한다).
 * 2. **매핑된 열만 쓴다.** 사용자가 고른 기존 시트에는 `상세항목` 열이 없을 수 있다.
 *    없는 열에 쓰려 하면 엉뚱한 칸에 값이 들어간다.
 * 3. **쓸 것이 없으면 요청을 만들지 않는다.** 빈 batchUpdate 를 보내면 실패는 안 하지만
 *    "저장했습니다"라는 거짓 신호가 사용자에게 간다.
 *
 * ## ⚠ 되적기는 사용자가 시작한다
 *
 * 자동으로 조용히 쓰지 않는다. 남의 시트에 여러 줄을 한 번에 넣는 일이라, 되돌리려면 하나씩
 * 지워야 한다 — `고정비 이어가기` 와 같은 처방(버튼 → 목록 → 확인)을 쓴다.
 */
import { LEDGER_FIELDS, ledgerErr, ledgerError, ledgerOk } from './types';
import type { ColumnMapping, LedgerEntry, LedgerField, LedgerResult, SheetValueRange } from './types';
import { planFieldUpdate } from './writeSafety';

/** 되적을 한 행. */
export type BackfillTarget = {
  readonly rowNumber: number;
  /** 이 행에서 채울 칸들. 시트에 적을 글자 그대로. */
  readonly cells: Readonly<Partial<Record<LedgerField, string>>>;
};

/**
 * 되적을 대상을 고른다.
 *
 * 🔴 `entry.filled` 를 그대로 믿지 않고 **`entry.seen` 이 실제로 빈 칸인지** 다시 본다.
 *    규칙 1을 두 겹으로 막는 자리다.
 */
export const collectBackfillTargets = (
  entries: readonly LedgerEntry[],
  mapping: ColumnMapping
): readonly BackfillTarget[] => {
  const targets: BackfillTarget[] = [];

  for (const entry of entries) {
    if (!entry.filled) continue;
    /* 지운 행은 되적지 않는다 — 요약에서 빠지는 행에 분류를 넣는 것은 뜻이 없다. */
    if ((entry.status ?? '').trim().length > 0) continue;

    const cells: Partial<Record<LedgerField, string>> = {};
    for (const [rawField, value] of Object.entries(entry.filled)) {
      const field = rawField as LedgerField;
      /* 우리가 아는 필드가 아니면 버린다. */
      if (!(LEDGER_FIELDS as readonly string[]).includes(field)) continue;
      /* 규칙 2 — 매핑되지 않은 열에는 쓸 수 없다. */
      if (mapping[field] === undefined) continue;
      /* 규칙 1 — 읽을 때 빈 칸이었던 자리만. */
      if ((entry.seen[field] ?? '').trim().length > 0) continue;
      if (value.trim().length === 0) continue;
      cells[field] = value;
    }

    if (Object.keys(cells).length > 0) targets.push({ rowNumber: entry.ref.rowNumber, cells });
  }

  return targets;
};

/** 되적기 계획. */
export type BackfillPlan = {
  readonly data: readonly SheetValueRange[];
  /** 몇 행을 고치나. 화면이 "12건을 채웁니다"라고 말할 근거다. */
  readonly rowCount: number;
  /** 몇 칸을 채우나. */
  readonly cellCount: number;
};

/**
 * 되적기 계획을 만든다. 쓸 것이 없으면 실패로 돌려준다 — 규칙 3.
 *
 * ⚠ 셀 단위 범위를 행마다 만든다(`planFieldUpdate` 재사용). 행 범위를 통째로 만드는 경로는
 *   이 레포에 없다 — 그러면 매핑되지 않은 열까지 덮어쓴다(AC-W3).
 */
export const planBackfill = (params: {
  readonly sheetTitle: string;
  readonly mapping: ColumnMapping;
  readonly targets: readonly BackfillTarget[];
}): LedgerResult<BackfillPlan> => {
  const { sheetTitle, mapping, targets } = params;
  if (targets.length === 0) return ledgerErr(ledgerError('invalid-entry'));

  const data: SheetValueRange[] = [];
  for (const target of targets) {
    const planned = planFieldUpdate({
      sheetTitle,
      mapping,
      rowNumber: target.rowNumber,
      cells: target.cells
    });
    /* 한 행이라도 계획이 안 서면 전체를 무른다 — 절반만 채우면 어디까지 됐는지 알 수 없다. */
    if (!planned.ok) return planned;
    data.push(...planned.value);
  }

  return ledgerOk({
    data,
    rowCount: targets.length,
    cellCount: data.length
  });
};
