/**
 * 이 화면이 쓰는 **외부 데이터 재수출** 한 곳.
 *
 * 폴더 단위 import 규칙(`.cursor/rules`)을 지키면서 화면 파일의 import 줄이 열 개로 불어나는 것을
 * 막는다. 여기 없는 것을 화면이 직접 가져오기 시작하면 그 규칙이 조용히 무너진다.
 */
export { INVESTOR_AXES, INVESTOR_QUESTIONS } from '@/shared/constants/investorType';
export { PORTFOLIO_PRESET_PLACEHOLDERS } from '@/shared/constants/portfolioPresets';
/** `/simulator?preset=<id>` 의 파라미터 이름. 🔴 읽는 쪽(시뮬레이터)이 정본이다 — 여기서 새로 적지 마라. */
export { PRESET_QUERY_PARAM } from '@/pages/Main/components/MainRightPanel/hooks';
