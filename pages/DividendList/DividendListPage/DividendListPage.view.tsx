import { useMemo, useState } from 'react';
import { Crown, Gem, Medal, Sparkles } from 'lucide-react';
import { PageFooter, PageHero } from '@/components/common';
import {
  DIVIDEND_LIST_HUB_PATH,
  HIDDEN_STAR_MONTHLY,
  formatHiddenStarMonth
} from '@/shared/constants/dividendLists';
import type { DividendListId } from '@/shared/constants/dividendLists';
import { ICON } from '@/shared/styles';
import { DividendListFilters, DividendListTable } from '../components';
import { DIVIDEND_LIST_COPY } from '../copy';
import {
  DIVIDEND_LIST_MASCOT,
  DEFAULT_DIVIDEND_LIST_SORT,
  NO_DIVIDEND_LIST_FILTER,
  buildSectorFacets,
  countRowsHiddenByUnknown,
  filterDividendListRows,
  latestMeasuredAt,
  nextDividendListSort,
  sortDividendListRows,
  sortableDividendListKeys,
  usesWikipediaSource
} from '../utils';
import type { DividendListFilter, DividendListSort, DividendListSortKey } from '../utils';
import type { DividendListViewProps } from './DividendListPage.types';
import {
  Body,
  CautionPanel,
  MonthlyAsOf,
  MonthlyFacts,
  MonthlyList,
  MonthlyMonth,
  MonthlyName,
  MonthlyNotice,
  MonthlyRow,
  CriterionBadge,
  HeroBlock,
  HeroMascot,
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
  champions: Medal,
  /* 왕관·보석·메달은 '수여받은 지위'를 뜻한다. 히든스타는 수여받지 못한 쪽이라 다른 결의 글리프를 쓴다. */
  hiddenStars: Sparkles
};

/**
 * 목록별 마스코트 그림.
 *
 * 🔴 **경로 문자열로 참조한다 — `import` 하지 마라.** 세 장을 import 하면 어느 목록을 열어도
 * 셋이 전부 번들(또는 프리로드 대상)에 들어간다. 화면 하나가 받아야 하는 것은 자기 것 하나다
 * (실측 파일 크기 246 · 267 · 295KB). `public/` 의 파일은 경로 그대로 서빙되므로 이게 유일한 참조 방법이다.
 *
 * ⚠ `loading` 은 **eager** 다. 이 그림은 스크롤 없이 보이는 자리에 있어(실측 2026-08-04: 그림 하단이
 *   1280 에서 y=352 · 390 에서 y=328 — iOS Safari 최소 접힘 664 안) `lazy` 를 걸면 브라우저가 레이아웃 뒤로 미뤄
 *   "히어로가 한 박자 늦게 채워지는" 결함만 얻는다. 대신 `decoding="async"` 로 디코딩은 메인
 *   스레드에서 떼어내고, width/height 속성으로 자리를 미리 잡아 글자가 밀리지 않게 한다.
 * ⚠ 크기는 원본 픽셀이다(세 장의 세로가 조금씩 다르다 — 비율 예약이 정확해야 한다).
 *
 * `side` 는 그림이 앉을 쪽이다(2026-08-04 사용자 지시: 킹 오른쪽 · 귀족 왼쪽[글은 오른쪽] · 챔피언 오른쪽).
 * 🔴 이 값 하나가 **HeroBlock 의 패딩과 HeroMascot 의 정렬을 함께** 정한다 — 둘을 따로 적으면
 *    한쪽만 고쳤을 때 그림이 글 위로 겹친다.
 */

/**
 * 목록 화면의 뷰. 정렬·필터라는 **화면 안 상태**만 소유하고, 데이터는 컨테이너가 준다.
 * (필터를 URL 에 싣지 않기로 한 근거는 `components/DividendListFilters` 머리말에 있다.)
 *
 * 🔴 히어로의 `titleAs` 는 `'h1'` 이다 — 이 셸의 워드마크는 `<span>` 이라(TickerPageShell) 문서에
 * `<h1>` 이 없으면 크롤러가 페이지 주제를 잃는다. 서버가 그리는 크롤러 HTML 도 같은 문장을 `<h1>`
 * 로 낸다(`server/handlers/DividendListHtml`) — 둘의 문장이 갈리면 색인과 화면이 다른 말을 한다.
 */
