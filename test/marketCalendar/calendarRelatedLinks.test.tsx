import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from '@/router/routes';
import { MARKET_CALENDAR_COPY } from '@/pages/MarketCalendar/copy';
import { RelatedLinks } from '@/pages/MarketCalendar/components';
import { COMMUNITY_COPY } from '@/shared/constants/community';

/**
 * 미국 증시 캘린더의 "함께 보면 좋은 화면"(2026-11-07).
 *
 * 이 페이지는 검색 유입 1위 랜딩인데 사람이 보는 화면에 다른 화면으로 가는 길이 없었다
 * (28일 37세션 전부 신규, 세션당 1.9페이지). 잠그는 것: ① 길이 실제로 있고 내비와 같은 이름이다
 * ② 누르면 이동하고 계측이 불린다 ③ 모바일에서 닿는 자리(출처보다 앞)에 있다.
 */
const copy = MARKET_CALENDAR_COPY;
const nav = COMMUNITY_COPY.nav;

const renderPage = () =>
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/market/us-calendar'] })} />);

describe('캘린더 → 다른 화면으로 가는 길', () => {
  it('🔴 네 화면으로 가는 링크가 내비와 같은 이름으로 있다', async () => {
    renderPage();
    const region = await screen.findByRole('navigation', { name: copy.related.heading });

    const expected: [string, string][] = [
      [nav.dividendCalendar, '/dividend/calendar'],
      [nav.dividendKings, '/dividend/kings'],
      [nav.marketPulse, '/market/pulse'],
      [nav.simulator, '/simulator']
    ];
    for (const [name, href] of expected) {
      expect(within(region).getByRole('link', { name })).toHaveAttribute('href', href);
    }
  });

  it('🔴 출처보다 앞에 있다 — 맨 끝에 두면 모바일 방문자가 닿지 않는다', async () => {
    renderPage();
    const related = await screen.findByRole('heading', { name: copy.related.heading });
    const source = screen.getByRole('heading', { name: copy.source.heading });

    expect(related.compareDocumentPosition(source) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('누르면 그 화면으로 이동한다', async () => {
    const user = userEvent.setup();
    renderPage();
    const region = await screen.findByRole('navigation', { name: copy.related.heading });

    await user.click(within(region).getByRole('link', { name: nav.dividendKings }));

    expect(await screen.findByRole('heading', { level: 1, name: /배당킹/ })).toBeInTheDocument();
  });
});

describe('계측', () => {
  it('누른 카드의 목적지를 알린다', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <MemoryRouter>
        <RelatedLinks
          label="함께 보기"
          onNavigate={onNavigate}
          items={[
            { to: '/dividend/calendar', title: '배당 캘린더', description: '설명', glyph: <span /> },
            { to: '/simulator', title: '시뮬레이터', description: '설명', glyph: <span /> }
          ]}
        />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('link', { name: '시뮬레이터' }));

    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith('/simulator');
  });
});
