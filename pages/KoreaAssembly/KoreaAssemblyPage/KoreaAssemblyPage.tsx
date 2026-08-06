import { useMemo } from 'react';
import { TickerPageShell } from '@/pages/Ticker/components';
import { useDocumentMeta } from '@/pages/Ticker/hooks';
import { KOREA_ASSEMBLY_STOCKS } from '@/shared/constants/koreaAssemblyStocks';
import { KOREA_ASSEMBLY_COPY } from '../copy';
import { buildKoreaAssemblyViewModel } from '../utils';
import KoreaAssemblyView from './KoreaAssemblyPage.view';

/**
 * `/portfolio/korea-assembly` — 대한민국 국회의원 주식 보유.
 *
 * 데이터는 커밋된 스냅샷이라 **조회가 없다**(네트워크 0). 갱신은 `npm run korea:assembly`
 * (해마다 3월 말 공개 — 워크플로가 3~5월에만 지켜본다).
 *
 * ⚠ 셸·메타 훅은 미국 화면과 같은 것을 쓴다 — 두 화면을 오갈 때 폭과 헤더가 튀면 안 된다.
 * ⚠ `useMemo` 의 의존성이 비어 있는 것은 의도다 — 스냅샷은 모듈 상수라 렌더 사이에 바뀌지 않는다.
 */
export default function KoreaAssemblyPage() {
  const viewModel = useMemo(() => buildKoreaAssemblyViewModel(KOREA_ASSEMBLY_STOCKS), []);

  useDocumentMeta({
    title: KOREA_ASSEMBLY_COPY.meta.title,
    description: KOREA_ASSEMBLY_COPY.meta.description,
    pathname: '/portfolio/korea-assembly'
  });

  return (
    <TickerPageShell>
      <KoreaAssemblyView viewModel={viewModel} />
    </TickerPageShell>
  );
}
