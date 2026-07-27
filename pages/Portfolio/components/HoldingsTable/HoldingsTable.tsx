import { useId } from 'react';
import { Trash2 } from 'lucide-react';
import { Button, QuantityInput } from '@/components/common';
import { PORTFOLIO_COPY } from '../../copy';
import { FreshnessBadge } from '../FreshnessBadge';
import type { HoldingsTableProps } from './HoldingsTable.types';
import {
  DeleteCell,
  QuantityCell,
  RowHeader,
  RowNote,
  TD,
  TH,
  Table,
  TableWrap,
  TickerLine,
  TickerName,
  TickerSymbol,
  VisuallyHidden
} from './HoldingsTable.styled';

const copy = PORTFOLIO_COPY;

/**
 * 보유 종목 표.
 *
 * 접근성 계약: `<caption>`(sr-only) · `<th scope="col">` · 행 이름은 `<th scope="row">` ·
 * 삭제 열 머리는 시각 라벨 없이 sr-only 텍스트. 수량 입력은 시각 라벨이 없으므로 `aria-label` 로
 * 이름을 갖고, 사유 문구가 있으면 `aria-describedby` 로 연결한다.
 */
export default function HoldingsTable({
  rows,
  onQuantityChange,
  onQuantityBlur,
  onRemove,
  registerQuantityInput,
  registerDeleteButton
}: HoldingsTableProps) {
  const noteIdPrefix = useId();

  return (
    <TableWrap>
      <Table>
        <caption>{copy.holdings.caption}</caption>
        <thead>
          <tr>
            <TH scope="col" $align="left">
              {copy.holdings.columnTicker}
            </TH>
            <TH scope="col">{copy.holdings.columnQuantity}</TH>
            <TH scope="col">{copy.holdings.columnMarketValue}</TH>
            <TH scope="col">{copy.holdings.columnAnnualNet}</TH>
            <TH scope="col">
              <VisuallyHidden>{copy.holdings.columnActions}</VisuallyHidden>
            </TH>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const noteId = row.note ? `${noteIdPrefix}-${row.ticker}` : undefined;

            return (
              <tr key={row.ticker}>
                <RowHeader scope="row">
                  <TickerLine>
                    <TickerSymbol>{row.ticker}</TickerSymbol>
                    {row.name ? <TickerName>{row.name}</TickerName> : null}
                    <FreshnessBadge tone={row.badge} />
                  </TickerLine>
                  {/* 사유는 "아직 안 적었다"·"데이터가 없다"이지 에러가 아니다 — 중립 톤·role 없음. */}
                  {row.note ? <RowNote id={noteId}>{row.note}</RowNote> : null}
                </RowHeader>

                <QuantityCell data-label={copy.holdings.columnQuantity}>
                  <QuantityInput
                    value={row.quantityInput}
                    ariaLabel={copy.holdings.quantityAria(row.ticker)}
                    suffix={copy.holdings.quantityUnit}
                    describedById={noteId}
                    inputRef={(node) => registerQuantityInput(row.ticker, node)}
                    onChange={(next) => onQuantityChange(row.ticker, next)}
                    onBlur={() => onQuantityBlur(row.ticker)}
                  />
                </QuantityCell>

                <TD data-label={copy.holdings.columnMarketValue}>{row.marketValue}</TD>
                <TD data-label={copy.holdings.columnAnnualNet}>{row.annualNet}</TD>

                <DeleteCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    iconOnly
                    aria-label={copy.holdings.deleteAria(row.ticker)}
                    ref={(node) => registerDeleteButton(row.ticker, node)}
                    onClick={() => onRemove(row.ticker)}
                  >
                    <Trash2 size={14} strokeWidth={1.8} aria-hidden focusable={false} />
                  </Button>
                </DeleteCell>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </TableWrap>
  );
}
