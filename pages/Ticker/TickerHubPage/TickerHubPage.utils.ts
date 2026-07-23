import {
  listTickerContentByCategory,
  renderTickerContentTemplate,
  resolveTickerEngineFacts,
  TICKER_CATEGORY_LABEL,
  TICKER_CONTENT_LIST,
  type TickerCategoryId,
  type TickerContent
} from '@/shared/constants/tickers';
import type { HubTickerCard, TickerHubViewModel } from './TickerHubPage.types';

const toCard = (content: TickerContent): HubTickerCard => {
  const facts = resolveTickerEngineFacts(content.ticker);
  return {
    ticker: content.ticker,
    slug: content.slug,
    koreanName: facts.koreanName,
    englishName: facts.englishName,
    tagline: renderTickerContentTemplate(content.heroTagline, facts),
    dividendYield: facts.dividendYieldDisplay,
    frequencyLabel: facts.frequencyLabel
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
    .map((id) => ({
      id,
      label: TICKER_CATEGORY_LABEL[id],
      tickers: listTickerContentByCategory(id).map(toCard)
    }))
    .filter((category) => category.tickers.length > 0);

  return { categories, totalCount: TICKER_CONTENT_LIST.length };
};
