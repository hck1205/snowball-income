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
  latestMeasuredAt,
  nextDividendListSort,
  sortDividendListRows,
  sortableDividendListKeys,
  usesWikipediaSource
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
  SourceNote,
  SourceRole,
  TableMeta
} from './DividendListPage.styled';

const copy = DIVIDEND_LIST_COPY.page;

/** 정렬 축 후보. 순서는 표의 열 순서와 같다(어느 열이 실제로 정렬 가능한지는 데이터가 정한다). */
const SORT_KEYS: DividendListSortKey[] = ['ticker', 'name', 'yield', 'streak', 'growth', 'sector'];

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
  /*
   * 🔴 정렬 가능한 열은 **필터 전 전체 행**으로 정한다. 보이는 행으로 계산하면 섹터 칩을 누를 때마다
   * 열 머리의 버튼이 사라졌다 나타나 표가 덜컹거린다(섹터로 좁히면 섹터 값이 한 종류가 되므로).
   */
  const sortableKeys = useMemo(() => sortableDividendListKeys(rows, SORT_KEYS), [rows]);
  /* 배당률·성장률은 매일 움직이는 값이라 **기준일 없이 쓰지 않는다.** 실측이 없으면 줄 자체를 안 쓴다. */
  const measuredAt = useMemo(() => latestMeasuredAt(rows), [rows]);

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
            {measuredAt ? ` · ${copy.measuredAtLabel} ${measuredAt}` : ''}
          </TableMeta>
          <DividendListTable
            rows={visibleRows}
            caption={`${listCopy.title} ${copy.tableCaptionSuffix} (${copy.asOfLabel} ${list.asOf})`}
            sort={sort}
            onSortChange={onSortChange}
            sortableKeys={sortableKeys}
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
          {/* 🔴 위키피디아 본문은 CC BY-SA 4.0 이라 **출처 표기가 라이선스상의 의무**다.
              링크만으로는 부족해 라이선스 이름을 화면이 직접 말하고, 라이선스 전문으로도 링크한다. */}
          {usesWikipediaSource(list) ? (
            <SourceNote>
              {copy.wikipediaLicenseNote}{' '}
              <SourceLink
                href={copy.wikipediaLicenseUrl}
                target="_blank"
                rel="nofollow noopener noreferrer"
              >
                {copy.wikipediaLicenseLinkLabel}
              </SourceLink>
            </SourceNote>
          ) : null}
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
