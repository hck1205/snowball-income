import type { DividendList, DividendListId, DividendListMember } from './dividendLists.types';

/**
 * 배당킹·배당귀족·배당챔피언 목록의 **사람이 소유하는 정본**.
 *
 * ⚠ 이 파일의 날짜는 전부 **UTC 기준**이다(`scripts/dividendLists` 가 `toISOString()` 을 쓴다).
 *   같은 순간이라도 KST 로는 하루 뒤일 수 있으니, 생성물의 `asOf` 와 여기 값을 비교할 때 그 차이를
 *   "둘 중 하나가 낡았다"로 읽지 마라.
 *
 * ## 왜 사람이 소유하는가 (기계에 맡기지 않은 이유)
 * 2026-08-03(UTC)에 무료 소스 4종을 실제로 받아 대조한 결과다.
 *  - **배당귀족**은 기계가 잘한다: ProShares NOBL 보유내역 CSV(69종)와 위키피디아 표(69종)가
 *    **69/69 완전 일치**했다(양쪽 모두에만 있는 종목 0). 그래서 `scripts/dividendLists` 가 이 목록을
 *    매달 다시 받아 `dividendLists.generated.json` 으로 덮어쓴다.
 *  - **배당킹**은 기계가 못 한다: stockanalysis.com 54종, dripinvesting.org 47종으로 서로 다르고
 *    (겹침 46종), stockanalysis 만 싣는 LEG 는 야후 실측상 2024년에 배당을 삭감했다
 *    (연 1.820 → 0.610). 단일 권위 소스가 없으므로 **둘이 동의한 46종만** 싣는다.
 *  - **배당챔피언**은 소스가 사실상 하나뿐이다(dripinvesting.org). 공식 Dividend Champions 파일은
 *    소멸했다 — dividendchampions.com 은 도메인 파킹이고, dripinvesting 의 스프레드시트는
 *    2024-11 재고에 내용도 목록이 아니라 DRiP 기록 템플릿이다.
 *
 * ## 이 파일을 고치는 절차 (분기 1회 리뷰)
 * 1. 아래 `sources` 의 URL 을 직접 열어 표를 받는다.
 * 2. 배당킹은 **두 소스가 모두 싣는 종목만** 남긴다(한쪽만 싣는 종목은 넣지 않는다).
 * 3. `npm run dividend:lists -- --verify` 로 야후 전기간 배당이력 가드를 돌려 삭감 신고를 확인한다.
 * 4. `asOf` 와 각 출처의 `retrievedAt` 을 실제로 받은 날짜로 고친다. **여기를 안 고치면 화면이
 *    낡은 기준일을 사실처럼 말한다.**
 * 5. 편입·제외가 있었으면 `KINGS_STREAK_FACTS` 도 함께 본다. ⚠ **연수는 안 고쳐도 된다** —
 *    거기 적는 건 연수가 아니라 시작 연도의 원자료라 해가 바뀌어도 그대로다. 고칠 때는 그 종목이
 *    그 사이에 증배를 했는지(= `마지막 증배 지급월`)만 다시 확인하면 된다.
 *
 * 🔴 연속 증배 "연수"는 **계산하지 않는다.** 종목별로 싣는 건 소스에서 인용한 **시작 연도**뿐이고
 * 연수는 화면이 매년 다시 센다 — 근거는 `dividendLists.types.ts` 머리말(기계 계산 오차 16~52%)과
 * `dividendLists.streak.ts`.
 */

/** 큐레이션 멤버는 `confirmedBy` 를 목록 단위로 붙인다 — 46줄에 같은 배열을 46번 적지 않는다. */
type CuratedMember = Omit<DividendListMember, 'confirmedBy'>;

/**
 * 🔴 **끊긴 회사명 복구표.** dripinvesting 의 표는 회사명을 **31자에서 자른다**(실측: 배당킹 47종 중
 * 4종, 배당챔피언 83종 중 14종이 정확히 31자). 자른 자리가 낱말 중간이라 화면에 그대로 내면
 * `Northwest Natural Holding Compa` 처럼 **우리 쪽 결함으로 보인다.**
 *
 * 여기 채우는 값의 출처는 둘뿐이다:
 *  ① 위키피디아 배당귀족 표에 같은 티커가 있으면 그 표기(CINF·XOM·EXPD·WST·MKC·APD·IBM)
 *  ② 없으면 해당 티커의 **법인 정식 명칭**(NWN·ORI·EPD·CBU·NJR·CNI·MATW)
 * 어느 쪽도 지어낸 값이 아니다 — 숫자는 하나도 손대지 않고, 잘린 문자열을 되돌리기만 한다.
 *
 * ⚠ 31자인데 실제로 안 잘린 이름도 있다(FRT·ADP·LECO·CSL) — 길이만 보고 자동으로 손대면 안 되므로
 *   **티커 단위 명시 목록**으로 둔다.
 */
