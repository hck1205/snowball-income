import {
  applyMarketData,
  MARKET_DATA,
  type MarketDataEntry,
  type MarketDataOverlaid,
  type MarketDataSnapshot
} from '@/shared/constants/marketData';
import { toDerivedDividendGrowthPercent } from '@/shared/lib/snowball';
import { US_DIVIDEND_GROWTH_ETFS } from './usDividendGrowthEtfs';
import { US_HIGH_DIVIDEND_ETFS } from './usHighDividendEtfs';
import { OPTION_INCOME_ETFS } from './optionIncomeEtfs';
import { INTERNATIONAL_DIVIDEND_ETFS } from './internationalDividendEtfs';
import { REIT_ETFS } from './reitEtfs';
import { DIVIDEND_GROWTH_STOCKS } from './dividendGrowthStocks';
import { HIGH_DIVIDEND_STOCKS } from './highDividendStocks';
import { CORE_INDEX_ETFS } from './coreIndexEtfs';
import { SEMICONDUCTOR_DIVIDEND_GROWTH_PORTFOLIO } from './semiconductorDividendGrowthPortfolio';
import { AI_INFRA_ETFS_AND_STOCKS } from './aiInfraEtfsAndStocks';
import { MEGA_CAP_GROWTH_STOCKS } from './megaCapGrowthStocks';
import { FINANCIAL_DIVIDEND_STOCKS } from './financialDividendStocks';
import { DIVIDEND_ARISTOCRAT_STOCKS } from './dividendAristocratStocks';
import { GURU_HOLDING_STOCKS } from './guruHoldingStocks';
import { KOREAN_DIVIDEND_TICKERS } from './koreanDividendTickers';
import { WELL_KNOWN_DIVIDEND_STOCKS } from './wellKnownDividendStocks';

export { US_DIVIDEND_GROWTH_ETFS } from './usDividendGrowthEtfs';
export { US_HIGH_DIVIDEND_ETFS } from './usHighDividendEtfs';
export { OPTION_INCOME_ETFS } from './optionIncomeEtfs';
export { INTERNATIONAL_DIVIDEND_ETFS } from './internationalDividendEtfs';
export { REIT_ETFS } from './reitEtfs';
export { DIVIDEND_GROWTH_STOCKS } from './dividendGrowthStocks';
export { HIGH_DIVIDEND_STOCKS } from './highDividendStocks';
export { CORE_INDEX_ETFS } from './coreIndexEtfs';
export { SEMICONDUCTOR_DIVIDEND_GROWTH_PORTFOLIO } from './semiconductorDividendGrowthPortfolio';
export { AI_INFRA_ETFS_AND_STOCKS } from './aiInfraEtfsAndStocks';
export { MEGA_CAP_GROWTH_STOCKS } from './megaCapGrowthStocks';
export { FINANCIAL_DIVIDEND_STOCKS } from './financialDividendStocks';
export { DIVIDEND_ARISTOCRAT_STOCKS } from './dividendAristocratStocks';
export { GURU_HOLDING_STOCKS } from './guruHoldingStocks';
export { KOREAN_DIVIDEND_TICKERS } from './koreanDividendTickers';
export { WELL_KNOWN_DIVIDEND_STOCKS } from './wellKnownDividendStocks';

/**
 * Hand-curated preset values. This is the source of truth for `name` and `expectedTotalReturn`,
 * which are human assumptions and are never touched by the refresh pipeline.
 *
 * 정합 모델 불변식: 모든 프리셋이 `dividendYield + dividendGrowth === expectedTotalReturn` 을 만족한다.
 * (`expectedTotalReturn` 은 큐레이터의 가정이므로 보존하고, `dividendGrowth` 를 그로부터 파생시켰다.)
 */
