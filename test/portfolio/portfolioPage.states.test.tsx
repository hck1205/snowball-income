import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { MemoryRouter } from 'react-router-dom';
import PortfolioPage from '@/pages/Portfolio/PortfolioPage';
import { PORTFOLIO_COPY } from '@/pages/Portfolio/copy';
import { PORTFOLIO_UNDO_TIMEOUT_MS } from '@/pages/Portfolio/hooks';
import { writePortfolioRecord } from '@/pages/Portfolio/utils';
import { applyFxFetchResultAtom, displayCurrencyAtom } from '@/jotai';
import { resolvePortfolioMarketInfo } from '@/shared/lib/portfolio';
import { ANALYTICS_EVENT, track } from '@/shared/lib/analytics';
import { formatUSD } from '@/shared/utils';

/**
 * `/dividend/portfolio` — **화면 상태 분기**(수용 기준 대비 검증).
 *
 * `portfolioPage.behavior.test.tsx` 가 "빈 상태 → 추가 → 수량 → 요약"의 정상 동선을 지킨다면,
 * 여기서는 그 동선 밖에서 사용자가 숫자를 오해하게 되는 경계를 본다:
 * 지급이 없는 달(#3 vs #6), 지급 일정 데이터가 없는 구성(날짜 날조 금지), 환율 4상태,
 * 삭제→실행 취소의 자리 복원, 계측 payload, 그리고 **다른 도메인 저장소를 열지 않는다**는 격리.
 *
 * ⚠ 금액 **숫자**는 단정하지 않는다(시세 스냅샷은 크론이 갱신한다) — 통화 기호·문구·구조만 본다.
 * ⚠ 지급월도 리터럴로 박지 않는다. 실데이터에서 "지급이 없는 달"을 골라 '오늘'로 주입한다.
 */

vi.mock('@/shared/lib/analytics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/analytics')>();

  return { ...actual, track: vi.fn(), trackEvent: vi.fn() };
});

const copy = PORTFOLIO_COPY;
const PORTFOLIO_DB_NAME = 'snowball-portfolio';

/** 분기 지급 종목. 지급월은 실데이터에서 읽어 "지급이 없는 달"을 고른다. */
const QUARTERLY_TICKER = 'SCHD';
/** 유니버스 밖 심볼(직접 추가한 종목 흉내). 유니버스에 생기면 이 테스트가 먼저 알려 준다. */
const MANUAL_TICKER = 'ZZTOP';

const payoutMonthsOf = (ticker: string): number[] =>
  resolvePortfolioMarketInfo({ ticker, quantity: 0 })?.payoutMonths ?? [];

/** 그 종목이 지급하지 않는 달(1..12). 매월 지급 종목이면 `null`. */
const findSilentMonth = (months: readonly number[]): number | null => {
  for (let month = 1; month <= 12; month += 1) {
    if (!months.includes(month)) return month;
  }

  return null;
};

const withFxRate = () => {
  const store = createStore();
  store.set(applyFxFetchResultAtom, { rate: 1381, base: 'USD', quote: 'KRW', asOf: '2026-07-27T00:00:00+09:00' });

  return store;
};

/** 성공 이후 갱신이 실패한 상태(값은 있고 신선도만 떨어진 상태). */
const withStaleFxRate = () => {
  const store = withFxRate();
  store.set(applyFxFetchResultAtom, null);

  return store;
};

const renderPage = async (options: { now: Date; store?: ReturnType<typeof createStore> }) => {
  const ui = (
    <MemoryRouter initialEntries={['/dividend/portfolio']}>
      <PortfolioPage now={options.now} />
    </MemoryRouter>
  );

  const result = render(options.store ? <Provider store={options.store}>{ui}</Provider> : ui);
  await screen.findByRole('heading', { level: 1, name: copy.hero.title });

  return result;
};

/** 라이브 리전(sr-only)의 현재 문장. 배너들도 role=status 라 보유 요약 문장만 골라낸다. */
const liveText = (): string =>
  screen
    .getAllByRole('status')
    .map((node) => node.textContent ?? '')
    .find((text) => text.includes('보유')) ?? '';

