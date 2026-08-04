/*
 * 수집기 배럴. `cli.ts` · `universeCli.ts` · `membershipDiffCli.ts` · `snapshotIo.ts` 는
 * **일부러 빼 둔다** — 넷 다 `node:` API(fs / process / zlib)를 쓰는데, 테스트(`test/`)는 node 타입이
 * 없는 앱 tsconfig 로 타입체크되므로 배럴이 그걸 끌어오면 순수 테스트가 TS2307 로 깨진다.
 * (`scripts/tickerRefresh/index.ts` 가 같은 이유로 같은 규율을 갖고 있다.)
 */
export * from './collect';
export * from './membershipDiff';
export * from './sources';
export * from './universe';
