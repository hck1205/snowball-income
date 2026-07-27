import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import PortfolioPage from '@/pages/Portfolio/PortfolioPage';
import { PORTFOLIO_COPY } from '@/pages/Portfolio/copy';
import { writePortfolioRecord } from '@/pages/Portfolio/utils';
import { applyFxFetchResultAtom } from '@/jotai';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';

/**
 * `/dividend/portfolio` **사용자 행동 테스트**.
 *
 * 여기서 지키는 것은 "깨지면 사용자가 숫자를 오해하거나 입력을 잃는" 계약이다:
 * 빈 상태 → 추가 → 수량 입력 → 요약, 중복 추가 차단, 삭제 → 실행 취소, 그리고 **금액 표기**
 * (환율이 없으면 달러 원값, 있으면 원화 — 달러 숫자에 ₩ 가 붙는 순간 화면이 거짓말을 한다).
 *
 * ⚠ 금액 **숫자**는 단정하지 않는다. 시세 스냅샷은 월간 크론이 갱신하므로 리터럴을 박으면 데이터가
 * 바뀌는 날 아침에 화면 버그가 아닌 이유로 빨개진다 — 통화 기호와 구조만 본다.
 *
 * ⚠ jsdom 에는 indexedDB 가 없어 `fake-indexeddb/auto` 없이는 모든 렌더가 "저장소 읽기 실패"다
 * (그 경로는 `portfolioStorageError.test.tsx` 가 맡는다).
 */

vi.mock('@/shared/lib/analytics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/analytics')>();
  return { ...actual, track: vi.fn(), trackEvent: vi.fn() };
});

const copy = PORTFOLIO_COPY;

/** 2026-07-27(월). 지급일 계산이 '오늘'에 의존하므로 고정해 주입한다. */
const NOW = new Date(2026, 6, 27);

const PORTFOLIO_DB_NAME = 'snowball-portfolio';

function LocationProbe() {
  const location = useLocation();

  return (
    <div>
      <p data-testid="probe-path">{`${location.pathname}${location.search}`}</p>
      <p data-testid="probe-state">{JSON.stringify(location.state ?? null)}</p>
    </div>
  );
}

const withFxRate = () => {
  const store = createStore();
  // 환율이 있어야 원화 환산·시뮬레이션 프리필이 성립한다(없으면 달러 표시 + CTA 비활성).
  store.set(applyFxFetchResultAtom, { rate: 1381, base: 'USD', quote: 'KRW', asOf: '2026-07-27T00:00:00+09:00' });
  return store;
};

const renderPage = async (store?: ReturnType<typeof createStore>) => {
  const ui = (
    <MemoryRouter initialEntries={['/dividend/portfolio']}>
      <Routes>
        <Route path="/dividend/portfolio" element={<PortfolioPage now={NOW} />} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  );

  const result = render(store ? <Provider store={store}>{ui}</Provider> : ui);
  await screen.findByRole('heading', { level: 1, name: copy.hero.title });

  return result;
};

const openPicker = async (user: ReturnType<typeof userEvent.setup>) => {
  // 닫힌 드로어 안의 버튼은 visibility:hidden 이라 getByRole 에서 사라진다 — 열기 스텝이 필수다.
  await user.click(screen.getByRole('button', { name: /종목 추가 열기/ }));
  // `type="search"` 의 role 은 textbox 가 아니라 searchbox 다.
  await screen.findByRole('searchbox', { name: copy.picker.searchLabel });
};

beforeEach(async () => {
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(PORTFOLIO_DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
  vi.mocked(trackEvent).mockClear();
});

describe('빈 상태(B)', () => {
  it('빈 화면 대신 시작 안내와 추천 칩을 보여 주고, 칩을 누르면 목록에 들어간다', async () => {
    const user = userEvent.setup();
    await renderPage();

    expect(await screen.findByText(copy.empty.title)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'SCHD' }));

    // 빈 상태가 요약·목록 카드로 교체된다(카드 안 카드를 만들지 않는다).
    expect(await screen.findByRole('rowheader', { name: /SCHD/ })).toBeInTheDocument();
    expect(screen.queryByText(copy.empty.title)).not.toBeInTheDocument();
  });
});

