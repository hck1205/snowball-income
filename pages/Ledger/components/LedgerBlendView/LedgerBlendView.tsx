import { useId } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, ExternalLink } from 'lucide-react';
import { Button, Card, Chip } from '@/components/common';
import { LEDGER_COPY } from '../../copy';
import type {
  LedgerBlendFailure,
  LedgerBlendRow,
  LedgerBlendSourceKey,
  LedgerBlendSubtotal,
  LedgerBlendUnreadable
} from '../../types';
import type { LedgerBlendViewProps } from './LedgerBlendView.types';
import {
  ActionCell,
  AmountText,
  EllipsisText,
  EmptyBlock,
  FailureActions,
  FailureBlock,
  FailureReason,
  FailureTitle,
  KindChipInner,
  MemoText,
  Note,
  NoteList,
  RowHeader,
  SkeletonList,
  SkeletonRow,
  SourceBadge,
  SubtotalCount,
  SubtotalHeading,
  SubtotalItem,
  SubtotalList,
  SubtotalNumbers,
  SubtotalSection,
  TD,
  TH,
  Table,
  TableWrap,
  VisuallyHidden
} from './LedgerBlendView.styled';

const copy = LEDGER_COPY;

const SKELETON_ROWS = [0, 1, 2];

/**
 * B-3 **두 가계부 블렌딩 뷰** — "우리 가계"의 이 달 기록을 한 목록으로 본다.
 *
 * 🔴 **읽기 전용이다**(D3-4). 이 컴포넌트에는 추가·수정·삭제·재시도 버튼이 **하나도 없다** —
 *    쓰기 안전 체계(스냅샷 참조·충돌 비교)가 링크 단위라 두 링크가 섞인 화면의 쓰기는 "어느 시트에
 *    쓰나"부터 오류 표면이 두 배가 된다. 행에서 나가는 길은 "그 가계부에서 열기" 하나뿐이다.
 * 🔴 **합산 3숫자는 여기 없다.** 그것은 페이지의 주역 카드가 그리고, `body.kind === 'ready'` 일
 *    때에만 존재한다 — 한쪽이라도 실패하면 그 필드가 타입에 아예 없어서(`LedgerBlendBody`) 반쪽
 *    합계를 그리려면 갈래를 통째로 바꿔야 한다. 여기서 0 이나 대시로 "합계처럼" 채우지 마라.
 * 🔴 **분류를 합치지 않는다**(D3-5) — 두 가계부의 분류 문자열을 원문 그대로 그린다.
 * 🔴 **배당 카드를 렌더하지 않는다**(D4-5) — "우리 가계" 지출에 "내 포트폴리오" 배당을 겹치면
 *    귀속이 섞인다(배당은 한 사람 것).
 */
export default function LedgerBlendView({
  model,
  monthLabel,
  openableSources,
  openBlockedReason,
  onOpenSource,
  onReload
}: LedgerBlendViewProps) {
  const body = model.body;
  const idPrefix = useId();
  /* 소계 묶음에 접근명을 준다 — 같은 금액이 목록과 소계 양쪽에 나오므로 "어느 자리의 숫자인가"가
     접근성 트리에서 구분돼야 한다(스크린리더에서도, 테스트에서도). */
  const subtotalTitleId = `${idPrefix}-blend-subtotal`;
  /* "열기"가 막혔을 때의 사유 줄. 🔴 화면에 **하나**이고 비활성 버튼들이 전부 이것을 가리킨다. */
  const openBlockedHintId = `${idPrefix}-blend-open-blocked`;

  return (
    <Card tone="default" title={copy.blend.view.title} subtitle={copy.blend.view.subtitle}>
      {body.kind === 'loading' ? (
        <>
          <Note>{copy.blend.view.loading}</Note>
          <SkeletonList aria-hidden>
            {SKELETON_ROWS.map((row) => (
              <SkeletonRow key={row} />
            ))}
          </SkeletonList>
        </>
      ) : null}

      {body.kind === 'unavailable' ? (
        <>
          {/* 🔴 숫자를 하나도 만들지 않는다 — 두 실패만 말한다. */}
          <FailureTitle>{copy.blend.view.unavailableTitle}</FailureTitle>
          {body.failures.map((failure) => renderFailure(failure, onReload))}
        </>
      ) : null}

      {body.kind === 'partial' ? (
        <>
          {/* 🔴 AC3-5 — 합계 자리를 0 으로 채우지 않고 "표시할 수 없다"고 말한다. */}
          <FailureBlock>
            <FailureTitle>{copy.blend.view.partialTitle}</FailureTitle>
            <FailureReason>{copy.blend.view.partialBody(body.failure.label)}</FailureReason>
          </FailureBlock>
          {renderFailure(body.failure, onReload)}
        </>
      ) : null}

      {body.kind === 'partial' || body.kind === 'ready' ? (
        <>
          {renderSubtotals(body.kind === 'ready' ? body.subtotals : [body.available], subtotalTitleId)}
          {renderNotes({ unreadable: body.unreadable, openableSources, openBlockedReason, openBlockedHintId })}
          {body.rows.length === 0 ? (
            <EmptyBlock>{copy.blend.view.emptyMonth(monthLabel)}</EmptyBlock>
          ) : (
            renderTable({
              rows: body.rows,
              monthLabel,
              openableSources,
              openBlockedReason,
              openBlockedHintId,
              onOpenSource
            })
          )}
        </>
      ) : null}
    </Card>
  );
}

