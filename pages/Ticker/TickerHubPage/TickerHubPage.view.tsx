import {
  ArrowRight,
  Building2,
  Coins,
  Globe,
  Landmark,
  Layers,
  LayoutGrid,
  LineChart,
  Rows3,
  Scale,
  Search,
  TrendingUp,
  X,
  type LucideIcon
} from 'lucide-react';
import type { CSSProperties } from 'react';
import { BrandGlyph, PageFooter, PickCardGrid } from '@/components/common';
import { ICON } from '@/shared/styles';
import type {
  HubResultCategory,
  HubTickerCard,
  TickerHubViewProps
} from './TickerHubPage.types';
import { HUB_FREQUENCY_OPTIONS, HUB_SORT_OPTIONS } from './TickerHubPage.utils';
import {
  CARD_MIN_WIDTH,
  CapLabel,
  CardBody,
  CardMetric,
  CardMetricLabel,
  CardMetricLead,
  CardMetricRow,
  CardMetricRowLabel,
  CardMetricRowValue,
  CardMetricRows,
  CardMetricValue,
  CardNames,
  CardScope,
  CardSymbol,
  CardTagline,
  CategoryIndex,
  CategoryLink,
  CategoryLinkCount,
  CategoryLinkLabel,
  CategoryList,
  CategoryNav,
  CategorySection,
  CompareLink,
  EmptyActions,
  EmptyGlyph,
  EmptyState,
  EmptySuggestion,
  EmptyText,
  EmptyTitle,
  FilterRow,
  FrequencyChip,
  HubPickCard,
  IndexRail,
  Layout,
  LibrarySpec,
  LibrarySpecItem,
  LibrarySpecLabel,
  LibrarySpecValue,
  Masthead,
  MastheadEyebrow,
  MastheadLede,
  MastheadTitle,
  RailDivider,
  RailGroupLabel,
  ResetButton,
  ResultChip,
  ResultCount,
  ResultSummary,
  Results,
  SearchClear,
  SearchField,
  SearchGlyph,
  SearchInput,
  SectionCount,
  SectionEmpty,
  SectionEyebrow,
  SectionGlyph,
  SectionHead,
  SectionHeading,
  SortSelect,
  TableEnglish,
  TableKorean,
  TableMuted,
  TableNameCell,
  TableNumberCell,
  TableRow,
  TableScroll,
  TableTickerCell,
  TableTickerLink,
  TickerTable,
  ViewToggle,
  ViewToggleButton
} from './TickerHubPage.styled';

/**
 * 카테고리 → 글리프.
 *
 * 🔴 **색이 유일한 채널이 되지 않게 하는 장치다.** 색인 레일·섹션 제목·카드 캡이 카테고리 색을
 * 쓰는데, 회색조로 인쇄하거나 색각이상 환경에서 그 색은 사라진다. 모양은 남는다.
 *
 * ⚠ 이 표는 상세 페이지(`TickerDetailPage.view.tsx`)의 같은 이름 표와 **키·값이 같아야 한다** —
 * 허브에서 카드를 눌러 들어간 사람이 상세 히어로에서 같은 모양을 다시 만난다.
 * 키는 `TICKER_CATEGORY_LABEL` 의 키(=섹션 id)다. 빠뜨려도 아래 폴백으로 조용히 그려진다.
 */
const CATEGORY_GLYPH: Record<string, LucideIcon> = {
  'dividend-growth': TrendingUp,
  'high-dividend': Coins,
  'covered-call': Layers,
  reit: Building2,
  international: Globe,
  'core-index': LineChart,
  'dividend-stock': Landmark
};

const glyphFor = (categoryId: string): LucideIcon => CATEGORY_GLYPH[categoryId] ?? LayoutGrid;

/** 색인·섹션이 함께 쓰는 두 자리 번호. 문서의 뼈대를 숫자로 세운다. */
const indexOf = (order: number): string => String(order + 1).padStart(2, '0');

/**
 * 티커 액센트를 스코프에 **원시 변수**로 얹는다 — 상세 페이지의 `AccentScope` 와 같은 변수명이라
 * 두 화면에서 같은 티커가 같은 색으로 읽힌다. 테마 분기·틴트 파생은 전부 스타일이 한다.
 *
 * `--tk-fallback` 은 액센트가 **없는** 티커의 색이다(`assignSeries` 배정 결과) — 같은 격자 안에서
 * 서로 겹치지 않는다.
 */