export default function DividendListView({ viewModel }: DividendListViewProps) {
  const { list, copy: listCopy, rows, criterion, others } = viewModel;
  const [sort, setSort] = useState<DividendListSort>(DEFAULT_DIVIDEND_LIST_SORT);
  const [filter, setFilter] = useState<DividendListFilter>(NO_DIVIDEND_LIST_FILTER);

  const facets = useMemo(() => buildSectorFacets(rows), [rows]);
  const visibleRows = useMemo(
    () => sortDividendListRows(filterDividendListRows(rows, filter), sort),
    [rows, filter, sort]
  );
  /*
   * 🔴 정렬 가능한 열은 **필터 전 전체 행**으로 정한다. 보이는 행으로 계산하면 칩을 누를 때마다
   * 열 머리의 버튼이 사라졌다 나타나 표가 덜컹거린다(섹터로 좁히면 섹터 값이 한 종류가 되고,
   * 배당률로 좁히면 남은 줄의 값이 우연히 같아질 수 있다).
   */
  const sortableKeys = useMemo(() => sortableDividendListKeys(rows, SORT_KEYS), [rows]);
  /* 배당률·성장률은 매일 움직이는 값이라 **기준일 없이 쓰지 않는다.** 실측이 없으면 줄 자체를 안 쓴다. */
  const measuredAt = useMemo(() => latestMeasuredAt(rows), [rows]);
  /*
   * 숫자 축 때문에 빠졌지만 값이 없어 판정 자체가 불가능했던 줄. 🔴 조용히 사라지면 사용자는
   * 목록이 틀렸다고 읽는다 — 배당킹은 46종 중 4종, 배당챔피언은 83종 중 15종이 아직 지표가 없다.
   */
  const hiddenByUnknown = useMemo(() => countRowsHiddenByUnknown(rows, filter), [rows, filter]);

  const onSortChange = (key: DividendListSortKey) => setSort((prev) => nextDividendListSort(prev, key));
  const HeroIcon = LIST_ICON[list.id];
  const mascot = DIVIDEND_LIST_MASCOT[list.id];

  return (
    <>
      <HeroBlock>
        <PageHero
          icon={<HeroIcon size={ICON.lg} strokeWidth={1.8} aria-hidden focusable={false} />}
          title={listCopy.title}
          titleAs="h1"
          lede={listCopy.lede}
          notice={criterion}
          /* 기준일·종목 수는 히어로의 근거 슬롯. 이 두 숫자가 없으면 목록은 "언제 것인지 모를 목록"이다. */
          meta={`${copy.asOfLabel} ${list.asOf} · ${copy.countLabel} ${list.members.length}${copy.countUnit}`}
        />
        {/* 목록마다 다른 마스코트. 장식이라 alt 는 비운다 — 이름은 옆의 h1 이 이미 말한다. */}
        <HeroMascot
          src={mascot.src}
          alt=""
          width={mascot.width}
          height={mascot.height}
          loading="eager"
          decoding="async"
          draggable={false}
        />
      </HeroBlock>

      <Sections>
        <Section>
          <SectionTitle>{copy.definitionHeading}</SectionTitle>
          <Body>{listCopy.definition}</Body>
          <CriterionBadge>{`${copy.criterionHeading} · ${listCopy.criterionLabel}`}</CriterionBadge>
          <CautionPanel>{listCopy.caution}</CautionPanel>
        </Section>

        {/*
          이달의 히든스타 — **이 목록에만** 선다. 다른 셋은 바깥 명부라 "이달의 하나"라는 자리가
          성립하지 않는다(명부가 이달에 바뀐 것이 아니므로).
          🔴 지난달 선정은 **그때의 수치와 함께 보존**된다. 매달 다시 계산하면 8월에 소개한 종목이
             9월에 바뀌어 과거가 뒤집힌다 — 그건 기록이 아니다.
        */}
        {list.id === 'hiddenStars' && HIDDEN_STAR_MONTHLY.length > 0 ? (
          <Section>
            <SectionTitle>{copy.monthlyHeading}</SectionTitle>
            <Body>{copy.monthlyBody}</Body>
            <MonthlyList>
              {HIDDEN_STAR_MONTHLY.map((pick) => (
                <MonthlyRow key={pick.month}>
                  <MonthlyMonth>{formatHiddenStarMonth(pick.month)}</MonthlyMonth>
                  <MonthlyName>
                    {pick.ticker} · {pick.name}
                  </MonthlyName>
                  <MonthlyFacts>
                    {copy.monthlyYield} {pick.forwardYieldPercent.toFixed(2)}% · {copy.monthlyGrowth}{' '}
                    {pick.fiveYearGrowthPercent.toFixed(1)}% · {copy.monthlyStreak(pick.minimumStreakYears)}
                  </MonthlyFacts>
                  {/* 🔴 규칙이 통과시킨 것과 사용자가 알아야 할 것은 다른 문제다. */}
                  {pick.isHighYieldOutlier ? <MonthlyNotice>{copy.monthlyHighYieldNotice}</MonthlyNotice> : null}
                  <MonthlyAsOf>{`${copy.asOfLabel} ${pick.asOf}`}</MonthlyAsOf>
                </MonthlyRow>
              ))}
            </MonthlyList>
          </Section>
        ) : null}

        <Section>
          <SectionTitle>{copy.streakHeading}</SectionTitle>
          <Body>{copy.streakBody}</Body>
        </Section>

        <Section>
          <SectionTitle>{copy.tableHeading}</SectionTitle>
          <DividendListFilters
            facets={facets}
            totalCount={rows.length}
            filter={filter}
            onChange={setFilter}
          />
          <TableMeta>
            {`${visibleRows.length}${copy.countUnit} ${copy.filteredCountSuffix} · ${copy.sortHint}`}
            {measuredAt ? ` · ${copy.measuredAtLabel} ${measuredAt}` : ''}
            {/* 값이 없어 빠진 줄은 **숫자로** 말한다. "왜 46종이 아니지"를 사용자가 혼자 풀게 두지 않는다. */}
            {hiddenByUnknown > 0
              ? ` · ${copy.filterUnknownExcludedPrefix}${hiddenByUnknown}${copy.filterUnknownExcludedSuffix}`
              : ''}
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
