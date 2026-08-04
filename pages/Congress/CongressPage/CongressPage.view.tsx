import { Landmark } from 'lucide-react';
import {
  DataSection,
  DataTable,
  NoteList,
  PageHero,
  SectionLink,
  SectionMeta,
  SectionStack,
  SectionSubtitle,
  StatTile,
  SummaryGrid
} from '@/components/common';
import { ICON } from '@/shared/styles';
import { TICKER_PAGE_INDEX } from '@/shared/constants/tickerPages';
import type {
  CongressMemberRow,
  CongressRecentTrade,
  CongressTickerRow
} from '@/shared/constants/congressTrades';
import { CONGRESS_COPY } from '../copy';
import { formatDistrict, formatTradeDate, formatUsdRange } from '../utils';
import type { CongressViewProps } from './CongressPage.types';
import { CheckedList, KoreaBody } from './styled';
import {
  ActionBadge,
  District,
  Num,
  OwnerTag,
  Ticker,
  TickerChip,
  TickerChips,
  TickerLink,
  Wrapped
} from './styled';

const copy = CONGRESS_COPY;

/**
 * 우리 앱에 소개 페이지가 **있는** 종목만 링크한다.
 *
 * 🔴 1,184종이 나오는 자료에 `/ticker/{소문자}` 를 무조건 붙이면 대부분이 죽은 링크가 된다
 * (그 라우트는 콘텐츠가 없으면 허브로 되돌린다 — 사용자에게는 "눌렀더니 딴 데로 갔다"이다).
 * ⚠ 키를 넓은 `string` 으로 못 박는다 — 인덱스가 `as const` 라 `symbol` 이 리터럴 유니온이고,
 *   그대로 두면 공시에서 온 임의의 티커로는 **조회조차** 못 한다.
 */
const SLUG_BY_SYMBOL = new Map<string, string>(
  TICKER_PAGE_INDEX.map((entry) => [entry.symbol, entry.slug])
);

const TickerCell = ({ ticker }: { ticker: string }) => {
  const slug = SLUG_BY_SYMBOL.get(ticker);
  return slug ? <TickerLink to={`/ticker/${slug}`}>{ticker}</TickerLink> : <Ticker>{ticker}</Ticker>;
};

const countLabel = (value: number) => `${value}${copy.tickers.unitCount}`;

const TICKER_COLUMNS = [
  {
    key: 'ticker',
    header: copy.tickers.columnTicker,
    render: (row: CongressTickerRow) => <TickerCell ticker={row.ticker} />
  },
  { key: 'name', header: copy.tickers.columnName, render: (row: CongressTickerRow) => <Wrapped>{row.name}</Wrapped> },
  { key: 'buys', header: copy.tickers.columnBuys, render: (row: CongressTickerRow) => <Num>{countLabel(row.buys)}</Num> },
  { key: 'sells', header: copy.tickers.columnSells, render: (row: CongressTickerRow) => <Num>{countLabel(row.sells)}</Num> },
  {
    key: 'members',
    header: copy.tickers.columnMembers,
    render: (row: CongressTickerRow) => <Num>{`${row.memberCount}${copy.tickers.unitMember}`}</Num>
  },
  {
    key: 'amount',
    header: copy.tickers.columnAmount,
    render: (row: CongressTickerRow) => <Num>{formatUsdRange(row.minUsd, row.maxUsd)}</Num>
  }
];

const MEMBER_COLUMNS = [
  {
    key: 'name',
    header: copy.members.columnName,
    render: (row: CongressMemberRow) => (
      <>
        {row.name}
        <District>{formatDistrict(row.stateDistrict)}</District>
      </>
    )
  },
  { key: 'buys', header: copy.members.columnBuys, render: (row: CongressMemberRow) => <Num>{countLabel(row.buys)}</Num> },
  { key: 'sells', header: copy.members.columnSells, render: (row: CongressMemberRow) => <Num>{countLabel(row.sells)}</Num> },
  {
    key: 'amount',
    header: copy.tickers.columnAmount,
    render: (row: CongressMemberRow) => <Num>{formatUsdRange(row.minUsd, row.maxUsd)}</Num>
  },
  {
    key: 'topTickers',
    header: copy.members.columnTopTickers,
    render: (row: CongressMemberRow) => (
      <TickerChips>
        {row.topTickers.map((ticker) => (
          <TickerChip key={ticker}>{ticker}</TickerChip>
        ))}
      </TickerChips>
    )
  }
];

