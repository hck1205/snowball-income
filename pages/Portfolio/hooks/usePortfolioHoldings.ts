import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import {
  DEFAULT_PORTFOLIO_TAX_RATE_PERCENT,
  normalizePortfolioQuantity,
  normalizePortfolioTaxRatePercent,
  normalizePortfolioTicker
} from '@/shared/lib/portfolio';
import type { PortfolioHolding, PortfolioManualMarketInput } from '@/shared/lib/portfolio';
import {
  buildPortfolioRecord,
  normalizePortfolioManualInput,
  readPortfolioRecord,
  toPortfolioHoldingRow,
  toPortfolioHoldings,
  toPortfolioStorageReason,
  toQuantityInputValue,
  writePortfolioRecord
} from '../utils';
import type {
  PortfolioHoldingRow,
  PortfolioHoldingsStatus,
  PortfolioRecordReader,
  PortfolioRecordWriter,
  PortfolioStorageFailureReason
} from '../utils';

/**
 * 행 매핑 순수 함수(`toPortfolioHoldings`·`toQuantityInputValue`)와 그 타입은 `../utils`(순수
 * 계층)에 산다 — 이 훅은 부수효과(저장·실행취소)만 갖고, 재-export 로 기존 배럴 표면
 * (`@/pages/Portfolio/hooks`)을 그대로 유지한다.
 */
export type { PortfolioHoldingRow, PortfolioHoldingsStatus };
export { toPortfolioHoldings, toQuantityInputValue };

/**
 * 내 포트폴리오 화면의 **보유 목록 단일 소유자** — 로드·편집·실행 취소·저장을 전부 여기서 쥔다.
 *
 * ## 시뮬레이터 전역 상태를 쓰지 않는다
 * 시뮬 폼 atom 은 하이드레이션·자동저장·클라우드 동기화가 전부 Main 에 묶여 있어, Main 밖에서
 * 쓰면 조용히 유실되거나 다음 세션 충돌 판정을 바꾼다(pitfalls 2026-07-27 🔴 3경로). 이 화면은
 * 자기 저장소(`snowball-portfolio`)만 만지고 시뮬 payload·공유 URL 은 읽지도 쓰지도 않는다.
 *
 * ## 하이드레이션 전에는 편집을 받지 않는다
 * 저장소 읽기가 끝나기 전(`status === 'loading'`)의 모든 변이는 **훅에서 거부**한다. 받아주면
 * "빈 초기 상태 + 방금 추가한 1행"이 디바운스 저장으로 예약되고, 뒤늦게 도착한 로드값이 화면을
 * 덮은 뒤 그 예약이 발화해 **디스크의 기존 보유 목록을 1행짜리로 교체**한다(읽기 지연만큼의 창이지만
 * 결과는 사용자 데이터 파괴). 화면 어포던스(로딩 중 버튼 비활성)는 UI 몫이고, 여기가 정본 방어선이다.
 *
 * ## 저장 규칙
 * - 편집 → **300ms 디바운스** 저장(수량을 타이핑할 때마다 쓰지 않게).
 * - **언마운트·pagehide·백그라운드 전환에서 pending 을 flush** 한다. 시뮬 자동저장도 같은 결함
 *   ("편집 직후 라우트 이동"이 통째로 유실)을 갖고 있었고 2026-07-28 에 같은 방식으로 고쳤다 —
 *   대기 중인 저장을 ref 에 담고 **마운트 1회 effect 의 cleanup 에서** flush 한다
 *   (usePortfolioPersistence.ts 의 "언마운트 시 대기 중인 로컬 autosave" effect).
 * - **읽기에 실패하면 저장을 잠근다** — 화면의 빈 목록으로 디스크의 원본을 덮어쓰지 않는다(AC4-3).
 * - 실패는 전부 표면화한다: 상태(`status`/`writeError`) + `OPERATION_ERROR` 계측.
 */