const NAME_REPAIRS: Record<string, string> = {
  APD: 'Air Products and Chemicals, Inc.',
  CINF: 'Cincinnati Financial Corporation',
  NWN: 'Northwest Natural Holding Company',
  ORI: 'Old Republic International Corporation',
  EPD: 'Enterprise Products Partners L.P.',
  IBM: 'International Business Machines Corporation',
  XOM: 'Exxon Mobil Corporation',
  CBU: 'Community Financial System, Inc.',
  NJR: 'New Jersey Resources Corporation',
  EXPD: 'Expeditors International of Washington, Inc.',
  CNI: 'Canadian National Railway Company',
  WST: 'West Pharmaceutical Services, Inc.',
  MATW: 'Matthews International Corporation',
  MKC: 'McCormick & Company, Incorporated'
};

/**
 * 🔴 **연속 증배 시작 연도의 원자료.** 티커 → `[연속 증배 횟수, 그 마지막 증배가 실제로 지급된 달]`.
 *
 * ## 왜 시작 연도를 직접 적지 않고 이 둘을 적는가
 * 세상의 소스는 **횟수**만 싣는다("64 consecutive years"). 시작 연도를 적는 곳은 사실상 없다.
 * 그래서 시작 연도는 반드시 역산인데, **역산은 손으로 하면 반드시 틀린다**(46종 × 뺄셈).
 * 그래서 여기엔 **실제로 본 두 값만** 남기고 뺄셈은 `streakStartYearOf` 가 한다. 값 검증도 쉬워진다 —
 * 리뷰어는 소스 페이지의 숫자와 이 표의 숫자를 눈으로 맞춰 보면 된다.
 *
 * ## 두 값의 출처
 * - **횟수**: stockanalysis.com 배당킹 목록의 `Years` 열, 2026-08-04 확인. 이 파일이 이미 배당킹
 *   목록의 1차 소스로 쓰는 곳이다. 받아 온 54행이 **내림차순으로 정렬돼 있었고 그 단조성이 깨지지
 *   않았다** — 표 파싱이 열을 밀어 읽으면 가장 먼저 무너지는 성질이라, 값 정합성의 1차 검산이 된다.
 * - **마지막 증배 지급월**: 야후 chart 배당이력을 직접 훑어 "지급액이 계단식으로 올라 그 뒤로
 *   유지되는" 가장 최근 지급의 UTC 연·월을 뽑았다(2026-08-04 실측, 46종 전수).
 *
 * ## 🔴 왜 "올해"가 아니라 "마지막 증배가 지급된 해"에서 빼는가
 * 8월 기준으로 **기업마다 올해 증배를 이미 했는지가 다르다.** 여기 36종 중 12종은 아직 2026년
 * 증배 전이었다(ADP·AWR·DOV·EMR·FRT·NDSN·NWN·PPG·RPM·SCL·SWK·TNC — 전부 하반기 증배 기업).
 * 그 12종에서 `2026 − 횟수 + 1` 로 세면 시작 연도가 **한 해씩 앞으로 밀린다.**
 * 실측으로 확인한 사례: EMR 은 2025-11 지급부터 0.5275→0.555 로 올랐고 횟수는 69다.
 * `2025 − 69 + 1 = 1957`. 두 번째 소스도 같은 해를 가리킨다 — 2025-12-26 시점 목록은 EMR 을 68회로
 * 실었고 그때의 마지막 증배는 2024년이라 `2024 − 68 + 1 = 1957` 로 **같은 값**이다.
 * 반면 올해에서 빼면 1958 이 나와 두 소스 어느 쪽과도 맞지 않는다.
 *
 * ## 채택 기준 — 46종 중 36종만 채웠다 (빠진 10종은 아래 주석)
 * 1. stockanalysis 의 횟수를 **두 번째 소스**(dividendvaluebuilder.com 배당킹 목록, 2025-12-26)와
 *    맞춰 본다. 두 소스는 8개월 차이라 stockanalysis 가 0~2 더 큰 것이 정상이고, 그 범위 안이면
 *    **두 소스가 도출하는 시작 연도가 대수적으로 같다**(늦은 소스는 횟수도 기준 증배도 함께 밀린다).
 *    반대로 오래된 소스가 **더 큰** 횟수를 실었다면 그건 시차가 아니라 진짜 불일치다.
 * 2. 야후 지급이력에서 최근 구간에 **삭감이 없어야** 한다(연도별 최빈 지급액 기준).
 * 3. 역산한 시작 연도가 야후가 보여 주는 **첫 배당보다 앞서면 안 된다**(이력이 잘리지 않은 종목에서만
 *    의미 있는 검산이다 — 대부분은 1982~1990에서 잘려 있어 이 검산이 작동하지 않는다).
 */
const KINGS_STREAK_FACTS: Record<string, readonly [increases: number, latestRaisePaidAt: string]> = {
  ABM: [59, '2026-01'],
  ADM: [53, '2026-02'],
  ADP: [51, '2025-12'],
  AWR: [72, '2025-08'],
  BDX: [54, '2026-03'],
  BKH: [55, '2026-02'],
  CINF: [65, '2026-03'],
  CL: [63, '2026-04'],
  CWT: [59, '2026-02'],
  DOV: [71, '2025-08'],
  ED: [53, '2026-02'],
  EMR: [69, '2025-11'],
  FRT: [59, '2025-10'],
  FUL: [57, '2026-04'],
  GPC: [70, '2026-03'],
  GWW: [55, '2026-05'],
  HRL: [60, '2026-01'],
  JNJ: [64, '2026-05'],
  KMB: [54, '2026-03'],
  KO: [64, '2026-03'],
  MSA: [56, '2026-05'],
  NDSN: [63, '2025-09'],
  NFG: [56, '2026-06'],
  NWN: [71, '2025-10'],
  PEP: [54, '2026-06'],
  PG: [70, '2026-04'],
  PH: [70, '2026-05'],
  PPG: [55, '2025-08'],
  RPM: [53, '2025-10'],
  SCL: [58, '2025-11'],
  SPGI: [53, '2026-02'],
  SWK: [59, '2025-09'],
  SYY: [57, '2026-07'],
  TNC: [54, '2025-11'],
  UVV: [56, '2026-07'],
  WMT: [53, '2026-03']
};

