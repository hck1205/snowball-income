import type { PresetTickerKey } from '@/shared/constants/presets';
import type { TickerCategoryId } from './TickerCategory';
import type { TickerContent } from './TickerContent.types';
import { SCHD_TICKER_CONTENT } from './schd';
import { VIG_TICKER_CONTENT } from './vig';
import { DGRO_TICKER_CONTENT } from './dgro';
import { DGRW_TICKER_CONTENT } from './dgrw';
import { SCHY_TICKER_CONTENT } from './schy';
import { HDV_TICKER_CONTENT } from './hdv';
import { VYM_TICKER_CONTENT } from './vym';
import { SPYD_TICKER_CONTENT } from './spyd';
import { JEPI_TICKER_CONTENT } from './jepi';
import { JEPQ_TICKER_CONTENT } from './jepq';
import { O_TICKER_CONTENT } from './o';
import { NOBL_TICKER_CONTENT } from './nobl';
import { SDY_TICKER_CONTENT } from './sdy';
import { RDVY_TICKER_CONTENT } from './rdvy';
import { QYLD_TICKER_CONTENT } from './qyld';
import { XYLD_TICKER_CONTENT } from './xyld';
import { DIVO_TICKER_CONTENT } from './divo';
import { KO_TICKER_CONTENT } from './ko';
import { JNJ_TICKER_CONTENT } from './jnj';
import { SPYI_TICKER_CONTENT } from './spyi';
import { QQQI_TICKER_CONTENT } from './qqqi';
import { VNQ_TICKER_CONTENT } from './vnq';
import { PG_TICKER_CONTENT } from './pg';
import { PEP_TICKER_CONTENT } from './pep';
import { MO_TICKER_CONTENT } from './mo';
import { VZ_TICKER_CONTENT } from './vz';
import { XOM_TICKER_CONTENT } from './xom';

/**
 * 콘텐츠 엔트리가 준비된 티커만 이 레지스트리에 있다 — `PresetTickerKey`(계산 유니버스 전체)의
 * **부분집합**이다. `/ticker/all` 허브와 `/ticker/:name` 라우트 파라미터 해석이 이 맵 하나로
 * "이 티커의 SEO 페이지가 존재하는가"를 판정한다(존재하지 않으면 404 처리는 페이지 몫).
 *
 * **티커 하나 추가 = 이 파일에 한 줄 추가**가 전부다: ①새 데이터 파일
 * (`export const XXX_TICKER_CONTENT: TickerContent = {...}`, `schd.ts` 참고) ②아래 객체에 그 값
 * 등록. 페이지 컴포넌트·사이트맵·JSON-LD·목차는 전부 이 레지스트리(또는 `TICKER_CONTENT_LIST`)를
 * 순회해서 파생하므로 그 이상 손댈 파일은 없다.
 *
 * 2026-07-23: SCHD 템플릿 확정 후 10종 일괄 추가 — 배당성장(VIG·DGRO·DGRW·SCHY), 고배당(HDV·VYM·SPYD),
 * 커버드콜(JEPI·JEPQ), 리츠/월배당(O).
 * 2026-08-02: 1차 확충 8종 추가 — 배당성장(NOBL·SDY·RDVY), 커버드콜/옵션인컴(QYLD·XYLD·DIVO),
 * 개별 배당주(KO·JNJ). 전부 발행사·기업 공식 소스로 수치를 확인한 종목만 넣었다(확인 실패로 보류한
 * 후보는 각 데이터 파일의 주석이 아니라 이 배치의 핸드오프 기록에 남아 있다).
 * 2026-08-02: 2차 확충 8종 추가 — 옵션인컴(SPYI·QQQI), 리츠(VNQ), 개별 배당주(PG·PEP·MO·VZ·XOM).
 * SPHD 는 발행사 페이지가 스크립트 렌더라 운용보수·상장일을 확인하지 못해 **계산 유니버스에만
 * 넣고 콘텐츠 페이지는 만들지 않았다** — 빈 값으로 페이지를 세우지 않는다는 규율의 적용 사례다.
 *
 * ⚠ 티커 하나를 추가하면 손댈 곳은 **셋**이다: 이 레지스트리, `index.ts` 배럴, 그리고
 * `shared/constants/tickerPages/index.ts` 의 `TICKER_PAGE_INDEX`(랜딩 검색용 경량 인덱스).
 * 세 번째를 빼먹으면 `test/landing/tickerPageIndexParity.test.ts` 가 빨개진다.
 */
export const TICKER_CONTENT_REGISTRY = {
  SCHD: SCHD_TICKER_CONTENT,
  VIG: VIG_TICKER_CONTENT,
  DGRO: DGRO_TICKER_CONTENT,
  DGRW: DGRW_TICKER_CONTENT,
  SCHY: SCHY_TICKER_CONTENT,
  HDV: HDV_TICKER_CONTENT,
  VYM: VYM_TICKER_CONTENT,
  SPYD: SPYD_TICKER_CONTENT,
  JEPI: JEPI_TICKER_CONTENT,
  JEPQ: JEPQ_TICKER_CONTENT,
  O: O_TICKER_CONTENT,
  NOBL: NOBL_TICKER_CONTENT,
  SDY: SDY_TICKER_CONTENT,
  RDVY: RDVY_TICKER_CONTENT,
  QYLD: QYLD_TICKER_CONTENT,
  XYLD: XYLD_TICKER_CONTENT,
  DIVO: DIVO_TICKER_CONTENT,
  KO: KO_TICKER_CONTENT,
  JNJ: JNJ_TICKER_CONTENT,
  SPYI: SPYI_TICKER_CONTENT,
  QQQI: QQQI_TICKER_CONTENT,
  VNQ: VNQ_TICKER_CONTENT,
  PG: PG_TICKER_CONTENT,
  PEP: PEP_TICKER_CONTENT,
  MO: MO_TICKER_CONTENT,
  VZ: VZ_TICKER_CONTENT,
  XOM: XOM_TICKER_CONTENT
} as const satisfies Partial<Record<PresetTickerKey, TickerContent>>;

/** SEO 콘텐츠가 준비된 티커 심볼만의 유니언 — `PresetTickerKey`의 부분집합. */
export type TickerContentKey = keyof typeof TICKER_CONTENT_REGISTRY;

/** 목록/사이트맵 순회용 배열. */
export const TICKER_CONTENT_LIST: TickerContent[] = Object.values(TICKER_CONTENT_REGISTRY);

/** slug(라우트 파라미터, 대소문자 무관)로 콘텐츠를 찾는다. 없으면 undefined — 404 판단은 호출부 몫. */
export const findTickerContentBySlug = (slug: string): TickerContent | undefined => {
  const normalized = slug.toLowerCase();
  return TICKER_CONTENT_LIST.find((entry) => entry.slug === normalized);
};

/** 카테고리로 그룹핑 (허브 페이지의 섹션별 목록용). */
export const listTickerContentByCategory = (categoryId: TickerCategoryId): TickerContent[] =>
  TICKER_CONTENT_LIST.filter((entry) => entry.categoryIds.includes(categoryId));
