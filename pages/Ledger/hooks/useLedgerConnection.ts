import { useCallback, useEffect, useRef, useState } from 'react';
import {
  columnIndexFromLetter,
  columnLetter,
  connectSpreadsheet,
  createLedgerSheet,
  getCachedAccessToken,
  loadSheetLinks,
  openSpreadsheetPicker,
  readLedgerSnapshot,
  requestAccessToken,
  saveSheetLink,
  suggestColumnMapping,
  validateColumnMapping,
  APP_SHEET_TAB_TITLE
} from '@/shared/lib/googleSheets';
import type {
  ColumnMapping,
  LedgerEntry,
  LedgerError,
  LedgerSnapshot,
  SheetLink,
  SheetsRequestContext,
  UnreadableRow
} from '@/shared/lib/googleSheets';
import { LEDGER_COPY } from '../copy';
import { LEDGER_MAPPING_FIELDS } from '../types';
import type {
  LedgerConnectionState,
  LedgerErrorModel,
  LedgerFieldId,
  LedgerMappingDraft,
  LedgerMappingModel,
  LedgerPhase,
  LedgerPreviewRow
} from '../types';
import { formatEntryDate, isExpiredCode, toColumnOptions, toErrorModel, toFailureReason } from '../utils';

const copy = LEDGER_COPY;

/** 연결 상태를 확인하는 동안 스켈레톤을 띄우기까지 기다리는 시간. 이보다 빠르면 깜빡임만 남는다. */
const CHECKING_SKELETON_DELAY_MS = 300;

/** 미리보기에 보여 줄 행 수(§4.2). */
const PREVIEW_ROW_COUNT = 3;

type MappingSession = {
  spreadsheetId: string;
  sheetId: number;
  sheetTitle: string;
  columns: readonly { letter: string; header: string }[];
  draft: LedgerMappingDraft;
  matchedCount: number;
  previewRows: readonly LedgerPreviewRow[];
  allUnreadable: boolean;
  isPreviewLoading: boolean;
};

export type LedgerConnection = {
  state: LedgerConnectionState;
  phase: LedgerPhase;
  showCheckingSkeleton: boolean;
  link: SheetLink | null;
  snapshot: LedgerSnapshot | null;
  readAt: Date | null;
  isFirstLoad: boolean;
  isRefetching: boolean;
  isExpired: boolean;
  isReconnecting: boolean;
  isConflict: boolean;
  isPopupBlocked: boolean;
  showCreatedNotice: boolean;
  connectError: LedgerErrorModel | null;
  mapping: LedgerMappingModel | null;

  /** 쓰기 훅이 쓰는 요청 컨텍스트. 토큰이 없으면 `null`(= 만료로 취급한다). */
  readContext: () => SheetsRequestContext | null;
  /** 데이터 계층 실패를 화면 상태로 옮긴다. 만료·충돌이면 전용 배너가 켜진다. */
  applyError: (error: LedgerError) => void;
  /** 쓰기 성공 뒤 목록을 다시 읽는다. 🔴 물리 삭제 뒤에는 **반드시** 부른다(스냅샷이 폐기된다). */
  refresh: () => Promise<boolean>;
  markPopupBlocked: () => void;

  pickExistingSheet: () => void;
  createSheet: () => void;
  changeMapping: (field: LedgerFieldId, letter: string | null) => void;
  confirmMapping: () => void;
  reconnect: (onRestored?: () => void) => void;
  dismissCreatedNotice: () => void;
};

/** 논리 필드 → 열 문자 초안. 데이터 계층이 준 인덱스 제안을 화면 어휘로 옮긴다. */
const toMappingDraft = (mapping: Partial<ColumnMapping>): LedgerMappingDraft => ({
  date: mapping.date === undefined ? null : columnLetter(mapping.date),
  kind: mapping.kind === undefined ? null : columnLetter(mapping.kind),
  amount: mapping.amount === undefined ? null : columnLetter(mapping.amount),
  category: mapping.category === undefined ? null : columnLetter(mapping.category),
  memo: mapping.memo === undefined ? null : columnLetter(mapping.memo)
});

