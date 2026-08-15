import type { AccountType } from '@/shared/constants/tax';
import type {
  Frequency,
  SimulationOutput,
  YieldFormValues
} from '@/shared/types';

export type YieldValidation = {
  isValid: boolean;
  errors: string[];
};

export type YieldFeatureState = {
  values: YieldFormValues;
  validation: YieldValidation;
  simulation: SimulationOutput | null;
};

export type TickerProfile = {
  id: string;
  ticker: string;
  name: string;
  initialPrice: number;
  dividendYield: number;
  dividendGrowth: number;
  expectedTotalReturn: number;
  frequency: Frequency;
  /**
   * 이 종목을 담은 계좌. 미지정은 **과세계좌**다 — 그래서 기존 저장 데이터·공유 링크가 그대로 열린다
   * (`DEFAULT_ACCOUNT_TYPE`). 🔴 ISA 는 **국내 상장 종목에만** 고를 수 있다(그 상수 파일 머리말).
   */
  accountType?: AccountType;
};

export type TickerDraft = Omit<TickerProfile, 'id'>;

export type TickerModalMode = 'create' | 'edit';

export type PortfolioPersistedState = {
  tickerProfiles: TickerProfile[];
  includedTickerIds: string[];
  weightByTickerId: Record<string, number>;
  fixedByTickerId: Record<string, boolean>;
  selectedTickerId: string | null;
};

export type ScenarioTabState = {
  id: string;
  name: string;
  portfolio: PortfolioPersistedState;
};