/**
 * 출처 한쪽의 읽기 실패. 🔴 문구는 **읽기 쪽 문장**(`blend.view.reason`)을 쓴다 — 저장 실패의
 * 목소리(`error.*`)를 빌려 오면 "저장하지 못했습니다"라는 사실과 다른 말이 된다.
 */
const renderFailure = (failure: LedgerBlendFailure, onReload: () => void) => (
  <FailureBlock key={failure.source}>
    <FailureTitle>{copy.blend.view.failureTitle(failure.label)}</FailureTitle>
    <FailureReason>{copy.blend.view.reason[failure.error.reason]}</FailureReason>
    <FailureActions>
      <Button type="button" size="sm" variant="secondary" onClick={onReload}>
        {copy.blend.view.retry}
      </Button>
    </FailureActions>
  </FailureBlock>
);

/**
 * 출처별 소계. 🔴 이것은 **합산이 아니다** — 각 가계부 하나의 숫자다. 한쪽만 성공한 화면에서도
 * 같은 자리에 서기 때문에, "누가 얼마 썼는지"는 언제나 이 줄이 답한다.
 */
const renderSubtotals = (subtotals: readonly LedgerBlendSubtotal[], titleId: string) => (
  <SubtotalSection aria-labelledby={titleId}>
    <SubtotalHeading id={titleId}>{copy.blend.view.subtotalTitle}</SubtotalHeading>
    <SubtotalList>
      {subtotals.map((subtotal) => (
        <SubtotalItem key={subtotal.source}>
          <SourceBadge $source={subtotal.source} title={subtotal.label}>
            {subtotal.label}
          </SourceBadge>
          <SubtotalNumbers>
            <dt>{copy.summary.income}</dt>
            <dd>
              {subtotal.incomeText}
              <SubtotalCount>{copy.summary.countHint(subtotal.incomeCount)}</SubtotalCount>
            </dd>
            <dt>{copy.summary.expense}</dt>
            <dd>
              {subtotal.expenseText}
              <SubtotalCount>{copy.summary.countHint(subtotal.expenseCount)}</SubtotalCount>
            </dd>
          </SubtotalNumbers>
        </SubtotalItem>
      ))}
    </SubtotalList>
    <Note>{copy.blend.view.subtotalCaption}</Note>
  </SubtotalSection>
);

/** 전제·한계 문장. 🔴 접지 않고 편다 — 접힌 뒤에 있으면 사용자는 없는 것으로 읽는다. */
const renderNotes = (params: {
  unreadable: readonly LedgerBlendUnreadable[];
  openableSources: readonly LedgerBlendSourceKey[];
  openBlockedReason: string | null;
  openBlockedHintId: string;
}) => (
  <NoteList>
    <Note>{copy.blend.currencyNote}</Note>
    <Note>{copy.blend.view.readOnly}</Note>
    {/* 두 출처가 모두 열 수 있는 것이 아니면 왜 버튼이 없는지 말한다(무음 누락 금지). */}
    {params.openableSources.length < 2 ? <Note>{copy.blend.view.openElsewhere}</Note> : null}
    {/*
      🔴 "열기"가 막힌 사유. 열 수 있는 출처가 하나도 없으면 버튼 자체가 없으므로 그리지 않는다 —
      막을 것이 없는 화면에 경고만 남기지 않는다. 사유 문장은 탭 전환과 **같은 출처**의 것이고,
      그 문장이 가리키는 대기열 목록이 이 화면에는 없으므로 나가는 길을 한 문장 덧붙인다.
    */}
    {params.openBlockedReason !== null && params.openableSources.length > 0 ? (
      <Note id={params.openBlockedHintId}>
        {params.openBlockedReason} {copy.blend.view.openBlockedHint}
      </Note>
    ) : null}
    {params.unreadable.map((item) => (
      <Note key={item.source}>{copy.blend.view.unreadable(item.label, item.count)}</Note>
    ))}
  </NoteList>
);

