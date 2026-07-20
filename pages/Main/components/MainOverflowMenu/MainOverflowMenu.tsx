import { memo, useMemo } from 'react';
import HeaderOverflowMenu from '@/components/HeaderOverflowMenu';
import { usePdfReport } from '@/pages/Main/hooks';

/**
 * 시뮬레이터 헤더의 "더보기(⋯)" 메뉴 컨테이너.
 *
 * `HeaderOverflowMenu`는 커뮤니티 헤더와 **공유**하는 컴포넌트라 시뮬레이터 데이터에 결합시키지 않는다.
 * 그래서 시뮬레이터 전용인 "PDF 리포트 저장"의 상태·동작은 여기서 만들어 prop으로 주입한다.
 *
 * 이 컴포넌트가 구독하는 것은 `usePdfReport`가 `selectAtom`으로 좁혀 둔 **불리언 두 개**뿐이라,
 * 폼 타건마다 헤더 크롬이 리렌더되는 회귀가 생기지 않는다.
 */
function MainOverflowMenuComponent() {
  const { isGenerating, failure, blockedReason, downloadPdfReport } = usePdfReport();

  const pdfReport = useMemo(
    () => ({ onDownload: downloadPdfReport, isGenerating, failure, blockedReason }),
    [downloadPdfReport, isGenerating, failure, blockedReason]
  );

  return <HeaderOverflowMenu showPdfReport pdfReport={pdfReport} />;
}

const MainOverflowMenu = memo(MainOverflowMenuComponent);

export default MainOverflowMenu;
