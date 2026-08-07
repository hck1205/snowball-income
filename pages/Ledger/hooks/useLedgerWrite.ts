import { useCallback, useMemo, useRef, useState } from 'react';
import {
  HARD_DELETE_CONFIRMATION,
  appendLedgerEntries,
  deleteLedgerEntry,
  updateLedgerEntry
} from '@/shared/lib/googleSheets';
import type { LedgerDraft, LedgerEntry, LedgerError, LedgerPatch } from '@/shared/lib/googleSheets';
import { formatKRW } from '@/shared/utils';
import { LEDGER_COPY } from '../copy';
import type {
  LedgerDraftForm,
  LedgerErrorModel,
  LedgerFormModel,
  LedgerPartialFailureModel,
  LedgerPendingAction,
  LedgerRemoveTarget,
  LedgerRowFailure,
  LedgerRowModel
} from '../types';
import {
  formatEntryDate,
  isExpiredCode,
  kindLabel,
  nextRetryDelaySec,
  parseLedgerAmount,
  toErrorModel,
  toFailureReason,
  toISODate,
  validateLedgerForm
} from '../utils';
import type { LedgerConnection } from './useLedgerConnection';
import type { RetryCountdown } from './useRetryCountdown';

const copy = LEDGER_COPY;

/** 아직 시트에 들어가지 못한 한 건. 화면에서 **사라지지 않는다**(토스트 금지). */
type QueuedFailure = {
  id: string;
  draft: LedgerDraftForm;
  row: LedgerRowModel;
};

type FormSession = {
  mode: 'create' | 'edit';
  /** 수정 대상 행 id. `create` 면 `null`. */
  targetId: string | null;
  draft: LedgerDraftForm;
  errors: Partial<Record<keyof LedgerDraftForm, string>>;
  isSaving: boolean;
  writeError: LedgerErrorModel | null;
};

export type LedgerWrite = {
  form: LedgerFormModel | null;
  isFormOpen: boolean;
  removeTarget: LedgerRemoveTarget | null;
  isRemoving: boolean;
  removeError: LedgerErrorModel | null;
  /** 행 id → 실패. 그 행 아래 실패 줄로 잔류한다. */
  rowFailures: ReadonlyMap<string, LedgerRowFailure>;
  partialFailure: LedgerPartialFailureModel | null;
  liveMessage: string;
  /** 삭제 성공 뒤 포커스를 옮길 행 id(없으면 `null` — 호출부가 목록 제목으로 보낸다). */
  focusAfterRemoveId: string | null;
  clearFocusAfterRemove: () => void;

  openCreateForm: () => void;
  openEditForm: (id: string) => void;
  changeForm: (patch: Partial<LedgerDraftForm>) => void;
  submitForm: () => void;
  closeForm: () => void;

  requestRemove: (id: string) => void;
  confirmRemove: () => void;
  closeRemove: () => void;

  retryRow: (id: string) => void;
  retryAll: () => void;
  /** 만료 배너의 "다시 연결" — 재연결 성공 시 하던 작업을 이어서 실행한다. */
  resumePending: () => void;
};

const toDraftForm = (entry: LedgerEntry): LedgerDraftForm => ({
  date: entry.date,
  kind: entry.kind,
  amount: String(Math.abs(entry.amount)),
  category: entry.category,
  subcategory: entry.subcategory ?? '',
  /* 공동은 시트에서 빈 칸이라 폼에서도 빈 칸이다 — "공동"이라는 글자를 되살리지 않는다. */
  payer: entry.payer ?? '',
  method: entry.method ?? '',
  isFixed: entry.fixity === 'fixed',
  memo: entry.memo ?? ''
});

const toLedgerDraft = (draft: LedgerDraftForm): LedgerDraft => ({
  date: draft.date.trim(),
  kind: draft.kind,
  amount: parseLedgerAmount(draft.amount),
  category: draft.category.trim(),
  subcategory: draft.subcategory.trim(),
  payer: draft.payer.trim(),
  method: draft.method.trim(),
  fixity: draft.isFixed ? 'fixed' : 'variable',
  memo: draft.memo.trim()
});