/** 열 문자 초안 → 데이터 계층의 열 인덱스 매핑. 필수가 빠지면 `null`. */
const toColumnMapping = (draft: LedgerMappingDraft): ColumnMapping | null => {
  const indices: Partial<ColumnMapping> = {};
  for (const field of LEDGER_MAPPING_FIELDS) {
    const letter = draft[field.id];
    if (letter === null) continue;
    const index = columnIndexFromLetter(letter);
    if (index === null) continue;
    (indices as Record<string, number>)[field.id] = index;
  }
  const validated = validateColumnMapping(indices);
  return validated.ok ? validated.mapping : null;
};

const missingFieldNames = (draft: LedgerMappingDraft): string[] =>
  LEDGER_MAPPING_FIELDS.filter((field) => field.required && draft[field.id] === null).map(
    (field) => copy.mapping.fields[field.id]
  );

/** 스냅샷의 앞 3행을 미리보기 행으로. 읽은 행과 못 읽은 행을 **시트 순서 그대로** 섞는다. */
const toPreviewRows = (entries: readonly LedgerEntry[], unreadable: readonly UnreadableRow[]): LedgerPreviewRow[] => {
  const readable = entries.map((entry) => ({
    rowNumber: entry.ref.rowNumber,
    row: {
      id: `preview-${entry.ref.rowNumber}`,
      cells: [
        formatEntryDate(entry.date),
        entry.kind === 'income' ? copy.list.kindIncome : copy.list.kindExpense,
        String(entry.amount),
        entry.category,
        entry.memo ?? ''
      ],
      unreadable: false
    } satisfies LedgerPreviewRow
  }));
  const broken = unreadable.map((row) => ({
    rowNumber: row.rowNumber,
    row: { id: `preview-${row.rowNumber}`, cells: [], unreadable: true } satisfies LedgerPreviewRow
  }));

  return [...readable, ...broken]
    .sort((left, right) => left.rowNumber - right.rowNumber)
    .slice(0, PREVIEW_ROW_COUNT)
    .map((item) => item.row);
};

/**
 * `/ledger` 의 연결 상태 기계.
 *
 * 🔴 **`requestAccessToken` 은 반드시 클릭 핸들러 안에서** 부른다(팝업이 열린다 — 사용자 제스처가
 * 필요하다). 그래서 "마운트 시 자동 재연결"은 존재하지 않는다. `checking` 은 저장된 연결 정보를
 * 읽는 짧은 구간이고, 그 뒤에는 언제나 사용자가 버튼을 눌러야 한다.
 * 🔴 **Picker 는 토큰을 받은 뒤에만** 연다(순서가 뒤바뀌면 조용히 실패한다).
 *
 * 토큰은 데이터 계층의 **메모리 저장소**에만 산다 — 이 훅은 값을 복사해 두지 않고 필요할 때마다
 * `getCachedAccessToken()` 으로 읽는다.
 */
