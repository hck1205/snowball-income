import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CongressView from '@/pages/Congress/CongressPage/CongressPage.view';
import { CONGRESS_TRADES } from '@/shared/constants/congressTrades';
import { buildCongressViewModel } from '@/pages/Congress/utils';
import { isComparableTicker } from '@/pages/Ticker/utils';

/**
 * 의원거래 화면 → 종목 비교로 넘기는 **연결**(기획서 연결①).
 *
 * 🔴 이 화면은 종전에 막다른 길이었다 — "펠로시가 무엇을 샀다"까지 보고 나면 다음에 할 게 없었다.
 * 여기서 잠그는 것은 모양이 아니라 **행동 하나**다: 표에서 종목을 고르면 비교로 갈 수 있다.
 *
 * ⚠ className·Emotion 내부 구현을 보지 않는다(.cursor/rules). 접근名·역할·보이는 글자만 본다.
 * ⚠ 선택은 sessionStorage 에 남는다 — 테스트마다 비우지 않으면 앞 테스트의 선택이 다음으로 샌다.
 */

const viewModel = buildCongressViewModel(CONGRESS_TRADES);

/** 표의 첫 줄 중 실제로 비교 가능한 종목. 스냅샷이 갱신돼도 이 테스트가 따라간다. */
const comparableTickers = viewModel.tickers.map((row) => row.ticker).filter(isComparableTicker);

const renderView = () =>
  render(
    <MemoryRouter>
      <CongressView viewModel={viewModel} />
    </MemoryRouter>
  );

beforeEach(() => {
  sessionStorage.clear();
});

describe('의원거래 → 종목 비교 연결', () => {
  it('종목 표의 각 줄에 비교 담기 체크박스가 있다', () => {
    renderView();
    expect(comparableTickers.length).toBeGreaterThan(0);
    expect(screen.getByRole('checkbox', { name: `${comparableTickers[0]} 비교에 담기` })).toBeEnabled();
  });

  it('한 종목만 고르면 아직 비교할 수 없다고 알린다', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole('checkbox', { name: `${comparableTickers[0]} 비교에 담기` }));

    const bar = screen.getByRole('region', { name: '비교할 종목 선택' });
    expect(within(bar).getByText('1개 더 고르면 비교할 수 있습니다')).toBeInTheDocument();
    expect(within(bar).queryByRole('link', { name: '비교하기 →' })).not.toBeInTheDocument();
  });

  it('두 종목을 고르면 그 조합을 실은 비교 링크가 나온다', async () => {
    const user = userEvent.setup();
    renderView();

    const [first, second] = comparableTickers;
    await user.click(screen.getByRole('checkbox', { name: `${first} 비교에 담기` }));
    await user.click(screen.getByRole('checkbox', { name: `${second} 비교에 담기` }));

    const link = screen.getByRole('link', { name: '비교하기 →' });
    const href = link.getAttribute('href') ?? '';
    expect(href.startsWith('/ticker/compare?')).toBe(true);

    const params = new URLSearchParams(href.slice(href.indexOf('?') + 1));
    expect(params.get('t')).toBe(`${first},${second}`);
    // 🔴 `from` 이 빠지면 어느 화면이 비교로 보내는지 영영 알 수 없다 — 측정이 이 연결의 목적 절반이다.
    expect(params.get('from')).toBe('congress');
  });

  it('고른 종목을 다시 누르면 선택이 풀린다', async () => {
    const user = userEvent.setup();
    renderView();

    const checkbox = screen.getByRole('checkbox', { name: `${comparableTickers[0]} 비교에 담기` });
    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
    // 선택이 비면 하단 바 자체가 사라진다(빈 바를 띄워 두지 않는다).
    expect(screen.queryByRole('region', { name: '비교할 종목 선택' })).not.toBeInTheDocument();
  });

  it('전체 해제를 누르면 하단 바가 사라진다', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole('checkbox', { name: `${comparableTickers[0]} 비교에 담기` }));
    await user.click(screen.getByRole('button', { name: '전체 해제' }));

    expect(screen.queryByRole('region', { name: '비교할 종목 선택' })).not.toBeInTheDocument();
  });

  it('비교 자료가 없는 종목은 체크박스가 꺼져 있다', () => {
    const blocked = viewModel.tickers.map((row) => row.ticker).find((ticker) => !isComparableTicker(ticker));
    if (!blocked) return; // 스냅샷 상위 20종이 모두 비교 가능한 날에는 검증할 대상이 없다.

    renderView();
    /*
     * 🔴 숨기지 않고 **끈다**. 안 그리면 표의 첫 열이 들쭉날쭉해지고, 왜 어떤 줄만 고를 수 있는지
     *    화면이 답하지 못한다.
     */
    expect(screen.getByRole('checkbox', { name: `${blocked} 비교에 담기` })).toBeDisabled();
  });
});
