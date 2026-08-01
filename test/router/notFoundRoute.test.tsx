import { beforeAll, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from '@/router/routes';
import { PORTFOLIO_COPY } from '@/pages/Portfolio/copy';

/**
 * **`*` 는 404 를 그린다 — 홈으로 튕기지 않는다.**
 *
 * 이 가드가 필요한 이유: 되돌리는 변경이 **한 줄**이다(`element` 를 `<Navigate to="/">` 로).
 * 그러면 모든 잘못된 주소가 "메인이 정상적으로 떴다"로 보이고 전 스위트가 그린인 채로 통과한다
 * (실제로 2026-07-31 이전이 그 상태였고, 그때 이 계약을 잠그던 테스트는 **반대 방향**을 잠그고 있었다).
 *
 * 판정은 **렌더 결과**로 한다: 404 제목이 보이고, 시뮬레이터의 랜딩 표지가 보이지 않는다.
 * 라우트 객체의 모양(`element.props.to`)만 보는 검사는 `test/community/routes.test.ts` 가 맡는다 —
 * 두 층을 함께 둬야 "리다이렉트를 다른 방식으로 되살리는" 우회까지 잡힌다.
 */

beforeAll(async () => {
  // lazy 라우트의 첫 변환 비용을 대기 창 밖으로 뺀다(전체 스위트 병렬 실행의 플레이크 방지).
  await import('@/pages/NotFound');
  await import('@/pages/Portfolio/PortfolioPage');
});

const renderAt = (path: string) => {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);

  return router;
};

const NOT_FOUND_TITLE = '요청하신 페이지를 찾을 수 없습니다';

describe('알 수 없는 주소 (`*`)', () => {
  it('404 화면을 그린다', async () => {
    renderAt('/does-not-exist');

    expect(await screen.findByRole('heading', { level: 1, name: NOT_FOUND_TITLE })).toBeInTheDocument();
  });

  it('홈으로 리다이렉트하지 않는다 — 주소가 그대로 남는다', async () => {
    const router = renderAt('/does-not-exist');
    await screen.findByRole('heading', { level: 1, name: NOT_FOUND_TITLE });

    expect(router.state.location.pathname).toBe('/does-not-exist');
  });

  it('요청한 주소를 화면에 그대로 보여 준다', async () => {
    renderAt('/typo/여기없음');
    await screen.findByRole('heading', { level: 1, name: NOT_FOUND_TITLE });

    expect(screen.getByText('/typo/여기없음')).toBeInTheDocument();
  });

  it('갈 곳 3개(시뮬레이터·내 포트폴리오·종목 둘러보기)를 링크로 준다', async () => {
    renderAt('/does-not-exist');
    await screen.findByRole('heading', { level: 1, name: NOT_FOUND_TITLE });

    // 상단 내비도 같은 이름의 링크를 갖는다 — 길 안내 구역(region)으로 좁혀서 본다.
    const guide = within(screen.getByRole('region', { name: '이곳으로 이동하실 수 있습니다' }));

    expect(guide.getByRole('link', { name: /배당 시뮬레이터/ })).toHaveAttribute('href', '/simulator');
    expect(guide.getByRole('link', { name: /내 포트폴리오/ })).toHaveAttribute('href', '/dividend/portfolio');
    expect(guide.getByRole('link', { name: /종목 둘러보기/ })).toHaveAttribute('href', '/ticker/all');
  });

  it('색인에서 뺀다 — 머무는 동안 robots 가 noindex 다', async () => {
    // index.html 의 기본값(index, follow)을 테스트 문서에 재현한다.
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'index, follow';
    document.head.appendChild(meta);

    try {
      const { unmount } = (() => {
        const router = createMemoryRouter(routes, { initialEntries: ['/does-not-exist'] });
        return render(<RouterProvider router={router} />);
      })();

      await screen.findByRole('heading', { level: 1, name: NOT_FOUND_TITLE });
      expect(meta.content).toBe('noindex, follow');

      // 다른 화면으로 넘어가면 원래 값으로 돌아온다 — 404 한 번이 앱 전체를 색인 제외로 만들면 안 된다.
      unmount();
      expect(meta.content).toBe('index, follow');
    } finally {
      meta.remove();
    }
  });

  it('기존 라우트는 그대로 매칭된다 (catch-all 이 삼키지 않는다)', async () => {
    renderAt('/dividend/portfolio');

    expect(
      await screen.findByRole('heading', { level: 1, name: PORTFOLIO_COPY.hero.title })
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1, name: NOT_FOUND_TITLE })).not.toBeInTheDocument();
  });
});
