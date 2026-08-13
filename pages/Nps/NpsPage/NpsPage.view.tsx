import { MinusCircle, PiggyBank, PlusCircle } from 'lucide-react';
import {
  DataSection,
  DataTable,
  NoteList,
  OverflowTooltip,
  PageHero,
  SectionLink,
  SectionMeta,
  SectionStack,
  StatTile,
  SummaryGrid,
  TickerSelectorBar,
  TickerSelectorCheckbox,
  TickerSelectorUnknown
} from '@/components/common';
import { useCompareSelection } from '@/pages/Ticker/hooks';
import type { CompareSelection } from '@/pages/Ticker/hooks';
import { ICON } from '@/shared/styles';
import { tickerForCusip } from '@/shared/constants/investors/cusipToTicker';
import type { NpsHolding, NpsMove } from '@/shared/constants/npsPortfolio';
import { NPS_COPY } from '../copy';
import {
  changeDirection,
  formatChangePercent,
  formatIssuer,
  formatUsdShort,
  formatWeight
} from '../utils';
import type { NpsViewProps } from './NpsPage.types';
import {
  ChangeValue,
  EmptyNote,
  Issuer,
  MoveColumn,
  MoveCount,
  MoveGrid,
  MoveHead,
  MoveHeading,
  MoveIssuerCell,
  NewBadge,
  Num,
  ReclassMark
} from './styled';

const copy = NPS_COPY;

/**
 * 보유 종목 표의 열. **선택 상태를 받아야 하므로 상수가 아니라 함수다.**
 *
 * 🔴 이 화면의 종목은 티커가 아니라 **CUSIP** 으로 온다(13F 공시의 성질이다). 그래서 비교로
 * 보내려면 `tickerForCusip` 을 한 번 거쳐야 하고, 그 변환표에 없는 줄은 **티커 자체를 모른다** —
 * "비교 불가"가 아니라 "모른다"이므로 꺼진 체크박스가 아니라 `TickerSelectorUnknown`(`—`)을 세운다.
 * 꺼진 체크박스는 "이 종목은 비교 대상이 아니다"로 읽히는데, 그건 아는 것보다 많이 말하는 것이다.
 * (의원거래 표는 티커를 알고 있어서 그쪽은 꺼진 체크박스가 맞다.)
 *
 * 실측(2026-08-13, 변환표 확장 후): 보유 30줄 중 티커를 아는 줄이 74%.
 */
const buildHoldingColumns = (selection: CompareSelection) => [
  {
    key: 'compare',
    header: copy.holdings.columnCompare,
    render: (row: NpsHolding) => {
      const ticker = tickerForCusip(row.cusip);
      if (!ticker) return <TickerSelectorUnknown reason={copy.holdings.compareUnknown} />;
      return (
        <TickerSelectorCheckbox
          ticker={ticker}
          checked={selection.isSelected(ticker)}
          disabled={selection.isDisabled(ticker)}
          disabledReason={copy.holdings.compareUnavailable}
          onToggle={selection.toggle}
        />
      );
    }
  },
  {
    key: 'issuer',
    header: copy.holdings.columnIssuer,
    /* 이름이 두 줄을 넘겨 잘리면 그때만 전체 이름을 툴팁으로 연다(2026-08-05 사용자 지시).
       ⚠ 잘리지 않은 이름에는 툴팁이 붙지 않는다 — 안 그러면 표 전체가 마우스만 올려도 반응한다. */
    render: (row: NpsHolding) => (
      <OverflowTooltip text={formatIssuer(row.issuer)}>
        <Issuer />
      </OverflowTooltip>
    )
  },
  { key: 'value', header: copy.holdings.columnValue, render: (row: NpsHolding) => <Num>{formatUsdShort(row.valueUsd)}</Num> },
  { key: 'weight', header: copy.holdings.columnWeight, render: (row: NpsHolding) => <Num>{formatWeight(row.weightPercent)}</Num> },
  {
    key: 'change',
    header: copy.holdings.columnChange,
    /* 신규 편입은 변화율이 없다 — "0%"로 위장하지 않고 배지로 이유를 말한다. */
    render: (row: NpsHolding) =>
      row.isNew ? (
        <Num>
          <NewBadge>{copy.holdings.newBadge}</NewBadge>
        </Num>
      ) : (
        <ChangeValue $direction={changeDirection(row.changePercent)}>
          {formatChangePercent(row.changePercent)}
        </ChangeValue>
      )
  }
];

