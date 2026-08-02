import { useCallback, useEffect, useRef, useState } from 'react';
import type { LedgerSnapshot, RowCells } from '@/shared/lib/googleSheets';
import { LEDGER_COPY } from '../copy';
import type { LedgerFreshnessModel } from '../types';
import { formatReadAt, nextRetryDelaySec } from '../utils';
import type { LedgerConnection } from './useLedgerConnection';
import type { RetryCountdown } from './useRetryCountdown';

const copy = LEDGER_COPY;

/**
 * 창으로 돌아왔을 때 다시 읽기까지 기다리는 시간.
 * 주요 지수 스트립의 탭 복귀 규약과 같은 5분이다(`docs/external-data.md` §3-1) — 화면마다 다른
 * 스로틀을 두면 "왜 어떤 화면은 갱신되고 어떤 화면은 안 되나"가 설명 불가능해진다.
 */
export const FRESHNESS_THROTTLE_MS = 5 * 60 * 1000;

/**
 * 새로고침 버튼의 429 대기를 담는 카운트다운 키.
 * 행 카운트다운과 **같은 타이머 하나**를 쓴다(`useRetryCountdown` — 페이지에 인터벌은 1개다).
 * 행 id 는 `snapshotId:rowNumber` 또는 `queued-N` 이라 이 키와 겹치지 않는다.
 */
export const FRESHNESS_RETRY_ID = 'ledger:refresh';

/** 값·행 구분자. 시트 셀에 들어갈 수 없는 제어문자라 사용자 값과 충돌하지 않는다. */
const UNIT = '\u001f';
const RECORD = '\u001e';

/** 한 행이 시트에서 보였던 원본 셀들 → 비교용 문자열. 키 순서에 흔들리지 않게 정렬해 접는다. */
const cellsSignature = (cells: RowCells): string =>
  Object.entries(cells)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([field, value]) => `${field}=${value ?? ''}`)
    .join(UNIT);

/**
 * 스냅샷 **요약 서명**(D2-3) — 건수 + 행별 `seen` 값.
 *
 * 🔴 행 단위 정밀 diff 를 만들지 않는 이유: 물리 삭제가 일어나면 아래 행 번호가 전부 밀려
 * (`shared/lib/googleSheets/types.ts` `LedgerRowRef` 주석) 옛 행과 새 행의 대응이 **원리적으로**
 * 불확실하다. "3번 행이 바뀌었습니다"라고 말하는 순간 그건 날조다. 여기서 답할 수 있는 질문은
 * "달라졌는가" 하나뿐이고, 화면도 딱 그만큼만 말한다.
 *
 * ⚠ 순서를 정렬하지 않는다 — 시트에서 행 순서가 바뀐 것도 사용자가 알아야 할 변경이다.
 */
export const snapshotSignature = (snapshot: LedgerSnapshot | null): string | null => {
  if (snapshot === null) return null;
  const rows = snapshot.entries.map((entry) => cellsSignature(entry.seen)).join(RECORD);
  return `${snapshot.entries.length}|${snapshot.unreadableRows.length}|${rows}`;
};

/**
 * 창 포커스가 돌아왔을 때 다시 읽어도 되는가(D2-2 · AC2-3 · AC2-4).
 *
 * 🔴 **폴링이 아니다.** 인터벌 타이머는 이 화면 어디에도 없다 — 구글 시트 읽기는 429 가 실제로
 * 나는 자원이라, 탭을 열어 둔 것만으로 할당량을 태우는 설계를 하지 않는다.
 * 시계는 인자로 받는다(렌더 시점에 따라 테스트가 흔들리지 않게).
 */
export const shouldAutoRefresh = (params: {
  isConnected: boolean;
  /** 마지막으로 읽은 시각. `null` 이면 아직 한 번도 못 읽었다 — 자동으로 때리지 않는다. */
  readAtMs: number | null;
  nowMs: number;
  /** 폼 모달·삭제 다이얼로그가 열려 있는가. 열려 있으면 화면을 사용자 밑에서 바꾸지 않는다. */
  isOverlayOpen: boolean;
  /**
   * 저장하지 못한 기록·행 실패가 남아 있는가.
   *
   * 🔴 재조회는 스냅샷 id 를 갈아치우고, 행 실패는 `snapshotId:rowNumber` 로 묶여 있어(`toRowModel`)
   * 다시 읽는 순간 실패 표시와 재시도 경로가 **조용히 사라진다**. 사용자가 직접 누른 새로고침이라면
   * 그건 그의 선택이지만, 자동 확인이 그걸 지우면 "저장 안 됐다는 표시가 왜 없어졌지"가 된다.
   */
  hasUnsavedWork: boolean;
  /** 이미 읽는 중이거나 탭을 바꾸는 중. */
  isBusy: boolean;
  isExpired: boolean;
  /** 429 대기 중. */
  isRetryBlocked: boolean;
}): boolean => {
  if (!params.isConnected || params.isOverlayOpen || params.hasUnsavedWork) return false;
  if (params.isBusy || params.isExpired || params.isRetryBlocked) return false;
  if (params.readAtMs === null) return false;
  return params.nowMs - params.readAtMs >= FRESHNESS_THROTTLE_MS;
};

export type LedgerFreshness = {
  model: LedgerFreshnessModel;
  /** 목록 카드 헤더의 새로고침. 429 대기 중에는 아무 일도 하지 않는다(연타 유도 금지). */
  refresh: () => void;
};