describe('정상 상태(C)', () => {
  it('저장된 보유를 읽어 표와 요약을 그리고, 환율이 있으면 원화로 표기한다', async () => {
    await writePortfolioRecord([{ ticker: 'SCHD', quantity: 10 }], 15.4);
    await renderPage(withFxRate());

    const row = await screen.findByRole('row', { name: /SCHD/ });
    // 원화 환산은 표시 직전 한 번만 — 달러 값에 ₩ 가 붙으면 그 순간 화면이 거짓말이 된다.
    expect(within(row).getAllByText(/₩/).length).toBeGreaterThan(0);
    expect(screen.getByRole('spinbutton', { name: copy.holdings.quantityAria('SCHD') })).toHaveValue(10);
  });

  it('환율을 불러오지 못하면 달러 원값으로 떨어지고 배너와 비활성 사유가 함께 뜬다', async () => {
    await writePortfolioRecord([{ ticker: 'SCHD', quantity: 10 }], 15.4);
    await renderPage();

    const row = await screen.findByRole('row', { name: /SCHD/ });
    expect(within(row).getAllByText(/\$/).length).toBeGreaterThan(0);
    expect(within(row).queryByText(/₩/)).not.toBeInTheDocument();

    expect(screen.getByText(copy.error.fxFailed)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: copy.cta.simulate })).toBeDisabled();
    expect(screen.getByText(copy.cta.simulateDisabledFx)).toBeInTheDocument();
  });

  it('수량을 비우면 그 행이 합계에서 빠지고 사유가 보인다(에러가 아니다)', async () => {
    const user = userEvent.setup();
    await writePortfolioRecord([{ ticker: 'SCHD', quantity: 10 }], 15.4);
    await renderPage(withFxRate());

    const input = await screen.findByRole('spinbutton', { name: copy.holdings.quantityAria('SCHD') });
    await user.clear(input);

    expect(await screen.findByText(copy.holdings.rowNeedsQuantity)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: copy.cta.simulate })).toBeDisabled();
    expect(screen.getByText(copy.cta.simulateDisabledEmpty)).toBeInTheDocument();
  });
});

describe('가정 요약의 세율 입력', () => {
  it('지우는 동안에는 값이 기본값으로 튀지 않고, 유효한 값만 계산에 반영된다', async () => {
    const user = userEvent.setup();
    await writePortfolioRecord([{ ticker: 'SCHD', quantity: 10 }], 15.4);
    await renderPage(withFxRate());
    await screen.findByRole('rowheader', { name: /SCHD/ });

    const taxField = screen.getByRole('textbox', { name: copy.assumptions.taxLabel });
    await user.clear(taxField);

    // 빈 칸을 0% 로 커밋하면 사용자가 지우는 중에 세후 금액이 세전으로 튄다.
    expect(taxField).toHaveValue('');
    expect(screen.getByText(copy.summary.tiles.annualNetHint(15.4))).toBeInTheDocument();

    await user.type(taxField, '22');
    expect(await screen.findByText(copy.summary.tiles.annualNetHint(22))).toBeInTheDocument();
  });
});

describe('종목 추가 드로어', () => {
  it('검색해서 추가하면 목록에 들어가고 드로어는 열린 채로 남는다(연속 추가)', async () => {
    const user = userEvent.setup();
    await renderPage();
    await screen.findByText(copy.empty.title);

    await openPicker(user);
    await user.type(screen.getByRole('searchbox', { name: copy.picker.searchLabel }), 'JEPI');
    await user.click(await screen.findByRole('button', { name: copy.picker.addAria('JEPI') }));

    expect(await screen.findByRole('rowheader', { name: /JEPI/ })).toBeInTheDocument();
    // 드로어는 닫히지 않는다 — 여러 종목을 이어서 넣는 동선이다.
    expect(screen.getByRole('searchbox', { name: copy.picker.searchLabel })).toBeVisible();
  });

  it('이미 보유 중인 종목은 추가하지 않고 그 행의 수량 입력으로 데려간다', async () => {
    const user = userEvent.setup();
    await writePortfolioRecord([{ ticker: 'SCHD', quantity: 10 }], 15.4);
    await renderPage();
    await screen.findByRole('rowheader', { name: /SCHD/ });

    await openPicker(user);
    await user.type(screen.getByRole('searchbox', { name: copy.picker.searchLabel }), 'SCHD');
    await user.click(await screen.findByRole('button', { name: copy.picker.heldAria('SCHD') }));

    const input = screen.getByRole('spinbutton', { name: copy.holdings.quantityAria('SCHD') });
    await waitFor(() => expect(input).toHaveFocus());
    // 행이 하나 더 생기지 않았다(중복 추가 차단).
    expect(screen.getAllByRole('rowheader', { name: /SCHD/ })).toHaveLength(1);
  });
});

