import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PortfolioPage from '@/pages/Portfolio/PortfolioPage';
import { PORTFOLIO_COPY } from '@/pages/Portfolio/copy';

/**
 * 상태 E — **저장소를 읽지 못한 화면**.
 *
 * 이 파일은 일부러 `fake-indexeddb/auto` 를 import 하지 않는다. jsdom 에는 indexedDB 가 없으므로
 * 그것만으로 "저장소 접근 불가" 환경이 그대로 재현된다(프라이빗 모드·차단된 브라우저와 같은 경로).
 *
 * 여기서 지키는 계약: **조용히 빈 목록으로 넘어가지 않는다.** 사용자가 직접 친 수량이 저장되지 않는
 * 상태라 배너로 알리고, 그래도 화면은 계속 쓸 수 있어야 한다(입력은 되되 저장만 안 된다).
 */

const copy = PORTFOLIO_COPY;
const NOW = new Date(2026, 6, 27);

const renderPage = async () => {
  render(
    <MemoryRouter>
      <PortfolioPage now={NOW} />
    </MemoryRouter>
  );

  await screen.findByRole('heading', { level: 1, name: copy.hero.title });
};

describe('저장소 읽기 실패(E)', () => {
  it('실패를 배너로 알리고 빈 목록과 구분한다', async () => {
    await renderPage();

    // 하던 낭독을 끊어서라도 알린다 — 사용자가 지금부터 넣는 값이 저장되지 않기 때문.
    const banner = await screen.findByRole('alert');
    expect(banner).toHaveTextContent(copy.error.readFailed);
  });

  it('저장이 막혀도 화면은 계속 쓸 수 있다', async () => {
    const user = userEvent.setup();
    await renderPage();
    await screen.findByRole('alert');

    await user.click(await screen.findByRole('button', { name: 'SCHD' }));

    expect(await screen.findByRole('rowheader', { name: /SCHD/ })).toBeInTheDocument();
    // 배너는 사라지지 않는다(여전히 저장되지 않는 상태다).
    expect(screen.getByRole('alert')).toHaveTextContent(copy.error.readFailed);
  });
});
