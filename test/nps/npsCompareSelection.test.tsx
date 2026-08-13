import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import NpsView from '@/pages/Nps/NpsPage/NpsPage.view';
import { buildNpsViewModel } from '@/pages/Nps/utils';
import { tickerForCusip } from '@/shared/constants/investors/cusipToTicker';

/**
 * 국민연금 화면 → 종목 비교 연결(기획서 연결①).
 *
 * 🔴 이 화면이 다른 유입 화면과 다른 점 하나: 13F 공시는 **티커를 주지 않고 CUSIP 만 준다.**
 * 그래서 두 가지 "못 담음"이 존재하고, 화면은 그 둘을 **다르게** 말해야 한다.
 *   - 티커를 아는 줄  → 체크박스
 *   - 변환표에 없는 줄 → `—` (비교 불가가 아니라 **우리가 모른다**)
 * 이 구분이 무너지면 화면이 아는 것보다 많이 말하게 된다.
 */

const viewModel = buildNpsViewModel();

const rows = viewModel.holdings.map((row) => ({ ...row, ticker: tickerForCusip(row.cusip) }));
const mapped = rows.filter((row) => row.ticker !== null);
const unmapped = rows.filter((row) => row.ticker === null);

const renderView = () =>
  render(
    <MemoryRouter>
      <NpsView viewModel={viewModel} />
    </MemoryRouter>
  );

beforeEach(() => {
  sessionStorage.clear();
});

describe('국민연금 → 종목 비교 연결', () => {
  it('티커를 아는 종목에는 체크박스가 있다', () => {
    expect(mapped.length).toBeGreaterThan(0);
    renderView();

    expect(screen.getByRole('checkbox', { name: `${mapped[0].ticker} 비교에 담기` })).toBeEnabled();
  });

  it('CUSIP 을 티커로 바꾸지 못한 종목에는 체크박스를 두지 않는다', () => {
    if (unmapped.length === 0) return; // 변환표가 이 스냅샷을 전부 덮는 날에는 검증 대상이 없다.
    renderView();

    /*
     * 🔴 꺼진 체크박스가 아니라 `—` 다. 꺼진 체크박스는 "이 종목은 비교 대상이 아니다"로 읽히는데,
     *    우리가 아는 것은 "이 번호가 어느 종목인지 모른다"까지다.
     */
    const marks = screen.getAllByTitle(/티커를 확인하지 못한 종목/);
    expect(marks).toHaveLength(unmapped.length);
  });

  it('두 종목을 고르면 그 조합을 실은 비교 링크가 나온다', async () => {
    const user = userEvent.setup();
    renderView();

    const [first, second] = mapped;
    await user.click(screen.getByRole('checkbox', { name: `${first.ticker} 비교에 담기` }));
    await user.click(screen.getByRole('checkbox', { name: `${second.ticker} 비교에 담기` }));

    const href = screen.getByRole('link', { name: '비교하기 →' }).getAttribute('href') ?? '';
    const params = new URLSearchParams(href.slice(href.indexOf('?') + 1));
    expect(params.get('t')).toBe(`${first.ticker},${second.ticker}`);
    expect(params.get('from')).toBe('nps');
  });

  it('신규·청산 표에는 담기를 붙이지 않는다', () => {
    renderView();

    /* 그 표는 "이번 분기에 무슨 일이 있었나"를 읽는 자리라 종목을 담는 동작이 문맥에 맞지 않는다. */
    const movesHeading = screen.getByRole('heading', { name: /달라진 것|변동|신규/ });
    const movesSection = movesHeading.closest('section');
    if (movesSection) {
      expect(within(movesSection).queryAllByRole('checkbox')).toHaveLength(0);
    }
  });
});
