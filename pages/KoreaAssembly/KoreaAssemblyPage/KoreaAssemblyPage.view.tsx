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
import { formatShares } from '@/shared/constants/koreaAssemblyStocks';
import type { KoreaIssuerRow, KoreaMemberRow } from '@/shared/constants/koreaAssemblyStocks';
import { KOREA_ASSEMBLY_COPY } from '../copy';
import { formatKoreanDate, formatMemberSample } from '../utils';
import type { KoreaAssemblyViewProps } from './KoreaAssemblyPage.types';
import {
  BridgeBody,
  BridgeLink,
  Issuer,
  IssuerCellRoot,
  IssuerLink,
  MemberSample,
  Num,
  PersonName,
  Position,
  RelationTag,
  TagRow,
  TickerBadge
} from './styled';

const copy = KOREA_ASSEMBLY_COPY;

/**
 * 우리 앱에 소개 페이지가 **있는** 종목만 링크한다(미국 화면과 같은 규칙).
 *
 * 🔴 656종이 나오는 자료라 무조건 `/ticker/…` 를 붙이면 대부분이 죽은 링크가 된다.
 * ⚠ 한국 종목은 애초에 `ticker` 가 `null` 이라 여기 걸리지 않는다 — 이 앱은 미국 종목만 다룬다.
 */
const SLUG_BY_SYMBOL = new Map<string, string>(
  TICKER_PAGE_INDEX.map((entry) => [entry.symbol, entry.slug])
);

const IssuerCell = ({ row }: { row: KoreaIssuerRow }) => {
  const slug = row.ticker ? SLUG_BY_SYMBOL.get(row.ticker) : undefined;
  return (
    <IssuerCellRoot>
      {slug ? <IssuerLink to={`/ticker/${slug}`}>{row.issuer}</IssuerLink> : <Issuer>{row.issuer}</Issuer>}
      {row.ticker ? <TickerBadge>{row.ticker}</TickerBadge> : null}
    </IssuerCellRoot>
  );
};

const ISSUER_COLUMNS = [
  { key: 'issuer', header: copy.issuers.columnIssuer, render: (row: KoreaIssuerRow) => <IssuerCell row={row} /> },
  {
    key: 'members',
    header: copy.issuers.columnMembers,
    render: (row: KoreaIssuerRow) => <Num>{`${row.memberCount}${copy.issuers.unitMember}`}</Num>
  },
  {
    key: 'shares',
    header: copy.issuers.columnShares,
    render: (row: KoreaIssuerRow) => <Num>{formatShares(row.shares)}</Num>
  },
  {
    key: 'who',
    header: copy.issuers.columnWho,
    render: (row: KoreaIssuerRow) => {
      /* 이름이 여섯까지 붙어 두 줄을 넘기기 쉽다 — 잘렸을 때만 전체를 띄운다. */
      const text = formatMemberSample(row.members, row.memberCount);
      return (
        <OverflowTooltip text={text}>
          <MemberSample />
        </OverflowTooltip>
      );
    }
  }
];

const MEMBER_COLUMNS = [
  {
    key: 'name',
    header: copy.members.columnName,
    /* 🔴 이름은 한 줄 + 말줄임 + 툴팁 — 카드 모드에서 라벨과 겹치던 자리다(국회 화면과 같은 처방). */
    render: (row: KoreaMemberRow) => (
      <>
        <OverflowTooltip text={row.name}>
          <PersonName />
        </OverflowTooltip>
        {/* 의장·부의장만 직위를 덧붙인다 — 일반 의원에게 "국회의원"을 또 쓰면 잡음이다. */}
        {row.position === '국회의원' ? null : <Position>{row.position}</Position>}
      </>
    )
  },
  {
    key: 'count',
    header: copy.members.columnCount,
    render: (row: KoreaMemberRow) => <Num>{`${row.issuerCount}${copy.members.unitIssuer}`}</Num>
  },
  {
    key: 'relations',
    header: copy.members.columnRelations,
    render: (row: KoreaMemberRow) => (
      <TagRow>
        {row.relations.map((relation) => (
          <RelationTag key={relation}>{relation}</RelationTag>
        ))}
      </TagRow>
    )
  },
  {
    key: 'topIssuers',
    header: copy.members.columnTopIssuers,
    render: (row: KoreaMemberRow) => (
      <OverflowTooltip text={row.topIssuers.join(', ')}>
        <MemberSample />
      </OverflowTooltip>
    )
  }
];

