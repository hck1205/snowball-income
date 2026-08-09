// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import {
  PORTFOLIO_PREFILL_MAX_HOLDINGS,
  PORTFOLIO_PREFILL_MAX_INITIAL_INVESTMENT_KRW,
  PORTFOLIO_PREFILL_WEIGHT_TOTAL,
  buildPortfolioSimulationPrefillState,
  hasPortfolioSimulationPrefillRequest,
  isSimulationKnownTicker,
  readPortfolioSimulationPrefillRequest,
  sanitizePortfolioSimulationPrefill,
  type PortfolioPrefillSource
} from '@/shared/constants';
import { DIVIDEND_UNIVERSE } from '@/shared/constants/presets';

/**
 * "내 포트폴리오" → 시뮬레이터 **프리필 계약**.
 *
 * `location.state`는 히스토리를 조작하면 아무 값이나 될 수 있는 신뢰 불가 입력이라, 여기서 잡아야 할
 * 회귀는 넷이다: ①보내는 쪽과 받는 쪽의 검증 규칙이 갈리는 것 ②비중 합이 100에서 벗어난 채 커밋돼
 * 포트폴리오가 조용히 왜곡되는 것 ③NaN·거대값이 통과해 `setField`로 영속된 뒤 정규화가 기본값으로
 * 바꿔치기하는 것(사용자에겐 "내가 넣은 값이 사라졌다") ④유니버스 밖 종목이 비중을 먹는 것.
 */

/** 실제 유니버스에 없는(그래서 프리필에서 빠져야 하는) 심볼. */
const UNKNOWN_TICKER = 'ZZZZ';

const source = (
  holdings: PortfolioPrefillSource['holdings'],
  totalValueUsd = holdings.reduce((sum, holding) => sum + holding.valueUsd, 0)
): PortfolioPrefillSource => ({ totalValueUsd, holdings });

const held = (ticker: string, valueUsd: number, includedInTotals = true) => ({
  ticker,
  valueUsd,
  includedInTotals
});

describe('sanitizePortfolioSimulationPrefill — 신뢰 불가 입력 방어', () => {
  it('정상 페이로드는 그대로 통과하고 비중 합이 100이다', () => {
    const sanitized = sanitizePortfolioSimulationPrefill({
      initialInvestmentKrw: 12_345_678,
      holdings: [
        { ticker: 'SCHD', weightPercent: 70 },
        { ticker: 'JEPI', weightPercent: 30 }
      ]
    });

    expect(sanitized).toEqual({
      initialInvestmentKrw: 12_345_678,
      holdings: [
        { ticker: 'SCHD', weightPercent: 70 },
        { ticker: 'JEPI', weightPercent: 30 }
      ]
    });
  });

  it('sanitize는 멱등이다 — 보내는 쪽 출력이 받는 쪽에서 다시 바뀌지 않는다', () => {
    const once = sanitizePortfolioSimulationPrefill({
      initialInvestmentKrw: 1_000_000,
      holdings: [
        { ticker: 'SCHD', weightPercent: 1 },
        { ticker: 'JEPI', weightPercent: 2 }
      ]
    });
    const twice = sanitizePortfolioSimulationPrefill(once);

    expect(twice).toEqual(once);
  });

  it('합이 100이 아니면 비율을 유지한 채 100으로 재정규화한다', () => {
    const sanitized = sanitizePortfolioSimulationPrefill({
      initialInvestmentKrw: 0,
      holdings: [
        { ticker: 'SCHD', weightPercent: 30 },
        { ticker: 'JEPI', weightPercent: 10 }
      ]
    });

    expect(sanitized?.holdings.map((holding) => holding.weightPercent)).toEqual([75, 25]);
  });

  it('같은 티커가 여러 번 오면 합산한다 (버리면 그만큼 비중이 증발한다)', () => {
    const sanitized = sanitizePortfolioSimulationPrefill({
      initialInvestmentKrw: 0,
      holdings: [
        { ticker: 'SCHD', weightPercent: 20 },
        { ticker: 'schd', weightPercent: 20 },
        { ticker: 'JEPI', weightPercent: 60 }
      ]
    });

    expect(sanitized?.holdings).toEqual([
      { ticker: 'SCHD', weightPercent: 40 },
      { ticker: 'JEPI', weightPercent: 60 }
    ]);
  });

  it.each([
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['음수', -10],
    ['0', 0],
    ['문자열', '50'],
    ['100 초과', 101]
  ])('비중이 %s인 항목은 버리고 나머지로 100을 맞춘다', (_label, weightPercent) => {
    const sanitized = sanitizePortfolioSimulationPrefill({
      initialInvestmentKrw: 0,
      holdings: [
        { ticker: 'SCHD', weightPercent },
        { ticker: 'JEPI', weightPercent: 40 }
      ]
    });

    expect(sanitized?.holdings).toEqual([{ ticker: 'JEPI', weightPercent: 100 }]);
  });

  it.each([
    ['빈 문자열', ''],
    ['공백만', '   '],
    ['숫자', 123],
    ['너무 긴 심볼', 'ABCDEFGHIJK'],
    ['이상한 문자', 'SC HD']
  ])('티커가 %s면 그 항목만 버린다', (_label, ticker) => {
    const sanitized = sanitizePortfolioSimulationPrefill({
      initialInvestmentKrw: 0,
      holdings: [
        { ticker, weightPercent: 50 },
        { ticker: 'JEPI', weightPercent: 50 }
      ]
    });

    expect(sanitized?.holdings).toEqual([{ ticker: 'JEPI', weightPercent: 100 }]);
  });

  it.each([
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['음수', -1],
    ['문자열', '1000000'],
    ['상한 초과', PORTFOLIO_PREFILL_MAX_INITIAL_INVESTMENT_KRW + 1],
    ['없음', undefined]
  ])('초기 투자금이 %s면 **전체**를 거부한다 (절반만 커밋 금지)', (_label, initialInvestmentKrw) => {
    expect(
      sanitizePortfolioSimulationPrefill({
        initialInvestmentKrw,
        holdings: [{ ticker: 'SCHD', weightPercent: 100 }]
      })
    ).toBeNull();
  });

  it('상한 자체는 통과한다 (경계 포함)', () => {
    const sanitized = sanitizePortfolioSimulationPrefill({
      initialInvestmentKrw: PORTFOLIO_PREFILL_MAX_INITIAL_INVESTMENT_KRW,
      holdings: [{ ticker: 'SCHD', weightPercent: 100 }]
    });

    expect(sanitized?.initialInvestmentKrw).toBe(PORTFOLIO_PREFILL_MAX_INITIAL_INVESTMENT_KRW);
  });

  it.each([
    ['null', null],
    ['배열이 아님', { initialInvestmentKrw: 0, holdings: 'SCHD' }],
    ['빈 배열', { initialInvestmentKrw: 0, holdings: [] }],
    ['전부 무효', { initialInvestmentKrw: 0, holdings: [{ ticker: '', weightPercent: Number.NaN }] }]
  ])('%s이면 null', (_label, value) => {
    expect(sanitizePortfolioSimulationPrefill(value)).toBeNull();
  });

  it('상한을 넘는 거대 배열은 순회조차 하지 않고 거부한다', () => {
    const holdings = Array.from({ length: PORTFOLIO_PREFILL_MAX_HOLDINGS + 1 }, () => ({
      ticker: 'SCHD',
      weightPercent: 1
    }));

    expect(sanitizePortfolioSimulationPrefill({ initialInvestmentKrw: 0, holdings })).toBeNull();
  });
});

