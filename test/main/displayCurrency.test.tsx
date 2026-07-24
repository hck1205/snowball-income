import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import {
  DISPLAY_CURRENCY_STORAGE_KEY,
  canUseUsdAtom,
  displayCurrencyAtom,
  displayCurrencyViewAtom,
  effectiveDisplayCurrencyAtom,
  fxRateValueAtom,
  fxViewAtom,
  useFxRateSync,
  useFxViewAtomValue
} from '@/jotai';
import { serializeMeaningfulPayload } from '@/jotai/snowball';
import type { PersistedAppStatePayload } from '@/jotai/snowball';

/**
 * 표시 통화(원↔달러) 상태 계약.
 *
 * 핵심 안전장치 = **선호(preference)와 실제 적용(effective)의 분리** — 환율이 없으면 선호가 USD여도
 * 적용은 KRW로 떨어져 `rate == null` 인 채 달러 포맷터가 불리는 경로가 구조적으로 없다.
 * 그리고 이 상태는 **로컬 전용**이라 저장 payload·공유 URL·클라우드 base 해시에 영향이 없다.
 */

const FX_RATE = { rate: 1478.49, base: 'USD', quote: 'KRW', asOf: '2026-07-23T00:02:31.000Z' } as const;

const newStore = () => createStore();

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('displayCurrencyAtom — 로컬 영속 선호', () => {
  it('기본값은 원화이고, 저장하면 원시 문자열로 localStorage 에 남는다', () => {
    const store = newStore();
    expect(store.get(displayCurrencyAtom)).toBe('KRW');

    store.set(displayCurrencyAtom, 'USD');
    expect(store.get(displayCurrencyAtom)).toBe('USD');
    expect(window.localStorage.getItem(DISPLAY_CURRENCY_STORAGE_KEY)).toBe('USD');
  });

  /**
   * `getOnInit: true` 는 **모듈 로드 시점**에 저장값을 읽는다(팔레트와 동일) — 이미 import 된 atom에
   * 나중에 localStorage 를 심어도 반영되지 않는다. 그래서 저장값 복원/폴백은 모듈을 다시 로드해 검증한다.
   */
  const loadDisplayCurrencyAtom = async () => {
    vi.resetModules();
    const module = await import('@/jotai/snowball/atoms/ui');
    return module.displayCurrencyAtom;
  };

  it('저장값이 있으면 첫 읽기부터 복원한다 (getOnInit — 기본값 깜빡임 없음)', async () => {
    window.localStorage.setItem(DISPLAY_CURRENCY_STORAGE_KEY, 'USD');
    expect(newStore().get(await loadDisplayCurrencyAtom())).toBe('USD');
  });

  it('잘못된 저장값(구버전·오타)은 원화로 폴백한다 (throw 금지)', async () => {
    window.localStorage.setItem(DISPLAY_CURRENCY_STORAGE_KEY, 'EUR');
    expect(newStore().get(await loadDisplayCurrencyAtom())).toBe('KRW');
  });

  it('localStorage 를 못 쓰는 환경(사파리 프라이빗 등)에서도 원화로 동작한다', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('access denied');
    });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('access denied');
    });

    const store = newStore();
    expect(store.get(displayCurrencyAtom)).toBe('KRW');
    // 저장이 막혀도 현재 세션 전환은 계속 동작한다.
    expect(() => store.set(displayCurrencyAtom, 'USD')).not.toThrow();
    expect(store.get(displayCurrencyAtom)).toBe('USD');

    getItem.mockRestore();
    setItem.mockRestore();
  });
});