/**
 * `/portfolio/korea-assembly` 의 뷰. 상태가 없다 — 커밋된 스냅샷을 그대로 그린다.
 *
 * 🔴 섹션 순서가 이 화면의 주장이다: **범위 → 한계 → 종목 → 의원 → 미국 → 출처.**
 * 미국 화면과 같은 순서다. 한계를 표 뒤로 미루면 아무도 안 읽는다.
 */
export default function KoreaAssemblyView({ viewModel }: KoreaAssemblyViewProps) {
  const { snapshot, issuers, members, excludedStaff } = viewModel;
  const { coverage } = snapshot;
  const asOfLabel = formatKoreanDate(snapshot.asOfDate);

  return (
    <>
      <PageHero
        icon={<Landmark size={ICON.lg} strokeWidth={1.8} aria-hidden focusable={false} />}
        title={copy.hero.title}
        titleAs="h1"
        lede={copy.hero.lede}
        notice={copy.hero.notice}
        meta={`${copy.summary.asOfLabel} ${asOfLabel}`}
      />

      <SectionStack>
        <DataSection title={copy.summary.heading}>
          <SummaryGrid>
            <StatTile
              label={copy.summary.members}
              value={`${coverage.membersTotal.toLocaleString('ko-KR')}${copy.summary.membersUnit}`}
              hint={copy.summary.staffNote(excludedStaff)}
            />
            <StatTile
              label={copy.summary.withStocks}
              value={`${coverage.membersWithStocks.toLocaleString('ko-KR')}${copy.summary.withStocksUnit}`}
            />
            <StatTile
              label={copy.summary.holdings}
              value={`${coverage.holdings.toLocaleString('ko-KR')}${copy.summary.holdingsUnit}`}
            />
            <StatTile
              label={copy.summary.issuers}
              value={`${coverage.issuers.toLocaleString('ko-KR')}${copy.summary.issuersUnit}`}
            />
          </SummaryGrid>
        </DataSection>

        {/* 🔴 표보다 **먼저** 온다. 숫자를 읽기 전에 그 숫자가 무엇인지 알아야 한다. */}
        <NoteList title={copy.limits.heading} items={copy.limits.items} />

        <DataSection
          title={copy.issuers.heading}
          subtitle={copy.issuers.subtitle}
          meta={`${issuers.length}종 · ${copy.summary.asOfLabel} ${asOfLabel}`}
        >
          <DataTable columns={ISSUER_COLUMNS} rows={[...issuers]} />
        </DataSection>

        <DataSection title={copy.members.heading} subtitle={copy.members.subtitle}>
          <DataTable columns={MEMBER_COLUMNS} rows={[...members]} />
        </DataSection>

        <NoteList
          tone="brand"
          title={copy.usa.heading}
          lead={<BridgeBody>{copy.usa.body}</BridgeBody>}
          items={[]}
          footer={<BridgeLink to={copy.usa.linkTo}>{copy.usa.linkLabel}</BridgeLink>}
        />

        <DataSection title={copy.source.heading}>
          <SectionMeta>
            <span>{`${copy.source.issueLabel} ${snapshot.issueTitle}`}</span>
            <span>{`${copy.summary.publishedLabel} ${formatKoreanDate(snapshot.publishedAt)}`}</span>
            <span>{`${copy.source.asOf} ${snapshot.generatedAt}`}</span>
            <span>{copy.source.legal}</span>
            <SectionLink href={snapshot.sourceUrl} target="_blank" rel="noreferrer noopener">
              {copy.source.linkLabel}
            </SectionLink>
          </SectionMeta>
        </DataSection>
      </SectionStack>
    </>
  );
}
