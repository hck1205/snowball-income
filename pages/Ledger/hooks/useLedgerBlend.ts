import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchSpreadsheetMeta, ledgerError, loadSheetLinks, readLedgerSnapshot } from '@/shared/lib/googleSheets';
import type {
  LedgerSnapshot,
  SheetTabMeta,
  SheetsRequestContext,
  StoredSheetLink
} from '@/shared/lib/googleSheets';
import { LEDGER_COPY } from '../copy';
import type {
  LedgerBlendSetupModel,
  LedgerBlendSourceKey,
  LedgerBlendSourceOption,
  LedgerBlendViewModel,
  LedgerFailureReason
} from '../types';
import {
  LEDGER_BLEND_SOURCE_KEYS,
  buildLedgerBlendModel,
  clearLedgerBlendConfig,
  createLedgerBlendConfig,
  isLedgerBlendAvailable,
  labelsOfLedgerBlendConfig,
  readLedgerBlendConfig,
  resolveLedgerBlendConfig,
  toBlendReadySource,
  toFailureReason,
  writeLedgerBlendConfig
} from '../utils';
import type { LedgerBlendConfig, LedgerBlendSourceInput, LedgerMonthCursor } from '../utils';
import type { LedgerConnection } from './useLedgerConnection';

const copy = LEDGER_COPY;

/**
 * B-3 **두 가계부 블렌딩**의 화면 배선.
 *
 * ## 이 훅이 하지 않는 일
 * 🔴 **계산을 하지 않는다.** 병합·정렬·소계·합산은 전부 `utils/ledgerBlend.ts` 의 순수 함수가 갖는다 —
 *    여기서 하는 일은 ①구성을 읽고 쓰고 ②두 스냅샷을 각각 **1회씩** 읽어 ③그 결과를
 *    `buildLedgerBlendModel` 에 넘기는 것뿐이다.
 * 🔴 **`localStorage` 를 직접 만지지 않는다**(소스 가드가 그것을 잠근다). 구성은 `readLedgerBlendConfig`
 *    계열이, 링크 목록은 데이터 계층의 `loadSheetLinks` 가 소유한다.
 * 🔴 **폴링하지 않는다.** 읽기 트리거는 ①블렌딩 진입 ②구성 변경 ③사용자가 누른 "다시 불러오기" 뿐이다.
 *    월 커서를 옮겨도 시트를 다시 읽지 않는다 — 단일 뷰와 같은 원칙으로 메모리에서 달을 거른다.
 * 🔴 **쓰기 경로가 없다**(D3-4). 이 훅에서 시트로 나가는 요청은 메타 조회와 스냅샷 읽기뿐이다.
 *
 * ## 요청 예산 (429)
 * 진입 시 **스냅샷 2회**가 기본이다. 탭 제목은 A1 범위를 만드는 데 반드시 필요한데
 * (`readLedgerSnapshot` 이 `sheetTitle` 을 받는다) 준PII 라 로컬에 없으므로, **아직 모르는
 * 스프레드시트에 한해** 메타를 1회씩 더 읽는다. 권장 경로("한 파일에 탭 2개", D3-1)에서는 지금
 * 연결된 파일의 탭 목록(`connection.tabs`)이 이미 메모리에 있어 **추가 요청이 0**이고, 진입 비용은
 * 정확히 2회다.
 */

/** 링크 하나를 폼 값으로 접는다. 🔴 화면에 그리지 않는다 — `<option value>` 로만 산다. */
const sourceValueOf = (source: { spreadsheetId: string; sheetId: number }): string =>
  `${source.spreadsheetId}:${source.sheetId}`;

/** 폼 값 → 링크 참조. 시트 ID 에는 `:` 가 없으므로 **마지막** 콜론에서 가른다. */
const parseSourceValue = (value: string): { spreadsheetId: string; sheetId: number } | null => {
  const at = value.lastIndexOf(':');
  if (at <= 0) return null;
  const sheetId = Number(value.slice(at + 1));
  if (!Number.isInteger(sheetId)) return null;
  return { spreadsheetId: value.slice(0, at), sheetId };
};

/** 출처 한쪽의 읽기 상태. 🔴 성공/실패/로딩을 **값**으로 들고, 판정은 순수 함수에 넘긴다. */
type SourceState =
  | { status: 'loading' }
  | { status: 'ready'; snapshot: LedgerSnapshot }
  | { status: 'failed'; reason: LedgerFailureReason };

