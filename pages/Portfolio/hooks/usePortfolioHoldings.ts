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
  normalizePortfolioManualInput,
  readPortfolioRecord,
  toPortfolioStorageReason,
  writePortfolioRecord
} from '../utils';
import type { PortfolioRecordReader, PortfolioRecordWriter, PortfolioStorageFailureReason } from '../utils';

/**
 * 내 포트폴리오 화면의 **보유 목록 단일 소유자** — 로드·편집·실행 취소·저장을 전부 여기서 쥔다.
 *
 * ## 시뮬레이터 전역 상태를 쓰지 않는다
 * 시뮬 폼 atom 은 하이드레이션·자동저장·클라우드 동기화가 전부 Main 에 묶여 있어, Main 밖에서
 * 쓰면 조용히 유실되거나 다음 세션 충돌 판정을 바꾼다(pitfalls 2026-07-27 🔴 3경로). 이 화면은
 * 자기 저장소(`snowball-portfolio`)만 만지고 시뮬 payload·공유 URL 은 읽지도 쓰지도 않는다.
 *
 * ## 저장 규칙
 * - 편집 → **300ms 디바운스** 저장(수량을 타이핑할 때마다 쓰지 않게).
 * - **언마운트·pagehide·백그라운드 전환에서 pending 을 flush** 한다. ⚠ 시뮬 자동저장은 언마운트
 *   cleanup 이 `clearTimeout` 이라 "편집 직후 다른 탭 클릭"이 통째로 유실되는 기존 결함이 있다
 *   (usePortfolioPersistence.ts:283-299). 같은 실수를 반복하지 않는다.
 * - **읽기에 실패하면 저장을 잠근다** — 화면의 빈 목록으로 디스크의 원본을 덮어쓰지 않는다(AC4-3).
 * - 실패는 전부 표면화한다: 상태(`status`/`writeError`) + `OPERATION_ERROR` 계측.
 */

/** 수량 타이핑마다 쓰지 않기 위한 디바운스. 사람이 한 필드를 다 치는 시간보다 짧게 잡았다. */
export const PORTFOLIO_SAVE_DEBOUNCE_MS = 300;
/** 삭제 실행 취소 버퍼의 수명. 배너가 사라지는 시점과 같다(디자인 스펙 §4.4). */
export const PORTFOLIO_UNDO_TIMEOUT_MS = 8000;

/**
 * 화면이 그리는 보유 1행.
 *
 * `quantity` 와 `quantityInput` 이 **둘 다** 있는 이유: 저장·계산은 정규화된 숫자를 쓰지만,
 * 입력창은 사용자가 친 문자열 그대로여야 한다(`"1."` 을 숫자로 되돌리면 소수점을 못 찍는다).
 */
export type PortfolioHoldingRow = {
  /** 대문자·트림된 심볼. */
  ticker: string;
  /** 정규화된 수량. **`null` = 미입력**(에러가 아니다 — 행은 유지되고 합계에서만 빠진다). */
  quantity: number | null;
  /** `QuantityInput` 제어값. 저장하지 않는다(세션 안에서만 산다). */
  quantityInput: string;
  /** 유니버스 밖 종목의 수동 시장 정보(USD). */
  manual?: PortfolioManualMarketInput;
};

export type PortfolioHoldingsStatus = 'loading' | 'ready' | 'read-error';

export type PortfolioAddInput = { ticker: string; manual?: PortfolioManualMarketInput };

/**
 * 추가 결과. **중복은 조용히 무시하지 않고 사유를 돌려준다** — 화면이 "이미 보유 중"을 말하고
 * 그 행의 수량 입력으로 안내해야 하기 때문(AC1-3).
 */
export type PortfolioAddResult =
  | { ok: true; ticker: string }
  | { ok: false; ticker: string; reason: 'duplicate' | 'invalid-ticker' };

export type PortfolioHoldingsActions = {
  /** 티커 문자열 또는 `{ ticker, manual }`. 이미 보유 중이면 추가하지 않고 `duplicate` 를 돌려준다. */
  add: (input: string | PortfolioAddInput) => PortfolioAddResult;
  /** `QuantityInput` 의 원문을 그대로 받는다(빈 문자열 = 미입력). 없는 티커면 no-op. */
  updateQuantity: (ticker: string, rawInput: string | number) => void;
  remove: (ticker: string) => void;
  /** 직전 삭제 1건을 **원래 인덱스**로 되돌린다. 복원한 티커(없으면 `null`)를 돌려준다. */
  undo: () => string | null;
  setTaxPercent: (value: number) => void;
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

/** 정규화 수량 → 입력창 문자열. 미입력은 빈 문자열이다(`0` 을 찍으면 지우고 다시 치게 된다). */
export const toQuantityInputValue = (quantity: number | null): string => (quantity === null ? '' : String(quantity));

/**
 * 행 → 계산 엔진 입력.
 *
 * M0 의 `PortfolioHolding.quantity` 는 `number` 필수라 **미입력을 `0` 으로 옮긴다** —
 * `normalizePortfolioQuantity(0)` 이 `null`(미입력)을 돌려주므로 엔진에서 의미가 정확히 보존되고,
 * 그 행은 `no-quantity` 사유와 함께 합계에서만 빠진다(엔진을 고치지 않는 쪽을 택한 이유).
 */
export const toPortfolioHoldings = (rows: readonly PortfolioHoldingRow[]): PortfolioHolding[] =>
  rows.map((row) => ({
    ticker: row.ticker,
    quantity: row.quantity ?? 0,
    ...(row.manual ? { manual: row.manual } : {})
  }));

const toRow = (holding: PortfolioHolding): PortfolioHoldingRow => {
  const quantity = normalizePortfolioQuantity(holding.quantity);

  return {
    ticker: normalizePortfolioTicker(holding.ticker),
    quantity,
    quantityInput: toQuantityInputValue(quantity),
    ...(holding.manual ? { manual: holding.manual } : {})
  };
};

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
      if (writeLockedRef.current) return;

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

    const fail = (reason: PortfolioStorageFailureReason) => {
      // 무음 실패 금지. 저장소는 건드리지 않고(삭제·덮어쓰기 없음) 자동 저장만 잠근다.
      writeLockedRef.current = true;
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

        if (result.value) {
          const next: PortfolioEditableState = {
            items: result.value.holdings.map(toRow),
            taxPercent: result.value.taxPercent
          };
          stateRef.current = next;
          setState(next);
        }

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
      const taxPercent = normalizePortfolioTaxRatePercent(value);
      const current = stateRef.current;
      if (current.taxPercent === taxPercent) return;

      commitUndo();
      applyState({ ...current, taxPercent });
    },
    [applyState, commitUndo]
  );

  const actions = useMemo<PortfolioHoldingsActions>(
    () => ({ add, updateQuantity, remove, undo, setTaxPercent }),
    [add, remove, setTaxPercent, undo, updateQuantity]
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