const accentVars = (card: HubTickerCard): CSSProperties =>
  ({
    '--tk-fallback': card.seriesVar,
    ...(card.accent
      ? {
          '--tk-from': card.accent.from,
          '--tk-to': card.accent.to,
          '--tk-text-light': card.accent.textLight,
          '--tk-text-dark': card.accent.textDark
        }
      : {})
  }) as CSSProperties;

/**
 * 검색이 아무것도 못 찾았을 때 내미는 대안. 레지스트리의 실제 슬러그라 죽은 링크가 되지 않는다
 * (셋 다 검색 유입이 가장 많은 축 — 배당성장 · 커버드콜 · 월배당 리츠).
 */
const FALLBACK_PICKS = [
  { ticker: 'SCHD', slug: 'schd' },
  { ticker: 'JEPI', slug: 'jepi' },
  { ticker: 'O', slug: 'o' }
] as const;

export default function TickerHubView({
  viewModel,
  filters,
  result,
  onQueryChange,
  onFrequencyChange,
  onSortChange,
  onViewChange,
  onReset
}: TickerHubViewProps) {
  const { stats } = viewModel;
  const frequencyLabel = HUB_FREQUENCY_OPTIONS.find((option) => option.value === filters.frequency)?.label ?? '전체';
  const hasResults = result.matchedCount > 0;

  return (
    <>
      {/* ── 매스트헤드: 카드가 아니라 편집면. 상단 오로라 줄 ~ 하단 헤어라인 사이가 지면 머리다. ── */}
      <Masthead>
        <MastheadEyebrow>
          <BrandGlyph size={16} />
          ETF 라이브러리
        </MastheadEyebrow>
        <MastheadTitle>배당 ETF·종목 티커 정리</MastheadTitle>
        <MastheadLede>
          {/* ⚠ "왼쪽" 처럼 **자리를 가리키는 말**을 쓰지 마라 — 좁은 화면에서 레일은 위쪽 블록이 된다. */}
          배당률·배당성장·운용보수·구성 기준을 티커별로 정리했습니다. 검색과 필터로 후보를 좁힌 뒤, 관심 있는 티커를 골라
          시뮬레이터에서 내 조건으로 계산해 보세요.
        </MastheadLede>

        {/* 스펙 줄 — 상세 페이지의 참고 지표와 같은 문법(라벨 위·값 아래·칸 사이 헤어라인). */}
        <LibrarySpec>
          <LibrarySpecItem>
            <LibrarySpecLabel>수록 종목</LibrarySpecLabel>
            <LibrarySpecValue>{viewModel.totalCount}종</LibrarySpecValue>
          </LibrarySpecItem>
          <LibrarySpecItem>
            <LibrarySpecLabel>카테고리</LibrarySpecLabel>
            <LibrarySpecValue>{stats.categoryCount}개</LibrarySpecValue>
          </LibrarySpecItem>
          {/* 값이 없으면(수록 0종) 칸 자체를 뺀다 — 빈 범위를 '-' 로 채우지 않는다. */}
          {stats.yieldMinDisplay && stats.yieldMaxDisplay ? (
            <LibrarySpecItem>
              <LibrarySpecLabel>배당률 범위</LibrarySpecLabel>
              <LibrarySpecValue>
                {stats.yieldMinDisplay} ~ {stats.yieldMaxDisplay}
              </LibrarySpecValue>
            </LibrarySpecItem>
          ) : null}
          <LibrarySpecItem>
            <LibrarySpecLabel>매월 지급</LibrarySpecLabel>
            <LibrarySpecValue>{stats.monthlyCount}종</LibrarySpecValue>
          </LibrarySpecItem>
        </LibrarySpec>
      </Masthead>

      <Layout>
        {/* ── 색인 레일: 검색 · 조건 · 목차 · 비교 진입. 상세의 목차 레일과 같은 골격이다. ── */}
        <IndexRail aria-label="티커 찾기">
          <RailGroupLabel>찾기</RailGroupLabel>

          <SearchField>
            <SearchGlyph aria-hidden>
              <Search size={ICON.sm} strokeWidth={ICON.stroke} />
            </SearchGlyph>
            <SearchInput
              type="search"
              value={filters.query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="티커·종목명으로 검색"
              aria-label="티커·종목명 검색"
            />
            {/* 검색어가 있을 때만 선다 — 빈 아이콘 자리를 남겨 두지 않는다. */}
            {filters.query ? (
              <SearchClear type="button" onClick={() => onQueryChange('')} aria-label="검색어 지우기">
                <X size={ICON.sm} strokeWidth={ICON.stroke} aria-hidden />
              </SearchClear>
            ) : null}
          </SearchField>

          {/* 지급 주기 — 라디오형 묶음이라 항상 하나가 눌려 있다(aria-pressed 로 상태를 말한다). */}
          <FilterRow role="group" aria-label="지급 주기">
            {HUB_FREQUENCY_OPTIONS.map((option) => (
              <FrequencyChip
                key={option.value}
                type="button"
                $active={filters.frequency === option.value}
                aria-pressed={filters.frequency === option.value}
                onClick={() => onFrequencyChange(option.value)}
              >
                {option.label}
              </FrequencyChip>
            ))}
          </FilterRow>

          <FilterRow>
            <SortSelect
              value={filters.sort}
              onChange={(event) => onSortChange(event.target.value as typeof filters.sort)}
              aria-label="정렬 기준"
            >
              {HUB_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SortSelect>

            {/* 밀도를 사용자가 고른다 — 카드는 훑기에, 표는 비교에 낫다. */}
            <ViewToggle role="group" aria-label="보기 형태">
              <ViewToggleButton
                type="button"
                $active={filters.view === 'grid'}
                aria-pressed={filters.view === 'grid'}
                onClick={() => onViewChange('grid')}
              >
                <LayoutGrid size={ICON.xs} strokeWidth={ICON.stroke} aria-hidden />
                카드
              </ViewToggleButton>
              <ViewToggleButton
                type="button"
                $active={filters.view === 'table'}
                aria-pressed={filters.view === 'table'}
                onClick={() => onViewChange('table')}
              >
                <Rows3 size={ICON.xs} strokeWidth={ICON.stroke} aria-hidden />
                표
              </ViewToggleButton>
            </ViewToggle>
          </FilterRow>

          <RailDivider />
          <RailGroupLabel>카테고리</RailGroupLabel>

          {/*
           * 🔴 해시 앵커다 — 아래 CategorySection 의 id 와 짝이고, 그 섹션의 scroll-margin-top 이
           * 고정 헤더를 피한다. 라우터 Link 로 바꾸지 마라(같은 문서 안 이동이라 브라우저 기본 동작이 옳다).
           * 링크는 필터와 무관하게 **항상 전부** 선다 — 섹션도 항상 남으므로 앵커가 죽지 않는다.
           */}
          <CategoryNav aria-label="카테고리 바로가기">
            <CategoryList>
              {result.categories.map((category, order) => (
                <li key={category.id}>
                  <CategoryLink href={`#${category.id}`} $dimmed={category.matched.length === 0}>
                    <CategoryIndex aria-hidden>{indexOf(order)}</CategoryIndex>
                    <CategoryLinkLabel>{category.label}</CategoryLinkLabel>
                    {/* 필터가 걸리면 '일치 / 전체' 로 바뀐다 — 어느 칸이 줄었는지가 레일에서 읽힌다. */}
                    <CategoryLinkCount>
                      {result.filtered ? `${category.matched.length}/${category.tickers.length}` : category.tickers.length}
                    </CategoryLinkCount>
                  </CategoryLink>
                </li>
              ))}
            </CategoryList>
          </CategoryNav>

          <RailDivider />

          {/* 🔴 nav **밖** 형제다 — "카테고리 바로가기" 는 같은 문서 안 이동만 담는다는 약속이다. */}
          <CompareLink to="/ticker/compare">
            <Scale size={ICON.sm} strokeWidth={ICON.stroke} aria-hidden />
            종목 비교하기
            <ArrowRight size={ICON.sm} strokeWidth={ICON.stroke} aria-hidden />
          </CompareLink>
        </IndexRail>

        <Results>
          {/* 조건을 바꿨을 때 무슨 일이 일어났는지 문장으로 말한다(스크린리더도 듣는다). */}
          <ResultSummary role="status">
            {/* 조건이 없을 때 "27종 표시 · 전체 27종" 은 같은 말을 두 번 하는 것이다 —
                평상시에는 라이브러리의 규모를, 걸렀을 때만 남은 수를 말한다. */}
            {result.filtered ? (
              <span>
                <ResultCount>{result.matchedCount}</ResultCount>종 일치 · 전체 {result.totalCount}종
              </span>
            ) : (
              <span>
                전체 <ResultCount>{result.totalCount}</ResultCount>종을 {viewModel.stats.categoryCount}개 카테고리로
                정리했습니다
              </span>
            )}
            {filters.query ? <ResultChip>검색 “{filters.query}”</ResultChip> : null}
            {filters.frequency !== 'all' ? <ResultChip>지급 {frequencyLabel}</ResultChip> : null}
            {result.filtered ? (
              <ResetButton type="button" onClick={onReset}>
                <X size={ICON.xs} strokeWidth={ICON.stroke} aria-hidden />
                조건 지우기
              </ResetButton>
            ) : null}
          </ResultSummary>

          {/* 레지스트리 자체가 비었을 때 / 필터가 아무것도 못 찾았을 때 — 둘 다 막다른 길로 두지 않는다. */}
          {!hasResults ? (
            <EmptyState>
              <EmptyGlyph aria-hidden>
                {/* 빈 상태 마스코트는 96 — 다른 화면의 빈 상태와 같은 계단을 쓴다. */}
                <BrandGlyph size={96} />
              </EmptyGlyph>
              <EmptyTitle>
                {result.filtered ? '조건에 맞는 티커가 없습니다' : '아직 정리된 티커 콘텐츠가 없습니다'}
              </EmptyTitle>
              <EmptyText>
                {result.filtered
                  ? '검색어를 줄이거나 지급 주기를 전체로 되돌리면 더 많은 티커가 보입니다. 아래 종목부터 살펴보셔도 좋습니다.'
                  : '배당 ETF·종목 소개를 준비하고 있습니다. 곧 이 자리에 채워집니다.'}
              </EmptyText>
              <EmptyActions>
                {result.filtered ? (
                  <ResetButton type="button" onClick={onReset}>
                    조건 지우기
                  </ResetButton>
                ) : null}
                {FALLBACK_PICKS.map((pick) => (
                  <EmptySuggestion key={pick.ticker} to={`/ticker/${pick.slug}`}>
                    {pick.ticker}
                  </EmptySuggestion>
                ))}
              </EmptyActions>
            </EmptyState>
          ) : null}

          {/*
           * 🔴 카테고리 섹션은 **필터와 무관하게 전부 렌더된다.** 섹션 id 가 색인 앵커의 목적지라,
           * 결과가 0인 칸을 지우면 링크가 조용히 아무 데도 못 간다. 대신 그 자리에 한 줄을 세운다.
           */}
          {result.categories.map((category, order) => (
            <CategorySectionView
              key={category.id}
              category={category}
              order={order}
              view={filters.view}
              filtered={result.filtered}
            />
          ))}
        </Results>
      </Layout>

      {/* 다른 화면과 같은 자리·같은 모양의 공용 푸터(2026-07-31). 이 화면에는 자기 각주가 없어
          사이트 공통 고지만 나간다 — 카드 숫자의 근거는 각 티커 상세가 자기 문장으로 말한다.
          ⚠ 크롤러가 읽는 HTML 은 `server/handlers/TickerHtml` 이 따로 만든다(이 컴포넌트와 무관). */}
      <PageFooter />
    </>
  );
}

/** 카테고리 한 칸 — 번호 머리말 + 제목 + (카드 격자 | 표 | 무결과 한 줄). */
function CategorySectionView({
  category,
  order,
  view,
  filtered
}: {
  category: HubResultCategory;
  order: number;
  view: 'grid' | 'table';
  filtered: boolean;
}) {
  const Glyph = glyphFor(category.id);
  const empty = category.matched.length === 0;

  return (
    <CategorySection id={category.id} aria-labelledby={`${category.id}-heading`}>
      <SectionHead>
        {/* 번호 + (필터 중일 때만) 일치 비율 + 헤어라인. 종목 수는 아래 제목의 칩이 말하므로
            평상시에는 되풀이하지 않는다 — 같은 숫자를 두 번 쓰면 둘 다 안 읽힌다. */}
        <SectionEyebrow>
          <span>{indexOf(order)}</span>
          {filtered ? <span>{category.tickers.length}종 중 {category.matched.length}종 일치</span> : null}
        </SectionEyebrow>
        <SectionHeading id={`${category.id}-heading`}>
          <SectionGlyph aria-hidden>
            <Glyph size={ICON.xl} strokeWidth={ICON.stroke} />
          </SectionGlyph>
          {category.label}
          <SectionCount>{category.matched.length}종</SectionCount>
        </SectionHeading>
      </SectionHead>

      {empty ? (
        <SectionEmpty>지금 조건에 맞는 {category.label} 티커가 없습니다.</SectionEmpty>
      ) : view === 'table' ? (
        <CategoryTable category={category} />
      ) : (
        /*
         * `cluster` 는 **서 있는 보험**이다. 2026-08-03 흰 캔버스 전환으로 카드 캡의 면색이
         * 중립(`surfaceSunken`)이 되어 지금은 tintscan 이 이 캡들을 애초에 세지 않는다 —
         * 즉 이 표식이 없어도 오늘의 예산은 터지지 않는다. 그래도 남겨 두는 이유는, 캡을 다시
         * 채도로 되돌리는 순간(높이 48px 은 면 하한 8px 를 훌쩍 넘는다) 표식 없이는 카드
         * 장수만큼 면이 잡혀 예산이 조용히 터지기 때문이다. 값은 부품이 고정한다(라우트당 한 값만).
         */
        <PickCardGrid as="ul" cluster minColumnWidth={CARD_MIN_WIDTH}>
          {category.matched.map((ticker) => (
            <CardScope key={ticker.ticker} style={accentVars(ticker)}>
              {/* 격자 셀(li)은 바깥 CardScope 다 — 카드 자신은 article 로 남는다(li 안의 li 금지). */}
              <HubPickCard
                titleAs="h3"
                to={`/ticker/${ticker.slug}`}
                title={<CardSymbol>{ticker.ticker}</CardSymbol>}
                subtitle={
                  <CardNames>
                    {ticker.koreanName} · {ticker.englishName}
                  </CardNames>
                }
                cap={{
                  kind: 'tint',
                  axis: 'scoped',
                  /* 면은 중립 판(`--tk-cap-fill` = surface-sunken), 색은 잉크·글리프만 티커별이다.
                     왜 면에서 색을 걷었는지는 TickerHubPage.styled.ts 의 CardScope 주석. */
                  scopedVar: '--tk-cap-fill',
                  scopedInkVar: '--tk-text',
                  height: 'sm',
                  glyph: <Glyph size={ICON.md} strokeWidth={ICON.stroke} />,
                  label: <CapLabel>{category.label}</CapLabel>
                }}
              >
                <CardBody>
                  <CardTagline>{ticker.tagline}</CardTagline>
                  {/* 주역 하나(배당률) + 보조 행들 — 상세 히어로의 지표판과 같은 문법. */}
                  <CardMetric>
                    <CardMetricLead>
                      <CardMetricLabel>배당률</CardMetricLabel>
                      <CardMetricValue>{ticker.dividendYield}</CardMetricValue>
                    </CardMetricLead>
                    <CardMetricRows>
                      {/* 값이 없는 티커는 행 자체를 뺀다 — 빈 값·'-'·0% 로 자리를 채우지 않는다. */}
                      {ticker.expenseRatio ? (
                        <CardMetricRow>
                          <CardMetricRowLabel>운용보수</CardMetricRowLabel>
                          <CardMetricRowValue>{ticker.expenseRatio}</CardMetricRowValue>
                        </CardMetricRow>
                      ) : null}
                      <CardMetricRow>
                        <CardMetricRowLabel>지급</CardMetricRowLabel>
                        <CardMetricRowValue>{ticker.frequencyLabel}</CardMetricRowValue>
                      </CardMetricRow>
                    </CardMetricRows>
                  </CardMetric>
                </CardBody>
              </HubPickCard>
            </CardScope>
          ))}
        </PickCardGrid>
      )}
    </CategorySection>
  );
}

/**
 * 표 보기 — 상세 페이지의 상위 보유 종목 표와 같은 문법이다.
 *
 * 🔴 티커 셀은 **여전히 상세로 가는 링크**다. 보기를 바꿔도 진입점 수는 카드 격자와 같다.
 */
function CategoryTable({ category }: { category: HubResultCategory }) {
  return (
    <TableScroll>
      <TickerTable>
        <caption>
          {category.label} {category.matched.length}종 — 배당률·운용보수·지급 주기
        </caption>
        <thead>
          <tr>
            <th scope="col">티커</th>
            <th scope="col">종목명</th>
            <th scope="col">배당률</th>
            <th scope="col">운용보수</th>
            <th scope="col">지급</th>
          </tr>
        </thead>
        <tbody>
          {category.matched.map((ticker) => (
            <TableRow key={ticker.ticker} style={accentVars(ticker)}>
              <TableTickerCell>
                <TableTickerLink to={`/ticker/${ticker.slug}`}>{ticker.ticker}</TableTickerLink>
              </TableTickerCell>
              <TableNameCell>
                <TableKorean>{ticker.koreanName}</TableKorean>
                <TableEnglish>{ticker.englishName}</TableEnglish>
              </TableNameCell>
              <TableNumberCell>{ticker.dividendYield}</TableNumberCell>
              <TableNumberCell>
                {ticker.expenseRatio ?? <TableMuted>미공시</TableMuted>}
              </TableNumberCell>
              <TableNumberCell>{ticker.frequencyLabel}</TableNumberCell>
            </TableRow>
          ))}
        </tbody>
      </TickerTable>
    </TableScroll>
  );
}
