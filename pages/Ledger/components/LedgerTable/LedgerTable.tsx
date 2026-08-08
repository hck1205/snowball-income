import { ArrowDownToLine, ArrowUpFromLine, Pencil, TriangleAlert, Trash2 } from 'lucide-react';
import { Button } from '@/components/common';
import { LEDGER_COPY } from '../../copy';
import { kindLabel } from '../../utils';
import type { LedgerTableProps } from './LedgerTable.types';
import {
  ActionCell,
  AmountText,
  CategoryText,
  DetailCell,
  KindChipInner,
  MemoText,
  RowActions,
  RowError,
  RowErrorCell,
  RowErrorLabel,
  RowErrorReason,
  RowErrorText,
  RowHeader,
  TD,
  TH,
  Table,
  TableWrap,
  VisuallyHidden
} from './LedgerTable.styled';

const copy = LEDGER_COPY;

/**
 * 표 모드에서 실패 줄이 전폭을 차지하게 하는 열 수.
 * 🔴 열 구성이 바뀌면 **여기도 함께 고쳐라** — 어긋나면 실패 줄이 표 밖으로 삐져나온다.
 * 지금은 날짜 · 내역 · 구분 · 금액 · 작업 **5열**이다(2026-08-03, 분류와 메모를 한 칸으로 합쳤다).
 */
const COLUMN_COUNT = 5;

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
 *
 * ## 열 구성 (2026-08-03)
 * 분류와 메모가 각자 한 열을 갖던 것을 **"내역" 한 칸의 두 줄**로 합쳤다. 메모의 열 이름은 사라진
 * 것이 아니라 `VisuallyHidden` 으로 옮겨 갔다 — 화면에서는 두 번째 줄이라는 위치가 이미 말하고,
 * 스크린리더에는 그대로 남는다.
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
              {copy.list.columnCategory}
            </TH>
            <TH scope="col" $align="left">
              {copy.list.columnKind}
            </TH>
            <TH scope="col">{copy.list.columnAmount}</TH>
            <TH scope="col">
              {/* 작업 열 머리는 시각 라벨이 없다 — 접근성 트리에만 남긴다. */}
              <VisuallyHidden>{copy.list.columnActions}</VisuallyHidden>
            </TH>
          </tr>
        </thead>
        {rows.map((row) => {
          const kindText = kindLabel(row.kind, copy.list);
          const blockedSeconds = retryCountdowns.get(row.id) ?? 0;

          return (
            /* 한 기록 = 한 `<tbody>`. 실패 줄을 같은 카드 안에 두면서 표 모드의 열 수를 지키는
               유일한 방법이다(styled 파일의 `stackedTable` 주석 참고). */
            <tbody key={row.id}>
              <tr>
                <RowHeader scope="row">
                  <time dateTime={row.dateISO}>{row.dateText}</time>
                </RowHeader>

                <TD $align="left" $area="detail" data-label={copy.list.columnCategory}>
                  <DetailCell>
                    <CategoryText title={row.category}>{row.category}</CategoryText>
                    {/* 비었으면 요소 자체를 만들지 않는다 — 🔴 "—" 를 넣지 마라. */}
                    {row.memo ? (
                      <>
                        {/* 메모의 열 이름은 사라지지 않았다 — 화면에서만 빠지고 접근성 트리에는 남는다.
                            🔴 라벨을 `MemoText` **안**에 넣지 마라: 그러면 그 요소의 텍스트가
                            "메모점심"이 되어 메모 원문으로 조회할 수 없다. */}
                        <VisuallyHidden>{copy.list.columnMemo}</VisuallyHidden>
                        <MemoText title={row.memo}>{row.memo}</MemoText>
                      </>
                    ) : null}
                  </DetailCell>
                </TD>

                <TD $align="left" $area="kind" data-label={copy.list.columnKind}>
                  {/*
                    🔴 **칩 껍데기를 벗겼다**(2026-08-08 사용자 지적). 둥근 테두리가 아이콘과 글자를
                       자기 안쪽 여백 기준으로 밀어 칸 안에서 가운데로 안 보였고, 애초에 이 칸은
                       상태 배지가 아니라 **값**이다 — 표의 다른 칸과 같은 무게여야 한다.
                       구별은 여전히 아이콘 + 글자가 한다(색 단독 채널 금지는 그대로).
                  */}
                  <KindChipInner>
                    {row.kind === 'income' ? (
                      <ArrowDownToLine size={14} strokeWidth={1.8} aria-hidden focusable={false} />
                    ) : (
                      <ArrowUpFromLine size={14} strokeWidth={1.8} aria-hidden focusable={false} />
                    )}
                    {kindText}
                  </KindChipInner>
                </TD>

                <TD $area="amount" data-label={copy.list.columnAmount}>
                  {/* 🔴 부호 없는 절대값. 방향은 구분 칩이 말한다. */}
                  <AmountText>{row.amountText}</AmountText>
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
                      <TriangleAlert size={18} strokeWidth={1.8} aria-hidden focusable={false} />
                      <RowErrorText>
                        {/* 🔴 색이 아니라 이 텍스트가 1차 채널이다. */}
                        <RowErrorLabel>{copy.error.rowFailed}</RowErrorLabel>
                        <RowErrorReason>{row.failure.body}</RowErrorReason>
                      </RowErrorText>
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
