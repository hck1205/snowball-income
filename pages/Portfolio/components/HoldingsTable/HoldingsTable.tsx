import { useId, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Trash2 } from 'lucide-react';
import { Button, QuantityInput } from '@/components/common';
import { assignSeries } from '@/shared/lib/tickerSeries';
import { PORTFOLIO_COPY } from '../../copy';
import { FreshnessBadge } from '../FreshnessBadge';
import type { HoldingsTableProps } from './HoldingsTable.types';
import {
  DeleteCell,
  IncomeCell,
  QuantityCell,
  RowHeader,
  RowNote,
  ShareFill,
  ShareLine,
  ShareTrack,
  ShareValue,
  TD,
  TH,
  Table,
  TableWrap,
  TickerEar,
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

  /*
   * 🔴 색 배정은 **여기서 한 번** 한다(요약 카드의 도넛도 같은 함수를 각자 부른다).
   * `assignSeries` 는 순수·결정적이고 내부에서 정렬하므로 두 호출부가 맵을 주고받지 않아도
   * 같은 답을 낸다 — 그래서 페이지 모델에 색을 실어 나르는 배선을 만들지 않았다.
   */
  const seriesByTicker = useMemo(() => assignSeries(rows.map((row) => row.ticker)), [rows]);

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
            /* 연속값(색·폭)이라 클래스가 아니라 인라인 변수로 — 종목 수만큼 클래스가 불어나지 않게. */
            const rowStyle = { '--sb-row-series': seriesByTicker.get(row.ticker) } as CSSProperties;
            const share = row.weightPercent;

            return (
              <tr key={row.ticker} style={rowStyle}>
                <RowHeader scope="row">
                  <TickerLine>
                    <TickerEar aria-hidden />
                    <TickerSymbol>{row.ticker}</TickerSymbol>
                    {row.name ? <TickerName>{row.name}</TickerName> : null}
                    <FreshnessBadge tone={row.badge} />
                  </TickerLine>
                  {/* 비중 — 막대는 장식이고 숫자가 사실을 말한다(색 단독 채널 금지). */}
                  {share === null ? null : (
                    <ShareLine>
                      <ShareTrack aria-hidden>
                        <ShareFill style={{ width: `${Math.min(100, share)}%` }} />
                      </ShareTrack>
                      <ShareValue>{copy.holdings.share(copy.summary.composition.percent(share))}</ShareValue>
                    </ShareLine>
                  )}
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
                {/* 🔴 표에서 가장 진한 숫자 — 이 앱의 주제가 배당이라 표도 그렇게 읽혀야 한다.
                    색이 아니라 굵기·잉크 농도로만 가른다(숫자에 색 금지). */}
                <IncomeCell data-label={copy.holdings.columnAnnualNet}>{row.annualNet}</IncomeCell>

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