export const CURATED_DIVIDEND_UNIVERSE = {
  ...CORE_INDEX_ETFS,
  ...US_DIVIDEND_GROWTH_ETFS,
  ...US_HIGH_DIVIDEND_ETFS,
  ...OPTION_INCOME_ETFS,
  ...INTERNATIONAL_DIVIDEND_ETFS,
  ...REIT_ETFS,
  ...DIVIDEND_GROWTH_STOCKS,
  ...HIGH_DIVIDEND_STOCKS,
  ...SEMICONDUCTOR_DIVIDEND_GROWTH_PORTFOLIO,
  ...AI_INFRA_ETFS_AND_STOCKS,
  ...MEGA_CAP_GROWTH_STOCKS,
  ...FINANCIAL_DIVIDEND_STOCKS,
  ...DIVIDEND_ARISTOCRAT_STOCKS,
  /* 인지도 높은 배당 대형주(2026-08-14). 선정 기준이 연속 증배 연수가 아니라 인지도라
     배당귀족 묶음과 성격이 다르다 — ETR 이 8% 균일인 이유도 그 파일 머리말에 있다. */
  ...WELL_KNOWN_DIVIDEND_STOCKS,
  ...GURU_HOLDING_STOCKS,
  /* 한국 상장 12종(2026-08-06). 티커 키가 '458730.KS' 처럼 점을 포함하는 유일한 묶음이다 —
     야후 심볼을 그대로 쓴다(접미사를 큐레이션에 못 박는 이유는 그 파일 머리말). */
  ...KOREAN_DIVIDEND_TICKERS
} as const;

/** `dividendGrowth` is a derived number, so it widens away from the preset's literal type. */
type WithDerivedDividendGrowth<T> = {
  [K in keyof T]: Omit<T[K], 'dividendGrowth'> & { dividendGrowth: number };
};

/**
 * Re-derives `dividendGrowth` from the curated `expectedTotalReturn` and the (possibly refreshed)
 * `dividendYield`, so the coherent-model invariant `dividendYield + dividendGrowth === expectedTotalReturn`
 * survives a market-data refresh.
 *
 * Why: the refresh pipeline overwrites `dividendYield` with the live TTM yield. Under the coherent
 * model `dividendGrowth` is no longer "how fast the payout grew in the past" — it *is* the price
 * growth rate — so it is an assumption, not an observation, and the pipeline is forbidden from
 * writing it (see `MarketDataEntry`). The curator's `expectedTotalReturn` is the assumption we keep;
 * growth is what falls out of it once the live yield is known: yield up => growth down, total return
 * unchanged.
 */
const withCoherentDividendGrowth = <
  T extends Record<string, MarketDataEntry & { dividendGrowth: number; expectedTotalReturn: number }>
>(
  universe: T
): WithDerivedDividendGrowth<T> => {
  const coherent = {} as WithDerivedDividendGrowth<T>;

  for (const ticker of Object.keys(universe) as (keyof T)[]) {
    const preset = universe[ticker];
    coherent[ticker] = {
      ...preset,
      dividendGrowth: toDerivedDividendGrowthPercent(preset.expectedTotalReturn, preset.dividendYield)
    } as WithDerivedDividendGrowth<T>[keyof T];
  }

  return coherent;
};

/**
 * Forces `frequency: 'none'` on every ticker whose (possibly refreshed) `dividendYield` is 0.
 *
 * Why this is a derivation and not a stored fact: a payout *cadence* is meaningless without a
 * payout. Storing both "yield 0" and "pays quarterly" lets the two disagree, and they did — ANET
 * sat in the snapshot as `dividendYield: 0, frequency: 'quarterly'`, which the dividend calendar
 * then read as "schedule data still missing" instead of "there is nothing to schedule".
 *
 * The snapshot keeps its stale cadence on purpose: the refresh pipeline's `inferFrequency` returns
 * `null` for an empty payment history and the pipeline deliberately keeps the previous value rather
 * than concluding "stopped paying" from one failed fetch. So the *yield* — an observed fact the
 * pipeline does write — is the honest signal, and this step turns it into the cadence.
 *
 * Self-healing: the day the yield comes back non-zero, the snapshot's cadence flows through again.
 */
const withCoherentPayoutFrequency = <T extends Record<string, MarketDataEntry>>(universe: T): T => {
  const coherent = {} as T;

  for (const ticker of Object.keys(universe) as (keyof T)[]) {
    const entry = universe[ticker];
    coherent[ticker] = (entry.dividendYield === 0 ? { ...entry, frequency: 'none' as const } : entry) as T[keyof T];
  }

  return coherent;
};

