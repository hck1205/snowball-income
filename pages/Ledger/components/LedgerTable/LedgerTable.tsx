import { ArrowDownToLine, ArrowUpFromLine, Pencil, Trash2 } from 'lucide-react';
import { Button, Chip } from '@/components/common';
import { LEDGER_COPY } from '../../copy';
import type { LedgerTableProps } from './LedgerTable.types';
import {
  ActionCell,
  AmountText,
  EllipsisText,
  KindChipInner,
  MemoText,
  RowActions,
  RowError,
  RowErrorCell,
  RowErrorLabel,
  RowErrorReason,
  RowHeader,
  TD,
  TH,
  Table,
  TableWrap,
  VisuallyHidden
} from './LedgerTable.styled';

const copy = LEDGER_COPY;

/** 표 모드에서 실패 줄이 전폭을 차지하게 하는 열 수(날짜·구분·분류·금액·메모·작업). */
const COLUMN_COUNT = 6;

/**
 * 거래 내역 표.
 *
 * 🔴 **정렬하지 않는다** — 시트 행 순서 그대로다(`copy.list.subtitle` 이 그 사실을 말한다).
 * 시트가 정본이라는 원칙의 화면 표현이고, 앱이 시트를 정렬하지도 않는다.
 *
 * 🔴 행 액션의 접근명에는 **행 맥락**(날짜·분류·금액)을 담는다. 스크린리더의 버튼 목록에서
 * "수정"이 20개 나오면 아무것도 구분되지 않는다.
 *
 * 🔴 개별 `RowError` 에는 `role` 을 주지 않는다 — 10건 실패에서 10번 끼어든다. 낭독은 목록 위
 * 요약 배너(`role="alert"`) 한 번이면 충분하다.
 */
export default function LedgerTable({
  rows,
  monthLabel,
  isWriteBlocked,
  writeBlockedHintId,
  retryCountdowns,
  onEdit,
  onRemove,
  onRetry,
  registerRemoveButton
}: LedgerTableProps) {
  return (
    <TableWrap>
      <Table>
        <caption>{copy.list.caption(monthLabel)}</caption>
        <thead>
          <tr>
            <TH scope="col" $align="left">
              {copy.list.columnDate}
            </TH>
            <TH scope="col" $align="left">
              {copy.list.columnKind}
            </TH>
            <TH scope="col" $align="left">
              {copy.list.columnCategory}
            </TH>
            <TH scope="col">{copy.list.columnAmount}</TH>
            <TH scope="col" $align="left">
              {copy.list.columnMemo}
            </TH>
            <TH scope="col">
              {/* 작업 열 머리는 시각 라벨이 없다 — 접근성 트리에만 남긴다. */}
              <VisuallyHidden>{copy.list.columnActions}</VisuallyHidden>
            </TH>
          </tr>
        </thead>
        {rows.map((row) => {
          const kindText = row.kind === 'income' ? copy.list.kindIncome : copy.list.kindExpense;
          const blockedSeconds = retryCountdowns.get(row.id) ?? 0;

          return (
            /* 한 기록 = 한 `<tbody>`. 실패 줄을 같은 카드 안에 두면서 표 모드의 열 수를 지키는
               유일한 방법이다(styled 파일의 `stackedTable` 주석 참고). */
            <tbody key={row.id}>
              <tr>
                <RowHeader scope="row">
                  <time dateTime={row.dateISO}>{row.dateText}</time>
                </RowHeader>
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
                  <EllipsisText title={row.category}>{row.category}</EllipsisText>
                </TD>
                <TD data-label={copy.list.columnAmount}>
                  {/* 🔴 부호 없는 절대값. 방향은 구분 칩이 말한다. */}
                  <AmountText>{row.amountText}</AmountText>
                </TD>
                <TD $align="left" data-label={copy.list.columnMemo}>
                  {/* 비었으면 셀을 비운다 — 🔴 "—" 를 넣지 마라. */}
                  <MemoText title={row.memo || undefined}>{row.memo || copy.list.noMemo}</MemoText>
                </TD>
                <ActionCell>
                  <RowActions>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      iconOnly
                      disabled={isWriteBlocked}
                      aria-describedby={isWriteBlocked ? writeBlockedHintId : undefined}
                      aria-label={copy.list.editAria(row.dateText, row.category, row.amountText)}
                      onClick={() => onEdit(row.id)}
                    >
                      <Pencil size={16} strokeWidth={1.8} aria-hidden focusable={false} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      iconOnly
                      ref={(node) => registerRemoveButton?.(row.id, node)}
                      disabled={isWriteBlocked}
                      aria-describedby={isWriteBlocked ? writeBlockedHintId : undefined}
                      aria-label={copy.list.removeAria(row.dateText, row.category, row.amountText)}
                      onClick={() => onRemove(row.id)}
                    >
                      <Trash2 size={16} strokeWidth={1.8} aria-hidden focusable={false} />
                    </Button>
                  </RowActions>
                </ActionCell>
              </tr>

              {row.failure ? (
                <tr>
                  <RowErrorCell colSpan={COLUMN_COUNT}>
                    <RowError>
                      {/* 🔴 색이 아니라 이 텍스트가 1차 채널이다. */}
                      <RowErrorLabel>{copy.error.rowFailed}</RowErrorLabel>
                      <RowErrorReason>{row.failure.body}</RowErrorReason>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={blockedSeconds > 0 || isWriteBlocked}
                        aria-describedby={isWriteBlocked ? writeBlockedHintId : undefined}
                        aria-label={copy.list.retryAria(row.dateText, row.category, row.amountText)}
                        onClick={() => onRetry(row.id)}
                      >
                        {blockedSeconds > 0 ? copy.error.retryIn(blockedSeconds) : copy.error.retry}
                      </Button>
                    </RowError>
                  </RowErrorCell>
                </tr>
              ) : null}
            </tbody>
          );
        })}
      </Table>
    </TableWrap>
  );
}
