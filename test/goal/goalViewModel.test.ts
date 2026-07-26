import { describe, expect, it } from 'vitest';
import { buildGoalLiveMessage, buildGoalViewModel, toProgressBucket } from '@/pages/Goal/GoalPage';
import type { GoalScenarioViewModel } from '@/pages/Goal/hooks';
import { GOAL_COPY } from '@/pages/Goal/copy';

/**
 * 화면 모델(순수 함수)의 **경계값 계약**.
 *
 * 페이지 행동 테스트(goalPageStates)로는 만들 수 없는 값들을 여기서 만든다 — 달성률이 반올림으로
 * 100%가 되는 순간처럼, 실제 시계열로는 정확히 맞추기 어려운 지점이 그렇다. 이 경계에서
 * "100%로 보이는데 아직 못 닿았다"가 도달 문구로 새면 사용자는 목표를 이룬 줄 안다.
 */

const formatAmount = (value: number) => `₩${value.toLocaleString('ko-KR')}`;

const baseGoal = (overrides: Partial<GoalScenarioViewModel> = {}): GoalScenarioViewModel => ({
  status: 'reached',
  isLoading: false,
  errorReason: null,
  scenarioName: '내 포트폴리오',
  tickers: ['SCHD'],
  tickerCount: 1,
  conditions: {
    initialInvestment: 100_000_000,
    monthlyContribution: 1_000_000,
    durationYears: 20,
    investmentStartDate: '2024-01-01',
    reinvestDividends: true,
    reinvestDividendPercent: 100,
    taxRate: 15.4,
    tickerCount: 1
  },
  hasTarget: true,
  targetMonthlyDividend: 1_000_000,
  currentAmount: 996_000,
  currentMode: 'trailing12m',
  isCurrentFallback: false,
  currentAsOf: { year: 2026, month: 6 },
  progressRatio: 0.996,
  // 0.996 → 반올림하면 100. 표시 숫자와 도달 판정이 갈리는 유일한 구간이다.
  progressPercent: 100,
  reachedMonth: { year: 2031, month: 4, monthIndex: 88, monthlyDividend: 1_000_100 },
  reachedYearIndex: 8,
  isAlreadyReached: false,
  evaluatedAt: { year: 2026, month: 6 },
  ...overrides
});

describe('buildGoalViewModel — 달성률 100% 표시가 "도달"로 새지 않는다', () => {
  it('99.6%가 100%로 반올림돼도 병기 문장은 "아직 오는 중"이다', () => {
    const model = buildGoalViewModel({ goal: baseGoal(), formatAmount });

    expect(model.meter?.percent).toBe(100);
    // 도달 문구는 오직 엔진 판정(isAlreadyReached)에만 붙는다.
    expect(model.meter?.sentence).toBe(GOAL_COPY.meter.sentence('₩1,000,000', '₩996,000'));
    expect(model.meter?.sentence).not.toContain('도달했습니다');
    // 예상 달성은 여전히 **미래 시점**으로 남는다("이미 달성"이 아니다).
    expect(model.eta?.value).toBe(GOAL_COPY.tiles.etaMonth(2031, 4));
    expect(model.eta?.value).not.toBe(GOAL_COPY.tiles.etaAlready);
    expect(model.statusLine).toEqual({
      tone: 'success',
      text: GOAL_COPY.status.reached(GOAL_COPY.tiles.etaMonth(2031, 4), '₩1,000,000')
    });
  });

  it('기간 내 미도달인데 반올림이 100%가 돼도 "기간 내 미도달"을 유지한다', () => {
    const model = buildGoalViewModel({
      goal: baseGoal({ status: 'not-reached', reachedMonth: null, reachedYearIndex: null }),
      formatAmount
    });

    expect(model.meter?.percent).toBe(100);
    expect(model.eta?.value).toBe(GOAL_COPY.tiles.etaNotReached);
    expect(model.statusLine?.tone).toBe('warning');
    expect(model.showChangeConditions).toBe(true);
    expect(model.meter?.sentence).not.toContain('도달했습니다');
  });

  it('이미 달성일 때만 미터를 100%로 못 박고 도달 문장을 붙인다', () => {
    const model = buildGoalViewModel({
      goal: baseGoal({
        status: 'already-reached',
        currentAmount: 1_200_000,
        progressRatio: 1.2,
        progressPercent: 100,
        isAlreadyReached: true
      }),
      formatAmount
    });

    expect(model.meter).toEqual({ percent: 100, sentence: GOAL_COPY.meter.sentenceReached('₩1,000,000') });
    expect(model.eta?.value).toBe(GOAL_COPY.tiles.etaAlready);
    expect(model.emphasizeEditTarget).toBe(true);
  });
});

describe('buildGoalViewModel — 목표 미설정 불변식 (AC6)', () => {
  it.each([0, -1, -500_000])('목표가 %s이면 달성률·예상 달성·상태 문장을 만들지 않는다', (target) => {
    const model = buildGoalViewModel({
      goal: baseGoal({
        status: 'no-target',
        hasTarget: false,
        targetMonthlyDividend: target,
        progressRatio: null,
        progressPercent: null,
        reachedMonth: null,
        reachedYearIndex: null,
        isAlreadyReached: false
      }),
      formatAmount
    });

    expect(model.showSetupPanel).toBe(true);
    expect(model.target).toBeNull();
    expect(model.meter).toBeNull();
    expect(model.eta).toBeNull();
    expect(model.statusLine).toBeNull();
    expect(model.showEditTarget).toBe(false);
    expect(model.showChangeConditions).toBe(false);
    // 목표를 잡는 근거인 현재값은 남는다.
    expect(model.current.value).toBe('₩996,000');
  });
});

describe('buildGoalLiveMessage', () => {
  it('목표 미설정은 달성률을 낭독하지 않는다', () => {
    const message = buildGoalLiveMessage(baseGoal({ status: 'no-target', hasTarget: false, progressPercent: null }));

    expect(message).toBe(GOAL_COPY.live.noTarget);
    expect(message).not.toContain('%');
  });

  it('상태마다 서로 다른 문장을 낭독한다 (같은 문장이면 스크린리더가 다시 읽지 않는다)', () => {
    const messages = (['loading', 'empty', 'error', 'no-target', 'already-reached'] as const).map((status) =>
      buildGoalLiveMessage(baseGoal({ status }))
    );

    expect(new Set(messages).size).toBe(messages.length);
  });
});

describe('toProgressBucket — 연속값을 저카디널리티 라벨로', () => {
  it.each([
    [0, false, '0-25'],
    [24.9, false, '0-25'],
    [25, false, '25-50'],
    [49.99, false, '25-50'],
    [50, false, '50-75'],
    [74.9, false, '50-75'],
    [75, false, '75-100'],
    [100, false, '75-100']
  ])('%s%% (미도달) → %s', (percent, isReached, expected) => {
    expect(toProgressBucket(percent as number, isReached as boolean)).toBe(expected);
  });

  it('도달 판정은 비율보다 우선한다 (부동소수로 99.99%인 도달도 reached)', () => {
    expect(toProgressBucket(99.99, true)).toBe('reached');
    expect(toProgressBucket(0, true)).toBe('reached');
  });
});
