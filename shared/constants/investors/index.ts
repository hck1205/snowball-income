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

/**
 * 포지션 종류. 🔴 **`put` 은 보유가 아니라 하락 베팅이다.**
 *
 * 2026-08-02 실측: 마이클 버리의 신고분 중 최대 항목인 팔란티어(66%)·엔비디아(13.5%)가 풋이었다.
 * 그때 화면은 이 값을 몰라 "최대 보유 종목"으로 그렸다 — 방향이 정반대인 거짓이었다.
 * ⚠ 옛 스냅샷(이 필드가 없던 시절)을 위해 선택 필드로 두되, **없으면 주식으로 넘겨짚지 말고**
 *   "알 수 없음"으로 다뤄라. 지금 커밋된 스냅샷은 전부 이 필드를 갖고 있다.
 */
export type PositionKind = 'share' | 'put' | 'call';

/** 한 종목. 🔴 `cusip` 이 유일한 식별자다 — 13F 는 티커를 주지 않는다. */
export type InvestorHolding = {
  readonly cusip: string;
  /** 공시에 적힌 발행사 이름. 우리 티커와 다를 수 있다. */
  readonly issuer: string;
  readonly valueUsd: number;
  /** 신고분 대비 비중(%). 합계가 0이면 `null` — 0% 로 위장하지 않는다. */
  readonly weightPercent: number | null;
  /**
   * 🔴 화면이 반드시 구분해 말해야 하는 값.
   * ⚠ 옵션 행의 `valueUsd` 는 **기초자산 명목 금액**이라 같은 자본으로도 비중이 크게 잡힌다 —
   *   비중만 보고 "가장 큰 확신"으로 읽으면 안 된다.
   */
  readonly kind?: PositionKind;
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

/** 신고 규모 큰 순. 이름 순으로 두면 매번 같은 사람이 위에 온다. */
export const INVESTORS_BY_SIZE: readonly InvestorSnapshotEntry[] = [...INVESTOR_SNAPSHOT.investors].sort(
  (left, right) => right.totalValueUsd - left.totalValueUsd
);

/**
 * 화면 기본 정렬 — **이름이 널리 알려진 순**(2026-08-02 사용자 지시).
 *
 * 🔴 **이건 측정값이 아니라 편집 판단이다.** "언급량"을 세는 무료 데이터 출처가 없어서 손으로 정했다.
 * 그러므로 이 순서를 "화제성 지표"라고 화면에 적지 마라 — 우리는 그 숫자를 갖고 있지 않다.
 * 규모 순(`INVESTORS_BY_SIZE`)을 기본으로 두면 켄 피셔($294.9B)가 버핏보다 위에 오는데,
 * 이 화면에 처음 온 사람이 찾는 이름은 그 순서가 아니다.
 *
 * ⚠ 여기 없는 CIK 는 목록 **뒤로** 밀린다(명단에 사람을 더해도 화면이 깨지지 않는다).
 * ⚠ 순서를 바꿀 때는 근거를 남겨라. 근거 없는 재배치는 다음 사람이 되돌린다.
 */
const SPOTLIGHT_ORDER: readonly string[] = [
  '0001067983', // 워런 버핏 — 이 주제에서 가장 먼저 찾는 이름
  '0001697748', // 캐시 우드 — ARK
  '0001336528', // 빌 애크먼 — 퍼싱스퀘어
  '0001350694', // 레이 달리오 — 브리지워터
  '0001166559', // 빌 게이츠 재단
  '0001536411', // 스탠리 드러켄밀러
  '0001656456', // 데이비드 테퍼
  '0001061768', // 세스 클라만
  '0001709323', // 리루
  '0000850529', // 켄 피셔 — 규모는 1위지만 대중 인지도는 그보다 낮다
  '0000915191', // 프렘 왓사
  '0000783412', // 데일리 저널
  /*
   * 🔴 마이클 버리는 **맨 뒤**다(2026-08-06 사용자 지시). 인지도로는 앞자리였지만, 이 화면에서
   * 그의 카드만 성격이 다르다 — 신고가 2025-09-30 에서 멈춰 "공시 오래됨" 배지를 달고 있고
   * 보유 구성도 풋 위주라, 앞에 두면 화면 전체가 그 예외를 기준으로 읽힌다.
   */
  '0001649339' // 마이클 버리
];

export const INVESTORS_BY_SPOTLIGHT: readonly InvestorSnapshotEntry[] = [...INVESTOR_SNAPSHOT.investors].sort(
  (left, right) => {
    const leftRank = SPOTLIGHT_ORDER.indexOf(left.cik);
    const rightRank = SPOTLIGHT_ORDER.indexOf(right.cik);
    /* 목록에 없으면 맨 뒤로. 둘 다 없으면 규모 순으로 떨어뜨린다(임의 순서를 남기지 않는다). */
    if (leftRank === -1 && rightRank === -1) return right.totalValueUsd - left.totalValueUsd;
    if (leftRank === -1) return 1;
    if (rightRank === -1) return -1;
    return leftRank - rightRank;
  }
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

/**
 * 인물 사진(2026-08-05 사용자가 `public/images/investors/` 에 올림).
 *
 * 🔴 **CIK 로 명시해 적는다.** 이름에서 파일명을 조립하는 방법(공백 제거)도 되지만, 그러면
 * 파일 하나만 이름이 바뀌어도 조용히 깨진 이미지가 뜬다 — 어느 인물에 사진이 있는지는
 * 이 표가 유일한 답이고, 없으면 화면이 모노그램으로 되돌아간다.
 *
 * ⚠ **데일리 저널(0000783412)만 이름과 파일이 어긋난다.** 명단의 이름은 회사(데일리 저널)이지만
 *   사진은 그 회사를 이끌던 **찰리 멍거**다(2026-08-05 사용자 지시, 파일도 `찰리멍거.png`).
 *   회사 로고 대신 사람 얼굴을 쓰는 이유는 이 화면의 다른 열두 장이 전부 얼굴이라, 한 장만
 *   로고면 격자에서 그 카드가 "빈 자리"처럼 읽히기 때문이다. 카드 제목·설명은 그대로 회사를
 *   말한다(`roster.ts` 의 note 가 "찰리 멍거가 이끌던 회사"라고 이미 잇고 있다).
 */
export const INVESTOR_AVATAR_BY_CIK: Readonly<Record<string, string>> = {
  '0001067983': '/images/investors/warren-buffett.png',
  '0000850529': '/images/investors/ken-fisher.png',
  '0001166559': '/images/investors/bill-gates.png',
  '0001350694': '/images/investors/ray-dalio.png',
  '0001336528': '/images/investors/bill-ackman.png',
  '0001697748': '/images/investors/cathie-wood.png',
  '0001656456': '/images/investors/david-tepper.png',
  '0001061768': '/images/investors/seth-klarman.png',
  '0001536411': '/images/investors/stanley-druckenmiller.png',
  '0001649339': '/images/investors/michael-burry.png',
  '0001709323': '/images/investors/li-lu.png',
  '0000915191': '/images/investors/prem-watsa.png',
  /* 데일리 저널 = 찰리 멍거 얼굴. 위 머리말의 "이름과 파일이 어긋나는 유일한 줄"이 이것이다. */
  '0000783412': '/images/investors/charlie-munger.png'
};

/** 사진 경로. 없으면 `null` — 호출부는 그때 모노그램으로 되돌아간다. */
export const investorAvatar = (cik: string): string | null => INVESTOR_AVATAR_BY_CIK[cik] ?? null;