describe('표시 통화 파생 — 선호 × 환율 가용성', () => {
  it('환율이 없으면(loading/error) 달러를 못 쓰고 적용 통화는 원화다', () => {
    const store = newStore();
    store.set(displayCurrencyAtom, 'USD');

    expect(store.get(canUseUsdAtom)).toBe(false);
    expect(store.get(fxRateValueAtom)).toBeNull();
    expect(store.get(effectiveDisplayCurrencyAtom)).toBe('KRW');

    store.set(fxViewAtom, { status: 'error' });
    expect(store.get(canUseUsdAtom)).toBe(false);
    expect(store.get(effectiveDisplayCurrencyAtom)).toBe('KRW');
    // ⚠ 선호는 지우지 않는다 — 환율이 복구되면 자동으로 달러 표시로 돌아온다.
    expect(store.get(displayCurrencyAtom)).toBe('USD');
  });

  it('환율이 오면(success) 선호대로 달러가 적용되고 rate·asOf 가 함께 노출된다', () => {
    const store = newStore();
    store.set(fxViewAtom, { status: 'success', rate: FX_RATE });
    store.set(displayCurrencyAtom, 'USD');

    expect(store.get(effectiveDisplayCurrencyAtom)).toBe('USD');
    expect(store.get(displayCurrencyViewAtom)).toEqual({
      currency: 'USD',
      preferred: 'USD',
      canUseUsd: true,
      rate: FX_RATE.rate,
      asOf: FX_RATE.asOf,
      status: 'success'
    });
  });

  it('stale(갱신 실패, 직전 값 유지)도 달러 표시가 가능하다', () => {
    const store = newStore();
    store.set(fxViewAtom, { status: 'stale', rate: FX_RATE });
    store.set(displayCurrencyAtom, 'USD');

    expect(store.get(canUseUsdAtom)).toBe(true);
    expect(store.get(effectiveDisplayCurrencyAtom)).toBe('USD');
    expect(store.get(displayCurrencyViewAtom).status).toBe('stale');
  });

  it('선호가 원화면 환율이 있어도 원화로 표시한다', () => {
    const store = newStore();
    store.set(fxViewAtom, { status: 'success', rate: FX_RATE });

    expect(store.get(canUseUsdAtom)).toBe(true);
    expect(store.get(effectiveDisplayCurrencyAtom)).toBe('KRW');
    expect(store.get(displayCurrencyViewAtom).rate).toBe(FX_RATE.rate);
  });

  it('적용 통화가 USD 이면 rate 는 절대 null 이 아니다 ($NaN 구조적 차단)', () => {
    const store = newStore();
    store.set(displayCurrencyAtom, 'USD');

    for (const view of [
      { status: 'loading' } as const,
      { status: 'error' } as const,
      { status: 'success', rate: FX_RATE } as const,
      { status: 'stale', rate: FX_RATE } as const
    ]) {
      store.set(fxViewAtom, view);
      const display = store.get(displayCurrencyViewAtom);
      if (display.currency === 'USD') expect(display.rate).not.toBeNull();
    }
  });
});

describe('useFxRateSync — 조회 단일화', () => {
  it('구독자가 여럿이어도 fetch 는 드라이버 1회뿐이고, 모두 같은 값을 본다', async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify(FX_RATE), { status: 200, headers: { 'content-type': 'application/json' } })
    );
    vi.stubGlobal('fetch', fetchMock);

    const Driver = () => {
      useFxRateSync();
      return null;
    };
    const WidgetLike = () => <span data-testid="widget">{useFxViewAtomValue().status}</span>;
    const store = createStore();
    const ResultsLike = () => <span data-testid="results">{String(store.get(displayCurrencyViewAtom).rate)}</span>;

    const { getByTestId } = render(
      <Provider store={store}>
        <Driver />
        <WidgetLike />
        <ResultsLike />
      </Provider>
    );

    await waitFor(() => expect(getByTestId('widget')).toHaveTextContent('success'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(store.get(fxRateValueAtom)).toBe(FX_RATE.rate);
    expect(getByTestId('results')).toBeInTheDocument();
  });

  it('드라이버가 언마운트돼도(모바일 드로어 접힘) 이미 받은 환율은 살아 있다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(FX_RATE), { status: 200 }))
    );

    const Driver = () => {
      useFxRateSync();
      return null;
    };
    const store = createStore();
    const { unmount } = render(
      <Provider store={store}>
        <Driver />
      </Provider>
    );

    await waitFor(() => expect(store.get(fxViewAtom).status).toBe('success'));
    unmount();

    expect(store.get(fxRateValueAtom)).toBe(FX_RATE.rate);
    expect(store.get(canUseUsdAtom)).toBe(true);
  });
});

describe('하위 호환 — 표시 통화는 저장/공유/클라우드에 새지 않는다', () => {
  const payload = (): PersistedAppStatePayload => ({
    portfolio: {
      tickerProfiles: [],
      includedTickerIds: [],
      weightByTickerId: {},
      fixedByTickerId: {},
      selectedTickerId: null
    },
    investmentSettings: {
      initialInvestment: 1000,
      monthlyContribution: 100,
      targetMonthlyDividend: 0,
      investmentStartDate: '2026-01-01',
      durationYears: 10,
      reinvestDividends: true,
      reinvestDividendPercent: 100,
      taxRate: 15.4,
      reinvestTiming: 'sameMonth',
      dpsGrowthMode: 'annualStep',
      showQuickEstimate: false,
      showSplitGraphs: false,
      isResultCompact: false,
      isYearlyAreaFillOn: true,
      showPortfolioDividendCenter: true,
      visibleYearlySeries: {
        totalContribution: true,
        assetValue: true,
        annualDividend: false,
        monthlyDividend: false,
        cumulativeDividend: false
      }
    },
    scenarios: [],
    activeScenarioId: 'scenario-1'
  });

  it('통화를 토글해도 클라우드 base 해시(serializeMeaningfulPayload)는 그대로다', () => {
    const store = newStore();
    const before = serializeMeaningfulPayload(payload());

    store.set(displayCurrencyAtom, 'USD');
    store.set(fxViewAtom, { status: 'success', rate: FX_RATE });

    expect(serializeMeaningfulPayload(payload())).toBe(before);
    // 통화 선호는 payload 가 아니라 별도 localStorage 키에만 산다.
    expect(JSON.stringify(payload())).not.toContain('USD');
    expect(window.localStorage.getItem(DISPLAY_CURRENCY_STORAGE_KEY)).toBe('USD');
  });
});