/**
 * `/portfolio/nps` 의 뷰. 상태가 없다 — 커밋된 13F 스냅샷을 그대로 그린다.
 *
 * 🔴 섹션 순서: **요약 → 한계 → 보유 → 변동 → 출처.** 한계를 표 뒤로 미루면 아무도 안 읽는다.
 * 이 화면에서 가장 위험한 오해("국민연금 자산의 6.8%가 엔비디아")를 표보다 먼저 끊어 둔다.
 */
export default function NpsView({ viewModel }: NpsViewProps) {
  const { snapshot, holdings, opened, closed, totalChangePercent, reclassified } = viewModel;

  /*
   * 종목 비교로 보내는 연결(기획서 연결①). `from='nps'` 는 측정용이다 — 유입 화면 중 어디가
   * 비교로 가장 많이 보내는지 모르면 다음에 어디를 손볼지 정할 수 없다.
   * ⚠ 보유 표에만 붙인다. 신규·청산 표는 "이번 분기에 무슨 일이 있었나"를 읽는 자리라
   *   그 줄에서 종목을 담는 동작은 문맥에 맞지 않는다.
   */
  const compare = useCompareSelection('nps');
  const holdingColumns = buildHoldingColumns(compare);

  /* 신규·청산 두 표가 같은 열을 쓴다. `reclassified` 를 닫아 잡으므로 컴포넌트 안에서 만든다. */
  const moveColumns = [
    {
      key: 'issuer',
      header: copy.moves.columnIssuer,
      render: (row: NpsMove) => (
        <MoveIssuerCell>
          <OverflowTooltip text={formatIssuer(row.issuer)}>
            <Issuer />
          </OverflowTooltip>
          {/* 재편입 표시는 툴팁 **밖**이다 — 툴팁 자식은 텍스트 하나여야 잘림 측정이 정확하다. */}
          {reclassified.has(row.issuer) ? (
            <ReclassMark title={copy.moves.reclassifiedNote}>재편입</ReclassMark>
          ) : null}
        </MoveIssuerCell>
      )
    },
    { key: 'value', header: copy.moves.columnValue, render: (row: NpsMove) => <Num>{formatUsdShort(row.valueUsd)}</Num> }
  ];

  return (
    <>
      <PageHero
        icon={<PiggyBank size={ICON.lg} strokeWidth={1.8} aria-hidden focusable={false} />}
        title={copy.hero.title}
        titleAs="h1"
        lede={copy.hero.lede}
        notice={copy.hero.notice}
        meta={`${copy.summary.reportDate} ${snapshot.reportDate}`}
      />

      <SectionStack>
        <DataSection title={copy.summary.heading}>
          <SummaryGrid>
            <StatTile
              label={copy.summary.totalValue}
              value={formatUsdShort(snapshot.totalValueUsd)}
              emphasis="hero"
              hint={
                snapshot.previousReportDate
                  ? copy.summary.previousLabel(snapshot.previousReportDate)
                  : undefined
              }
            />
            {/*
              🔴 나머지 셋은 `lead` 다(2026-08-06 사용자 지시: 신고 총액처럼 값이 크게 보이고 설명이
              그 아래 붙는 형태로 통일). 종전에는 `default` 라 값이 18px 우측정렬이어서, 같은 줄의
              신고 총액과 **다른 종류의 칸**처럼 읽혔다.
              ⚠ 넷을 전부 `hero` 로 올리지 않는다 — 좌측 오로라 리본은 화면당 한 군데여야 뜻이 있고,
                넷이 같은 크기가 되면 "이 화면의 주역"이 사라진다. `lead` 는 크기만 따라간다.
            */}
            <StatTile
              label={copy.summary.holdings}
              value={`${snapshot.totalHoldingCount.toLocaleString('ko-KR')}${copy.summary.holdingsUnit}`}
              emphasis="lead"
              hint={copy.summary.holdingsHint}
            />
            <StatTile
              label={copy.summary.change}
              value={formatChangePercent(totalChangePercent)}
              emphasis="lead"
              tone={
                changeDirection(totalChangePercent) === 'up'
                  ? 'positive'
                  : changeDirection(totalChangePercent) === 'down'
                    ? 'negative'
                    : 'neutral'
              }
              hint={copy.summary.changeHint}
            />
            {/* 🔴 종전의 "기준일" 칸을 대신한다 — 그 값은 히어로가 이미 두 번 말한다(copy 주석 참고). */}
            <StatTile
              label={copy.summary.moves}
              value={copy.summary.movesValue(opened.length, closed.length)}
              emphasis="lead"
              hint={copy.summary.movesHint}
            />
          </SummaryGrid>
        </DataSection>

        {/* 🔴 표보다 **먼저** 온다. */}
        <NoteList title={copy.limits.heading} items={copy.limits.items} />

        <DataSection
          title={copy.holdings.heading}
          subtitle={copy.holdings.subtitle(snapshot.totalHoldingCount, holdings.length)}
          meta={copy.holdings.weightNote}
        >
          <DataTable columns={holdingColumns} rows={[...holdings]} />
        </DataSection>

        <DataSection
          title={copy.moves.heading}
          subtitle={copy.moves.subtitle}
          meta={snapshot.previousReportDate ? undefined : copy.moves.noComparison}
        >
          <MoveGrid>
            {/* 🔴 방향은 **아이콘 + 글자**가 진다(면색이 아니라) — 이 화면에서 색은 손익을 뜻한다. */}
            <MoveColumn aria-labelledby="nps-moves-opened">
              <MoveHead>
                <MoveHeading id="nps-moves-opened">
                  <PlusCircle size={ICON.sm} strokeWidth={1.8} aria-hidden focusable={false} />
                  {copy.moves.openedHeading}
                </MoveHeading>
                <MoveCount>{`${opened.length}${copy.summary.holdingsUnit}`}</MoveCount>
              </MoveHead>
              {opened.length > 0 ? (
                <DataTable columns={moveColumns} rows={[...opened]} />
              ) : (
                <EmptyNote>{copy.moves.emptyOpened}</EmptyNote>
              )}
            </MoveColumn>
            <MoveColumn aria-labelledby="nps-moves-closed">
              <MoveHead>
                <MoveHeading id="nps-moves-closed">
                  <MinusCircle size={ICON.sm} strokeWidth={1.8} aria-hidden focusable={false} />
                  {copy.moves.closedHeading}
                </MoveHeading>
                <MoveCount>{`${closed.length}${copy.summary.holdingsUnit}`}</MoveCount>
              </MoveHead>
              {closed.length > 0 ? (
                <DataTable columns={moveColumns} rows={[...closed]} />
              ) : (
                <EmptyNote>{copy.moves.emptyClosed}</EmptyNote>
              )}
            </MoveColumn>
          </MoveGrid>
          {reclassified.size > 0 ? <SectionMeta>{copy.moves.reclassifiedNote}</SectionMeta> : null}
        </DataSection>

        <DataSection title={copy.source.heading}>
          <SectionMeta>
            <span>{`${copy.source.registrantLabel} ${snapshot.registrantName}`}</span>
            <span>{`${copy.source.reportLabel} ${snapshot.reportDate}`}</span>
            <span>{`${copy.source.filedLabel} ${snapshot.filingDate}`}</span>
            <span>{`${copy.source.asOf} ${snapshot.generatedAt}`}</span>
            <SectionLink href={snapshot.sourceUrl} target="_blank" rel="noreferrer noopener">
              {copy.source.linkLabel}
            </SectionLink>
          </SectionMeta>
        </DataSection>
      </SectionStack>

      {/* 🔴 `SectionStack` 밖이다 — `position: fixed` 라 조상이 스태킹 컨텍스트를 만들면 갇힌다. */}
      <TickerSelectorBar
        selected={compare.selected}
        max={compare.max}
        min={compare.min}
        href={compare.href}
        onRemove={compare.remove}
        onClear={compare.clear}
      />
    </>
  );
}
