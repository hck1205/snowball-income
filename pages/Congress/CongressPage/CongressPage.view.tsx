import { useMemo, useState } from 'react';
import { Landmark } from 'lucide-react';
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
import { TICKER_ROWS, formatDistrict, formatTradeDate, formatUsdRange, sortTickersBy } from '../utils';
import type { CongressTickerAxis } from '../utils';
import type { CongressViewProps } from './CongressPage.types';
import { AxisButton, AxisLabel, AxisRow, KoreaBody, KoreaLink } from './styled';
import {
  ActionBadge,
  District,
  NameCell,
  NameStack,
  PersonName,
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
  {
    key: 'name',
    header: copy.tickers.columnName,
    /* 발행사 이름은 길다("Meta Platforms, Inc. - Class A Common Stock") — 잘렸을 때만 전체를 띄운다. */
    render: (row: CongressTickerRow) => (
      <OverflowTooltip text={row.name}>
        <Wrapped />
      </OverflowTooltip>
    )
  },
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
    /* 🔴 이름은 한 줄로 두고 넘치면 말줄임 + 툴팁 — 카드 모드에서 라벨과 겹치던 자리다. */
    render: (row: CongressMemberRow) => (
      /* 이름 + 지역구는 세로로 쌓되 **한 상자**다 — 형제로 두면 카드 모드에서 그리드 아이템이 셋이 된다. */
      <NameStack>
        <OverflowTooltip text={row.name}>
          <PersonName />
        </OverflowTooltip>
        <District>{formatDistrict(row.stateDistrict)}</District>
      </NameStack>
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
  {
    key: 'date',
    header: copy.recent.columnDate,
    render: (row: CongressRecentTrade) => formatTradeDate(row.date),
    /*
     * 🔴 **같은 날짜는 한 칸으로 합친다**(2026-08-06 사용자 지시 — 증시 캘린더와 같은 처방).
     * 한 의원이 하루에 여러 종목을 신고하는 일이 흔해서(실측: 최근 120건 중 7/31 다섯 줄·7/30 여섯 줄)
     * 합치기 전에는 같은 날짜가 대여섯 줄씩 반복돼 "며칠에 무슨 일이 있었나"를 눈으로 셀 수 없었다.
     * ⚠ 이 병합은 **행이 날짜순일 때만** 옳다. 스냅샷의 recent 는 거래일 내림차순으로 생성된다
     *   (실측 확인) — 정렬을 흐트러뜨리면 같은 날짜가 표에 여러 덩어리로 나뉜다.
     */
    mergeKey: (row: CongressRecentTrade) => row.date
  },
  {
    key: 'member',
    header: copy.recent.columnMember,
    /* 최근 거래도 같은 규율 — 이름은 한 줄, 넘치면 말줄임 + 툴팁. */
    render: (row: CongressRecentTrade) => (
      /* 🔴 한 상자로 묶는다 — 형제로 두면 카드 모드(2열 그리드)에서 명의 태그가 다음 줄로 밀린다. */
      <NameCell>
        <OverflowTooltip text={row.member}>
          <PersonName />
        </OverflowTooltip>
        {row.owner ? <OwnerTag>{copy.owner[row.owner]}</OwnerTag> : null}
      </NameCell>
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
  const { snapshot, members, recent } = viewModel;
  const { coverage, window } = snapshot;
  const windowLabel = `${window.start} ~ ${window.end}`;

  /*
   * 🔴 종목 표의 축(거래 건수 ↔ 신고 금액). 기본은 건수다 — 이 화면은 "무엇이 자주 오르내렸나"를
   * 먼저 말하는 화면이고, 금액은 구간이라 정확도가 한 단계 낮다.
   * ⚠ 정렬은 **스냅샷 전체**에서 한 뒤 잘라 낸다. 잘라 놓고 정렬하면 "금액 상위"가 사실은
   *   "건수 상위 20 안에서의 금액 상위"가 된다.
   */
  const [axis, setAxis] = useState<CongressTickerAxis>('count');
  const tickers = useMemo(() => sortTickersBy(snapshot.topTickers, axis, TICKER_ROWS), [snapshot, axis]);

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
          subtitle={axis === 'amount' ? copy.tickers.subtitleByAmount : copy.tickers.subtitle}
          meta={`${tickers.length}종 · ${windowLabel}`}
        >
          <AxisRow>
            <AxisLabel>{copy.tickers.axisLabel}</AxisLabel>
            <AxisButton
              type="button"
              $active={axis === 'count'}
              aria-pressed={axis === 'count'}
              onClick={() => setAxis('count')}
            >
              {copy.tickers.axisCount}
            </AxisButton>
            <AxisButton
              type="button"
              $active={axis === 'amount'}
              aria-pressed={axis === 'amount'}
              onClick={() => setAxis('amount')}
            >
              {copy.tickers.axisAmount}
            </AxisButton>
          </AxisRow>
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
          footer={<KoreaLink to={copy.korea.linkTo}>{copy.korea.linkLabel}</KoreaLink>}
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
