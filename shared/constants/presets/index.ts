import { US_DIVIDEND_GROWTH_ETFS } from './usDividendGrowthEtfs';
import { US_HIGH_DIVIDEND_ETFS } from './usHighDividendEtfs';
import { OPTION_INCOME_ETFS } from './optionIncomeEtfs';
import { INTERNATIONAL_DIVIDEND_ETFS } from './internationalDividendEtfs';
import { REIT_ETFS } from './reitEtfs';
import { DIVIDEND_GROWTH_STOCKS } from './dividendGrowthStocks';
import { HIGH_DIVIDEND_STOCKS } from './highDividendStocks';
import { CORE_INDEX_ETFS } from './coreIndexEtfs';

export { US_DIVIDEND_GROWTH_ETFS } from './usDividendGrowthEtfs';
export { US_HIGH_DIVIDEND_ETFS } from './usHighDividendEtfs';
export { OPTION_INCOME_ETFS } from './optionIncomeEtfs';
export { INTERNATIONAL_DIVIDEND_ETFS } from './internationalDividendEtfs';
export { REIT_ETFS } from './reitEtfs';
export { DIVIDEND_GROWTH_STOCKS } from './dividendGrowthStocks';
export { HIGH_DIVIDEND_STOCKS } from './highDividendStocks';
export { CORE_INDEX_ETFS } from './coreIndexEtfs';

export const DIVIDEND_UNIVERSE = {
  ...CORE_INDEX_ETFS,
  ...US_DIVIDEND_GROWTH_ETFS,
  ...US_HIGH_DIVIDEND_ETFS,
  ...OPTION_INCOME_ETFS,
  ...INTERNATIONAL_DIVIDEND_ETFS,
  ...REIT_ETFS,
  ...DIVIDEND_GROWTH_STOCKS,
  ...HIGH_DIVIDEND_STOCKS
} as const;

export type PresetTickerKey = keyof typeof DIVIDEND_UNIVERSE;
