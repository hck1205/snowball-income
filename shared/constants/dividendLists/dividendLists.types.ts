/**
 * 배당 연속 증배 목록(배당킹·배당귀족·배당챔피언)의 타입.
 *
 * 🔴 이 데이터가 다루는 대상은 **"어떤 종목이 어느 목록에 있는가"라는 사실**뿐이다. 가격·배당률처럼
 * 매일 움직이는 값은 여기 두지 않는다 — 그건 `shared/constants/marketData` 의 일이고, 두 곳에 같은
 * 숫자를 두면 반드시 어긋난다.
 *
 * ⚠ **연속 증배 "연수"를 종목별 숫자로 담는 필드는 일부러 없다.** 근거는 실측이다:
 *  - 야후 전기간 배당이력으로 직접 계산하면 배당귀족 69종 중 단순 합산은 33종, 정교화해도 58종만
 *    25년 이상으로 판정된다(오차 16~52%). 남는 오차는 분사(ABBV·KVUE)·지급주기 변경(CTAS·MCD)처럼
 *    기계가 원리적으로 못 푸는 기업행위다.
 *  - 무료 소스끼리도 서로 다르다. 배당킹을 stockanalysis 는 54종, dripinvesting 은 47종으로 싣고,
 *    stockanalysis 가 킹으로 올린 LEG 는 야후 실측상 2024년에 배당을 삭감했다(연 1.82 → 0.61).
 * 그래서 **기계가 계산한 연수는 지금도 쓰지 않는다.** 지어낸 숫자를 안 쓰는 것과 같은 이유로,
 * 검증할 수 없는 숫자도 쓰지 않는다.
 *
 * ✅ **2026-08-04 추가**: 대신 사람이 소스에서 확인한 **시작 연도**(`streakStartYear`)를 종목별로
 * 둘 수 있게 했다. 계산이 아니라 **인용**이고, 연수는 화면이 `올해 − 시작연도` 로 다시 센다.
 * 확인하지 못한 종목은 비워 두고 목록의 하한(`50년 이상`)으로 말한다 — 근거·규칙은
 * `dividendLists.streak.ts`, 실제 값과 채택 기준은 `dividendLists.curated.ts` 의 `KINGS_STREAK_FACTS`.
 */

/**
 * 목록 식별자. 라우트 마지막 세그먼트(`/dividend/kings`)와 같은 문자열이다.
 *
 * 🔴 정본은 `shared/constants/routes`(의존성 0 리프)에 있다 — 라우터·nav·사이트맵이 목록 **데이터**를
 * 끌어오지 않고 경로만 알 수 있어야 하기 때문이다. 여기서는 그 타입을 그대로 쓴다.
 */
import type { DividendListId } from '@/shared/constants/routes';

export type { DividendListId };

/**
 * 정규화한 섹터. 소스마다 분류 체계가 달라(위키피디아는 GICS, dripinvesting 은 모닝스타) 그대로
 * 두면 같은 회사가 목록마다 다른 섹터로 보인다. 그래서 11개 GICS 섹터로 모은다
 * (`dividendLists.sectors.ts` 가 그 대응표의 단일 출처다).
 */
export type DividendListSectorId =
  | 'communicationServices'
  | 'consumerDiscretionary'
  | 'consumerStaples'
  | 'energy'
  | 'financials'
  | 'healthCare'
  | 'industrials'
  | 'informationTechnology'
  | 'materials'
  | 'realEstate'
  | 'utilities';

/** 출처가 이 목록에서 하는 역할. 화면의 출처 줄이 둘을 구분해 보여 준다. */
export type DividendListSourceRole =
  /** 목록을 만든 1차 소스. */
  | 'primary'
  /** 1차 소스와 대조해 어긋나면 싣지 않기 위한 교차검증 소스. */
  | 'crosscheck';

export type DividendListSource = {
  label: string;
  url: string;
  role: DividendListSourceRole;
  /** 실제로 응답을 받아 확인한 날짜(ISO, YYYY-MM-DD). "언제 기준인가"를 화면이 말할 근거다. */
  retrievedAt: string;
};

