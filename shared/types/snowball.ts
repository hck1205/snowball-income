import type { AccountType } from '@/shared/constants/tax';
import type {
  Frequency,
  SimulationOutput,
  YieldFormValues
} from '@/shared/types';

export type YieldValidation = {
  isValid: boolean;
  /** 사람이 읽는 메시지. **화면은 이것만 쓴다.** */
  errors: string[];
  /**
   * 오류가 난 **필드 이름**들(zod `issue.path[0]`). 계측 전용이다.
   *
   * 🔴 `errors` 와 따로 두는 이유: 메시지는 문구가 바뀌면 값이 바뀌지만 필드 이름은 안 바뀐다.
   * 계측 값공간에 메시지를 실으면 카피를 고칠 때마다 시계열이 끊긴다.
   * ⚠ 화면 렌더에 쓰지 마라 — 사용자에게 보여 줄 것은 `errors` 다.
   */
  fields: string[];
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
  /**
   * 종목별 배당 재투자 비율(%). **선택 입력**이라 기존 저장 페이로드·공유 링크가 그대로 통과한다
   * (미지정 = 전역값 `reinvestDividendPercent`).
   */
  reinvestPercentByTickerId?: Record<string, number>;
  /**
   * 종목별 배당 **목적지** 티커 id — "이 종목의 배당으로 저 종목을 산다".
   *
   * 미지정·없는 id 는 **자기 자신**이다. 자기 자신이 곧 종전 동작이라, 이 필드가 없는 옛 데이터가
   * 예전과 똑같은 결과를 낸다. 엔진 쪽 계약은 `PortfolioTickerInput.reinvestTargetIndex` 다.
   */
  reinvestTargetByTickerId?: Record<string, string>;
};

export type ScenarioTabState = {
  id: string;
  name: string;
  portfolio: PortfolioPersistedState;
};
