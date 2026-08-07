import { useId } from 'react';
import { RotateCcw, Search, X } from 'lucide-react';
import { Button, Chip } from '@/components/common';
import type { DividendListSectorId } from '@/shared/constants/dividendLists';
import { ICON } from '@/shared/styles';
import { DIVIDEND_LIST_COPY } from '../../copy';
import {
  DIVIDEND_LIST_GROWTH_STEPS,
  DIVIDEND_LIST_YIELD_STEPS,
  NO_DIVIDEND_LIST_FILTER,
  isDividendListFiltered,
  toggleDividendListSector
} from '../../utils';
import type { DividendListFiltersProps } from './DividendListFilters.types';
import {
  ActiveBadge,
  ActiveRow,
  ActiveText,
  AxisLabel,
  AxisRow,
  ChipRow,
  FilterHint,
  FiltersPanel,
  SearchClear,
  SearchField,
  SearchInput,
  SearchRow
} from './DividendListFilters.styled';

const copy = DIVIDEND_LIST_COPY.page;

/**
 * 목록을 좁히는 **세 축** — 배당률 · 5년 배당성장 · 섹터.
 *
 * ## 왜 두 축은 단일 선택이고 섹터만 다중 선택인가
 * 배당률·성장은 **"이상" 사다리**라 두 칸을 동시에 켜는 것이 의미가 없다(3% 이상은 2% 이상을
 * 이미 포함한다). 섹터는 서로 겹치지 않는 분류라 하나만 고를 수 있으면 표가 너무 빨리 사라진다 —
 * 실측(2026-08-04): 배당킹 46종에 배당률 3% 이상을 걸면 12종이 남는데 그 섹터 분포가
 * 필수소비재 6 · 유틸리티 3 · 경기소비재 1 · 부동산 1 · 산업재 1 이다. 단일 선택이면 한 칸에
 * 1~6종이라 표가 사실상 없어지고, 다중 선택이면 "금리에 민감한 묶음(유틸리티+부동산)" 같은
 * 조합이 의미 있는 크기로 남는다.
 *
 * ## 상태를 두 채널로 말한다
 * 🔴 칩의 선택 표시는 테두리·면·굵기인데 그중 둘이 색이다. 그래서 아래 "적용 중" 줄이 걸린
 * 조건을 **문장으로 다시 쓴다** — 색 단독 채널 금지(이 레포 공통 규율)를 만족시키는 자리이자,
 * 칩 줄을 지나쳐 표만 보고 있던 사용자가 "왜 46종이 12종이지?"를 되찾는 자리다.
 *
 * ## URL 동기화는 **하지 않는다** (2026-08-04 판단)
 * 이 레포에는 선례가 있다(게시판 분류 `?cat=`). 그럼에도 여기는 넣지 않는다:
 *  1. 그 필터는 **무엇을 받아올지**를 정한다(서버 페이지네이션·빈 결과 CTA가 URL에 매여 있다).
 *     여기는 198행이 이미 클라이언트에 다 있고 필터는 순수한 보기 조건이다.
 *  2. 🔴 **정렬은 URL에 없다.** 필터만 URL에 넣으면 공유 링크가 화면의 절반만 복원한다 —
 *     받은 사람은 필터는 걸렸는데 정렬은 티커 오름차순인, 보낸 적 없는 화면을 본다.
 *  3. 이 세 라우트는 색인 대상 문서다. canonical 은 경로만 쓰므로(`useDocumentMeta`) 쿼리가
 *     붙어도 색인은 안전하지만, 상태 채널이 하나 늘면 그 계약을 계속 지켜야 한다.
 * ⚠ 넣을 거라면 **정렬과 함께** 넣어라(`?y=3&g=5&sector=a,b&sort=yield.desc`). 한쪽만 넣는 것이
 *   가장 나쁘다.
 */