export function useLedgerConnection(): LedgerConnection {
  const [state, setState] = useState<LedgerConnectionState>('checking');
  const [phase, setPhase] = useState<LedgerPhase>('idle');
  const [showCheckingSkeleton, setShowCheckingSkeleton] = useState(false);
  const [link, setLink] = useState<SheetLink | null>(null);
  const [snapshot, setSnapshot] = useState<LedgerSnapshot | null>(null);
  const [readAt, setReadAt] = useState<Date | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isConflict, setIsConflict] = useState(false);
  const [isPopupBlocked, setIsPopupBlocked] = useState(false);
  const [showCreatedNotice, setShowCreatedNotice] = useState(false);
  const [connectError, setConnectError] = useState<LedgerErrorModel | null>(null);
  const [session, setSession] = useState<MappingSession | null>(null);

  /** 이 브라우저에 남아 있는 연결 정보(시트 ID·탭 ID·열 인덱스뿐 — 가계부 값은 없다). */
  const storedLinksRef = useRef(loadSheetLinks());
  /** 미리보기 응답의 순서 뒤바뀜을 막는 요청 토큰. */
  const previewRequestRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    []
  );

  /* ── checking → disconnected ─────────────────────────────────────────────── */

  useEffect(() => {
    // 저장된 연결이 있어도 **자동으로 열지 않는다** — 토큰 요청이 팝업이라 클릭이 필요하다.
    const timer = window.setTimeout(() => setShowCheckingSkeleton(true), CHECKING_SKELETON_DELAY_MS);
    storedLinksRef.current = loadSheetLinks();
    setState('disconnected');
    return () => window.clearTimeout(timer);
  }, []);

  /* ── 공통 도우미 ─────────────────────────────────────────────────────────── */

  const readContext = useCallback((): SheetsRequestContext | null => {
    const token = getCachedAccessToken();
    return token === null ? null : { accessToken: token.value };
  }, []);

  const applyError = useCallback((error: LedgerError) => {
    if (isExpiredCode(error.code)) {
      setIsExpired(true);
      return;
    }
    const reason = toFailureReason(error.code);
    if (reason === 'conflict') {
      setIsConflict(true);
      return;
    }
    setConnectError(toErrorModel(reason));
  }, []);

  const loadSnapshot = useCallback(
    async (target: SheetLink, options: { first: boolean }): Promise<boolean> => {
      const context = readContext();
      if (context === null) {
        setIsExpired(true);
        return false;
      }

      if (options.first) setIsFirstLoad(true);
      else setIsRefetching(true);

      const result = await readLedgerSnapshot(context, target);
      if (!isMountedRef.current) return false;

      setIsFirstLoad(false);
      setIsRefetching(false);

      if (!result.ok) {
        applyError(result.error);
        return false;
      }

      setSnapshot(result.value);
      setReadAt(new Date());
      setIsConflict(false);
      setConnectError(null);
      return true;
    },
    [applyError, readContext]
  );

  /** 연결 확정 — 로컬에 연결 정보를 남기고 첫 스냅샷을 읽는다. */
  const finalize = useCallback(
    async (nextLink: SheetLink, options: { created: boolean }) => {
      saveSheetLink({
        spreadsheetId: nextLink.spreadsheetId,
        sheetId: nextLink.sheetId,
        mapping: nextLink.mapping,
        createdByApp: nextLink.createdByApp
      });
      storedLinksRef.current = loadSheetLinks();

      setLink(nextLink);
      setSession(null);
      setState('connected');
      setShowCreatedNotice(options.created);
      setPhase('idle');
      await loadSnapshot(nextLink, { first: true });
    },
    [loadSnapshot]
  );

  /** 토큰 요청. 실패하면 화면을 §4.1 로 되돌리고 권한 거부 배너를 얹는다(§4.9). */
  const acquireToken = useCallback(async (options?: { force?: boolean }): Promise<SheetsRequestContext | null> => {
    const token = await requestAccessToken(options?.force ? { force: true, prompt: 'consent' } : undefined);
    if (!isMountedRef.current) return null;

    if (!token.ok) {
      setPhase('idle');
      setState('denied');
      setSession(null);
      return null;
    }
    return { accessToken: token.value.value };
  }, []);

  /* ── §4.1 두 진입 ────────────────────────────────────────────────────────── */

  const pickExistingSheet = useCallback(() => {
    setConnectError(null);
    setIsPopupBlocked(false);
    setPhase('picking');

    void (async () => {
      // 🔴 토큰이 먼저, Picker 가 나중이다.
      const context = await acquireToken();
      if (context === null) return;

      const picked = await openSpreadsheetPicker({ accessToken: context.accessToken });
      if (!isMountedRef.current) return;

      if (!picked.ok) {
        setPhase('idle');
        applyError(picked.error);
        return;
      }
      // 취소는 실패가 아니다 — 아무 말도 하지 않고 원래 화면으로 돌아간다.
      if (picked.value === null) {
        setPhase('idle');
        return;
      }

      setPhase('connecting');
      const stored = storedLinksRef.current.find((item) => item.spreadsheetId === picked.value?.spreadsheetId);
      const connected = await connectSpreadsheet(context, {
        spreadsheetId: picked.value.spreadsheetId,
        mapping: stored?.mapping
      });
      if (!isMountedRef.current) return;

      if (!connected.ok) {
        setPhase('idle');
        applyError(connected.error);
        return;
      }

      if (connected.value.status === 'linked') {
        await finalize(connected.value.link, { created: false });
        return;
      }

      const suggestion = suggestColumnMapping(connected.value.headers);
      const draft = toMappingDraft(suggestion.mapping);
      setSession({
        spreadsheetId: connected.value.spreadsheetId,
        sheetId: connected.value.sheetId,
        sheetTitle: connected.value.sheetTitle,
        columns: toColumnOptions(connected.value.headers),
        draft,
        matchedCount: Object.keys(suggestion.mapping).length,
        previewRows: [],
        allUnreadable: false,
        isPreviewLoading: false
      });
      setState('mapping');
      setPhase('idle');
    })();
  }, [acquireToken, applyError, finalize]);

  const createSheet = useCallback(() => {
    setConnectError(null);
    setIsPopupBlocked(false);
    setPhase('creating');

    void (async () => {
      const context = await acquireToken();
      if (context === null) return;

      const created = await createLedgerSheet(context, { title: APP_SHEET_TAB_TITLE });
      if (!isMountedRef.current) return;

      if (!created.ok) {
        setPhase('idle');
        applyError(created.error);
        return;
      }
      await finalize(created.value, { created: true });
    })();
  }, [acquireToken, applyError, finalize]);

  /* ── §4.2 매핑 ───────────────────────────────────────────────────────────── */

  const changeMapping = useCallback((field: LedgerFieldId, letter: string | null) => {
    setSession((previous) => (previous === null ? previous : { ...previous, draft: { ...previous.draft, [field]: letter } }));
  }, []);

  /**
   * 미리보기 — 필수 열이 전부 정해졌을 때만 읽는다.
   *
   * ⚠ 데이터 계층에는 "원본 3행만 읽기" API 가 없다(범위는 언제나 한 열 전체다). 그래서 **고른 열
   * 조합으로 만든 임시 연결**을 스냅샷으로 읽고 앞 3행만 보여 준다 — 화면 문구("이렇게 읽었습니다")와
   * 정확히 같은 의미다. 시트를 고쳐 쓰지 않으므로 안전하다.
   */
  const sessionDraft = session?.draft;
  const sessionSheetTitle = session?.sheetTitle;
  const sessionSpreadsheetId = session?.spreadsheetId;
  const sessionSheetId = session?.sheetId;

  useEffect(() => {
    if (!sessionDraft || sessionSpreadsheetId === undefined || sessionSheetId === undefined || !sessionSheetTitle) {
      return;
    }
    const mapping = toColumnMapping(sessionDraft);
    if (mapping === null) {
      setSession((previous) =>
        previous === null ? previous : { ...previous, previewRows: [], allUnreadable: false, isPreviewLoading: false }
      );
      return;
    }

    const context = readContext();
    if (context === null) {
      setIsExpired(true);
      return;
    }

    previewRequestRef.current += 1;
    const requestId = previewRequestRef.current;
    setSession((previous) => (previous === null ? previous : { ...previous, isPreviewLoading: true }));

    void (async () => {
      const result = await readLedgerSnapshot(context, {
        spreadsheetId: sessionSpreadsheetId,
        sheetId: sessionSheetId,
        sheetTitle: sessionSheetTitle,
        mapping,
        createdByApp: false
      });
      if (!isMountedRef.current || previewRequestRef.current !== requestId) return;

      if (!result.ok) {
        setSession((previous) => (previous === null ? previous : { ...previous, isPreviewLoading: false }));
        applyError(result.error);
        return;
      }

      const rows = toPreviewRows(result.value.entries, result.value.unreadableRows);
      setSession((previous) =>
        previous === null
          ? previous
          : {
              ...previous,
              previewRows: rows,
              allUnreadable: rows.length > 0 && rows.every((row) => row.unreadable),
              isPreviewLoading: false
            }
      );
    })();
  }, [applyError, readContext, sessionDraft, sessionSheetId, sessionSheetTitle, sessionSpreadsheetId]);

  const confirmMapping = useCallback(() => {
    if (session === null) return;
    const mapping = toColumnMapping(session.draft);
    if (mapping === null) return;

    setPhase('connecting');
    void (async () => {
      const context = readContext() ?? (await acquireToken());
      if (context === null) return;

      const connected = await connectSpreadsheet(context, {
        spreadsheetId: session.spreadsheetId,
        sheetId: session.sheetId,
        mapping
      });
      if (!isMountedRef.current) return;

      if (!connected.ok) {
        setPhase('idle');
        applyError(connected.error);
        return;
      }
      if (connected.value.status !== 'linked') {
        setPhase('idle');
        return;
      }
      await finalize(connected.value.link, { created: false });
    })();
  }, [acquireToken, applyError, finalize, readContext, session]);

  /* ── §4.7 재연결 · §4.10 새로고침 ────────────────────────────────────────── */

  const refresh = useCallback(async (): Promise<boolean> => {
    if (link === null) return false;
    return loadSnapshot(link, { first: false });
  }, [link, loadSnapshot]);

  /**
   * 🔴 재연결은 **1클릭**이다 — 중간 확인 화면이 없다. 성공하면 목록을 다시 읽고, 그 뒤에 하던
   * 작업(`onRestored`)이 곧바로 이어서 실행된다.
   */
  const reconnect = useCallback(
    (onRestored?: () => void) => {
      setPhase('reconnecting');
      void (async () => {
        const context = await acquireToken({ force: true });
        if (context === null) return;

        setIsExpired(false);
        setPhase('idle');
        if (link === null) return;

        const ok = await loadSnapshot(link, { first: false });
        if (ok) onRestored?.();
      })();
    },
    [acquireToken, link, loadSnapshot]
  );

  const dismissCreatedNotice = useCallback(() => setShowCreatedNotice(false), []);
  const markPopupBlocked = useCallback(() => setIsPopupBlocked(true), []);

  const mappingModel: LedgerMappingModel | null =
    session === null
      ? null
      : {
          sheetName: session.sheetTitle,
          columns: session.columns,
          draft: session.draft,
          matchedCount: session.matchedCount,
          missingNames: missingFieldNames(session.draft),
          previewRows: session.previewRows,
          canPreview: toColumnMapping(session.draft) !== null,
          allUnreadable: session.allUnreadable,
          isPreviewLoading: session.isPreviewLoading
        };

  return {
    state,
    phase,
    // `checking` 을 벗어나면 늦게 도착한 타이머가 켜 놓은 값이 남아도 화면에는 나오지 않는다.
    showCheckingSkeleton: state === 'checking' && showCheckingSkeleton,
    link,
    snapshot,
    readAt,
    isFirstLoad,
    isRefetching,
    isExpired,
    isReconnecting: phase === 'reconnecting',
    isConflict,
    isPopupBlocked,
    showCreatedNotice,
    connectError,
    mapping: mappingModel,
    readContext,
    applyError,
    refresh,
    markPopupBlocked,
    pickExistingSheet,
    createSheet,
    changeMapping,
    confirmMapping,
    reconnect,
    dismissCreatedNotice
  };
}
