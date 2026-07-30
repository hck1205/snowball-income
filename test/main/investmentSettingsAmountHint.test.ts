// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import type { DisplayCurrencyView } from '@/jotai';
import { buildAmountHint } from '@/components/InvestmentSettings/InvestmentSettings.utils';

/**
 * 금액 입력 필드(초기 투자금·월 투자금·목표 월배당)의 달러 병기.
 *
 * 핵심 계약: **입력값은 언제나 원화**이고 달러는 읽기 전용 참고다. 그래서 이 함수는 문자열만
 * 만들 뿐 값을 바꾸지 않으며, 환율이 없으면 아무것도 내지 않는다(`$NaN` 경로 차단).
 */
const view = (over: Partial<DisplayCurrencyView> = {}): DisplayCurrencyView => ({
  currency: 'USD',
  preferred: 'USD',
  canUseUsd: true,
  rate: 1_478,
  asOf: '2026-07-23',
  status: 'success',
  ...over
});

describe('buildAmountHint — 원화 입력의 달러 병기', () => {
  it('달러 모드에서 환산값을 근사 기호와 함께 낸다', () => {
    expect(buildAmountHint(1_478_000, view())).toBe('≈ $1,000');
  });

  it('원화 모드에서는 아무것도 내지 않는다 (기본 모드에 노이즈 금지)', () => {
    expect(buildAmountHint(1_478_000, view({ currency: 'KRW', preferred: 'KRW' }))).toBeUndefined();
  });

  it('환율이 없으면 내지 않는다 — 여기서 나누면 $NaN 이다', () => {
    expect(buildAmountHint(1_478_000, view({ rate: null }))).toBeUndefined();
    // 선호가 달러여도 적용 통화가 원화로 폴백된 상태면 마찬가지다.
    expect(buildAmountHint(1_478_000, view({ currency: 'KRW', rate: null, canUseUsd: false }))).toBeUndefined();
  });

  it('0 이하·비유한 값에는 내지 않는다 ("≈ $0" 은 알려주는 게 없다)', () => {
    expect(buildAmountHint(0, view())).toBeUndefined();
    expect(buildAmountHint(-100, view())).toBeUndefined();
    expect(buildAmountHint(Number.NaN, view())).toBeUndefined();
    expect(buildAmountHint(Number.POSITIVE_INFINITY, view())).toBeUndefined();
  });
});
