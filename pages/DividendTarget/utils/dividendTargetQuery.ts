import {
  DEFAULT_INFLATION_RATE,
  isInflationRateChoice,
  type InflationRateChoice
} from '@/shared/constants/inflation';
import { DEFAULT_DIVIDEND_TARGET_TICKER, DIVIDEND_TARGET_TICKERS } from '@/shared/lib/dividendTarget';

/**
 * `/dividend/how-much` 의 **쿼리 계약** — 이 화면 상태의 유일한 저장소다.
 *
 *   `?m=250&t=SCHD&i=2.5`
 *
 *  - `m` — 목표 세후 월 배당, **만원 단위 정수**. 원 단위가 아닌 이유: 검색·공유 링크에서 사람이
 *          읽을 수 있어야 하고(`m=2500000` 은 자릿수를 세야 한다), 화면 선택지도 만원 단위다.
 *  - `t` — 자세히 보는 종목. 큐레이션 12 종 밖이면 기본값.
 *  - `i` — 물가상승률 가정(%). 선택지 밖이면 기본값.
 *
 * 🔴 **잘못된 값은 조용히 기본값으로 돌아간다 — 오류 화면을 띄우지 않는다.** 이 주소는 검색엔진과
 *    남의 공유 링크에서 오므로 깨진 파라미터가 흔하고, 그 사람에게 필요한 것은 오류가 아니라 숫자다.
 * ⚠ 파라미터 이름을 바꾸면 이미 공유된 링크가 기본값으로 열린다(깨지지는 않는다). 그래도 바꾸지 마라.
 */
export const DIVIDEND_TARGET_QUERY = { monthly: 'm', ticker: 't', inflation: 'i' } as const;

/** 화면이 칩으로 제시하는 목표(만원). 순서 = 노출 순서. */
export const MONTHLY_TARGET_CHOICES_MAN = [50, 100, 150, 200, 250, 300, 500] as const;

/**
 * 기본 목표 — **250만원**. 사용자가 이 기능을 요청하며 든 예시("SCHD 로 월 250")이고, 2인 가구
 * 생활비에 가까운 금액이라 첫 화면의 질문으로 자연스럽다.
 */
export const DEFAULT_MONTHLY_TARGET_MAN = 250;

/** 직접 입력 범위(만원). 1억/월을 넘는 목표는 이 화면의 질문이 아니다. */
export const MONTHLY_TARGET_MIN_MAN = 10;
export const MONTHLY_TARGET_MAX_MAN = 10_000;

export type DividendTargetQueryState = {
  readonly monthlyMan: number;
  readonly ticker: string;
  readonly inflationRate: InflationRateChoice;
};

/** 만원 단위 입력을 범위 안의 정수로. 성립하지 않으면 `null`. */
export const sanitizeMonthlyMan = (raw: unknown): number | null => {
  const value = typeof raw === 'number' ? raw : Number(String(raw ?? '').replace(/[,\s]/g, ''));
  if (!Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  if (rounded < MONTHLY_TARGET_MIN_MAN || rounded > MONTHLY_TARGET_MAX_MAN) return null;
  return rounded;
};

const TICKER_SET = new Set(DIVIDEND_TARGET_TICKERS);

export const parseDividendTargetQuery = (
  params: URLSearchParams,
  /**
   * 쿼리에 금액이 없을 때 쓸 값. 금액별 주소(`/dividend/how-much/100`)는 주소의 금액을 넘긴다(2026-11-09).
   * 🔴 쿼리(`?m=`)가 있으면 **쿼리가 이긴다** — 기존 공유 링크의 의미를 바꾸지 않는다.
   */
  fallbackMonthlyMan: number = DEFAULT_MONTHLY_TARGET_MAN
): DividendTargetQueryState => {
  const monthlyMan = sanitizeMonthlyMan(params.get(DIVIDEND_TARGET_QUERY.monthly)) ?? fallbackMonthlyMan;

  const rawTicker = (params.get(DIVIDEND_TARGET_QUERY.ticker) ?? '').trim().toUpperCase();
  const ticker = TICKER_SET.has(rawTicker) ? rawTicker : DEFAULT_DIVIDEND_TARGET_TICKER;

  const rawInflation = Number(params.get(DIVIDEND_TARGET_QUERY.inflation));
  const inflationRate = isInflationRateChoice(rawInflation) ? rawInflation : DEFAULT_INFLATION_RATE;

  return { monthlyMan, ticker, inflationRate };
};

/**
 * 상태 → 쿼리. **기본값은 쓰지 않는다** — 아무것도 안 바꾼 사람의 주소는 클린 URL 그대로여서
 * 정본 주소(canonical)와 같다. 그래야 기본 상태 공유 링크가 색인 대상과 같은 주소가 된다.
 */
export const toDividendTargetQuery = (state: DividendTargetQueryState): URLSearchParams => {
  const params = new URLSearchParams();
  if (state.monthlyMan !== DEFAULT_MONTHLY_TARGET_MAN) params.set(DIVIDEND_TARGET_QUERY.monthly, String(state.monthlyMan));
  if (state.ticker !== DEFAULT_DIVIDEND_TARGET_TICKER) params.set(DIVIDEND_TARGET_QUERY.ticker, state.ticker);
  if (state.inflationRate !== DEFAULT_INFLATION_RATE) params.set(DIVIDEND_TARGET_QUERY.inflation, String(state.inflationRate));
  return params;
};

/**
 * 상세 카드의 DOM id. 비교 카드의 aria-controls·클릭 뒤 스크롤·카드 자신이 **같은 문자열**을 써야
 * 해서 한 곳에 둔다(셋 중 하나만 바뀌면 스크롤이 조용히 멈추고 보조기기 연결이 끊긴다).
 */
export const DETAIL_REGION_ID = 'dividend-target-detail';
