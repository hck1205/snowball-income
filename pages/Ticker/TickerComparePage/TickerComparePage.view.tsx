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
  PickerStack,
  Stack,
  SuggestionButton,
  SuggestionLabel,
  SuggestionRow,
  SuggestionTickers,
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
  const hintId = useId();
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
        <PickerStack>
          {/* 고른 종목만 가로로 흐른다. 셀렉트·설명은 아래 줄을 각자 차지한다. */}
          {model.columns.length > 0 ? (
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
            </PickerRow>
          ) : null}

          {/* 전폭이라 긴 종목명이 잘리지 않는다.
              상한에 닿으면 컨트롤을 잠그고 **사유를 아래 문장이** 말한다 — 이유 없는 회색 컨트롤 금지. */}
          <Select
            id={addSelectId}
            size="md"
            width="full"
            value=""
            disabled={isAtLimit || options.length === 0}
            aria-label={copy.picker.addLabel}
            aria-describedby={hintId}
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

          <PickerHint id={hintId}>{isAtLimit ? copy.picker.atLimit : copy.picker.hint}</PickerHint>
        </PickerStack>
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
                        {/* 🔴 숫자의 출처를 표에서 감추지 않는다 — 가정을 사실처럼 보이게 하지 않는다.
                            색은 거들 뿐이고 정보는 글자가 진다(회색조에서도 "계산 가정"이 읽힌다). */}
                        <BasisBadge $basis={row.basis} title={copy.basis[row.basis].description}>
                          {copy.basis[row.basis].label}
                        </BasisBadge>
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
          {/*
            🔴 티커만 나열하던 칩 줄을 **라벨 + 티커** 목록으로 바꿨다(2026-08-02 사용자 요청).
            조합이 둘일 때는 "SCHD · JEPI · O" 만으로 충분했지만, 열 개가 되면 그 나열은 읽는 사람에게
            아무 단서도 주지 않는다 — 무엇을 비교하는 조합인지가 고르는 근거다.
          */}
          <SuggestionRow>
            {suggestions.map((preset) => (
              <SuggestionButton
                key={preset.id}
                type="button"
                onClick={() => onApplySuggestion(preset.tickers)}
              >
                <SuggestionLabel>{preset.label}</SuggestionLabel>
                <SuggestionTickers>{preset.tickers.join(' · ')}</SuggestionTickers>
              </SuggestionButton>
            ))}
          </SuggestionRow>
        </EmptyBlock>
      )}

      {model.asOf ? <FootNote>{copy.footnote.asOf(model.asOf)}</FootNote> : null}
      <FootNote>{copy.footnote.disclaimer}</FootNote>
    </Stack>
  );
}