/**
 * 🔴 **일부러 비운 배당킹 10종.** 다음 리뷰에서 "왜 안 채웠지?"로 되돌아오지 않게 근거를 남긴다.
 * 비어 있어도 화면은 "50년 이상"으로 말하므로 빈칸이 되지 않는다.
 *
 * | 티커 | 왜 못 채웠나 (전부 2026-08-04 실측) |
 * |---|---|
 * | LOW  | 두 소스가 54 vs 63 으로 **9년** 다르다. 63은 "1961년 상장 이래 매분기 배당을 **지급**"과 |
 * |      | 연속 **증배**를 섞은 값으로 보이지만, 어느 쪽이 맞는지 우리가 판정할 근거가 없다. |
 * | ITW  | 56 vs 62 로 **6년** 차이. 위와 같은 형태로 의심되나 확인 불가. |
 * | TGT  | 55 vs 58 로 **3년** 차이. |
 * | TR   | 57 vs 59 로 **2년** 차이. 매년 3% 주식배당을 섞어 지급해 현금 배당 이력만으로는 못 가른다. |
 * | MCD  | 역산하면 1975년 시작인데 **야후 이력의 첫 배당이 1976년**이다(1976은 잘린 구간이 아니라 |
 * |      | 실제 첫 배당). 시작이 첫 배당보다 앞설 수 없으므로 횟수 쪽이 틀렸다. 다른 소스는 이 종목을 |
 * |      | 배당킹이 아니라 "49년 연속 배당챔피언"으로 싣는다 — 판단이 갈리는 자리다. |
 * | RLI  | 최신 회차가 특별배당(0.16 → 2.18)이라 "계단식 상승" 탐지가 오염된다. 기준 증배 시점을 |
 * |      | 기계가 못 고른다(같은 이유로 후보 유니버스에서도 지표가 비어 있다). |
 * | MO   | 야후 실측상 최빈 지급액이 2007년 0.80→0.75, 2008년 0.75→0.32 로 **줄었다**(크래프트·PMI |
 * |      | 분사). 기업행위 조정 전 원자료라 "삭감 없음" 검산을 통과하지 못한다. |
 * | NUE  | 같은 검산에서 2008년 0.61→0.52, 2009년 0.52→0.35 로 줄었다(특별·추가 지급이 섞인 해). |
 * | CBSH | 매년 5% 주식배당을 해 소급조정된 현금액이 2011년에 0.14427→0.1412 로 줄어 보인다. |
 * | MGEE | dividendvaluebuilder 목록에 없어 **두 번째 소스가 아예 없다.** 한 소스만으로는 쓰지 않는다. |
 */
export const KINGS_STREAK_UNRESOLVED = [
  'CBSH',
  'ITW',
  'LOW',
  'MCD',
  'MGEE',
  'MO',
  'NUE',
  'RLI',
  'TGT',
  'TR'
] as const;

/**
 * 시작 연도 = `마지막 증배가 지급된 해 − 증배 횟수 + 1`.
 * `+1` 은 첫 증배 연도가 1년째이기 때문이다(1963년 시작 · 64회 → 마지막 증배는 2026년).
 */
const streakStartYearOf = ([increases, latestRaisePaidAt]: readonly [number, string]): number =>
  Number(latestRaisePaidAt.slice(0, 4)) - increases + 1;

/** 값 옆에 붙는 출처 — 리뷰어가 되짚을 수 있게 **두 입력값을 그대로** 담는다. */
const streakSourceOf = ([increases, latestRaisePaidAt]: readonly [number, string]): string =>
  `stockanalysis.com 연속 증배 ${increases}회(2026-08-04 확인) · 야후 실측 최근 증배 지급 ${latestRaisePaidAt}`;

/**
 * @param repairNames dripinvesting 에서 온 목록(배당킹·배당챔피언)만 `true`. 배당귀족은 위키피디아
 *   표기를 그대로 쓰므로 손대지 않는다 — 손대면 자동 수집본(같은 위키 표기)과 폴백이 어긋난다.
 * @param streakFacts 시작 연도를 채울 종목의 원자료. 표에 없는 종목은 **필드 자체를 안 붙인다**
 *   (`undefined` 를 넣지 않는다 — `exactOptionalPropertyTypes` 여부와 무관하게 "없음"이 한 형태여야
 *   화면·스키마가 같은 판단을 한다).
 */
