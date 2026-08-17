import { render } from '@testing-library/react';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { MemoryRouter, useLocation } from 'react-router-dom';
import {
  applyFxFetchResultAtom,
  buildDefaultPayload,
  writePersistedAppState,
  type PersistedAppStatePayload,
  type PersistedInvestmentSettings
} from '@/jotai';
import type { TickerProfile } from '@/shared/types/snowball';
import PortfolioPage from '@/pages/Portfolio/PortfolioPage';
import { writePortfolioRecord } from '@/pages/Portfolio/utils';
import { PORTFOLIO_DB_NAMES } from '@/jotai';

/**
 * 목표 달성 카드 테스트용 **공용 하네스**.
 *
 * ⚠ 이 화면의 정상 경로는 저장소 **두 곳**을 모두 시딩해야 성립한다: 보유 목록(`snowball-portfolio`)과
 * 시뮬레이터 저장 payload(`snowball-income-db`). jsdom 에는 indexedDB 가 없어 `fake-indexeddb/auto` 를
 * 각 테스트 파일 첫 줄에서 import 해야 하고, 하나라도 빠지면 기본 렌더가 "읽기 실패"다.
 *
 * 환율은 `fetch` 목(영원히 대기)으로 네트워크를 끊고 **jotai store 에 직접** 심어 4상태를 만든다
 * (드라이버가 값을 덮어쓰지 않는다).
 */

/** 투자 시작(2024-01) 후 29개월 — 롤링 12개월 창이 꽉 차는 시점. */
export const NOW = new Date(2026, 5, 15);

export const PORTFOLIO_DB_NAME = 'snowball-portfolio';
/**
 * 🔴 이름을 손으로 적지 마라. 2026-08-17 이름 이관(snowball-income-db → hungryhippo-db) 때 이런 줄이
 * 그대로 남아, 정리해야 할 DB 를 안 지우고 **테스트끼리 데이터가 새는** 실패가 났다(CI 에서만 드러났다).
 */
export const APP_STATE_DB_NAME = PORTFOLIO_DB_NAMES.current;

export const FX_RATE = 1381;

const buildProfile = (): TickerProfile => ({
  id: 'ticker-1',
  ticker: 'SCHD',
  name: '',
  initialPrice: 27,
  // 정합 모델의 고정점: dividendGrowth === expectedTotalReturn - dividendYield.
  dividendGrowth: 6.4,
  dividendYield: 3.6,
  expectedTotalReturn: 10,
  frequency: 'quarterly'
});

/** 시뮬레이터 저장 payload — 예상 달성 시점의 **유일한** 근거다. */
export const buildGoalPayload = (
  settings: Partial<PersistedInvestmentSettings> = {}
): PersistedAppStatePayload => {
  const base = buildDefaultPayload();
  const profile = buildProfile();
  const portfolio = {
    tickerProfiles: [profile],
    includedTickerIds: [profile.id],
    weightByTickerId: { [profile.id]: 100 },
    fixedByTickerId: { [profile.id]: false },
    selectedTickerId: profile.id
  };
  const investmentSettings: PersistedInvestmentSettings = {
    ...base.investmentSettings,
    initialInvestment: 100_000_000,
    monthlyContribution: 1_000_000,
    targetMonthlyDividend: 1_000_000,
    investmentStartDate: '2024-01-01',
    durationYears: 20,
    ...settings
  };

  return {
    ...base,
    portfolio,
    investmentSettings,
    scenarios: base.scenarios.map((scenario) => ({
      ...scenario,
      name: '내 포트폴리오',
      portfolio,
      investmentSettings
    }))
  };
};

const deleteDb = (name: string) =>
  new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });

export const resetGoalStorages = async () => {
  await deleteDb(PORTFOLIO_DB_NAME);
  await deleteDb(APP_STATE_DB_NAME);
};

export type GoalHarnessOptions = {
  /** 시뮬레이터 저장 payload. 생략하면 아무것도 쓰지 않는다(= 저장된 포트폴리오 없음). */
  payload?: PersistedAppStatePayload;
  /** 보유 목록. 생략하면 빈 목록이 아니라 **레코드를 쓰지 않는다**(= 보유 0종). */
  holdings?: readonly { ticker: string; quantity: number }[];
  taxPercent?: number;
  /** 환율 — `'loading'`(기본값 유지) / `'error'` / 숫자(성공). */
  fx?: number | 'loading' | 'error';
};

/** 마지막 이동 경로·state 를 관측한다(이 화면은 값을 저장하지 않고 라우터 state 로만 넘긴다). */
export const lastLocation: { pathname: string; state: unknown } = { pathname: '', state: 'unset' };

export const LocationProbe = () => {
  const location = useLocation();
  lastLocation.pathname = location.pathname;
  lastLocation.state = location.state;

  return null;
};

export const seedGoalStorages = async ({ payload, holdings, taxPercent = 15.4 }: GoalHarnessOptions) => {
  if (payload) await writePersistedAppState(payload);
  if (holdings) await writePortfolioRecord(holdings, taxPercent);
};

export const renderPortfolioPage = ({ fx = FX_RATE }: Pick<GoalHarnessOptions, 'fx'> = {}) => {
  const store = createStore();

  if (typeof fx === 'number') {
    store.set(applyFxFetchResultAtom, {
      rate: fx,
      base: 'USD',
      quote: 'KRW',
      asOf: '2026-06-15T00:00:00+09:00'
    });
  } else if (fx === 'error') {
    // 직전 성공값이 없으면 곧바로 error 로 떨어진다(달러 표시가 불가능하다는 뜻).
    store.set(applyFxFetchResultAtom, null);
  }

  lastLocation.pathname = '';
  lastLocation.state = 'unset';

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/dividend/portfolio']}>
        <PortfolioPage now={NOW} />
        <LocationProbe />
      </MemoryRouter>
    </Provider>
  );
};
