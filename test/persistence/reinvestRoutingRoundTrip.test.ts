// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import type { PersistedScenarioState } from '@/jotai/snowball/types';
import type { PortfolioPersistedState, TickerProfile } from '@/shared/types/snowball';
import { decodeSharedScenario, encodeSharedScenario } from '@/pages/Main/hooks/persistence/shareLink';
import { normalizePersistedAppState } from '@/jotai/snowball/persistence';
import { EMPTY_INVESTMENT_SETTINGS } from '@/jotai';

/**
 * **배당 재투자 라우팅의 왕복 검증.**
 *
 * 🔴 저장 페이로드와 공유 URL 은 사용자 자산이다(CLAUDE.md "가장 조심할 것" #2). 라우팅 두 필드를
 *    더했으니 ① 새 값이 왕복해서 살아 돌아오는지 ② **옛 링크·옛 저장본이 그대로 열리는지** 를
 *    둘 다 지켜야 한다. 후자가 깨지면 남의 링크가 안 열린다.
 */

const profile = (id: string, ticker: string): TickerProfile => ({
  id,
  ticker,
  name: '',
  initialPrice: 100,
  dividendYield: 3,
  dividendGrowth: 5,
  expectedTotalReturn: 8,
  frequency: 'quarterly'
});

const portfolio = (overrides: Partial<PortfolioPersistedState> = {}): PortfolioPersistedState => ({
  tickerProfiles: [profile('a', 'SCHD'), profile('b', 'JEPI'), profile('c', 'QQQ')],
  includedTickerIds: ['a', 'b', 'c'],
  weightByTickerId: { a: 50, b: 30, c: 20 },
  fixedByTickerId: { a: false, b: false, c: false },
  selectedTickerId: 'a',
  ...overrides
});

const scenario = (portfolioState: PortfolioPersistedState): PersistedScenarioState => ({
  id: 'tab-1',
  name: '테스트 탭',
  portfolio: portfolioState,
  investmentSettings: { ...EMPTY_INVESTMENT_SETTINGS }
});

describe('공유 링크 왕복 — 배당 재투자 라우팅', () => {
  it('종목별 비율과 목적지가 그대로 살아 돌아온다', () => {
    const source = scenario(
      portfolio({
        reinvestPercentByTickerId: { a: 100, b: 0, c: 50 },
        /* QQQ 배당으로 SCHD 를 산다 — 종목을 건너가는 값이 링크에 실리는지가 핵심이다. */
        reinvestTargetByTickerId: { c: 'a' }
      })
    );

    const decoded = decodeSharedScenario(encodeSharedScenario(source));

    expect(decoded).not.toBeNull();
    expect(decoded?.portfolio.reinvestPercentByTickerId).toEqual({
      'shared-0': 100,
      'shared-1': 0,
      'shared-2': 50
    });
    /* id 는 인덱스 기반으로 다시 붙는다 — **가리키는 대상**이 보존되는지가 계약이다. */
    expect(decoded?.portfolio.reinvestTargetByTickerId).toEqual({ 'shared-2': 'shared-0' });
  });

  it('라우팅이 없으면 링크에 아무 키도 싣지 않는다 (종전 링크와 같은 길이)', () => {
    const withoutRouting = encodeSharedScenario(scenario(portfolio()));
    const withEmptyRouting = encodeSharedScenario(
      scenario(portfolio({ reinvestPercentByTickerId: {}, reinvestTargetByTickerId: {} }))
    );

    expect(withEmptyRouting).toBe(withoutRouting);
  });

  it('목적지가 자기 자신이면 싣지 않는다 — 그게 기본값이다', () => {
    const selfTargeted = encodeSharedScenario(
      scenario(portfolio({ reinvestTargetByTickerId: { a: 'a', b: 'b' } }))
    );

    expect(selfTargeted).toBe(encodeSharedScenario(scenario(portfolio())));
  });

  it('🔴 라우팅을 모르는 옛 링크가 그대로 열린다', () => {
    /* 이 필드들이 없던 시절에 만들어진 링크와 같은 모양이다. */
    const legacyLink = encodeSharedScenario(scenario(portfolio()));

    const decoded = decodeSharedScenario(legacyLink);

    expect(decoded).not.toBeNull();
    expect(decoded?.portfolio.tickerProfiles).toHaveLength(3);
    /* 빈 맵이어야 한다 — `undefined` 로 두면 소비처마다 `?? {}` 를 다시 써야 한다. */
    expect(decoded?.portfolio.reinvestPercentByTickerId).toEqual({});
    expect(decoded?.portfolio.reinvestTargetByTickerId).toEqual({});
  });
});

describe('저장본 정규화 — 배당 재투자 라우팅', () => {
  const normalize = (portfolioState: PortfolioPersistedState) =>
    normalizePersistedAppState({
      scenarios: [scenario(portfolioState)],
      activeScenarioId: 'tab-1'
    })?.scenarios[0].portfolio;

  it('살아 있는 종목의 값만 남긴다', () => {
    const result = normalize(
      portfolio({
        reinvestPercentByTickerId: { a: 70, ghost: 50 },
        reinvestTargetByTickerId: { a: 'b', ghost: 'a' }
      })
    );

    expect(result?.reinvestPercentByTickerId).toEqual({ a: 70 });
    expect(result?.reinvestTargetByTickerId).toEqual({ a: 'b' });
  });

  it('없는 종목을 가리키는 목적지는 버린다 (= 자기 자신으로 떨어진다)', () => {
    const result = normalize(portfolio({ reinvestTargetByTickerId: { a: 'ghost' } }));

    expect(result?.reinvestTargetByTickerId).toEqual({});
  });

  it('범위를 벗어난 비율은 버린다 (= 전역값으로 떨어진다)', () => {
    const result = normalize(
      portfolio({ reinvestPercentByTickerId: { a: 140, b: -10, c: Number.NaN } })
    );

    expect(result?.reinvestPercentByTickerId).toEqual({});
  });

  it('🔴 라우팅이 없던 옛 저장본이 그대로 열린다', () => {
    const result = normalize(portfolio());

    expect(result?.tickerProfiles).toHaveLength(3);
    expect(result?.reinvestPercentByTickerId).toEqual({});
    expect(result?.reinvestTargetByTickerId).toEqual({});
  });
});
