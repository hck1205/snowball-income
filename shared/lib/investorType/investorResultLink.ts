import {
  INVESTOR_AXIS_IDS,
  INVESTOR_TYPE_CODES,
  findInvestorTypeByCode,
  findInvestorTypeProfile,
  type InvestorAxisId,
  type InvestorAxisScores,
  type InvestorTypeProfile
} from '@/shared/constants/investorType';

/**
 * 성향 결과의 **공유 링크 스키마**.
 *
 * ## 🔴 시뮬레이터 공유 스키마와 완전히 별개다
 * 저장 페이로드와 `?s=`(lz-string 압축 시뮬레이션 공유)는 **사용자 자산**이고 하위 호환이 걸려 있다.
 * 성향 결과는 그 스키마를 확장할 이유가 전혀 없다 — 확장하는 순간 성향 테스트를 고칠 때마다
 * 기존 공유 링크의 왕복을 걱정해야 한다. 그래서 **다른 파라미터 이름**(`t`·`s`)을 쓰는 독립 스키마다.
 *
 * ## 형태
 * ```
 * /investor-type/result?t=cv&s=15-75-80-85
 *                        │      └ 축 점수, INVESTOR_AXIS_IDS 순서
 *                        └ 유형 코드 (INVESTOR_TYPE_CODES)
 * ```
 * 압축하지 않는다. 길어야 30자라 압축의 이득이 없고, **사람이 읽을 수 있는 편이 디버깅에 낫다**.
 *
 * ## 하위 호환 규약
 * 🔴 `INVESTOR_TYPE_CODES` 의 값과 `INVESTOR_AXIS_IDS` 의 **순서**가 이 링크의 계약이다.
 *   둘 중 하나라도 바꾸면 이미 공유된 링크가 다른 결과를 가리킨다.
 * ⚠ 축이 나중에 늘면 옛 링크는 점수가 모자란 채 온다 — `decode` 는 모자란 축을 50(가운데)으로 채우고
 *   throw 하지 않는다. 링크가 죽는 것보다 낫다.
 * ⚠ 유형 코드를 모르면(옛 링크·손상) `null` 을 돌려준다. 화면은 그때 테스트 시작으로 보낸다.
 */

export const INVESTOR_RESULT_TYPE_PARAM = 't';
export const INVESTOR_RESULT_SCORE_PARAM = 's';

/** 축이 링크에 없을 때 채우는 값. `scoreAnswers` 의 중립값과 같은 뜻이다. */
const NEUTRAL_SCORE = 50;

const clamp = (value: number): number => Math.min(100, Math.max(0, Math.round(value)));

/** 결과를 URL 쿼리 문자열로. 앞의 `?` 는 붙이지 않는다(호출부가 조립한다). */
export const encodeInvestorResult = (profile: InvestorTypeProfile, scores: InvestorAxisScores): string => {
  const code = INVESTOR_TYPE_CODES[profile.id];
  const packed = INVESTOR_AXIS_IDS.map((axisId) => clamp(scores[axisId])).join('-');

  const params = new URLSearchParams();
  params.set(INVESTOR_RESULT_TYPE_PARAM, code);
  params.set(INVESTOR_RESULT_SCORE_PARAM, packed);
  return params.toString();
};

/**
 * URL 쿼리에서 결과를 되읽는다. 읽을 수 없으면 `null` — **절대 throw 하지 않는다**.
 *
 * `URLSearchParams` 를 그대로 받는다(문자열 파싱을 호출부마다 되풀이하지 않기 위해).
 */
export const decodeInvestorResult = (
  params: URLSearchParams
): { profile: InvestorTypeProfile; scores: InvestorAxisScores } | null => {
  const code = params.get(INVESTOR_RESULT_TYPE_PARAM);
  if (!code) return null;

  const typeId = findInvestorTypeByCode(code);
  if (!typeId) return null;

  const profile = findInvestorTypeProfile(typeId);
  if (!profile) return null;

  const packed = params.get(INVESTOR_RESULT_SCORE_PARAM) ?? '';
  const parts = packed.split('-');

  const scores = {} as Record<InvestorAxisId, number>;
  INVESTOR_AXIS_IDS.forEach((axisId, index) => {
    const part = parts[index];

    /**
     * 🔴 `Number('')` 은 **0** 이다(NaN 이 아니다). 그래서 빈 조각을 그냥 `Number()` 에 넘기면
     * "점수가 없는 링크"(`?t=cv`)가 **모든 축 0** 으로 읽힌다 — 가운데(50)여야 할 자리가 한쪽 끝으로
     * 붙어, 결과 화면이 사용자가 답한 적 없는 극단을 보여 준다. 빈 조각을 먼저 걸러야 하는 이유다.
     * (`s=-40-...` 처럼 앞에 음수가 오면 split 이 첫 조각을 빈 문자열로 만드는 경로도 여기서 잡힌다.)
     */
    if (typeof part !== 'string' || part.trim() === '') {
      scores[axisId] = NEUTRAL_SCORE;
      return;
    }

    const raw = Number(part);
    // 숫자가 아니면 가운데로 — 유형은 이미 코드가 확정했으므로 막대만 밋밋해진다.
    scores[axisId] = Number.isFinite(raw) ? clamp(raw) : NEUTRAL_SCORE;
  });

  return { profile, scores };
};