beforeEach(async () => {
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(PORTFOLIO_DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
  vi.mocked(track).mockClear();
  /*
   * 표시 통화 선호(`displayCurrencyAtom`)는 **localStorage 영속**이라 새 store 를 만들어도 이전
   * 테스트가 남긴 값이 살아난다 — 달러 선호 테스트 뒤 원화 테스트가 조용히 달러로 돌아 실패했다(실측).
   */
  window.localStorage.clear();
  // 환율 조회는 절대 settle 하지 않게 둔다 — 시드한 FX 상태가 테스트 도중 바뀌지 않게.
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('지급이 없는 달 (AC2-4)', () => {
  it('분기 지급 종목만 보유하면 "이번 달 지급 없음"과 개념 구분 설명이 함께 뜨고, 월 배당은 0이 아니다', async () => {
    const months = payoutMonthsOf(QUARTERLY_TICKER);
    // 데이터가 매월 지급으로 바뀌면 이 시나리오 자체가 성립하지 않는다 — 조용히 통과시키지 않는다.
    expect(months.length).toBeGreaterThan(0);
    const silentMonth = findSilentMonth(months);
    expect(silentMonth).not.toBeNull();

    await writePortfolioRecord([{ ticker: QUARTERLY_TICKER, quantity: 100 }], 15.4);
    await renderPage({ now: new Date(2026, (silentMonth as number) - 1, 15), store: withFxRate() });
    await screen.findByRole('rowheader', { name: new RegExp(QUARTERLY_TICKER) });

    // #6 은 0 을 그리지 않고 문장으로 말한다(₩0 은 오류로 읽힌다).
    expect(screen.getByText(copy.summary.tiles.thisMonthNone)).toBeInTheDocument();
    expect(screen.getByText(copy.summary.tiles.thisMonthNoneHint)).toBeInTheDocument();
    expect(screen.queryByText('₩0')).not.toBeInTheDocument();

    // #3(월 평균)은 값이 있다 — 라이브 리전이 읽어 주는 문장으로 확인한다(0 이면 ₩0 이 실린다).
    expect(screen.getByText(copy.summary.tiles.monthlyNetHint)).toBeInTheDocument();
    expect(screen.queryByText(copy.summary.tiles.monthlyNetHintEmpty)).not.toBeInTheDocument();
    expect(liveText()).toMatch(/월 배당 ₩[1-9]/);

    // 그래서 "왜 다른가"를 같은 화면에서 설명한다 — 이 줄이 없으면 계산 오류로 읽힌다.
    expect(screen.getByText(copy.summary.monthlyVsThisMonthNote)).toBeInTheDocument();
  });

  it('지급월이면 개념 구분 설명을 띄우지 않는다 (설명이 상시 노출로 굳지 않게)', async () => {
    const months = payoutMonthsOf(QUARTERLY_TICKER);
    expect(months.length).toBeGreaterThan(0);

    await writePortfolioRecord([{ ticker: QUARTERLY_TICKER, quantity: 100 }], 15.4);
    await renderPage({ now: new Date(2026, months[0] - 1, 1), store: withFxRate() });
    await screen.findByRole('rowheader', { name: new RegExp(QUARTERLY_TICKER) });

    expect(screen.getByText(copy.summary.tiles.thisMonthHint(months[0], 1))).toBeInTheDocument();
    expect(screen.queryByText(copy.summary.tiles.thisMonthNone)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.summary.monthlyVsThisMonthNote)).not.toBeInTheDocument();
  });
});

describe('지급 일정 데이터가 없을 때 (AC3-3 · AC3-4)', () => {
  it('직접 추가한 종목만 보유하면 날짜를 지어내지 않고 사유를 말한다', async () => {
    await writePortfolioRecord([{ ticker: MANUAL_TICKER, quantity: 5, manual: { price: 20, dividendYield: 3 } }], 15.4);
    await renderPage({ now: new Date(2026, 6, 27), store: withFxRate() });
    await screen.findByRole('rowheader', { name: new RegExp(MANUAL_TICKER) });

    expect(screen.getByText(copy.summary.tiles.nextPayoutNone)).toBeInTheDocument();
    expect(screen.getByText(copy.summary.tiles.nextPayoutNoneHint)).toBeInTheDocument();
    expect(screen.getByText(copy.summary.tiles.thisMonthUnknown)).toBeInTheDocument();
    expect(screen.getByText(copy.summary.tiles.thisMonthUnknownHint)).toBeInTheDocument();

    // **날짜 날조 금지** — 근거가 없으면 화면 어디에도 지급일·지급월 표기가 나오지 않는다.
    expect(screen.queryByText(/\d{1,2}월 \d{1,2}일 예상/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\d{1,2}월 지급 예정/)).not.toBeInTheDocument();
  });

  it('시세 데이터를 찾을 수 없는 종목이 저장돼 있어도 사유를 말하고 나머지는 계속 계산한다', async () => {
    // 유니버스에서 사라진 심볼이 저장에 남아 있는 상황(수동 정보도 없음).
    await writePortfolioRecord(
      [
        { ticker: QUARTERLY_TICKER, quantity: 10 },
        { ticker: 'OLDSYM', quantity: 3 }
      ],
      15.4
    );
    await renderPage({ now: new Date(2026, 6, 27), store: withFxRate() });

    const orphanRow = await screen.findByRole('row', { name: /OLDSYM/ });
    expect(within(orphanRow).getByText(copy.holdings.rowNoMarketData)).toBeInTheDocument();
    // 값 자리는 비우되 행은 남는다 — 사용자가 지운 적 없는 행을 화면이 임의로 없애지 않는다.
    expect(within(orphanRow).getAllByText(copy.summary.tiles.empty).length).toBeGreaterThan(0);
    expect(within(orphanRow).queryByText(/₩/)).not.toBeInTheDocument();

    // 나머지 종목은 정상 계산된다(한 행의 데이터 문제가 요약 전체를 무너뜨리지 않는다).
    const healthyRow = screen.getByRole('row', { name: new RegExp(QUARTERLY_TICKER) });
    expect(within(healthyRow).getAllByText(/₩/).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: copy.cta.simulate })).toBeEnabled();
  });

  it('일부만 빠지면 행·요약·CTA 세 곳에서 제외 사실을 말한다 (무음 제외 금지)', async () => {
    await writePortfolioRecord(
      [
        { ticker: QUARTERLY_TICKER, quantity: 10 },
        { ticker: MANUAL_TICKER, quantity: 5, manual: { price: 20, dividendYield: 3 } }
      ],
      15.4
    );
    await renderPage({ now: new Date(2026, 6, 27), store: withFxRate() });

    const manualRow = await screen.findByRole('row', { name: new RegExp(MANUAL_TICKER) });
    expect(within(manualRow).getByText(copy.holdings.rowManualExcluded)).toBeInTheDocument();
    expect(within(manualRow).getByText(copy.badge.manual)).toBeInTheDocument();

    expect(screen.getByText(copy.summary.manualExcludedNote(1))).toBeInTheDocument();
    expect(screen.getByText(copy.cta.calendarManualExcluded)).toBeInTheDocument();
    expect(screen.getByText(copy.cta.simulateExcluded(1))).toBeInTheDocument();
    expect(screen.getByText(copy.assumptions.manual)).toBeInTheDocument();

    // 값(#1~#5)에서는 빠지지 않는다 — 빠지는 건 이번 달·지급일뿐이다.
    expect(within(manualRow).getAllByText(/₩/).length).toBeGreaterThan(0);
  });
});

