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
 *
 * 🔴 연속 증배 "연수"는 종목별로 싣지 않는다 — 근거는 `dividendLists.types.ts` 머리말(실측 오차 16~52%).
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
 * @param repairNames dripinvesting 에서 온 목록(배당킹·배당챔피언)만 `true`. 배당귀족은 위키피디아
 *   표기를 그대로 쓰므로 손대지 않는다 — 손대면 자동 수집본(같은 위키 표기)과 폴백이 어긋난다.
 */
const withConfirmedBy = (
  members: readonly CuratedMember[],
  confirmedBy: readonly string[],
  repairNames = false
): DividendListMember[] =>
  members.map((member) => ({
    ...member,
    name: (repairNames ? NAME_REPAIRS[member.ticker] : undefined) ?? member.name,
    confirmedBy: [...confirmedBy]
  }));

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
      '배당킹에는 단일 권위 소스가 없습니다. 두 소스가 각각 54종·47종을 실었고, 이 목록은 둘 다 실은 46종만 담았습니다. 한쪽에만 있는 9종은 판단이 갈려 제외했습니다.',
    members: withConfirmedBy(KINGS_MEMBERS, KINGS_CONFIRMED_BY, true)
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
