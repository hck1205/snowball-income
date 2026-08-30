import { useCallback, useMemo, useState } from 'react';
import { appendLedgerEntries, collectBackfillTargets, planBackfill, writeValues } from '@/shared/lib/googleSheets';
import { formatKRW } from '@/shared/utils';
import { LEDGER_COPY } from '../copy';
import type { CarryOverCandidate } from '../utils';
import { formatEntryDate } from '../utils';
import type { LedgerBackfillModel, LedgerCarryOverModel } from '../types';
import type { LedgerConnection } from './useLedgerConnection';

const copy = LEDGER_COPY;

/**
 * 시트에 **여러 줄을 한 번에 쓰는** 두 기능 — 고정비 이어가기 · 되채워 쓰기.
 *
 * ## 왜 한 훅인가 (2026-08-31 리팩터)
 * `useLedgerWrite` 는 848줄에 **독립된 상태기계 다섯**을 담고 있었다(폼 세션 · 삭제 · 실패 큐 ·
 * 이월 · 되적기). 그중 이 둘은 성격이 같고 나머지와 거의 얽히지 않는다 — 둘 다
 * **"사용자가 시작하는 일괄 쓰기"** 이고, 바깥으로 새는 것은 완료 보고와 안내 문구뿐이다.
 *
 * 🔴 **공개 API 는 한 글자도 바뀌지 않았다.** `useLedgerWrite` 가 이 훅을 부르고 같은 이름으로
 * 그대로 돌려준다 — 그래서 Ledger 테스트 35파일이 이 리팩터의 보호막이 된다.
 *
 * ## 🔴 둘 다 **자동으로 조용히 쓰지 않는다**
 * 남의 시트에 여러 줄을 한 번에 넣는 일이라, 되돌리려면 넣은 줄을 하나씩 지워야 한다. 그래서
 * 이월은 **두 단계**(목록을 보이고 확인받는다)이고 되적기는 사용자가 버튼으로 시작한다.
 */
export type LedgerBatchWritesDeps = {
  connection: LedgerConnection;
  /** 이번 달로 이어갈 고정비 후보. 판정은 호출부(`useLedgerWrite`)의 파생값이 소유한다. */
  carryOverCandidates: readonly CarryOverCandidate[];
  /**
   * 일괄 쓰기의 **부분 실패까지 포함한 결과**.
   * 🔴 뭉뚱그리지 않고 숫자를 그대로 올린다 — "일부 실패"는 이 화면의 금지어다.
   */
  onBatchReport: (report: { successCount: number; totalCount: number }) => void;
  /** 화면 낭독기에 알릴 한 줄(무음 성공 금지). */
  onAnnounce: (message: string) => void;
};

export const useLedgerBatchWrites = ({
  connection,
  carryOverCandidates,
  onBatchReport,
  onAnnounce
}: LedgerBatchWritesDeps) => {
  /* ── 고정비 이어가기 ──────────────────────────────────────────────────────
   * 🔴 **두 단계**다. 목록을 먼저 보이고, 확인해야 쓴다 — 남의 시트에 여러 줄을 한 번에 넣는
   *    일이라 한 번의 오조작이 비싸다. 되돌리려면 넣은 줄을 하나씩 지워야 한다.
   */
  const [carryOverOpen, setCarryOverOpen] = useState(false);
  const [isCarryingOver, setIsCarryingOver] = useState(false);

  const openCarryOver = useCallback(() => setCarryOverOpen(true), []);
  const closeCarryOver = useCallback(() => setCarryOverOpen(false), []);

  const confirmCarryOver = useCallback(() => {
    if (carryOverCandidates.length === 0) return;
    const context = connection.readContext();
    const { link, snapshot } = connection;
    if (context === null || link === null || snapshot === null) return;

    setIsCarryingOver(true);
    void (async () => {
      const report = await appendLedgerEntries(context, {
        link,
        snapshot,
        drafts: carryOverCandidates.map((candidate) => candidate.draft)
      });

      setIsCarryingOver(false);
      setCarryOverOpen(false);
      /* 🔴 부분 실패도 숫자로 그대로 말한다 — "일부 실패" 같은 뭉뚱그린 문구는 이 화면의 금지어다. */
      onBatchReport({ successCount: report.successCount, totalCount: report.items.length });
      onAnnounce(copy.carryOver.live(report.successCount, report.items.length));
      await connection.refresh();
    })();
  }, [carryOverCandidates, connection, onAnnounce, onBatchReport]);

  const carryOver: LedgerCarryOverModel | null = useMemo(() => {
    if (carryOverCandidates.length === 0) return null;
    return {
      count: carryOverCandidates.length,
      isOpen: carryOverOpen,
      isSaving: isCarryingOver,
      rows: carryOverCandidates.map((candidate) => ({
        id: candidate.id,
        label: candidate.label,
        amountText: formatKRW(candidate.draft.amount),
        dateText: formatEntryDate(candidate.draft.date)
      }))
    };
  }, [carryOverCandidates, carryOverOpen, isCarryingOver]);

  /* ── 되채워 쓰기 (2026-08-09) ──────────────────────────────────────────────── */

  const [isBackfilling, setIsBackfilling] = useState(false);

  /**
   * 히포가 채운 분류 중 **시트에는 아직 없는** 것들.
   *
   * 🔴 `collectBackfillTargets` 가 `seen` 을 다시 보고 **빈 칸이던 자리만** 고른다 — 적어 둔 말을
   *    덮지 않는다. 그 확인이 파서(`filled` 를 만들 때)와 여기 두 곳에 있는 이유는, 하나가 뚫리면
   *    조용히 데이터가 상하기 때문이다.
   */
  const backfillTargets = useMemo(() => {
    const { link, snapshot } = connection;
    if (link === null || snapshot === null) return [];
    return collectBackfillTargets(snapshot.entries, link.mapping);
  }, [connection]);

  /**
   * 되적기 실행.
   *
   * ⚠ **사용자가 시작한다.** 자동으로 조용히 쓰지 않는다 — 남의 시트에 여러 줄을 한 번에 넣는
   *   일이라 되돌리려면 하나씩 지워야 한다(`고정비 이어가기` 와 같은 처방).
   */
  const runBackfill = useCallback(() => {
    const context = connection.readContext();
    const { link } = connection;
    if (context === null || link === null || backfillTargets.length === 0) return;

    const planned = planBackfill({
      sheetTitle: link.sheetTitle,
      mapping: link.mapping,
      targets: backfillTargets
    });
    if (!planned.ok) return;

    setIsBackfilling(true);
    void (async () => {
      const result = await writeValues(context, {
        spreadsheetId: link.spreadsheetId,
        data: planned.value.data
      });
      setIsBackfilling(false);

      if (!result.ok) {
        connection.applyError(result.error);
        return;
      }
      onAnnounce(copy.backfill.live(planned.value.rowCount));
      await connection.refresh();
    })();
  }, [backfillTargets, connection, onAnnounce]);

  const backfill: LedgerBackfillModel | null = useMemo(() => {
    if (backfillTargets.length === 0) return null;
    return { count: backfillTargets.length, isSaving: isBackfilling };
  }, [backfillTargets.length, isBackfilling]);

  return { carryOver, openCarryOver, closeCarryOver, confirmCarryOver, backfill, runBackfill };
};