const RECENT_COLUMNS = [
  { key: 'date', header: copy.recent.columnDate, render: (row: CongressRecentTrade) => formatTradeDate(row.date) },
  {
    key: 'member',
    header: copy.recent.columnMember,
    render: (row: CongressRecentTrade) => (
      <>
        {row.member}
        {row.owner ? <OwnerTag>{copy.owner[row.owner]}</OwnerTag> : null}
      </>
    )
  },
  {
    key: 'ticker',
    header: copy.recent.columnTicker,
    render: (row: CongressRecentTrade) => <TickerCell ticker={row.ticker} />
  },
  {
    key: 'action',
    header: copy.recent.columnAction,
    render: (row: CongressRecentTrade) => <ActionBadge $action={row.action}>{copy.action[row.action]}</ActionBadge>
  },
  { key: 'amount', header: copy.recent.columnAmount, render: (row: CongressRecentTrade) => <Num>{row.amount}</Num> }
];

/**
 * `/portfolio/congress` 의 뷰. 상태가 없다 — 커밋된 스냅샷을 그대로 그린다.
 *
 * 🔴 섹션 순서가 이 화면의 주장이다: **범위 → 한계 → 종목 → 의원 → 최근 → 한국 → 출처.**
 * 한계를 표 뒤로 미루면 아무도 안 읽는다. 숫자를 보기 전에 "이 숫자가 무엇인지"를 먼저 읽게 둔다.
 */
export default function CongressView({ viewModel }: CongressViewProps) {
  const { snapshot, tickers, members, recent } = viewModel;
  const { coverage, window } = snapshot;
  const windowLabel = `${window.start} ~ ${window.end}`;

  return (
    <>
      <PageHero
        icon={<Landmark size={ICON.lg} strokeWidth={1.8} aria-hidden focusable={false} />}
        title={copy.hero.title}
        titleAs="h1"
        lede={copy.hero.lede}
        notice={copy.hero.notice}
        meta={`${copy.summary.windowLabel} ${windowLabel}`}
      />

      <SectionStack>
        <DataSection title={copy.summary.heading}>
          <SummaryGrid>
            <StatTile
              label={copy.summary.filings}
              value={`${coverage.filingsRead.toLocaleString('ko-KR')}${copy.summary.filingsUnit}`}
              hint={copy.summary.scannedNote(coverage.filingsScanned)}
            />
            <StatTile
              label={copy.summary.transactions}
              value={`${coverage.equityTransactions.toLocaleString('ko-KR')}${copy.summary.transactionsUnit}`}
            />
            <StatTile
              label={copy.summary.members}
              value={`${coverage.members.toLocaleString('ko-KR')}${copy.summary.membersUnit}`}
            />
            <StatTile
              label={copy.summary.tickers}
              value={`${coverage.tickers.toLocaleString('ko-KR')}${copy.summary.tickersUnit}`}
            />
          </SummaryGrid>
        </DataSection>

        {/* 🔴 표보다 **먼저** 온다. 숫자를 읽기 전에 그 숫자가 무엇인지 알아야 한다. */}
        <NoteList title={copy.limits.heading} items={copy.limits.items} />

        <DataSection
          title={copy.tickers.heading}
          subtitle={copy.tickers.subtitle}
          meta={`${tickers.length}종 · ${windowLabel}`}
        >
          <DataTable columns={TICKER_COLUMNS} rows={[...tickers]} />
        </DataSection>

        <DataSection title={copy.members.heading} subtitle={copy.members.subtitle}>
          <DataTable columns={MEMBER_COLUMNS} rows={[...members]} />
        </DataSection>

        <DataSection title={copy.recent.heading} subtitle={copy.recent.subtitle}>
          <DataTable columns={RECENT_COLUMNS} rows={[...recent]} />
        </DataSection>

        <NoteList
          tone="brand"
          title={copy.korea.heading}
          lead={<KoreaBody>{copy.korea.body}</KoreaBody>}
          items={[]}
          footer={
            <>
              <SectionSubtitle as="p">{copy.korea.checkedLabel}</SectionSubtitle>
              <CheckedList>
                {copy.korea.checked.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </CheckedList>
              <SectionMeta>
                <span>{copy.korea.sourceLabel}</span>
                <SectionLink href={copy.korea.sourceUrl} target="_blank" rel="noreferrer noopener">
                  {copy.korea.sourceName}
                </SectionLink>
              </SectionMeta>
            </>
          }
        />

        <DataSection title={copy.source.heading}>
          <SectionMeta>
            <span>{`${copy.source.asOf} ${snapshot.generatedAt}`}</span>
            <span>{`${copy.source.windowLabel} ${windowLabel}`}</span>
            <SectionLink href={snapshot.sourceUrl} target="_blank" rel="noreferrer noopener">
              {copy.source.linkLabel}
            </SectionLink>
          </SectionMeta>
        </DataSection>
      </SectionStack>
    </>
  );
}
