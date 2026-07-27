import { describe, expect, it } from 'vitest';
import { resolvePortfolioGoalBasis } from '@/pages/Portfolio/components';
import type { ResolvePortfolioGoalBasisInput } from '@/pages/Portfolio/components';

/**
 * 달성률 현재값의 **기준 판정**(순수 함수).
 *
 * 여기서 지키는 것은 표뿐 아니라 **순서**다: 보유를 먼저 보고 환율은 그 다음이다. 순서가 뒤집히면
 * 보유가 0인 사용자가 환율 조회를 기다리며 영영 골격만 보게 된다(값이 와도 폴백으로 갈 텐데도).
 * 환산은 이 함수 안에서 **딱 한 번** 일어나므로, 배수가 틀리면 화면 전체가 조용히 틀린다.
 */

const RATE = 1381;

const input = (overrides: Partial<ResolvePortfolioGoalBasisInput> = {}): ResolvePortfolioGoalBasisInput => ({
  holdingsStatus: 'ready',
  holdingsCount: 3,
  includedCount: 3,
  monthlyAfterTaxUsd: 100,
  fxStatus: 'success',
  fxRateKrwPerUsd: RATE,
  ...overrides
});

describe('resolvePortfolioGoalBasis — 판정표 7행', () => {
  it('보유를 읽는 중이면 pending', () => {
    expect(resolvePortfolioGoalBasis(input({ holdingsStatus: 'loading' }))).toEqual({ kind: 'pending' });
  });

  it('보유 저장소를 못 읽었으면 fallback:read-failed', () => {
    expect(resolvePortfolioGoalBasis(input({ holdingsStatus: 'read-error' }))).toEqual({
      kind: 'fallback',
      reason: 'read-failed'
    });
  });

  it('보유가 0종이면 fallback:no-holdings', () => {
    expect(resolvePortfolioGoalBasis(input({ holdingsCount: 0, includedCount: 0 }))).toEqual({
      kind: 'fallback',
      reason: 'no-holdings'
    });
  });

  it('행은 있는데 수량이 전부 비었으면 fallback:no-quantity (사용자가 할 일이 다르므로 분리한다)', () => {
    expect(resolvePortfolioGoalBasis(input({ includedCount: 0 }))).toEqual({
      kind: 'fallback',
      reason: 'no-quantity'
    });
  });

  it('환율 조회 중이면 pending (아직 실패한 게 아니다)', () => {
    expect(resolvePortfolioGoalBasis(input({ fxStatus: 'loading', fxRateKrwPerUsd: null }))).toEqual({
      kind: 'pending'
    });
  });

  it('환율이 없으면 fallback:fx-unavailable', () => {
    expect(resolvePortfolioGoalBasis(input({ fxStatus: 'error', fxRateKrwPerUsd: null }))).toEqual({
      kind: 'fallback',
      reason: 'fx-unavailable'
    });
  });

  it('그 외에는 measured — 달러 월배당을 원화로 딱 한 번 환산한다', () => {
    expect(resolvePortfolioGoalBasis(input())).toEqual({ kind: 'measured', amountKrw: 100 * RATE });
  });

  it('stale(값은 있고 갱신만 실패)도 measured다 — 값이 있으면 쓴다', () => {
    expect(resolvePortfolioGoalBasis(input({ fxStatus: 'stale' }))).toEqual({
      kind: 'measured',
      amountKrw: 100 * RATE
    });
  });
});

describe('resolvePortfolioGoalBasis — 순서 불변식', () => {
  it('보유가 없으면 환율을 기다리지 않는다 (fx loading 이어도 pending 이 아니라 no-holdings)', () => {
    const basis = resolvePortfolioGoalBasis(
      input({ holdingsCount: 0, includedCount: 0, fxStatus: 'loading', fxRateKrwPerUsd: null })
    );

    expect(basis).toEqual({ kind: 'fallback', reason: 'no-holdings' });
  });

  it('보유 읽기 실패는 환율 실패보다 먼저 잡힌다 (사유를 뭉치지 않는다)', () => {
    const basis = resolvePortfolioGoalBasis(
      input({ holdingsStatus: 'read-error', fxStatus: 'error', fxRateKrwPerUsd: null })
    );

    expect(basis).toEqual({ kind: 'fallback', reason: 'read-failed' });
  });

  it('수량 미입력은 환율 조회 중보다 먼저 잡힌다', () => {
    const basis = resolvePortfolioGoalBasis(
      input({ includedCount: 0, fxStatus: 'loading', fxRateKrwPerUsd: null })
    );

    expect(basis).toEqual({ kind: 'fallback', reason: 'no-quantity' });
  });
});
