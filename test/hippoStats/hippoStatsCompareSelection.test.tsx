import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import HippoStatsView from '@/pages/HippoStats/HippoStatsPage/HippoStatsPage.view';
import { topComparableGuruHoldings, topComparableTradeTickers } from '@/pages/HippoStats/utils';

/**
 * 히포 통계 화면 → 종목 비교 연결(기획서 연결①).
 *
 * 🔴 이 화면은 다른 유입 화면과 다르다: **표가 아니라 도넛뿐이라 체크박스를 걸 행이 없다.**
 * 그래서 대가 보유 종목 중 **비교 표에 담을 수 있는 것**만 따로 목록으로 세운다(도넛 앞자리의
 * 무배당 대형주는 담아도 빈 비교가 열린다). 이 목록이 있어야 대가 보유 → 비교 → 시뮬레이터가 이어진다.
 *
 * 🔴 그 목록은 본문이 아니라 **드로어**에 있다(2026-08-14). 절 제목 옆 버튼이 연다 — 본문에
 * 펼쳐 두면 도넛 넷을 이어 보는 스크롤을 목록이 갈랐다. 그래서 이 테스트는 **버튼을 먼저 누른다.**
 *
 * 🔴 지표 상태(`state`)와 무관하게 대가 보유는 커밋된 스냅샷이라 항상 그려진다 — 그래서
 * `status: 'loading'` 으로 렌더해도 이 목록은 나온다.
 */

const comparable = topComparableGuruHoldings();
const tradable = topComparableTradeTickers();

const renderView = () =>
  render(
    <MemoryRouter>
      <HippoStatsView state={{ status: 'loading' }} onReload={() => {}} />
    </MemoryRouter>
  );

/**
 * 절 제목 옆의 여는 버튼. 🔴 두 절의 버튼은 **보이는 글자가 같고 접근성 이름만 다르다** —
 * 역할+이름으로 집어야 어느 절의 서랍을 여는지가 테스트에서도 분명하다.
 */
const GURU_PICKER = '대가 보유 종목에서 비교할 종목 고르기';
const TRADE_PICKER = '공시된 거래 종목에서 비교할 종목 고르기';

const openPicker = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  const button = screen.getByRole('button', { name });
  await user.click(button);
  return button;
};

beforeEach(() => {
  sessionStorage.clear();
});

describe('히포 통계 → 종목 비교 연결', () => {
  it('두 절 모두 제목 옆 버튼이 목록 서랍을 연다', async () => {
    expect(comparable.length).toBeGreaterThan(0);
    expect(tradable.length).toBeGreaterThan(0);
    const user = userEvent.setup();
    renderView();

    const guruButton = screen.getByRole('button', { name: GURU_PICKER });
    const tradeButton = screen.getByRole('button', { name: TRADE_PICKER });
    expect(guruButton).toHaveAttribute('aria-expanded', 'false');
    expect(tradeButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(guruButton);
    expect(guruButton).toHaveAttribute('aria-expanded', 'true');

    /* 🔴 한 번에 하나만 열린다 — 두 패널이 같은 층에 겹치면 뒤엣것이 앞엣것을 가린다. */
    await user.click(tradeButton);
    expect(tradeButton).toHaveAttribute('aria-expanded', 'true');
    expect(guruButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('비교할 수 있는 대가 보유 종목에 체크박스가 있다', async () => {
    const user = userEvent.setup();
    renderView();
    await openPicker(user, GURU_PICKER);

    expect(screen.getByRole('checkbox', { name: `${comparable[0].ticker} 비교에 담기` })).toBeEnabled();
  });

  it('두 종목을 고르면 그 조합을 실은 비교 링크가 나온다 (from=stats)', async () => {
    const user = userEvent.setup();
    renderView();
    await openPicker(user, GURU_PICKER);

    const [first, second] = comparable;
    await user.click(screen.getByRole('checkbox', { name: `${first.ticker} 비교에 담기` }));
    await user.click(screen.getByRole('checkbox', { name: `${second.ticker} 비교에 담기` }));

    const href = screen.getByRole('link', { name: '비교하기 →' }).getAttribute('href') ?? '';
    const params = new URLSearchParams(href.slice(href.indexOf('?') + 1));
    expect(params.get('t')).toBe(`${first.ticker},${second.ticker}`);
    expect(params.get('from')).toBe('stats');
  });

  it('공시된 거래 절의 서랍에서도 같은 선택에 담긴다', async () => {
    const user = userEvent.setup();
    renderView();
    await openPicker(user, TRADE_PICKER);

    const [first, second] = tradable;
    await user.click(screen.getByRole('checkbox', { name: `${first.ticker} 비교에 담기` }));
    await user.click(screen.getByRole('checkbox', { name: `${second.ticker} 비교에 담기` }));

    const href = screen.getByRole('link', { name: '비교하기 →' }).getAttribute('href') ?? '';
    const params = new URLSearchParams(href.slice(href.indexOf('?') + 1));
    expect(params.get('t')).toBe(`${first.ticker},${second.ticker}`);
    expect(params.get('from')).toBe('stats');
  });
});
