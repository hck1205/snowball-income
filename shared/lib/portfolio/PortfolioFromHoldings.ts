/**
 * **`투자` 탭 보유 기록 → 시뮬레이터 프리필 재료.** 순수 변환.
 *
 * ## 왜 이것이 "ultimate" 의 핵심인가
 *
 * 널리 쓰이는 가계부 템플릿들에도 `투자기록` 탭이 있다. 종목·수량·매입단가를 적는 자리다.
 * **거기까지가 그 시트들의 끝**이다 — 사용자가 종가를 손으로 적어 넣으면 평가금액과 수익률을 본다.
 *
 * 히포는 한 걸음 더 간다. 적힌 종목이 곧 **배당 시뮬레이터의 포트폴리오**가 되고, 배당 현금흐름이
 * 계산되어 다시 가계부의 소득으로 돌아온다. 가계부와 배당 시뮬레이터를 한 제품에 둔 이유가
 * 여기서 처음 드러난다.
 *
 * ## 🔴 비중·정규화·검증을 여기서 하지 않는다
 *
 * 이 파일은 **재료만** 만든다(`PortfolioPrefillSource`). 비중 계산·재정규화·유니버스 판정은
 * `buildPortfolioSimulationPrefillState` 가 이미 하고, 그것이 정본이다.
 *
 * 처음에 여기서 비중까지 계산했는데 그건 **규칙 이원화**였다 — `portfolioPrefill/index.ts` 머리말이
 * 명시적으로 금지하는 것이고, 두 곳의 반올림이 갈리면 "보내는 쪽 안내와 실제 프리필이 다르다"가 된다.
 * 내 포트폴리오 화면이 쓰는 경로를 가계부도 그대로 쓴다.
 *
 * ## ⚠ 여기서 `googleSheets` 를 import 하지 않는다
 *
 * 입력을 **구조적으로** 받는다. `InvestmentRecord` 를 그대로 받으면 `lib/portfolio` 가 시트를
 * 알아야 하고, CSV·수동 입력에서 같은 변환을 못 쓴다.
 */
import { DIVIDEND_UNIVERSE, isSimulationKnownTicker } from '@/shared/constants';
import type { PortfolioPrefillSource, PortfolioPrefillSourceHolding } from '@/shared/constants';

import { normalizePortfolioTicker } from './PortfolioHolding';

/** 이 변환에 필요한 최소한의 보유 정보. `투자` 탭 한 줄이 구조적으로 이것을 만족한다. */
export type HoldingInput = {
  readonly ticker: string;
  readonly shares: number;
  /** 매입단가. 없으면 프리셋 기준가로 잰다(그 사실을 결과가 밝힌다). */
  readonly unitCost: number | null;
  /** `USD` · `KRW`. */
  readonly currency: string;
};

export type LedgerPrefillSourceResult = {
  /** `buildPortfolioSimulationPrefillState` 에 그대로 넘긴다. */
  readonly source: PortfolioPrefillSource;
  /**
   * 🔴 **프리셋에 없어 시뮬레이션에 못 들어가는 티커.** 화면이 이 목록을 그대로 보여 준다 —
   * 조용히 빼면 사용자는 자기 포트폴리오의 일부가 계산에서 사라진 것을 모른다.
   *
   * ⚠ 판정은 `isSimulationKnownTicker` 다 — 프리필을 만드는 쪽과 **같은 함수**여야
   *   화면 설명과 실제 결과가 어긋나지 않는다.
   */
  readonly unknownTickers: readonly string[];
  /** 매입단가가 없어 프리셋 기준가로 값을 잰 티커. 비중이 실제와 다를 수 있다는 뜻이다. */
  readonly valuedByPresetPrice: readonly string[];
  /**
   * 환율을 몰라 값을 낼 수 없던 티커.
   *
   * ⚠ USD 와 KRW 를 그냥 더하면 값이 1,400배 어긋난다. 환율이 없으면 **섞지 않고 알린다.**
   */
  readonly unconvertible: readonly string[];
};

type UniverseEntry = { readonly initialPrice: number };

const presetPriceOf = (ticker: string): number | null => {
  const entry = (DIVIDEND_UNIVERSE as Record<string, UniverseEntry | undefined>)[
    normalizePortfolioTicker(ticker)
  ];
  return entry && Number.isFinite(entry.initialPrice) ? entry.initialPrice : null;
};

/**
 * 보유 기록을 프리필 재료로 옮긴다.
 *
 * @param fxRateKrwPerUsd 1 USD = N KRW. `KRW` 로 적힌 보유가 있을 때만 필요하다.
 *   없으면 그 종목들은 `unconvertible` 로 빠진다 — 임의의 환율을 가정하지 않는다.
 */
export const toPortfolioPrefillSource = (
  holdings: readonly HoldingInput[],
  fxRateKrwPerUsd: number | null
): LedgerPrefillSourceResult => {
  const sourceHoldings: PortfolioPrefillSourceHolding[] = [];
  const unknownTickers: string[] = [];
  const valuedByPresetPrice: string[] = [];
  const unconvertible: string[] = [];
  let totalValueUsd = 0;

  const hasFx = typeof fxRateKrwPerUsd === 'number' && Number.isFinite(fxRateKrwPerUsd) && fxRateKrwPerUsd > 0;

  for (const holding of holdings) {
    const ticker = normalizePortfolioTicker(holding.ticker);
    if (ticker.length === 0 || !Number.isFinite(holding.shares) || holding.shares <= 0) continue;

    const known = isSimulationKnownTicker(ticker);
    if (!known) unknownTickers.push(ticker);

    /* 단가 — 안 적었으면 프리셋 기준가(USD). 프리셋에도 없으면 값을 낼 방법이 없다. */
    let unit = holding.unitCost;
    let unitIsUsd = holding.currency !== 'KRW';
    if (unit === null || !Number.isFinite(unit) || unit <= 0) {
      const preset = presetPriceOf(ticker);
      if (preset === null) {
        /* 🔴 값을 못 내지만 티커는 알린다 — 조용히 사라지지 않게. */
        sourceHoldings.push({ ticker, valueUsd: 0, includedInTotals: false });
        continue;
      }
      unit = preset;
      unitIsUsd = true;
      valuedByPresetPrice.push(ticker);
    }

    if (!unitIsUsd) {
      if (!hasFx) {
        unconvertible.push(ticker);
        sourceHoldings.push({ ticker, valueUsd: 0, includedInTotals: false });
        continue;
      }
      unit /= fxRateKrwPerUsd as number;
    }

    const valueUsd = unit * holding.shares;
    if (!Number.isFinite(valueUsd) || valueUsd <= 0) {
      sourceHoldings.push({ ticker, valueUsd: 0, includedInTotals: false });
      continue;
    }

    /*
     * 🔴 `totalValueUsd` 는 **유니버스 밖 종목까지 포함한 총액**이다(프리필 계약의 정의).
     *    초기 투자금이 그 총액이라, 못 들어간 종목의 금액까지 남은 종목에 실린다 —
     *    그래서 화면이 `unknownTickers` 를 반드시 함께 보여 줘야 한다(무음 왜곡 금지).
     */
    totalValueUsd += valueUsd;
    sourceHoldings.push({ ticker, valueUsd, includedInTotals: true });
  }

  return {
    source: { totalValueUsd, holdings: sourceHoldings },
    unknownTickers,
    valuedByPresetPrice,
    unconvertible
  };
};
