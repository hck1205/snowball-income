import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarOff,
  Plus,
  RefreshCw,
  RotateCw
} from 'lucide-react';
import {
  Banner,
  Button,
  Card,
  Select
} from '@/components/common';
import {
  LedgerAnalysisCard,
  LedgerDividendCard,
  LedgerFailureList,
  LedgerMonthNav,
  LedgerSkeletonList,
  LedgerTabPicker,
  LedgerTable
} from '../';
import {
  ActionRow,
  BannerRow,
  CarryOverAmount,
  CarryOverBody,
  CarryOverLabel,
  CarryOverList,
  CarryOverMeta,
  CarryOverRow,
  CarryOverTitle,
  CountBadge,
  EmptyBlock,
  EmptyBody,
  EmptyGlyph,
  EmptyTitle,
  FlowCell,
  FlowCount,
  FlowGrid,
  FlowHead,
  FlowValue,
  FreshnessNotice,
  LedgerColumn,
  ListToolbar,
  PayerScopeLabel,
  PayerScopeRow,
  ReadAtText,
  ScopePanel,
  ScopeRail,
  SkeletonBar,
  SummaryCard,
  SummaryHint,
  SummaryLabel,
  SummaryValue,
  Workspace
} from '../../LedgerPage/LedgerPage.styled';
import { useCallback, useEffect, useId, useRef } from 'react';
import { LEDGER_COPY } from '../../copy';
import type { LedgerMonthSummary } from '../../types';
import type { LedgerEntriesWorkspaceProps } from './LedgerEntriesWorkspace.types';

const copy = LEDGER_COPY;

/**
 * 월 요약(주역 카드). 🔴 **화면에 하나뿐인 `raised` 면**이다.
 *
 * ## 구조 (2026-08-03 재설계)
 * 예전에는 hero `StatTile` 하나 + 2열 타일 격자였다. 세 숫자가 같은 부품·같은 리듬으로 서서
 * **"순액이 결론이고 수입·지출은 그 내역"이라는 관계가 화면에 없었다.** 지금은 3단이다 —
 * 라벨 → 큰 순액 → 가로선 아래 내역 두 칸(방향 글리프 + 이름 + 건수 + 금액).
 *
 * 🔴 손익색을 쓰지 않는다(수입·지출은 P&L 이 아니다). 방향은 **글리프와 글자**가 말한다.
 * 🔴 값이 아직 없으면 숫자를 지어내지 않고 골격만 그린다.
 * 🔴 배당은 이 카드에 **한 번도 더해지지 않는다** — 형제 카드가 따로 말한다(B-4).
 */
const renderSummaryCard = (params: {
  labelledBy: string;
  netLabel: string;
  summary: LedgerMonthSummary;
  isLoading?: boolean;
  isBusy?: boolean;
}) => (
  <SummaryCard aria-labelledby={params.labelledBy} aria-busy={params.isBusy || undefined}>
    <div>
      <SummaryLabel>{params.netLabel}</SummaryLabel>
      <SummaryValue>{params.isLoading ? <SkeletonBar /> : params.summary.netText}</SummaryValue>
      <SummaryHint>{copy.summary.netHint}</SummaryHint>
    </div>

    <FlowGrid>
      <FlowCell>
        <FlowHead>
          <ArrowDownToLine size={16} strokeWidth={1.8} aria-hidden focusable={false} />
          {copy.summary.income}
          <FlowCount>{copy.summary.countHint(params.summary.incomeCount)}</FlowCount>
        </FlowHead>
        <FlowValue>{params.isLoading ? <SkeletonBar /> : params.summary.incomeText}</FlowValue>
      </FlowCell>

      <FlowCell>
        <FlowHead>
          <ArrowUpFromLine size={16} strokeWidth={1.8} aria-hidden focusable={false} />
          {copy.summary.expense}
          <FlowCount>{copy.summary.countHint(params.summary.expenseCount)}</FlowCount>
        </FlowHead>
        <FlowValue>{params.isLoading ? <SkeletonBar /> : params.summary.expenseText}</FlowValue>
      </FlowCell>
    </FlowGrid>
  </SummaryCard>
);

