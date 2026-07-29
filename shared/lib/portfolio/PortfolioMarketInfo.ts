import { MARKET_DATA, type MarketDataEntry, type MarketDataSnapshotEntry } from '@/shared/constants/marketData';
import { DIVIDEND_UNIVERSE } from '@/shared/constants/presets';
import { normalizePortfolioTicker } from './PortfolioHolding';
import type {
  PortfolioHolding,
  PortfolioMarketInfo,
  PortfolioManualMarketInput,
  PortfolioPayoutMonthsSource
} from './PortfolioTypes';

/**
 * **티커 → 시장 정보 3단 해석** (스냅샷 → 프리셋 → 수동 입력).
 *
 * 앱의 병합 규칙을 새로 만들지 않는다: 가격·배당률·`frequency` 는 이미 `applyMarketData` 로 스냅샷이
 * 덮인 `DIVIDEND_UNIVERSE` 에서 읽고(=시뮬레이터가 쓰는 바로 그 값), 스냅샷에만 있는 **일정 정보**
 * (`payoutMonths`·`payoutMonthsSource`·`estimatedPayDayByMonth`)와 신선도·기준일만 스냅샷에서 덧붙인다.
 * 그래서 같은 티커가 시뮬레이터와 Portfolio 에서 다른 가격을 갖는 일이 구조적으로 없다.
 *
 * 신선도 구분: 스냅샷에 있으면 `snapshot`(+`asOf`), 유니버스에만 있으면 `preset`(갱신일 없음 — 큐레이션
 * 값이라 낡았을 수 있다는 사실을 화면이 말해야 한다), 둘 다 없고 `holding.manual` 이 있으면 `manual`.
 */

const SNAPSHOT_ENTRIES: Record<string, MarketDataSnapshotEntry | undefined> = MARKET_DATA.entries;
const UNIVERSE_ENTRIES: Record<string, MarketDataEntry | undefined> = DIVIDEND_UNIVERSE;

const isCalendarMonth = (month: number): boolean => Number.isInteger(month) && month >= 1 && month <= 12;

/** 생성물(스냅샷)에서 온 값이라 방어적으로 정규화한다: 1-12 정수만, 중복 제거, 오름차순. */
const normalizePayoutMonths = (months: readonly number[] | undefined): number[] =>
  [...new Set((months ?? []).filter(isCalendarMonth))].sort((left, right) => left - right);

const normalizePayoutMonthsSource = (
  source: MarketDataSnapshotEntry['payoutMonthsSource']
): PortfolioPayoutMonthsSource | undefined => (source === 'pay' || source === 'ex' || source === 'none' ? source : undefined);

/**
 * 예상 지급일 맵. **지급월 목록에 있는 달만** 남기고, 값은 1 이상의 정수만 받는다.
 * 그 달의 실제 일수 clamp 는 연도를 알아야 하므로 여기서 하지 않는다(`findNextPayout` 이 한다).
 */
const normalizeEstimatedPayDays = (
  raw: Record<string, number> | undefined,
  payoutMonths: readonly number[]
): Record<string, number> | undefined => {
  if (!raw) return undefined;

  const days: Record<string, number> = {};
  for (const month of payoutMonths) {
    const value = raw[String(month)];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 1) continue;
    days[String(month)] = Math.trunc(value);
  }

  return Object.keys(days).length > 0 ? days : undefined;
};

/** 가격·배당률이 계산에 쓸 수 있는 값인가. 가격 0/음수/NaN 은 자산가치를 조용히 0 으로 만든다. */
const isUsableMarketNumbers = (price: number, dividendYield: number): boolean =>
  typeof price === 'number' &&
  Number.isFinite(price) &&
  price > 0 &&
  typeof dividendYield === 'number' &&
  Number.isFinite(dividendYield) &&
  dividendYield >= 0;

const resolveFromUniverse = (symbol: string): PortfolioMarketInfo | null => {
  const snapshot = SNAPSHOT_ENTRIES[symbol];
  // 유니버스가 정본(스냅샷 오버레이 적용본). 유니버스 밖인데 스냅샷에만 있는 티커는 스냅샷으로 폴백한다.
  const base = UNIVERSE_ENTRIES[symbol] ?? snapshot;
  if (!base || !isUsableMarketNumbers(base.initialPrice, base.dividendYield)) return null;

  const payoutMonths = normalizePayoutMonths(snapshot?.payoutMonths);
  const source = normalizePayoutMonthsSource(snapshot?.payoutMonthsSource);
  const estimatedPayDayByMonth =
    source === 'pay' ? normalizeEstimatedPayDays(snapshot?.estimatedPayDayByMonth, payoutMonths) : undefined;

  return {
    price: base.initialPrice,
    dividendYield: base.dividendYield,
    frequency: base.frequency,
    ...(payoutMonths.length > 0 ? { payoutMonths } : {}),
    ...(source ? { payoutMonthsSource: source } : {}),
    ...(estimatedPayDayByMonth ? { estimatedPayDayByMonth } : {}),
    freshness: snapshot ? 'snapshot' : 'preset',
    asOf: snapshot ? MARKET_DATA.asOf : null
  };
};

/**
 * 수동 폴백. 지급월을 **모른다** — `payoutMonths` 를 만들지 않으므로 #6·#7 에서 자동으로 빠진다
 * (사용자가 넣지 않은 일정을 `frequency` 로 추측하지 않는다).
 */
const resolveFromManual = (manual: PortfolioManualMarketInput | undefined): PortfolioMarketInfo | null => {
  if (!manual || !isUsableMarketNumbers(manual.price, manual.dividendYield)) return null;

  return {
    price: manual.price,
    dividendYield: manual.dividendYield,
    freshness: 'manual',
    asOf: null
  };
};

/** 3단 해석. 셋 다 없으면 `null`(호출부가 `no-market-data` 로 제외 사유를 남긴다). */
export const resolvePortfolioMarketInfo = (holding: PortfolioHolding): PortfolioMarketInfo | null => {
  const symbol = normalizePortfolioTicker(holding.ticker);
  const resolved = symbol.length > 0 ? resolveFromUniverse(symbol) : null;

  return resolved ?? resolveFromManual(holding.manual);
};

/**
 * 주당 연배당(DPS, USD) = `price × dividendYield / 100`.
 * 시뮬레이션 엔진의 `dps0`(SnowballSimulation.ts:41) 과 **같은 정의**다 — 두 화면이 다른 DPS 를 쓰면 안 된다.
 */
export const portfolioAnnualDpsUsd = (info: PortfolioMarketInfo): number => (info.price * info.dividendYield) / 100;

/** 지급월을 아는가(= #6·#7 계산 가능한가). */
export const hasPortfolioPayoutMonths = (info: PortfolioMarketInfo | null): boolean =>
  (info?.payoutMonths?.length ?? 0) > 0;
