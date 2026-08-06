/**
 * 검색어 랜딩("가이드") 한 편의 **콘텐츠 모델**.
 *
 * 🔴 이 화면들이 존재하는 이유는 하나다 — **사람이 검색창에 치는 말과 1:1로 맞는 페이지**를 만드는
 * 것(`docs/site-assessment-2026-08-06.md` P0-③). 우리 화면 이름("배당 시뮬레이터")은 우리 언어이고,
 * 사람은 "배당금 계산기"·"월 배당 100만원"을 친다. 그 간극이 지금 유입의 병목이다.
 *
 * 🔴 **얇은 유입 페이지를 만들지 마라.** 질문에 끝까지 답한 다음에 도구로 넘긴다 — 답을 안 주고
 * 버튼만 있는 페이지는 검색엔진에도 사람에게도 값이 없고, 색인 부채만 남는다.
 *
 * ⚠ 카피 규율(전 표면 공통): 투자권유 금지 · 약속형("~받게 됩니다") 금지 · **눈덩이/스노우볼 비유
 *   전면 금지** · 격식체(해요체 금지, `test/shared/copyTone.test.ts` 가 잡는다).
 * ⚠ **지어낸 숫자 0.** 여기 들어가는 수치는 순수 산술(원금 = 목표 배당 ÷ 배당률)이거나 앱이 이미
 *   갖고 있는 데이터에서 온 값이어야 한다.
 */

/** 본문 한 장(章). 제목 + 문단들, 필요하면 표 하나. */
export type GuideSection = {
  /** 목차·앵커에 쓰는 id. 소문자-하이픈. */
  readonly id: string;
  readonly heading: string;
  /**
   * 목차 레일에 서는 **짧은 이름**. 제목과 따로 두는 이유는 길이다 — 본문 제목은
   * "필요 원금 — 목표 배당 ÷ 배당률"처럼 문장에 가깝고, 그대로 레일에 넣으면 세 줄로 접혀
   * 목차가 본문만큼 길어진다. 티커 상세의 `navLabel` 과 같은 규율이다.
   *
   * 🔴 제목에서 기계적으로 잘라 쓰지 않는다(구분자가 없는 제목에서 조용히 전체가 들어온다).
   *   6~10자 안팎으로 **직접 쓴다**.
   */
  readonly navLabel: string;
  readonly paragraphs: readonly string[];
  /** 이 장이 표로 말하는 것이 있으면. 없으면 생략한다(빈 표를 그리지 않는다). */
  readonly table?: GuideTable;
  /** 장 끝의 주의 한 줄. 색이 아니라 자리로 구분된다. */
  readonly caution?: string;
};

/** 표 하나. 🔴 값은 전부 문자열이다 — 포맷은 콘텐츠가 정한다(화면이 다시 계산하지 않는다). */
export type GuideTable = {
  readonly caption: string;
  readonly columns: readonly string[];
  readonly rows: readonly (readonly string[])[];
  /** 표 아래 한 줄. 계산 전제를 밝히는 자리다(전제 없는 숫자는 이 레포에서 금지다). */
  readonly note?: string;
};

/** 자주 묻는 질문. 🔴 FAQPage JSON-LD 로도 나가므로 **질문은 사용자의 말**로 쓴다. */
export type GuideFaq = {
  readonly question: string;
  readonly answer: string;
};

export type GuideContent = {
  /** URL 조각. `/guide/<slug>`. */
  readonly slug: string;
  /**
   * 검색 결과 제목. 앞부분에 검색어가 그대로 들어가야 한다.
   *
   * 🔴 **사이트명 접미사(`- Hungry Hippo`)를 여기 적지 마라.** 그것은 표면이 붙인다 — 크롤러 HTML은
   * `server/handlers/GuideHtml`, SPA 는 `useDocumentMeta` 가 각자 같은 규칙으로 붙인다(티커 콘텐츠와
   * 같은 관례). 콘텐츠가 직접 적으면 SPA 로 들어온 사람에게 접미사가 **두 번** 붙는다.
   */
  readonly metaTitle: string;
  readonly metaDescription: string;
  /** 화면 h1. 제목 태그와 달라도 된다(여기는 사람이 읽는 문장). */
  readonly title: string;
  /** 한 문장 리드. 이 페이지가 무엇에 답하는지. */
  readonly lede: string;
  /**
   * 이 페이지가 겨냥하는 검색어들. **화면에 그리지 않는다** — 무엇을 위해 쓴 글인지 다음 사람이
   * 알게 하는 메모이고, 키워드 스터핑용이 아니다.
   */
  readonly targetQueries: readonly string[];
  readonly sections: readonly GuideSection[];
  readonly faqs: readonly GuideFaq[];
  /** 글을 다 읽은 사람에게 주는 다음 걸음. 경로와 문장을 함께 둔다. */
  readonly cta: { readonly to: string; readonly label: string; readonly note: string };
};
