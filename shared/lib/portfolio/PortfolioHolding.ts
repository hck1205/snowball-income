/**
 * 보유 행(티커·수량·세율)의 **정규화 규칙** — 입력 계층(폼·영속)과 계산 계층이 공유한다.
 *
 * 같은 규칙을 두 곳에서 따로 구현하면 "화면엔 120주인데 합계는 119.9999주" 같은 어긋남이 조용히
 * 생긴다. 그래서 계산 엔진이 규칙을 소유하고 입력 계층이 이걸 재사용한다.
 */

/**
 * 수량의 유효 소수 자릿수. 국내 증권사 해외주식 **소수점 매매**가 보편이라 0.0001주 단위를 받는다
 * (정수 강제는 소수점 투자자의 입력을 막는다).
 */
export const PORTFOLIO_QUANTITY_DECIMALS = 4;

const QUANTITY_SCALE = 10 ** PORTFOLIO_QUANTITY_DECIMALS;

/**
 * 기본 세율(%). **시뮬레이터와 같은 15.4** 를 쓴다(사용자 결정) — 화면 간 숫자가 갈리지 않게.
 *
 * ⚠ 엔진의 `toTaxRate`(SnowballRates)는 미입력을 **0%** 로 보는 반면 여기는 **15.4%** 로 본다.
 * 시뮬레이터는 "세율을 안 적었으면 세전으로 보여준다"가 계약이고, Portfolio 는 "세후가 기본"이라
 * 의도적으로 다르다. 두 함수를 섞어 쓰지 말 것.
 */
export const DEFAULT_PORTFOLIO_TAX_RATE_PERCENT = 15.4;

/** 대문자·트림된 심볼. 비문자열·빈 문자열은 `''`(= 매칭 실패)로 떨어진다. */
export const normalizePortfolioTicker = (ticker: string): string =>
  typeof ticker === 'string' ? ticker.trim().toUpperCase() : '';

/**
 * 유효 수량 또는 `null`.
 *
 * `null` 은 **에러가 아니라 "미입력"** 이다(사용자 결정): 0·음수·NaN·Infinity·비숫자는 전부 합계에서
 * 빠지고 그 사실이 사유로 보고된다. 저장 데이터·URL 은 신뢰할 수 없는 입력이라 타입만 믿지 않는다.
 *
 * 소수 4자리로 **반올림**한다 — 화면에 보이는 수량과 합계의 근거가 같아야 하기 때문이고,
 * 반올림 결과가 0 이 되는 값(1e-9 주)은 미입력과 같게 취급한다.
 */
export const normalizePortfolioQuantity = (quantity: number): number | null => {
  if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity <= 0) return null;

  const rounded = Math.round(quantity * QUANTITY_SCALE) / QUANTITY_SCALE;

  return rounded > 0 ? rounded : null;
};

/** 세율(%) 정규화. 미입력·무효는 기본값, 범위는 0..100 으로 clamp. */
export const normalizePortfolioTaxRatePercent = (taxRatePercent: number | undefined): number => {
  if (typeof taxRatePercent !== 'number' || !Number.isFinite(taxRatePercent)) {
    return DEFAULT_PORTFOLIO_TAX_RATE_PERCENT;
  }

  return Math.min(100, Math.max(0, taxRatePercent));
};

/**
 * 저장된 세율 → **사용자 지정 오버라이드**(없으면 `null` = 종목별 세법 기준).
 *
 * 🔴 **레거시 `15.4` 는 `null`(자동)로 읽는다.** 그 값은 사용자가 고른 것이 아니라 예전 기본값이
 * 그대로 굳은 것이고, 지금 기준으로는 미국 상장 종목에 0.4%p 과대 계상이다. 손대지 않은 기본값을
 * "의도적 지정"으로 대접하면 이번 수정이 **기존 사용자 전원에게 닿지 않는다**(2026-08-14 사용자 결정
 * — 지금 세법 기준 수치로 맞춘다).
 *
 * ⚠ 정확히 15.4 를 **일부러** 넣은 사용자는 자동으로 넘어간다. 그래도 국내 상장 종목에는 여전히
 * 15.4 가 적용되므로 그 사용자의 숫자가 틀려지지는 않는다 — 미국 종목이 15.0 으로 바로잡힐 뿐이다.
 */
export const toPortfolioTaxOverride = (taxRatePercent: number | undefined | null): number | null => {
  if (typeof taxRatePercent !== 'number' || !Number.isFinite(taxRatePercent)) return null;
  if (taxRatePercent === DEFAULT_PORTFOLIO_TAX_RATE_PERCENT) return null;

  return Math.min(100, Math.max(0, taxRatePercent));
};