describe('환율 상태 (AC6)', () => {
  it('환율 실패에도 배당수익률은 계산되고, 달러 값에 ₩ 를 위장하지 않는다', async () => {
    await writePortfolioRecord([{ ticker: QUARTERLY_TICKER, quantity: 10 }], 15.4);
    const store = createStore();
    // 성공값이 한 번도 없었으므로 error(값 없음)로 떨어진다.
    store.set(applyFxFetchResultAtom, null);

    await renderPage({ now: new Date(2026, 6, 27), store });
    await screen.findByRole('rowheader', { name: new RegExp(QUARTERLY_TICKER) });

    // #4 는 분자·분모에서 FX 가 소거되므로 환율과 무관하게 값을 갖는다(AC6-4).
    expect(screen.getByText(/^\d+\.\d{2}%$/)).toBeInTheDocument();
    expect(screen.getByText(copy.summary.tiles.yieldHint)).toBeInTheDocument();

    // 금액은 달러 원값으로 떨어진다 — 화면 어디에도 원화 기호가 없어야 한다(AC6-2).
    expect(screen.queryAllByText(/₩/)).toHaveLength(0);
    // 기준일 줄은 환율 자리에 사유를 적는다(가정 요약의 같은 문구와 구분해 히어로 줄만 고른다).
    expect(
      screen.getByText(
        (content) => content.includes('시세 기준일') && content.trim().endsWith(copy.hero.asOfFxMissing)
      )
    ).toBeInTheDocument();
    expect(screen.getByText(copy.assumptions.fxBasisMissing)).toBeInTheDocument();
    expect(screen.getByText(copy.error.fxFailed)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: copy.cta.simulate })).toBeDisabled();
  });

  it('달러 표시를 선호하는 사용자에게는 환산 없이 달러 원값을 보여 준다 (이중 환산 금지)', async () => {
    // 5주 × $20 = 정확히 $100. 원화로 곱했다가 다시 나누는 경로가 생기면 이 값이 흔들린다.
    await writePortfolioRecord([{ ticker: MANUAL_TICKER, quantity: 5, manual: { price: 20, dividendYield: 3 } }], 15.4);
    const store = withFxRate();
    store.set(displayCurrencyAtom, 'USD');

    await renderPage({ now: new Date(2026, 6, 27), store });

    const row = await screen.findByRole('row', { name: new RegExp(MANUAL_TICKER) });
    expect(within(row).getByText(formatUSD(100))).toBeInTheDocument();
    expect(within(row).queryByText(/₩/)).not.toBeInTheDocument();
  });

  it('갱신에 실패해도(stale) 값은 그대로 보여 주고 사실만 덧붙인다', async () => {
    await writePortfolioRecord([{ ticker: QUARTERLY_TICKER, quantity: 10 }], 15.4);
    await renderPage({ now: new Date(2026, 6, 27), store: withStaleFxRate() });

    const row = await screen.findByRole('row', { name: new RegExp(QUARTERLY_TICKER) });
    expect(within(row).getAllByText(/₩/).length).toBeGreaterThan(0);

    const asOfLine = screen.getByText(new RegExp(copy.hero.asOfFxStale));
    // 값(환율·기준일)을 숨기지 않고 "업데이트 실패"만 덧붙인다.
    expect(asOfLine).toHaveTextContent(copy.hero.asOfFx('1,381', '7월 27일'));
    expect(screen.queryByText(copy.error.fxFailed)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: copy.cta.simulate })).toBeEnabled();
  });
});