/**
 * Composes the universe the app runs on: **overlay first, derive second.**
 *
 * 1. `applyMarketData` overwrites the observable facts (price / yield / frequency).
 * 2. `withCoherentPayoutFrequency` collapses a 0% yield to `frequency: 'none'` (no payout, no cadence).
 * 3. `withCoherentDividendGrowth` then re-derives `dividendGrowth` from the *refreshed* yield.
 *
 * Doing it the other way round would leave `dividendGrowth` derived from the stale preset yield, so a
 * refresh that moved `dividendYield` would silently break `dy + dg === etr` — the whole point of the
 * coherent model. Exported (rather than inlined) so that order is pinned by a test against a real,
 * non-empty snapshot instead of only against the empty one that ships.
 */
export const buildDividendUniverse = <
  T extends Record<string, MarketDataEntry & { dividendGrowth: number; expectedTotalReturn: number }>
>(
  curated: T,
  snapshot: MarketDataSnapshot
): WithDerivedDividendGrowth<MarketDataOverlaid<T>> =>
  withCoherentDividendGrowth(withCoherentPayoutFrequency(applyMarketData(curated, snapshot)));

/**
 * The universe the app actually uses: curated presets with the latest auto-refreshed market data
 * overlaid on top, and `dividendGrowth` re-derived afterwards so the curated total-return assumption
 * is preserved.
 *
 * When `marketData.generated.json` is empty this is deep-equal to `CURATED_DIVIDEND_UNIVERSE`
 * (the curated presets already satisfy the invariant).
 */
export const DIVIDEND_UNIVERSE = buildDividendUniverse(CURATED_DIVIDEND_UNIVERSE, MARKET_DATA);

