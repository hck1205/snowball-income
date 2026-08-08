/**
 * **한눈에 보기**의 집계 — 가계부·자산·투자를 한 화면 분량의 숫자로 접는다.
 *
 * ## 왜 폴더인가 (2026-08-09 리팩터)
 *
 * 한 파일이 900 줄을 넘어가면서 "이 함수가 무엇을 세는가"를 찾는 데 스크롤이 필요해졌다.
 * 관심사로 갈랐다 — **흐름**(수입·지출·저축률), **지출**(구성·리듬·흐름도), **자산·투자**,
 * **문장과 타일**.
 *
 * ## 🔴 전 파일 공통 규율
 *
 * - **없는 것을 0 으로 채우지 않는다.** 기록이 없는 달은 건너뛰고, 잴 수 없는 값은 `null` 이다.
 * - **이체는 지출이 아니다.** 저축·투자 납입은 쓴 것이 아니라 옮긴 것이다.
 * - **지운 행은 어디에도 안 센다.**
 */
export { labelOf, monthOf, toSlices } from './reportShared';
export type { ReportMonth, ReportSlice } from './reportShared';
export * from './reportFlows';
export * from './reportSpending';
export * from './reportHoldings';
export * from './reportInsights';
