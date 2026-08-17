import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFxRateSync, useFxRateValueAtomValue } from '@/jotai';
import { buildPortfolioSimulationPrefillState } from '@/shared/constants';
import { SIMULATOR_PATH } from '@/shared/constants/routes';
import { toPortfolioPrefillSource } from '@/shared/lib/portfolio';
import { usePortfolioHoldings, toPortfolioHoldings } from '@/pages/Portfolio/hooks';
import { TickerPageShell } from '@/pages/Ticker/components';
import { tabSwitchBlockedReason } from '../components';
import { LEDGER_COPY } from '../copy';
import {
  useLedgerAppAuth,
  useLedgerConnection,
  useLedgerFreshness,
  useLedgerMonth,
  useLedgerSideTabs,
  useLedgerWrite,
  useRetryCountdown
} from '../hooks';
import type { LedgerDividendModel, LedgerRowModel, LedgerTabPickerModel } from '../types';
import {
  DEFAULT_LEDGER_VIEW_TAB,
  LEDGER_PAYER_SCOPE_ALL,
  buildLedgerDividendModel,
  buildLedgerViewTabs,
  buildSheetUrl,
  collectPayers,
  filterByPayerScope,
  readLedgerDividendOverlay,
  resolveLedgerViewTab,
  resolvePayerScope,
  selectableLedgerTabs,
  shouldOfferPayerScope,
  writeLedgerDividendOverlay
} from '../utils';
import type { LedgerPayerScope, LedgerViewTabId } from '../utils';
import LedgerPageView from './LedgerPage.view';
import type { LedgerPageProps, LedgerViewModel } from './LedgerPage.types';

const copy = LEDGER_COPY;

/**
 * `/ledger` 라우트 진입점 — **셸만** 세운다.
 *
 * 🔴 훅 조립을 여기서 하지 마라. 앱 로그인 세션을 쥔 `CommunityAuthProvider` 는 `TickerPageShell`
 * **안쪽**에 있고(`TickerPageShell.tsx` 주석), 셸을 렌더하는 이 컴포넌트는 그 바깥이다. 여기서
 * `useLedgerAppAuth()` 를 부르면 로그인한 사용자도 영원히 "앱 로그인 계층 없음"으로 읽힌다.
 * 그래서 조립은 셸 하위의 `LedgerContent` 가 한다.
 *
 * ⚠ 두 컴포넌트를 한 파일에 두는 것은 의도다 — 구조 가드가 컴포넌트 폴더의 파일 세트를
 * (`X.tsx`/`X.styled.ts`/`X.types.ts`/`X.utils.ts`/`X.view.tsx`/테스트) 로 잠그고 있어
 * `LedgerPage.content.tsx` 같은 새 접미사를 만들 수 없다(`test/shared/structureRules.test.ts`).
 * `LedgerContent` 는 export 하지 않으므로 fast refresh 경계도 그대로다.
 */
export default function LedgerPage({ now }: LedgerPageProps = {}) {
  return (
    <TickerPageShell>
      <LedgerContent now={now} />
    </TickerPageShell>
  );
}

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
 * 않은 사용자의 스토어에도 상태가 생긴다. (앱 세션만은 예외다 — 헤더·커뮤니티와 같은 값을 봐야 하므로
 * `jotai/community` 의 세션 atom 을 그대로 읽는다.)
 *
 * 🔴 준PII — 시트 ID·시트 제목·열 이름·금액 원값을 GA 파라미터나 콘솔 로그로 내보내지 않는다.
 */
