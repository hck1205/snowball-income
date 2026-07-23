import { useMemo } from 'react';
import { TickerPageShell } from '../components';
import { useDocumentMeta } from '../hooks';
import TickerHubView from './TickerHubPage.view';
import { buildTickerHubViewModel } from './TickerHubPage.utils';

// ⚠ 서버 렌더러(server/handlers/TickerHtml)의 HUB_META_TITLE·buildHubDescription 과 **문구를 일치**시킨다.
// (서버 로직은 건드리지 않으므로 공유 상수화 대신 클라 문구를 서버에 맞춘다 — drift 방지.)
const HUB_TITLE = '배당 ETF·종목 SEO 소개 모음 — 배당률·배당성장·구성 한눈에';
const buildHubDescription = (count: number): string =>
  `${count}개 배당 ETF·종목의 배당률·배당성장률·운용보수·구성 기준을 정리했습니다. 관심 있는 티커를 선택해 자세히 확인해 보세요.`;

/**
 * `/ticker/all` 컨테이너 — 콘텐츠 레지스트리를 카테고리별로 그룹핑해 뷰에 넘긴다.
 * 레지스트리는 정적이라 뷰모델을 마운트당 한 번만 만든다.
 */
export default function TickerHubPage() {
  const viewModel = useMemo(() => buildTickerHubViewModel(), []);

  useDocumentMeta({ title: HUB_TITLE, description: buildHubDescription(viewModel.totalCount), pathname: '/ticker/all' });

  return (
    <TickerPageShell>
      <TickerHubView viewModel={viewModel} />
    </TickerPageShell>
  );
}
