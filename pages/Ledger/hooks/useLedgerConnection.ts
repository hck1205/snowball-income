import { useCallback, useEffect, useRef, useState } from 'react';
import type { LedgerClassifyRule } from '@/shared/lib/ledger';
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
  APP_SPREADSHEET_TITLE
} from '@/shared/lib/googleSheets';
import type {
  ColumnMapping,
  LedgerEntry,
  LedgerError,
  LedgerSnapshot,
  SheetLink,
  SheetTabMeta,
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
import { formatEntryDate, isExpiredCode, kindLabel, toColumnOptions, toErrorModel, toFailureReason } from '../utils';
import { useLedgerClassifyRules } from './useLedgerClassifyRules';

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
  /**
   * 연결한 파일의 탭 목록. **메모리에만 산다** — 탭 제목은 준PII 라 로컬에 저장하지 않고,
   * 연결(또는 탭 전환)할 때마다 `connectSpreadsheet` 응답에서 다시 받는다.
   * 연결 전에는 빈 배열이다.
   */
  tabs: readonly SheetTabMeta[];
  /** 탭을 바꾸는 중(연결 재수립 + 스냅샷 재조회). 그동안 탭 선택은 비활성이다. */
  isTabSwitching: boolean;
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

  /**
   * 사용자 분류 규칙(`분류 규칙` 탭). 🔴 **쓰기 훅이 저장할 때 빈 항목을 채우는 데 쓴다** —
   * 읽을 때와 같은 규칙을 써야 앱이 보여 준 분류와 시트에 적히는 분류가 갈리지 않는다.
   */
  classifyRules: readonly LedgerClassifyRule[];
  /** 쓰기 훅이 쓰는 요청 컨텍스트. 토큰이 없으면 `null`(= 만료로 취급한다). */
  readContext: () => SheetsRequestContext | null;
  /** 데이터 계층 실패를 화면 상태로 옮긴다. 만료·충돌이면 전용 배너가 켜진다. */
  applyError: (error: LedgerError) => void;
  /** 쓰기 성공 뒤 목록을 다시 읽는다. 🔴 물리 삭제 뒤에는 **반드시** 부른다(스냅샷이 폐기된다). */
  refresh: () => Promise<boolean>;
  markPopupBlocked: () => void;

  /**
   * 지난 시트로 **한 번에** 돌아간다(피커를 거치지 않는다). 저장된 연결이 없으면 아무것도 안 한다.
   *
   * 🔴 클릭 핸들러 안에서만 불러야 한다 — 구글 창이 열릴 수 있다.
   */
  restoreLastSheet: () => void;
  /** 이 브라우저에 저장된 연결이 있나. 화면이 위 버튼을 그릴지 정하는 값이다. */
  hasStoredLink: boolean;
  pickExistingSheet: () => void;
  createSheet: () => void;
  /**
   * 같은 파일의 다른 탭으로 옮긴다(B-1).
   *
   * 🔴 **호출부가 안전 조건을 먼저 확인한다** — 폼이 열려 있거나 저장 실패 대기열이 남아 있으면
   * 부르지 마라. 대기열 재시도는 **그때의** `connection.link` 로 추가(append)하므로, 탭이 바뀐 뒤에
   * 재시도하면 다른 탭에 행이 들어간다(`useLedgerWrite.runCreate`). 수정·삭제는 `guardRowRef` 가
   * 옛 스냅샷 참조를 막지만 **추가에는 행 참조가 없어** 그 방어선이 없다.
   */
  switchTab: (sheetId: number) => void;
  changeMapping: (field: LedgerFieldId, letter: string | null) => void;
  confirmMapping: () => void;
  /**
   * 열 지정을 **그만두고 연결 선택 화면으로 돌아간다**(2026-08-09).
   *
   * 🔴 `pickExistingSheet`(다른 시트 고르기)와 다르다 — 저쪽은 구글 피커를 **다시 연다**.
   *    시트를 잘못 고른 게 아니라 "여기까지 왔는데 새로 만들기로 하겠다"는 사람에게는 그 팝업이
   *    막다른 길이다. 화면에 뒤로 가는 길이 없으면 새로고침 말고는 방법이 없다.
   */
  cancelMapping: () => void;
  reconnect: (onRestored?: () => void) => void;
  dismissCreatedNotice: () => void;
};