function LedgerContent({ now: nowProp }: LedgerPageProps) {
  /** '오늘'은 컨테이너가 한 번 고정해 아래로 내린다(순수 계층은 시계를 읽지 않는다 · 테스트 결정성). */
  const [now] = useState(() => nowProp ?? new Date());
  const navigate = useNavigate();

  /**
   * 🔴 앱 신원 층. 구글 시트 권한과 **중첩되지 않는다** — 네이버·카카오로 로그인한 사용자도
   * 로그인을 유지한 채 구글 동의만 따로 받는다(`useLedgerAppAuth` 주석이 근거의 정본).
   */
  const appAuth = useLedgerAppAuth();

  const connection = useLedgerConnection();

  /**
   * 화면 탭 — 시트의 네 입력 탭을 앱에서도 탭으로(2026-08-08).
   *
   * 🔴 `connection.switchTab`(사용자 워크시트 전환)과 **다른 축**이다. 섞지 마라 —
   *    이건 같은 파일 안의 관심사 전환이라 저장 대기열·행 참조에 아무 영향이 없다
   *    (탭 전환 가드 `tabSwitchBlocked` 가 여기엔 필요 없는 이유).
   */
  const [viewTab, setViewTab] = useState<LedgerViewTabId>(DEFAULT_LEDGER_VIEW_TAB);
  const viewTabs = useMemo(
    () => buildLedgerViewTabs(connection.link?.createdByApp ?? false),
    [connection.link?.createdByApp]
  );
  /* 🔴 쓸 수 없는 탭을 고르고 있으면 되돌린다 — 안 그러면 빈 화면이 나온다. */
  const selectedViewTab = resolveLedgerViewTab(viewTab, viewTabs);

  /**
   * 주체 범위 — 부부·연인이 한 장부를 나눠 볼 때.
   *
   * 🔴 **기록 단계에서 걸러야 한다.** 표만 걸러 요약을 그대로 두면 두 숫자가 어긋나고,
   *    사용자는 어느 쪽이 진짜인지 물어야 한다. 그래서 스냅샷의 `entries` 를 걸러 `useLedgerMonth`
   *    에 넣는다 — 요약·분석·표가 모두 같은 집합을 본다.
   *
   * ⚠ 범위를 좁히면 그 사람의 것이 아닌 행은 화면에서 사라진다. 저장 실패 표시도 함께 사라질 수
   *   있는데, 이는 **월 이동과 같은 성질**이다(달을 넘겨도 실패 행이 화면에서 빠진다) —
   *   사용자가 명시적으로 한 이동이고, 범위를 전체로 되돌리면 다시 보인다.
   *   append 실패(`partialFailure`)는 범위와 무관한 별개 표면이라 계속 남는다.
   */
  const [payerScope, setPayerScope] = useState<LedgerPayerScope>(LEDGER_PAYER_SCOPE_ALL);

  /* 🔴 주체 목록은 **걸러지지 않은** 기록에서 뽑는다 — 한 사람을 고르면 나머지가 목록에서 사라진다. */
  const payers = useMemo(
    () => (connection.snapshot === null ? [] : collectPayers(connection.snapshot.entries)),
    [connection.snapshot]
  );
  /* 고른 사람이 이 달에 없으면 전체로 되돌린다(빈 목록이 "기록이 사라진 것"처럼 보이지 않게). */
  const effectivePayerScope = resolvePayerScope(payerScope, payers);

  const scopedSnapshot = useMemo(() => {
    if (connection.snapshot === null || effectivePayerScope === null) return connection.snapshot;
    return {
      ...connection.snapshot,
      entries: filterByPayerScope(connection.snapshot.entries, effectivePayerScope)
    };
  }, [connection.snapshot, effectivePayerScope]);

  const month = useLedgerMonth(scopedSnapshot, now);
  const countdown = useRetryCountdown();
  const write = useLedgerWrite({
    connection,
    entryById: month.entryById,
    categoryOptions: month.categoryOptions,
    subcategoryOptions: month.subcategoryOptions,
    payerOptions: month.payerOptions,
    methodOptions: month.methodOptions,
    carryOverCandidates: month.carryOverCandidates,
    rows: month.rows,
    countdown,
    now
  });

  /**
   * B-2 신선도 — 마지막으로 읽은 시각 · 수동 새로고침 · 창 복귀 시 자동 확인.
   *
   * 🔴 **폼·삭제 다이얼로그가 열려 있으면 자동 확인을 하지 않는다**(AC2-4). 입력 중에 목록이
   * 사용자 밑에서 바뀌는 경험을 피한다 — 그 상태를 아는 것은 쓰기 훅이므로 여기서 이어 준다.
   * 🔴 저장하지 못한 기록이 남아 있을 때도 자동으로 다시 읽지 않는다 — 재조회는 스냅샷 id 를 갈아
   * 치우고 행 실패는 그 id 로 묶여 있어, 자동 확인이 실패 표시와 재시도 경로를 지워 버린다.
   */
  const freshness = useLedgerFreshness({
    connection,
    countdown,
    isOverlayOpen: write.form !== null || write.removeTarget !== null,
    hasUnsavedWork: write.partialFailure !== null || write.rowFailures.size > 0
  });

  /**
   * 🔴 **탭 전환 차단 판단은 이 화면에 하나뿐이다.** 지금 소비처는 탭 피커의 비활성 사유 한 곳이다.
   *
   * 판단을 두 벌로 만들면 한쪽만 고쳐지는 순간 다른 쪽이 우회로가 된다. 실제로 그랬다 — 제거된 블렌딩
   * 뷰의 "열기"에 가드가 없어 대기열이 남은 채 탭이 바뀌었고, 그 뒤 재시도가 **다른 탭에 행을 추가**했다
   * (추가에는 행 참조가 없어 `guardRowRef` 가 막지 못한다 · 2026-08-02 리뷰).
   * ⚠ `switchTab` 을 부르는 새 호출부를 만들면 **반드시 이 값을 함께 넘겨라.**
   */
  const tabSwitchBlocked = useMemo(
    () =>
      tabSwitchBlockedReason({
        isFormOpen: write.form !== null,
        hasUnsavedQueue: write.partialFailure !== null
      }),
    [write.form, write.partialFailure]
  );


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


  /* AC2-5 — 다시 읽은 결과가 직전과 다를 때만 알린다(같으면 아무 말도 하지 않는다). */
  const hasFreshUpdate = freshness.model.hasUpdate;
  useEffect(() => {
    if (!hasFreshUpdate) return;
    setLiveMessage(copy.freshness.updated);
  }, [hasFreshUpdate]);

  /**
   * B-1 탭 전환 안내 — **라이브 리전은 화면당 하나**라 월 이동과 같은 자리를 쓴다.
   *
   * 🔴 스냅샷을 다 읽은 **뒤에** 알린다(읽는 중에 말하면 이전 탭의 내용을 가리키게 된다).
   * 첫 연결은 전환이 아니므로 알리지 않는다 — 그때는 화면 전체가 이미 바뀐다.
   */
  const activeSheetId = connection.link?.sheetId ?? null;
  const activeSheetTitle = connection.link?.sheetTitle ?? null;
  const isLoadingSnapshot = connection.isFirstLoad;
  const announcedTabRef = useRef<number | null>(null);
  useEffect(() => {
    if (activeSheetId === null || activeSheetTitle === null || isLoadingSnapshot) return;
    if (announcedTabRef.current === activeSheetId) return;
    const isFirstConnection = announcedTabRef.current === null;
    announcedTabRef.current = activeSheetId;
    if (isFirstConnection) return;
    setLiveMessage(copy.tab.switched(activeSheetTitle));
  }, [activeSheetId, activeSheetTitle, isLoadingSnapshot]);

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

  /**
   * 🔴 새로고침 경로는 **하나**다 — 목록 헤더 버튼도, 충돌 배너도, 폼 모달의 "새로고침"도 전부
   * 신선도 훅을 거친다. 그래야 어느 길로 다시 읽든 읽은 시각·변경 안내·429 대기가 같이 움직인다.
   */
  const handleRefresh = freshness.refresh;

  /** 만료 배너의 "다시 연결" — 재연결이 성공하면 하던 작업이 곧바로 이어서 실행된다. */
  const handleReconnect = useCallback(() => {
    write.resumePending();
  }, [write]);

  /**
   * B-1 탭 선택 모델. 비활성 사유는 위 `tabSwitchBlocked` 가 정한다(블렌딩의 "열기"와 같은 값이다).
   * 🔴 사유는 반드시 문장으로 함께 나간다 — 사유 없는 회색 컨트롤을 만들지 않는다.
   */
  const tabPicker: LedgerTabPickerModel | null = useMemo(() => {
    const activeLink = connection.link;
    if (activeLink === null) return null;
    const current = connection.tabs.find((tab) => tab.sheetId === activeLink.sheetId);
    // 지금 보고 있는 탭이 목록에 없으면 고를 자리를 만들지 않는다(추측으로 목록을 채우지 않는다).
    if (current === undefined) return null;

    /*
     * 🔴 **앱이 만든 시트에서는 기록 탭이 아닌 것을 뺀다**(2026-08-08).
     *    안 빼면 이 드롭다운에 `월별 요약`·`읽어보기`·`분류 규칙` 이 나오고, 고르는 순간 앱이
     *    그것을 가계부로 읽으려 한다 — 헤더가 안 맞아 매핑 화면으로 떨어지고 최악에는 수식 탭에
     *    쓰기를 시도한다. 화면 탭바와 이름이 겹치는 것보다, 두 컨트롤이 같은 탭을 다르게 다루는
     *    것이 문제였다. 근거 전문: `selectableLedgerTabs`.
     */
    const selectable = selectableLedgerTabs(connection.tabs, activeLink.createdByApp);

    return {
      options: selectable.map((tab) => ({ sheetId: tab.sheetId, title: tab.title })),
      currentSheetId: current.sheetId,
      currentTitle: current.title,
      blockedReason: tabSwitchBlocked,
      isSwitching: connection.isTabSwitching
    };
  }, [connection.isTabSwitching, connection.link, connection.tabs, tabSwitchBlocked]);

  /**
   * B-4 배당 겹쳐 보기 — 🔴 **화면 오버레이 전용**이다. 이 아래 어떤 코드도 시트에 쓰지 않고,
   * 아래 `viewModel.summary`(수입·지출·합계)에 배당을 더하지 않는다.
   *
   * 🔴 기본값은 **꺼짐**이고, 상태는 새 로컬 키 하나(`hungryhippo:ledger:dividend-overlay`)에만 산다 —
   * `hungryhippo:ledger:links` 는 건드리지 않는다. 불량 값은 조용히 꺼짐이다.
   */
  const [isDividendOverlayOn, setIsDividendOverlayOn] = useState(readLedgerDividendOverlay);

  const handleToggleDividendOverlay = useCallback((isOn: boolean) => {
    setIsDividendOverlayOn(isOn);
    writeLedgerDividendOverlay(isOn);
  }, []);

  /**
   * 🔴 환율은 **구독만** 한다(표시 전용 원칙). `useFxRateValueAtomValue` 는 조회 상태가
   * `success`/`stale` 일 때만 값을 주고 그 밖에는 `null` 이라, 환산 불가 상태가 구조적으로 전달된다.
   *
   * ⚠ 드라이버(`useFxRateSync`)를 여기서 부르는 이유: `/ledger` 에는 조회 주체가 없어 구독만 하면
   * 환율이 영원히 `loading` 이다. 드라이버는 **한 화면에 하나**여야 하는데(atom 주석) `/` ·
   * `/dividend/portfolio` 와 이 라우트는 배타적이라 동시에 살지 않는다.
   */
  useFxRateSync();
  const fxRateKrwPerUsd = useFxRateValueAtomValue();

  /**
   * 예상 배당의 출처는 **내 포트폴리오의 실보유**뿐이다(시뮬레이터 상태는 가설 시나리오지 보유가
   * 아니다). 🔴 이 훅은 **읽기로만** 쓴다 — `actions` 를 한 번도 부르지 않으므로 저장 예약이 생기지
   * 않고, 언마운트 flush 는 대기 중인 저장이 없어 no-op 이다.
   */
  const portfolio = usePortfolioHoldings();
  const holdings = useMemo(() => toPortfolioHoldings(portfolio.items), [portfolio.items]);

  const dividend: LedgerDividendModel = useMemo(
    () =>
      buildLedgerDividendModel({
        isOn: isDividendOverlayOn,
        portfolioStatus: portfolio.status,
        holdings,
        taxRatePercent: portfolio.taxPercent,
        fxRateKrwPerUsd,
        // 🔴 "오늘"이 아니라 **보고 있는 달**이다 — 지난 달을 펴 놓고 이번 달 배당을 말하지 않는다.
        cursor: month.cursor,
        rows: month.rows
      }),
    [fxRateKrwPerUsd, holdings, isDividendOverlayOn, month.cursor, month.rows, portfolio.status, portfolio.taxPercent]
  );

  /** 행 실패를 목록 행에 얹는다. 시트에서 읽은 행 모델 자체는 실패를 모른다. */
  const rows: readonly LedgerRowModel[] = useMemo(() => {
    if (write.rowFailures.size === 0) return month.rows;
    return month.rows.map((row) => {
      const failure = write.rowFailures.get(row.id);
      return failure === undefined ? row : { ...row, failure };
    });
  }, [month.rows, write.rowFailures]);

  /**
   * 옆탭 읽기 — 고른 탭만, 한 번만. 🔴 셋을 미리 다 읽으면 할당량을 안 볼 표에 쓴다
   * (근거 전문: `useLedgerSideTabs` 머리말).
   */
  const sideTabs = useLedgerSideTabs({
    spreadsheetId: connection.link?.spreadsheetId ?? null,
    createdByApp: connection.link?.createdByApp ?? false,
    readContext: connection.readContext,
    onError: connection.applyError
  });

  /**
   * 탭 전환.
   *
   * 🔴 **`한눈에 보기` 를 열면 자산·투자를 함께 읽는다.** 그 화면은 셋을 한 자리에서 그리는데,
   *    안 읽으면 순자산·자산 구성·투자 구성 구획이 통째로 비어 "적었는데 안 나온다"가 된다.
   *    (`분류 규칙` 은 그 화면이 안 쓰므로 부르지 않는다 — 안 볼 표를 읽는 것은 할당량 낭비다.)
   */
  const handleSelectViewTab = useCallback(
    (id: LedgerViewTabId) => {
      setViewTab(id);
      if (id === 'report') {
        void sideTabs.load('holdings');
        void sideTabs.load('investments');
        return;
      }
      if (id !== 'entries') void sideTabs.load(id);
    },
    [sideTabs]
  );

  const handleRetrySideTab = useCallback(() => {
    if (selectedViewTab === 'entries' || selectedViewTab === 'report') return;
    void sideTabs.load(selectedViewTab, { force: true });
  }, [selectedViewTab, sideTabs]);

  /* 🔴 `분류 규칙` 에는 적기가 없다 — 그 탭은 시트에서 고치는 것이 정상 사용이다(패널이 버튼을 안 그린다). */
  const handleAddSideEntry = useCallback(() => {
    if (selectedViewTab === 'entries' || selectedViewTab === 'rules' || selectedViewTab === 'report') return;
    sideTabs.openForm(selectedViewTab);
  }, [selectedViewTab, sideTabs]);

  const handleSideFormSubmit = useCallback(() => {
    void sideTabs.submitForm();
  }, [sideTabs]);

  /**
   * **`투자` 탭 → 배당 시뮬레이터.**
   *
   * 🔴 비중·정규화·유니버스 판정을 여기서 하지 않는다 — `buildPortfolioSimulationPrefillState` 가
   *    정본이고, `내 포트폴리오` 화면이 쓰는 **바로 그 경로**다. 규칙을 두 벌로 만들면 두 화면의
   *    반올림이 갈려 "안내와 실제 프리필이 다르다"가 된다.
   * ⚠ 환율이 없으면 프리필을 만들지 않는다(그 함수의 규약). 그때는 버튼이 비활성이고 사유가 선다.
   */
  /**
   * `한눈에 보기` 가 쓰는 **원본 기록**.
   *
   * 🔴 화면용 행은 금액이 문자열로 접힌 값이라 집계에 못 쓴다. 그래서 모델이 원본(`records`)을
   *    함께 들고 다닌다 — 문자열을 숫자로 되돌리는 코드를 쓰기 시작하면 그건 설계가 잘못됐다는
   *    신호다(같은 값을 두 모양으로 들고 한쪽만 고쳐지는 사고가 이 레포에서 반복됐다).
   */
  const holdingRecords = useMemo(() => {
    const state = sideTabs.byTab.holdings;
    if (state.status !== 'ready' || !('holdings' in state)) return [];
    return state.holdings.records;
  }, [sideTabs.byTab.holdings]);

  const investmentRecords = useMemo(() => {
    const state = sideTabs.byTab.investments;
    if (state.status !== 'ready' || !('investments' in state)) return [];
    return state.investments.records;
  }, [sideTabs.byTab.investments]);

  const investmentPrefill = useMemo(() => {
    const state = sideTabs.byTab.investments;
    if (state.status !== 'ready' || !('investments' in state)) return null;
    return toPortfolioPrefillSource(
      state.investments.rows.map((row) => ({
        ticker: row.ticker,
        shares: Number(row.sharesText.replace(/,/g, '')),
        unitCost: row.unitCostText === null ? null : Number(row.unitCostText.replace(/[^\d.]/g, '')),
        currency: row.currency
      })),
      fxRateKrwPerUsd
    );
  }, [fxRateKrwPerUsd, sideTabs.byTab.investments]);

  const investmentPrefillState = useMemo(
    () =>
      investmentPrefill === null
        ? null
        : buildPortfolioSimulationPrefillState({
            summary: investmentPrefill.source,
            fxRateKrwPerUsd
          }),
    [fxRateKrwPerUsd, investmentPrefill]
  );

  /**
   * ⚠ **여기서 GA 이벤트를 보내지 않는다.** `/ledger` 는 계측을 전면 금지한 화면이다 —
   *   시트 제목·탭 이름이 파라미터로 새는 유일한 경로라, "호출 자체를 두지 않는다"로 잠갔다
   *   (`test/ledger/ledgerPrivacy.test.*` 가 그 가드다). 이 CTA 도 예외가 아니다.
   *   한 번 예외를 열면 다음 사람이 파라미터에 무엇이 실리는지 매번 감사해야 한다.
   */
  const handleSimulateInvestments = useCallback(() => {
    if (investmentPrefillState === null) return;
    navigate(SIMULATOR_PATH, { state: investmentPrefillState });
  }, [investmentPrefillState, navigate]);

  const viewModel: LedgerViewModel = {
    appAuth: appAuth.gate,

    viewTabs,
    selectedViewTab,
    sideTab:
      selectedViewTab === 'entries' || selectedViewTab === 'report'
        ? null
        : sideTabs.byTab[selectedViewTab],
    /* 🔴 `한눈에 보기` 가 쓰는 재료. 아직 읽는 중이면 화면이 "없다"고 말하지 않는다. */
    report: {
      /* 🔴 `scopedSnapshot` 이 아니라 원본이다 — 리포트는 전 기간·전 주체를 본다. */
      entries: connection.snapshot?.entries ?? [],
      holdings: holdingRecords,
      investments: investmentRecords,
      isLoadingSideTabs:
        sideTabs.byTab.holdings.status === 'loading' || sideTabs.byTab.investments.status === 'loading'
    },
    sideForm: sideTabs.form,
    /* 🔴 프리필을 못 만들면 `null` — 화면이 버튼을 잠그고 사유를 말한다(무음 비활성 금지). */
    canSimulateInvestments: investmentPrefillState !== null,
    /** 🔴 프리셋에 없어 계산에 못 들어가는 티커. 조용히 빼면 사용자는 일부가 사라진 걸 모른다. */
    unknownInvestmentTickers: investmentPrefill?.unknownTickers ?? [],
    payers,
    payerScope: effectivePayerScope,
    offerPayerScope: shouldOfferPayerScope(payers),

    state: connection.state,
    phase: connection.phase,
    showCheckingSkeleton: connection.showCheckingSkeleton,
    sheetUrl,
    sheetName: connection.link?.sheetTitle ?? null,
    hasStoredLink: connection.hasStoredLink,
    tabPicker,
    freshness: freshness.model,
    dividend,
    analysis: month.analysis,
    carryOver: write.carryOver,
    backfill: write.backfill,

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
    <LedgerPageView
      viewModel={viewModel}
      retryCountdowns={countdown.seconds}
      focusAfterRemoveId={write.focusAfterRemoveId}
      onFocusAfterRemoveHandled={write.clearFocusAfterRemove}
      onSignIn={appAuth.signIn}
      onRestoreLastSheet={connection.restoreLastSheet}
      onPickExistingSheet={connection.pickExistingSheet}
      onCreateSheet={connection.createSheet}
      onMappingChange={connection.changeMapping}
      onConfirmMapping={connection.confirmMapping}
      onCancelMapping={connection.cancelMapping}
      onSelectTab={connection.switchTab}
      onSelectViewTab={handleSelectViewTab}
      onSelectPayerScope={setPayerScope}
      onRetrySideTab={handleRetrySideTab}
      onAddSideEntry={handleAddSideEntry}
      onSideFormChange={sideTabs.changeForm}
      onSideFormSubmit={handleSideFormSubmit}
      onSideFormClose={sideTabs.closeForm}
      onSimulateInvestments={handleSimulateInvestments}
      onRunBackfill={write.runBackfill}
      onToggleDividendOverlay={handleToggleDividendOverlay}
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
      onOpenCarryOver={write.openCarryOver}
      onConfirmCarryOver={write.confirmCarryOver}
      onCloseCarryOver={write.closeCarryOver}
      onReconnect={handleReconnect}
      onRefresh={handleRefresh}
      onOpenSheet={handleOpenSheet}
      onDismissCreatedNotice={connection.dismissCreatedNotice}
    />
  );
}
