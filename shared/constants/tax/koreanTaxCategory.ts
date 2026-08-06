/**
 * 국내 상장 종목의 **세법상 갈래**(2026-08-06 신설).
 *
 * 🔴 이 파일이 프리셋 폴더가 아니라 여기 있는 이유는 둘이다: ①이건 시세가 아니라 **세금 사실**이고
 * ②프리셋 파일은 "객체 export 하나"만 허용된다(`test/presets/presetTickerSingleSource.test.ts` 가
 * 그 규칙을 잠근다 — 파일마다 정의가 하나여야 티커의 단일 원천이 유지된다).
 *
 * ## 왜 갈래가 필요한가 — 🔴 "국내 상장이니 매매차익 비과세"는 **틀린 단순화**다
 * TIGER 미국배당다우존스처럼 국내에 상장됐지만 기초자산이 해외인 ETF 는 **매매차익도 배당소득세로
 * 과세**된다. 국내 주식과 같다고 넘겨짚으면 세부담이 크게 낮게 나온다
 * (근거·표 [docs/korea-listing-feasibility.md](../../../docs/korea-listing-feasibility.md) §3-2).
 *
 * ⚠ **자동 판정하지 마라.** 기초자산이 해외인지는 티커만 봐서는 알 수 없다 — 사람이 채운다.
 * ⚠ 아직 **엔진은 이 값을 읽지 않는다.** 배당세율은 사용자가 폼에서 하나로 넣는다. 종목별 분기는
 *   계산 정확성 영역이라 테스트를 먼저 쓰고 옮긴다(feasibility §4 의 2단계).
 */
export type KoreanTaxCategory =
  /** 국내 주식·리츠·인프라. 배당 15.4% · 매매차익 비과세(대주주 제외). */
  | 'domestic-stock'
  /** 국내 상장 **해외** ETF. 배당 15.4% + **매매차익도 배당소득세로 과세**(가장 흔한 오해). */
  | 'domestic-listed-foreign-etf'
  /** 국내 상장 국내 ETF. 배당 15.4% · 국내주식형은 매매차익 비과세. */
  | 'domestic-listed-domestic-etf';

/** 국내 배당소득세율(%). 소득세 14% + 지방소득세 1.4%. 세 갈래 모두 배당에는 이 세율이 붙는다. */
export const KOREAN_DIVIDEND_TAX_RATE = 15.4;

/**
 * 티커별 갈래. 키는 야후 심볼(`종목코드.KS`)이고 `KOREAN_DIVIDEND_TICKERS` 와 **같은 집합**이어야 한다
 * — 어긋나면 세금 설명이 빠진 종목이 조용히 생긴다(`test/presets` 의 한국 종목 검사가 잡는다).
 */
export const KOREAN_TICKER_TAX_CATEGORY: Record<string, KoreanTaxCategory> = {
  '458730.KS': 'domestic-listed-foreign-etf',
  '402970.KS': 'domestic-listed-foreign-etf',
  '483290.KS': 'domestic-listed-foreign-etf',
  '161510.KS': 'domestic-listed-domestic-etf',
  '279530.KS': 'domestic-listed-domestic-etf',
  '104530.KS': 'domestic-listed-domestic-etf',
  '210780.KS': 'domestic-listed-domestic-etf',
  '211560.KS': 'domestic-listed-domestic-etf',
  '088980.KS': 'domestic-stock',
  '033780.KS': 'domestic-stock',
  '316140.KS': 'domestic-stock',
  '105560.KS': 'domestic-stock'
};

/** 국내 상장 종목인가. 티커 표기(`.KS`/`.KQ`)가 곧 그 사실이다. */
export const isKoreanListedTicker = (ticker: string): boolean =>
  ticker.endsWith('.KS') || ticker.endsWith('.KQ');
