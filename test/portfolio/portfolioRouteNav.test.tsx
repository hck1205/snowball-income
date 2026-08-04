import { beforeAll, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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

  /**
   * 🔴 이 항목은 2026-08-02 부터 **포트폴리오 묶음 메뉴 안**에 있다 — 윗줄에 링크로 서 있지 않다.
   * 그래서 접힌 상태의 신호는 트리거의 `aria-current="true"` 가 지고, 펼쳐야 링크가 나타난다.
   */
  it('전역 nav 에서 활성인 것은 포트폴리오 묶음 하나뿐이다', async () => {
    renderAt('/dividend/portfolio');
    await screen.findByRole('heading', { level: 1, name: PORTFOLIO_COPY.hero.title });

    // 접힌 상태: 윗줄 링크 중 활성인 것은 없고, 묶음 트리거가 현재 위치를 말한다.
    const activeLinks = screen.getAllByRole('link').filter((link) => link.getAttribute('aria-current') === 'page');
    expect(activeLinks).toHaveLength(0);

    const trigger = screen.getByRole('button', { name: new RegExp(COMMUNITY_COPY.nav.portfolioGroup) });
    expect(trigger).toHaveAttribute('aria-current', 'true');

    // 펼치면 그 안에서 활성은 정확히 하나다 — 형제끼리 서로를 활성화하지 않는다.
    fireEvent.click(trigger);
    const activeInMenu = screen.getAllByRole('link').filter((link) => link.getAttribute('aria-current') === 'page');
    expect(activeInMenu).toHaveLength(1);
    expect(activeInMenu[0]).toHaveAccessibleName(COMMUNITY_COPY.nav.myPortfolio);
  });

  it('형제 화면(배당 캘린더)에서는 포트폴리오 묶음이 활성이 아니다', async () => {
    renderAt('/dividend/calendar');

    /* ⚠ 배당 캘린더는 2026-08-04 부터 **캘린더 묶음 안**이다 — 링크를 보려면 먼저 펼쳐야 한다.
       접힌 트리거가 "이 묶음 안에 있다"를 말하는지도 함께 본다. */
    const calendarTrigger = await screen.findByRole('button', {
      name: new RegExp(`^${COMMUNITY_COPY.nav.calendarGroup}`)
    });
    expect(calendarTrigger).toHaveAttribute('aria-current', 'true');
    fireEvent.click(calendarTrigger);

    expect(screen.getByRole('link', { name: COMMUNITY_COPY.nav.dividendCalendar })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(
      screen.getByRole('button', { name: new RegExp(COMMUNITY_COPY.nav.portfolioGroup) })
    ).not.toHaveAttribute('aria-current');
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