const withConfirmedBy = (
  members: readonly CuratedMember[],
  confirmedBy: readonly string[],
  repairNames = false,
  streakFacts: Record<string, readonly [number, string]> = {}
): DividendListMember[] =>
  members.map((member) => {
    const facts = streakFacts[member.ticker];
    return {
      ...member,
      name: (repairNames ? NAME_REPAIRS[member.ticker] : undefined) ?? member.name,
      confirmedBy: [...confirmedBy],
      ...(facts === undefined
        ? {}
        : { streakStartYear: streakStartYearOf(facts), streakSource: streakSourceOf(facts) })
    };
  });

const KINGS_CONFIRMED_BY = ['stockanalysis.com', 'DRiP Investing Resource Center'] as const;
const ARISTOCRATS_CONFIRMED_BY = ['ProShares NOBL 보유내역', 'Wikipedia'] as const;
const CHAMPIONS_CONFIRMED_BY = ['DRiP Investing Resource Center'] as const;

/**
 * 배당킹 — 두 소스가 모두 싣는 46종.
 *
 * ⚠ **일부러 뺀 9종**을 기록해 둔다. 다음 리뷰에서 "왜 빠졌지?"로 되돌아오지 않게 하기 위해서다.
 *  - stockanalysis 만 싣는 8종: ABBV · ABT · APD · BF.B · GRC · LEG · MSEX · TDS.
 *    이 중 **LEG 는 명백한 오류**다(야후 실측 연배당 2023년 1.820 → 2024년 0.610 삭감).
 *    ABBV·ABT 는 2013년 분사로 배당 이력이 갈려 소스마다 판정이 다르다.
 *  - dripinvesting 만 싣는 1종: UBSI. (야후 실측 연배당 2022~2025 1.44 → 1.45 → 1.48 → 1.49 로
 *    증가가 이어져 dripinvesting 쪽이 맞아 보이지만, 교차확인 규칙을 종목마다 예외로 흔들지 않는다.)
 */
