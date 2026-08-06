/**
 * 대한민국 국회의원 주식 보유 공개(정기재산변동신고)의 타입.
 *
 * ## 🔴 이 자료가 **말할 수 없는 것**을 타입이 먼저 못 박는다
 * 미 하원 PTR 타입이 `holdings` 를 두지 않은 것과 정반대의 이유로, 여기에는 **거래가 없다.**
 * 이 자료는 "언제 사고팔았나"를 모르고 "기준일에 무엇을 들고 있었나"만 안다.
 *
 * 1. **연 1회 스냅샷이다.** 기준일은 전년 12월 31일(`asOfDate`)이고 공개는 이듬해 3월 말
 *    (`publishedAt`)이다. 볼 때는 이미 몇 달 낡았다.
 * 2. **지금 보유 중이라는 뜻이 아니다.** 직무 관련 주식에는 매각·백지신탁 의무가 있어
 *    기준일 뒤에 처분됐을 수 있다.
 * 3. **종목별 금액이 없다.** 공보는 증권을 소계 금액으로만 적는다 — 그래서 금액 필드가
 *    **아예 없다.** 주식 수에 주가를 곱해 평가액을 지어내지 마라(그 시점 주가도 우리는 모른다).
 * 4. **본인 것이 아닐 수 있다.** 배우자·직계존비속 보유가 함께 공개된다(`relations`).
 * 5. **의원이 아닌 사람은 뺐다.** 같은 공보에 국회 사무처 고위공직자가 함께 실린다 —
 *    `peopleTotal` 과 `membersTotal` 의 차이가 그 수다.
 * 6. **표기를 일부만 합쳤다.** `엔비디아`/`NVIDIACORP` 처럼 같은 회사의 다른 표기는 명시적
 *    별칭으로만 합치고, 클래스가 불분명하면(`ALPHABETINC`) 합치지 않는다. 우선주는 보통주와
 *    다른 종목이라 절대 합치지 않는다.
 *
 * ⚠ 생성물이다. 손으로 고치지 마라 — `npm run korea:assembly` 가 만든다.
 */

/** 신고 대상 직위 중 우리가 집계하는 것. 국회 사무처 직원은 여기 없다. */
export type KoreaAssemblyPosition = '국회의장' | '국회부의장' | '국회의원';

/** 종목 하나에 대한 집계. */
export type KoreaIssuerRow = {
  /** 공보 표기를 다듬은 대표 이름. 한국 종목은 한글, 외국 종목도 대개 한글 음차다. */
  readonly issuer: string;
  /**
   * 우리 앱에 소개 페이지가 있는 미국 종목이면 그 티커. 아니면 `null`.
   * 🔴 한국 종목은 항상 `null` 이다 — 이 앱은 미국 배당주만 다룬다.
   */
  readonly ticker: string | null;
  /** 이 종목을 신고한 의원 수. **건수보다 이쪽이 넓은 신호다.** */
  readonly memberCount: number;
  /** 신고된 주식 수의 합. ⚠ 소수점이 있다(소수점 매수). 금액이 아니다. */
  readonly shares: number;
  /** 신고한 의원 이름(최대 6명). 전부가 아니라 표본이다. */
  readonly members: readonly string[];
};

/** 의원 한 명에 대한 집계. */
export type KoreaMemberRow = {
  readonly name: string;
  readonly position: KoreaAssemblyPosition;
  /** 신고된 서로 다른 종목 수. */
  readonly issuerCount: number;
  /** 본인·배우자·장남… 누구 명의가 섞였는지. 🔴 화면은 이걸 반드시 같이 보여 준다. */
  readonly relations: readonly string[];
  /** 주식 수 기준 상위 종목(최대 5). ⚠ 주식 수 기준이라 금액 순위가 아니다. */
  readonly topIssuers: readonly string[];
};

/** 이 스냅샷이 실제로 무엇을 덮었는지. 🔴 빠진 것을 숨기지 않는 것이 이 블록의 존재 이유다. */
export type KoreaAssemblyCoverage = {
  /** 공보에 실린 전체 인원(의원 + 국회 사무처 고위공직자). */
  readonly peopleTotal: number;
  /** 그중 의원(의장·부의장 포함). */
  readonly membersTotal: number;
  /** 상장주식을 하나라도 신고한 의원 수. */
  readonly membersWithStocks: number;
  /** 보유 행 수(의원 × 명의 × 종목). */
  readonly holdings: number;
  /** 서로 다른 종목 수. */
  readonly issuers: number;
  /** `0주(N주 감소)` — 전량 매도라 보유에서 뺀 건수. */
  readonly fullySold: number;
};

export type KoreaAssemblyStocksSnapshot = {
  readonly generatedAt: string;
  readonly source: string;
  readonly sourceUrl: string;
  /** `2026-54` 처럼 공보 통권 호수. 자동 갱신이 "새 공개인가"를 이 값으로 판단한다. */
  readonly issueNo: string;
  readonly issueTitle: string;
  /** 공보 발행일(`YYYY-MM-DD`). 매년 3월 말이다. */
  readonly publishedAt: string;
  /** 신고 기준일(`YYYY-MM-DD`). **전년 12월 31일이다** — 발행일이 아니다. */
  readonly asOfDate: string;
  readonly coverage: KoreaAssemblyCoverage;
  readonly topIssuers: readonly KoreaIssuerRow[];
  readonly topMembers: readonly KoreaMemberRow[];
};
