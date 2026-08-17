// @vitest-environment node — 순수 함수만 본다.
import { describe, expect, it } from 'vitest';
import {
  INVESTOR_AXIS_IDS,
  INVESTOR_QUESTIONS,
  INVESTOR_TYPE_PROFILES,
  type InvestorAxisScores
} from '@/shared/constants/investorType';
import {
  countAnswered,
  hasAnsweredAll,
  resolveInvestorType,
  resolveInvestorTypeFromAnswers,
  scoreAnswers,
  type InvestorAnswers
} from '@/shared/lib/investorType';

/** 모든 문항에 같은 선택지 인덱스를 고른 답안. */
const answerAll = (index: number): InvestorAnswers =>
  Object.fromEntries(INVESTOR_QUESTIONS.map((question) => [question.id, index]));

/** 축별로 다른 인덱스를 고른 답안. */
const answerByAxis = (byAxis: Partial<Record<string, number>>): InvestorAnswers =>
  Object.fromEntries(
    INVESTOR_QUESTIONS.map((question) => [question.id, byAxis[question.axis] ?? 0])
  );

describe('scoreAnswers: 정규화', () => {
  it('전부 첫 선택지면 모든 축이 0이다', () => {
    expect(scoreAnswers(answerAll(0))).toEqual({
      concentration: 0,
      purpose: 0,
      volatility: 0,
      horizon: 0
    });
  });

  it('전부 마지막 선택지면 모든 축이 100이다', () => {
    expect(scoreAnswers(answerAll(3))).toEqual({
      concentration: 100,
      purpose: 100,
      volatility: 100,
      horizon: 100
    });
  });

  it('가운데를 고르면 축이 중간값으로 떨어진다', () => {
    // 축당 3문항 × 점수 1 = 3 / (3 × 3) = 33.3 → 33
    expect(scoreAnswers(answerAll(1)).concentration).toBe(33);
    // 축당 3문항 × 점수 2 = 6 / 9 = 66.7 → 67
    expect(scoreAnswers(answerAll(2)).concentration).toBe(67);
  });

  it('축마다 독립적으로 계산된다', () => {
    const scores = scoreAnswers(answerByAxis({ concentration: 3, purpose: 0, volatility: 3, horizon: 0 }));

    expect(scores.concentration).toBe(100);
    expect(scores.purpose).toBe(0);
    expect(scores.volatility).toBe(100);
    expect(scores.horizon).toBe(0);
  });
});

describe('scoreAnswers: 방어', () => {
  it('빈 답안은 모든 축이 중립(50)이다', () => {
    const scores = scoreAnswers({});
    for (const axisId of INVESTOR_AXIS_IDS) expect(scores[axisId]).toBe(50);
  });

  it('부분 응답도 응답한 것만으로 정규화한다', () => {
    // 집중도 3문항 중 하나만 답했고 그것이 마지막 선택지 → 그 축은 100.
    const concentrationQuestions = INVESTOR_QUESTIONS.filter((question) => question.axis === 'concentration');
    const scores = scoreAnswers({ [concentrationQuestions[0].id]: 3 });

    expect(scores.concentration).toBe(100);
    // 손대지 않은 축은 중립으로 남는다.
    expect(scores.purpose).toBe(50);
  });

  it('범위를 벗어난 인덱스는 무시한다 (throw 하지 않는다)', () => {
    /** 하위 호환 규율: 손상된 저장값·구버전 링크는 조용히 폴백한다. */
    const answers = { ...answerAll(0), [INVESTOR_QUESTIONS[0].id]: 99 };
    expect(() => scoreAnswers(answers)).not.toThrow();
    // 나머지 두 문항(점수 0)만 반영돼 여전히 0이다.
    expect(scoreAnswers(answers).concentration).toBe(0);
  });

  it('모르는 문항 id 는 무시한다', () => {
    expect(() => scoreAnswers({ 'does-not-exist': 2 })).not.toThrow();
    expect(scoreAnswers({ 'does-not-exist': 2 }).concentration).toBe(50);
  });

  it('정수가 아닌 값은 응답으로 치지 않는다', () => {
    const scores = scoreAnswers({ [INVESTOR_QUESTIONS[0].id]: 1.5 });
    expect(scores.concentration).toBe(50);
  });
});