const KINGS_MEMBERS: readonly CuratedMember[] = [
  { ticker: 'ABM', name: "ABM Industries Incorporated", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'ADM', name: "Archer-Daniels-Midland Company", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Defensive' },
  { ticker: 'ADP', name: "Automatic Data Processing, Inc.", sector: 'informationTechnology', sourceSectorLabel: 'Technology' },
  { ticker: 'AWR', name: "American States Water Company", sector: 'utilities', sourceSectorLabel: 'Utilities' },
  { ticker: 'BDX', name: "Becton, Dickinson and Company", sector: 'healthCare', sourceSectorLabel: 'Healthcare' },
  { ticker: 'BKH', name: "Black Hills Corporation", sector: 'utilities', sourceSectorLabel: 'Utilities' },
  { ticker: 'CBSH', name: "Commerce Bancshares, Inc.", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'CINF', name: "Cincinnati Financial Corporatio", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'CL', name: "Colgate-Palmolive Company", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Defensive' },
  { ticker: 'CWT', name: "California Water Service Group", sector: 'utilities', sourceSectorLabel: 'Utilities' },
  { ticker: 'DOV', name: "Dover Corporation", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'ED', name: "Consolidated Edison, Inc.", sector: 'utilities', sourceSectorLabel: 'Utilities' },
  { ticker: 'EMR', name: "Emerson Electric Company", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'FRT', name: "Federal Realty Investment Trust", sector: 'realEstate', sourceSectorLabel: 'Real Estate' },
  { ticker: 'FUL', name: "H. B. Fuller Company", sector: 'materials', sourceSectorLabel: 'Basic Materials' },
  { ticker: 'GPC', name: "Genuine Parts Company", sector: 'consumerDiscretionary', sourceSectorLabel: 'Consumer Cyclical' },
  { ticker: 'GWW', name: "W.W. Grainger, Inc.", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'HRL', name: "Hormel Foods Corporation", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Defensive' },
  { ticker: 'ITW', name: "Illinois Tool Works Inc.", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'JNJ', name: "Johnson & Johnson", sector: 'healthCare', sourceSectorLabel: 'Healthcare' },
  { ticker: 'KMB', name: "Kimberly-Clark Corporation", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Defensive' },
  { ticker: 'KO', name: "Coca-Cola Company (The)", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Defensive' },
  { ticker: 'LOW', name: "Lowe's Companies, Inc.", sector: 'consumerDiscretionary', sourceSectorLabel: 'Consumer Cyclical' },
  { ticker: 'MCD', name: "McDonald's Corporation", sector: 'consumerDiscretionary', sourceSectorLabel: 'Consumer Cyclical' },
  { ticker: 'MGEE', name: "MGE Energy Inc.", sector: 'utilities', sourceSectorLabel: 'Utilities' },
  { ticker: 'MO', name: "Altria Group, Inc.", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Defensive' },
  { ticker: 'MSA', name: "MSA Safety Incorporated", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'NDSN', name: "Nordson Corporation", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'NFG', name: "National Fuel Gas Company", sector: 'energy', sourceSectorLabel: 'Energy' },
  { ticker: 'NUE', name: "Nucor Corporation", sector: 'materials', sourceSectorLabel: 'Basic Materials' },
  { ticker: 'NWN', name: "Northwest Natural Holding Compa", sector: 'utilities', sourceSectorLabel: 'Utilities' },
  { ticker: 'PEP', name: "Pepsico, Inc.", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Defensive' },
  { ticker: 'PG', name: "Procter & Gamble Company (The)", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Defensive' },
  { ticker: 'PH', name: "Parker-Hannifin Corporation", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'PPG', name: "PPG Industries, Inc.", sector: 'materials', sourceSectorLabel: 'Basic Materials' },
  { ticker: 'RLI', name: "RLI Corp.", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'RPM', name: "RPM International Inc.", sector: 'materials', sourceSectorLabel: 'Basic Materials' },
  { ticker: 'SCL', name: "Stepan Company", sector: 'materials', sourceSectorLabel: 'Basic Materials' },
  { ticker: 'SPGI', name: "S&P Global Inc.", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'SWK', name: "Stanley Black & Decker, Inc.", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'SYY', name: "Sysco Corporation", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Defensive' },
  { ticker: 'TGT', name: "Target Corporation", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Defensive' },
  { ticker: 'TNC', name: "Tennant Company", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'TR', name: "Tootsie Roll Industries, Inc.", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Defensive' },
  { ticker: 'UVV', name: "Universal Corporation", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Defensive' },
  { ticker: 'WMT', name: "Walmart Inc.", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Defensive' }
];

/**
 * 배당귀족 — S&P 500 소속 + 25년 이상. **지수에 실제로 편입된 종목**이 기준이다.
 *
 * ⚠ "S&P 500 소속이고 25년 이상"이라는 서술과 "실제 지수 편입"은 같지 않다. stockanalysis 의
 * 배당귀족 목록(68종)은 여기와 9종이 다르다. 우리는 **지수 추종 ETF(NOBL)가 실제로 들고 있는 것**을
 * 기준으로 삼고, 그 사실을 화면에서 밝힌다.
 *
 * 이 배열은 자동 수집이 실패했을 때의 **폴백**이기도 하다 — 평상시 화면은
 * `dividendLists.generated.json` 의 최신 스냅샷을 본다.
 */
const ARISTOCRATS_MEMBERS: readonly CuratedMember[] = [
  { ticker: 'ABBV', name: "AbbVie", sector: 'healthCare', sourceSectorLabel: 'Health Care' },
  { ticker: 'ABT', name: "Abbott Laboratories", sector: 'healthCare', sourceSectorLabel: 'Health Care' },
  { ticker: 'ADM', name: "Archer-Daniels-Midland Co", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Staples' },
  { ticker: 'ADP', name: "Automatic Data Processing", sector: 'informationTechnology', sourceSectorLabel: 'Information Technology' },
  { ticker: 'AFL', name: "AFLAC", sector: 'financials', sourceSectorLabel: 'Financials' },
  { ticker: 'ALB', name: "Albemarle Corporation", sector: 'materials', sourceSectorLabel: 'Materials' },
  { ticker: 'AMCR', name: "Amcor", sector: 'materials', sourceSectorLabel: 'Materials' },
  { ticker: 'AOS', name: "A.O. Smith", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'APD', name: "Air Products & Chemicals", sector: 'materials', sourceSectorLabel: 'Materials' },
  { ticker: 'ATO', name: "Atmos Energy Corp", sector: 'utilities', sourceSectorLabel: 'Utilities' },
  { ticker: 'BDX', name: "Becton Dickinson & Co", sector: 'healthCare', sourceSectorLabel: 'Health Care' },
  { ticker: 'BEN', name: "Franklin Resources Inc", sector: 'financials', sourceSectorLabel: 'Financials' },
  { ticker: 'BF.B', name: "Brown–Forman (class B)", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Staples' },
  { ticker: 'BRO', name: "Brown & Brown Inc.", sector: 'financials', sourceSectorLabel: 'Financials' },
  { ticker: 'CAH', name: "Cardinal Health Inc", sector: 'healthCare', sourceSectorLabel: 'Health Care' },
  { ticker: 'CAT', name: "Caterpillar Inc", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'CB', name: "Chubb Limited", sector: 'financials', sourceSectorLabel: 'Financials' },
  { ticker: 'CHD', name: "Church & Dwight", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Staples' },
  { ticker: 'CHRW', name: "C.H. Robinson", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'CINF', name: "Cincinnati Financial Corp", sector: 'financials', sourceSectorLabel: 'Financials' },
  { ticker: 'CL', name: "Colgate-Palmolive", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Staples' },
  { ticker: 'CLX', name: "Clorox", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Staples' },
  { ticker: 'CTAS', name: "Cintas Corp", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'CVX', name: "Chevron Corp", sector: 'energy', sourceSectorLabel: 'Energy' },
  { ticker: 'DOV', name: "Dover Corp", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'ECL', name: "Ecolab Inc", sector: 'materials', sourceSectorLabel: 'Materials' },
  { ticker: 'ED', name: "Consolidated Edison Inc", sector: 'utilities', sourceSectorLabel: 'Utilities' },
  { ticker: 'EMR', name: "Emerson Electric", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'ERIE', name: "Erie Indemnity", sector: 'financials', sourceSectorLabel: 'Financials' },
  { ticker: 'ES', name: "Eversource Energy", sector: 'utilities', sourceSectorLabel: 'Utilities' },
  { ticker: 'ESS', name: "Essex Property Trust", sector: 'realEstate', sourceSectorLabel: 'Real Estate' },
  { ticker: 'EXPD', name: "Expeditors International of Washington", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'FAST', name: "Fastenal", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'FDS', name: "FactSet Research Systems", sector: 'financials', sourceSectorLabel: 'Financials' },
  { ticker: 'FRT', name: "Federal Realty Investment Trust", sector: 'realEstate', sourceSectorLabel: 'Real Estate' },
  { ticker: 'GD', name: "General Dynamics", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'GPC', name: "Genuine Parts Company", sector: 'consumerDiscretionary', sourceSectorLabel: 'Consumer Discretionary' },
  { ticker: 'GWW', name: "W. W. Grainger", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'HRL', name: "Hormel Foods Corp", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Staples' },
  { ticker: 'IBM', name: "IBM", sector: 'informationTechnology', sourceSectorLabel: 'Information Technology' },
  { ticker: 'ITW', name: "Illinois Tool Works", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'JNJ', name: "Johnson & Johnson", sector: 'healthCare', sourceSectorLabel: 'Health Care' },
  { ticker: 'KMB', name: "Kimberly-Clark", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Staples' },
  { ticker: 'KO', name: "Coca-Cola Co", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Staples' },
  { ticker: 'KVUE', name: "Kenvue, Inc.", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Staples' },
  { ticker: 'LIN', name: "Linde plc", sector: 'materials', sourceSectorLabel: 'Materials' },
  { ticker: 'LOW', name: "Lowe's", sector: 'consumerDiscretionary', sourceSectorLabel: 'Consumer Discretionary' },
  { ticker: 'MCD', name: "McDonald's Corp", sector: 'consumerDiscretionary', sourceSectorLabel: 'Consumer Discretionary' },
  { ticker: 'MDT', name: "Medtronic plc", sector: 'healthCare', sourceSectorLabel: 'Health Care' },
  { ticker: 'MKC', name: "McCormick & Company", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Staples' },
  { ticker: 'NDSN', name: "Nordson Corp", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'NEE', name: "NextEra Energy", sector: 'utilities', sourceSectorLabel: 'Utilities' },
  { ticker: 'NUE', name: "Nucor Corp", sector: 'materials', sourceSectorLabel: 'Materials' },
  { ticker: 'O', name: "Realty Income", sector: 'realEstate', sourceSectorLabel: 'Real Estate' },
  { ticker: 'PEP', name: "PepsiCo", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Staples' },
  { ticker: 'PG', name: "Procter & Gamble", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Staples' },
  { ticker: 'PNR', name: "Pentair", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'PPG', name: "PPG Industries", sector: 'materials', sourceSectorLabel: 'Materials' },
  { ticker: 'ROP', name: "Roper Technologies", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'SHW', name: "Sherwin-Williams", sector: 'materials', sourceSectorLabel: 'Materials' },
  { ticker: 'SJM', name: "The J. M. Smucker Company", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Staples' },
  { ticker: 'SPGI', name: "S&P Global Inc", sector: 'financials', sourceSectorLabel: 'Financials' },
  { ticker: 'SWK', name: "Stanley Black & Decker", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'SYY', name: "Sysco Corp", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Staples' },
  { ticker: 'TGT', name: "Target Corp", sector: 'consumerDiscretionary', sourceSectorLabel: 'Consumer Discretionary' },
  { ticker: 'TROW', name: "T Rowe Price Group Inc", sector: 'financials', sourceSectorLabel: 'Financials' },
  { ticker: 'WMT', name: "Walmart Inc.", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Staples' },
  { ticker: 'WST', name: "West Pharmaceutical Services", sector: 'healthCare', sourceSectorLabel: 'Health Care' },
  { ticker: 'XOM', name: "Exxon Mobil Corp", sector: 'energy', sourceSectorLabel: 'Energy' }
];

/**
 * 배당챔피언 — 미국 상장 전체에서 25년 이상. **S&P 500 소속 조건이 없다**는 점이 배당귀족과 다르다.
 *
 * 🔴 출처(dripinvesting)는 배당챔피언과 배당킹을 **겹치지 않게** 나눠 싣는다 — 이 표에 50년 이상
 * 종목은 하나도 없다(실측: 배당챔피언 83종 ∩ 배당킹 47종 = 0종). 그래서 우리 화면도 이 목록을
 * **25~49년 구간**으로 명시한다. 그 말을 빼면 "왜 KO 가 챔피언에 없나"라는 오해가 반드시 생긴다.
 */
const CHAMPIONS_MEMBERS: readonly CuratedMember[] = [
  { ticker: 'AFL', name: "AFLAC Incorporated", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'ALB', name: "Albemarle Corporation", sector: 'materials', sourceSectorLabel: 'Basic Materials' },
  { ticker: 'ALRS', name: "Alerus Financial Corporation", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'ANDE', name: "The Andersons, Inc.", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Defensive' },
  { ticker: 'AOS', name: "A.O. Smith Corporation", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'APD', name: "Air Products and Chemicals, Inc", sector: 'materials', sourceSectorLabel: 'Basic Materials' },
  { ticker: 'AROW', name: "Arrow Financial Corporation", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'ATO', name: "Atmos Energy Corporation", sector: 'utilities', sourceSectorLabel: 'Utilities' },
  { ticker: 'ATR', name: "AptarGroup, Inc.", sector: 'healthCare', sourceSectorLabel: 'Healthcare' },
  { ticker: 'BANF', name: "BancFirst Corporation", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'BEN', name: "Franklin Resources, Inc.", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'BMI', name: "Badger Meter, Inc.", sector: 'informationTechnology', sourceSectorLabel: 'Technology' },
  { ticker: 'BRC', name: "Brady Corporation", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'BRO', name: "Brown & Brown, Inc.", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'CASY', name: "Caseys General Stores, Inc.", sector: 'consumerDiscretionary', sourceSectorLabel: 'Consumer Cyclical' },
  { ticker: 'CAT', name: "Caterpillar, Inc.", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'CB', name: "Chubb Limited", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'CBU', name: "Community Financial System, Inc", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'CFR', name: "Cullen/Frost Bankers, Inc.", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'CHD', name: "Church & Dwight Company, Inc.", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Defensive' },
  { ticker: 'CHRW', name: "C.H. Robinson Worldwide, Inc.", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'CLX', name: "Clorox Company (The)", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Defensive' },
  { ticker: 'CNI', name: "Canadian National Railway Compa", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'CSL', name: "Carlisle Companies Incorporated", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'CTAS', name: "Cintas Corporation", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'CTBI', name: "Community Trust Bancorp, Inc.", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'CVX', name: "Chevron Corporation", sector: 'energy', sourceSectorLabel: 'Energy' },
  { ticker: 'DCI', name: "Donaldson Company, Inc.", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'ECL', name: "Ecolab Inc.", sector: 'materials', sourceSectorLabel: 'Basic Materials' },
  { ticker: 'ENB', name: "Enbridge Inc", sector: 'energy', sourceSectorLabel: 'Energy' },
  { ticker: 'EPD', name: "Enterprise Products Partners L.", sector: 'energy', sourceSectorLabel: 'Energy' },
  { ticker: 'ERIE', name: "Erie Indemnity Company", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'ES', name: "Eversource Energy (D/B/A)", sector: 'utilities', sourceSectorLabel: 'Utilities' },
  { ticker: 'ESS', name: "Essex Property Trust, Inc.", sector: 'realEstate', sourceSectorLabel: 'Real Estate' },
  { ticker: 'EXPD', name: "Expeditors International of Was", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'FAST', name: "Fastenal Company", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'FDS', name: "FactSet Research Systems Inc.", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'FELE', name: "Franklin Electric Co., Inc.", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'GD', name: "General Dynamics Corporation", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'GGG', name: "Graco Inc.", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'HTO', name: "H2O America", sector: 'utilities', sourceSectorLabel: 'Utilities' },
  { ticker: 'IBM', name: "International Business Machines", sector: 'informationTechnology', sourceSectorLabel: 'Technology' },
  { ticker: 'JKHY', name: "Jack Henry & Associates, Inc.", sector: 'informationTechnology', sourceSectorLabel: 'Technology' },
  { ticker: 'LECO', name: "Lincoln Electric Holdings, Inc.", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'LIN', name: "Linde plc", sector: 'materials', sourceSectorLabel: 'Basic Materials' },
  { ticker: 'MATW', name: "Matthews International Corporat", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'MDT', name: "Medtronic plc.", sector: 'healthCare', sourceSectorLabel: 'Healthcare' },
  { ticker: 'MGRC', name: "McGrath RentCorp", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'MKC', name: "McCormick & Company, Incorporat", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Defensive' },
  { ticker: 'MZTI', name: "The Marzetti Company", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Defensive' },
  { ticker: 'NEE', name: "NextEra Energy, Inc.", sector: 'utilities', sourceSectorLabel: 'Utilities' },
  { ticker: 'NJR', name: "NewJersey Resources Corporation", sector: 'utilities', sourceSectorLabel: 'Utilities' },
  { ticker: 'NNN', name: "NNN REIT, Inc.", sector: 'realEstate', sourceSectorLabel: 'Real Estate' },
  { ticker: 'NWFL', name: "Norwood Financial Corp.", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'O', name: "Realty Income Corporation", sector: 'realEstate', sourceSectorLabel: 'Real Estate' },
  { ticker: 'ORI', name: "Old Republic International Corp", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'OZK', name: "Bank OZK", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'PB', name: "Prosperity Bancshares, Inc.", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'PII', name: "Polaris Inc.", sector: 'consumerDiscretionary', sourceSectorLabel: 'Consumer Cyclical' },
  { ticker: 'RGCO', name: "RGC Resources Inc.", sector: 'utilities', sourceSectorLabel: 'Utilities' },
  { ticker: 'RNR', name: "RenaissanceRe Holdings Ltd.", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'ROP', name: "Roper Technologies, Inc.", sector: 'informationTechnology', sourceSectorLabel: 'Technology' },
  { ticker: 'RTX', name: "RTX Corporation", sector: 'industrials', sourceSectorLabel: 'Industrials' },
  { ticker: 'SBSI', name: "Southside Bancshares, Inc.", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'SEIC', name: "SEI Investments Company", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'SHW', name: "Sherwin-Williams Company (The)", sector: 'materials', sourceSectorLabel: 'Basic Materials' },
  { ticker: 'SJM', name: "The J.M. Smucker Company", sector: 'consumerStaples', sourceSectorLabel: 'Consumer Defensive' },
  { ticker: 'SON', name: "Sonoco Products Company", sector: 'consumerDiscretionary', sourceSectorLabel: 'Consumer Cyclical' },
  { ticker: 'SRCE', name: "1st Source Corporation", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'SYK', name: "Stryker Corporation", sector: 'healthCare', sourceSectorLabel: 'Healthcare' },
  { ticker: 'THFF', name: "First Financial Corporation", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'TMP', name: "Tompkins Financial Corporation", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'TROW', name: "T. Rowe Price Group, Inc.", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'UGI', name: "UGI Corporation", sector: 'utilities', sourceSectorLabel: 'Utilities' },
  { ticker: 'UHT', name: "Universal Health Realty Income", sector: 'realEstate', sourceSectorLabel: 'Real Estate' },
  { ticker: 'UMBF', name: "UMB Financial Corporation", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'WABC', name: "Westamerica Bancorporation", sector: 'financials', sourceSectorLabel: 'Financial Services' },
  { ticker: 'WLY', name: "John Wiley & Sons, Inc.", sector: 'communicationServices', sourceSectorLabel: 'Communication Services' },
  { ticker: 'WLYB', name: "John Wiley & Sons, Inc.", sector: 'communicationServices', sourceSectorLabel: 'Communication Services' },
  { ticker: 'WST', name: "West Pharmaceutical Services, I", sector: 'healthCare', sourceSectorLabel: 'Healthcare' },
  { ticker: 'WTRG', name: "Essential Utilities, Inc.", sector: 'utilities', sourceSectorLabel: 'Utilities' },
  { ticker: 'XOM', name: "ExxonMobil Holdings Corporation", sector: 'energy', sourceSectorLabel: 'Energy' },
  { ticker: 'YORW', name: "The York Water Company", sector: 'utilities', sourceSectorLabel: 'Utilities' }
];

/**
 * 목록 정본. `asOf` 는 **실제로 소스를 받은 날짜**다(2026-08-04, 이 파일을 만든 날).
 * ⚠ NOBL 보유내역 파일 자체의 기준일은 그보다 앞선다(파일 머리말 `AS OF 7/31/2026`) — 지수 편입은
 *   일 단위로 바뀌는 값이 아니라 이 차이를 목록 기준일로 흡수한다.
 */
export const CURATED_DIVIDEND_LISTS: Record<DividendListId, DividendList> = {
  kings: {
    id: 'kings',
    minimumStreakYears: 50,
    asOf: '2026-08-03',
    sources: [
      {
        label: 'stockanalysis.com',
        url: 'https://stockanalysis.com/list/dividend-kings/',
        role: 'primary',
        retrievedAt: '2026-08-03'
      },
      {
        label: 'DRiP Investing Resource Center',
        url: 'https://www.dripinvesting.org/dividend-kings/',
        role: 'crosscheck',
        retrievedAt: '2026-08-03'
      }
    ],
    coverageNote:
      '배당킹에는 단일 권위 소스가 없습니다. 두 소스가 각각 54종·47종을 실었고, 이 목록은 둘 다 실은 46종만 담았습니다. 한쪽에만 있는 9종은 판단이 갈려 제외했습니다. 연속 증배가 시작된 해는 두 소스의 증배 횟수가 서로 어긋나지 않고 배당 이력에도 삭감이 없는 36종만 적었고, 나머지 10종은 목록의 기준인 50년 이상으로만 표시합니다.',
    members: withConfirmedBy(KINGS_MEMBERS, KINGS_CONFIRMED_BY, true, KINGS_STREAK_FACTS)
  },
  aristocrats: {
    id: 'aristocrats',
    minimumStreakYears: 25,
    asOf: '2026-08-03',
    sources: [
      {
        label: 'ProShares NOBL 보유내역',
        url: 'https://accounts.profunds.com/etfdata/psdlyhld.csv',
        role: 'primary',
        retrievedAt: '2026-08-03'
      },
      {
        label: 'Wikipedia',
        url: 'https://en.wikipedia.org/wiki/S%26P_500_Dividend_Aristocrats',
        role: 'crosscheck',
        retrievedAt: '2026-08-03'
      }
    ],
    coverageNote:
      'S&P 500 배당귀족 지수를 추종하는 ETF(NOBL)의 보유내역에서 편입 종목을 확인하고, 위키피디아 구성종목 표와 대조했습니다. 두 소스는 69종에서 완전히 일치했습니다.',
    members: withConfirmedBy(ARISTOCRATS_MEMBERS, ARISTOCRATS_CONFIRMED_BY)
  },
  champions: {
    id: 'champions',
    minimumStreakYears: 25,
    maximumStreakYears: 49,
    asOf: '2026-08-03',
    sources: [
      {
        label: 'DRiP Investing Resource Center',
        url: 'https://www.dripinvesting.org/dividend-champions/',
        role: 'primary',
        retrievedAt: '2026-08-03'
      }
    ],
    coverageNote:
      '출처는 배당챔피언과 배당킹을 겹치지 않게 나눠 싣습니다. 그래서 이 목록은 연속 증배 25~49년 구간이며, 50년 이상은 배당킹 목록에 있습니다. 출처 페이지 본문은 전체 139종을 언급하지만 공개된 표에는 83종이 실려 있어, 확인한 83종만 담았습니다.',
    members: withConfirmedBy(CHAMPIONS_MEMBERS, CHAMPIONS_CONFIRMED_BY, true)
  }
};