export type DividendListMember = {
  /**
   * 티커. 클래스 주식은 **점 표기**로 통일한다(`BF.B`). 소스마다 `BF/B`(ProShares)·`BF.B`(위키피디아)·
   * `BF-B`(야후)로 갈리므로 한 형태를 정해 두지 않으면 같은 회사가 두 줄로 들어온다.
   */
  ticker: string;
  /** 영문 회사명. 한국어 회사명은 소스에 없으므로 지어내지 않는다. */
  name: string;
  sector: DividendListSectorId;
  /**
   * 소스가 실제로 적어 준 섹터 문자열. 정규화 결과만 남기면 대응표가 틀렸을 때 되짚을 근거가 사라진다.
   */
  sourceSectorLabel: string;
  /**
   * 이 종목을 실었다고 확인해 준 소스의 `label` 목록. 배당킹처럼 소스가 서로 다른 목록에서는
   * **둘 이상이 동의한 종목만** 싣는 근거가 된다.
   */
  confirmedBy: string[];
  /**
   * 연속 증배가 **시작된 해**(스트릭의 첫 증배 연도). 확인하지 못한 종목은 **비운다**.
   *
   * 🔴 연수(`63년`)가 아니라 연도(`1963`)를 저장하는 이유: 연수는 해가 바뀌면 전부 틀린 값이 된다.
   * 연도를 두면 화면이 매년 스스로 다시 센다 — 46줄을 해마다 손으로 고치는 일이 사라진다.
   *
   * ⚠ **선택 필드다.** 배당귀족·배당챔피언은 시작 연도를 확인하지 않았고, 배당킹 중에도 소스가
   * 엇갈리는 종목이 있다. 없으면 화면은 목록의 하한(`50년 이상`)으로 말한다 — 근거는
   * `dividendLists.streak.ts`. 비어 있는 것과 "—"는 다르다: 하한도 정보다.
   */
  streakStartYear?: number;
  /**
   * 위 연도의 출처. 🔴 `streakStartYear` 가 있으면 이것도 반드시 있다(스키마가 강제한다).
   * 출처 없는 연수는 이 레포에서 지어낸 숫자와 같은 취급이다.
   */
  streakSource?: string;
  /**
   * 선행 배당률(%) = 최신 1회 지급액 × 연 지급횟수 ÷ 현재가.
   *
   * 🔴 **선행 방식이어야 한다.** 독립 소스 26종 대조 실측:
   *   작년+올해 누적 1.466pp 과대 · 최근 365일 합 0.053pp · **선행 0.014pp**(20종은 소수점까지 일치).
   *   같은 대조에서 가격은 26/26 완전 일치였다 — 야후 원자료는 정확하고 위험은 가공 방식에 있었다.
   * ⚠ `undefined` = 아직 실측이 안 붙었다 / `null` = 붙였지만 그 종목은 계산 불가.
   *   화면이 두 문장을 갈라 쓰므로 하나로 뭉개지 마라.
   */
  forwardYieldPercent?: number | null;
  /**
   * 최근 5년 배당 연평균 성장률(%). 완결 6개 연도가 없으면 `null`.
   *
   * 🔴 연간 **합계**가 아니라 그 해의 **규칙 배당**으로 계산한다. 합계로 하면 특별배당 한 건에
   *   CAGR 이 통째로 뒤집힌다 — 실측: 262종 중 12종이 마이너스로 나왔고 COST 는 −16.88%(실제 +13.18%),
   *   GIC −21.82%(실제 +13.18%)였다. 규칙 배당 기준으로 바꾸니 마이너스가 0종이 됐다.
   */
  fiveYearGrowthPercent?: number | null;
  /**
   * 이 **종목**의 연속 증배 하한(년). 목록 전체의 하한(`DividendList.minimumStreakYears`)과 다르다.
   *
   * 🔴 배당킹·귀족·챔피언에는 **없다.** 그 목록들은 "25년 이상" 같은 한 줄로만 보장하고, 종목별
   *    정확값은 계산이 불가능하다(이 파일 머리말의 실측 근거). 없는 값을 만들지 않는다.
   * ✅ 배당 히든스타에는 **있다.** 후보를 모은 ETF(SMDV 10년 · REGL 15년 · SDY 20년)가 종목마다
   *    다른 하한을 보장하기 때문이다. 그 차이를 버리면 44종이 전부 같은 등급으로 뭉개진다.
   */
  minimumStreakYears?: number;
};

export type DividendList = {
  id: DividendListId;
  /** 목록의 기준선(연속 증배 최소 연수). 배당킹 50, 배당귀족·배당챔피언 25. */
  minimumStreakYears: number;
  /**
   * 이 목록만의 상한. dripinvesting 은 배당챔피언(25~49년)과 배당킹(50년 이상)을 겹치지 않게 나눠
   * 싣는데, 그 사실을 화면이 말하지 않으면 다른 사이트와 숫자가 달라 보인다.
   */
  maximumStreakYears?: number;
  /** 기준일(ISO). 목록이 "언제의 사실"인지 — 화면에 반드시 노출한다. */
  asOf: string;
  sources: DividendListSource[];
  /**
   * 이 목록이 무엇을 담고 무엇을 담지 않는지에 대한 한 문단. 소스가 스스로 밝힌 전체 규모와 우리가
   * 확인한 규모가 다를 때(배당챔피언) 그 차이를 여기서 말한다.
   */
  coverageNote: string;
  members: DividendListMember[];
};

/** 목록별 스냅샷. 커밋되는 생성물(`dividendLists.generated.json`)의 형태이기도 하다. */
export type DividendListsSnapshot = {
  /** 생성 시각(ISO 날짜). 수집기를 돌린 적이 없으면 `null`. */
  asOf: string | null;
  /** 어떤 수집기가 만들었는지. 비어 있으면 `'curated'`(사람이 만든 목록 그대로). */
  source: string;
  /**
   * 자동 수집이 실제로 갱신한 목록만 들어온다. 여기 없는 목록은 큐레이션 값을 그대로 쓴다
   * (배당킹·배당챔피언은 신뢰할 만한 무료 기계 소스가 없어 자동 갱신 대상이 아니다).
   */
  lists: Partial<Record<DividendListId, DividendList>>;
  /**
   * 야후 전기간 배당이력으로 돌린 **가드** 결과. 목록을 고치지 않고 "사람이 봐야 할 줄"만 남긴다.
   * 판정자가 아니라 신고자다 — 이 값이 비어 있어도 화면은 정상이어야 한다.
   */
  verification?: DividendListsVerification;
};

/** 가드 한 줄. `severity`가 아니라 사실만 적는다 — 어떻게 다룰지는 사람이 정한다. */
export type DividendListVerificationFlag = {
  listId: DividendListId;
  ticker: string;
  /** `cut` = 연배당이 전년 대비 줄었다. `noHistory` = 배당이력을 못 받았다(소스 장애일 수도 있다). */
  kind: 'cut' | 'noHistory';
  /** 사람이 읽을 근거 한 줄(예: `2023년 1.820 → 2024년 0.610`). */
  detail: string;
};

export type DividendListsVerification = {
  checkedAt: string;
  /** 검사한 종목 수. 0이면 가드를 돌리지 않았다는 뜻이다(실패와 구분한다). */
  checkedCount: number;
  flags: DividendListVerificationFlag[];
};
