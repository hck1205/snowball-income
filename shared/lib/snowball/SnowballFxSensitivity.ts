/**
 * **환율 민감도** — 이 계산이 환율에 얼마나 흔들리는지를 말하는 순수 계층.
 *
 * ## 왜 "환율 입력"이 아니라 "민감도"인가 (2026-08-14 결정)
 * 엔진은 **가격 단위에 대해 척도 불변**이다:
 *
 *   주식수 = 적립금 ÷ 주가,  주당배당 = 주가 × 배당률
 *   → 연배당 = 주식수 × 주당배당 = (적립금 ÷ 주가) × (주가 × 배당률) = 적립금 × 배당률
 *
 * 주가 단위가 소거되므로 **환율을 하나 곱해도 결과는 그대로다.** 결과를 실제로 바꾸려면 환율이
 * **둘**(매수 시점 / 평가 시점)이어야 하고, 그건 사용자에게 **20년 뒤 환율을 찍으라고 요구**하는 것이다.
 *
 * 🔴 그렇게 하지 않기로 했다. 환율은 이 모델의 어떤 변수보다 예측 불가능한데(배당성장률은 최소한
 * 기업 실적이라는 근거가 있다), 입력칸을 만들면 찍은 숫자가 결과에 굵게 실린다 — 기획서 결함 5가
 * 경고한 "단일 숫자가 실제보다 높은 정밀도를 암시한다"의 가장 심한 형태를 새로 만드는 셈이고,
 * 이 사이트의 자산인 "트레이드오프를 먼저 말하는 톤"과 정면으로 어긋난다.
 *
 * 대신 **상수 배율이라는 성질을 숨기지 않고 드러내서** 쓴다 — 환율이 x% 움직이면 원화 결과도
 * 그만큼 움직인다는 사실을 그대로 말한다. 아무에게도 예측을 시키지 않고 같은 정보를 전달한다.
 *
 * ⚠ 폼 스키마·공유 URL·영속 페이로드를 건드리지 않는다. 표시 계층에서 끝난다.
 */
import { isKoreanListedTicker } from '@/shared/constants/tax';

/** 민감도 안내에 쓰는 변동 폭(%). ±10% 는 원/달러가 실제로 한두 해에 오가는 범위다. */
export const FX_SENSITIVITY_PERCENT = 10;

export type FxSensitivityInput = {
  /** 계산에 포함된 종목 티커들. */
  tickers: readonly string[];
  /** 현재 환율(1 USD = N KRW). 조회 실패·로딩이면 `null`. */
  fxRate: number | null;
};

export type FxSensitivityModel = {
  /** 안내를 낼 것인가. 해외 상장 종목이 없으면 환율은 이 계산과 무관하다. */
  visible: boolean;
  /** 해외(미국) 상장으로 판정된 종목 수. */
  foreignTickerCount: number;
  /** 현재 환율. `visible` 이어도 조회 전이면 `null` 일 수 있다. */
  fxRate: number | null;
  /** 안내 문구에 쓰는 변동 폭(%). */
  swingPercent: number;
};

/**
 * 환율 안내를 낼지, 어떤 값으로 낼지 정한다.
 *
 * 🔴 **국내 상장 종목만 담은 포트폴리오에는 내지 않는다.** 원화로 사서 원화로 배당받는 사람에게
 * 환율 경고는 사실이 아니고, 맞지 않는 경고는 다른 경고의 신뢰까지 깎는다.
 * 판정은 세율과 **같은 근거**(`isKoreanListedTicker` — `.KS`/`.KQ` 표기)를 쓴다. 두 곳이 갈리면
 * "세금은 국내로 계산했는데 환율 경고는 나오는" 모순이 생긴다.
 */
export const buildFxSensitivityModel = ({ tickers, fxRate }: FxSensitivityInput): FxSensitivityModel => {
  const foreignTickerCount = tickers.filter((ticker) => !isKoreanListedTicker(ticker)).length;

  return {
    visible: foreignTickerCount > 0,
    foreignTickerCount,
    fxRate,
    swingPercent: FX_SENSITIVITY_PERCENT
  };
};
