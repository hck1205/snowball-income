/**
 * 투자 성향 테스트의 **데이터 정본** — 축 · 문항 · 유형.
 *
 * 채점과 판정 로직은 여기 없다(`shared/lib/investorType`). 이 폴더는 "무엇을 묻고 어떤 유형이 있는가"
 * 만 알고, "어떻게 점수를 내고 어느 유형으로 떨어지는가"는 순수 함수 쪽이 소유한다.
 */
export {
  INVESTOR_AXES,
  INVESTOR_AXIS_IDS,
  findInvestorAxis,
  type InvestorAxis,
  type InvestorAxisId,
  type InvestorAxisScores
} from './investorTypeAxes';
export {
  INVESTOR_QUESTIONS,
  INVESTOR_QUESTION_COUNT,
  findInvestorQuestion,
  type InvestorQuestion,
  type InvestorQuestionOption
} from './investorTypeQuestions';
export {
  INVESTOR_TYPE_CODES,
  INVESTOR_TYPE_PROFILES,
  findInvestorTypeByCode,
  findInvestorTypeProfile,
  type InvestorTypeId,
  type InvestorTypeMatch,
  type InvestorTypeNextLink,
  type InvestorTypeProfile
} from './investorTypeProfiles';
