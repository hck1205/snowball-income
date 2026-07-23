/**
 * ⚠ 이 폴더는 의도적으로 `shared/constants/index.ts`(최상위 배럴)에 연결하지 않는다.
 * 티커가 늘어날수록 이 안의 한국어 서사·FAQ 텍스트 총량이 커지는데, 최상위 배럴은 앱 전역에서
 * import되어 엔트리 번들에 실린다(SEO 원칙: 대량 티커 데이터를 엔트리 번들에 넣지 않는다,
 * community 폴더의 동일한 격리 관례 — architecture.md "Isolation" 참고). 소비는 반드시
 * `@/shared/constants/tickers` **폴더 경로**로 하고, 페이지는 React.lazy 라우트 청크에서만 import한다.
 */
export type * from './TickerContent.types';
export * from './TickerCategory';
export * from './resolveTickerEngineFacts';
export * from './renderTickerContentTemplate';
export * from './schd';
export * from './vig';
export * from './dgro';
export * from './dgrw';
export * from './schy';
export * from './hdv';
export * from './vym';
export * from './spyd';
export * from './jepi';
export * from './jepq';
export * from './o';
export * from './registry';