describe('삭제와 실행 취소 (AC1-4)', () => {
  const SEED = [
    { ticker: 'SCHD', quantity: 3 },
    { ticker: 'O', quantity: 7 },
    { ticker: 'JEPI', quantity: 11 }
  ];

  /** 표에 남은 행 순서. 수량 입력의 **접근명**으로 읽는다(세율 입력도 textbox 라 걸러낸다). */
  const tickerOrder = (): string[] =>
    screen
      .getAllByRole('textbox')
      .map((input) => input.getAttribute('aria-label') ?? '')
      .filter((label) => label.endsWith(' 보유 수량'))
      .map((label) => label.replace(' 보유 수량', ''));

  it('가운데 행을 지웠다 되돌리면 원래 자리·원래 수량으로 돌아온다', async () => {
    const user = userEvent.setup();
    await writePortfolioRecord(SEED, 15.4);
    await renderPage({ now: new Date(2026, 6, 27), store: withFxRate() });
    await screen.findByRole('rowheader', { name: /SCHD/ });

    await user.click(screen.getByRole('button', { name: copy.holdings.deleteAria('O') }));
    expect(tickerOrder()).toEqual(['SCHD', 'JEPI']);

    await user.click(await screen.findByRole('button', { name: copy.undo.action }));

    // 끝에 붙는 게 아니라 **원래 인덱스**로 돌아온다.
    expect(tickerOrder()).toEqual(['SCHD', 'O', 'JEPI']);
    expect(screen.getByRole('textbox', { name: copy.holdings.quantityAria('O') })).toHaveValue('7');
    // 배너는 확정돼 사라진다.
    expect(screen.queryByText(copy.undo.deleted('O'))).not.toBeInTheDocument();
  });

  it('8초가 지나면 실행 취소 배너가 사라진다 (버퍼 만료)', async () => {
    await writePortfolioRecord(SEED, 15.4);
    await renderPage({ now: new Date(2026, 6, 27), store: withFxRate() });
    await screen.findByRole('rowheader', { name: /SCHD/ });

    // fake-indexeddb 는 setImmediate 로 돌기 때문에 타이머는 setTimeout 계열만 가짜로 만든다.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    /*
     * ⚠ 가짜 타이머 위에서는 `userEvent` 를 쓰지 않는다 — RTL 의 async act 래퍼가 `setTimeout(…, 0)`
     * 으로 마이크로태스크를 흘리는데, 그 타이머를 아무도 진행시키지 않아 클릭이 영원히 pending 이 된다
     * (vitest 의 가짜 타이머는 RTL 이 jest 로 인식하지 못해 자동 advance 가 없다 — 15초 타임아웃 실측).
     * 여기서 필요한 건 "삭제 클릭 후 8초"뿐이라 동기 `fireEvent` 로 충분하다.
     */
    fireEvent.click(screen.getByRole('button', { name: copy.holdings.deleteAria('O') }));
    expect(screen.getByText(copy.undo.deleted('O'))).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(PORTFOLIO_UNDO_TIMEOUT_MS);
    });

    expect(screen.queryByText(copy.undo.deleted('O'))).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: copy.undo.action })).not.toBeInTheDocument();
    expect(tickerOrder()).toEqual(['SCHD', 'JEPI']);
  });
});

