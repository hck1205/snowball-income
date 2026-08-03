import {
  listTickerContentByCategory,
  renderTickerContentTemplate,
  resolveTickerEngineFacts,
  TICKER_CATEGORY_LABEL,
  TICKER_CONTENT_LIST,
  type TickerCategoryId,
  type TickerContent
} from '@/shared/constants/tickers';
import { assignSeries } from '@/shared/lib/tickerSeries';
import type { HubTickerCard, TickerHubSummary, TickerHubViewModel } from './TickerHubPage.types';

const toCard = (content: TickerContent, seriesVar: string): HubTickerCard => {
  const facts = resolveTickerEngineFacts(content.ticker);
  return {
    seriesVar,
    ticker: content.ticker,
    slug: content.slug,
    koreanName: facts.koreanName,
    englishName: facts.englishName,
    tagline: renderTickerContentTemplate(content.heroTagline, facts),
    dividendYield: facts.dividendYieldDisplay,
    /*
     * 값이 **없는**(undefined) 티커는 그대로 undefined 로 둬 뷰가 스탯을 통째로 뺀다 — '-'·'미정'
     * 같은 placeholder 로 자리를 채우지 않는다.
     * ⚠ `0` 은 없는 값이 아니라 **진짜 값**이다(무보수 ETF 는 실존한다). 그래서 '0%' 로 렌더되고
     * 그게 맞다 — 뷰의 truthy 가드(`ticker.expenseRatio ? …`)를 "0 을 숨기는 버그"로 읽지 마라.
     */
    expenseRatio:
      content.reference.expenseRatioPercent !== undefined ? `${content.reference.expenseRatioPercent}%` : undefined,
    frequencyLabel: facts.frequencyLabel,
    // 상세 페이지와 **같은 출처**의 액센트를 그대로 넘긴다(허브에서 새 색을 만들지 않는다).
    accent: content.accent
  };
};

/**
 * 카테고리별로 그룹핑한 허브 뷰모델을 만든다. 티커가 하나도 없는 카테고리는 건너뛴다 —
 * 카테고리 라벨 맵(`TICKER_CATEGORY_LABEL`)이 유일한 순서 원천이라, 카테고리를 추가/재정렬하면
 * 이 화면도 자동으로 따라온다(이 파일은 손대지 않는다).
 */
export const buildTickerHubViewModel = (): TickerHubViewModel => {
  const categoryIds = Object.keys(TICKER_CATEGORY_LABEL) as TickerCategoryId[];

  const categories = categoryIds
    .map((id) => {
      const contents = listTickerContentByCategory(id);
      /*
       * 폴백 색은 **카테고리 단위**로 배정한다 — 사용자가 한 번에 눈으로 훑는 덩어리가 격자 하나이고,
       * 8색 팔레트로 27종 전체의 무충돌을 만들 수는 없기 때문이다(assignSeries 는 9번째부터 겹친다).
       * 카테고리 안에서만 겹치지 않으면 "같은 줄에 같은 색이 둘"이라는 실제 혼동은 생기지 않는다.
       */
      const seriesByTicker = assignSeries(contents.map((content) => content.ticker));
      return {
        id,
        label: TICKER_CATEGORY_LABEL[id],
        tickers: contents.map((content) => toCard(content, seriesByTicker.get(content.ticker) ?? ''))
      };
    })
    .filter((category) => category.tickers.length > 0);

  return { categories, totalCount: TICKER_CONTENT_LIST.length };
};

/**
 * 히어로 요약 수치. `totalCount` 는 레지스트리 전체(문서 제목이 쓰는 수)이고, 카테고리 수는
 * **비어 있지 않은** 카테고리만 센다 — 화면에 서지 않는 칸을 세면 히어로가 거짓말을 한다.
 */
export const summarizeTickerHub = (viewModel: TickerHubViewModel): TickerHubSummary => ({
  tickerCount: viewModel.totalCount,
  categoryCount: viewModel.categories.length
});
