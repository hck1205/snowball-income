import { beforeAll, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from '@/router/routes';
import { PORTFOLIO_COPY } from '@/pages/Portfolio/copy';
import { COMMUNITY_COPY } from '@/shared/constants/community';

/**
 * 라우트 + 전역 nav 배선.
 *
 * `/dividend/portfolio` 가 실제 라우터에 붙어 있는지, 그리고 그 경로에서 **활성 표시가 정확히 하나**인지
 * 본다(형제 세그먼트끼리 서로를 활성화하면 사용자는 자기가 어디 있는지 알 수 없다 —
 * `end` 누락/과잉이 조용히 만드는 회귀다).
 */

beforeAll(async () => {
  // lazy 라우트는 첫 변환 비용이 크다 — 대기 창 밖에서 미리 데워 전체 스위트 병렬 실행의 플레이크를 막는다.
  await import('@/pages/Portfolio/PortfolioPage');
});

const renderAt = (path: string) => {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
};

describe('/dividend/portfolio 라우트', () => {
  it('경로로 진입하면 내 포트폴리오 페이지가 열린다', async () => {
    renderAt('/dividend/portfolio');

    expect(await screen.findByRole('heading', { level: 1, name: PORTFOLIO_COPY.hero.title })).toBeInTheDocument();
  });

  it('전역 nav 의 활성 항목은 정확히 하나이고 "내 포트폴리오"다', async () => {
    renderAt('/dividend/portfolio');
    await screen.findByRole('heading', { level: 1, name: PORTFOLIO_COPY.hero.title });

    const active = screen.getAllByRole('link').filter((link) => link.getAttribute('aria-current') === 'page');

    expect(active).toHaveLength(1);
    expect(active[0]).toHaveAttribute('aria-label', COMMUNITY_COPY.nav.myPortfolio);
  });

  it('형제 화면(배당 캘린더)에서는 내 포트폴리오가 활성이 아니다', async () => {
    renderAt('/dividend/calendar');

    const calendarNav = await screen.findByRole('link', { name: COMMUNITY_COPY.nav.dividendCalendar });
    expect(calendarNav).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: COMMUNITY_COPY.nav.myPortfolio })).not.toHaveAttribute('aria-current');
  });

  /*
   * 구 목표 달성 페이지는 `/dividend/portfolio` 의 목표 카드로 흡수됐다. 프로덕션에 나간 적이 없는
   * 경로라 **리다이렉트를 만들지 않는다** — 남기면 죽은 라우트가 영구히 유지된다.
   */
  it('구 /dividend/goal 라우트는 남아 있지 않다 (리다이렉트도 만들지 않는다)', () => {
    const paths = routes.flatMap((route) => (route.children ?? []).map((child) => child.path));

    expect(paths).not.toContain('/dividend/goal');
  });
});
