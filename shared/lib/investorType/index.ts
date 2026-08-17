/**
 * 투자 성향 테스트의 **계산부** — 채점 · 유형 판정 · 결과 공유 링크.
 *
 * 전부 순수 함수다(DOM·저장소·시간·난수 없음). 데이터(축·문항·유형)는
 * `shared/constants/investorType` 가 소유한다.
 */
export {
  countAnswered,
  hasAnsweredAll,
  resolveInvestorType,
  resolveInvestorTypeFromAnswers,
  scoreAnswers,
  type InvestorAnswers
} from './scoreAnswers';
export {
  INVESTOR_RESULT_SCORE_PARAM,
  INVESTOR_RESULT_TYPE_PARAM,
  decodeInvestorResult,
  encodeInvestorResult
} from './investorResultLink';
