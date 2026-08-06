/**
 * 미 하원 의원 주식 거래 공시(STOCK Act 정기거래보고서)의 타입.
 *
 * ## 🔴 이 자료가 **말할 수 없는 것**을 타입이 먼저 못 박는다
 * 화면이 실수로 넘겨짚지 못하게, 없는 값은 아예 필드가 없거나 `null` 이다.
 *
 * 1. **보유가 아니라 거래다.** PTR 은 사고판 기록이다. "지금 무엇을 들고 있는가"는 이 자료에 없다 —
 *    그래서 `holdings` 같은 이름의 필드가 하나도 없다.
 * 2. **금액은 구간이다.** 법이 요구하는 신고는 `$1,001 - $15,000` 같은 **범위**다. 합계도 범위로만
 *    존재한다(`minUsd`/`maxUsd`) — 가운뎃값 한 숫자로 접으면 없는 정밀도를 지어내는 것이다.
 * 3. **최상단 구간은 상한이 없다.** `Over $50,000,000` 이 섞이면 합계의 상한을 알 수 없어
 *    `maxUsd` 가 `null` 이 된다. 그때 화면은 "이상"이라고 말해야 한다.
 * 4. **정당이 없다.** 하원 색인은 이름과 주(선거구)만 준다. 짐작해 붙이지 않는다.
 * 5. **상원은 없다.** 상원 EFD 는 동의 폼과 세션을 요구해 같은 방식으로 받히지 않는다(2026-08-04 실측).
 * 6. **종이 제출은 빠진다.** 스캔 PDF 는 글자가 없다 — `filingsScanned` 가 그 수를 드러낸다.
 *
 * ⚠ 생성물이다. 손으로 고치지 마라 — `npm run congress:trades` 가 만든다.
 */

/** 매수·매도·교환. 하원 양식의 `P`/`S`/`E` 를 그대로 옮긴 값이다. */
export type CongressTradeAction = 'buy' | 'sell' | 'exchange';

/** 신고자 본인이 아닌 계좌. SP=배우자 · DC=피부양 자녀 · JT=공동. 없으면 본인이다. */
export type CongressTradeOwner = 'SP' | 'DC' | 'JT';

/**
 * 금액 구간의 합.
 *
 * 🔴 `maxUsd === null` 은 "상한 없음"이지 "0"이 아니다. 최상단 구간(5,000만 달러 초과)이
 * 하나라도 섞이면 이 값이 사라진다 — 화면은 그때 "이상"으로 읽어야 한다.
 */
export type UsdRange = {
  readonly minUsd: number;
  readonly maxUsd: number | null;
};

/** 종목 하나에 대한 집계. */
export type CongressTickerRow = UsdRange & {
  readonly ticker: string;
  /** 공시에 적힌 발행사 이름. 여러 표기가 섞이면 **가장 흔한 표기**가 이긴다. */
  readonly name: string;
  readonly buys: number;
  readonly sells: number;
  /** 이 종목을 한 번이라도 거래한 의원 수. "몇 명이 손댔는가"가 건수보다 넓은 신호다. */
  readonly memberCount: number;
};

/** 의원 한 명에 대한 집계. */
export type CongressMemberRow = UsdRange & {
  readonly name: string;
  /** `MI09` 처럼 주 + 지역구 번호. 상원이 아니라 하원이라 지역구가 있다. */
  readonly stateDistrict: string;
  readonly buys: number;
  readonly sells: number;
  /** 거래 건수 기준 상위 종목(최대 5). */
  readonly topTickers: readonly string[];
};

/** 최근 거래 한 건. */
export type CongressRecentTrade = {
  /** 거래일(`YYYY-MM-DD`). 신고일이 아니다 — 둘은 최대 45일 벌어진다. */
  readonly date: string;
  readonly member: string;
  readonly stateDistrict: string;
  readonly ticker: string;
  readonly name: string;
  readonly action: CongressTradeAction;
  /** 공시 원문 그대로의 구간 문자열(`$1,001 - $15,000`). 화면이 원문을 보여줄 때 쓴다. */
  readonly amount: string;
  readonly minUsd: number | null;
  readonly maxUsd: number | null;
  readonly owner: CongressTradeOwner | null;
};

/** 이 스냅샷이 실제로 무엇을 덮었는지. 🔴 빠진 것을 숨기지 않는 것이 이 블록의 존재 이유다. */
export type CongressCoverage = {
  readonly filingsRead: number;
  readonly filingsTotal: number;
  /** 종이(스캔) 제출이라 글자를 못 뽑은 공시 수. */
  readonly filingsScanned: number;
  readonly filingsFailed: number;
  readonly transactions: number;
  /** 그중 지분성 자산(주식·ETF·옵션·RSU). 국공채·암호자산·펀드 지분은 종목 순위에서 뺀다. */
  readonly equityTransactions: number;
  readonly members: number;
  readonly tickers: number;
};

export type CongressTradesSnapshot = {
  readonly generatedAt: string;
  readonly source: string;
  readonly sourceUrl: string;
  /** 집계에 들어간 **거래일**의 범위. 수집 시점이 아니다. */
  readonly window: { readonly start: string; readonly end: string };
  readonly coverage: CongressCoverage;
  readonly topTickers: readonly CongressTickerRow[];
  readonly topMembers: readonly CongressMemberRow[];
  readonly recent: readonly CongressRecentTrade[];
};
