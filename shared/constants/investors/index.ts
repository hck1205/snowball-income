import snapshot from './investorHoldings.generated.json';

/**
 * 대가들의 보유 종목 — **SEC EDGAR 13F 공시에서 만든 스냅샷**의 타입과 접근자.
 *
 * 🔴 이 데이터의 한계는 데이터 자체의 성질이라 화면이 반드시 말해야 한다. 여기 적어 두는 이유는
 * 소비하는 쪽이 이 파일부터 열기 때문이다:
 *
 *  1. **최대 4.5개월 지연** — 13F 는 분기말 기준이고 제출 기한이 45일이다. "현재 포트폴리오"가 아니다.
 *     (실측 2026-08-02: 13명 중 11명이 3월 말 기준, 한 명은 10개월 전이다.)
 *  2. **미국 상장 주식 롱 포지션만** — 현금·채권·해외 상장·비상장·공매도가 전부 빠진다.
 *     버크셔의 거대한 현금은 이 데이터에 없다.
 *  3. **비중은 "13F 신고분 기준"** — 그 사람 자산의 비중이 아니다.
 *  4. **투자 자문이 아니다.**
 *
 * ⚠ 생성물이다. 손으로 고치지 마라 — `npx vite-node scripts/investorHoldings/cli.ts` 가 만든다.
 */

/** 한 종목. 🔴 `cusip` 이 유일한 식별자다 — 13F 는 티커를 주지 않는다. */
export type InvestorHolding = {
  readonly cusip: string;
  /** 공시에 적힌 발행사 이름. 우리 티커와 다를 수 있다. */
  readonly issuer: string;
  readonly valueUsd: number;
  /** 신고분 대비 비중(%). 합계가 0이면 `null` — 0% 로 위장하지 않는다. */
  readonly weightPercent: number | null;
};

export type InvestorSnapshotEntry = {
  readonly cik: string;
  readonly person: string;
  readonly firm: string;
  readonly note: string;
  /** SEC 등록명. 표시명과 다를 수 있어 대조용으로 남긴다. */
  readonly registrantName: string;
  readonly accessionNumber: string;
  /** 🔴 **이 값이 화면의 "언제 기준"이다.** 인물마다 다르므로 전역 하나로 뭉뚱그리면 거짓이 된다. */
  readonly reportDate: string;
  readonly filingDate: string;
  readonly valueUnit: 'dollars' | 'thousands';
  readonly totalValueUsd: number;
  /** 전체 보유 종목 수. `topHoldings` 는 그중 상위 일부다("전체 N종 중 상위 M종"). */
  readonly totalHoldingCount: number;
  readonly topHoldings: readonly InvestorHolding[];
};

export type InvestorSnapshot = {
  readonly generatedAt: string;
  readonly source: string;
  readonly investors: readonly InvestorSnapshotEntry[];
};

export const INVESTOR_SNAPSHOT = snapshot as InvestorSnapshot;

/** 신고 규모 큰 순. 화면 기본 정렬 — 이름 순으로 두면 매번 같은 사람이 위에 온다. */
export const INVESTORS_BY_SIZE: readonly InvestorSnapshotEntry[] = [...INVESTOR_SNAPSHOT.investors].sort(
  (left, right) => right.totalValueUsd - left.totalValueUsd
);

export const findInvestor = (cik: string): InvestorSnapshotEntry | null =>
  INVESTOR_SNAPSHOT.investors.find((entry) => entry.cik === cik) ?? null;

/**
 * 보고 기준일이 얼마나 지났는지(일).
 *
 * 🔴 `today` 를 **인자로 받는다** — 모듈이 `new Date()` 를 부르면 테스트가 실제 날짜에 매인다
 * (이 레포가 캘린더·목표에서 같은 규율을 쓴다).
 */
export const daysSinceReport = (entry: InvestorSnapshotEntry, today: Date): number | null => {
  const reported = Date.parse(`${entry.reportDate}T00:00:00Z`);
  if (Number.isNaN(reported)) return null;
  return Math.floor((today.getTime() - reported) / 86_400_000);
};

/** 이 일수를 넘으면 "갱신이 멈춘 것으로 보인다"고 말한다. 분기 데이터라 두 분기(≈180일)가 기준이다. */
export const STALE_REPORT_DAYS = 180;

/**
 * 자료가 오래됐는가.
 * ⚠ 오래된 것과 **청산한 것은 다르다.** 우리가 아는 것은 "공시가 없다"는 사실뿐이므로,
 * 화면 문구도 거기까지만 말한다(실측: 마이클 버리가 2025-09-30 에서 멈췄다).
 */
export const isReportStale = (entry: InvestorSnapshotEntry, today: Date): boolean => {
  const days = daysSinceReport(entry, today);
  return days !== null && days > STALE_REPORT_DAYS;
};