describe('location.state 읽기 — 요청 판정', () => {
  it('요청이 실려 오면 검증 통과분을 돌려준다', () => {
    const state = { portfolioSimulationPrefill: { initialInvestmentKrw: 10, holdings: [{ ticker: 'SCHD', weightPercent: 100 }] } };

    expect(hasPortfolioSimulationPrefillRequest(state)).toBe(true);
    expect(readPortfolioSimulationPrefillRequest(state)).toEqual({
      initialInvestmentKrw: 10,
      holdings: [{ ticker: 'SCHD', weightPercent: 100 }]
    });
  });

  it.each([
    ['null', null],
    ['다른 요청(목표 포커스)', { focusTargetMonthlyDividend: true }],
    ['모양이 다름', { portfolioSimulationPrefill: 'yes' }]
  ])('%s은 요청으로 오인하지 않는다', (_label, state) => {
    expect(hasPortfolioSimulationPrefillRequest(state)).toBe(false);
    expect(readPortfolioSimulationPrefillRequest(state)).toBeNull();
  });

  it('요청 모양은 맞지만 값이 이상하면 null (커밋하지 않는다)', () => {
    const state = { portfolioSimulationPrefill: { initialInvestmentKrw: Number.NaN, holdings: [] } };

    expect(hasPortfolioSimulationPrefillRequest(state)).toBe(true);
    expect(readPortfolioSimulationPrefillRequest(state)).toBeNull();
  });
});

