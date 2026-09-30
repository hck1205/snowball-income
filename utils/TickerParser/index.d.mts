/**
 * `index.mjs` 의 타입 선언 — 테스트(`test/tickerParser`)가 TS 에서 이 모듈을 import 하기 위한 것.
 * 런타임은 `.mjs` 그대로다(`npm run ticker:parse` 가 node 로 직접 돈다).
 */
export type ParsedTicker = { name: string; issuer: string };

export declare const parseNasdaqLikeTxt: (rawText: string) => Record<string, ParsedTicker>;
export declare const pickEtfTickers: (rawText: string) => Record<string, string>;
export declare const generateTickerJsonFiles: (outputDir?: string) => Promise<{
  nasdaqOutputPath: string;
  otherOutputPath: string;
  etfOutputPath: string;
  nasdaqCount: number;
  otherCount: number;
  etfCount: number | null;
}>;
