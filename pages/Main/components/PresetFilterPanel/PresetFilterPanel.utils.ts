import type { PresetTickerKey } from '@/shared/constants';
import { toExpectedTotalReturnPercent } from '@/shared/lib/snowball';
import type { Frequency } from '@/shared/types';
import type { TickerDraft } from '@/shared/types/snowball';
import type { ActiveFilterTag, PresetFilterState, PresetRanges } from './PresetFilterPanel.types';

/**
 * 배당률 슬라이더 상한 캡. 커버드콜(40%+)이 이 한 구간에 몰리므로 20 에서 자른다 —
 * dyMax 가 이 값이면 "20%+"(상한 제약 없음)로 읽는다.
 */
export const DIVIDEND_YIELD_CAP = 20;

/** 기대총수익률(배당률+성장률) 슬라이더 상한 캡. etrMax 가 이 값이면 "25%+"(상한 없음). */
export const EXPECTED_TOTAL_RETURN_CAP = 25;

/** 주기 멀티토글 옵션(라벨은 FrequencySelect 와 일치: 월/분기/반기/연). */
export const FREQUENCY_OPTIONS: ReadonlyArray<{ value: Frequency; label: string }> = [
  { value: 'monthly', label: '월' },
  { value: 'quarterly', label: '분기' },
  { value: 'semiannual', label: '반기' },
  { value: 'annual', label: '연' }
];

const FREQUENCY_LABEL: Record<Frequency, string> = {
  monthly: '월',
  quarterly: '분기',
  semiannual: '반기',
  annual: '연'
};

/**
 * 프리셋 데이터에서 슬라이더 상·하한을 뽑는다(하드코딩 대신 데이터 기반).
 * 배당률/기대총수익률은 캡 상수를 상한으로 쓰고, 주가만 실제 min~max 를 (바닥/천장 라운딩해) 쓴다.
 */
export const derivePresetRanges = (presetTickers: Record<PresetTickerKey, TickerDraft>): PresetRanges => {
  let priceMin = Number.POSITIVE_INFINITY;
  let priceMax = Number.NEGATIVE_INFINITY;

  for (const draft of Object.values(presetTickers)) {
    if (Number.isFinite(draft.initialPrice)) {
      priceMin = Math.min(priceMin, draft.initialPrice);
      priceMax = Math.max(priceMax, draft.initialPrice);
    }
  }

  if (!Number.isFinite(priceMin) || !Number.isFinite(priceMax)) {
    priceMin = 0;
    priceMax = 0;
  }

  return {
    dyMin: 0,
    dyMax: DIVIDEND_YIELD_CAP,
    priceMin: Math.floor(priceMin),
    priceMax: Math.ceil(priceMax),
    etrMin: 0,
    etrMax: EXPECTED_TOTAL_RETURN_CAP
  };
};

/** 아무 제약도 없는 초기 필터 상태(전량 통과). 주가만 데이터 범위에 맞춘다. */
export const createInitialFilterState = (ranges: PresetRanges): PresetFilterState => ({
  dyMin: 0,
  dyMax: DIVIDEND_YIELD_CAP,
  priceMin: ranges.priceMin,
  priceMax: ranges.priceMax,
  etrMin: 0,
  etrMax: EXPECTED_TOTAL_RETURN_CAP,
  frequencies: []
});

/** 범위 파생이 없어도 참조 가능한 정적 빈 상태(주가 상한은 캡 무의미 → Infinity 로 무제약). */
export const EMPTY_FILTER_STATE: PresetFilterState = {
  dyMin: 0,
  dyMax: DIVIDEND_YIELD_CAP,
  priceMin: 0,
  priceMax: Number.POSITIVE_INFINITY,
  etrMin: 0,
  etrMax: EXPECTED_TOTAL_RETURN_CAP,
  frequencies: []
};

export const isDividendYieldActive = (filter: PresetFilterState): boolean =>
  filter.dyMin > 0 || filter.dyMax < DIVIDEND_YIELD_CAP;

export const isPriceActive = (filter: PresetFilterState, ranges: PresetRanges): boolean =>
  filter.priceMin > ranges.priceMin || filter.priceMax < ranges.priceMax;

export const isExpectedTotalReturnActive = (filter: PresetFilterState): boolean =>
  filter.etrMin > 0 || filter.etrMax < EXPECTED_TOTAL_RETURN_CAP;

export const isFrequencyActive = (filter: PresetFilterState): boolean => filter.frequencies.length > 0;

