import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from '@/router/routes';
import { DIVIDEND_LIST_HUB_PATH, DIVIDEND_LIST_IDS, DIVIDEND_LISTS, dividendListPath } from '@/shared/constants/dividendLists';
import { DIVIDEND_LIST_COPY } from '@/pages/DividendList/copy';

/**
 * `/dividend/lists` 허브 + 목록 3종의 **라우트 계약**.
 *
 * 잠그는 것 넷:
 *  ① 네 주소가 실제로 열린다(404 로 가지 않는다).
 *  ② 표가 **정렬된다** — 열 제목을 누르면 순서가 바뀌고 `aria-sort` 가 그 사실을 말한다.
 *  ③ 🔴 **출처와 기준일이 화면에 있다.** 이 기능의 전제라, 빠지면 목록이 "지금 기준"으로 읽힌다.
 *  ④ 연속 증배 연수를 종목마다 적지 않는 이유가 화면에 남아 있다(지우면 사용자는 우리가 빠뜨렸다고 읽는다).
 *
 * ⚠ 라우트는 `React.lazy` 라 `findBy*` 로 기다린다.
 */
const renderAt = (path: string) => {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
};

describe('배당 목록 라우트', () => {
  it('허브가 열리고 세 목록을 전부 가리킨다', async () => {
    renderAt(DIVIDEND_LIST_HUB_PATH);

    expect(
      await screen.findByRole('heading', { level: 1, name: DIVIDEND_LIST_COPY.hub.hero.title })
    ).toBeInTheDocument();

    for (const id of DIVIDEND_LIST_IDS) {
      const links = await screen.findAllByRole('link', {
        name: new RegExp(DIVIDEND_LIST_COPY.lists[id].title)
      });
      expect(links.some((link) => link.getAttribute('href') === dividendListPath(id))).toBe(true);
    }
  });

  it.each(DIVIDEND_LIST_IDS)('/dividend/%s 가 열리고 목록의 모든 종목을 그린다', async (id) => {
    renderAt(dividendListPath(id));

    expect(
      await screen.findByRole('heading', { level: 1, name: DIVIDEND_LIST_COPY.lists[id].title })
    ).toBeInTheDocument();

    const table = await screen.findByRole('table');
    // 헤더 1행 + 종목 N행. 개수를 세면 "일부만 그려도 통과"하는 뮤턴트가 잡힌다.
    expect(within(table).getAllByRole('row')).toHaveLength(DIVIDEND_LISTS[id].members.length + 1);
  });

  it('🔴 출처·기준일·수록 종목 수가 화면에 있다', async () => {
    renderAt(dividendListPath('aristocrats'));
    const list = DIVIDEND_LISTS.aristocrats;

    // 기준일은 여러 곳(히어로 근거 · 표 caption)에 나온다 — 최소 한 번은 있어야 한다.
    expect((await screen.findAllByText(new RegExp(list.asOf))).length).toBeGreaterThan(0);

    for (const source of list.sources) {
      const link = await screen.findByRole('link', { name: source.label });
      expect(link).toHaveAttribute('href', source.url);
      // 외부 출처에 우리 색인 신호를 넘겨주지 않는다.
      expect(link.getAttribute('rel')).toContain('nofollow');
    }

    // 수록 종목 수는 히어로의 근거 줄에 있다 — "몇 종목인가"가 목록의 규모를 말한다.
    const countText = `${DIVIDEND_LIST_COPY.page.countLabel} ${list.members.length}${DIVIDEND_LIST_COPY.page.countUnit}`;
    expect((await screen.findAllByText(new RegExp(countText))).length).toBeGreaterThan(0);
  });

  it('연속 증배 연수를 적지 않는 이유가 화면에 있다', async () => {
    renderAt(dividendListPath('kings'));
    expect(
      await screen.findByRole('heading', { name: DIVIDEND_LIST_COPY.page.streakHeading })
    ).toBeInTheDocument();
  });

  it('표가 정렬된다 — 티커 열을 누르면 순서가 뒤집히고 aria-sort 가 따라온다', async () => {
    const user = userEvent.setup();
    renderAt(dividendListPath('kings'));

    const table = await screen.findByRole('table');
    const firstTickerOf = () => within(table).getAllByRole('row')[1].textContent ?? '';

    const ascending = firstTickerOf();
    const tickerHeader = within(table).getAllByRole('columnheader')[0];
    expect(tickerHeader).toHaveAttribute('aria-sort', 'ascending');

    await user.click(within(tickerHeader).getByRole('button'));

    expect(within(table).getAllByRole('columnheader')[0]).toHaveAttribute('aria-sort', 'descending');
    expect(firstTickerOf()).not.toBe(ascending);
  });

  it('섹터 칩으로 좁히면 표가 그 섹터만 남긴다', async () => {
    const user = userEvent.setup();
    renderAt(dividendListPath('kings'));

    const table = await screen.findByRole('table');
    const total = within(table).getAllByRole('row').length - 1;

    const group = await screen.findByRole('group', { name: DIVIDEND_LIST_COPY.page.sectorFilterLabel });
    // 전체 칩 다음의 첫 섹터 칩 = 종목이 가장 많은 섹터.
    const [, firstSectorChip] = within(group).getAllByRole('button');
    await user.click(firstSectorChip);

    const filtered = within(await screen.findByRole('table')).getAllByRole('row').length - 1;
    expect(filtered).toBeGreaterThan(0);
    expect(filtered).toBeLessThan(total);
  });
});