type SourcePair = Readonly<Record<LedgerBlendSourceKey, SourceState>>;

const LOADING_PAIR: SourcePair = { a: { status: 'loading' }, b: { status: 'loading' } };

type SetupDraft = {
  a: string | null;
  b: string | null;
  labelA: string;
  labelB: string;
};

export type LedgerBlend = {
  model: LedgerBlendViewModel;
  /** 모드가 바뀔 때만 값이 생긴다. 라이브 리전은 화면당 하나라 컨테이너가 이어 준다. */
  liveMessage: string;
  toggle: (isOn: boolean) => void;
  toggleSetup: (isOpen: boolean) => void;
  changeSource: (source: LedgerBlendSourceKey, value: string) => void;
  changeLabel: (source: LedgerBlendSourceKey, label: string) => void;
  submitSetup: () => void;
  clear: () => void;
  /** 사용자가 누른 "다시 불러오기". 🔴 자동 재시도는 없다(429 를 부른다). */
  reload: () => void;
  /** "이 가계부에서 열기" — 블렌딩을 끄고 그 가계부의 단일 뷰로 간다(AC3-6). */
  openSource: (source: LedgerBlendSourceKey) => void;
};

export function useLedgerBlend(params: {
  connection: LedgerConnection;
  /** 단일 뷰의 월 커서를 그대로 이어받는다 — 모드를 바꿨다고 보던 달이 튀면 혼란스럽다. */
  cursor: LedgerMonthCursor;
  /**
   * "이 가계부에서 열기"를 막는 사유(`null` 이면 열 수 있다).
   *
   * 🔴 **이 훅은 그 판단을 하지 않는다.** 판단의 단일 출처는 탭 피커와 같은
   * `tabSwitchBlockedReason` 이고(쓰기 대기 상태가 정한다), 그 값을 컨테이너가 두 소비자에게
   * 똑같이 나눠 준다. 여기서 쓰기 훅을 직접 들여다보면 같은 규칙이 두 벌이 되고, 한쪽만 고쳐지는
   * 순간 이 경로가 다시 뚫린다(2026-08-02 리뷰가 잡은 사고 경로).
   */
  openBlockedReason: string | null;
}): LedgerBlend {
  const { connection, cursor, openBlockedReason } = params;

  /**
   * 🔴 `connection` 은 렌더마다 새 객체다. 의존성에 넣으면 이펙트가 매 렌더 돌고 그 안의 setState 가
   * 다시 렌더를 부른다(2026-08-02 무한 렌더 사고). 콜백은 이 ref 를 거친다.
   */
  const connectionRef = useRef(connection);
  useEffect(() => {
    connectionRef.current = connection;
  });

  const isMountedRef = useRef(true);
  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    []
  );

  const [storedConfig, setStoredConfig] = useState<LedgerBlendConfig | null>(readLedgerBlendConfig);
  const [links, setLinks] = useState<readonly StoredSheetLink[]>(loadSheetLinks);
  const [isBlendOn, setIsBlendOn] = useState(false);
  const [draft, setDraft] = useState<SetupDraft | null>(null);
  const [sources, setSources] = useState<SourcePair>(LOADING_PAIR);
  const [tabsBySheet, setTabsBySheet] = useState<ReadonlyMap<string, readonly SheetTabMeta[]>>(() => new Map());
  const [isLoadingNames, setIsLoadingNames] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');

  /**
   * 🔴 출처 키가 유니온(`'a' | 'b'`)이라 계산된 키 스프레드(`{...previous, [key]: …}`)를 쓰지 않는다 —
   * 그 형태는 인덱스 시그니처로 넓어져 두 자리가 모두 채워졌다는 보장을 타입에서 잃는다.
   */
  const setSource = useCallback((key: LedgerBlendSourceKey, state: SourceState) => {
    setSources((previous) => (key === 'a' ? { a: state, b: previous.b } : { a: previous.a, b: state }));
  }, []);

  /* 연결이 확정될 때마다 링크 목록을 다시 읽는다 — 새 탭을 연결하면 항목이 하나 늘어난다. */
  const activeLink = connection.link;
  useEffect(() => {
    setLinks(loadSheetLinks());
  }, [activeLink]);

  /**
   * 🔴 **AC3-7 의 방어선.** 저장된 구성은 언제나 링크 목록과 대조한 뒤에 쓴다 — 가리키던 링크가
   * 사라졌으면 구성 전체가 무효이고(남은 한쪽으로 이어 가면 "우리 가계"가 조용히 한 사람 것이 된다),
   * 화면은 단일 가계부 상태로 돌아간다. 이 한 줄을 건너뛰면 고아 참조가 그대로 통과한다.
   */
  const config = useMemo(() => resolveLedgerBlendConfig(storedConfig, links), [storedConfig, links]);
  const configRef = useRef(config);
  const linksRef = useRef(links);
  const tabsRef = useRef(tabsBySheet);
  const draftRef = useRef(draft);
  useEffect(() => {
    configRef.current = config;
    linksRef.current = links;
    tabsRef.current = tabsBySheet;
    draftRef.current = draft;
  });

  /* 지금 연결된 파일의 탭 목록은 이미 메모리에 있다 — 같은 것을 다시 받아 오지 않는다. */
  const connectedSpreadsheetId = connection.link?.spreadsheetId ?? null;
  const connectedTabs = connection.tabs;
  useEffect(() => {
    if (connectedSpreadsheetId === null || connectedTabs.length === 0) return;
    setTabsBySheet((previous) => {
      if (previous.get(connectedSpreadsheetId) === connectedTabs) return previous;
      const next = new Map(previous);
      next.set(connectedSpreadsheetId, connectedTabs);
      return next;
    });
  }, [connectedSpreadsheetId, connectedTabs]);

  /**
   * 모르는 파일의 탭 제목만 받아 온다. 이미 아는 파일은 요청을 만들지 않는다(429 예산).
   * 실패해도 조용히 넘어간다 — 이름을 못 읽은 선택지는 중립 문구로 서고, 읽기 단계에서 다시 실패한다.
   */
  const resolveTabs = useCallback(
    async (
      spreadsheetIds: readonly string[],
      context: SheetsRequestContext
    ): Promise<ReadonlyMap<string, readonly SheetTabMeta[]>> => {
      const unknown = [...new Set(spreadsheetIds)].filter((id) => !tabsRef.current.has(id));
      if (unknown.length === 0) return tabsRef.current;

      setIsLoadingNames(true);
      const resolved = new Map(tabsRef.current);
      for (const spreadsheetId of unknown) {
        const meta = await fetchSpreadsheetMeta(context, spreadsheetId);
        if (meta.ok) resolved.set(spreadsheetId, meta.value.tabs);
      }
      if (!isMountedRef.current) return resolved;

      tabsRef.current = resolved;
      setTabsBySheet(resolved);
      setIsLoadingNames(false);
      return resolved;
    },
    []
  );

  /** 늦게 도착한 응답이 새 결과를 덮지 않게 하는 요청 토큰. */
  const runIdRef = useRef(0);

  const runLoad = useCallback(
    (target: LedgerBlendConfig): void => {
      const context = connectionRef.current.readContext();
      if (context === null) {
        /*
         * 토큰이 없으면 읽을 수 없다 — 만료 배너가 1클릭 재연결을 안내한다(여기서 팝업을 열지 않는다).
         * 🔴 두 출처를 **실패로 확정**한다. 로딩으로 두면 화면이 영원히 스켈레톤에 머문다.
         */
        connectionRef.current.applyError(ledgerError('auth-expired'));
        setSources({ a: { status: 'failed', reason: 'unknown' }, b: { status: 'failed', reason: 'unknown' } });
        return;
      }

      runIdRef.current += 1;
      const runId = runIdRef.current;
      setSources(LOADING_PAIR);

      void (async () => {
        const tabs = await resolveTabs([target.a.spreadsheetId, target.b.spreadsheetId], context);
        if (!isMountedRef.current || runIdRef.current !== runId) return;

        /* 🔴 두 출처를 **각각 1회씩**. 순차로 돌려 하나가 느려도 다른 하나를 막지 않게 병렬로 띄운다. */
        await Promise.all(
          LEDGER_BLEND_SOURCE_KEYS.map(async (key) => {
            const source = target[key];
            const stored = linksRef.current.find(
              (link) => link.spreadsheetId === source.spreadsheetId && link.sheetId === source.sheetId
            );
            const sheetTitle = tabs
              .get(source.spreadsheetId)
              ?.find((tab) => tab.sheetId === source.sheetId)?.title;

            if (stored === undefined || sheetTitle === undefined) {
              // 열 매핑이나 탭을 찾지 못했다 — 값을 지어내지 않고 그 출처를 실패로 남긴다.
              if (isMountedRef.current && runIdRef.current === runId) {
                setSource(key, { status: 'failed', reason: 'unknown' });
              }
              return;
            }

            const result = await readLedgerSnapshot(context, {
              spreadsheetId: source.spreadsheetId,
              sheetId: source.sheetId,
              sheetTitle,
              mapping: stored.mapping,
              // 🔴 이 화면은 읽기 전용이라 소프트 삭제 여부만 쓰인다(쓰기 경로가 없다).
              createdByApp: stored.createdByApp
            });
            if (!isMountedRef.current || runIdRef.current !== runId) return;

            setSource(
              key,
              result.ok
                ? { status: 'ready', snapshot: result.value }
                : { status: 'failed', reason: toFailureReason(result.error.code) }
            );
          })
        );
      })();
    },
    [resolveTabs, setSource]
  );

  /**
   * 진입·구성 변경 때 한 번만 읽는다. 🔴 월 커서는 의존성에 **없다** — 달을 옮길 때마다 시트를 때리면
   * 429 에 바로 닿는다(단일 뷰와 같은 원칙: 스냅샷 1회, 달 필터는 메모리).
   */
  const configKey =
    config === null ? null : `${sourceValueOf(config.a)}|${sourceValueOf(config.b)}`;
  const loadedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isBlendOn || config === null || configKey === null) {
      if (!isBlendOn) loadedKeyRef.current = null;
      return;
    }
    if (loadedKeyRef.current === configKey) return;
    loadedKeyRef.current = configKey;
    runLoad(config);
  }, [config, configKey, isBlendOn, runLoad]);

  /* ── 사용자 조작 ─────────────────────────────────────────────────────────── */

  const toggle = useCallback((next: boolean) => {
    if (next && configRef.current === null) return;
    setIsBlendOn(next);
    setLiveMessage(next ? copy.blend.live.entered : copy.blend.live.exited);
  }, []);

  const toggleSetup = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setDraft(null);
      return;
    }
    const current = configRef.current;
    const labels = labelsOfLedgerBlendConfig(current);
    setDraft({
      a: current === null ? null : sourceValueOf(current.a),
      b: current === null ? null : sourceValueOf(current.b),
      labelA: labels.a,
      labelB: labels.b
    });

    /* 설정을 열 때 이름을 채운다 — 사용자가 고를 대상을 주소가 아니라 **탭 제목**으로 봐야 한다. */
    const context = connectionRef.current.readContext();
    if (context !== null) void resolveTabs(linksRef.current.map((link) => link.spreadsheetId), context);
  }, [resolveTabs]);

  const changeSource = useCallback((source: LedgerBlendSourceKey, value: string) => {
    setDraft((previous) =>
      previous === null ? previous : source === 'a' ? { ...previous, a: value } : { ...previous, b: value }
    );
  }, []);

  const changeLabel = useCallback((source: LedgerBlendSourceKey, label: string) => {
    setDraft((previous) =>
      previous === null
        ? previous
        : source === 'a'
          ? { ...previous, labelA: label }
          : { ...previous, labelB: label }
    );
  }, []);

  /**
   * 🔴 저장은 **업데이터 밖**에서 한다. `setDraft(previous => …)` 안에 쓰기를 넣으면 React 가 그
   * 함수를 두 번 부를 수 있는 환경(StrictMode)에서 저장이 두 번 일어난다.
   */
  const submitSetup = useCallback(() => {
    const current = draftRef.current;
    if (current === null || current.a === null || current.b === null) return;
    const a = parseSourceValue(current.a);
    const b = parseSourceValue(current.b);
    if (a === null || b === null) return;

    /* 🔴 판정은 저장 함수에 맡긴다 — 같은 링크 두 개면 `null` 이고, 그 규칙이 화면 검증과 하나다. */
    const next = createLedgerBlendConfig({ ...a, label: current.labelA }, { ...b, label: current.labelB });
    if (next === null) return;

    writeLedgerBlendConfig(next);
    setStoredConfig(next);
    setDraft(null);
    setIsBlendOn(true);
    setLiveMessage(copy.blend.live.entered);
  }, []);

  const clear = useCallback(() => {
    clearLedgerBlendConfig();
    setStoredConfig(null);
    setDraft(null);
    setIsBlendOn(false);
    setLiveMessage(copy.blend.live.exited);
  }, []);

  const reload = useCallback(() => {
    const current = configRef.current;
    if (current === null) return;
    runLoad(current);
  }, [runLoad]);

  /**
   * "이 가계부에서 열기". 🔴 이 버튼이 하는 일은 **탭 전환**이므로 탭 피커와 **같은 가드**를 통과해야
   * 한다 — 그러지 않으면 블렌딩이 탭 전환 차단의 우회로가 된다(저장 실패 대기열이 남은 채 탭이
   * 바뀌면 재시도가 다른 탭에 행을 추가한다 · `useLedgerConnection.switchTab` 의 호출부 계약).
   *
   * ⚠ 화면에서도 버튼을 비활성으로 두지만, **여기서 한 번 더 판단한다** — 뷰만 믿으면 다른 호출부가
   * 생겼을 때 조용히 뚫린다. 막혔을 때는 블렌딩을 끄지도 않는다(끄면 사용자가 대기열을 되찾으려
   * 눌렀는지 나가려 눌렀는지가 섞인다).
   */
  const openSource = useCallback(
    (source: LedgerBlendSourceKey) => {
      if (openBlockedReason !== null) return;

      const current = configRef.current;
      if (current === null) return;
      const target = current[source];
      const link = connectionRef.current.link;

      setIsBlendOn(false);
      setLiveMessage(copy.blend.live.exited);
      if (link === null || link.spreadsheetId !== target.spreadsheetId) return;
      // 이미 그 탭을 보고 있으면 전환할 것이 없다(같은 탭으로의 재연결은 읽기 요청만 낭비한다).
      if (link.sheetId === target.sheetId) return;
      connectionRef.current.switchTab(target.sheetId);
    },
    [openBlockedReason]
  );

  /* ── 화면 모델 ───────────────────────────────────────────────────────────── */

  const options: readonly LedgerBlendSourceOption[] = useMemo(
    () =>
      links.map((link, index) => ({
        value: sourceValueOf(link),
        name:
          tabsBySheet.get(link.spreadsheetId)?.find((tab) => tab.sheetId === link.sheetId)?.title ??
          copy.blend.setup.unnamedOption(index + 1)
      })),
    [links, tabsBySheet]
  );

  const setup: LedgerBlendSetupModel | null = useMemo(() => {
    if (draft === null) return null;
    const isIncomplete = draft.a === null || draft.b === null;
    return {
      options,
      a: { value: draft.a, label: draft.labelA },
      b: { value: draft.b, label: draft.labelB },
      blockedReason: isIncomplete
        ? copy.blend.setup.incomplete
        : draft.a === draft.b
          ? copy.blend.setup.sameSource
          : null,
      canClear: config !== null,
      isLoadingNames
    };
  }, [config, draft, isLoadingNames, options]);

  const isOn = isBlendOn && config !== null;

  const toInput = useCallback(
    (state: SourceState): LedgerBlendSourceInput =>
      state.status === 'ready'
        ? toBlendReadySource(state.snapshot, cursor)
        : state.status === 'failed'
          ? { status: 'failed', reason: state.reason }
          : { status: 'loading' },
    [cursor]
  );

  const model = useMemo(() => {
    if (!isOn || config === null) return null;
    /* 🔴 화면 계산 0 — 병합·정렬·소계·합산은 전부 이 한 번의 호출 안에서 끝난다. */
    return buildLedgerBlendModel({
      labels: labelsOfLedgerBlendConfig(config),
      a: toInput(sources.a),
      b: toInput(sources.b)
    });
  }, [config, isOn, sources, toInput]);

  /**
   * "이 가계부에서 열기"가 가능한 출처. 🔴 지금 연결된 **같은 파일의 탭**만이다 — 다른 파일은
   * 피커를 다시 거쳐야 열리므로(`drive.file` 은 주소 붙여넣기가 불가능하다) 버튼을 만들지 않는다.
   */
  const openableSources = useMemo(() => {
    if (config === null || connectedSpreadsheetId === null) return [];
    return LEDGER_BLEND_SOURCE_KEYS.filter((key) => config[key].spreadsheetId === connectedSpreadsheetId);
  }, [config, connectedSpreadsheetId]);

  return {
    model: {
      isAvailable: isLedgerBlendAvailable(links),
      isOn,
      hasConfig: config !== null,
      setup,
      model,
      openableSources,
      openBlockedReason
    },
    liveMessage,
    toggle,
    toggleSetup,
    changeSource,
    changeLabel,
    submitSetup,
    clear,
    reload,
    openSource
  };
}
