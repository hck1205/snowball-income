import type { DividendListSectorId } from './dividendLists.types';

/**
 * 섹터 대응표의 **단일 출처**. 수집기(`scripts/dividendLists`)와 화면이 같은 표를 본다.
 *
 * 왜 정규화가 필요한가: 소스마다 분류 체계가 다르다. 위키피디아 배당귀족 표는 GICS
 * (`Health Care`·`Information Technology`), dripinvesting 은 모닝스타(`Healthcare`·`Technology`)를 쓴다.
 * 그대로 두면 같은 회사가 배당킹 페이지와 배당귀족 페이지에서 다른 섹터로 보인다.
 *
 * 🔴 **모르는 문자열은 조용히 버리지 않는다.** `normalizeSectorLabel` 은 `null` 을 돌려주고 수집기가
 * 그걸 에러로 올린다 — 소스가 분류를 늘렸는데 우리가 모른 채 전부 "기타"로 뭉개는 사고를 막는다.
 */
const SECTOR_ALIASES: Record<string, DividendListSectorId> = {
  /* GICS (위키피디아 배당귀족 표) */
  'communication services': 'communicationServices',
  'consumer discretionary': 'consumerDiscretionary',
  'consumer staples': 'consumerStaples',
  energy: 'energy',
  financials: 'financials',
  'health care': 'healthCare',
  industrials: 'industrials',
  'information technology': 'informationTechnology',
  materials: 'materials',
  'real estate': 'realEstate',
  utilities: 'utilities',
  /* 모닝스타 (dripinvesting 배당킹·배당챔피언 표) */
  'basic materials': 'materials',
  'consumer cyclical': 'consumerDiscretionary',
  'consumer defensive': 'consumerStaples',
  'financial services': 'financials',
  healthcare: 'healthCare',
  technology: 'informationTechnology'
};

/** 소스가 적어 준 섹터 문자열 → 정규화된 id. 모르는 값이면 `null`(호출부가 실패로 다룬다). */
export const normalizeSectorLabel = (raw: string): DividendListSectorId | null =>
  SECTOR_ALIASES[raw.trim().toLowerCase()] ?? null;

/**
 * 화면에 쓰는 한국어 섹터명. GICS 11개 섹터의 통용 번역을 따른다.
 * ⚠ 표의 필터 칩·표 셀이 같은 문자열을 쓴다 — 여기 한 곳만 고치면 전부 따라온다.
 */
export const DIVIDEND_LIST_SECTOR_LABEL: Record<DividendListSectorId, string> = {
  communicationServices: '커뮤니케이션 서비스',
  consumerDiscretionary: '경기소비재',
  consumerStaples: '필수소비재',
  energy: '에너지',
  financials: '금융',
  healthCare: '헬스케어',
  industrials: '산업재',
  informationTechnology: '정보기술',
  materials: '소재',
  realEstate: '부동산',
  utilities: '유틸리티'
};

/** 정규화된 섹터 id 전체. 스키마·테스트가 이 배열을 쓴다. */
export const DIVIDEND_LIST_SECTOR_IDS = Object.keys(
  DIVIDEND_LIST_SECTOR_LABEL
) as DividendListSectorId[];
