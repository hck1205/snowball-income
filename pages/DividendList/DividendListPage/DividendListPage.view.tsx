import { useMemo, useState } from 'react';
import { Crown, Gem, Medal } from 'lucide-react';
import { Chip, PageFooter, PageHero } from '@/components/common';
import { DIVIDEND_LIST_HUB_PATH } from '@/shared/constants/dividendLists';
import type { DividendListId, DividendListSectorId } from '@/shared/constants/dividendLists';
import { ICON } from '@/shared/styles';
import { DividendListTable } from '../components';
import { DIVIDEND_LIST_COPY } from '../copy';
import {
  DEFAULT_DIVIDEND_LIST_SORT,
  buildSectorFacets,
  filterBySector,
  nextDividendListSort,
  sortDividendListRows
} from '../utils';
import type { DividendListSort, DividendListSortKey } from '../utils';
import type { DividendListViewProps } from './DividendListPage.types';
import {
  Body,
  CautionPanel,
  CriterionBadge,
  FilterLabel,
  FilterRow,
  HubLink,
  RelatedCard,
  RelatedGrid,
  RelatedMeta,
  RelatedTitle,
  Section,
  SectionTitle,
  Sections,
  SourceDate,
  SourceItem,
  SourceLink,
  SourceList,
  SourceRole,
  TableMeta
} from './DividendListPage.styled';

const copy = DIVIDEND_LIST_COPY.page;

/**
 * 목록별 히어로 글리프. 🔴 nav 묶음 메뉴(`components/PrimaryNav`)와 **같은 아이콘**을 쓴다 —
 * 메뉴에서 누른 것과 도착한 화면의 표식이 다르면 사용자는 자기가 어디에 왔는지 다시 확인해야 한다.
 */
const LIST_ICON: Record<DividendListId, typeof Crown> = {
  kings: Crown,
  aristocrats: Gem,
  champions: Medal
};

/**
 * 목록 화면의 뷰. 정렬·섹터 필터라는 **화면 안 상태**만 소유하고, 데이터는 컨테이너가 준다.
 *
 * 🔴 히어로의 `titleAs` 는 `'h1'` 이다 — 이 셸의 워드마크는 `<span>` 이라(TickerPageShell) 문서에
 * `<h1>` 이 없으면 크롤러가 페이지 주제를 잃는다. 서버가 그리는 크롤러 HTML 도 같은 문장을 `<h1>`
 * 로 낸다(`server/handlers/DividendListHtml`) — 둘의 문장이 갈리면 색인과 화면이 다른 말을 한다.
 */
export default function DividendListView({ viewModel }: DividendListViewProps) {
  const { list, copy: listCopy, rows, criterion, others } = viewModel;
  const [sort, setSort] = useState<DividendListSort>(DEFAULT_DIVIDEND_LIST_SORT);
  const [sector, setSector] = useState<DividendListSectorId | null>(null);

  const facets = useMemo(() => buildSectorFacets(rows), [rows]);
  const visibleRows = useMemo(
    () => sortDividendListRows(filterBySector(rows, sector), sort),
    [rows, sector, sort]
  );

  const onSortChange = (key: DividendListSortKey) => setSort((prev) => nextDividendListSort(prev, key));
  const HeroIcon = LIST_ICON[list.id];

  return (
    <>
      <PageHero
        icon={<HeroIcon size={ICON.lg} strokeWidth={1.8} aria-hidden focusable={false} />}
        title={listCopy.title}
        titleAs="h1"
        lede={listCopy.lede}
        notice={criterion}
        /* 기준일·종목 수는 히어로의 근거 슬롯. 이 두 숫자가 없으면 목록은 "언제 것인지 모를 목록"이다. */
        meta={`${copy.asOfLabel} ${list.asOf} · ${copy.countLabel} ${list.members.length}${copy.countUnit}`}
      />

      <Sections>
        <Section>
          <SectionTitle>{copy.definitionHeading}</SectionTitle>
          <Body>{listCopy.definition}</Body>
          <CriterionBadge>{`${copy.criterionHeading} · ${listCopy.criterionLabel}`}</CriterionBadge>
          <CautionPanel>{listCopy.caution}</CautionPanel>
        </Section>

        <Section>
          <SectionTitle>{copy.streakHeading}</SectionTitle>
          <Body>{copy.streakBody}</Body>
        </Section>

        <Section>
          <SectionTitle>{copy.tableHeading}</SectionTitle>
          <FilterRow role="group" aria-label={copy.sectorFilterLabel}>
            <FilterLabel>{copy.sectorFilterLabel}</FilterLabel>
            <Chip selected={sector === null} onClick={() => setSector(null)}>
              {`${copy.sectorFilterAll} ${rows.length}`}
            </Chip>
            {facets.map((facet) => (
              <Chip
                key={facet.sector}
                selected={sector === facet.sector}
                onClick={() => setSector((prev) => (prev === facet.sector ? null : facet.sector))}
              >
                {`${facet.label} ${facet.count}`}
              </Chip>
            ))}
          </FilterRow>
          <TableMeta>
            {`${visibleRows.length}${copy.countUnit} ${copy.filteredCountSuffix} · ${copy.sortHint}`}
          </TableMeta>
          <DividendListTable
            rows={visibleRows}
            caption={`${listCopy.title} ${copy.tableCaptionSuffix} (${copy.asOfLabel} ${list.asOf})`}
            sort={sort}
            onSortChange={onSortChange}
          />
        </Section>

        <Section>
          <SectionTitle>{copy.sourceHeading}</SectionTitle>
          <SourceList>
            {list.sources.map((source) => (
              <SourceItem key={source.url}>
                <SourceRole>
                  {source.role === 'primary' ? copy.sourceRolePrimary : copy.sourceRoleCrosscheck}
                </SourceRole>
                {/* 외부 출처는 새 탭 + nofollow — 우리 색인 신호를 넘겨주지 않는다(티커 페이지와 같은 관례). */}
                <SourceLink href={source.url} target="_blank" rel="nofollow noopener noreferrer">
                  {source.label}
                </SourceLink>
                <SourceDate>{`${copy.retrievedAtLabel} ${source.retrievedAt}`}</SourceDate>
              </SourceItem>
            ))}
          </SourceList>
          <SectionTitle as="h3">{copy.coverageHeading}</SectionTitle>
          <Body>{list.coverageNote}</Body>
        </Section>

        <Section>
          <SectionTitle>{copy.relatedHeading}</SectionTitle>
          <RelatedGrid aria-label={copy.relatedHeading}>
            {others.map((other) => (
              <RelatedCard key={other.id} to={other.path}>
                <RelatedTitle>{DIVIDEND_LIST_COPY.lists[other.id].title}</RelatedTitle>
                <RelatedMeta>
                  {`${other.criterion} · ${other.count}${copy.countUnit} · ${copy.asOfLabel} ${other.asOf}`}
                </RelatedMeta>
              </RelatedCard>
            ))}
          </RelatedGrid>
          <HubLink to={DIVIDEND_LIST_HUB_PATH}>{copy.hubLink}</HubLink>
        </Section>
      </Sections>

      {/* 각주 + 사이트 공통 고지 = 공용 푸터 한 벌. `TickerPageShell` 의 슬롯으로 포털되어
          `<main>` **밖**(contentinfo 랜드마크)에 그려진다 — 이 셸을 쓰는 화면들의 공통 관례다. */}
      <PageFooter notesTitle={copy.footerNotesTitle} notes={copy.footerNotes} />
    </>
  );
}
