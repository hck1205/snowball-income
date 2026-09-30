/**
 * ETF 보유 종목 스냅샷의 **데이터 계약** — 수집기(`scripts/etfHoldings`)가 쓰고 화면(`/ticker/overlap`)이 읽는다.
 *
 * 파일 위치: `public/data/etf-holdings/<TICKER>.json`(한 ETF) · `public/data/etf-holdings/index.json`(검색 목록).
 * 🔴 필드를 지우거나 뜻을 바꾸지 마라 — 이미 배포된 JSON 과 새 화면이 같은 모양이어야 한다.
 *    더할 때는 선택(`?`) 필드로 더한다.
 */

/** 보유 종목 한 줄. */
export type EtfHolding = {
  /**
   * ETF 사이에서 **같은 종목을 알아보는 열쇠**. ISIN → CUSIP → 정규화한 종목명 순으로 고른다.
   * 🔴 티커로 맞추지 않는다 — N-PORT 는 티커를 비워 두는 일이 흔하고, 같은 회사도 클래스마다 티커가 다르다.
   */
  readonly key: string;
  /** 공시에 티커가 있으면 그 값. 없으면 `null` — 화면은 이름으로 대신 말한다. */
  readonly symbol: string | null;
  /** 공시에 적힌 종목명(발행사 표기 그대로). */
  readonly name: string;
  /** 순자산 대비 비중(%). 공시값을 소수점 넷째 자리로 반올림. 항상 양수(공매도·파생 포지션은 수집기가 뺀다). */
  readonly weight: number;
};

export type EtfHoldingsSnapshot = {
  readonly ticker: string;
  readonly name: string;
  /** SEC 시리즈 ID(`S000012345`). */
  readonly seriesId: string;
  /** 보고 기준일(YYYY-MM-DD) — 화면이 말하는 "언제 기준"이 이 값이다. */
  readonly asOfDate: string;
  /** 제출일(YYYY-MM-DD). */
  readonly filingDate: string;
  readonly accessionNumber: string;
  /** 사람이 대조할 수 있는 공시 원문 주소. */
  readonly sourceUrl: string;
  /** 공시의 전체 보유 행 수(잘라내기 전). */
  readonly totalHoldings: number;
  /**
   * `holdings` 비중의 합(%). 🔴 100 이 아닌 것이 정상이다 — 현금·파생·아주 작은 비중의 꼬리를
   * 잘라냈다(수집기 `MAX_HOLDINGS`). 화면은 이 값을 "계산에 쓴 비중"으로 밝힌다.
   */
  readonly coveredWeightPercent: number;
  readonly holdings: readonly EtfHolding[];
};

/** 검색 목록 한 줄. */
export type EtfUniverseEntry = {
  readonly ticker: string;
  readonly name: string;
  /**
   * 보유 종목 파일이 있는가. `false` 면 검색에는 나오지만 겹침을 계산할 수 없다
   * (아직 수집하지 않았거나, 금·코인처럼 주식을 담지 않는 상품이라 N-PORT 가 없다).
   */
  readonly hasHoldings: boolean;
};

export type EtfUniverse = {
  readonly etfs: readonly EtfUniverseEntry[];
  /** 처음 화면에 보여 줄 인기 ETF(보유 종목 파일이 있는 것만, 노출 순서대로). */
  readonly popular: readonly string[];
};

/** 바구니 안에서 본 한 종목. */
export type StockExposure = {
  readonly key: string;
  readonly symbol: string | null;
  readonly name: string;
  /** 바구니의 ETF 를 **같은 금액씩** 샀을 때 합친 포트폴리오에서의 비중(%). */
  readonly exposure: number;
  /** 이 종목을 가진 ETF 와 각자의 비중. 바구니 순서를 따른다. */
  readonly holders: readonly { readonly ticker: string; readonly weight: number }[];
};

export type PairOverlap = {
  readonly a: string;
  readonly b: string;
  /** 두 ETF 가 함께 싣는 비중(%) — 종목마다 두 비중 중 작은 쪽의 합. 0~100. */
  readonly overlap: number;
  readonly sharedCount: number;
  /**
   * 포함률(%) — a 가 담은 비중 중 **b 도 가진 종목**의 몫. `aInB` 가 크고 `overlap` 이 작으면
   * "비슷한 ETF"가 아니라 **포함 관계**다(예: SCHD 의 종목 대부분을 VOO 가 작은 비중으로 들고 있다).
   * 분모는 a 가 실제로 담은 비중 합이다(`overlapRate` 와 같은 이유 — 잘린 꼬리가 몫을 깎지 않게).
   */
  readonly aInB: number;
  readonly bInA: number;
};

export type BasketAnalysis = {
  /**
   * 중복률(%) — 합친 포트폴리오에서 **두 개 이상의 ETF 가 함께 가진 종목**이 차지하는 비중.
   * ETF 가 둘 미만이면 0.
   */
  readonly overlapRate: number;
  /** 겹치는 종목 먼저(가진 ETF 수 ↓), 그 안에서 합친 비중 ↓. */
  readonly stocks: readonly StockExposure[];
  readonly uniqueCount: number;
  readonly sharedCount: number;
  /** 바구니 순서의 모든 짝(a 가 b 보다 앞). */
  readonly pairs: readonly PairOverlap[];
};
