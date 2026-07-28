export { default } from './MarketIndexStrip';
/*
 * 표시 전용 순수 함수도 폴더 경로로만 나간다 — 내부 파일 직접 import 금지.
 * 소비: import MarketIndexStrip, { formatIndexValue } from '@/components/MarketIndexStrip'
 * (최상위 배럴 components/index.ts 는 common 만 재export 한다 — 여기 추가하지 마라.)
 */
export { buildMarketIndexRows, formatIndexValue } from './MarketIndexStrip.utils';
export type * from './MarketIndexStrip.types';