/**
 * 새 항목 폼의 시작값.
 *
 * 🔴 **직전에 저장한 값 일부를 물려준다**(연속 입력). 분석한 시트에서 사람들은 같은 날 여러 건을
 *    이어서 적고, 그 시트는 날짜·항목 칸을 아예 비워 "위와 같음"을 표현했다. 앱에서 그 관습을
 *    되살리는 방법이 프리필이다 — 물려주는 것은 **또 칠 가능성이 높은 축**(날짜·주체·결제수단·구분)
 *    뿐이고, 금액·상세내용처럼 건마다 다른 값은 반드시 비운다(직전 금액이 남으면 오기입이 난다).
 */
const nextDraftForm = (now: Date, previous: LedgerDraftForm | null): LedgerDraftForm => ({
  date: previous?.date ?? toISODate(now),
  kind: previous?.kind ?? 'expense',
  amount: '',
  category: '',
  subcategory: '',
  payer: previous?.payer ?? '',
  method: previous?.method ?? '',
  isFixed: false,
  memo: ''
});

/** 폼 값 → 대기열에 남을 행 모델. 시트에 없으므로 id 는 대기열이 만든다. */
const toQueuedRow = (id: string, draft: LedgerDraftForm, failure: LedgerRowFailure): LedgerRowModel => {
  const amount = Math.abs(parseLedgerAmount(draft.amount));
  return {
    id,
    dateISO: draft.date,
    dateText: formatEntryDate(draft.date),
    kind: draft.kind,
    category: draft.category,
    amount,
    amountText: formatKRW(Number.isFinite(amount) ? amount : 0),
    memo: draft.memo,
    failure
  };
};

/** **바뀐 필드만** 담는다 — 행 단위 덮어쓰기 금지(AC-W3). */
const toPatch = (before: LedgerDraftForm, after: LedgerDraftForm): LedgerPatch => {
  const patch: Record<string, unknown> = {};
  if (before.date !== after.date) patch.date = after.date.trim();
  if (before.kind !== after.kind) patch.kind = after.kind;
  if (before.amount !== after.amount) patch.amount = parseLedgerAmount(after.amount);
  if (before.category !== after.category) patch.category = after.category.trim();
  /* 🔴 v2 축을 빠뜨리면 화면에서는 고쳐지는데 시트에는 안 들어간다(가장 조용한 실패다). */
  if (before.subcategory !== after.subcategory) patch.subcategory = after.subcategory.trim();
  if (before.payer !== after.payer) patch.payer = after.payer.trim();
  if (before.method !== after.method) patch.method = after.method.trim();
  if (before.isFixed !== after.isFixed) patch.fixity = after.isFixed ? 'fixed' : 'variable';
  if (before.memo !== after.memo) patch.memo = after.memo.trim();
  return patch as LedgerPatch;
};

/**
 * 쓰기(추가·수정·삭제)와 그 실패의 잔류.
 *
 * 🔴 **토스트를 쓰지 않는다.** 사라지는 알림은 실패 사유와 재시도 경로를 함께 잃는다. 실패는
 * ①폼 안 배너(모달을 닫지 않는다) ②행 아래 실패 줄 ③"저장하지 못한 기록" 목록 — 세 표면에 **남는다**.
 * 🔴 **429 는 다른 실패와 다른 문장**을 쓰고 카운트다운을 받는다. 같은 문장이면 사용자가 연타한다.
 * 🔴 **삭제 성공 뒤에는 반드시 목록을 재조회**한다 — 물리 삭제로 행 번호가 밀려 옛 참조가 무효다.
 */
