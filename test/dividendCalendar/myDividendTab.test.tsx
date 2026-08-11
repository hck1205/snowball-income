vi.setConfig({ testTimeout: 40_000 });
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DividendCalendarPage } from '@/pages/DividendCalendar';

/**
 * 보유 저장소(IndexedDB)를 심는 대신 **훅을 갈아 끼운다**. jsdom 에는 IndexedDB 가 없어 실제 훅은
 * `read-error` 로 수렴하는데, 그러면 "보유가 없다"와 "못 읽었다"를 구분하는 이 화면의 분기를
 * 검증할 수 없다. 여기서 필요한 것은 저장소가 아니라 **상태**다.
 */
const holdingsState = vi.hoisted(() => ({
  status: 'ready' as 'loading' | 'ready' | 'read-error',
  items: [] as { ticker: string; quantity: number | null; quantityInput: string }[]
}));

vi.mock('@/pages/Portfolio/hooks', () => ({
  usePortfolioHoldings: () => ({
    status: holdingsState.status,
    items: holdingsState.items,
    taxPercent: 15.4,
    writeError: null,
    pendingUndo: null,
    actions: {}
  })
}));

/**
 * **내 배당 탭**(2026-08-11) — 같은 달력을 "고른 종목"이 아니라 **보유 수량**으로 채우는 갈래.
 *
 * 여기서 잠그는 것은 세 가지다.
 *  ① 탭이 존재하고 서로 배타다(`aria-pressed`).
 *  ② 내 배당 탭에는 **종목 선택이 없다** — 목록을 정하는 것은 보유이지 취향이 아니다.
 *  ③ 보유가 없으면 "고르세요"가 아니라 **"보유를 등록하세요"** 라고 말한다. 이 화면에서 일반
 *     빈 상태를 그대로 쓰면 사용자가 종목을 골라 놓고 "왜 금액이 안 나오지" 하게 된다.
 *
 * ⚠ 금액 계산 자체는 여기서 검증하지 않는다 — 순수 계층(`test/portfolio/portfolioCalendar.test.ts`)
 *   이 8가지 규칙으로 잠근다. 이 파일은 **배선**만 본다(보유 저장소를 심지 않아도 도는 이유).
 */

const TODAY = new Date(2026, 7, 11); // 2026-08-11 (로컬)

const renderCalendar = () =>
  render(
    <MemoryRouter initialEntries={['/dividend/calendar']}>
      <Routes>
        <Route path="/dividend/calendar" element={<DividendCalendarPage today={TODAY} />} />
      </Routes>
    </MemoryRouter>
  );

const modeTab = (name: '전체 배당' | '내 배당') => screen.getByRole('button', { name });

beforeEach(() => {
  holdingsState.status = 'ready';
  holdingsState.items = [];
});

describe('배당 캘린더 — 내 배당 탭', () => {
  it('기본은 전체 배당이다 — 보유를 아직 안 넣은 사람이 빈 화면을 먼저 만나지 않는다', async () => {
    renderCalendar();

    await waitFor(() => expect(modeTab('전체 배당')).toHaveAttribute('aria-pressed', 'true'));
    expect(modeTab('내 배당')).toHaveAttribute('aria-pressed', 'false');
  });

  it('내 배당으로 바꾸면 종목 선택이 사라진다 — 목록을 정하는 것은 보유다', async () => {
    const user = userEvent.setup();
    renderCalendar();

    await waitFor(() => expect(modeTab('내 배당')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /종목 선택/ })).toBeInTheDocument();

    await user.click(modeTab('내 배당'));

    expect(modeTab('내 배당')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: /종목 선택/ })).toBeNull();
  });

  it('🔴 보유가 없으면 "보유를 등록하세요"라고 말한다 — 종목 고르기 안내를 재사용하지 않는다', async () => {
    const user = userEvent.setup();
    renderCalendar();

    await waitFor(() => expect(modeTab('내 배당')).toBeInTheDocument());
    await user.click(modeTab('내 배당'));

    await waitFor(() => expect(screen.getByText(/보유 종목을 먼저 등록/)).toBeInTheDocument());
    // 등록하러 갈 곳이 같은 화면에 있어야 한다 — 안내만 하고 길을 안 주면 막다른 길이다.
    expect(screen.getByRole('link', { name: '내 포트폴리오로 가기' })).toHaveAttribute(
      'href',
      '/dividend/portfolio'
    );
  });

  it('보유가 있으면 그 달 합계를 추정으로 말한다 — 숫자만 크게 띄우지 않는다', async () => {
    // O(리얼티 인컴)는 월 지급이라 어떤 달을 열어도 한 건이 잡힌다.
    holdingsState.items = [{ ticker: 'O', quantity: 10, quantityInput: '10' }];
    const user = userEvent.setup();
    renderCalendar();

    await waitFor(() => expect(modeTab('내 배당')).toBeInTheDocument());
    await user.click(modeTab('내 배당'));

    // 합계 줄은 금액과 건수를 말하고, **추정**이라는 사실을 같은 줄에서 밝힌다.
    await waitFor(() => expect(screen.getByText(/예정 .* · 1건 \(추정\)/)).toBeInTheDocument());
    expect(screen.queryByText(/보유 종목을 먼저 등록/)).toBeNull();
  });

  it('전체 배당으로 돌아오면 종목 선택이 다시 선다 — 탭은 선택 상태를 덮어쓰지 않는다', async () => {
    const user = userEvent.setup();
    renderCalendar();

    await waitFor(() => expect(modeTab('내 배당')).toBeInTheDocument());
    await user.click(modeTab('내 배당'));
    await user.click(modeTab('전체 배당'));

    expect(screen.getByRole('button', { name: /종목 선택/ })).toBeInTheDocument();
    expect(modeTab('전체 배당')).toHaveAttribute('aria-pressed', 'true');
  });
});
