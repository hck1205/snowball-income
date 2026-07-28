/**
 * 주요 지수 시세 공용 모듈 — 레지스트리(단일 출처) + 조회 계약 + 순수 변동률 계산.
 *
 * 🔴 **완전 순수 유지**: 서버 핸들러(`server/handlers/MarketIndices`)가 이 배럴을 import 한다.
 * React·`import.meta.env`·다른 앱 배럴을 (전이 의존으로도) 끌어오면 Vercel Node 함수가 모듈 평가
 * 단계에서 죽는다. 상태(atom)·훅은 `jotai/snowball/atoms/marketIndices` 에 둔다.
 */
export * from './registry';
export * from './quotes';
export * from './change';