export function useLedgerWrite(params: {
  connection: LedgerConnection;
  entryById: ReadonlyMap<string, LedgerEntry>;
  categoryOptions: readonly string[];
  subcategoryOptions: readonly string[];
  payerOptions: readonly string[];
  methodOptions: readonly string[];
  rows: readonly LedgerRowModel[];
  countdown: RetryCountdown;
  now: Date;
}): LedgerWrite {
  const { connection, entryById, categoryOptions, subcategoryOptions, payerOptions, methodOptions, rows, countdown, now } =
    params;

  const [session, setSession] = useState<FormSession | null>(null);
  /*
   * 연속 입력 프리필의 근거값 — **마지막으로 저장에 성공한 폼**.
   * 🔴 state 가 아니라 ref 다. 이 값이 바뀌었다고 화면이 다시 그려질 이유가 없고(다음 폼을 열 때만
   *    읽는다), state 로 두면 저장할 때마다 목록 전체가 리렌더된다.
   */
  const lastSavedDraftRef = useRef<LedgerDraftForm | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<LedgerErrorModel | null>(null);
  const [rowFailures, setRowFailures] = useState<ReadonlyMap<string, LedgerRowFailure>>(() => new Map());
  const [queue, setQueue] = useState<readonly QueuedFailure[]>([]);
  const [batchReport, setBatchReport] = useState<{ successCount: number; totalCount: number } | null>(null);
  const [liveMessage, setLiveMessage] = useState('');
  const [focusAfterRemoveId, setFocusAfterRemoveId] = useState<string | null>(null);

  /** 재연결 뒤 이어서 실행할 작업. 🔴 만료가 사용자의 입력을 삼키지 않게 하는 유일한 장치다. */
  const pendingRef = useRef<LedgerPendingAction | null>(null);
  const queueSeqRef = useRef(0);
  const backoffRef = useRef(new Map<string, number>());
  /**
   * 목록 행에 남은 실패를 **다시 시도할 수 있게** 하는 최소 기억.
   * 실패한 수정은 사용자가 친 값을 그대로 들고 있어야 재시도가 같은 뜻을 갖는다(값을 버리고
   * "다시 시도"라고 말하면 시트의 옛 값을 다시 쓰는 셈이다).
   */
  const rowRetryRef = useRef(new Map<string, { kind: 'update'; draft: LedgerDraftForm } | { kind: 'remove' }>());

  /** 실패를 사유 + 대기 시간으로 접는다. 429 면 카운트다운을 시작한다. */
  const toRowFailure = useCallback(
    (id: string, error: LedgerError): LedgerRowFailure => {
      const reason = toFailureReason(error.code);
      const model = toErrorModel(reason);
      if (reason !== 'rateLimited') return { reason, body: model.body, retryAfterSec: null };

      const seconds = nextRetryDelaySec(backoffRef.current.get(id) ?? null, null);
      backoffRef.current.set(id, seconds);
      countdown.start(id, seconds);
      return { reason, body: model.body, retryAfterSec: seconds };
    },
    [countdown]
  );

  const openCreateForm = useCallback(() => {
    setSession({
      mode: 'create',
      targetId: null,
      // 기본 = 오늘(로컬 자정 기준) · 기본 구분 = 지출.
      draft: nextDraftForm(now, lastSavedDraftRef.current),
      errors: {},
      isSaving: false,
      writeError: null
    });
  }, [now]);

  const openEditForm = useCallback(
    (id: string) => {
      const entry = entryById.get(id);
      if (!entry) return;
      setSession({ mode: 'edit', targetId: id, draft: toDraftForm(entry), errors: {}, isSaving: false, writeError: null });
    },
    [entryById]
  );

  const changeForm = useCallback((patch: Partial<LedgerDraftForm>) => {
    setSession((previous) => (previous === null ? previous : { ...previous, draft: { ...previous.draft, ...patch } }));
  }, []);

  /**
   * 닫을 때 실패한 입력을 **버리지 않는다**.
   *  - 추가 실패 → "저장하지 못한 기록" 대기열로(시트에 그 행이 아직 없다).
   *  - 수정 실패 → 그 행의 실패 줄로(행은 시트에 있고, 사용자가 친 값은 재시도용으로 남는다).
   */
  const closeForm = useCallback(() => {
    // 🔴 `setSession` 업데이터 안에서 다른 상태를 건드리지 않는다 — StrictMode 가 업데이터를 두 번
    //    부르면 대기열에 같은 건이 두 번 들어간다. 판단은 클로저의 `session` 으로 한다.
    setSession(null);
    if (session === null || session.writeError === null) return;

    const failure: LedgerRowFailure = {
      reason: session.writeError.reason,
      body: session.writeError.body,
      retryAfterSec: null
    };

    if (session.mode === 'create') {
      queueSeqRef.current += 1;
      const id = `queued-${queueSeqRef.current}`;
      setQueue((items) => [...items, { id, draft: session.draft, row: toQueuedRow(id, session.draft, failure) }]);
      return;
    }

    const targetId = session.targetId;
    if (targetId === null) return;
    rowRetryRef.current.set(targetId, { kind: 'update', draft: session.draft });
    setRowFailures((items) => new Map(items).set(targetId, failure));
  }, [session]);

  /* ── 저장 ────────────────────────────────────────────────────────────────── */

  const runCreate = useCallback(
    async (draft: LedgerDraftForm): Promise<LedgerError | null> => {
      const context = connection.readContext();
      const { link, snapshot } = connection;
      if (context === null || link === null || snapshot === null) return null;

      const report = await appendLedgerEntries(context, { link, snapshot, drafts: [toLedgerDraft(draft)] });
      const failed = report.items.find((item) => !item.ok);
      return failed && !failed.ok ? failed.error : null;
    },
    [connection]
  );

  /** 한 건 수정. **바뀐 필드의 셀만** 쓴다(행 단위 덮어쓰기 없음). */
  const runUpdate = useCallback(
    async (id: string, draft: LedgerDraftForm): Promise<LedgerError | null> => {
      const context = connection.readContext();
      const { link, snapshot } = connection;
      const entry = entryById.get(id);
      if (context === null || link === null || snapshot === null || entry === undefined) return null;

      const result = await updateLedgerEntry(context, {
        link,
        snapshot,
        ref: entry.ref,
        seen: entry.seen,
        patch: toPatch(toDraftForm(entry), draft)
      });
      return result.ok ? null : result.error;
    },
    [connection, entryById]
  );

  /**
   * 실제 쓰기 한 번. `submitForm`(만료 가드를 통과한 뒤)과 `resumePending`(재연결 직후)이 **함께**
   * 쓴다 — 삭제의 `runRemove` 와 같은 자리다.
   *
   * 🔴 여기에 만료 가드를 두지 않는다. 재연결 콜백이 붙잡고 있는 클로저의 `connection.isExpired` 는
   * 아직 `true` 라(만료 해제는 **다음 렌더의** `connection` 에만 있다) 가드를 통과하지 못하고
   * 대기 작업만 다시 쌓인다 — 사용자가 "다시 연결하고 저장"을 두 번 눌러야 했던 원인이다.
   */
  const runSave = useCallback(
    async (mode: 'create' | 'edit', targetId: string | null, draft: LedgerDraftForm) => {
      setSession((previous) => (previous === null ? previous : { ...previous, errors: {}, isSaving: true, writeError: null }));

      let error: LedgerError | null = null;
      if (mode === 'create') {
        error = await runCreate(draft);
      } else if (targetId === null) {
        setSession((previous) => (previous === null ? previous : { ...previous, isSaving: false }));
        return;
      } else {
        error = await runUpdate(targetId, draft);
      }

      if (error !== null) {
        if (isExpiredCode(error.code)) {
          // 🔴 모달을 닫지 않는다. 입력값을 그대로 들고 재연결을 기다린다.
          pendingRef.current =
            mode === 'create' ? { intent: 'create', draft } : { intent: 'update', id: targetId ?? '', draft };
          connection.applyError(error);
          setSession((previous) => (previous === null ? previous : { ...previous, isSaving: false }));
          return;
        }

        const reason = toFailureReason(error.code);
        if (reason === 'conflict') connection.applyError(error);
        setSession((previous) =>
          previous === null ? previous : { ...previous, isSaving: false, writeError: toErrorModel(reason) }
        );
        return;
      }

      pendingRef.current = null;
      /*
       * 다음 "항목 추가"가 물려받을 값. **추가에서만** 기억한다 — 수정은 남의 과거 행을 고치는
       * 일이라, 그 값이 다음 새 항목의 기본이 되면 엉뚱한 날짜·수단이 딸려 온다.
       */
      if (mode === 'create') lastSavedDraftRef.current = draft;
      setSession(null);
      setLiveMessage(mode === 'create' ? copy.live.saved : copy.live.updated);
      await connection.refresh();
    },
    [connection, runCreate, runUpdate]
  );

  const submitForm = useCallback(() => {
    if (session === null) return;

    const errors = validateLedgerForm(session.draft);
    if (Object.keys(errors).length > 0) {
      setSession((previous) => (previous === null ? previous : { ...previous, errors, writeError: null }));
      return;
    }

    // 만료 중에는 시도조차 하지 않는다 — 대신 재연결 뒤 이어서 실행할 작업으로 남긴다.
    if (connection.isExpired) {
      pendingRef.current =
        session.mode === 'create'
          ? { intent: 'create', draft: session.draft }
          : { intent: 'update', id: session.targetId ?? '', draft: session.draft };
      return;
    }

    void runSave(session.mode, session.targetId, session.draft);
  }, [connection, runSave, session]);

  /* ── 삭제 ────────────────────────────────────────────────────────────────── */

  const requestRemove = useCallback((id: string) => {
    setRemoveError(null);
    setRemoveId(id);
  }, []);

  /** 실패한 채로 닫으면 그 행에 실패 줄이 남는다 — 다시 시도할 경로를 화면에서 잃지 않게. */
  const closeRemove = useCallback(() => {
    if (removeId !== null && removeError !== null) {
      rowRetryRef.current.set(removeId, { kind: 'remove' });
      const failure: LedgerRowFailure = {
        reason: removeError.reason,
        body: removeError.body,
        retryAfterSec: null
      };
      setRowFailures((items) => new Map(items).set(removeId, failure));
    }
    setRemoveId(null);
    setRemoveError(null);
  }, [removeError, removeId]);

  const runRemove = useCallback(
    async (id: string) => {
      const context = connection.readContext();
      const { link, snapshot } = connection;
      const entry = entryById.get(id);
      if (context === null || link === null || snapshot === null || entry === undefined) return;

      // 지우기 **전에** 다음 포커스 대상을 정한다 — 지운 뒤에는 그 행이 목록에 없다.
      const index = rows.findIndex((row) => row.id === id);
      const neighbour = rows[index + 1] ?? rows[index - 1] ?? null;

      setIsRemoving(true);
      // 앱이 만든 시트(= `상태` 열이 있는 시트)만 되돌릴 수 있는 소프트 삭제를 쓴다.
      const mode = link.createdByApp && link.mapping.status !== undefined ? 'soft' : 'hard';
      const result = await deleteLedgerEntry(context, {
        link,
        snapshot,
        ref: entry.ref,
        seen: entry.seen,
        mode,
        confirmation: mode === 'hard' ? HARD_DELETE_CONFIRMATION : undefined
      });
      setIsRemoving(false);

      if (!result.ok) {
        if (isExpiredCode(result.error.code)) {
          pendingRef.current = { intent: 'remove', id };
          connection.applyError(result.error);
          return;
        }
        const reason = toFailureReason(result.error.code);
        if (reason === 'conflict') connection.applyError(result.error);
        setRemoveError(toErrorModel(reason));
        return;
      }

      pendingRef.current = null;
      setRemoveId(null);
      setRemoveError(null);
      setLiveMessage(copy.live.removed);
      setFocusAfterRemoveId(neighbour === null ? null : neighbour.id);
      // 🔴 물리 삭제 성공 시 스냅샷이 폐기된다 — 재조회 없이는 이후 쓰기가 전부 거부된다.
      await connection.refresh();
    },
    [connection, entryById, rows]
  );

  const confirmRemove = useCallback(() => {
    if (removeId === null) return;
    void runRemove(removeId);
  }, [removeId, runRemove]);

  const clearFocusAfterRemove = useCallback(() => setFocusAfterRemoveId(null), []);

  /* ── 재시도 ──────────────────────────────────────────────────────────────── */

  const retryRow = useCallback(
    (id: string) => {
      const queued = queue.find((item) => item.id === id);
      if (queued !== undefined) {
        void (async () => {
          const error = await runCreate(queued.draft);
          if (error === null) {
            backoffRef.current.delete(id);
            countdown.clear(id);
            setQueue((items) => items.filter((item) => item.id !== id));
            setLiveMessage(copy.live.saved);
            await connection.refresh();
            return;
          }
          if (isExpiredCode(error.code)) {
            connection.applyError(error);
            return;
          }
          const failure = toRowFailure(id, error);
          setQueue((items) =>
            items.map((item) => (item.id === id ? { ...item, row: { ...item.row, failure } } : item))
          );
        })();
        return;
      }

      // 목록 행의 실패(수정·삭제)는 사용자가 마지막에 하려던 그 작업을 그대로 다시 실행한다.
      const retry = rowRetryRef.current.get(id);
      if (retry === undefined) return;

      if (retry.kind === 'remove') {
        void runRemove(id);
        return;
      }

      void (async () => {
        const error = await runUpdate(id, retry.draft);
        if (error === null) {
          rowRetryRef.current.delete(id);
          backoffRef.current.delete(id);
          countdown.clear(id);
          setRowFailures((previous) => {
            if (!previous.has(id)) return previous;
            const next = new Map(previous);
            next.delete(id);
            return next;
          });
          setLiveMessage(copy.live.updated);
          await connection.refresh();
          return;
        }
        if (isExpiredCode(error.code)) {
          pendingRef.current = { intent: 'update', id, draft: retry.draft };
          connection.applyError(error);
          return;
        }
        const failure = toRowFailure(id, error);
        setRowFailures((previous) => new Map(previous).set(id, failure));
      })();
    },
    [connection, countdown, queue, runCreate, runRemove, runUpdate, toRowFailure]
  );

  /** 여러 건을 **한 번에** 쓴다 — 결과가 `partial` 이면 그 숫자를 그대로 화면이 말한다. */
  const retryAll = useCallback(() => {
    if (queue.length === 0) return;
    const context = connection.readContext();
    const { link, snapshot } = connection;
    if (context === null || link === null || snapshot === null) return;

    const batch = [...queue];
    void (async () => {
      const report = await appendLedgerEntries(context, {
        link,
        snapshot,
        drafts: batch.map((item) => toLedgerDraft(item.draft))
      });

      setBatchReport({ successCount: report.successCount, totalCount: report.items.length });

      const survivors: QueuedFailure[] = [];
      for (const item of report.items) {
        const queued = batch[item.index];
        if (queued === undefined) continue;
        if (item.ok) {
          backoffRef.current.delete(queued.id);
          countdown.clear(queued.id);
          continue;
        }
        const failure = toRowFailure(queued.id, item.error);
        survivors.push({ ...queued, row: { ...queued.row, failure } });
      }

      setQueue(survivors);
      if (report.successCount > 0) await connection.refresh();
    })();
  }, [connection, countdown, queue, toRowFailure]);

  /** 재연결이 성공한 뒤 하던 작업을 이어서 실행한다(§4.7-4). */
  const resumePending = useCallback(() => {
    connection.reconnect(() => {
      const pending = pendingRef.current;
      if (pending === null) return;
      pendingRef.current = null;
      if (pending.intent === 'remove') {
        void runRemove(pending.id);
        return;
      }
      /*
       * 저장은 폼이 열려 있는 상태에서 이어진다 — 입력값은 그대로다.
       * 🔴 `submitForm` 을 부르면 안 된다(삭제가 `runRemove` 를 직접 부르는 것과 같은 이유):
       *    그 클로저의 `connection.isExpired` 는 아직 `true` 라 만료 가드에 걸려 대기 작업만
       *    다시 쌓이고, 사용자는 같은 버튼을 한 번 더 눌러야 했다.
       */
      void runSave(
        pending.intent === 'create' ? 'create' : 'edit',
        pending.intent === 'update' ? pending.id : null,
        pending.draft
      );
    });
  }, [connection, runRemove, runSave]);

  /* ── 화면 모델 ───────────────────────────────────────────────────────────── */

  const form: LedgerFormModel | null = useMemo(
    () =>
      session === null
        ? null
        : {
            mode: session.mode,
            draft: session.draft,
            errors: session.errors,
            categoryOptions,
            subcategoryOptions,
            payerOptions,
            methodOptions,
            isSaving: session.isSaving,
            writeError: session.writeError
          },
    [categoryOptions, session]
  );

  const removeTarget: LedgerRemoveTarget | null = useMemo(() => {
    if (removeId === null) return null;
    const row = rows.find((item) => item.id === removeId);
    if (row === undefined) return null;
    return {
      id: row.id,
      dateText: row.dateText,
      kindText: kindLabel(row.kind, copy.list),
      category: row.category,
      amountText: row.amountText
    };
  }, [removeId, rows]);

  const partialFailure: LedgerPartialFailureModel | null = useMemo(() => {
    if (queue.length === 0) return null;
    return {
      successCount: batchReport?.successCount ?? 0,
      totalCount: batchReport?.totalCount ?? queue.length,
      hasBatchReport: batchReport !== null,
      rows: queue.map((item) => item.row),
      isRetryAllBlocked: queue.some((item) => item.row.failure?.reason === 'rateLimited')
    };
  }, [batchReport, queue]);

  return {
    form,
    isFormOpen: session !== null,
    removeTarget,
    isRemoving,
    removeError,
    rowFailures,
    partialFailure,
    liveMessage,
    focusAfterRemoveId,
    clearFocusAfterRemove,
    openCreateForm,
    openEditForm,
    changeForm,
    submitForm,
    closeForm,
    requestRemove,
    confirmRemove,
    closeRemove,
    retryRow,
    retryAll,
    resumePending
  };
}