describe('buildPortfolioSimulationPrefillState — 보내는 쪽', () => {
  it('평가금액 비중으로 100을 만들고 총액을 환율로 환산한다', () => {
    const state = buildPortfolioSimulationPrefillState({
      summary: source([held('SCHD', 700), held('JEPI', 300)]),
      fxRateKrwPerUsd: 1_400
    });

    expect(state?.portfolioSimulationPrefill.holdings).toEqual([
      { ticker: 'SCHD', weightPercent: 70 },
      { ticker: 'JEPI', weightPercent: 30 }
    ]);
    expect(state?.portfolioSimulationPrefill.initialInvestmentKrw).toBe(1_000 * 1_400);
  });

  it('비중은 환율과 무관하다 (분자·분모에서 소거된다)', () => {
    const holdings = [held('SCHD', 700), held('JEPI', 300)];
    const cheap = buildPortfolioSimulationPrefillState({ summary: source(holdings), fxRateKrwPerUsd: 1 });
    const pricey = buildPortfolioSimulationPrefillState({ summary: source(holdings), fxRateKrwPerUsd: 9_999 });

    expect(cheap?.portfolioSimulationPrefill.holdings).toEqual(pricey?.portfolioSimulationPrefill.holdings);
  });

  it('유니버스 밖 종목은 비중에서 빼고 남은 비중을 100으로 재정규화한다', () => {
    const state = buildPortfolioSimulationPrefillState({
      summary: source([held('SCHD', 300), held(UNKNOWN_TICKER, 700)]),
      fxRateKrwPerUsd: 1_000
    });

    expect(isSimulationKnownTicker(UNKNOWN_TICKER)).toBe(false);
    expect(state?.portfolioSimulationPrefill.holdings).toEqual([{ ticker: 'SCHD', weightPercent: 100 }]);
    // 초기 투자금은 **총 평가금액** 기준이다(제외 종목 포함) — 화면이 제외 사실을 함께 알려야 한다.
    expect(state?.portfolioSimulationPrefill.initialInvestmentKrw).toBe(1_000_000);
  });

  it.each([
    ['합계에서 빠진 행(수량 미입력 등)', held('JEPI', 500, false)],
    ['평가금액 0', held('JEPI', 0)],
    ['평가금액 NaN', held('JEPI', Number.NaN)]
  ])('%s은 비중에 넣지 않는다', (_label, excluded) => {
    const state = buildPortfolioSimulationPrefillState({
      summary: source([held('SCHD', 500), excluded], 1_000),
      fxRateKrwPerUsd: 1_000
    });

    expect(state?.portfolioSimulationPrefill.holdings).toEqual([{ ticker: 'SCHD', weightPercent: 100 }]);
  });

  it.each([
    ['null(조회 실패)', null],
    ['0', 0],
    ['음수', -1_400],
    ['NaN', Number.NaN]
  ])('환율이 %s이면 프리필을 만들지 않는다 (가짜 환율 금지)', (_label, fxRateKrwPerUsd) => {
    expect(
      buildPortfolioSimulationPrefillState({
        summary: source([held('SCHD', 1_000)]),
        fxRateKrwPerUsd
      })
    ).toBeNull();
  });

  it('시뮬레이터가 아는 종목이 하나도 없으면 null', () => {
    expect(
      buildPortfolioSimulationPrefillState({
        summary: source([held(UNKNOWN_TICKER, 1_000)]),
        fxRateKrwPerUsd: 1_400
      })
    ).toBeNull();
  });

  it('환산액이 상한을 넘으면 프리필을 만들지 않는다 (환산 사고 방어)', () => {
    expect(
      buildPortfolioSimulationPrefillState({
        summary: source([held('SCHD', PORTFOLIO_PREFILL_MAX_INITIAL_INVESTMENT_KRW)]),
        fxRateKrwPerUsd: 1_400
      })
    ).toBeNull();
  });

  it('보내는 쪽 출력은 받는 쪽 검증을 그대로 통과한다 (같은 sanitize 공유)', () => {
    const state = buildPortfolioSimulationPrefillState({
      summary: source([held('SCHD', 123.45), held('JEPI', 67.89), held('O', 10.11)]),
      fxRateKrwPerUsd: 1_386.5
    });

    const received = readPortfolioSimulationPrefillRequest(state);
    expect(received).toEqual(state?.portfolioSimulationPrefill);

    const total = (received?.holdings ?? []).reduce((sum, holding) => sum + holding.weightPercent, 0);
    expect(total).toBeCloseTo(PORTFOLIO_PREFILL_WEIGHT_TOTAL, 9);
  });

  it('주입한 유니버스로 판정한다 (실제 유니버스 변화에 흔들리지 않는다)', () => {
    const state = buildPortfolioSimulationPrefillState({
      summary: source([held('AAA', 400), held('BBB', 600)]),
      fxRateKrwPerUsd: 1_000,
      universe: { AAA: {} }
    });

    expect(state?.portfolioSimulationPrefill.holdings).toEqual([{ ticker: 'AAA', weightPercent: 100 }]);
  });
});

describe('isSimulationKnownTicker', () => {
  it('유니버스 심볼은 대소문자·공백과 무관하게 인식한다', () => {
    expect(isSimulationKnownTicker(' schd ')).toBe(true);
    expect(isSimulationKnownTicker('SCHD')).toBe(true);
  });

  it('유니버스에 없으면 false — 화면의 "제외 안내"와 실제 프리필이 같은 규칙을 쓴다', () => {
    expect(isSimulationKnownTicker(UNKNOWN_TICKER)).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(DIVIDEND_UNIVERSE, UNKNOWN_TICKER)).toBe(false);
  });

  it('프로토타입 체인 속성은 티커로 인정하지 않는다', () => {
    expect(isSimulationKnownTicker('constructor')).toBe(false);
    expect(isSimulationKnownTicker('toString')).toBe(false);
  });
});