/**
 * B-2 **외부 수정 확인** — "지금 보는 화면이 언제 기준인가, 최신으로 다시 읽으려면".
 *
 * 이 훅이 하는 일은 셋뿐이다: ①마지막으로 읽은 시각을 표시용으로 접고 ②수동·자동 재조회를 걸고
 * ③재조회 결과가 직전과 달랐는지 **요약 비교**한다. 쓰기·충돌 감지는 `useLedgerWrite` 와
 * 데이터 계층의 `seen` 비교가 이미 갖고 있다 — 여기서 다시 만들지 않는다.
 *
 * 🔴 **자기가 건 재조회만 비교한다.** 저장·삭제 뒤에도 `connection.refresh()` 가 돌아 스냅샷이
 * 바뀌는데, 그것까지 비교하면 사용자가 방금 한 수정을 "시트가 갱신되었습니다"라고 알리게 된다.
 */
export function useLedgerFreshness(params: {
  connection: LedgerConnection;
  countdown: RetryCountdown;
  isOverlayOpen: boolean;
  hasUnsavedWork: boolean;
}): LedgerFreshness {
  const { connection, countdown, isOverlayOpen, hasUnsavedWork } = params;
  const [hasUpdate, setHasUpdate] = useState(false);

  const retrySeconds = countdown.seconds.get(FRESHNESS_RETRY_ID) ?? null;

  /** 우리가 건 재조회의 결과를 기다리는 중인가(위 주석 — 남이 건 재조회는 비교하지 않는다). */
  const isComparingRef = useRef(false);
  const signatureRef = useRef<string | null>(null);
  /** 429 백오프의 직전 값. 성공하면 처음(30초)으로 되돌린다. */
  const backoffRef = useRef<number | null>(null);

  const refresh = useCallback(() => {
    if (connection.link === null || retrySeconds !== null) return;
    setHasUpdate(false);
    isComparingRef.current = true;
    void connection.refresh().then((ok) => {
      if (ok) backoffRef.current = null;
      else isComparingRef.current = false;
    });
  }, [connection, retrySeconds]);

  /**
   * 요약 비교(D2-3). 스냅샷이 바뀐 **뒤에** 돌기 때문에 "읽고 나서 알린다"가 자연히 지켜진다.
   * 첫 스냅샷(직전 서명이 없음)은 비교 대상이 아니다 — 비교할 과거가 없는 것을 변경이라 부르지 않는다.
   */
  const snapshot = connection.snapshot;
  useEffect(() => {
    const signature = snapshotSignature(snapshot);
    const previous = signatureRef.current;
    signatureRef.current = signature;
    if (!isComparingRef.current) return;
    isComparingRef.current = false;
    if (previous === null || signature === null || previous === signature) return;
    setHasUpdate(true);
  }, [snapshot]);

  /**
   * 429 를 만나면 새로고침 버튼을 잠그고 남은 시간을 말한다(AC2-6).
   * 사유를 `connectError` 에서 읽는 이유: `refresh()` 는 성공 여부만 돌려주고, 실패 사유는
   * 연결 훅이 이미 화면 모델로 접어 두었다. 같은 사건을 두 곳에서 판정하지 않는다.
   *
   * 🔴 의존성은 **`connectError` 하나뿐**이다. `countdown` 객체를 의존성에 넣으면 렌더마다 새
   * 객체라 이펙트가 매 렌더 돌고, 그 안의 `start` 가 다시 렌더를 만들어 **무한 루프**가 된다
   * (백오프까지 매번 두 배가 된다). 그래서 호출은 ref 를 거친다.
   */
  const startCountdownRef = useRef(countdown.start);
  useEffect(() => {
    startCountdownRef.current = countdown.start;
  });

  const connectError = connection.connectError;
  useEffect(() => {
    if (connectError === null || connectError.reason !== 'rateLimited') return;
    const seconds = nextRetryDelaySec(backoffRef.current, null);
    backoffRef.current = seconds;
    startCountdownRef.current(FRESHNESS_RETRY_ID, seconds);
  }, [connectError]);

  /**
   * 포커스 복귀 감시. 🔴 리스너는 **마운트당 한 번만** 붙인다 — 판단에 필요한 값은 ref 로 읽는다.
   * (매 렌더 재구독하면 `connection` 이 렌더마다 새 객체라 리스너가 초당 수십 번 갈린다.)
   */
  const guardRef = useRef({ shouldRun: (): boolean => false, run: (): void => undefined });
  const isBusy = connection.isRefetching || connection.isFirstLoad || connection.isTabSwitching;
  const isConnected = connection.state === 'connected' && connection.link !== null;
  const readAtMs = connection.readAt === null ? null : connection.readAt.getTime();
  const isExpired = connection.isExpired;
  useEffect(() => {
    guardRef.current = {
      shouldRun: () =>
        shouldAutoRefresh({
          isConnected,
          readAtMs,
          nowMs: Date.now(),
          isOverlayOpen,
          hasUnsavedWork,
          isBusy,
          isExpired,
          isRetryBlocked: retrySeconds !== null
        }),
      run: refresh
    };
  });

  useEffect(() => {
    const check = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      if (!guardRef.current.shouldRun()) return;
      guardRef.current.run();
    };
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);

  return {
    model: {
      readAtText: connection.readAt === null ? null : copy.freshness.readAt(formatReadAt(connection.readAt)),
      isRefreshing: connection.isRefetching,
      retrySeconds,
      hasUpdate
    },
    refresh
  };
}
