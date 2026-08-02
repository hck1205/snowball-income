import { useId } from 'react';
import { BarChart3 } from 'lucide-react';
import { Card, Chip, PageHero, Select } from '@/components/common';
import { TICKER_COMPARE_COPY } from '../copy';
import { UNKNOWN_TEXT, formatMonthList, monthLabel } from '../utils';
import type { CompareRow } from '../utils';
import type { TickerCompareViewProps } from './TickerComparePage.types';
import {
  BasisBadge,
  CoverageNote,
  EmptyBlock,
  EmptyBody,
  EmptyTitle,
  ExtremeMark,
  FootNote,
  HeadCell,
  MetricCell,
  MetricNote,
  MonthCell,
  MonthGrid,
  MonthName,
  MonthTickers,
  PickerHint,
  PickerRow,
  Stack,
  SuggestionRow,
  Table,
  TableScroller,
  TickerName,
  UnknownValue,
  ValueCell,
  VisuallyHidden
} from './TickerComparePage.styled';

const copy = TICKER_COMPARE_COPY;

/**
 * 값 한 칸.
 *
 * 🔴 "가장 높음/낮음"은 **텍스트로** 붙는다 — 색이나 굵기만으로 말하면 회색조·스크린리더에서 사라진다.
 * 🔴 그리고 그것은 **사실 진술**이다. "가장 좋음"으로 바꾸지 마라 — 배당률이 높다고 좋은 종목이 아니다.
 */
function ValueContent({ row, index }: { row: CompareRow; index: number }) {
  const cell = row.cells[index];
  if (!cell) return null;
  if (cell.isUnknown) return <UnknownValue>{UNKNOWN_TEXT}</UnknownValue>;

  const isHighest = row.highestIndexes.includes(index);
  const isLowest = row.lowestIndexes.includes(index);

  return (
    <>
      {cell.text}
      {isHighest ? <ExtremeMark>{copy.table.highest}</ExtremeMark> : null}
      {isLowest ? <ExtremeMark>{copy.table.lowest}</ExtremeMark> : null}
    </>
  );
}

export default function TickerCompareView({
  viewModel,
  onAdd,
  onRemove,
  onApplySuggestion
}: TickerCompareViewProps) {
  const addSelectId = useId();
  const { model, candidates, isAtLimit, hasEnough, suggestions } = viewModel;
  const selected = model.columns.map((column) => column.ticker);
  const selectedSet = new Set(selected);
  const options = candidates.filter((candidate) => !selectedSet.has(candidate.ticker));

  return (
    <Stack>
      <PageHero
        icon={<BarChart3 size={20} strokeWidth={1.8} aria-hidden focusable={false} />}
        title={copy.hero.title}
        titleAs="h1"
        lede={copy.hero.lede}
      />

      <Card tone="default" title={copy.picker.title}>
        <PickerRow>
          {model.columns.map((column) => (
            <Chip
              key={column.ticker}
              selected
              onRemove={() => onRemove(column.ticker)}
              removeAriaLabel={copy.picker.removeAria(column.ticker)}
            >
              {column.ticker}
            </Chip>
          ))}

          {/* 상한에 닿으면 컨트롤을 잠그고 **사유를 글로** 말한다 — 이유 없는 회색 컨트롤 금지. */}
          <Select
            id={addSelectId}
            size="md"
            width="auto"
            minWidth="14rem"
            value=""
            disabled={isAtLimit || options.length === 0}
            aria-label={copy.picker.addLabel}
            onChange={(event) => {
              const ticker = event.target.value;
              if (ticker) onAdd(ticker);
            }}
          >
            <option value="">{copy.picker.addPlaceholder}</option>
            {options.map((candidate) => (
              <option key={candidate.ticker} value={candidate.ticker}>
                {candidate.ticker} · {candidate.name}
                {candidate.hasPayoutMonths ? '' : copy.picker.noScheduleSuffix}
              </option>
            ))}
          </Select>

          <PickerHint>{isAtLimit ? copy.picker.atLimit : copy.picker.hint}</PickerHint>
        </PickerRow>
      </Card>

      {hasEnough ? (
        <>
          <Card tone="default" title={copy.table.caption}>
            <TableScroller>
              <Table>
                <caption>
                  <VisuallyHidden>{copy.table.caption}</VisuallyHidden>
                </caption>
                <thead>
                  <tr>
                    <HeadCell scope="col">{copy.table.metricHeader}</HeadCell>
                    {model.columns.map((column) => (
                      <HeadCell key={column.ticker} scope="col">
                        {column.ticker}
                        <TickerName>{column.name}</TickerName>
                      </HeadCell>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {model.rows.map((row) => (
                    <tr key={row.key}>
                      <MetricCell scope="row">
                        {row.label}
                        {/* 🔴 숫자의 출처를 표에서 감추지 않는다 — 가정을 사실처럼 보이게 하지 않는다. */}
                        <BasisBadge>{copy.basis[row.basis].label}</BasisBadge>
                        {row.note ? <MetricNote>{row.note}</MetricNote> : null}
                      </MetricCell>
                      {row.cells.map((_, index) => (
                        <ValueCell key={model.columns[index]?.ticker ?? index}>
                          <ValueContent row={row} index={index} />
                        </ValueCell>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableScroller>
          </Card>

          <Card tone="default" title={copy.coverage.title} subtitle={copy.coverage.subtitle}>
            <MonthGrid>
              {model.coverage.tickersByMonth.map((tickers, index) => {
                const month = index + 1;
                const isPaid = tickers.length > 0;
                return (
                  <MonthCell
                    key={month}
                    $paid={isPaid}
                    aria-label={copy.coverage.monthAria(
                      monthLabel(month),
                      isPaid ? tickers.join(', ') : copy.coverage.noneLabel
                    )}
                  >
                    <MonthName>{month}</MonthName>
                    <MonthTickers aria-hidden>{isPaid ? tickers.join(' ') : '·'}</MonthTickers>
                  </MonthCell>
                );
              })}
            </MonthGrid>

            <CoverageNote>
              {model.coverage.isEveryMonthCovered
                ? copy.coverage.everyMonth
                : copy.coverage.gaps(formatMonthList(model.coverage.gapMonths))}
            </CoverageNote>

            {/* 🔴 지급월을 모르는 종목은 "지급 없음"으로 접지 않는다 — 따로 말한다. */}
            {model.coverage.unknownTickers.length > 0 ? (
              <CoverageNote>{copy.coverage.unknown(model.coverage.unknownTickers.join(', '))}</CoverageNote>
            ) : null}
          </Card>
        </>
      ) : (
        <EmptyBlock>
          <EmptyTitle>{copy.empty.title}</EmptyTitle>
          <EmptyBody>{copy.empty.body}</EmptyBody>
          <EmptyBody>{copy.empty.suggestionTitle}</EmptyBody>
          <SuggestionRow>
            {suggestions.map((tickers) => (
              <Chip key={tickers.join('-')} onClick={() => onApplySuggestion(tickers)}>
                {tickers.join(' · ')}
              </Chip>
            ))}
          </SuggestionRow>
        </EmptyBlock>
      )}

      {model.asOf ? <FootNote>{copy.footnote.asOf(model.asOf)}</FootNote> : null}
      <FootNote>{copy.footnote.disclaimer}</FootNote>
    </Stack>
  );
}