export const PRESET_TICKER_KOREAN_NAME_BY_TICKER = {
  VOO: '뱅가드 S&P 500 ETF',
  IVV: '아이셰어즈 코어 S&P 500 ETF',
  SPY: 'SPDR S&P 500 ETF 트러스트',
  VTI: '뱅가드 토탈 주식시장 ETF',
  QQQ: '인베스코 QQQ 트러스트',
  VUG: '뱅가드 성장 ETF',
  VT: '뱅가드 토탈 월드 주식 ETF',
  VXUS: '뱅가드 토탈 국제 주식 ETF',
  DIA: 'SPDR 다우존스 산업평균 ETF',
  SCHD: '슈왑 미국 배당주 ETF',
  VIG: '뱅가드 배당성장 ETF',
  DGRO: '아이셰어즈 코어 배당성장 ETF',
  DGRW: '위즈덤트리 미국 퀄리티 배당성장 ETF',
  NOBL: '프로셰어즈 S&P 500 배당귀족 ETF',
  RDVY: '퍼스트트러스트 라이징 디비던드 어치버스 ETF',
  SDVY: '퍼스트트러스트 스몰미드캡 라이징 디비던드 어치버스 ETF',
  CGDV: '캐피털그룹 배당 가치 ETF',
  DLN: '위즈덤트리 미국 대형주 배당 펀드',
  DON: '위즈덤트리 미국 중형주 배당 펀드',
  DES: '위즈덤트리 미국 소형주 배당 펀드',
  VYM: '뱅가드 고배당 수익 ETF',
  HDV: '아이셰어즈 코어 고배당 ETF',
  SMH: '반에크 반도체 ETF',
  SDY: 'SPDR S&P 배당 ETF',
  DVY: '아이셰어즈 셀렉트 배당 ETF',
  FDVV: '피델리티 고배당 ETF',
  SPYD: 'SPDR 포트폴리오 S&P 500 고배당 ETF',
  DHS: '위즈덤트리 미국 고배당 ETF',
  SPHD: '인베스코 S&P 500 고배당 저변동성 ETF',
  PEY: '인베스코 하이일드 에쿼티 디비던드 어치버스 ETF',
  FDL: '퍼스트트러스트 모닝스타 디비던드 리더스 인덱스 펀드',
  JEPI: 'JP모건 에쿼티 프리미엄 인컴 ETF',
  JEPQ: 'JP모건 나스닥 에쿼티 프리미엄 인컴 ETF',
  DIVO: '앰플리파이 CWP 인핸스드 디비던드 인컴 ETF',
  IDVO: '앰플리파이 인터내셔널 인핸스드 디비던드 ETF',
  AIQ: '글로벌 X AI 및 기술 ETF',
  QDVO: '크래프트 AI 인핸스드 미국 배당 ETF',
  QYLD: '글로벌 X 나스닥 100 커버드콜 ETF',
  XYLD: '글로벌 X S&P 500 커버드콜 ETF',
  RYLD: '글로벌 X 러셀 2000 커버드콜 ETF',
  SPYI: 'NEOS S&P 500 하이 인컴 ETF',
  QQQI: 'NEOS 나스닥 100 하이 인컴 ETF',
  VIGI: '뱅가드 인터내셔널 배당성장 ETF',
  VYMI: '뱅가드 인터내셔널 고배당 수익 ETF',
  SCHY: '슈왑 인터내셔널 배당주 ETF',
  IDV: '아이셰어즈 인터내셔널 셀렉트 배당 ETF',
  DWX: 'SPDR S&P 인터내셔널 배당 ETF',
  SCHH: '슈왑 미국 리츠 ETF',
  VNQ: '뱅가드 부동산 ETF',
  VNQI: '뱅가드 글로벌(미국 제외) 부동산 ETF',
  SRVR: '페이서 데이터 및 인프라 리츠 ETF',
  SBUX: '스타벅스',
  NKE: '나이키',
  HON: '하니웰',
  LMT: '록히드마틴',
  ACN: '액센츄어',
  ABT: '애보트',
  MDLZ: '몬델리즈',
  HSY: '허쉬',
  YUM: '얌 브랜즈',
  NOC: '노스럽그러먼',
  LHX: 'L3해리스',
  CMI: '커민스',
  RSG: '리퍼블릭서비스',
  FAST: '패스널',
  TRV: '트래블러스',
  ALB: '앨버말',
  DIS: '디즈니',
  CMCSA: '컴캐스트',
  TMUS: '티모바일',
  MU: '마이크론',
  HPQ: 'HP',
  DELL: '델 테크놀로지스',
  PAYX: '페이첵스',
  SYK: '스트라이커',
  BMY: '브리스톨 마이어스 스퀴브',
  GILD: '길리어드',
  CI: '시그나',
  MCK: '맥케슨',
  ZTS: '조에티스',
  DHR: '다나허',
  TMO: '서모피셔',
  A: '애질런트',
  GIS: '제너럴 밀스',
  KDP: '큐리그 닥터페퍼',
  CAG: '콘아그라',
  CPB: '캠벨',
  TSN: '타이슨 푸드',
  EL: '에스티 로더',
  ROST: '로스 스토어스',
  DG: '달러 제너럴',
  DPZ: '도미노피자',
  F: '포드',
  ROK: '록웰 오토메이션',
  GE: 'GE 에어로스페이스',
  FDX: '페덱스',
  NSC: '노퍽 서던',
  ODFL: '올드 도미니언',
  LUV: '사우스웨스트',
  TT: '트레인 테크놀로지스',
  COP: '코노코필립스',
  EOG: 'EOG 리소시스',
  PSX: '필립스 66',
  VLO: '발레로',
  MPC: '마라톤 페트롤리엄',
  SLB: '슐럼버거',
  KMI: '킨더 모건',
  WMB: '윌리엄스',
  OKE: '원오크',
  EPD: '엔터프라이즈 프로덕츠',
  DUK: '듀크 에너지',
  SO: '서던 컴퍼니',
  D: '도미니언 에너지',
  AEP: '아메리칸 일렉트릭 파워',
  EXC: '엑셀론',
  XEL: '엑셀 에너지',
  WEC: 'WEC 에너지',
  ES: '에버소스 에너지',
  PEG: 'PSEG',
  SRE: '셈프라',
  DTE: 'DTE 에너지',
  AEE: '아메렌',
  PPL: 'PPL',
  PNC: 'PNC 파이낸셜',
  TFC: '트루이스트',
  SCHW: '찰스 슈왑',
  BLK: '블랙록',
  STT: '스테이트 스트리트',
  AMP: '아메리프라이즈',
  MET: '메트라이프',
  PRU: '프루덴셜',
  ALL: '올스테이트',
  PGR: '프로그레시브',
  AIG: 'AIG',
  HIG: '하트포드',
  SPG: '사이먼 프로퍼티',
  PSA: '퍼블릭 스토리지',
  EXR: '엑스트라 스페이스',
  AVB: '아발론베이',
  EQR: '에퀴티 레지덴셜',
  MAA: '미드아메리카',
  WELL: '웰타워',
  VTR: '벤타스',
  DLR: '디지털 리얼티',
  EQIX: '에퀴닉스',
  IRM: '아이언 마운틴',
  NNN: 'NNN 리츠',
  ADC: '어그리 리얼티',
  KIM: '킴코 리얼티',
  '489250.KS': 'KODEX 미국배당다우존스',
  '476850.KS': 'KoAct 배당성장액티브',
  '322410.KS': 'HANARO 고배당',
  '266160.KS': 'KBSTAR 고배당',
  '446720.KS': 'SOL 미국배당미국채혼합50',
  '458760.KS': 'TIGER 미국배당+7%프리미엄다우존스',
  '441640.KS': 'KODEX 미국배당프리미엄액티브',
  PG: '프록터 앤 갬블',
  KO: '코카콜라',
  JNJ: '존슨앤드존슨',
  LOW: '로우스',
  ABBV: '애브비',
  PEP: '펩시코',
  MCD: '맥도날드',
  HD: '홈디포',
  TGT: '타깃',
  WMT: '월마트',
  XOM: '엑슨모빌',
  CVX: '셰브론',
  CAT: '캐터필러',
  MMM: '쓰리엠',
  IBM: '아이비엠',
  CSCO: '시스코 시스템즈',
  AMGN: '암젠',
  UNH: '유나이티드헬스 그룹',
  O: '리얼티 인컴',
  PLD: '프로로지스',
  AMT: '아메리칸 타워',
  ENB: '엔브리지',
  VICI: '비시 프로퍼티스',
  UPS: '유나이티드 파슬 서비스',
  T: 'AT&T',
  VZ: '버라이즌 커뮤니케이션스',
  MO: '알트리아 그룹',
  AVGO: '브로드컴',
  ANET: '아리스타 네트웍스',
  NVDA: '엔비디아',
  TXN: '텍사스 인스트루먼트',
  ADI: '아날로그 디바이시스',
  LRCX: '램리서치',
  KLAC: 'KLA',
  AMAT: '어플라이드 머티어리얼즈',
  TSM: '대만 반도체 제조',
  ASML: 'ASML 홀딩',
  ETN: '이튼',
  VRT: '버티브 홀딩스',
  CEG: '컨스텔레이션 에너지',
  NEE: '넥스트에라 에너지',
  // 2026-08-02 확충분 — 대형 성장주
  AAPL: '애플',
  MSFT: '마이크로소프트',
  GOOGL: '알파벳',
  AMZN: '아마존닷컴',
  META: '메타 플랫폼스',
  TSLA: '테슬라',
  // 2026-08-02 확충분 — 금융
  JPM: 'JP모건 체이스',
  BAC: '뱅크 오브 아메리카',
  WFC: '웰스 파고',
  C: '씨티그룹',
  MS: '모건 스탠리',
  GS: '골드만삭스',
  AXP: '아메리칸 익스프레스',
  COF: '캐피털 원 파이낸셜',
  ALLY: '앨리 파이낸셜',
  USB: 'US뱅코프',
  CB: '처브',
  MCO: '무디스',
  SPGI: 'S&P 글로벌',
  V: '비자',
  MA: '마스터카드',
  AFL: '애플락',
  TROW: 'T. 로우 프라이스',
  BEN: '프랭클린 리소시스',
  // 2026-08-02 확충분 — 배당귀족·배당킹
  APD: '에어프로덕츠앤케미컬스',
  AOS: 'A.O. 스미스',
  ADM: '아처 대니얼스 미들랜드',
  ATO: '애트모스 에너지',
  ADP: '오토매틱 데이터 프로세싱',
  BDX: '벡톤 디킨슨',
  BRO: '브라운앤브라운',
  CAH: '카디널 헬스',
  CHRW: 'C.H. 로빈슨 월드와이드',
  CHD: '처치앤드와이트',
  CINF: '신시내티 파이낸셜',
  CL: '콜게이트-팜올리브',
  CLX: '클로락스',
  CTAS: '신타스',
  DOV: '도버',
  ECL: '에코랩',
  ED: '콘솔리데이티드 에디슨',
  EMR: '에머슨 일렉트릭',
  ESS: '에섹스 프로퍼티 트러스트',
  EXPD: '익스피다이터스 인터내셔널',
  FRT: '페더럴 리얼티 인베스트먼트 트러스트',
  GD: '제너럴 다이내믹스',
  GPC: '지뉴인 파츠',
  GWW: 'W.W. 그레인저',
  HRL: '호멜 푸즈',
  ITW: '일리노이 툴 웍스',
  KMB: '킴벌리-클라크',
  LIN: '린데',
  MDT: '메드트로닉',
  MKC: '맥코믹',
  NDSN: '노드슨',
  PNR: '펜테어',
  PPG: 'PPG 인더스트리스',
  ROP: '로퍼 테크놀로지스',
  SHW: '셔윈-윌리엄스',
  SJM: 'J.M. 스머커',
  SWK: '스탠리 블랙앤데커',
  SYY: '시스코 코퍼레이션',
  WST: '웨스트 파마슈티컬 서비스',
  PH: '파커 하니핀',
  // 2026-08-02 확충분 — 13F 대가 보유 개별주
  OXY: '옥시덴탈 페트롤리엄',
  KHC: '크래프트 하인즈',
  KR: '크로거',
  STZ: '컨스텔레이션 브랜즈',
  DAL: '델타 항공',
  SIRI: '시리우스XM 홀딩스',
  NYT: '뉴욕타임스',
  LEN: '레나',
  M: '메이시스',
  JEF: '제프리스 파이낸셜 그룹',
  NUE: '뉴코어',
  UNP: '유니언 퍼시픽',
  DE: '디어',
  WM: '웨이스트 매니지먼트',
  CNI: '캐나디안 내셔널 철도',
  PCAR: '팩카',
  ELV: '엘레번스 헬스',
  CVS: 'CVS 헬스',
  MRK: '머크',
  PFE: '화이자',
  LLY: '일라이 릴리',
  HUM: '휴매나',
  ORCL: '오라클',
  QCOM: '퀄컴',
  TAP: '몰슨쿠어스 베버리지',
  WEN: '웬디스',
  RTX: 'RTX',
  COST: '코스트코 홀세일',
  FCX: '프리포트-맥모란',
  APH: '앰페놀',
  CSX: 'CSX',
  NEM: '뉴몬트',
  B: '배릭 마이닝',
  GLW: '코닝',
  WHR: '월풀',
  BALL: '볼',
  ET: '에너지 트랜스퍼',
  MPLX: 'MPLX',
  WTW: '윌리스 타워스 왓슨',
  FERG: '퍼거슨 엔터프라이지스',
  GM: '제너럴 모터스',
  EWBC: '이스트 웨스트 뱅코프',
  HRB: 'H&R 블록',
  MSCI: 'MSCI',
  SAP: 'SAP',
  NVS: '노바티스',
  AZN: '아스트라제네카',
  BP: 'BP',
  SHEL: '쉘',
  JCI: '존슨 컨트롤스 인터내셔널',

  /*
   * 한국 상장 12종(2026-08-06). 🔴 위 미국 종목과 달리 **`name` 과 같은 문자열**이다 — 국내 종목은
   * 공식 명칭 자체가 한국어라 "영문명 → 한글명" 번역이 존재하지 않는다. 그래도 이 표는 채운다:
   * 이 맵은 화면이 한글명을 찾는 **유일한 경로**이고, 비면 그 종목만 이름 없이 뜬다
   * (타입이 유니버스 전 종목을 강제하는 이유이기도 하다).
   */
  '458730.KS': 'TIGER 미국배당다우존스',
  '402970.KS': 'ACE 미국배당다우존스',
  '483290.KS': 'KODEX 미국배당다우존스타겟커버드콜',
  '161510.KS': 'PLUS 고배당주',
  '279530.KS': 'KODEX 고배당',
  '104530.KS': 'KOSEF 고배당',
  '210780.KS': 'TIGER 코스피고배당',
  '211560.KS': 'TIGER 배당성장',
  '088980.KS': '맥쿼리인프라',
  '033780.KS': 'KT&G',
  '316140.KS': '우리금융지주',
  '105560.KS': 'KB금융'
} as const satisfies Record<keyof typeof DIVIDEND_UNIVERSE, string>;

export type PresetTickerKey = keyof typeof DIVIDEND_UNIVERSE;
