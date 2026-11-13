/*
 * GA 트래픽 리포트 배럴. `cli.ts` 는 **일부러 빼 둔다** — `node:` API(crypto / process)를 쓰는데,
 * 테스트(`test/`)는 node 타입이 없는 앱 tsconfig 로 타입체크되므로 배럴이 끌어오면 TS2307 로 깨진다
 * (`scripts/dividendLists/index.ts` 와 같은 규율).
 */
export * from './trafficReport';
