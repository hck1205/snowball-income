import { US_DIVIDEND_GROWTH_ETFS } from './usDividendGrowthEtfs';
import { US_HIGH_DIVIDEND_ETFS } from './usHighDividendEtfs';
import { OPTION_INCOME_ETFS } from './optionIncomeEtfs';
import { INTERNATIONAL_DIVIDEND_ETFS } from './internationalDividendEtfs';
import { REIT_ETFS } from './reitEtfs';
import { DIVIDEND_GROWTH_STOCKS } from './dividendGrowthStocks';
import { HIGH_DIVIDEND_STOCKS } from './highDividendStocks';
import { CORE_INDEX_ETFS } from './coreIndexEtfs';
import { SEMICONDUCTOR_DIVIDEND_GROWTH_PORTFOLIO } from './semiconductorDividendGrowthPortfolio';

export { US_DIVIDEND_GROWTH_ETFS } from './usDividendGrowthEtfs';
export { US_HIGH_DIVIDEND_ETFS } from './usHighDividendEtfs';
export { OPTION_INCOME_ETFS } from './optionIncomeEtfs';
export { INTERNATIONAL_DIVIDEND_ETFS } from './internationalDividendEtfs';
export { REIT_ETFS } from './reitEtfs';
export { DIVIDEND_GROWTH_STOCKS } from './dividendGrowthStocks';
export { HIGH_DIVIDEND_STOCKS } from './highDividendStocks';
export { CORE_INDEX_ETFS } from './coreIndexEtfs';
export { SEMICONDUCTOR_DIVIDEND_GROWTH_PORTFOLIO } from './semiconductorDividendGrowthPortfolio';

export const DIVIDEND_UNIVERSE = {
  ...CORE_INDEX_ETFS,
  ...US_DIVIDEND_GROWTH_ETFS,
  ...US_HIGH_DIVIDEND_ETFS,
  ...OPTION_INCOME_ETFS,
  ...INTERNATIONAL_DIVIDEND_ETFS,
  ...REIT_ETFS,
  ...DIVIDEND_GROWTH_STOCKS,
  ...HIGH_DIVIDEND_STOCKS,
  ...SEMICONDUCTOR_DIVIDEND_GROWTH_PORTFOLIO
} as const;

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
  SDY: 'SPDR S&P 배당 ETF',
  DVY: '아이셰어즈 셀렉트 배당 ETF',
  FDVV: '피델리티 고배당 ETF',
  SPYD: 'SPDR 포트폴리오 S&P 500 고배당 ETF',
  DHS: '위즈덤트리 미국 고배당 ETF',
  JEPI: 'JP모건 에쿼티 프리미엄 인컴 ETF',
  JEPQ: 'JP모건 나스닥 에쿼티 프리미엄 인컴 ETF',
  DIVO: '앰플리파이 CWP 인핸스드 디비던드 인컴 ETF',
  IDVO: '앰플리파이 인터내셔널 인핸스드 디비던드 ETF',
  QDVO: '크래프트 AI 인핸스드 미국 배당 ETF',
  QYLD: '글로벌 X 나스닥 100 커버드콜 ETF',
  XYLD: '글로벌 X S&P 500 커버드콜 ETF',
  VIGI: '뱅가드 인터내셔널 배당성장 ETF',
  VYMI: '뱅가드 인터내셔널 고배당 수익 ETF',
  SCHY: '슈왑 인터내셔널 배당주 ETF',
  IDV: '아이셰어즈 인터내셔널 셀렉트 배당 ETF',
  DWX: 'SPDR S&P 인터내셔널 배당 ETF',
  SCHH: '슈왑 미국 리츠 ETF',
  VNQI: '뱅가드 글로벌(미국 제외) 부동산 ETF',
  PG: '프록터 앤 갬블',
  KO: '코카콜라',
  JNJ: '존슨앤드존슨',
  LOW: '로우스',
  ABBV: '애브비',
  O: '리얼티 인컴',
  ENB: '엔브리지',
  VICI: '비시 프로퍼티스',
  UPS: '유나이티드 파슬 서비스',
  T: 'AT&T',
  AVGO: '브로드컴',
  TXN: '텍사스 인스트루먼트',
  ADI: '아날로그 디바이시스',
  LRCX: '램리서치',
  KLAC: 'KLA',
  AMAT: '어플라이드 머티어리얼즈',
  TSM: '대만 반도체 제조',
  ASML: 'ASML 홀딩',
  ETN: '이튼',
  VRT: '버티브 홀딩스'
} as const satisfies Record<keyof typeof DIVIDEND_UNIVERSE, string>;

export type PresetTickerKey = keyof typeof DIVIDEND_UNIVERSE;