/** 수량 타이핑마다 쓰지 않기 위한 디바운스. 사람이 한 필드를 다 치는 시간보다 짧게 잡았다. */
export const PORTFOLIO_SAVE_DEBOUNCE_MS = 300;
/** 삭제 실행 취소 버퍼의 수명. 배너가 사라지는 시점과 같다(디자인 스펙 §4.4). */
export const PORTFOLIO_UNDO_TIMEOUT_MS = 8000;

export type PortfolioAddInput = { ticker: string; manual?: PortfolioManualMarketInput };

/**
 * 추가 결과. **중복은 조용히 무시하지 않고 사유를 돌려준다** — 화면이 "이미 보유 중"을 말하고
 * 그 행의 수량 입력으로 안내해야 하기 때문(AC1-3).
 *
 * `loading` = 저장소를 아직 못 읽어 편집을 받지 않는 상태(no-op 이 아니라 구분 가능한 거절).
 */
export type PortfolioAddResult =
  | { ok: true; ticker: string }
  | { ok: false; ticker: string; reason: 'duplicate' | 'invalid-ticker' | 'loading' };

/**
 * 모든 변이 액션은 `status === 'loading'` 동안 거부된다(위 "하이드레이션 전에는 편집을 받지 않는다").
 * 값을 돌려주는 액션은 사유를 실어 주고(`add` → `loading`, `undo` → `null`), 반환이 없는 액션은
 * 내부 가드로 무시한다.
 */
export type PortfolioHoldingsActions = {
  /**
   * 티커 문자열 또는 `{ ticker, manual }`. 이미 보유 중이면 추가하지 않고 `duplicate` 를,
   * 하이드레이션 전이면 `loading` 을 돌려준다.
   */
  add: (input: string | PortfolioAddInput) => PortfolioAddResult;
  /** `QuantityInput` 의 원문을 그대로 받는다(빈 문자열 = 미입력). 없는 티커면 no-op. */
  updateQuantity: (ticker: string, rawInput: string | number) => void;
  remove: (ticker: string) => void;
  /** 직전 삭제 1건을 **원래 인덱스**로 되돌린다. 복원한 티커(없으면 `null`)를 돌려준다. */
  undo: () => string | null;
  setTaxPercent: (value: number) => void;
  /**
   * 보유 목록 전체를 갈아끼운다 — **클라우드 적용 전용**(`usePortfolioCloudSync`).
   *
   * 사용자 편집 액션이 아니다. 로그인 시 클라우드 정본을 내려받아 로컬을 맞출 때만 쓴다
   * (포트폴리오는 "클라우드가 이긴다" 정책 — `portfolioCloudSync` 주석 참고).
   * 실행 취소 버퍼를 확정하고 로컬 저장까지 예약하므로, 적용 직후 새로고침해도 살아남는다.
   */
  replaceAll: (holdings: readonly PortfolioHolding[], taxPercent: number) => void;
};

export type UsePortfolioHoldingsResult = {
  status: PortfolioHoldingsStatus;
  items: PortfolioHoldingRow[];
  /** 배당소득세(%). 0..100. */
  taxPercent: number;
  /** 마지막 저장이 실패했으면 사유, 성공했으면 `null`. 화면은 `!== null` 로 배너를 띄운다. */
  writeError: PortfolioStorageFailureReason | null;
  /** 실행 취소 버퍼(직전 삭제 1건, 8초). `null` 이면 배너를 숨긴다. */
  pendingUndo: { ticker: string } | null;
  actions: PortfolioHoldingsActions;
};

export type UsePortfolioHoldingsOptions = {
  /** 저장소 리더 주입(테스트용). 기본은 실제 IndexedDB. */
  readRecord?: PortfolioRecordReader;
  /** 저장소 라이터 주입(테스트용). 기본은 실제 IndexedDB. */
  writeRecord?: PortfolioRecordWriter;
};

type PortfolioEditableState = { items: PortfolioHoldingRow[]; taxPercent: number };

const EMPTY_STATE: PortfolioEditableState = { items: [], taxPercent: DEFAULT_PORTFOLIO_TAX_RATE_PERCENT };

