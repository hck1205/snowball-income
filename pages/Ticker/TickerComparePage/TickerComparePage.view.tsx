import { useId, useMemo } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Calculator,
  CalendarCheck,
  CalendarRange,
  Globe2,
  Layers,
  Landmark,
  LineChart,
  Repeat,
  ShieldCheck,
  Sprout,
  Wallet,
  X
} from 'lucide-react';
import type { ReactNode } from 'react';
import { BrandGlyph, Button, Card, ComboBox, PageFooter, PageHero, PickCard, PickCardGrid } from '@/components/common';
import { ICON } from '@/shared/styles';
import { assignSeries } from '@/shared/lib/tickerSeries';
import { TICKER_COMPARE_COPY } from '../copy';
import { MAX_COMPARE_TICKERS, UNKNOWN_TEXT, formatMonthList, monthLabel } from '../utils';
import type { CompareRow } from '../utils';
import { TICKER_COMPARE_LAYOUT_COPY, groupRowsByBasis } from './TickerComparePage.utils';
import type { TickerCompareViewProps } from './TickerComparePage.types';
import {
  AddRow,
  BasisBadge,
  CoverBadge,
  CoverageNote,
  Deck,
  DeckCount,
  DeckHead,
  DeckTitle,
  EmptyBlock,
  EmptyBody,
  EmptyGlyph,
  EmptyLede,
  EmptyTitle,
  ExtremeMark,
  GroupDesc,
  GroupHead,
  GroupTitle,
  HeadCell,
  HeadCorner,
  HeadName,
  HeadTicker,
  MetricCell,
  MetricLabel,
  MetricLabelRow,
  MetricNote,
  MiniCaption,
  MiniCell,
  MiniPreview,
  MiniTrack,
  MonthCol,
  MonthGapMark,
  MonthMark,
  MonthMarks,
  MonthNum,
  MonthTickers,
  MonthTrack,
  PartialNotice,
  PickerHint,
  ScrollHint,
  SectionHead,
  SectionHint,
  SectionTitle,
  SimulateHead,
  SimulateItem,
  SimulateLede,
  SimulateList,
  SimulateMeta,
  SimulateName,
  SimulateSection,
  SimulateTicker,
  SimulateTitle,
  Slot,
  SlotBody,
  SlotGhost,
  SlotGrid,
  SlotName,
  SlotRemove,
  SlotTicker,
  Stack,
  SuggestSection,
  Table,
  TableScroller,
  UnknownValue,
  ValueCell,
  ValueText,
  Verdict,
  VerdictEyebrow,
  VerdictHead,
  VerdictLede,
  VerdictNotes,
  VerdictSentence,
  VerdictUnit,
  VerdictValue,
  VisuallyHidden
} from './styled';

const copy = TICKER_COMPARE_COPY;
const layout = TICKER_COMPARE_LAYOUT_COPY;

/**
 * 예시 조합 카드의 글리프.
 *
 * 🔴 **색이 단독 채널이 되지 않게** 카드마다 다른 모양을 준다(`PickCard` 가 `glyph` 를 필수로
 * 요구하는 이유가 이것이다). 조합의 성격을 그림으로도 말하도록 골랐고, 목록이 늘면 순환한다.
 */
const PRESET_GLYPHS: readonly ReactNode[] = [
  <Sprout key="sprout" size={ICON.xl} strokeWidth={ICON.stroke} />,
  <CalendarCheck key="calendar-check" size={ICON.xl} strokeWidth={ICON.stroke} />,
  <Repeat key="repeat" size={ICON.xl} strokeWidth={ICON.stroke} />,
  <Layers key="layers" size={ICON.xl} strokeWidth={ICON.stroke} />,
  <LineChart key="line-chart" size={ICON.xl} strokeWidth={ICON.stroke} />,
  <ShieldCheck key="shield" size={ICON.xl} strokeWidth={ICON.stroke} />,
  <Wallet key="wallet" size={ICON.xl} strokeWidth={ICON.stroke} />,
  <Globe2 key="globe" size={ICON.xl} strokeWidth={ICON.stroke} />,
  <Landmark key="landmark" size={ICON.xl} strokeWidth={ICON.stroke} />,
  <CalendarRange key="calendar-range" size={ICON.xl} strokeWidth={ICON.stroke} />
];

