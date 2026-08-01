import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TickerPageShell } from '@/pages/Ticker/components';
import { LEDGER_COPY } from '../copy';
import { useLedgerConnection, useLedgerMonth, useLedgerWrite, useRetryCountdown } from '../hooks';
import type { LedgerRowModel } from '../types';
import { buildSheetUrl, formatReadAt } from '../utils';
import LedgerPageView from './LedgerPage.view';
import type { LedgerPageProps, LedgerViewModel } from './LedgerPage.types';

const copy = LEDGER_COPY;

/**
 * `/ledger` 컨테이너 — 데이터 계층(`shared/lib/googleSheets`) + 페이지 훅을 조립해 순수 뷰에 넘긴다.
 *
 * ## 무엇을 저장하지 않는가
 * 가계부 행은 **사용자의 구글 시트에만** 산다. 이 화면은 우리 DB·IndexedDB 어디에도 값을 쓰지 않고,
 * 로컬에 남는 것은 데이터 계층이 관리하는 시트 ID·탭 ID·열 인덱스뿐이다. 액세스 토큰은 메모리에만 있다.
 *
 * ## 왜 jotai atom 이 없는가
 * 이 화면의 상태(연결·매핑·월 커서·대기 중인 작업)는 전부 `/ledger` 안에서만 의미가 있고, 시뮬레이터의
 * 영속 페이로드·공유 URL 스키마와 **한 글자도 겹치지 않는다**. 전역 atom 으로 올리면 이 라우트를 열지
 * 않은 사용자의 스토어에도 상태가 생긴다.
 *
 * 🔴 준PII — 시트 ID·시트 제목·열 이름·금액 원값을 GA 파라미터나 콘솔 로그로 내보내지 않는다.
 */