export default function DividendListFilters({
  facets,
  totalCount,
  filter,
  onChange
}: DividendListFiltersProps) {
  const yieldLabelId = useId();
  const growthLabelId = useId();
  const sectorLabelId = useId();
  const searchLabelId = useId();

  const stepLabel = (step: number) => `${step}${copy.filterAtLeastSuffix}`;
  const setYield = (step: number | null) => onChange({ ...filter, minYieldPercent: step });
  const setGrowth = (step: number | null) => onChange({ ...filter, minGrowthPercent: step });
  const setQuery = (query: string) => onChange({ ...filter, query });
  const toggleSector = (sector: DividendListSectorId) =>
    onChange({ ...filter, sectors: toggleDividendListSector(filter.sectors, sector) });

  /* 걸린 조건을 문장으로. 축 이름은 **표의 열 이름과 같은 낱말**이라 표와 필터가 같은 말을 한다. */
  const activeParts: string[] = [];
  const trimmedQuery = filter.query.trim();
  if (trimmedQuery !== '') {
    activeParts.push(`${copy.filterSearchActivePrefix} ${trimmedQuery}`);
  }
  if (filter.minYieldPercent !== null) {
    activeParts.push(`${copy.columnYield} ${stepLabel(filter.minYieldPercent)}`);
  }
  if (filter.minGrowthPercent !== null) {
    activeParts.push(`${copy.columnGrowth} ${stepLabel(filter.minGrowthPercent)}`);
  }
  if (filter.sectors.length > 0) {
    const labels = filter.sectors.map(
      (sector) => facets.find((facet) => facet.sector === sector)?.label ?? sector
    );
    activeParts.push(`${copy.columnSector} ${labels.join(copy.filterSectorSeparator)}`);
  }

  return (
    <FiltersPanel>
      {/*
        🔴 검색이 **맨 위**다. 찾는 종목이 정해진 사용자는 칩을 볼 이유가 없고, 그 사용자가
        83줄을 스크롤로 훑는 일을 없애는 것이 이 입력의 목적이다(2026-08-07 사용자 요청).
        ⚠ type="search" 를 쓴다 — 모바일 키보드가 확인 키를 "검색"으로 바꾸고, 폼이 아니어서
          엔터로 페이지가 새로고침되지 않는다(입력 즉시 걸리므로 제출할 것도 없다).
      */}
      <SearchRow>
        <AxisLabel id={searchLabelId}>{copy.filterSearchLabel}</AxisLabel>
        <SearchField>
          <Search size={ICON.sm} strokeWidth={1.8} aria-hidden focusable={false} />
          <SearchInput
            type="search"
            value={filter.query}
            aria-labelledby={searchLabelId}
            placeholder={copy.filterSearchPlaceholder}
            onChange={(event) => setQuery(event.target.value)}
          />
          {filter.query !== '' ? (
            <SearchClear type="button" aria-label={copy.filterSearchClear} onClick={() => setQuery('')}>
              <X size={ICON.sm} strokeWidth={1.8} aria-hidden focusable={false} />
            </SearchClear>
          ) : null}
        </SearchField>
      </SearchRow>

      <AxisRow role="group" aria-labelledby={yieldLabelId}>
        <AxisLabel id={yieldLabelId}>{copy.columnYield}</AxisLabel>
        <ChipRow>
          <Chip selected={filter.minYieldPercent === null} onClick={() => setYield(null)}>
            {copy.filterAll}
          </Chip>
          {DIVIDEND_LIST_YIELD_STEPS.map((step) => (
            <Chip
              key={step}
              selected={filter.minYieldPercent === step}
              /* 켜진 칸을 다시 누르면 꺼진다 — "전체"까지 가지 않고도 축 하나를 되돌릴 수 있다. */
              onClick={() => setYield(filter.minYieldPercent === step ? null : step)}
            >
              {stepLabel(step)}
            </Chip>
          ))}
        </ChipRow>
      </AxisRow>

      <AxisRow role="group" aria-labelledby={growthLabelId}>
        <AxisLabel id={growthLabelId}>{copy.columnGrowth}</AxisLabel>
        <ChipRow>
          <Chip selected={filter.minGrowthPercent === null} onClick={() => setGrowth(null)}>
            {copy.filterAll}
          </Chip>
          {DIVIDEND_LIST_GROWTH_STEPS.map((step) => (
            <Chip
              key={step}
              selected={filter.minGrowthPercent === step}
              onClick={() => setGrowth(filter.minGrowthPercent === step ? null : step)}
            >
              {stepLabel(step)}
            </Chip>
          ))}
        </ChipRow>
      </AxisRow>

      <AxisRow role="group" aria-labelledby={sectorLabelId}>
        <AxisLabel id={sectorLabelId}>{copy.columnSector}</AxisLabel>
        <ChipRow>
          {/* 섹터 축의 "전체" = 고른 섹터를 전부 비우는 것. 목록 크기를 함께 달아 필터 전 규모를 남긴다. */}
          <Chip
            selected={filter.sectors.length === 0}
            onClick={() => onChange({ ...filter, sectors: [] })}
          >
            {`${copy.filterAll} ${totalCount}`}
          </Chip>
          {facets.map((facet) => (
            <Chip
              key={facet.sector}
              selected={filter.sectors.includes(facet.sector)}
              onClick={() => toggleSector(facet.sector)}
            >
              {`${facet.label} ${facet.count}`}
            </Chip>
          ))}
        </ChipRow>
      </AxisRow>

      <FilterHint>{copy.filterHint}</FilterHint>

      {isDividendListFiltered(filter) ? (
        /*
         * `role="status"`(암묵적 aria-live="polite") — 칩을 눌러도 화면 **아래쪽** 표만 바뀌므로
         * 스크린리더 사용자는 자기 조작의 결과를 듣지 못한다. 이 줄이 바뀔 때마다 조건이 낭독된다.
         * ⚠ 공용 `Chip` 은 `aria-pressed` 를 받지 않는다(그 부품은 이 트랙의 담당 밖이다). 그래서
         *   "무엇이 켜져 있나"를 보조기술에 전하는 책임을 이 줄이 진다 — 지우려면 Chip 쪽에
         *   눌림 상태를 먼저 넣어라.
         */
        <ActiveRow role="status">
          <ActiveBadge>{copy.filterActiveLabel}</ActiveBadge>
          <ActiveText>{activeParts.join(copy.filterAxisSeparator)}</ActiveText>
          {/* 표가 0종이 되는 조합이 실제로 있다(4% 이상 + 10% 이상). 빠져나갈 길은 언제나 여기 있다. */}
          <Button
            variant="ghost"
            size="sm"
            startIcon={<RotateCcw size={ICON.sm} strokeWidth={1.8} aria-hidden focusable={false} />}
            onClick={() => onChange(NO_DIVIDEND_LIST_FILTER)}
          >
            {copy.filterReset}
          </Button>
        </ActiveRow>
      ) : null}
    </FiltersPanel>
  );
}