export const usePortfolioHoldings = (options: UsePortfolioHoldingsOptions = {}): UsePortfolioHoldingsResult => {
  const [state, setState] = useState<PortfolioEditableState>(EMPTY_STATE);
  const [status, setStatus] = useState<PortfolioHoldingsStatus>('loading');
  const [writeError, setWriteError] = useState<PortfolioStorageFailureReason | null>(null);
  const [pendingUndo, setPendingUndo] = useState<{ ticker: string } | null>(null);

  // 액션은 "지금 값"을 동기로 알아야 한다(중복 판정·인덱스 복원). setState 콜백만으로는 결과를 못 돌려준다.
  const stateRef = useRef(state);
  // 저장 계층은 마운트 시점에 고정한다(인라인 주입을 받아도 매 렌더 바뀌지 않게).
  const readerRef = useRef<PortfolioRecordReader>(options.readRecord ?? readPortfolioRecord);
  const writerRef = useRef<PortfolioRecordWriter>(options.writeRecord ?? writePortfolioRecord);

  const saveTimerRef = useRef<number | null>(null);
  const pendingSaveRef = useRef<PortfolioEditableState | null>(null);
  /** 읽기 실패 시 true — 이후 어떤 편집도 디스크에 쓰지 않는다(원본 보호). */
  const writeLockedRef = useRef(false);
  /**
   * 하이드레이션이 끝났나(성공·실패 무관 — `status !== 'loading'` 의 **동기** 미러).
   *
   * state 가 아니라 ref 인 이유 두 가지: 액션은 "지금" 판정해 결과를 즉시 돌려줘야 하고(setState 는
   * 다음 렌더), status 를 deps 에 넣으면 액션 identity 가 매 전이마다 바뀐다.
   */
  const hydratedRef = useRef(false);
  /** 편집이 한 번이라도 일어났나 — 로드 결과가 사용자 편집을 덮지 않게 하는 이중 방어용. */
  const mutatedRef = useRef(false);
  const undoRef = useRef<{ row: PortfolioHoldingRow; index: number } | null>(null);
  const undoTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  /** 대기 중인 저장을 즉시 내보낸다. 언마운트 이후에도 **쓰기는 계속**하고 상태 갱신만 건너뛴다. */
  const flushSave = useCallback(() => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    const pending = pendingSaveRef.current;
    if (pending === null) return;
    pendingSaveRef.current = null;

    void writerRef
      .current(toPortfolioHoldings(pending.items), pending.taxPercent)
      .then(() => {
        if (mountedRef.current) setWriteError(null);
      })
      .catch((error: unknown) => {
        const reason = toPortfolioStorageReason(error, 'write-failed');
        trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, { operation: 'portfolio_storage_write', reason });
        if (mountedRef.current) setWriteError(reason);
      });
  }, []);

  const scheduleSave = useCallback(
    (next: PortfolioEditableState) => {
      // 하이드레이션 전에는 **어떤 저장도 예약하지 않는다** — 액션 가드가 뚫리더라도 "빈 초기 상태 기준
      // 목록"이 디스크 원본을 대체하는 마지막 단계를 여기서 한 번 더 막는다.
      if (!hydratedRef.current || writeLockedRef.current) return;

      pendingSaveRef.current = next;
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null;
        flushSave();
      }, PORTFOLIO_SAVE_DEBOUNCE_MS);
    },
    [flushSave]
  );

  /** 모든 편집이 지나는 **유일한** 경로 — 상태·동기 미러·저장 예약이 한 곳에서 같이 움직인다. */
  const applyState = useCallback(
    (next: PortfolioEditableState) => {
      mutatedRef.current = true;
      stateRef.current = next;
      setState(next);
      scheduleSave(next);
    },
    [scheduleSave]
  );

  /** 실행 취소 버퍼를 확정(폐기)한다. 추가·수량 수정·세율 변경·연속 삭제가 전부 이걸 부른다. */
  const commitUndo = useCallback(() => {
    if (undoTimerRef.current !== null) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    if (undoRef.current === null) return;

    undoRef.current = null;
    setPendingUndo(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    hydratedRef.current = false;

    const fail = (reason: PortfolioStorageFailureReason) => {
      // 무음 실패 금지. 저장소는 건드리지 않고(삭제·덮어쓰기 없음) 자동 저장만 잠근다.
      writeLockedRef.current = true;
      // 실패도 하이드레이션의 **끝**이다 — 여기서 계속 막으면 편집 자체가 영구 잠긴다.
      // 디스크는 writeLockedRef 가 따로 지킨다(입력은 되되 쓰지 않는다).
      hydratedRef.current = true;
      trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, { operation: 'portfolio_storage_read', reason });
      setStatus('read-error');
    };

    const run = async () => {
      try {
        const result = await readerRef.current();
        if (cancelled) return;

        if (!result.ok) {
          fail(result.reason);
          return;
        }

        // 이중 방어: 로딩 중 변이는 액션 가드가 전부 거부하므로 여기서 `mutatedRef` 는 이론상 항상
        // false 다. 그럼에도 편집이 있었다면 **로드값으로 덮지 않는다** — 방금 친 값이 눈앞에서
        // 사라지는 쪽이 더 나쁘고, 하이드레이션 전 편집은 저장 예약조차 못 했으므로(scheduleSave
        // 가드) 디스크 원본은 이 분기에서도 그대로 남아 있다.
        if (result.value && !mutatedRef.current) {
          const next: PortfolioEditableState = {
            items: result.value.holdings.map(toPortfolioHoldingRow),
            taxPercent: result.value.taxPercent
          };
          stateRef.current = next;
          setState(next);
        }

        hydratedRef.current = true;
        setStatus('ready');
      } catch (error) {
        if (cancelled) return;
        fail(toPortfolioStorageReason(error, 'read-failed'));
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const handlePageHide = () => flushSave();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushSave();
    };

    // 이탈(새로고침·탭 닫기)과 모바일 백그라운드 전환 둘 다 건다 — 언마운트가 안 도는 경로들이다.
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (undoTimerRef.current !== null) {
        window.clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }
      mountedRef.current = false;
      // ⚠ clearTimeout 만 하면 마지막 편집이 "지연"이 아니라 통째로 사라진다. 반드시 flush.
      flushSave();
    };
  }, [flushSave]);

  const add = useCallback(
    (input: string | PortfolioAddInput): PortfolioAddResult => {
      const ticker = normalizePortfolioTicker(typeof input === 'string' ? input : input.ticker);
      // 저장소를 아직 못 읽었다 — 지금 받으면 "빈 목록 + 이 1행"이 디스크의 원본을 대체한다.
      if (!hydratedRef.current) return { ok: false, ticker, reason: 'loading' };
      if (ticker.length === 0) return { ok: false, ticker: '', reason: 'invalid-ticker' };

      const current = stateRef.current;
      if (current.items.some((item) => item.ticker === ticker)) {
        return { ok: false, ticker, reason: 'duplicate' };
      }

      commitUndo();

      const manual = typeof input === 'string' ? undefined : normalizePortfolioManualInput(input.manual);
      const row: PortfolioHoldingRow = {
        ticker,
        // 수량은 비운 채로 추가한다 — 사용자가 바로 입력할 자리이고, 0 을 지우게 만들지 않는다.
        quantity: null,
        quantityInput: '',
        ...(manual ? { manual } : {})
      };

      applyState({ ...current, items: [...current.items, row] });

      return { ok: true, ticker };
    },
    [applyState, commitUndo]
  );

  const updateQuantity = useCallback(
    (ticker: string, rawInput: string | number) => {
      if (!hydratedRef.current) return;

      const symbol = normalizePortfolioTicker(ticker);
      const current = stateRef.current;
      const index = current.items.findIndex((item) => item.ticker === symbol);
      if (index < 0) return;

      const quantityInput = typeof rawInput === 'number' ? String(rawInput) : rawInput;
      // 빈 문자열·공백·문자는 Number 를 거쳐 0/NaN 이 되고, M0 정규화가 그걸 "미입력"으로 접는다.
      const parsed = typeof rawInput === 'number' ? rawInput : Number(quantityInput.trim());
      const quantity = normalizePortfolioQuantity(parsed);

      const target = current.items[index];
      // 같은 값 재입력은 저장 예약조차 만들지 않는다(포커스 이동만으로 쓰기가 도는 걸 막는다).
      if (target.quantityInput === quantityInput && target.quantity === quantity) return;

      commitUndo();
      applyState({
        ...current,
        items: current.items.map((item, itemIndex) =>
          itemIndex === index ? { ...item, quantity, quantityInput } : item
        )
      });
    },
    [applyState, commitUndo]
  );

  const remove = useCallback(
    (ticker: string) => {
      if (!hydratedRef.current) return;

      const symbol = normalizePortfolioTicker(ticker);
      const current = stateRef.current;
      const index = current.items.findIndex((item) => item.ticker === symbol);
      if (index < 0) return;

      // 버퍼는 **직전 1건만** — 연속 삭제하면 이전 건은 여기서 확정된다.
      commitUndo();

      undoRef.current = { row: current.items[index], index };
      setPendingUndo({ ticker: symbol });
      undoTimerRef.current = window.setTimeout(() => {
        undoTimerRef.current = null;
        undoRef.current = null;
        setPendingUndo(null);
      }, PORTFOLIO_UNDO_TIMEOUT_MS);

      applyState({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) });
    },
    [applyState, commitUndo]
  );

  const undo = useCallback((): string | null => {
    if (!hydratedRef.current) return null;

    const buffered = undoRef.current;
    if (buffered === null) return null;

    if (undoTimerRef.current !== null) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    undoRef.current = null;
    setPendingUndo(null);

    const current = stateRef.current;
    const items = [...current.items];
    // 원래 자리로 되돌린다 — 목록이 그 사이 줄었으면 끝에 붙는다(인덱스는 clamp).
    items.splice(Math.min(Math.max(buffered.index, 0), items.length), 0, buffered.row);
    applyState({ ...current, items });

    return buffered.row.ticker;
  }, [applyState]);

  const setTaxPercent = useCallback(
    (value: number) => {
      if (!hydratedRef.current) return;

      const taxPercent = normalizePortfolioTaxRatePercent(value);
      const current = stateRef.current;
      if (current.taxPercent === taxPercent) return;

      commitUndo();
      applyState({ ...current, taxPercent });
    },
    [applyState, commitUndo]
  );

  /**
   * 클라우드 정본으로 전체 교체. 사용자 편집이 아니라 **동기화**다.
   *
   * 하이드레이션 전에는 무시한다 — 아직 로컬을 못 읽은 상태에서 덮으면, 읽기가 끝난 뒤
   * 하이드레이션이 이 값을 다시 덮거나(순서 역전) 반대로 로컬이 사라진다.
   */
  const replaceAll = useCallback(
    (holdings: readonly PortfolioHolding[], taxPercent: number) => {
      if (!hydratedRef.current) return;

      // 정규화는 저장 경로와 **같은 함수**를 탄다 — 클라우드로 들어온 값만 다른 규칙을 쓰면
      // 로컬에서 만든 것과 미묘하게 다른 상태가 생긴다.
      const normalized = buildPortfolioRecord(holdings, taxPercent);

      commitUndo();
      applyState({ items: normalized.holdings.map(toPortfolioHoldingRow), taxPercent: normalized.taxPercent });
    },
    [applyState, commitUndo]
  );

  const actions = useMemo<PortfolioHoldingsActions>(
    () => ({ add, updateQuantity, remove, undo, setTaxPercent, replaceAll }),
    [add, remove, replaceAll, setTaxPercent, undo, updateQuantity]
  );

  return useMemo<UsePortfolioHoldingsResult>(
    () => ({
      status,
      items: state.items,
      taxPercent: state.taxPercent,
      writeError,
      pendingUndo,
      actions
    }),
    [actions, pendingUndo, state.items, state.taxPercent, status, writeError]
  );
};
