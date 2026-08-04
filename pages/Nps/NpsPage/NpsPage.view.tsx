import { PiggyBank } from 'lucide-react';
import {
  DataSection,
  DataTable,
  NoteList,
  PageHero,
  SectionLink,
  SectionMeta,
  SectionStack,
  StatTile,
  SummaryGrid
} from '@/components/common';
import { ICON } from '@/shared/styles';
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
  MoveGrid,
  MoveHeading,
  NewBadge,
  Num,
  ReclassMark
} from './styled';

const copy = NPS_COPY;

const HOLDING_COLUMNS = [
  {
    key: 'issuer',
    header: copy.holdings.columnIssuer,
    render: (row: NpsHolding) => <Issuer>{formatIssuer(row.issuer)}</Issuer>
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

  /* 신규·청산 두 표가 같은 열을 쓴다. `reclassified` 를 닫아 잡으므로 컴포넌트 안에서 만든다. */
  const moveColumns = [
    {
      key: 'issuer',
      header: copy.moves.columnIssuer,
      render: (row: NpsMove) => (
        <Issuer>
          {formatIssuer(row.issuer)}
          {reclassified.has(row.issuer) ? (
            <ReclassMark title={copy.moves.reclassifiedNote}>재편입</ReclassMark>
          ) : null}
        </Issuer>
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
            <StatTile
              label={copy.summary.holdings}
              value={`${snapshot.totalHoldingCount.toLocaleString('ko-KR')}${copy.summary.holdingsUnit}`}
            />
            <StatTile
              label={copy.summary.change}
              value={formatChangePercent(totalChangePercent)}
              tone={
                changeDirection(totalChangePercent) === 'up'
                  ? 'positive'
                  : changeDirection(totalChangePercent) === 'down'
                    ? 'negative'
                    : 'neutral'
              }
              hint={copy.summary.changeHint}
            />
            <StatTile label={copy.summary.reportDate} value={snapshot.reportDate} />
          </SummaryGrid>
        </DataSection>

        {/* 🔴 표보다 **먼저** 온다. */}
        <NoteList title={copy.limits.heading} items={copy.limits.items} />

        <DataSection
          title={copy.holdings.heading}
          subtitle={copy.holdings.subtitle(snapshot.totalHoldingCount, holdings.length)}
          meta={copy.holdings.weightNote}
        >
          <DataTable columns={HOLDING_COLUMNS} rows={[...holdings]} />
        </DataSection>

        <DataSection
          title={copy.moves.heading}
          subtitle={copy.moves.subtitle}
          meta={snapshot.previousReportDate ? undefined : copy.moves.noComparison}
        >
          <MoveGrid>
            <MoveColumn>
              <MoveHeading>{copy.moves.openedHeading}</MoveHeading>
              {opened.length > 0 ? (
                <DataTable columns={moveColumns} rows={[...opened]} />
              ) : (
                <EmptyNote>{copy.moves.emptyOpened}</EmptyNote>
              )}
            </MoveColumn>
            <MoveColumn>
              <MoveHeading>{copy.moves.closedHeading}</MoveHeading>
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
    </>
  );
}