/** 활성(결과를 실제로 좁히는) 필터 개수 — 토글 버튼 배지용. */
export const countActiveFilters = (filter: PresetFilterState, ranges: PresetRanges): number =>
  [
    isDividendYieldActive(filter),
    isPriceActive(filter, ranges),
    isExpectedTotalReturnActive(filter),
    isFrequencyActive(filter)
  ].filter(Boolean).length;

/**
 * 텍스트 필터로 거른 키들에 수치 필터를 AND 로 이어 적용한다.
 *
 * 각 범위는 포함 경계(min ≤ 값 ≤ max):
 * - 배당률: dyMax 가 캡(20)이면 상한 제약 없음(20%+ 포함).
 * - 기대총수익률: `toExpectedTotalReturnPercent(dy, dg)` 로 **파생**해 판정(저장 필드 불신).
 *   etrMax 가 캡(25)이면 상한 제약 없음.
 * - 주가: initialPrice 범위.
 * - 주기: frequencies 가 비면 제약 없음, 아니면 OR 포함.
 * 값이 유한하지 않은(NaN) 필드는 그 축 판정을 건너뛴다(통과) — 프리셋은 정상값이라 방어용.
 */
export const applyPresetFilters = (
  keys: PresetTickerKey[],
  presetTickers: Record<PresetTickerKey, TickerDraft>,
  filter: PresetFilterState
): PresetTickerKey[] => {
  const dividendUnbounded = filter.dyMax >= DIVIDEND_YIELD_CAP;
  const returnUnbounded = filter.etrMax >= EXPECTED_TOTAL_RETURN_CAP;

  return keys.filter((key) => {
    const draft = presetTickers[key];

    const dividendYield = draft.dividendYield;
    if (Number.isFinite(dividendYield)) {
      if (dividendYield < filter.dyMin) return false;
      if (!dividendUnbounded && dividendYield > filter.dyMax) return false;
    }

    const price = draft.initialPrice;
    if (Number.isFinite(price)) {
      if (price < filter.priceMin) return false;
      if (price > filter.priceMax) return false;
    }

    const expectedTotalReturn = toExpectedTotalReturnPercent(draft.dividendYield, draft.dividendGrowth);
    if (Number.isFinite(expectedTotalReturn)) {
      if (expectedTotalReturn < filter.etrMin) return false;
      if (!returnUnbounded && expectedTotalReturn > filter.etrMax) return false;
    }

    if (filter.frequencies.length > 0 && !filter.frequencies.includes(draft.frequency)) return false;

    return true;
  });
};

/** 배당률 값 → 라벨. 캡값이면 상한 없음을 뜻하는 '20%+'. 태그·슬라이더 readout 공용. */
export const formatDividendUpper = (value: number): string =>
  value >= DIVIDEND_YIELD_CAP ? `${DIVIDEND_YIELD_CAP}%+` : `${value}%`;

/** 기대총수익률 값 → 라벨. 캡값이면 '25%+'. 태그·슬라이더 readout 공용. */
export const formatReturnUpper = (value: number): string =>
  value >= EXPECTED_TOTAL_RETURN_CAP ? `${EXPECTED_TOTAL_RETURN_CAP}%+` : `${value}%`;

/** 활성 필터를 제거형 칩 태그로 — 접힌 상태에서도 무엇이 걸려 있는지 되읽기 위함. */
export const buildActiveFilterTags = (filter: PresetFilterState, ranges: PresetRanges): ActiveFilterTag[] => {
  const tags: ActiveFilterTag[] = [];

  if (isDividendYieldActive(filter)) {
    tags.push({
      id: 'dividendYield',
      label: `배당률 ${filter.dyMin}% ~ ${formatDividendUpper(filter.dyMax)}`,
      clear: (state) => ({ ...state, dyMin: 0, dyMax: DIVIDEND_YIELD_CAP })
    });
  }

  if (isPriceActive(filter, ranges)) {
    tags.push({
      id: 'price',
      label: `현재 주가 $${filter.priceMin} ~ $${filter.priceMax}`,
      clear: (state) => ({ ...state, priceMin: ranges.priceMin, priceMax: ranges.priceMax })
    });
  }

  if (isExpectedTotalReturnActive(filter)) {
    tags.push({
      id: 'expectedTotalReturn',
      label: `기대총수익률 ${filter.etrMin}% ~ ${formatReturnUpper(filter.etrMax)}`,
      clear: (state) => ({ ...state, etrMin: 0, etrMax: EXPECTED_TOTAL_RETURN_CAP })
    });
  }

  if (isFrequencyActive(filter)) {
    tags.push({
      id: 'frequency',
      label: `주기 ${filter.frequencies.map((frequency) => FREQUENCY_LABEL[frequency]).join('·')}`,
      clear: (state) => ({ ...state, frequencies: [] })
    });
  }

  return tags;
};
