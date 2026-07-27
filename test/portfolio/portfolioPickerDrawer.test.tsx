import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { MemoryRouter } from 'react-router-dom';
import PortfolioPage from '@/pages/Portfolio/PortfolioPage';
import { PORTFOLIO_COPY } from '@/pages/Portfolio/copy';
import { writePortfolioRecord } from '@/pages/Portfolio/utils';
import { applyFxFetchResultAtom } from '@/jotai';

/**
 * 종목 추가 드로어 — **수동 입력 폼**과 **드로어 자체의 계약**.
 *
 * 이 두 부분은 캘린더의 원본(`PickerDrawer`/`TickerPicker`)을 복제한 **별개 코드**라 원본 테스트가
 * 지켜 주지 않는다. 여기서 지키는 것: ①유니버스 밖 종목을 넣는 유일한 통로가 막히지 않을 것
 * ②잘못된 입력을 **문장으로** 거절할 것(무음 실패 금지) ③Escape 가 검색어와 드로어를 **두 단계로**
 * 처리할 것 ④닫힌 뒤 포커스가 열었던 버튼으로 돌아올 것(키보드 사용자가 위치를 잃지 않게).
 */

const copy = PORTFOLIO_COPY;
const NOW = new Date(2026, 6, 27);
const PORTFOLIO_DB_NAME = 'snowball-portfolio';

const withFxRate = () => {
  const store = createStore();
  store.set(applyFxFetchResultAtom, { rate: 1381, base: 'USD', quote: 'KRW', asOf: '2026-07-27T00:00:00+09:00' });

  return store;
};

const renderPage = async (store = withFxRate()) => {
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/dividend/portfolio']}>
        <PortfolioPage now={NOW} />
      </MemoryRouter>
    </Provider>
  );

  await screen.findByRole('heading', { level: 1, name: copy.hero.title });
};

/** 닫힌 드로어 안의 버튼은 `visibility: hidden` 이라 role 쿼리에서 사라진다 — 열기 스텝이 필수다. */
const openPicker = async (user: ReturnType<typeof userEvent.setup>) => {
  const trigger = screen.getByRole('button', { name: /종목 추가 열기/ });
  await user.click(trigger);
  await screen.findByRole('searchbox', { name: copy.picker.searchLabel });

  return trigger;
};

/**
 * 검색어를 **한 글자씩** 넣는다.
 *
 * ⚠ 지금 드로어는 리렌더마다 닫기 버튼으로 포커스를 되가져간다(qa 리포트 2026-07-27, `onClose`
 * 아이덴티티가 매 렌더 바뀌어 포커스 effect 가 재실행된다) — 한 번의 `type('SCHD')` 은 첫 글자만
 * 들어간다. 이 헬퍼는 글자마다 입력에 포커스를 되돌려 **검색 필터 자체의 계약**을 검증한다.
 * 포커스 버그가 고쳐지면 이 헬퍼는 그대로 두어도 통과하고, 연속 타이핑 회귀 테스트를 따로 추가한다.
 */
const typeSearch = async (user: ReturnType<typeof userEvent.setup>, text: string) => {
  for (const char of text) {
    const search = screen.getByRole('searchbox', { name: copy.picker.searchLabel });
    await user.click(search);
    await user.type(search, char);
  }
};

const submitManual = async (
  user: ReturnType<typeof userEvent.setup>,
  values: { ticker: string; price?: string; dividendYield?: string }
) => {
  const ticker = screen.getByRole('textbox', { name: copy.manual.fieldTicker });
  await user.clear(ticker);
  if (values.ticker) await user.type(ticker, values.ticker);

  /*
   * ⚠ 숫자 `InputField` 는 브라우저 스피너를 없애려고 실제 `type="text"` 로 렌더된다
   * (InputField.tsx: `type={isNumber ? 'text' : type}`) — role 은 spinbutton 이 아니라 textbox 다.
   * 표의 `QuantityInput` 만 진짜 `type="number"`(spinbutton)라서 두 입력의 쿼리가 다르다.
   */
  const price = screen.getByRole('textbox', { name: copy.manual.fieldPrice });
  await user.clear(price);
  if (values.price) await user.type(price, values.price);

  const dividendYield = screen.getByRole('textbox', { name: copy.manual.fieldYield });
  await user.clear(dividendYield);
  if (values.dividendYield) await user.type(dividendYield, values.dividendYield);

  await user.click(screen.getByRole('button', { name: copy.manual.submit }));
};

beforeEach(async () => {
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(PORTFOLIO_DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
  window.localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)));
});