/**
 * 가계부의 **기록 화면** — 범위 레일(장부·달·지불자) + 요약 카드 + 목록 + 실패 목록.
 *
 * ## 왜 갈랐나 (2026-08-31 리팩터)
 * `LedgerPageView` 는 901줄이었고 그중 **300줄이 이 한 블록**이었다. 연결·매핑·탭 같은 다른 상태와
 * 나란히 있어서, "지금 이 코드가 어느 화면 얘기인가"를 매번 되짚어야 했다.
 *
 * 🔴 **이 블록 전용이던 것들을 함께 데려왔다** — 요약 카드 렌더러, 이 화면의 id 넷, 삭제 뒤 포커스
 * 복구(ref + 이펙트), 파생 플래그(행 유무·새로고침 차단). 그것들이 부모에 남아 있으면 부모를
 * 읽는 사람이 쓰지도 않는 상태를 계속 넘겨야 한다.
 *
 * ⚠ `expiredHintId` 만 부모에서 받는다 — 오버레이와 **같은 줄**을 가리켜야 해서다(무음 비활성 금지).
 * ⚠ 마운트 여부(연결됨 + 기록 탭)는 **호출부가 정한다.** 여기서 다시 판단하면 조건이 두 곳이 된다.
 */
export default function LedgerEntriesWorkspace({
  viewModel,
  retryCountdowns,
  focusAfterRemoveId,
  expiredHintId,
  onFocusAfterRemoveHandled,
  onSelectTab,
  onSelectPayerScope,
  onPrevMonth,
  onNextMonth,
  onThisMonth,
  onGoLatestMonth,
  onOpenCreateForm,
  onOpenEditForm,
  onRequestRemove,
  onRetryRow,
  onRetryAll,
  onRefresh,
  onOpenCarryOver,
  onConfirmCarryOver,
  onCloseCarryOver,
  onRunBackfill,
  onToggleDividendOverlay
}: LedgerEntriesWorkspaceProps) {
  const idPrefix = useId();
  const monthTitleId = `${idPrefix}-month`;
  const payerScopeId = `${idPrefix}-payer-scope`;
  const listTitleId = `${idPrefix}-list`;
  /* 429 로 새로고침이 막혔을 때의 사유 줄 — 비활성 버튼이 이것을 가리킨다(무음 비활성 금지). */
  const refreshHintId = `${idPrefix}-refresh`;

  const removeButtonRefs = useRef(new Map<string, HTMLButtonElement | null>());
  const listTitleRef = useRef<HTMLHeadingElement | null>(null);

  const registerRemoveButton = useCallback((id: string, node: HTMLButtonElement | null) => {
    if (node === null) removeButtonRefs.current.delete(id);
    else removeButtonRefs.current.set(id, node);
  }, []);

  /* 삭제 뒤 포커스 — 목록이 갱신된 **다음 프레임**에 옮긴다(동기 focus 는 아직 없는 노드를 찾는다). */
  useEffect(() => {
    if (focusAfterRemoveId === null) return undefined;
    const raf = window.requestAnimationFrame(() => {
      const target = removeButtonRefs.current.get(focusAfterRemoveId) ?? listTitleRef.current;
      target?.focus();
      onFocusAfterRemoveHandled();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [focusAfterRemoveId, onFocusAfterRemoveHandled]);

  const hasRows = viewModel.rows.length > 0;

  /*
   * 🔴 새로고침이 막히는 경우는 둘이고, **둘 다 사유 줄을 가리킨다**(무음 비활성 금지).
   *  - 만료: 토큰이 없어 다시 읽을 수 없다. 누르면 아무 일도 안 나는 버튼을 남기지 않는다.
   *  - 429: 요청 제한. 카운트다운이 끝나면 스스로 풀린다.
   */
  const isRateLimited = viewModel.freshness.retrySeconds !== null;
  const isRefreshBlocked = viewModel.isExpired || isRateLimited;
  const refreshBlockedHintId = viewModel.isExpired ? expiredHintId : isRateLimited ? refreshHintId : undefined;

  return (
                <Workspace>
            <ScopeRail>
              {/*
                🔴 **연결 정보 영역**(어느 장부인가)은 월 네비(어느 기간인가)보다 위다 — 두 축을 같은 줄에
                섞으면 "탭을 넘기면 달도 넘어가나"라는 오해가 생긴다. 탭이 하나뿐이면 이름만 말한다.

                ⚠ 이 줄이 **연결 정보의 단일 출처**다(2026-08-02 B-2). 히어로 메타가 같은 제목을 한 번 더
                말하던 중복은 히어로 쪽을 없애 정리했고, "언제 기준"은 아래 목록 카드 헤더가 갖는다.
                여기에 읽은 시각·새로고침을 다시 얹지 마라 — 같은 사실이 또 두 곳이 된다.

                ⚠ 두 컨트롤은 한 틀(`ScopePanel`)을 공유하지만 **한 컨트롤로 합치지 않는다**. 월 이동은
                자기 `role="group"` 을 그대로 갖고, 탭 셀렉트는 그 밖에 선다.
              */}
              <ScopePanel>
                {viewModel.tabPicker ? (
                  <LedgerTabPicker
                    model={viewModel.tabPicker}
                    sheetUrl={viewModel.sheetUrl ?? undefined}
                    onSelectTab={onSelectTab}
                  />
                ) : null}

                {/*
                  🔴 **주체 범위** — 부부·연인이 한 장부를 나눠 볼 때. 둘 이상일 때만 그린다
                     (선택지 하나인 필터는 화면의 거짓말이다).
                  🔴 `공동` 은 하나의 선택지다 — 사람별 합의 총합이 전체와 정확히 같아야 하므로
                     겹치지 않게 나눈다(근거: `ledgerPayerScope.ts`).
                */}
                {viewModel.offerPayerScope ? (
                  <PayerScopeRow>
                    <PayerScopeLabel htmlFor={payerScopeId}>누구의 것을 볼지</PayerScopeLabel>
                    <Select
                      id={payerScopeId}
                      value={viewModel.payerScope ?? ''}
                      onChange={(event) =>
                        onSelectPayerScope(event.target.value.length === 0 ? null : event.target.value)
                      }
                    >
                      <option value="">전체</option>
                      {viewModel.payers.map((payer) => (
                        <option key={payer} value={payer}>
                          {payer}
                        </option>
                      ))}
                    </Select>
                  </PayerScopeRow>
                ) : null}

                <LedgerMonthNav
                  monthLabel={viewModel.monthLabel}
                  prevLabel={viewModel.prevMonthLabel}
                  nextLabel={viewModel.nextMonthLabel}
                  todayLabel={viewModel.thisMonthLabel}
                  isCurrentMonth={viewModel.isCurrentMonth}
                  titleId={monthTitleId}
                  onPrev={onPrevMonth}
                  onNext={onNextMonth}
                  onToday={onThisMonth}
                />
              </ScopePanel>

              {/* 🔴 이 화면의 주역 카드. 제목이 없고, 월 제목이 그 이름이 된다. */}
              {renderSummaryCard({
                labelledBy: monthTitleId,
                netLabel: copy.summary.net(viewModel.monthLabel),
                summary: viewModel.summary,
                isLoading: viewModel.isFirstLoad,
                isBusy: viewModel.isRefetching
              })}

              {/*
                🔴 B-4 — 배당은 **요약 카드 밖 형제**다(`Card` 안 `Card` 금지 · 주역 카드는 화면당 1개).
                위 요약 3숫자(수입·지출·합계)에는 배당이 **한 번도 더해지지 않는다** — 더하면 "가계부
                총합"의 정의가 둘이 되고, 사용자가 배당 입금을 시트에 이미 적어 뒀다면 이중 계상이 된다.
              */}
              <LedgerDividendCard
                model={viewModel.dividend}
                monthLabel={viewModel.monthLabel}
                onToggle={onToggleDividendOverlay}
              />

              {/*
                P4·P5 — **이 달 살펴보기**. 배당 카드와 같은 층의 형제다(`Card` 안 `Card` 금지 ·
                주역 카드는 화면당 1개이고 그것은 위 월 요약이다).
                🔴 여기 숫자는 요약 3숫자에 **한 번도 더해지지 않는다** — 요약은 "얼마인가",
                   이 카드는 "어디에 몰렸는가"다. 두 카드가 같은 합계를 두 번 말하면 어느 쪽이
                   진짜인지 사용자가 물어야 한다.
                🔴 시트에 아무것도 쓰지 않는다(읽은 것을 접어 보여 줄 뿐이다).
              */}
              <LedgerAnalysisCard model={viewModel.analysis} monthLabel={viewModel.monthLabel} />
            </ScopeRail>

            <LedgerColumn>
              <Card
                tone="default"
                title={copy.list.title}
                subtitle={hasRows ? copy.list.subtitle : undefined}
                /*
                 * 🔴 B-2 — "언제 기준인가"와 "다시 읽기"는 **읽은 것 바로 옆**에 선다(D2-4).
                 * 시각은 아직 한 번도 못 읽었으면 그리지 않는다(없는 값에 "—" 를 남기지 않는다).
                 * 🔴 429 대기 중에는 버튼을 잠그고 아래 사유 줄을 가리킨다 — 연타를 유도하지 않는다.
                 * 🔴 `항목 추가` 는 0건일 때 여기 없다 — 그때는 빈 상태 블록이 그 버튼을 갖는다
                 *   (한 화면에 추가 버튼은 **항상 정확히 1개**).
                 */
                titleRight={
                  <ListToolbar>
                    {/* 제목은 `Card` 가 문자열로만 받는다 — 건수는 도구 줄 맨 앞에 세워 제목과 이웃하게 한다. */}
                    {hasRows ? <CountBadge>{copy.summary.countHint(viewModel.rows.length)}</CountBadge> : null}
                    {viewModel.freshness.readAtText ? (
                      <ReadAtText>{viewModel.freshness.readAtText}</ReadAtText>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      startIcon={<RotateCw size={16} strokeWidth={1.8} aria-hidden focusable={false} />}
                      loading={viewModel.freshness.isRefreshing}
                      disabled={isRefreshBlocked}
                      aria-describedby={refreshBlockedHintId}
                      onClick={onRefresh}
                    >
                      {copy.freshness.refresh}
                    </Button>
                    {hasRows ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        startIcon={<Plus size={16} strokeWidth={1.8} aria-hidden focusable={false} />}
                        disabled={viewModel.isExpired}
                        aria-describedby={viewModel.isExpired ? expiredHintId : undefined}
                        onClick={onOpenCreateForm}
                      >
                        {copy.hero.addEntry}
                      </Button>
                    ) : null}
                  </ListToolbar>
                }
              >
                {viewModel.freshness.retrySeconds === null ? null : (
                  <FreshnessNotice id={refreshHintId}>
                    {copy.error.rateLimitedCountdown(viewModel.freshness.retrySeconds)}
                  </FreshnessNotice>
                )}

                {/* 🔴 "달라졌다"까지만 말한다 — 어느 행이 어떻게 바뀌었는지는 확정할 수 없다(D2-3). */}
                {viewModel.freshness.hasUpdate ? (
                  <FreshnessNotice>
                    <RefreshCw size={14} strokeWidth={1.8} aria-hidden focusable={false} />
                    {copy.freshness.updated}
                  </FreshnessNotice>
                ) : null}

                {viewModel.isFirstLoad ? (
                  <LedgerSkeletonList />
                ) : hasRows ? (
                  <LedgerTable
                    rows={viewModel.rows}
                    monthLabel={viewModel.monthLabel}
                    isWriteBlocked={viewModel.isExpired}
                    writeBlockedHintId={expiredHintId}
                    retryCountdowns={retryCountdowns}
                    onEdit={onOpenEditForm}
                    onRemove={onRequestRemove}
                    onRetry={onRetryRow}
                    registerRemoveButton={registerRemoveButton}
                  />
                ) : (
                  /* 🔴 연결 전과 다른 화면이다 — 월 네비와 요약 카드가 그대로 남아 "연결은 정상"을 증명한다. */
                  <EmptyBlock>
                    <EmptyGlyph aria-hidden>
                      <CalendarOff size={24} strokeWidth={1.8} focusable={false} />
                    </EmptyGlyph>
                    <EmptyTitle ref={listTitleRef} tabIndex={-1} id={listTitleId}>
                      {viewModel.isCurrentMonth
                        ? copy.emptyMonth.titleCurrent
                        : copy.emptyMonth.titleOther(viewModel.monthLabel)}
                    </EmptyTitle>
                    <EmptyBody>
                      {viewModel.latestMonthLabel
                        ? copy.emptyMonth.latestElsewhere(viewModel.latestMonthLabel)
                        : copy.emptyMonth.sheetEmpty}
                    </EmptyBody>
                    <ActionRow>
                      <Button
                        type="button"
                        variant="primary"
                        startIcon={<Plus size={16} strokeWidth={1.8} aria-hidden focusable={false} />}
                        disabled={viewModel.isExpired}
                        aria-describedby={viewModel.isExpired ? expiredHintId : undefined}
                        onClick={onOpenCreateForm}
                      >
                        {copy.emptyMonth.add}
                      </Button>
                      {viewModel.latestMonthLabel ? (
                        <Button type="button" variant="secondary" onClick={onGoLatestMonth}>
                          {copy.emptyMonth.goLatest(viewModel.latestMonthLabel)}
                        </Button>
                      ) : (
                        <Button type="button" variant="secondary" onClick={onPrevMonth}>
                          {copy.emptyMonth.prevMonth}
                        </Button>
                      )}
                    </ActionRow>
                  </EmptyBlock>
                )}
              </Card>

              {/*
                고정비 이어가기 — 지난달 고정비를 이번 달에 한 번에 넣는다.

                🔴 **두 단계다.** 버튼은 목록을 열 뿐이고, 확인해야 시트에 쓴다. 남의 시트에 여러 줄을
                   한 번에 넣는 일이라 한 번의 오조작이 비싸다(되돌리려면 넣은 줄을 하나씩 지운다).
                🔴 이어갈 것이 없으면 **자리 자체가 없다** — 눌러도 아무 일 없는 컨트롤을 두지 않는다.
                🔴 만료 중에는 잠그고 사유 줄을 가리킨다(다른 쓰기 컨트롤과 같은 규율).
              */}
              {viewModel.carryOver ? (
                <Card tone="sunken">
                  {viewModel.carryOver.isOpen ? (
                    <>
                      <CarryOverTitle>{copy.carryOver.title}</CarryOverTitle>
                      <CarryOverBody>{copy.carryOver.body}</CarryOverBody>
                      <CarryOverList>
                        {viewModel.carryOver.rows.map((row) => (
                          <CarryOverRow key={row.id}>
                            <CarryOverLabel>{row.label}</CarryOverLabel>
                            <CarryOverMeta>{row.dateText}</CarryOverMeta>
                            <CarryOverAmount>{row.amountText}</CarryOverAmount>
                          </CarryOverRow>
                        ))}
                      </CarryOverList>
                      <ActionRow>
                        <Button
                          type="button"
                          variant="primary"
                          loading={viewModel.carryOver.isSaving}
                          disabled={viewModel.isExpired}
                          aria-describedby={viewModel.isExpired ? expiredHintId : undefined}
                          onClick={onConfirmCarryOver}
                        >
                          {viewModel.carryOver.isSaving ? copy.carryOver.saving : copy.carryOver.confirm}
                        </Button>
                        <Button type="button" variant="secondary" onClick={onCloseCarryOver}>
                          {copy.carryOver.cancel}
                        </Button>
                      </ActionRow>
                    </>
                  ) : (
                    <ActionRow>
                      <Button
                        type="button"
                        variant="secondary"
                        startIcon={<RotateCw size={16} strokeWidth={1.8} aria-hidden focusable={false} />}
                        disabled={viewModel.isExpired}
                        aria-describedby={viewModel.isExpired ? expiredHintId : undefined}
                        onClick={onOpenCarryOver}
                      >
                        {copy.carryOver.open(viewModel.carryOver.count)}
                      </Button>
                    </ActionRow>
                  )}
                </Card>
              ) : null}

              {/*
                🔴 **되채워 쓰기**(2026-08-09). 히포가 채운 분류는 앱 화면에만 있고 시트에는 빈 칸이라,
                   시트를 단독으로 열면 `월별 요약`·`현금흐름` 의 SUMIFS 가 그 행을 못 세어 요약이
                   통째로 0 이 된다. 적어 주면 두 세계가 같은 것을 본다.
                ⚠ **사용자가 시작한다.** 남의 시트에 여러 줄을 한 번에 넣는 일이라 되돌리려면 하나씩
                  지워야 한다 — 자동으로 조용히 쓰지 않는다.
              */}
              {viewModel.backfill ? (
                <Banner tone="info" title={copy.backfill.title(viewModel.backfill.count)}>
                  <BannerRow>
                    {copy.backfill.body}
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={viewModel.backfill.isSaving}
                      onClick={onRunBackfill}
                    >
                      {viewModel.backfill.isSaving ? copy.backfill.saving : copy.backfill.cta}
                    </Button>
                  </BannerRow>
                </Banner>
              ) : null}

              {/* 🔴 요약 카드 **밖 형제**로 둔다(`Card` 안 `Card` 금지). */}
              {viewModel.partialFailure ? (
                <LedgerFailureList
                  model={viewModel.partialFailure}
                  retryCountdowns={retryCountdowns}
                  onRetry={onRetryRow}
                  onRetryAll={onRetryAll}
                />
              ) : null}
            </LedgerColumn>
          </Workspace>
  );
}
