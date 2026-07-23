import { DIVIDEND_UNIVERSE, PRESET_TICKER_KOREAN_NAME_BY_TICKER, type PresetTickerKey } from '@/shared/constants/presets';
import type { Frequency } from '@/shared/types';

const FREQUENCY_LABEL_KO: Record<Frequency, string> = {
  monthly: '매월',
  quarterly: '분기(연 4회)',
  semiannual: '반기(연 2회)',
  annual: '연 1회'
};

/**
 * 콘텐츠 문단이 소비하는 "엔진 조인" 값. `DIVIDEND_UNIVERSE`(시뮬레이터가 실제 계산에 쓰는 값,
 * 시장데이터 자동 갱신 오버레이 반영분)에서 그대로 읽은 것 — 이 모듈은 어떤 숫자도 새로 만들지
 * 않고 read + format만 한다. 티커 콘텐츠 데이터(`TickerContent`)는 이 값을 절대 복제하지 않는다.
 */
export type TickerEngineFacts = {
  ticker: PresetTickerKey;
  englishName: string;
  koreanName: string;
  initialPrice: number;
  dividendYieldPercent: number;
  dividendGrowthPercent: number;
  expectedTotalReturnPercent: number;
  frequency: Frequency;
  frequencyLabel: string;
  /** 문자열 치환용 표시 포맷(소수 둘째 자리, % 또는 $ 포함). */
  dividendYieldDisplay: string;
  dividendGrowthDisplay: string;
  expectedTotalReturnDisplay: string;
  initialPriceDisplay: string;
};

const formatPercent = (value: number): string => `${value.toFixed(2)}%`;
const formatUsd = (value: number): string => `$${value.toFixed(2)}`;

/**
 * `ticker`를 계산 유니버스(`DIVIDEND_UNIVERSE`)와 한글명 매핑에 조인해 콘텐츠 템플릿이 쓸
 * 표시값을 만든다. 여기서 반환하는 숫자는 전부 프리셋(+시장데이터 오버레이) 그대로이며, 이
 * 함수는 어떤 값도 추정·날조하지 않는다. 서버(크롤러 HTML 렌더러)에서도 그대로 import할 수
 * 있도록 `import.meta.env`나 DOM에 접근하지 않는 순수 함수다.
 */
export const resolveTickerEngineFacts = (ticker: PresetTickerKey): TickerEngineFacts => {
  const preset = DIVIDEND_UNIVERSE[ticker];
  const koreanName = PRESET_TICKER_KOREAN_NAME_BY_TICKER[ticker];

  return {
    ticker,
    englishName: preset.name,
    koreanName,
    initialPrice: preset.initialPrice,
    dividendYieldPercent: preset.dividendYield,
    dividendGrowthPercent: preset.dividendGrowth,
    expectedTotalReturnPercent: preset.expectedTotalReturn,
    frequency: preset.frequency,
    frequencyLabel: FREQUENCY_LABEL_KO[preset.frequency],
    dividendYieldDisplay: formatPercent(preset.dividendYield),
    dividendGrowthDisplay: formatPercent(preset.dividendGrowth),
    expectedTotalReturnDisplay: formatPercent(preset.expectedTotalReturn),
    initialPriceDisplay: formatUsd(preset.initialPrice)
  };
};