describe('삭제와 실행 취소(H)', () => {
  it('삭제하면 배너로 되돌릴 수 있고, 되돌리면 같은 수량으로 돌아온다', async () => {
    const user = userEvent.setup();
    await writePortfolioRecord([{ ticker: 'SCHD', quantity: 10 }], 15.4);
    await renderPage(withFxRate());
    await screen.findByRole('rowheader', { name: /SCHD/ });

    await user.click(screen.getByRole('button', { name: copy.holdings.deleteAria('SCHD') }));

    expect(await screen.findByText(copy.undo.deleted('SCHD'))).toBeInTheDocument();
    expect(screen.queryByRole('rowheader', { name: /SCHD/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: copy.undo.action }));

    expect(await screen.findByRole('rowheader', { name: /SCHD/ })).toBeInTheDocument();
    const input = screen.getByRole('spinbutton', { name: copy.holdings.quantityAria('SCHD') });
    expect(input).toHaveValue(10);
    await waitFor(() => expect(input).toHaveFocus());
  });
});

describe('CTA 3종', () => {
  it('시뮬레이션은 프리필 state 를 실어 보내고 계측 이름을 남긴다', async () => {
    const user = userEvent.setup();
    await writePortfolioRecord([{ ticker: 'SCHD', quantity: 10 }], 15.4);
    await renderPage(withFxRate());
    await screen.findByRole('rowheader', { name: /SCHD/ });

    await user.click(screen.getByRole('button', { name: copy.cta.simulate }));

    expect(screen.getByTestId('probe-path')).toHaveTextContent('/');
    const state = JSON.parse(screen.getByTestId('probe-state').textContent ?? 'null');
    expect(state.portfolioSimulationPrefill.holdings[0].ticker).toBe('SCHD');
    expect(state.portfolioSimulationPrefill.initialInvestmentKrw).toBeGreaterThan(0);
    expect(trackEvent).toHaveBeenCalledWith(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'portfolio_to_simulator',
      placement: 'portfolio_page'
    });
  });

  it('달력은 보유 티커를 쿼리로 실어 보낸다', async () => {
    const user = userEvent.setup();
    await writePortfolioRecord(
      [
        { ticker: 'SCHD', quantity: 10 },
        { ticker: 'JEPI', quantity: 5 }
      ],
      15.4
    );
    await renderPage(withFxRate());
    await screen.findByRole('rowheader', { name: /SCHD/ });

    await user.click(screen.getByRole('button', { name: copy.cta.calendar }));

    expect(screen.getByTestId('probe-path')).toHaveTextContent('/dividend/calendar?tickers=SCHD,JEPI');
    expect(trackEvent).toHaveBeenCalledWith(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'portfolio_to_calendar',
      placement: 'portfolio_page'
    });
  });

  it('목표 달성으로 이동한다', async () => {
    const user = userEvent.setup();
    await writePortfolioRecord([{ ticker: 'SCHD', quantity: 10 }], 15.4);
    await renderPage(withFxRate());
    await screen.findByRole('rowheader', { name: /SCHD/ });

    await user.click(screen.getByRole('button', { name: copy.cta.goal }));

    expect(screen.getByTestId('probe-path')).toHaveTextContent('/dividend/goal');
  });
});