describe('계측 (AC7)', () => {
  it('진입·요약 노출은 마운트당 1회이고, 금액 원값 대신 버킷만 싣는다', async () => {
    const user = userEvent.setup();
    await writePortfolioRecord(
      [
        { ticker: QUARTERLY_TICKER, quantity: 10 },
        { ticker: 'JEPI', quantity: 5 }
      ],
      15.4
    );
    await renderPage({ now: new Date(2026, 6, 27), store: withFxRate() });
    await screen.findByRole('rowheader', { name: new RegExp(QUARTERLY_TICKER) });

    const callsOf = (event: string) => vi.mocked(track).mock.calls.filter(([name]) => name === event);

    await waitFor(() => expect(callsOf(ANALYTICS_EVENT.PORTFOLIO_SUMMARY_VIEW)).toHaveLength(1));

    // 파라미터를 **정확히** 단정한다 — 새 필드가 붙으면(예: 금액 원값) 여기서 걸린다.
    expect(track).toHaveBeenCalledWith(ANALYTICS_EVENT.PORTFOLIO_VIEW, {
      holdings_count: 2,
      has_holdings: true
    });

    const [, summaryParams] = callsOf(ANALYTICS_EVENT.PORTFOLIO_SUMMARY_VIEW)[0] as [string, Record<string, unknown>];
    expect(summaryParams).toEqual({
      holdings_count: 2,
      covered_count: 2,
      // 연속값은 라벨(버킷)로만 나간다 — 숫자가 실리면 이 단정이 깨진다.
      value_bucket: expect.stringMatching(/^(<\d+|\d+–\d+|≥\d+)$/) as unknown as string
    });

    // 편집이 일어나도 요약 노출은 다시 세지 않는다(세션 지표가 부풀지 않게).
    const quantity = screen.getByRole('textbox', { name: copy.holdings.quantityAria('JEPI') });
    await user.clear(quantity);
    await user.type(quantity, '9');
    await user.tab();

    expect(callsOf(ANALYTICS_EVENT.PORTFOLIO_SUMMARY_VIEW)).toHaveLength(1);
    expect(callsOf(ANALYTICS_EVENT.PORTFOLIO_VIEW)).toHaveLength(1);
    // 수량 편집은 값이 바뀐 blur 에서만 저장 이벤트를 남긴다.
    expect(track).toHaveBeenCalledWith(ANALYTICS_EVENT.PORTFOLIO_HOLDING_SAVED, { action: 'edit', covered: true });
  });

  it('빈 상태 진입·추가·삭제를 각각 구분해 남긴다', async () => {
    const user = userEvent.setup();
    await renderPage({ now: new Date(2026, 6, 27), store: withFxRate() });
    await screen.findByText(copy.empty.title);

    // 활성화 지표의 분모 — 보유가 없는 진입도 1회 기록된다.
    expect(track).toHaveBeenCalledWith(ANALYTICS_EVENT.PORTFOLIO_VIEW, { holdings_count: 0, has_holdings: false });

    await user.click(screen.getByRole('button', { name: 'SCHD' }));
    expect(track).toHaveBeenCalledWith(ANALYTICS_EVENT.PORTFOLIO_HOLDING_SAVED, { action: 'add', covered: true });

    await user.click(screen.getByRole('button', { name: copy.holdings.deleteAria('SCHD') }));
    expect(track).toHaveBeenCalledWith(ANALYTICS_EVENT.PORTFOLIO_HOLDING_DELETED, { covered: true });
  });
});

