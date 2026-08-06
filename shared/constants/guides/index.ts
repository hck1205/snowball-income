import { DIVIDEND_CALCULATOR_GUIDE } from './dividendCalculator';
import { INDEX_INVESTING_GUIDE } from './indexInvesting';
import { MONTHLY_DIVIDEND_GOAL_GUIDE } from './monthlyDividendGoal';
import { START_INVESTING_GUIDE } from './startInvesting';
import { WHAT_IS_DIVIDEND_GUIDE } from './whatIsDividend';
import type { GuideContent } from './guides.types';

export type { GuideContent, GuideFaq, GuideSection, GuideTable } from './guides.types';

/**
 * 가이드 레지스트리 — **가이드 하나 = 데이터 파일 하나 + 여기 한 줄**.
 *
 * 티커 페이지(`shared/constants/tickers/registry.ts`)와 같은 구조다. 이 목록에 넣기만 하면 라우트·
 * 사이트맵·크롤러 HTML·JSON-LD·내부 링크·랜딩의 시작 경로가 전부 파생된다 — 새 검색어를 노릴 때
 * 화면을 만들지 않는다.
 *
 * ⚠ 순서가 곧 **사이트맵과 내부 링크의 순서**다.
 */
export const GUIDES: readonly GuideContent[] = [
  START_INVESTING_GUIDE,
  WHAT_IS_DIVIDEND_GUIDE,
  INDEX_INVESTING_GUIDE,
  DIVIDEND_CALCULATOR_GUIDE,
  MONTHLY_DIVIDEND_GOAL_GUIDE
];

/**
 * 🔴 **처음 온 사람이 밟는 순서**(2026-08-06 사용자 지시: "자연스럽게 배당 투자를 유도하고 계산기까지").
 *
 * 랜딩의 시작 경로 블록이 이 배열을 그대로 그린다. 순서에 뜻이 있다:
 * 계좌를 여는 법 → 배당이 무엇인지 → 지수추종과의 차이 → 계산법 → 목표 세우기.
 * **개념을 모르는 사람이 계산기 앞에 서는 일**이 없게 하는 것이 이 순서의 목적이다.
 *
 * ⚠ `GUIDES` 와 따로 두는 이유: 사이트맵·내부 링크는 **전부**를 담아야 하지만, 랜딩의 경로는
 *   "처음 온 사람이 밟을 길"이라 편집된 선택이다. 나중에 가이드가 20편이 돼도 이 길은 다섯 걸음이다.
 */
export const GUIDE_START_PATH: readonly GuideContent[] = [
  START_INVESTING_GUIDE,
  WHAT_IS_DIVIDEND_GUIDE,
  INDEX_INVESTING_GUIDE,
  DIVIDEND_CALCULATOR_GUIDE,
  MONTHLY_DIVIDEND_GOAL_GUIDE
];

/** `/guide/<slug>`. 경로를 문자열로 조립하는 곳이 하나여야 라우터·사이트맵·링크가 갈리지 않는다. */
export const guidePath = (slug: string): string => `/guide/${slug}`;

/** 슬러그로 찾기. 없으면 `undefined` — 라우터는 그때 허브(또는 404)로 보낸다. */
export const findGuide = (slug: string): GuideContent | undefined =>
  GUIDES.find((guide) => guide.slug === slug.toLowerCase());
