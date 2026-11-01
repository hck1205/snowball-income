/**
 * 이 화면이 비교하는 **12 종목 큐레이션** (2026-11-01).
 *
 * ## 🔴 387 종 전부를 쓰지 않는 이유 (사용자 결정)
 * 유니버스에는 387 개 항목이 있는데 그것을 배당률로 정렬해 보여 주면 **필요 원금이 가장 적은 쪽이
 * 표의 맨 위에 선다.** 그 자리는 고배당 커버드콜이 차지하고, 정렬은 추천이 아니지만 **맨 위는
 * 추천처럼 읽힌다.** 이 앱은 투자 자문이 아니므로 그 배치를 만들지 않는다.
 *
 * 대신 **성격별로 세 종목씩** 묶어 네 줄로 놓는다. 그러면 사용자가 보는 것이 순위가 아니라
 * **맞교환**이다: 필요 원금이 적은 묶음(커버드콜)은 배당 인상률이 낮거나 마이너스이고, 인상률이
 * 높은 묶음(배당성장)은 필요 원금이 두 배 넘게 든다. 그 사실을 나란히 놓는 것이 이 화면의 일이다.
 *
 * ## 선정 규칙 (지키면서 바꿔라)
 *  1. **`/ticker/<slug>` 소개 페이지가 실재하는 종목만.** 카드에서 그 페이지로 보내는데 없으면 죽은 링크다.
 *     (`shared/constants/tickerPages` 의 `TICKER_PAGE_INDEX` 가 그 사실의 정본이고,
 *     `dividendTargetTickers.test.ts` 가 12 종 전부를 그 인덱스와 대조한다.)
 *  2. **스냅샷(`MARKET_DATA`)에 있는 종목 우선.** 배당률이 실측이어야 필요 원금이 실측 기반이 된다.
 *  3. 한 묶음 안에서는 **인지도 순**이다 — 처음 온 사람이 아는 이름을 먼저 본다.
 *
 * ⚠ 숫자를 여기 적지 않는다. 배당률·인상률·지급주기는 전부 스냅샷/유니버스에서 읽는다 —
 *   복제하면 갱신 파이프라인이 돌 때 조용히 낡는다(이 레포가 반복해서 당한 함정).
 */

export type DividendTargetCategoryId = 'growth' | 'highYield' | 'coveredCall' | 'monthly';

export type DividendTargetCategory = {
  readonly id: DividendTargetCategoryId;
  readonly label: string;
  /** 이 묶음이 무엇으로 묶였는지 한 줄. 🔴 "좋다/낫다"를 말하지 않는다. */
  readonly summary: string;
  readonly tickers: readonly string[];
};

/**
 * 네 묶음의 순서 = 화면 노출 순서.
 *
 * **배당성장 → 고배당 → 커버드콜 → 월배당** 으로 간다. 필요 원금이 **큰 쪽에서 작은 쪽**으로
 * 내려가는 순서다(배당률의 역순). 작은 쪽을 위에 두면 그게 답처럼 보이고, 큰 쪽을 위에 두면
 * 사용자는 내려가면서 "원금이 줄어드는 대신 무엇을 내놓는가"를 읽게 된다.
 * ⚠ 순서를 뒤집으려면 위 문단을 함께 고쳐라 — 배치가 곧 주장이다.
 */
export const DIVIDEND_TARGET_CATEGORIES: readonly DividendTargetCategory[] = [
  {
    id: 'growth',
    label: '배당성장',
    summary: '지금 배당률은 낮고, 지급액을 꾸준히 늘려 온 쪽입니다.',
    tickers: ['SCHD', 'DGRO', 'VIG']
  },
  {
    id: 'highYield',
    label: '고배당',
    summary: '배당률을 기준으로 종목을 고르는 쪽입니다.',
    tickers: ['VYM', 'SPYD', 'HDV']
  },
  {
    id: 'coveredCall',
    /* '커버드콜'이라는 말을 쓴다 — 'initial 고배당'으로 접으면 위 고배당 묶음과 구분이 사라진다. */
    label: '커버드콜',
    summary: '옵션 프리미엄을 분배금으로 돌려 배당률이 높은 쪽입니다. 분배금과 주가가 따로 움직입니다.',
    tickers: ['JEPI', 'JEPQ', 'QYLD']
  },
  {
    id: 'monthly',
    label: '월배당',
    summary: '매달 지급해, 생활비처럼 쓰기 쉬운 리듬입니다.',
    tickers: ['O', 'DIVO', 'XYLD']
  }
];

/** 비교 대상 12 종의 평탄한 목록(묶음 순서 그대로). 데이터 조회·테스트가 이것을 쓴다. */
export const DIVIDEND_TARGET_TICKERS: readonly string[] = DIVIDEND_TARGET_CATEGORIES.flatMap(
  (category) => category.tickers
);

/**
 * 이 화면이 처음 펼쳐 보여 주는 종목.
 *
 * SCHD 인 이유는 인지도다 — 사용자가 이 기능을 요청할 때 든 예시가 "SCHD 로 월 250" 이었고,
 * 배당 ETF 검색어에서 가장 흔한 이름이다. 상세 분해가 비어 있는 채로 시작하면 "자세히"라는
 * 이 화면의 존재 이유가 한 클릭 뒤로 밀린다.
 */
export const DEFAULT_DIVIDEND_TARGET_TICKER = 'SCHD';
