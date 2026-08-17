import {
  INVESTOR_AXIS_IDS,
  INVESTOR_QUESTIONS,
  INVESTOR_TYPE_PROFILES,
  type InvestorAxisId,
  type InvestorAxisScores,
  type InvestorTypeId,
  type InvestorTypeProfile
} from '@/shared/constants/investorType';

/**
 * 답안 → 축 점수 → 유형. **순수 함수만 있다** (DOM·저장소·시간·난수 없음).
 *
 * 여기가 이 기능의 계산 핵심이라, `.cursor/rules` 의 "계산 정확성" 규율이 그대로 적용된다 —
 * 바꿨으면 `test/investorType/` 를 돌려라.
 */

/** 문항 id → 고른 선택지의 **인덱스**(0~3). 인덱스가 곧 점수다(`investorTypeQuestions` 규율 2). */
export type InvestorAnswers = Readonly<Record<string, number>>;

/** 축이 하나도 응답되지 않았을 때의 값. 한쪽으로 기울지 않는 가운데. */
const NEUTRAL_SCORE = 50;

/** 선택지 하나의 최대 점수(0·1·2·3). */
const MAX_OPTION_SCORE = 3;

const clampScore = (value: number): number => Math.min(100, Math.max(0, Math.round(value)));

/**
 * 답안을 **축별 0~100** 으로 환산한다.
 *
 * ## 정규화가 "축당 문항 수"를 데이터에서 세는 이유
 * 문항을 늘리거나 줄여도 이 함수를 고치지 않기 위해서다. 축당 3문항이면 원점수 0~9, 4문항이면 0~12 인데
 * 어느 쪽이든 0~100 으로 떨어진다.
 * ⚠ 다만 축마다 문항 수는 **같게** 유지해라 — 한 축만 문항이 많으면 그 축만 해상도가 높아진다
 *   (정규화는 그것을 감춰서 더 위험하다).
 *
 * ## 부분 응답을 허용한다
 * 중간에 그만둔 답안으로도 점수가 나온다(응답한 문항만으로 정규화). 화면은 12문항을 다 받지만,
 * 이 함수가 그것을 강제하면 "이어서 하기" 나 부분 공유 같은 것을 나중에 못 붙인다.
 * 한 문항도 없는 축은 `NEUTRAL_SCORE`.
 *
 * ⚠ 범위를 벗어난 인덱스(저장값 손상·구버전 링크)는 **무시**한다. throw 하지 않는다 —
 *   하위 호환 규율(잘못된 저장값은 조용히 폴백).
 */
export const scoreAnswers = (answers: InvestorAnswers): InvestorAxisScores => {
  const totals = new Map<InvestorAxisId, { sum: number; count: number }>();
  for (const axisId of INVESTOR_AXIS_IDS) totals.set(axisId, { sum: 0, count: 0 });

  for (const question of INVESTOR_QUESTIONS) {
    const picked = answers[question.id];
    if (!Number.isInteger(picked)) continue;

    const option = question.options[picked as 0 | 1 | 2 | 3];
    if (!option) continue;

    const bucket = totals.get(question.axis);
    if (!bucket) continue;

    bucket.sum += option.score;
    bucket.count += 1;
  }

  const scores = {} as Record<InvestorAxisId, number>;
  for (const axisId of INVESTOR_AXIS_IDS) {
    const bucket = totals.get(axisId);
    scores[axisId] =
      bucket && bucket.count > 0 ? clampScore((bucket.sum / (bucket.count * MAX_OPTION_SCORE)) * 100) : NEUTRAL_SCORE;
  }

  return scores;
};

/**
 * 축 점수에서 **가장 가까운 유형**을 고른다.
 *
 * ## 왜 임계값이 아니라 거리인가
 * `if (집중 < 30 && 시간 > 70) ...` 식의 규칙은 **어디에도 안 맞는 답안**을 만든다(구멍). 여섯 개의
 * 기준 좌표에 대한 거리로 고르면 모든 좌표가 반드시 하나로 떨어지고, 유형을 더하거나 기준을 옮길 때
 * 규칙을 다시 짤 필요가 없다.
 *
 * ## 동점 처리
 * 거리가 완전히 같으면 `INVESTOR_TYPE_PROFILES` 의 **먼저 오는 것**을 고른다. 무작위나 시간에 기대지
 * 않는다 — 같은 답안은 언제나 같은 유형이어야 공유 링크가 성립한다.
 */
export const resolveInvestorType = (scores: InvestorAxisScores): InvestorTypeProfile => {
  let best = INVESTOR_TYPE_PROFILES[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const profile of INVESTOR_TYPE_PROFILES) {
    let squared = 0;
    for (const axisId of INVESTOR_AXIS_IDS) {
      const delta = scores[axisId] - profile.ideal[axisId];
      squared += delta * delta;
    }

    // 엄격한 `<` 라 동점이면 먼저 온 것이 남는다(위 "동점 처리").
    if (squared < bestDistance) {
      bestDistance = squared;
      best = profile;
    }
  }

  return best;
};

/** 답안에서 곧장 유형까지. 화면이 부르는 것은 대개 이것이다. */
export const resolveInvestorTypeFromAnswers = (
  answers: InvestorAnswers
): { scores: InvestorAxisScores; profile: InvestorTypeProfile } => {
  const scores = scoreAnswers(answers);
  return { scores, profile: resolveInvestorType(scores) };
};

/** 답안이 **전부** 채워졌는가. 화면의 "결과 보기" 활성화 판단. */
export const hasAnsweredAll = (answers: InvestorAnswers): boolean =>
  INVESTOR_QUESTIONS.every((question) => Number.isInteger(answers[question.id]));

/** 응답한 문항 수. 진행률 표시용. */
export const countAnswered = (answers: InvestorAnswers): number =>
  INVESTOR_QUESTIONS.reduce((total, question) => (Number.isInteger(answers[question.id]) ? total + 1 : total), 0);

export type { InvestorTypeId };