/** 표 모드에서 열 수를 지키기 위한 열 수(날짜·가계부·구분·분류·금액·메모·작업). */
const COLUMN_LABELS = [
  copy.list.columnDate,
  copy.blend.view.columnSource,
  copy.list.columnKind,
  copy.list.columnCategory,
  copy.list.columnAmount,
  copy.list.columnMemo
] as const;

const renderTable = (params: {
  rows: readonly LedgerBlendRow[];
  monthLabel: string;
  openableSources: readonly LedgerBlendSourceKey[];
  openBlockedReason: string | null;
  openBlockedHintId: string;
  onOpenSource: (source: LedgerBlendSourceKey) => void;
}) => {
  const isOpenBlocked = params.openBlockedReason !== null;

  return (
    <TableWrap>
      <Table>
        <caption>{copy.blend.view.caption(params.monthLabel)}</caption>
        <thead>
          <tr>
            {COLUMN_LABELS.map((label, index) => (
              <TH key={label} scope="col" $align={index === 4 ? 'right' : 'left'}>
                {label}
              </TH>
            ))}
            <TH scope="col">
              <VisuallyHidden>{copy.list.columnActions}</VisuallyHidden>
            </TH>
          </tr>
        </thead>
        {params.rows.map((row) => {
          const kindText = row.kind === 'income' ? copy.list.kindIncome : copy.list.kindExpense;
          const canOpen = params.openableSources.includes(row.source);

          return (
            /*
             * 🔴 **한 기록 = 한 `<tbody>`**(`LedgerTable` 의 정본 관용구). 카드 모드(≤820px)에서
             * 카드가 되는 것은 `tbody` 이고, `ActionCell` 이 `position: absolute` 로 그 카드의
             * 우상단에 앉는다 — 모든 행을 한 `tbody` 에 몰아 넣으면 positioned ancestor 가 하나뿐이라
             * **모든 행의 "열기" 버튼이 같은 자리에 포개진다**(마지막 하나만 누를 수 있다).
             *   ⚠ `LedgerTable` 과 부품을 공유하지 않는 이유: 저쪽은 다른 화면의 정본이고 열 구성
             *   (출처 열 · 실패 줄 유무)과 액션이 다르다. 공유하려면 두 화면의 열·행 모델을 하나로
             *   합쳐야 하는데, 그 결합이 이 관용구 한 줄보다 비싸다.
             * 🔴 리스트 키는 `blendId` 다 — `id` 는 원본 조회의 열쇠라 가공하지 않는다.
             */
            <tbody key={row.blendId}>
              <tr>
                <RowHeader scope="row">
                  <time dateTime={row.dateISO}>{row.dateText}</time>
                </RowHeader>
                <TD $align="left" data-label={copy.blend.view.columnSource}>
                  {/* 🔴 출처의 1차 채널은 이 **텍스트**다. 색과 테두리 모양은 보조로 겹친다. */}
                  <SourceBadge $source={row.source} title={row.sourceLabel}>
                    {row.sourceLabel}
                  </SourceBadge>
                </TD>
                <TD $align="left" data-label={copy.list.columnKind}>
                  <Chip variant="neutral">
                    <KindChipInner>
                      {row.kind === 'income' ? (
                        <ArrowDownToLine size={14} strokeWidth={1.8} aria-hidden focusable={false} />
                      ) : (
                        <ArrowUpFromLine size={14} strokeWidth={1.8} aria-hidden focusable={false} />
                      )}
                      {kindText}
                    </KindChipInner>
                  </Chip>
                </TD>
                <TD $align="left" data-label={copy.list.columnCategory}>
                  {/* 🔴 분류는 두 가계부의 원문 그대로다(D3-5 — 앱이 분류 체계를 통합하지 않는다). */}
                  <EllipsisText title={row.category}>{row.category}</EllipsisText>
                </TD>
                <TD data-label={copy.list.columnAmount}>
                  <AmountText>{row.amountText}</AmountText>
                </TD>
                <TD $align="left" data-label={copy.list.columnMemo}>
                  <MemoText title={row.memo || undefined}>{row.memo || copy.list.noMemo}</MemoText>
                </TD>
                <ActionCell>
                  {canOpen ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      iconOnly
                      /* 🔴 이 버튼은 탭 전환이다 — 막혔으면 비활성이고 사유 줄을 가리킨다. */
                      disabled={isOpenBlocked}
                      aria-describedby={isOpenBlocked ? params.openBlockedHintId : undefined}
                      aria-label={copy.blend.view.openRowAria(
                        row.dateText,
                        row.category,
                        row.amountText,
                        row.sourceLabel
                      )}
                      onClick={() => params.onOpenSource(row.source)}
                    >
                      <ExternalLink size={16} strokeWidth={1.8} aria-hidden focusable={false} />
                    </Button>
                  ) : null}
                </ActionCell>
              </tr>
            </tbody>
          );
        })}
      </Table>
    </TableWrap>
  );
};
