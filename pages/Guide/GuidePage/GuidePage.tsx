import { useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { TickerPageShell } from '@/pages/Ticker/components';
import { useDocumentMeta } from '@/pages/Ticker/hooks';
import { findGuide, guidePath } from '@/shared/constants/guides';
import { TICKER_HUB_PATH } from '@/shared/constants/tickerPages';
import GuideView from './GuidePage.view';
import { buildGuideViewModel } from './GuidePage.utils';

/**
 * `/guide/:slug` — **검색어 랜딩** 한 편(2026-08-06 신설).
 *
 * ## 왜 이 화면이 있나
 * 이 앱의 화면 이름은 우리 언어("배당 시뮬레이터")이고, 사람은 자기 언어로 검색한다("배당금 계산기",
 * "월 배당 100만원"). 그 간극이 유입의 병목이라 진단됐다(`docs/site-assessment-2026-08-06.md` P0-③).
 * 이 화면은 그 검색어에 **끝까지 답하고** 마지막에 도구로 넘긴다.
 *
 * ## 구조
 * 🔴 **공통 셸(`TickerPageShell`) 안에 산다.** 2026-08-06 리워크 전까지 이 다섯 편만 셸 밖에 있어
 * **앱 헤더가 통째로 없었다** — 워드마크도 메뉴도 로그인도 없이 본문만 떠 있었고, 본문 폭도 앱
 * 공통 1200px 계약 밖이었다. 검색으로 들어온 사람에게 이 사이트의 나머지로 가는 길이 아예 없던 셈이라,
 * "다른 페이지만큼 정돈되지 않았다"는 지적의 가장 큰 몫이 여기였다.
 * 🔴 콘텐츠는 전부 `shared/constants/guides/` 에 있다. 이 컨테이너는 **슬러그를 해석하고 문서 메타를
 * 세우는 일만** 한다 — 가이드를 더 쓸 때 이 파일을 건드릴 일이 없어야 한다(티커 페이지와 같은 규율).
 * 🔴 조판은 `GuidePage.view.tsx`, 파생값은 `GuidePage.utils.ts` 가 갖는다.
 * ⚠ 서버가 그리는 크롤러 HTML(`server/handlers/GuideHtml`)이 **같은 콘텐츠**를 읽는다 — 두 표면이
 *   같은 데이터를 보므로 문장이 갈릴 수 없다.
 */
export default function GuidePage() {
  const { slug } = useParams<{ slug: string }>();
  const guide = slug ? findGuide(slug) : undefined;

  const viewModel = useMemo(() => (guide ? buildGuideViewModel(guide) : null), [guide]);

  useDocumentMeta({
    title: guide?.metaTitle ?? '',
    description: guide?.metaDescription ?? '',
    pathname: guide ? guidePath(guide.slug) : TICKER_HUB_PATH
  });

  /* 모르는 슬러그는 티커 허브로 — 404 를 새로 만들지 않는다(가이드는 그 허브의 이웃이다). */
  if (!viewModel) return <Navigate to={TICKER_HUB_PATH} replace />;

  return (
    <TickerPageShell>
      <GuideView viewModel={viewModel} />
    </TickerPageShell>
  );
}