/**
 * 값 한 칸.
 *
 * 🔴 "가장 높음/낮음"은 **텍스트로** 붙는다 — 색이나 굵기만으로 말하면 회색조·스크린리더에서 사라진다.
 * 🔴 그리고 그것은 **사실 진술**이다. "가장 좋음"으로 바꾸지 마라 — 배당률이 높다고 좋은 종목이 아니다.
 *
 * 개편에서 표식이 값 **아래 줄**로 내려왔다. 값 옆에 붙어 있던 종전에는 알약이 숫자보다 넓어져
 * 열의 우측 정렬을 깨뜨렸고, 그 때문에 자릿수 비교가 눈으로 되지 않았다.
 */
function ValueContent({ row, index }: { row: CompareRow; index: number }) {
  const cell = row.cells[index];
  if (!cell) return null;
  if (cell.isUnknown) return <UnknownValue>{UNKNOWN_TEXT}</UnknownValue>;

  const isHighest = row.highestIndexes.includes(index);
  const isLowest = row.lowestIndexes.includes(index);

  return (
    <>
      <ValueText>{cell.text}</ValueText>
      {isHighest ? (
        <ExtremeMark>
          <ArrowUp size={ICON.xs} strokeWidth={ICON.stroke} aria-hidden focusable={false} />
          {copy.table.highest}
        </ExtremeMark>
      ) : null}
      {isLowest ? (
        <ExtremeMark>
          <ArrowDown size={ICON.xs} strokeWidth={ICON.stroke} aria-hidden focusable={false} />
          {copy.table.lowest}
        </ExtremeMark>
      ) : null}
    </>
  );
}

