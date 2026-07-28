/**
 * 주요 지수 **레지스트리** — 서버 핸들러·클라이언트 조회·표시 부품이 공유하는 **단일 출처**.
 *
 * ## 왜 한 곳인가
 * 지수 목록이 세 곳(서버 fetch 대상 / 클라이언트 파서의 허용 심볼 / 화면 표시 순서·라벨)에 흩어지면
 * 하나를 늘릴 때 나머지가 조용히 어긋난다. **지수 추가 = 아래 `DEFINITIONS` 에 한 줄** 이 되도록
 * 심볼 유니온까지 배열에서 파생시킨다(타입도 자동으로 따라온다).
 *
 * ## 이 파일(과 이 폴더)의 순수성 제약 🔴
 * `server/handlers/MarketIndices` 가 이 모듈을 import 한다. 서버 번들에 `import.meta.env` 나 React 가
 * 전이 의존으로라도 섞이면 Vercel Node 런타임이 **모듈 평가 단계에서 즉사**한다(try/catch 로도 못 잡는다).
 * 그래서 이 폴더에는 **순수 데이터·순수 함수만** 둔다 — React 훅·atom·env 접근 금지(그건 `jotai/` 쪽).
 * `test/api/marketIndices.test.ts` 의 "순수성" 테스트가 이 제약을 기계적으로 지킨다.
 */

/**
 * 지수 정의 목록. **배열 순서가 곧 화면 표시 순서**이고, 서버도 이 순서로 조회·응답한다.
 * 심볼은 Yahoo Finance chart API 표기(선행 `^` 는 URL 인코딩이 필요 — `%5E`).
 */
const DEFINITIONS = [
  { symbol: '^GSPC', label: 'S&P 500' },
  { symbol: '^IXIC', label: '나스닥 종합' },
  { symbol: '^KS11', label: '코스피' },
  { symbol: '^KQ11', label: '코스닥' },
  { symbol: '^N225', label: '니케이225' }
] as const;

/** 레지스트리가 다루는 심볼 유니온 — `DEFINITIONS` 에서 파생된다(한 줄 추가로 자동 확장). */
export type MarketIndexSymbol = (typeof DEFINITIONS)[number]['symbol'];

export type MarketIndexDefinition = {
  symbol: MarketIndexSymbol;
  /** 화면에 그대로 쓰는 표기. 통화·현재가는 upstream 이 주므로 여기 두지 않는다. */
  label: string;
};

/** 표시 순서를 포함한 전체 정의. */
export const MARKET_INDICES: readonly MarketIndexDefinition[] = DEFINITIONS;

/** 조회 대상 심볼(표시 순서와 동일). 서버 핸들러가 이 목록을 그대로 병렬 조회한다. */
export const MARKET_INDEX_SYMBOLS: readonly MarketIndexSymbol[] = DEFINITIONS.map(
  (definition) => definition.symbol
);

const SYMBOL_SET: ReadonlySet<string> = new Set<string>(MARKET_INDEX_SYMBOLS);

/** 신뢰할 수 없는 값이 레지스트리에 있는 심볼인지. 파서가 모르는 심볼을 걸러내는 데 쓴다. */
export const isMarketIndexSymbol = (value: unknown): value is MarketIndexSymbol =>
  typeof value === 'string' && SYMBOL_SET.has(value);

/** 심볼 → 정의(라벨). 레지스트리에 없으면 `undefined`(표시 부품이 그 항목을 건너뛸 수 있게). */
export const findMarketIndex = (symbol: string): MarketIndexDefinition | undefined =>
  MARKET_INDICES.find((definition) => definition.symbol === symbol);
