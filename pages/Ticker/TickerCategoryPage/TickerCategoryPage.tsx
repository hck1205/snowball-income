import { useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';

import {
  isTickerCategoryId,
  listTickerContentByCategory,
  TICKER_CATEGORY_IDS,
  TICKER_CATEGORY_LABEL,
  TICKER_CATEGORY_META,
  tickerCategoryPath
} from '@/shared/constants/tickers';

import { TickerPageShell } from '../components';
import { useDocumentMeta } from '../hooks';
import TickerCategoryView from './TickerCategoryPage.view';

/**
 * `/ticker/category/:id` — 전체 허브(`/ticker/all`)와 개별 티커 사이의 **중간 계층**.
 *
 * 🔴 존재 이유는 내부 링크 구조다. 티커 페이지 109개가 허브 하나에만 매달려 있으면 토픽 클러스터가
 * 형성되지 않고, "커버드콜 ETF" 같은 **묶음 단위 검색어**를 받을 페이지가 없다.
 *
 * ⚠ 문구는 `TICKER_CATEGORY_META` 하나를 화면과 서버 렌더러(`server/handlers/TickerHtml`)가 **함께**
 * 읽는다. 두 벌로 나누면 크롤러가 읽는 문장과 화면이 다른 말을 한다.
 *
 * 모르는 카테고리는 허브로 보낸다 — 서버는 무치환 셸 200 을 주고 여기서 라우터가 판단한다
 * (없는 티커와 같은 처방).
 */
export default function TickerCategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const normalized = (categoryId ?? '').trim().toLowerCase();
  const valid = isTickerCategoryId(normalized);

  const entries = useMemo(() => (valid ? listTickerContentByCategory(normalized) : []), [normalized, valid]);
  const siblings = useMemo(
    () =>
      TICKER_CATEGORY_IDS.filter(
        (id) => id !== normalized && listTickerContentByCategory(id).length > 0
      ).map((id) => ({ id, label: TICKER_CATEGORY_LABEL[id], to: tickerCategoryPath(id) })),
    [normalized]
  );

  const meta = valid ? TICKER_CATEGORY_META[normalized] : undefined;

  useDocumentMeta({
    title: meta?.metaTitle ?? '',
    description: meta?.description ?? '',
    pathname: valid ? tickerCategoryPath(normalized) : '/ticker/all'
  });

  if (!valid || !meta) return <Navigate to="/ticker/all" replace />;

  return (
    <TickerPageShell>
      <TickerCategoryView
        label={TICKER_CATEGORY_LABEL[normalized]}
        meta={meta}
        entries={entries}
        siblings={siblings}
      />
    </TickerPageShell>
  );
}
