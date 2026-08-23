// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import { resolveTickerPriceCurrency, toKrwUnitPrice } from '@/shared/lib/tickerPrice';

describe('resolveTickerPriceCurrency', () => {
  it('국내 상장 접미사(.KS/.KQ)는 원화다', () => {
    expect(resolveTickerPriceCurrency('069500.KS')).toBe('KRW');
    expect(resolveTickerPriceCurrency('123456.KQ')).toBe('KRW');
  });

  it('그 외는 전부 달러로 본다', () => {
    expect(resolveTickerPriceCurrency('SCHD')).toBe('USD');
    expect(resolveTickerPriceCurrency('QQQM')).toBe('USD');
  });
});

describe('toKrwUnitPrice', () => {
  it('국내 상장 종목은 환율 없이도 그대로 쓴다', () => {
    expect(toKrwUnitPrice({ ticker: 'TIGER.KS', price: 15_175, fxRate: null })).toBe(15_175);
  });

  it('미국 상장 종목은 환율을 곱한다', () => {
    // 사용자 신고 사례: QQQM 6000주가 181만원으로 잡히던 값이 25억으로 바로 선다.
    const unit = toKrwUnitPrice({ ticker: 'QQQM', price: 302.34, fxRate: 1_390 });
    expect(unit).toBeCloseTo(420_252.6, 4);
    expect((unit ?? 0) * 6000).toBeCloseTo(2_521_515_600, 0);
  });

  it('환율이 없으면 null 이다 — 원가격으로 대신하지 않는다', () => {
    // 302.34 를 그대로 돌려주면 주식 수가 환율배만큼 어긋난 채 조용히 계산된다.
    expect(toKrwUnitPrice({ ticker: 'QQQM', price: 302.34, fxRate: null })).toBeNull();
    expect(toKrwUnitPrice({ ticker: 'QQQM', price: 302.34, fxRate: 0 })).toBeNull();
    expect(toKrwUnitPrice({ ticker: 'QQQM', price: 302.34, fxRate: Number.NaN })).toBeNull();
  });

  it('주가가 0 이하거나 비유한이면 null 이다', () => {
    expect(toKrwUnitPrice({ ticker: 'QQQM', price: 0, fxRate: 1_390 })).toBeNull();
    expect(toKrwUnitPrice({ ticker: 'TIGER.KS', price: Number.NaN, fxRate: null })).toBeNull();
  });
});
