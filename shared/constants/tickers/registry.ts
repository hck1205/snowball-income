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
  O: O_TICKER_CONTENT
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