describe('resolveInvestorType: 유형 판정', () => {
  it('기준 좌표를 그대로 넣으면 그 유형이 나온다', () => {
    /**
     * 🔴 이 성질이 깨지면 유형 정의와 판정이 갈린 것이다 — 화면은 "당신은 X"라고 하는데
     * X 의 정의와는 다른 좌표를 보여 주게 된다.
     */
    for (const profile of INVESTOR_TYPE_PROFILES) {
      expect(resolveInvestorType(profile.ideal).id, profile.name).toBe(profile.id);
    }
  });

  it('어떤 좌표에도 반드시 유형이 하나 나온다 (구멍이 없다)', () => {
    // 임계값 규칙이었다면 여기에 구멍이 생긴다. 거리 기반이라 모든 점이 하나로 떨어진다.
    for (let value = 0; value <= 100; value += 10) {
      const scores = {
        concentration: value,
        purpose: 100 - value,
        volatility: value,
        horizon: 100 - value
      } satisfies InvestorAxisScores;

      expect(resolveInvestorType(scores)).toBeDefined();
    }
  });

  it('같은 답안은 언제나 같은 유형이다 (결정적)', () => {
    // 공유 링크가 성립하려면 필수다 — 난수·시간에 기대면 링크를 연 사람이 다른 결과를 본다.
    const answers = answerByAxis({ concentration: 0, purpose: 3, volatility: 3, horizon: 3 });
    const first = resolveInvestorTypeFromAnswers(answers);
    const second = resolveInvestorTypeFromAnswers(answers);

    expect(first.profile.id).toBe(second.profile.id);
    expect(first.scores).toEqual(second.scores);
  });

  it('집중·총수익·감내·장기 답안은 집중 가치형으로 간다', () => {
    const { profile } = resolveInvestorTypeFromAnswers(
      answerByAxis({ concentration: 0, purpose: 3, volatility: 3, horizon: 3 })
    );
    expect(profile.id).toBe('concentrated-value');
  });

  it('분산·현금흐름·방어·단기 답안은 은퇴 준비형으로 간다', () => {
    const { profile } = resolveInvestorTypeFromAnswers(
      answerByAxis({ concentration: 3, purpose: 0, volatility: 0, horizon: 0 })
    );
    expect(profile.id).toBe('retirement-ready');
  });

  it('여섯 유형이 모두 도달 가능하다', () => {
    /**
     * 도달 불가능한 유형은 **정의만 있고 아무도 보지 못하는 화면**이다. 기준 좌표를 옮기다 보면
     * 한 유형이 다른 유형에 완전히 가려질 수 있어, 여기서 전수로 확인한다.
     */
    const reached = new Set<string>();
    for (let c = 0; c <= 3; c += 1)
      for (let p = 0; p <= 3; p += 1)
        for (let v = 0; v <= 3; v += 1)
          for (let h = 0; h <= 3; h += 1) {
            const { profile } = resolveInvestorTypeFromAnswers(
              answerByAxis({ concentration: c, purpose: p, volatility: v, horizon: h })
            );
            reached.add(profile.id);
          }

    expect(reached.size).toBe(INVESTOR_TYPE_PROFILES.length);
  });
});

describe('진행 상태', () => {
  it('전부 답해야 완료로 본다', () => {
    expect(hasAnsweredAll({})).toBe(false);
    expect(hasAnsweredAll(answerAll(0))).toBe(true);
  });

  it('한 문항이라도 빠지면 완료가 아니다', () => {
    const answers = { ...answerAll(0) };
    delete (answers as Record<string, number>)[INVESTOR_QUESTIONS[0].id];
    expect(hasAnsweredAll(answers)).toBe(false);
  });

  it('응답 수를 센다', () => {
    expect(countAnswered({})).toBe(0);
    expect(countAnswered(answerAll(2))).toBe(INVESTOR_QUESTIONS.length);
    expect(countAnswered({ [INVESTOR_QUESTIONS[0].id]: 1 })).toBe(1);
  });
});
