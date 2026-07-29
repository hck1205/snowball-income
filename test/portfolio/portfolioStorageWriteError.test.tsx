import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PortfolioPage from '@/pages/Portfolio/PortfolioPage';
import { PORTFOLIO_COPY } from '@/pages/Portfolio/copy';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';

/**
 * 상태 F — **저장(쓰기)에 실패한 화면**.
 *
 * 읽기 실패(E, `portfolioStorageError.test.tsx`)와 갈라지는 지점: 읽기는 못 했어도 화면이 비어 있지만,
 * 쓰기 실패는 **사용자가 이미 친 값이 화면에 그대로 남아 있는데** 디스크에는 없는 상태다. 조용히
 * 넘어가면 사용자는 다음 세션에 입력이 사라진 걸 그때야 알게 된다 — 그래서 배너로 끊어서 알린다.
 *
 * 저장 계층만 실패시키고(읽기는 실제 fake-indexeddb) 페이지는 실제 훅으로 돌린다 — 훅 목으로
 * 상태를 위조하면 "훅이 정말 그 상태를 만드는가"가 빠져 계약의 절반만 보게 된다.
 */

vi.mock('@/shared/lib/analytics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/analytics')>();

  return { ...actual, track: vi.fn(), trackEvent: vi.fn() };
});

vi.mock('@/pages/Portfolio/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/pages/Portfolio/utils')>();

  return {
    ...actual,
    // 용량 초과·프라이빗 모드처럼 "열리긴 했는데 못 쓰는" 저장소.
    writePortfolioRecord: vi.fn(async () => {
      throw Object.assign(new Error('quota exceeded'), { reason: 'write-failed' });
    })
  };
});

const copy = PORTFOLIO_COPY;
const NOW = new Date(2026, 6, 27);
const PORTFOLIO_DB_NAME = 'snowball-portfolio';

const renderPage = async () => {
  render(
    <MemoryRouter>
      <PortfolioPage now={NOW} />
    </MemoryRouter>
  );

  await screen.findByRole('heading', { level: 1, name: copy.hero.title });
};

beforeEach(async () => {
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(PORTFOLIO_DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
  vi.mocked(trackEvent).mockClear();
  // 환율 조회는 이 테스트의 관심사가 아니다 — 절대 settle 하지 않게 두어 FX 상태를 고정한다.
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)));
});

describe('저장소 쓰기 실패(F)', () => {
  it('저장에 실패하면 배너로 끊어서 알리고, 화면의 값은 그대로 계산된다', async () => {
    const user = userEvent.setup();
    await renderPage();
    await screen.findByText(copy.empty.title);

    await user.click(screen.getByRole('button', { name: 'SCHD' }));
    const quantity = await screen.findByRole('textbox', { name: copy.holdings.quantityAria('SCHD') });
    await user.type(quantity, '12');

    // 디바운스(300ms) → 쓰기 → reject 까지 기다린다.
    const banner = await screen.findByRole('alert', {}, { timeout: 4000 });
    expect(banner).toHaveTextContent(copy.error.writeFailed);
    // 읽기는 성공했으므로 읽기 실패 문구가 아니다(두 실패는 사용자가 할 수 있는 일이 다르다).
    expect(screen.queryByText(copy.error.readFailed)).not.toBeInTheDocument();

    // 메모리 상태는 정상이다 — 값이 화면에서 사라지거나 되돌아가지 않는다.
    expect(quantity).toHaveValue('12');
    expect(screen.getByRole('rowheader', { name: /SCHD/ })).toBeInTheDocument();
  });

  it('실패를 무음으로 삼키지 않고 계측한다', async () => {
    const user = userEvent.setup();
    await renderPage();
    await screen.findByText(copy.empty.title);

    await user.click(screen.getByRole('button', { name: 'SCHD' }));
    await screen.findByRole('alert', {}, { timeout: 4000 });

    expect(trackEvent).toHaveBeenCalledWith(ANALYTICS_EVENT.OPERATION_ERROR, {
      operation: 'portfolio_storage_write',
      reason: 'write-failed'
    });
  });
});
