/**
 * 종목 색 배정의 **단일 원천**. 화면마다 각자 `index % 8` 을 쓰던 것을 여기로 모았다.
 * 근거·트레이드오프는 `assignSeries.ts` 상단 주석(2026-08-03 D4 결정).
 */
export { assignSeries, assignSeriesIndexes, seriesHomeIndex, seriesVarFor } from './assignSeries';
