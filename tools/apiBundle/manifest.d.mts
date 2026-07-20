/**
 * `manifest.mjs` 의 타입 선언.
 *
 * 매니페스트를 `.mjs` 로 두는 이유: `tools/` 는 빌드 단계 없이 `node` 가 직접 실행한다
 * (tools/indexer 와 같은 관례). 그런데 `vite.config.ts`(TypeScript)도 같은 매니페스트를 읽어
 * dev 서버의 `/api/*` 라우팅을 소스 위치와 맞춘다 — 그래서 선언 파일만 곁들인다.
 */
export declare const API_BUNDLES: readonly { entry: string; out: string }[];
export declare const API_EXTERNALS: readonly string[];
