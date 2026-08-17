import { useCallback, useMemo, useState } from 'react';
import { TickerPageShell } from '../components';
import { useDocumentMeta } from '../hooks';
import type { HubFilterState, HubFrequencyFilter, HubSortKey, HubViewMode } from './TickerHubPage.types';
import TickerHubView from './TickerHubPage.view';
import { buildTickerHubViewModel, DEFAULT_HUB_FILTERS, filterTickerHub } from './TickerHubPage.utils';

// ⚠ 서버 렌더러(server/handlers/TickerHtml)의 HUB_META_TITLE·buildHubDescription 과 **문구를 일치**시킨다.
// (서버 로직은 건드리지 않으므로 공유 상수화 대신 클라 문구를 서버에 맞춘다 — drift 방지.)
const HUB_TITLE = '배당 ETF·종목 SEO 소개 모음 — 배당률·배당성장·구성 한눈에';
const buildHubDescription = (count: number): string =>
  `${count}개 배당 ETF·종목의 배당률·배당성장률·운용보수·구성 기준을 정리했습니다. 관심 있는 티커를 선택해 자세히 확인해 보세요.`;

/**
 * `/ticker/all` 컨테이너 — 콘텐츠 레지스트리를 카테고리별로 그룹핑하고, **찾기 상태**(검색어·주기·
 * 정렬·보기)를 소유해 뷰에 넘긴다.
 *
 * 🔴 찾기 상태를 **URL 에 싣지 않는다.** 이 라우트는 검색 유입의 착지점이라 색인 대상이고,
 * 필터 조합마다 URL 이 갈리면 같은 목록이 여러 주소로 색인된다(정규화 부담). 상태는 세션 안에서만
 * 산다 — 공유는 티커 상세 URL 이 맡는다.
 *
 * 레지스트리는 정적이라 뷰모델은 마운트당 한 번만 만들고, 필터 결과만 상태에 따라 다시 센다.
 */
export default function TickerHubPage() {
  const viewModel = useMemo(() => buildTickerHubViewModel(), []);
  const [filters, setFilters] = useState<HubFilterState>(DEFAULT_HUB_FILTERS);
  const result = useMemo(() => filterTickerHub(viewModel, filters), [viewModel, filters]);

  useDocumentMeta({ title: HUB_TITLE, description: buildHubDescription(viewModel.totalCount), pathname: '/ticker/all' });

  const onQueryChange = useCallback((query: string) => setFilters((prev) => ({ ...prev, query })), []);
  const onYieldChange = useCallback(
    (minYieldPercent: number | null) => setFilters((prev) => ({ ...prev, minYieldPercent })),
    []
  );
  const onFrequencyChange = useCallback(
    (frequency: HubFrequencyFilter) => setFilters((prev) => ({ ...prev, frequency })),
    []
  );
  const onSortChange = useCallback((sort: HubSortKey) => setFilters((prev) => ({ ...prev, sort })), []);
  /* 보기 전환은 결과 집합이 아니라 **표현**만 바꾼다 — 검색어·주기를 함께 지우지 않는다. */
  const onViewChange = useCallback((view: HubViewMode) => setFilters((prev) => ({ ...prev, view })), []);
  /* 초기화는 보기 형태까지 되돌리지 않는다. 사용자가 고른 밀도는 필터가 아니라 취향이다. */
  const onReset = useCallback(
    () => setFilters((prev) => ({ ...DEFAULT_HUB_FILTERS, sort: prev.sort, view: prev.view })),
    []
  );

  return (
    <TickerPageShell>
      <TickerHubView
        viewModel={viewModel}
        filters={filters}
        result={result}
        onQueryChange={onQueryChange}
        onYieldChange={onYieldChange}
        onFrequencyChange={onFrequencyChange}
        onSortChange={onSortChange}
        onViewChange={onViewChange}
        onReset={onReset}
      />
    </TickerPageShell>
  );
}
