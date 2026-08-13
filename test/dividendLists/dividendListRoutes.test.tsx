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

  it('🔴 위키피디아를 쓰는 목록은 CC BY-SA 4.0 고지를 화면에 둔다 — 링크만으로는 라이선스 의무를 못 지킨다', async () => {
    renderAt(dividendListPath('aristocrats'));
    // 문장 뒤에 라이선스 링크가 붙어 텍스트가 여러 노드로 갈린다 — 정규식이 아니라 포함 검사로 잡는다.
    expect(
      await screen.findByText((_, element) =>
        (element?.textContent ?? '').startsWith(DIVIDEND_LIST_COPY.page.wikipediaLicenseNote)
      )
    ).toBeInTheDocument();
    const license = await screen.findByRole('link', { name: DIVIDEND_LIST_COPY.page.wikipediaLicenseLinkLabel });
    expect(license).toHaveAttribute('href', DIVIDEND_LIST_COPY.page.wikipediaLicenseUrl);
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
    // 🔴 맨 앞 열은 비교 담기(정렬 축이 아니다)라, 인덱스가 아니라 **이름**으로 티커 헤더를 집는다.
    const tickerHeaderName = new RegExp(DIVIDEND_LIST_COPY.page.columnTicker);
    const tickerHeader = () => within(table).getByRole('columnheader', { name: tickerHeaderName });
    expect(tickerHeader()).toHaveAttribute('aria-sort', 'ascending');

    await user.click(within(tickerHeader()).getByRole('button'));

    expect(tickerHeader()).toHaveAttribute('aria-sort', 'descending');
    expect(firstTickerOf()).not.toBe(ascending);
  });

  it('섹터 칩으로 좁히면 표가 그 섹터만 남긴다', async () => {
    const user = userEvent.setup();
    renderAt(dividendListPath('kings'));

    const table = await screen.findByRole('table');
    const total = within(table).getAllByRole('row').length - 1;

    const group = await screen.findByRole('group', { name: DIVIDEND_LIST_COPY.page.columnSector });
    // 전체 칩 다음의 첫 섹터 칩 = 종목이 가장 많은 섹터.
    const [, firstSectorChip] = within(group).getAllByRole('button');
    await user.click(firstSectorChip);

    const filtered = within(await screen.findByRole('table')).getAllByRole('row').length - 1;
    expect(filtered).toBeGreaterThan(0);
    expect(filtered).toBeLessThan(total);
  });

  /**
   * 🔴 세 축(배당률·5년 배당성장·섹터)이 **동시에** 걸린다는 계약. 축을 바꿀 때 앞 축이 풀리면
   * 사용자는 조합을 만들 수 없고, 이 화면의 존재 이유가 사라진다.
   */
  it('배당률·성장·섹터를 겹쳐 걸 수 있고, 걸린 조건이 글자로도 남는다', async () => {
    const user = userEvent.setup();
    const copy = DIVIDEND_LIST_COPY.page;
    renderAt(dividendListPath('aristocrats'));

    const bodyRows = async () =>
      within(await screen.findByRole('table')).getAllByRole('row').length - 1;
    const total = await bodyRows();

    const yieldGroup = await screen.findByRole('group', { name: copy.columnYield });
    await user.click(within(yieldGroup).getByRole('button', { name: `3${copy.filterAtLeastSuffix}` }));
    const afterYield = await bodyRows();
    expect(afterYield).toBeLessThan(total);

    const growthGroup = await screen.findByRole('group', { name: copy.columnGrowth });
    await user.click(within(growthGroup).getByRole('button', { name: `5${copy.filterAtLeastSuffix}` }));
    const afterBoth = await bodyRows();
    // 두 번째 축이 첫 축을 대체하지 않는다 — 더 좁아지거나 같아야 한다.
    expect(afterBoth).toBeLessThanOrEqual(afterYield);
    expect(afterBoth).toBeGreaterThan(0);

    /* 🔴 상태가 색 단독 채널이 아니다 — "적용 중" 줄이 두 조건을 문장으로 다시 쓴다. */
    expect(
      screen.getByText(
        `${copy.columnYield} 3${copy.filterAtLeastSuffix}${copy.filterAxisSeparator}${copy.columnGrowth} 5${copy.filterAtLeastSuffix}`
      )
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: copy.filterReset }));
    expect(await bodyRows()).toBe(total);
  });

  /**
   * 0건이 되는 조합은 실제로 있다. 실측(2026-08-04 스냅샷): 배당률 4% 이상 + 5년 배당성장 8% 이상은
   * 세 목록 모두 0종이다(킹 y4g5=1 · y4g8=0). 그때 화면이 죽지 않고 **되돌아갈 길**이 남아야 한다.
   * ⚠ 데이터를 갱신해 이 조합이 더 이상 0 이 아니게 되면 다른 칸을 골라라 — 잠그는 것은 특정 숫자가
   *   아니라 "빈 결과에도 안내와 해제가 있다"는 계약이다.
   */
  it('결과가 0건이어도 안내와 해제가 남는다', async () => {
    const user = userEvent.setup();
    const copy = DIVIDEND_LIST_COPY.page;
    renderAt(dividendListPath('kings'));

    const yieldGroup = await screen.findByRole('group', { name: copy.columnYield });
    await user.click(within(yieldGroup).getByRole('button', { name: `4${copy.filterAtLeastSuffix}` }));
    const growthGroup = await screen.findByRole('group', { name: copy.columnGrowth });
    await user.click(within(growthGroup).getByRole('button', { name: `8${copy.filterAtLeastSuffix}` }));

    const table = await screen.findByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(2); // 머리 + 안내 한 줄
    expect(within(table).getByText(copy.filteredEmpty)).toBeInTheDocument();

    const reset = screen.getByRole('button', { name: copy.filterReset });
    await user.click(reset);
    expect(within(await screen.findByRole('table')).getAllByRole('row').length - 1).toBe(
      DIVIDEND_LISTS.kings.members.length
    );
  });
});