export default function TickerCompareView({
  viewModel,
  onAdd,
  onRemove,
  onApplySuggestion,
  onSimulate
}: TickerCompareViewProps) {
  const addSelectId = useId();
  const hintId = useId();
  const { model, candidates, isAtLimit, hasEnough, suggestions } = viewModel;
  const selected = model.columns.map((column) => column.ticker);
  const selectedSet = new Set(selected);
  const options = candidates.filter((candidate) => !selectedSet.has(candidate.ticker));

  /** 콤보박스에 보일 글자. 지급월을 모르는 종목은 종전처럼 꼬리표가 붙는다. */
  const pickerOptions = useMemo(
    () =>
      options.map(
        (candidate) =>
          `${candidate.ticker} · ${candidate.name}${candidate.hasPayoutMonths ? '' : copy.picker.noScheduleSuffix}`
      ),
    [options]
  );

  /** 보이는 글자 → 티커. 🔴 라벨을 다시 쪼개지 않는다(이름에 가운뎃점이 들면 깨진다). */
  const tickerByLabel = useMemo(
    () =>
      new Map(
        options.map((candidate) => [
          `${candidate.ticker} · ${candidate.name}${candidate.hasPayoutMonths ? '' : copy.picker.noScheduleSuffix}`,
          candidate.ticker
        ])
      ),
    [options]
  );

  /**
   * 🔴 **한 화면 안에서 종목 색이 겹치지 않게** 배정한다(`assignSeries` 2겹 — 안정 해시 + 충돌 회피).
   * 이 맵 하나가 덱 슬롯의 귀 · 표 열 머리의 귀 · 지급월 마크 **세 곳**을 동시에 칠한다.
   * 세 곳이 각자 색을 정하면 같은 종목이 화면 안에서 다른 색이 되어 색이 단서 구실을 못 한다.
   */
  const seriesByTicker = assignSeries(selected);
  const seriesOf = (ticker: string): string => seriesByTicker.get(ticker) ?? 'transparent';

  const rowGroups = groupRowsByBasis(model.rows);
  const emptySlotCount = Math.max(0, MAX_COMPARE_TICKERS - model.columns.length);
  const coveredCount = model.coverage.coveredMonths.length;

  return (
    <Stack>
      <PageHero
        icon={<BarChart3 size={20} strokeWidth={1.8} aria-hidden focusable={false} />}
        title={copy.hero.title}
        titleAs="h1"
        lede={copy.hero.lede}
        /* 비교는 "어디로 갈지 고르는" 화면이라 지도를 든 하마다(2026-08-05 사용자 지시).
           ⚠ 크기는 sm → md 로 되돌렸다. 이 히어로는 제목·리드뿐이라 세로가 짧고, sm 에서는
             그림이 눈에 띄지 않았다(히어로가 min-height 로 자리를 만들어 준다). */
        mascot="/images/hippo/hippo_map.png"
      />

      {/*
        선택 덱 — 종전의 "칩 줄 + 셀렉트 + 문장"을 **정원 4자리**로 바꿨다.
        고른 것과 남은 자리가 같은 격자에 서므로 상한이 문장이 아니라 도형으로 읽힌다.
      */}
      <Deck aria-labelledby={`${hintId}-deck`}>
        <DeckHead>
          <DeckTitle id={`${hintId}-deck`}>{copy.picker.title}</DeckTitle>
          <DeckCount>
            <VisuallyHidden>{layout.deck.countLabel} </VisuallyHidden>
            {layout.deck.count(model.columns.length)}
          </DeckCount>
        </DeckHead>

        <SlotGrid aria-label={layout.deck.slotsLabel}>
          {model.columns.map((column) => (
            <Slot key={column.ticker} $series={seriesOf(column.ticker)}>
              <SlotBody>
                <SlotTicker>{column.ticker}</SlotTicker>
                <SlotName title={column.name}>{column.name}</SlotName>
              </SlotBody>
              <SlotRemove
                type="button"
                aria-label={copy.picker.removeAria(column.ticker)}
                onClick={() => onRemove(column.ticker)}
              >
                <X size={ICON.sm} strokeWidth={ICON.stroke} aria-hidden focusable={false} />
              </SlotRemove>
            </Slot>
          ))}
          {/* 빈 자리는 개수를 도형으로 말한다. 같은 사실을 위 숫자가 이미 말하므로 낭독에서는 뺀다. */}
          {Array.from({ length: emptySlotCount }, (_, index) => (
            <SlotGhost key={`ghost-${index}`} aria-hidden>
              {layout.deck.emptySlot}
            </SlotGhost>
          ))}
        </SlotGrid>

        {/* 전폭이라 긴 종목명이 잘리지 않는다.
            상한에 닿으면 컨트롤을 잠그고 **사유를 아래 문장이** 말한다 — 이유 없는 회색 컨트롤 금지. */}
        {/*
          🔴 콤보박스는 **보이는 글자**를 돌려준다 — 그 글자에서 티커를 되찾을 표가 필요하다.
             `SCHD · Schwab US Dividend` 같은 라벨을 다시 쪼개 파싱하면 이름에 가운뎃점이 든 종목에서
             조용히 깨진다.
        */}
        <AddRow>
          {/*
            🔴 **검색되는 콤보박스**다(2026-08-09 사용자 요청). 종전에는 네이티브 `<select>` 라
               후보가 수백 개면 스크롤로만 찾아야 했다 — 티커를 아는 사람에게 그건 가장 느린 길이다.
            ⚠ **고르는 도구**라 값을 담아 두지 않는다(`clearOnSelect`). 고른 즉시 위 목록에 담기고
              칸은 비워져 다음 선택을 기다린다 — 고른 값이 남아 있으면 "이미 담았는데 아직 있다"로
              읽혀 한 번 더 누르게 된다.
            ⚠ 자유 입력을 받지 않는다. 여기는 우리 목록 안의 종목만 비교할 수 있는 자리라,
              목록에 없는 글자를 넘기면 아무 일도 안 일어나 사용자가 이유를 모른다.
          */}
          <ComboBox
            id={addSelectId}
            value=""
            options={pickerOptions}
            listLabel={copy.picker.addLabel}
            ariaLabel={copy.picker.addLabel}
            placeholder={copy.picker.addPlaceholder}
            disabled={isAtLimit || options.length === 0}
            ariaDescribedBy={hintId}
            clearOnSelect
            allowFreeText={false}
            visibleOptionCount={8}
            onChange={(label) => {
              const ticker = tickerByLabel.get(label);
              if (ticker) onAdd(ticker);
            }}
          />

          <PickerHint id={hintId}>{isAtLimit ? copy.picker.atLimit : copy.picker.hint}</PickerHint>
        </AddRow>
      </Deck>

      {hasEnough ? (
        <>
          {/*
            🔴 결론이 표보다 **먼저** 온다. 이 화면이 답하는 질문은 "이 조합이면 매달 들어오는가"이고,
            종전에는 그 답이 세 번째 카드 바닥의 작은 회색 문장이었다 — 정보는 있었지만 위계가 없었다.
          */}
          <Verdict aria-labelledby={`${hintId}-verdict`}>
            <VerdictHead>
              <VerdictLede>
                <VerdictEyebrow id={`${hintId}-verdict`}>{layout.verdict.eyebrow}</VerdictEyebrow>
                <VerdictValue>
                  <VisuallyHidden>{layout.verdict.valueLabel(coveredCount)}</VisuallyHidden>
                  <span aria-hidden>{layout.verdict.value(coveredCount)}</span>
                  <VerdictUnit aria-hidden>{layout.verdict.unit}</VerdictUnit>
                </VerdictValue>
              </VerdictLede>
              <VerdictSentence>
                {model.coverage.isEveryMonthCovered
                  ? copy.coverage.everyMonth
                  : copy.coverage.gaps(formatMonthList(model.coverage.gapMonths))}
              </VerdictSentence>
            </VerdictHead>

            {/*
              🔴 지급월 트랙은 **읽는 면**이라 면을 칠하지 않는다(종전 accentAltSubtle 면을 걷어냈다).
              지급 여부는 실선/점선 테두리 + 마크 유무 + 글자 굵기가 함께 말하고,
              어느 종목인지는 시리즈 마크 **와** 티커 글자가 둘 다 말한다.
            */}
            <MonthTrack aria-label={layout.verdict.trackLabel}>
              {model.coverage.tickersByMonth.map((tickers, index) => {
                const month = index + 1;
                const isPaid = tickers.length > 0;
                return (
                  <MonthCol
                    key={month}
                    $paid={isPaid}
                    aria-label={copy.coverage.monthAria(
                      monthLabel(month),
                      isPaid ? tickers.join(', ') : copy.coverage.noneLabel
                    )}
                  >
                    <MonthNum $paid={isPaid} aria-hidden>
                      {month}
                    </MonthNum>
                    {isPaid ? (
                      <>
                        <MonthMarks aria-hidden>
                          {tickers.map((ticker) => (
                            <MonthMark key={ticker} $series={seriesOf(ticker)} />
                          ))}
                        </MonthMarks>
                        <MonthTickers aria-hidden>{tickers.join(' ')}</MonthTickers>
                      </>
                    ) : (
                      <MonthGapMark aria-hidden>{layout.verdict.gapMark}</MonthGapMark>
                    )}
                  </MonthCol>
                );
              })}
            </MonthTrack>

            <VerdictNotes>
              <CoverageNote>{copy.coverage.subtitle}</CoverageNote>
              {/* 🔴 지급월을 모르는 종목은 "지급 없음"으로 접지 않는다 — 따로 말한다. */}
              {model.coverage.unknownTickers.length > 0 ? (
                <CoverageNote>{copy.coverage.unknown(model.coverage.unknownTickers.join(', '))}</CoverageNote>
              ) : null}
            </VerdictNotes>
          </Verdict>

          <Card tone="default" title={copy.table.caption}>
            <ScrollHint>{layout.table.scrollHint}</ScrollHint>
            <TableScroller>
              <Table>
                <caption>
                  <VisuallyHidden>{copy.table.caption}</VisuallyHidden>
                </caption>
                <thead>
                  <tr>
                    <HeadCorner scope="col">{copy.table.metricHeader}</HeadCorner>
                    {/* 열 머리가 곧 그 종목의 얼굴 — 상단 4px 귀가 덱 슬롯의 귀와 같은 색이다. */}
                    {model.columns.map((column) => (
                      <HeadCell key={column.ticker} scope="col" $series={seriesOf(column.ticker)}>
                        <HeadTicker>{column.ticker}</HeadTicker>
                        <HeadName>{column.name}</HeadName>
                      </HeadCell>
                    ))}
                  </tr>
                </thead>
                {/*
                  🔴 행을 **출처로 묶는다**(실측 → 참고 → 계산 가정). 배지는 행마다 그대로 남는다 —
                  묶음 머리는 블록 선언, 배지는 행 단위 사실이라 둘 다 있어야 한 쪽이 잘려도 남는다.
                */}
                {rowGroups.map((group) => (
                  <tbody key={group.basis}>
                    <tr>
                      {/* 이 머리는 아래 열이 아니라 **이 tbody 안의 행들**을 이름 짓는다 → rowgroup. */}
                      <GroupHead scope="rowgroup" colSpan={model.columns.length + 1}>
                        <GroupTitle>{layout.table.groupTitle(copy.basis[group.basis].label)}</GroupTitle>
                        <GroupDesc>{copy.basis[group.basis].description}</GroupDesc>
                      </GroupHead>
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={row.key}>
                        <MetricCell scope="row">
                          <MetricLabelRow>
                            <MetricLabel>{row.label}</MetricLabel>
                            {/* 🔴 숫자의 출처를 표에서 감추지 않는다 — 가정을 사실처럼 보이게 하지 않는다.
                                색은 거들 뿐이고 정보는 글자가 진다(회색조에서도 "계산 가정"이 읽힌다). */}
                            <BasisBadge $basis={row.basis} title={copy.basis[row.basis].description}>
                              {copy.basis[row.basis].label}
                            </BasisBadge>
                          </MetricLabelRow>
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
                ))}
              </Table>
            </TableScroller>
          </Card>

          {/*
            🔴 비교가 끝난 **직후**가 실행 의도의 정점이다(기획서 §3-2 연결②) — "그래서 이걸 계산해 보자".
            표 아래에 두는 이유가 이것이다. 한 종목을 고르면 그 종목만의 시나리오가 시뮬레이터 새 탭으로 열린다.
            🔴 "추천"이 아니다 — 어느 종목이 나은지는 이 화면이 말하지 않는다(`betterDirection` 을 두지 않은 것과 같은 결정).
          */}
          <SimulateSection aria-labelledby={`${hintId}-simulate`}>
            <SimulateHead>
              <SimulateTitle id={`${hintId}-simulate`}>{copy.actions.title}</SimulateTitle>
              <SimulateLede>{copy.actions.lede}</SimulateLede>
            </SimulateHead>
            <SimulateList>
              {model.columns.map((column) => (
                <SimulateItem key={column.ticker} $series={seriesOf(column.ticker)}>
                  <SimulateMeta>
                    <SimulateTicker>{column.ticker}</SimulateTicker>
                    <SimulateName title={column.name}>{column.name}</SimulateName>
                  </SimulateMeta>
                  <Button
                    variant="secondary"
                    size="sm"
                    startIcon={<Calculator size={ICON.sm} strokeWidth={ICON.stroke} aria-hidden focusable={false} />}
                    aria-label={copy.actions.simulateAria(column.ticker)}
                    onClick={() => onSimulate(column.ticker)}
                  >
                    {copy.actions.simulate}
                  </Button>
                </SimulateItem>
              ))}
            </SimulateList>
          </SimulateSection>
        </>
      ) : (
        <>
          <EmptyBlock>
            {/* 브랜드 표면이라 마스코트가 사는 자리다(데이터 표면에는 쓰지 않는다). */}
            {/* 브랜드 마크는 **자기 계단**(16·20·24·28·32·96)을 쓴다 — 아이콘 계단과 섞지 않는다.
                96 은 "빈 상태 마스코트"의 값이고, 커뮤니티 피드·내가 쓴 글의 빈 상태와 같은 크기다. */}
            <EmptyGlyph aria-hidden>
              <BrandGlyph size={96} />
            </EmptyGlyph>
            <EmptyBody>
              <EmptyTitle>
                {model.columns.length === 1
                  ? layout.partial.title(model.columns[0]!.ticker)
                  : copy.empty.title}
              </EmptyTitle>
              <EmptyLede>{model.columns.length === 1 ? layout.partial.body : copy.empty.body}</EmptyLede>
            </EmptyBody>
            {/* 예시는 선택을 덮어쓴다 — 이미 고른 것이 있을 때만 미리 알린다. */}
            {model.columns.length > 0 ? <PartialNotice>{layout.partial.replaceHint}</PartialNotice> : null}
          </EmptyBlock>

          {/*
            🔴 예시 조합을 **고르는 카드 격자**로 승격했다(2026-08-03).
            종전에는 라벨 + 티커만 담은 사각형 열 개라 무엇을 누를지 정할 근거가 없었다.
            지금은 각 카드가 그 조합의 **1년 커버리지**를 함께 보여 준다 — 이 화면이 답하는 질문 그대로다.
          */}
          <SuggestSection>
            <SectionHead>
              <SectionTitle>{copy.empty.suggestionTitle}</SectionTitle>
              <SectionHint>{layout.empty.suggestionHint}</SectionHint>
            </SectionHead>
            <PickCardGrid as="ul" minColumnWidth="280px">
              {suggestions.map((preset, index) => (
                <PickCard
                  key={preset.id}
                  as="li"
                  title={preset.label}
                  titleAs="h3"
                  subtitle={preset.tickers.join(' · ')}
                  titleRight={<CoverBadge>{layout.empty.coverBadge(preset.coveredCount)}</CoverBadge>}
                  onClick={() => onApplySuggestion(preset.tickers)}
                  cap={{
                    kind: 'rail',
                    axis: 'scoped',
                    scopedVar: preset.railVar,
                    glyph: PRESET_GLYPHS[index % PRESET_GLYPHS.length]
                  }}
                >
                  <MiniPreview>
                    <MiniTrack aria-hidden>
                      {preset.monthFlags.map((paid, monthIndex) => (
                        <MiniCell
                          key={monthIndex}
                          $paid={paid}
                          $series={`var(${preset.railVar})`}
                        />
                      ))}
                    </MiniTrack>
                    {/* 막대가 못 하는 말을 글자가 한다 — 색을 못 봐도 몇 달인지 읽힌다. */}
                    <MiniCaption>{layout.empty.coverCaption(preset.coveredCount)}</MiniCaption>
                  </MiniPreview>
                </PickCard>
              ))}
            </PickCardGrid>
          </SuggestSection>
        </>
      )}

      {/*
        🔴 각주는 이 화면이 손으로 만든 `<footer>` 가 아니라 **공용 `PageFooter` 의 각주 슬롯**으로 간다.
        허브(`/ticker/all`)·상세(`/ticker/schd`)가 이미 이 푸터로 끝나는데 비교 화면만 회색 두 줄로
        끊기면 같은 갈래의 세 지면이 서로 다른 제품처럼 읽힌다. 법무 2링크도 이 지면의 상시 진입점이 된다.
        (문서에 footer 랜드마크가 둘이면 어느 쪽이 사이트 푸터인지 알 수 없어 로컬 `<footer>` 는 버렸다.)
      */}
      <PageFooter
        notesTitle={copy.footnote.title}
        notes={[
          ...(model.asOf ? [copy.footnote.asOf(model.asOf)] : []),
          copy.footnote.disclaimer
        ]}
      />
    </Stack>
  );
}