describe('저장소 격리 (AC4-4)', () => {
  /**
   * 목표 달성 카드를 흡수하면서 이 화면은 시뮬레이터 저장 payload(`snowball-income-db`)를 **읽는다**
   * — 예상 달성 시점의 유일한 근거다. 그래서 계약이 "자기 DB 하나만 연다"에서
   * **"시뮬 저장소는 읽기만, 쓰기는 자기 DB 에만"** 으로 바뀌었다. 캘린더 DB 는 여전히 열지 않는다.
   *
   * 쓰기가 새면 자동저장·클라우드 base 해시와 어긋나 다음 세션 충돌 판정이 바뀐다(무음 유실 경로).
   */
  it('시뮬 저장소는 읽기만 하고 쓰기는 자기 DB 에만 한다 (캘린더 DB 는 열지 않는다)', async () => {
    const user = userEvent.setup();
    // 프로토타입에 스파이를 건다 — 페이지가 어느 경로로 열든 전부 잡힌다.
    const openSpy = vi.spyOn(Object.getPrototypeOf(indexedDB) as IDBFactory, 'open');

    const realTransaction = IDBDatabase.prototype.transaction;
    const transactions: { db: string; mode: string }[] = [];
    const transactionSpy = vi
      .spyOn(IDBDatabase.prototype, 'transaction')
      .mockImplementation(function (this: IDBDatabase, ...args: Parameters<IDBDatabase['transaction']>) {
        transactions.push({ db: this.name, mode: args[1] ?? 'readonly' });
        return realTransaction.apply(this, args);
      });

    try {
      await writePortfolioRecord([{ ticker: QUARTERLY_TICKER, quantity: 10 }], 15.4);
      await renderPage({ now: new Date(2026, 6, 27), store: withFxRate() });
      await screen.findByRole('rowheader', { name: new RegExp(QUARTERLY_TICKER) });

      const quantity = screen.getByRole('textbox', { name: copy.holdings.quantityAria(QUARTERLY_TICKER) });
      await user.clear(quantity);
      await user.type(quantity, '25');
      await user.click(screen.getByRole('button', { name: copy.holdings.deleteAria(QUARTERLY_TICKER) }));

      // 저장이 실제로 일어났다(= 스파이가 살아 있다)는 것부터 확인한다 — 없으면 아래 단정이 공허해진다.
      await waitFor(() => expect(openSpy.mock.calls.length).toBeGreaterThan(0));
      await waitFor(() => expect(transactions.some((entry) => entry.mode === 'readwrite')).toBe(true));

      const opened = new Set(openSpy.mock.calls.map(([name]) => name));
      expect([...opened].sort()).toEqual(['snowball-income-db', PORTFOLIO_DB_NAME].sort());
      expect(opened.has('snowball-dividend-calendar')).toBe(false);

      const written = new Set(transactions.filter((entry) => entry.mode === 'readwrite').map((entry) => entry.db));
      expect([...written]).toEqual([PORTFOLIO_DB_NAME]);
    } finally {
      transactionSpy.mockRestore();
      openSpy.mockRestore();
    }
  });
});
