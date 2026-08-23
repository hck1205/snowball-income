import type { InvestmentSettings, TickerInput } from '@/shared/types';
import type { PortfolioSettings, PortfolioTickerInput } from './SnowballPortfolio';

/*
 * **엔진 입력을 만드는 곳.** 엔진 본체(`SnowballPortfolio`)와 갈라 둔 이유는 관심사다 —
 * 저쪽은 "월 루프를 어떻게 도는가", 여기는 "배분·라우팅을 엔진이 받는 모양으로 어떻게 옮기는가"다.
 *
 * 🔴 앱 화면과 공유 카드·PDF **두 경로가 이 파일 하나를 부른다.** 예전에 같은 매핑이 양쪽에
 *    복붙돼 있었고 그 복붙이 두 번 물었다(`toPortfolioTickerInputs` 머리말의 사고 기록).
 */

/** 저장 스키마(`PortfolioPersistedState`)의 라우팅 두 필드가 그대로 들어온다. */
export type PortfolioRoutingMaps = {
  reinvestPercentByTickerId?: Record<string, number>;
  reinvestTargetByTickerId?: Record<string, string>;
};

/** 배분 한 줄 — 엔진 입력에 필요한 종목 정보와 그 몫(0..1). 정규화는 호출부 책임이다. */
export type PortfolioAllocationEntry = {
  profile: TickerInput & { id: string };
  weight: number;
};

export type ToPortfolioTickerInputsParams = {
  entries: readonly PortfolioAllocationEntry[];
  /** 포트폴리오 전체 초기 투자금(원). 각 종목의 몫으로 쪼개진다. */
  initialInvestment: number;
  /** 포트폴리오 전체 월 적립금(원). 역산은 후보 금액을 여기에 넣어 되돌려 부른다. */
  monthlyContribution: number;
  routing?: PortfolioRoutingMaps;
};

/**
 * 배분 + 라우팅 → **엔진 입력**.
 *
 * 🔴 앱 화면(`pages/Main/utils/simulation`)과 공유 카드·PDF(`SnowballScenarioRun`)가 **이 함수
 *    하나**를 부른다. 예전에는 양쪽에 같은 매핑이 복붙돼 있었고, 그 복붙이 실제로 두 번 물었다:
 *     ① `accountType` 이 **양쪽 다** 빠져 있어 ISA 를 골라도 계산이 바뀌지 않았다.
 *     ② 배당 라우팅을 넣을 때 **앱에만** 붙어, 같은 링크가 화면과 공유 카드에서 다른 숫자를 낼
 *        뻔했다.
 *    필드를 하나 더할 때 한 곳만 고치면 되는 구조가 그 두 사고의 재발을 막는다.
 *
 * ⚠ 목적지는 **id 가 아니라 인덱스**로 넘긴다 — 엔진은 티커 id 를 모른다(순수 계산 계층이다).
 *   편입에서 빠진 종목을 가리키면 인덱스를 못 찾아 `undefined` 가 되고, 엔진이 자기 자신으로 되돌린다.
 */
export const toPortfolioTickerInputs = ({
  entries,
  initialInvestment,
  monthlyContribution,
  routing
}: ToPortfolioTickerInputsParams): PortfolioTickerInput[] => {
  const indexById = new Map(entries.map(({ profile }, index) => [profile.id, index]));

  return entries.map(({ profile, weight }) => {
    const targetId = routing?.reinvestTargetByTickerId?.[profile.id];
    const targetIndex = targetId === undefined ? undefined : indexById.get(targetId);
    const percent = routing?.reinvestPercentByTickerId?.[profile.id];

    return {
      ticker: {
        ticker: profile.ticker,
        initialPrice: profile.initialPrice,
        dividendYield: profile.dividendYield,
        dividendGrowth: profile.dividendGrowth,
        expectedTotalReturn: profile.expectedTotalReturn,
        frequency: profile.frequency
      },
      initialInvestment: initialInvestment * weight,
      monthlyContribution: monthlyContribution * weight,
      ...(targetIndex === undefined ? null : { reinvestTargetIndex: targetIndex }),
      ...(percent === undefined ? null : { reinvestPercent: percent })
    };
  });
};

/** 공통 설정에서 종목별로 쪼개지는 두 금액을 뺀다. 두 경로가 같은 모양을 손으로 만들지 않게 한다. */
export const toPortfolioSettings = (settings: InvestmentSettings): PortfolioSettings => ({
  targetMonthlyDividend: settings.targetMonthlyDividend,
  investmentStartDate: settings.investmentStartDate,
  durationYears: settings.durationYears,
  reinvestDividends: settings.reinvestDividends,
  reinvestDividendPercent: settings.reinvestDividendPercent,
  taxRate: settings.taxRate,
  reinvestTiming: settings.reinvestTiming,
  dpsGrowthMode: settings.dpsGrowthMode
});
