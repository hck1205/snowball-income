// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import { DIVIDEND_UNIVERSE, KOREAN_DIVIDEND_TICKERS, PRESET_TICKER_KOREAN_NAME_BY_TICKER } from '@/shared/constants/presets';
import { KOREAN_TICKER_TAX_CATEGORY, isKoreanListedTicker } from '@/shared/constants/tax';

/**
 * 한국 상장 종목(2026-08-06 1차 12종)이 **다른 표들과 어긋나지 않는지** 잠근다.
 *
 * 이 종목들은 미국 종목과 다른 점이 셋이라 어긋날 자리가 많다:
 *  ① 티커에 **점이 들어간다**(`458730.KS`) — 정규식·키 가정이 있는 코드가 조용히 걸러 낼 수 있다
 *  ② 세법 갈래를 **사람이 채운다** — 종목을 늘리며 세금 표를 빠뜨리기 쉽다
 *  ③ 이름을 **사람이 적는다** — 야후 이름을 믿을 수 없어서다(korea-listing-feasibility §1)
 *
 * 🔴 이 파일은 값이 옳은지(배당률이 4.04% 가 맞는지)는 검사하지 않는다 — 그건 실측의 몫이고
 * 매달 바뀐다. 여기서 잠그는 것은 **표들 사이의 정합**이다.
 */
describe('한국 상장 종목', () => {
  const koreanTickers = Object.keys(KOREAN_DIVIDEND_TICKERS);

  it('실제로 수집됐다 (목록이 비면 아래 검사가 전부 무의미해진다)', () => {
    expect(koreanTickers.length).toBeGreaterThanOrEqual(12);
  });

  it('전부 국내 상장 표기(.KS/.KQ)를 갖는다', () => {
    for (const ticker of koreanTickers) {
      expect(isKoreanListedTicker(ticker), `${ticker} 에 거래소 접미사가 없다`).toBe(true);
    }
  });

  it('유니버스에 그대로 들어가 있다', () => {
    for (const ticker of koreanTickers) {
      expect(DIVIDEND_UNIVERSE[ticker as keyof typeof DIVIDEND_UNIVERSE], ticker).toBeDefined();
    }
  });

  /** 🔴 세금 표가 빠진 종목이 생기면 "국내 상장은 매매차익 비과세"라는 틀린 단순화가 화면에 나간다. */
  it('세법 갈래 표가 티커 목록과 정확히 같은 집합이다', () => {
    expect(Object.keys(KOREAN_TICKER_TAX_CATEGORY).sort()).toEqual([...koreanTickers].sort());
  });

  it('한글명이 비어 있지 않다', () => {
    for (const ticker of koreanTickers) {
      const korean = PRESET_TICKER_KOREAN_NAME_BY_TICKER[
        ticker as keyof typeof PRESET_TICKER_KOREAN_NAME_BY_TICKER
      ];
      expect(korean, `${ticker} 의 한글명이 없다`).toBeTruthy();
    }
  });

  /**
   * 🔴 정합 모델 불변식: `dividendYield + dividendGrowth === expectedTotalReturn`.
   * 미국 프리셋과 같은 규율이다 — 총수익 가정이 큐레이터의 값이고 성장률이 거기서 파생된다.
   * ⚠ 부동소수 오차가 있으므로 소수 둘째 자리에서 비교한다.
   */
  it('정합 모델 불변식을 만족한다 (배당률 + 성장률 = 총수익 가정)', () => {
    for (const [ticker, preset] of Object.entries(KOREAN_DIVIDEND_TICKERS)) {
      const sum = preset.dividendYield + preset.dividendGrowth;
      expect(Number(sum.toFixed(2)), `${ticker}: ${preset.dividendYield} + ${preset.dividendGrowth}`).toBe(
        preset.expectedTotalReturn
      );
    }
  });

  /** 가격은 원화라 미국 종목(수십~수백 달러)과 자릿수가 다르다 — 0 이나 음수는 수집 실패의 신호다. */
  it('가격과 배당률이 실측 가능한 범위에 있다', () => {
    for (const [ticker, preset] of Object.entries(KOREAN_DIVIDEND_TICKERS)) {
      expect(preset.initialPrice, `${ticker} 가격`).toBeGreaterThan(0);
      expect(preset.dividendYield, `${ticker} 배당률`).toBeGreaterThan(0);
      expect(preset.dividendYield, `${ticker} 배당률`).toBeLessThan(20);
    }
  });
});