export default function LedgerPage({ now: nowProp }: LedgerPageProps = {}) {
  /** '오늘'은 컨테이너가 한 번 고정해 아래로 내린다(순수 계층은 시계를 읽지 않는다 · 테스트 결정성). */
  const [now] = useState(() => nowProp ?? new Date());

  const connection = useLedgerConnection();
  const month = useLedgerMonth(connection.snapshot, now);
  const countdown = useRetryCountdown();
  const write = useLedgerWrite({
    connection,
    entryById: month.entryById,
    categoryOptions: month.categoryOptions,
    rows: month.rows,
    countdown,
    now
  });

  /**
   * 라이브 리전은 **화면당 하나**다. 월 이동과 쓰기 결과가 같은 자리를 쓰므로 마지막에 일어난 일이
   * 남는다. 🔴 오류는 여기서 말하지 않는다 — `Banner role="alert"` 가 낭독한다(중복 낭독 금지).
   */
  const [liveMessage, setLiveMessage] = useState('');
  const didMoveRef = useRef(false);

  /* 이동한 **뒤에** 그 달의 건수를 세어 알린다(이동 전에 세면 언제나 지금 달의 숫자다). */
  const monthLabel = month.monthLabel;
  const monthRowCount = month.rows.length;
  useEffect(() => {
    if (!didMoveRef.current) return;
    setLiveMessage(copy.month.moved(monthLabel, monthRowCount));
  }, [monthLabel, monthRowCount]);

  const writeMessage = write.liveMessage;
  useEffect(() => {
    if (writeMessage.length === 0) return;
    setLiveMessage(writeMessage);
  }, [writeMessage]);

  const handlePrevMonth = useCallback(() => {
    didMoveRef.current = true;
    month.goPrev();
  }, [month]);

  const handleNextMonth = useCallback(() => {
    didMoveRef.current = true;
    month.goNext();
  }, [month]);

  const handleThisMonth = useCallback(() => {
    didMoveRef.current = true;
    month.goThisMonth();
  }, [month]);

  const handleGoLatestMonth = useCallback(() => {
    didMoveRef.current = true;
    month.goLatestMonth();
  }, [month]);

  /**
   * 🔴 `window.open` 은 팝업 차단 시 **예외가 아니라 `null`** 을 돌려준다(pitfalls 2026-07-29).
   * 반환값을 보지 않으면 "눌렀는데 아무 일도 안 났다"가 된다.
   */
  const sheetUrl = connection.link === null ? null : buildSheetUrl(connection.link.spreadsheetId);
  const handleOpenSheet = useCallback(() => {
    if (sheetUrl === null) return;
    const opened = window.open(sheetUrl, '_blank', 'noopener');
    if (opened === null) connection.markPopupBlocked();
  }, [connection, sheetUrl]);

  const handleRefresh = useCallback(() => {
    void connection.refresh();
  }, [connection]);

  /** 만료 배너의 "다시 연결" — 재연결이 성공하면 하던 작업이 곧바로 이어서 실행된다. */
  const handleReconnect = useCallback(() => {
    write.resumePending();
  }, [write]);

  /** 행 실패를 목록 행에 얹는다. 시트에서 읽은 행 모델 자체는 실패를 모른다. */
  const rows: readonly LedgerRowModel[] = useMemo(() => {
    if (write.rowFailures.size === 0) return month.rows;
    return month.rows.map((row) => {
      const failure = write.rowFailures.get(row.id);
      return failure === undefined ? row : { ...row, failure };
    });
  }, [month.rows, write.rowFailures]);

  const viewModel: LedgerViewModel = {
    state: connection.state,
    phase: connection.phase,
    showCheckingSkeleton: connection.showCheckingSkeleton,
    sheetMetaLine:
      connection.link === null || connection.readAt === null
        ? null
        : copy.hero.meta(connection.link.sheetTitle, formatReadAt(connection.readAt)),
    sheetUrl,
    sheetName: connection.link?.sheetTitle ?? null,

    monthLabel: month.monthLabel,
    prevMonthLabel: month.prevMonthLabel,
    nextMonthLabel: month.nextMonthLabel,
    thisMonthLabel: month.thisMonthLabel,
    isCurrentMonth: month.isCurrentMonth,
    latestMonthLabel: month.latestMonthLabel,

    summary: month.summary,
    rows,
    isRefetching: connection.isRefetching,
    isFirstLoad: connection.isFirstLoad,

    isExpired: connection.isExpired,
    isReconnecting: connection.isReconnecting,
    isConflict: connection.isConflict,
    isDenied: connection.state === 'denied',
    isPopupBlocked: connection.isPopupBlocked,
    showCreatedNotice: connection.showCreatedNotice,
    connectError: connection.connectError,

    mapping: connection.mapping,
    partialFailure: write.partialFailure,
    form: write.form,
    removeTarget: write.removeTarget,
    isRemoving: write.isRemoving,
    removeError: write.removeError,
    liveMessage
  };

  return (
    <TickerPageShell>
      <LedgerPageView
        viewModel={viewModel}
        retryCountdowns={countdown.seconds}
        focusAfterRemoveId={write.focusAfterRemoveId}
        onFocusAfterRemoveHandled={write.clearFocusAfterRemove}
        onPickExistingSheet={connection.pickExistingSheet}
        onCreateSheet={connection.createSheet}
        onMappingChange={connection.changeMapping}
        onConfirmMapping={connection.confirmMapping}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onThisMonth={handleThisMonth}
        onGoLatestMonth={handleGoLatestMonth}
        onOpenCreateForm={write.openCreateForm}
        onOpenEditForm={write.openEditForm}
        onFormChange={write.changeForm}
        onSubmitForm={write.submitForm}
        onCloseForm={write.closeForm}
        onRequestRemove={write.requestRemove}
        onConfirmRemove={write.confirmRemove}
        onCloseRemove={write.closeRemove}
        onRetryRow={write.retryRow}
        onRetryAll={write.retryAll}
        onReconnect={handleReconnect}
        onRefresh={handleRefresh}
        onOpenSheet={handleOpenSheet}
        onDismissCreatedNotice={connection.dismissCreatedNotice}
      />
    </TickerPageShell>
  );
}