/**
 * 논리 필드 → 열 문자 초안. 데이터 계층이 준 인덱스 제안을 화면 어휘로 옮긴다.
 *
 * 🔴 **필드를 손으로 나열하지 않는다.** 이 레포가 같은 실수를 다섯 번 했다 — 선택 필드를 한 줄씩
 *    적어 둔 자리가 v2 에서 축이 늘 때마다 옛 목록으로 남아, 그 열을 요청조차 않거나 저장에서
 *    떨어뜨렸다. 전부 오류 없이 조용히 틀리는 형태였다. `LEDGER_MAPPING_FIELDS` 를 돌면
 *    화면·초안·검증이 한 목록을 보게 되어 어긋날 자리가 사라진다.
 */
const toMappingDraft = (mapping: Partial<ColumnMapping>): LedgerMappingDraft => {
  const draft: Partial<Record<LedgerFieldId, string | null>> = {};
  for (const field of LEDGER_MAPPING_FIELDS) {
    const index = mapping[field.id];
    draft[field.id] = index === undefined ? null : columnLetter(index);
  }
  return draft as LedgerMappingDraft;
};

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
        kindLabel(entry.kind, copy.list),
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
  const [tabs, setTabs] = useState<readonly SheetTabMeta[]>([]);
  const [isTabSwitching, setIsTabSwitching] = useState(false);
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
  /**
   * 사용자가 **직접 시작한 흐름**이 있었나(시트 고르기·만들기·재연결).
   *
   * 🔴 마운트의 무음 되살리기는 비동기라, 그 사이 사용자가 버튼을 누르면 두 흐름이 같은 상태를
   *    두고 다툰다 — 되살리기가 늦게 끝나면서 사용자가 방금 고른 시트를 **옛 시트로 덮는다.**
   *    이 깃발이 서면 되살리기는 결과를 버린다(먼저 시작했더라도 사람이 이긴다).
   */
  const userStartedRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    []
  );

  /* ── checking → disconnected ─────────────────────────────────────────────── */

  /**
   * 마운트 — 저장된 연결이 있어도 **자동으로 열지 않는다.**
   *
   * ## 🔴 무음 되살리기를 넣었다가 되돌렸다 (2026-08-09)
   *
   * `prompt: ''` 가 "이미 동의했으면 조용히 준다"라고 읽혀 마운트에서 한 번 시도하게 했는데,
   * 실제로는 **계정 선택 창이 떴다.** `prompt: ''` 는 **동의**를 건너뛸 뿐이고, 구글 계정이 여럿
   * 로그인돼 있으면 GIS 는 어느 계정인지 물어야 해서 창을 연다 — 그건 `prompt` 로 못 막는다.
   *
   * 사용자가 아무것도 안 눌렀는데 계정 선택 창이 뜨는 것은 **팝업이 막히는 것보다 나쁘다.**
   * 그래서 자동 시도를 걷어냈다. 대신 **지난 시트로 한 번에 돌아가는 버튼**을 두었다
   * (`restoreLastSheet`) — 클릭으로 뜨는 창은 사용자가 예상한 것이고, 피커를 거치지 않아
   * 종전보다 한 단계 짧다.
   *
   * ⚠ 되살리려면 `hint`(구글 이메일)가 있어야 창 없이 되는데, 우리는 그 값을 갖고 있지 않다 —
   *   액세스 토큰 응답에 이메일이 없고, 이 앱은 카카오·네이버 로그인이 1급이라 앱 세션의
   *   이메일이 구글 계정과 같다는 보장도 없다.
   */
  useEffect(() => {
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

  /* 사용자 분류 규칙은 별도 훅이 소유한다 — 이 훅에서 **바깥 의존이 하나도 없던 유일한 조각**이라
     떼어 냈다(2026-08-31). 캐시 규칙·실패 처리의 근거는 그쪽 머리말에 있다. */
  const { classifyRules, ensureRules } = useLedgerClassifyRules();

  const loadSnapshot = useCallback(
    async (target: SheetLink, options: { first: boolean }): Promise<boolean> => {
      const context = readContext();
      if (context === null) {
        setIsExpired(true);
        return false;
      }

      if (options.first) setIsFirstLoad(true);
      else setIsRefetching(true);

      /* 🔴 규칙을 **먼저** 읽는다 — 없으면 사용자가 만들어 둔 규칙이 무시되고 미분류가 잔뜩 나온다. */
      const rules = await ensureRules(context, target);
      const result = await readLedgerSnapshot(context, target, rules);
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
    [applyError, ensureRules, readContext]
  );

  /**
   * 연결 확정 — 로컬에 연결 정보를 남기고 첫 스냅샷을 읽는다.
   *
   * 🔴 저장 페이로드는 예나 지금이나 `spreadsheetId + sheetId + mapping + createdByApp` 뿐이다
   * (탭 목록·탭 제목은 저장하지 않는다). `saveSheetLink` 는 **같은 파일의 같은 탭**만 덮어쓰므로,
   * 탭을 옮기며 연결하면 항목이 하나씩 **늘어난다** — 예전 항목은 손대지 않는다.
   */
  const finalize = useCallback(
    async (nextLink: SheetLink, options: { created: boolean; tabs: readonly SheetTabMeta[] }) => {
      saveSheetLink({
        spreadsheetId: nextLink.spreadsheetId,
        sheetId: nextLink.sheetId,
        mapping: nextLink.mapping,
        createdByApp: nextLink.createdByApp
      });
      storedLinksRef.current = loadSheetLinks();

      setLink(nextLink);
      setTabs(options.tabs);
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

  /** 🔴 사용자가 시작한 흐름이 시작될 때마다 세운다 — 마운트 되살리기가 물러나게 하는 신호다. */
  const markUserStarted = useCallback(() => {
    userStartedRef.current = true;
  }, []);

  /**
   * **지난 시트로 한 번에 돌아간다** — 구글 드라이브 피커를 거치지 않는다.
   *
   * 시트 ID·탭·열 매핑은 이미 로컬에 있으므로 필요한 것은 토큰뿐이다. 종전에는 그 토큰을 받으려고
   * `시트 고르기` → 피커 → 파일 선택을 다시 거쳐야 했는데, 이미 고른 파일을 다시 고르는 절차다.
   *
   * 🔴 **클릭 핸들러 안에서만 부른다.** 구글 창이 열릴 수 있고, 제스처 없이 부르면 막히거나
   *    (더 나쁘게) 사용자가 예상하지 못한 계정 선택 창이 뜬다 — 그래서 마운트 자동 시도를 되돌렸다.
   */
  const restoreLastSheet = useCallback(() => {
    const stored = storedLinksRef.current;
    const target = stored[stored.length - 1];
    if (!target) return;

    markUserStarted();
    setPhase('picking');
    setConnectError(null);

    void (async () => {
      const context = await acquireToken();
      if (context === null) return;

      setPhase('connecting');
      const connected = await connectSpreadsheet(context, {
        spreadsheetId: target.spreadsheetId,
        sheetId: target.sheetId,
        mapping: target.mapping
      });
      if (!isMountedRef.current) return;

      if (!connected.ok) {
        setPhase('idle');
        applyError(connected.error);
        return;
      }

      /* 매핑이 아직 없으면 연결 흐름과 같은 화면으로 넘긴다 — 전용 화면을 새로 만들지 않는다. */
      if (connected.value.status !== 'linked') {
        setPhase('idle');
        setState('disconnected');
        return;
      }

      await finalize(connected.value.link, { created: false, tabs: connected.value.tabs });
    })();
  }, [acquireToken, applyError, finalize, markUserStarted]);

  const pickExistingSheet = useCallback(() => {
    markUserStarted();
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
        await finalize(connected.value.link, { created: false, tabs: connected.value.tabs });
        return;
      }

      setTabs(connected.value.tabs);
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
    markUserStarted();
    setConnectError(null);
    setIsPopupBlocked(false);
    setPhase('creating');

    void (async () => {
      const context = await acquireToken();
      if (context === null) return;

      // 🔴 파일 이름은 탭 제목과 다르다 — 드라이브에서 다른 문서들과 섞이므로 앱 이름이 앞에 붙는다
      //    (`APP_SPREADSHEET_TITLE` 주석 참고). 탭 제목은 `createLedgerSheet` 안에서 따로 붙는다.
      const created = await createLedgerSheet(context, { title: APP_SPREADSHEET_TITLE });
      if (!isMountedRef.current) return;

      if (!created.ok) {
        setPhase('idle');
        applyError(created.error);
        return;
      }
      // 방금 만든 파일은 탭이 하나뿐이다 — 메타를 다시 읽지 않고 그 한 탭을 그대로 목록으로 쓴다.
      await finalize(created.value, {
        created: true,
        tabs: [{ sheetId: created.value.sheetId, title: created.value.sheetTitle }]
      });
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

  /**
   * 열 지정 그만두기.
   *
   * ⚠ **연결 정보를 지우지 않는다.** 아직 아무것도 저장하지 않은 단계라 지울 것도 없다 —
   *   세션만 버리고 선택 화면으로 되돌린다.
   */
  const cancelMapping = useCallback(() => {
    setSession(null);
    setConnectError(null);
    setState('disconnected');
    setPhase('idle');
  }, []);

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
      await finalize(connected.value.link, { created: false, tabs: connected.value.tabs });
    })();
  }, [acquireToken, applyError, finalize, readContext, session]);

  /* ── B-1 탭 전환 ─────────────────────────────────────────────────────────── */

  /**
   * 같은 파일의 다른 탭으로 옮긴다.
   *
   * 🔴 월 커서는 건드리지 않는다 — 두 탭에서 **같은 달**을 비교하는 것이 이 기능의 사용 흐름이다
   * (`useLedgerMonth` 는 스냅샷이 바뀌어도 커서를 유지한다).
   * ⚠ 저장된 매핑이 있으면 곧바로 `linked` 로 돌아와 스냅샷을 읽고, 없으면 **기존 매핑 세션**을
   * 그대로 재사용한다(연결 흐름과 같은 화면 — 탭 전용 매핑 화면을 새로 만들지 않는다).
   */
  const switchTab = useCallback(
    (sheetId: number) => {
      if (link === null || link.sheetId === sheetId) return;

      const context = readContext();
      if (context === null) {
        // 토큰이 없으면 읽을 수 없다 — 만료 배너가 재연결을 안내한다(여기서 팝업을 열지 않는다).
        setIsExpired(true);
        return;
      }

      setConnectError(null);
      setIsTabSwitching(true);
      const spreadsheetId = link.spreadsheetId;

      void (async () => {
        const stored = storedLinksRef.current.find(
          (item) => item.spreadsheetId === spreadsheetId && item.sheetId === sheetId
        );
        const connected = await connectSpreadsheet(context, { spreadsheetId, sheetId, mapping: stored?.mapping });
        if (!isMountedRef.current) return;

        setIsTabSwitching(false);
        if (!connected.ok) {
          applyError(connected.error);
          return;
        }

        if (connected.value.status === 'linked') {
          await finalize(connected.value.link, { created: false, tabs: connected.value.tabs });
          return;
        }

        setTabs(connected.value.tabs);
        const suggestion = suggestColumnMapping(connected.value.headers);
        setSession({
          spreadsheetId: connected.value.spreadsheetId,
          sheetId: connected.value.sheetId,
          sheetTitle: connected.value.sheetTitle,
          columns: toColumnOptions(connected.value.headers),
          draft: toMappingDraft(suggestion.mapping),
          matchedCount: Object.keys(suggestion.mapping).length,
          previewRows: [],
          allUnreadable: false,
          isPreviewLoading: false
        });
        setState('mapping');
        setPhase('idle');
      })();
    },
    [applyError, finalize, link, readContext]
  );

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
    tabs,
    isTabSwitching,
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
    classifyRules,
    readContext,
    applyError,
    refresh,
    markPopupBlocked,
    restoreLastSheet,
    hasStoredLink: storedLinksRef.current.length > 0,
    pickExistingSheet,
    createSheet,
    switchTab,
    changeMapping,
    cancelMapping,
    confirmMapping,
    reconnect,
    dismissCreatedNotice
  };
}
