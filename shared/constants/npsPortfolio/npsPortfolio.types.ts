/**
 * 국민연금 **미국 주식** 보유 스냅샷의 타입 — SEC 13F 공시에서 만든다.
 *
 * ## 🔴 이 자료가 덮는 것과 덮지 않는 것
 * 미국 주식을 1억 달러 넘게 굴리는 기관은 국적과 무관하게 SEC 에 13F 를 낸다. 국민연금공단도
 * `National Pension Service`(CIK 0001608046) 로 분기마다 낸다. 그래서 이 자료는 **공식**이지만
 * **일부**다:
 *
 * ```
 *   들어 있는 것   미국 상장 주식·ETF 의 롱 포지션
 *   빠진 것        국내 주식 · 채권 · 대체투자 · 현금 · 해외 비상장 · 공매도
 * ```
 * → `weightPercent` 는 **13F 신고분 안에서의 비중**이다. 기금 전체 비중이 아니다.
 *   화면이 이 구분을 흐리면 "국민연금 자산의 6.8%가 엔비디아"라는 거짓이 만들어진다.
 *
 * ## ⚠ 변동 값의 성질
 * `changePercent` 는 **신고 금액**의 변화다. 주가가 오르면 한 주도 사지 않아도 늘어난다 —
 * 수량 변화가 아니다. 13F 는 수량(`sshPrnamt`)도 주지만, 액면분할·클래스 변경이 섞이면 수량 비교가
 * 더 크게 틀린다. 금액으로 통일하고 그 성질을 화면이 말하는 쪽을 택했다.
 *
 * ## ⚠ 신규·청산은 CUSIP 기준이라 **재편입이 섞인다**
 * 실측(2026-03-31 분기): `AMCOR PLC` 가 신규와 청산에 **동시에** 나왔다. 회사가 사라진 게 아니라
 * 합병·본사 이전으로 CUSIP 이 바뀐 것이다. 이름으로 이어 붙여 걸러 내지 않는다 — 그 방식이
 * 코카콜라 FEMSA 를 코카콜라로 잡았던 그 오매칭이다(`cusipToTicker.ts` 머리말).
 *
 * ⚠ 생성물이다. 손으로 고치지 마라 — `npm run nps:portfolio` 가 만든다.
 */

export type NpsHolding = {
  /** 🔴 이 자료의 유일한 식별자. 13F 는 티커를 주지 않는다. */
  readonly cusip: string;
  /** 공시에 적힌 발행사 이름. 우리 티커 표기와 다를 수 있다. */
  readonly issuer: string;
  readonly valueUsd: number;
  /** 신고분 대비 비중(%). 기금 전체 비중이 아니다. */
  readonly weightPercent: number | null;
  /** 직전 분기 대비 **신고 금액** 변화율(%). 비교 대상이 없으면 `null`. */
  readonly changePercent: number | null;
  /** 직전 분기에 없던 종목인가. */
  readonly isNew: boolean;
};

/** 신규 편입·전량 청산 한 건. 금액은 그 시점 신고액이다. */
export type NpsMove = {
  readonly cusip: string;
  readonly issuer: string;
  readonly valueUsd: number;
};

export type NpsPortfolioSnapshot = {
  readonly generatedAt: string;
  readonly source: string;
  readonly sourceUrl: string;
  readonly cik: string;
  readonly registrantName: string;
  readonly accessionNumber: string;
  /** 🔴 **이 값이 화면의 "언제 기준"이다.** 분기말이지 수집일이 아니다. */
  readonly reportDate: string;
  readonly filingDate: string;
  readonly previousReportDate: string | null;
  readonly totalValueUsd: number;
  readonly previousTotalValueUsd: number | null;
  /** 전체 보유 종목 수. `topHoldings` 는 그중 상위 일부다("전체 N종 중 상위 M종"). */
  readonly totalHoldingCount: number;
  readonly previousHoldingCount: number | null;
  readonly topHoldings: readonly NpsHolding[];
  readonly opened: readonly NpsMove[];
  readonly closed: readonly NpsMove[];
};
