import { atom } from 'jotai/vanilla';
import { DEFAULT_DISPLAY_CURRENCY, HELP_CONTENT, type DisplayCurrency, type HelpKey } from '@/shared/constants';
import type { ExchangeRateView } from '@/shared/lib/fx';
import { useAtomValue } from '@/jotai/atom';
import { activeHelpAtom, displayCurrencyAtom } from '../ui';
import { fxViewAtom } from '../fx';
import { fixedByTickerIdAtom, includedTickerIdsAtom, tickerProfilesAtom, weightByTickerIdAtom } from '../portfolio';

export const currentHelpAtom = atom((get) => {
  const activeHelp = get(activeHelpAtom);
  if (!activeHelp) return null;
  if (!(activeHelp in HELP_CONTENT)) return null;
  return HELP_CONTENT[activeHelp as HelpKey];
});

export const includedProfilesAtom = atom((get) => {
  const tickerProfiles = get(tickerProfilesAtom);
  const includedTickerIds = get(includedTickerIdsAtom);
  return tickerProfiles.filter((profile) => includedTickerIds.includes(profile.id));
});

export const normalizedAllocationAtom = atom((get) => {
  const includedProfiles = get(includedProfilesAtom);
  const weightByTickerId = get(weightByTickerIdAtom);

  if (includedProfiles.length === 0) return [];

  const rawWeights = includedProfiles.map((profile) => Math.max(0, weightByTickerId[profile.id] ?? 1));
  const rawWeightSum = rawWeights.reduce((sum, value) => sum + value, 0);
  const normalizedWeights =
    rawWeightSum === 0 ? includedProfiles.map(() => 1 / includedProfiles.length) : rawWeights.map((weight) => weight / rawWeightSum);

  return includedProfiles.map((profile, index) => ({ profile, weight: normalizedWeights[index] }));
});

export const allocationPercentByTickerIdAtom = atom((get) =>
  get(normalizedAllocationAtom).reduce<Record<string, number>>((acc, item) => {
    acc[item.profile.id] = Number((item.weight * 100).toFixed(1));
    return acc;
  }, {})
);

export const allocationPercentExactByTickerIdAtom = atom((get) =>
  get(normalizedAllocationAtom).reduce<Record<string, number>>((acc, item) => {
    acc[item.profile.id] = item.weight * 100;
    return acc;
  }, {})
);

export const adjustableTickerCountAtom = atom((get) => {
  const fixedByTickerId = get(fixedByTickerIdAtom);
  return get(includedProfilesAtom).filter((profile) => !fixedByTickerId[profile.id]).length;
});

// ── 표시 통화 (선호 × 환율 가용성) ───────────────────────────────────────────────
// 계산은 언제나 원화다. 여기서 나오는 값은 **표시 포맷**만 가른다.

/** 환율 실값(1 USD = N KRW). 값이 없는 상태(loading/error)는 `null` — 달러 표시가 불가능하다는 뜻. */
export const fxRateValueAtom = atom<number | null>((get) => {
  const view = get(fxViewAtom);
  return view.status === 'success' || view.status === 'stale' ? view.rate.rate : null;
});

/** 달러 표시가 실제로 가능한가 = 환율 값이 있는가(`success` 또는 `stale`). */
export const canUseUsdAtom = atom((get) => get(fxRateValueAtom) !== null);

/**
 * **실제 적용되는** 표시 통화. 선호가 USD여도 환율이 없으면 원화로 떨어진다.
 *
 * 선호(`displayCurrencyAtom`)와 적용을 분리하는 것이 핵심 안전장치다 — 어떤 경로로도
 * `rate == null` 인 채 달러 포맷터가 불리지 않아 `$NaN`이 구조적으로 불가능해진다.
 * 선호 자체는 지우지 않으므로 환율이 복구되면 달러 표시로 자동 복귀한다.
 */
export const effectiveDisplayCurrencyAtom = atom<DisplayCurrency>((get) =>
  get(displayCurrencyAtom) === 'USD' && get(canUseUsdAtom) ? 'USD' : DEFAULT_DISPLAY_CURRENCY
);

/** 표시 통화 소비자(툴바 토글 + 포맷터 + 차트)가 한 번에 읽는 값 묶음. */
export type DisplayCurrencyView = {
  /** 실제 적용 통화 — 포맷터는 반드시 이 값으로 분기한다. */
  currency: DisplayCurrency;
  /** 사용자가 고른 선호 — 토글의 체크 상태. 환율이 없어도 유지된다. */
  preferred: DisplayCurrency;
  /** 달러 표시 가능 여부 — 토글 비활성/안내 문구 판단용. */
  canUseUsd: boolean;
  /** 1 USD = N KRW. `currency === 'USD'` 일 때 항상 non-null 이다. */
  rate: number | null;
  /** 환율 기준 시각(ISO). 값이 없으면 null. */
  asOf: string | null;
  /** 조회 상태 — 로딩/실패를 구분해 안내가 필요할 때. */
  status: ExchangeRateView['status'];
};

export const displayCurrencyViewAtom = atom<DisplayCurrencyView>((get) => {
  const view = get(fxViewAtom);
  const hasRate = view.status === 'success' || view.status === 'stale';
  return {
    currency: get(effectiveDisplayCurrencyAtom),
    preferred: get(displayCurrencyAtom),
    canUseUsd: hasRate,
    rate: hasRate ? view.rate.rate : null,
    asOf: hasRate ? view.rate.asOf : null,
    status: view.status
  };
});

export const useCurrentHelpAtomValue = () => useAtomValue(currentHelpAtom);
export const useIncludedProfilesAtomValue = () => useAtomValue(includedProfilesAtom);
export const useNormalizedAllocationAtomValue = () => useAtomValue(normalizedAllocationAtom);
export const useAllocationPercentByTickerIdAtomValue = () => useAtomValue(allocationPercentByTickerIdAtom);
export const useAllocationPercentExactByTickerIdAtomValue = () => useAtomValue(allocationPercentExactByTickerIdAtom);
export const useAdjustableTickerCountAtomValue = () => useAtomValue(adjustableTickerCountAtom);
export const useFxRateValueAtomValue = () => useAtomValue(fxRateValueAtom);
export const useCanUseUsdAtomValue = () => useAtomValue(canUseUsdAtom);
export const useEffectiveDisplayCurrencyAtomValue = () => useAtomValue(effectiveDisplayCurrencyAtom);
export const useDisplayCurrencyViewAtomValue = () => useAtomValue(displayCurrencyViewAtom);
