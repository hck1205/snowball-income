import { beforeAll, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from '@/router/routes';
import { COMMUNITY_COPY } from '@/shared/constants/community';

/**
 * `/sitemap` 은 **사람이 훑는 사이트 색인 페이지**를 그린다 — 404 로 떨어지지 않는다.
 *
 * 이 가드가 필요한 이유: 이 주소는 이전엔 catch-all(`*`)에 걸려 404 를 냈다(사용자가 실제로 그
 * 화면을 봤다). 라우트를 되돌리거나 지우면 다시 조용히 404 가 되는데, 그건 오류로 드러나지 않는다.
 * 판정은 렌더 결과로 한다: 사이트맵 제목과 섹션이 보이고, 404 제목이 보이지 않는다.
 */

const nav = COMMUNITY_COPY.nav;
const NOT_FOUND_TITLE = '요청하신 페이지를 찾을 수 없습니다';

beforeAll(async () => {
  // lazy 라우트의 첫 변환 비용을 대기 창 밖으로 뺀다(병렬 실행 플레이크 방지).
  await import('@/pages/Sitemap');
});

const renderAt = (path: string) => {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
};

describe('/sitemap 라우트', () => {
  it('사이트맵 페이지를 그린다 (404 로 떨어지지 않는다)', async () => {
    renderAt('/sitemap');

    expect(await screen.findByRole('heading', { level: 1, name: '사이트맵' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1, name: NOT_FOUND_TITLE })).not.toBeInTheDocument();
  });

  it('전역 nav 의 묶음을 섹션으로 보여 준다', async () => {
    renderAt('/sitemap');
    await screen.findByRole('heading', { level: 1, name: '사이트맵' });

    // nav 정본에서 온 묶음 이름들이 섹션 제목으로 선다 (nav 한 칸 = 여기 한 장).
    expect(screen.getByRole('heading', { level: 2, name: nav.personalGroup })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: nav.portfolioGroup })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: nav.dividendListGroup })).toBeInTheDocument();
  });

  it('정책 섹션에 개인정보처리방침·이용약관 링크가 있다', async () => {
    renderAt('/sitemap');
    await screen.findByRole('heading', { level: 1, name: '사이트맵' });

    // 🔴 같은 링크가 푸터에도 있다 — 사이트맵의 '정책' 섹션(region)으로 좁혀서 본다.
    const policies = within(screen.getByRole('region', { name: '정책' }));
    expect(policies.getByRole('link', { name: '개인정보처리방침' })).toHaveAttribute('href', '/privacy');
    expect(policies.getByRole('link', { name: '이용약관' })).toHaveAttribute('href', '/terms');
  });

  it('주소가 그대로 남는다', async () => {
    const router = renderAt('/sitemap');
    await screen.findByRole('heading', { level: 1, name: '사이트맵' });

    expect(router.state.location.pathname).toBe('/sitemap');
  });
});
