import { useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { findTickerContentBySlug } from '@/shared/constants/tickers';
import { TickerPageShell } from '../components';
import { useDocumentMeta } from '../hooks';
import TickerDetailView from './TickerDetailPage.view';
import { buildTickerDetailViewModel } from './TickerDetailPage.utils';

/**
 * `/ticker/:name` 컨테이너.
 *
 * 슬러그를 `findTickerContentBySlug`(소문자)로 해석한다. 콘텐츠 엔트리가 없으면(엔진 계산은
 * 되지만 SEO 페이지가 없는 대다수 티커) 허브로 리다이렉트한다. 있으면 엔진 값과 조인한 뷰모델을
 * 만들어 뷰에 넘기고, SPA 네비게이션용 문서 메타를 티커별 고유값으로 세팅한다.
 */
export default function TickerDetailPage() {
  const { name = '' } = useParams<{ name: string }>();
  const content = findTickerContentBySlug(name);

  const viewModel = useMemo(() => (content ? buildTickerDetailViewModel(content) : null), [content]);

  useDocumentMeta({
    title: viewModel?.metaTitle ?? '',
    description: viewModel?.metaDescription ?? '',
    pathname: viewModel ? `/ticker/${viewModel.slug}` : '/ticker/all'
  });

  if (!content || !viewModel) {
    return <Navigate to="/ticker/all" replace />;
  }

  return (
    <TickerPageShell>
      <TickerDetailView viewModel={viewModel} />
    </TickerPageShell>
  );
}