describe('수동 추가 폼 (AC1-5)', () => {
  it('유니버스 밖 종목을 주가·배당률과 함께 추가하면 "수동" 표기와 함께 목록에 들어간다', async () => {
    const user = userEvent.setup();
    await renderPage();
    await screen.findByText(copy.empty.title);

    await openPicker(user);
    await submitManual(user, { ticker: 'tiger200', price: '20', dividendYield: '3' });

    const row = await screen.findByRole('row', { name: /TIGER200/ });
    // 소문자로 쳐도 심볼로 정규화된다.
    expect(within(row).getByText('TIGER200')).toBeInTheDocument();
    expect(within(row).getByText(copy.badge.manual)).toBeInTheDocument();
    // 추가 직후에는 수량이 비어 있으므로 그 사유가 먼저다(에러가 아니라 다음 할 일 안내).
    expect(within(row).getByText(copy.holdings.rowNeedsQuantity)).toBeInTheDocument();

    await user.type(screen.getByRole('spinbutton', { name: copy.holdings.quantityAria('TIGER200') }), '5');

    // 수량이 들어가면 값 계산에는 포함되고, 빠지는 것이 무엇인지로 사유가 바뀐다.
    const filled = screen.getByRole('row', { name: /TIGER200/ });
    expect(within(filled).getByText(copy.holdings.rowManualExcluded)).toBeInTheDocument();
    expect(within(filled).getAllByText(/₩/).length).toBeGreaterThan(0);
  });

  it.each([
    ['티커가 비어 있으면', { ticker: '', price: '20', dividendYield: '3' }, copy.manual.invalidTicker],
    ['주가가 0이면', { ticker: 'TIGER200', price: '0', dividendYield: '3' }, copy.manual.invalidPrice],
    ['배당률이 100을 넘으면', { ticker: 'TIGER200', price: '20', dividendYield: '120' }, copy.manual.invalidYield]
  ])('%s 추가하지 않고 사유를 문장으로 말한다', async (_label, values, message) => {
    const user = userEvent.setup();
    await renderPage();
    await screen.findByText(copy.empty.title);

    await openPicker(user);
    await submitManual(user, values);

    expect(await screen.findByText(message)).toBeInTheDocument();
    // 빈 상태 그대로 — 무효한 값이 목록에 들어가지 않는다.
    expect(screen.getByText(copy.empty.title)).toBeInTheDocument();
  });

  it('검색으로 찾을 수 있는 종목을 수동으로 넣으면 거절하고 검색을 안내한다 (정본 데이터를 버리지 않게)', async () => {
    const user = userEvent.setup();
    await renderPage();
    await screen.findByText(copy.empty.title);

    await openPicker(user);
    await submitManual(user, { ticker: 'SCHD', price: '20', dividendYield: '3' });

    expect(await screen.findByText(copy.manual.duplicateInUniverse('SCHD'))).toBeInTheDocument();
    expect(screen.getByText(copy.empty.title)).toBeInTheDocument();
  });

  it('이미 보유한 종목을 수동으로 다시 넣으면 폼과 라이브 리전이 함께 알린다', async () => {
    const user = userEvent.setup();
    await writePortfolioRecord([{ ticker: 'TIGER200', quantity: 5, manual: { price: 20, dividendYield: 3 } }], 15.4);
    await renderPage();
    await screen.findByRole('rowheader', { name: /TIGER200/ });

    await openPicker(user);
    await submitManual(user, { ticker: 'TIGER200', price: '30', dividendYield: '4' });

    expect(await screen.findByText(copy.manual.duplicateInHoldings('TIGER200'))).toBeInTheDocument();
    // 행이 늘지도, 기존 수량이 바뀌지도 않는다.
    expect(screen.getAllByRole('rowheader', { name: /TIGER200/ })).toHaveLength(1);
    expect(screen.getByRole('spinbutton', { name: copy.holdings.quantityAria('TIGER200') })).toHaveValue(5);

    const announced = screen.getAllByRole('status').map((node) => node.textContent ?? '');
    expect(announced).toContain(copy.live.alreadyHeld('TIGER200'));
  });
});

describe('드로어 계약', () => {
  it('Escape 는 검색어를 먼저 지우고, 지울 게 없을 때 닫힌다 (열었던 버튼으로 포커스 복귀)', async () => {
    const user = userEvent.setup();
    await renderPage();
    await screen.findByText(copy.empty.title);

    const trigger = await openPicker(user);
    const search = screen.getByRole('searchbox', { name: copy.picker.searchLabel });
    await typeSearch(user, 'SCHD');
    expect(search).toHaveValue('SCHD');

    // 1) 검색어만 지운다 — 드로어는 열린 채다.
    await user.click(search);
    await user.keyboard('{Escape}');
    expect(search).toHaveValue('');
    expect(screen.getByRole('searchbox', { name: copy.picker.searchLabel })).toBeVisible();

    // 2) 지울 게 없으면 그때 닫힌다.
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('searchbox', { name: copy.picker.searchLabel })).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('열면 닫기 버튼으로 포커스가 가고, 검색 결과가 0이면 수동 입력을 펼쳐 막다른 길을 만들지 않는다', async () => {
    const user = userEvent.setup();
    await renderPage();
    await screen.findByText(copy.empty.title);

    await openPicker(user);
    await waitFor(() => expect(screen.getByRole('button', { name: copy.picker.close })).toHaveFocus());

    await typeSearch(user, 'ZZZZZZ');

    expect(await screen.findByText(copy.picker.noResult)).toBeInTheDocument();
    // 결과가 0이면 수동 입력 폼이 접힌 채로 남지 않는다(펼쳐져 필드가 바로 보인다).
    expect(screen.getByRole('textbox', { name: copy.manual.fieldTicker })).toBeVisible();

    const announced = screen.getAllByRole('status').map((node) => node.textContent ?? '');
    expect(announced).toContain(copy.live.noResult);
  });
});
