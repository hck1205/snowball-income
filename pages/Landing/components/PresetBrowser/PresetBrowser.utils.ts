import { CHART_SERIES_VARS } from '@/shared/styles';
import type { PortfolioPresetPlaceholder } from '@/shared/constants/portfolioPresets';
import type { PresetAllocationSegment } from './PresetBrowser.types';

/**
 * 프리셋 카드가 보여 줄 **두 표현이 같은 배열에서 나오게** 하는 순수 계층.
 *
 * 🔴 막대(장식)와 텍스트(사실)가 서로 다른 출처를 쓰면 언젠가 반드시 어긋나고, 어긋난 화면은
 * "색은 이렇게 말하는데 글자는 저렇게 말하는" 상태가 된다. 둘 다 `preset.allocations` 하나에서 만든다.
 *
 * 🔴 `coreType`(손으로 적은 티커 목록 사본)은 쓰지 않는다 — `allocations` 와 어긋날 때 어느 쪽이
 * 맞는지 알 방법이 없다. 랜딩에서 보여 줄 프리셋 필드는 `title`·`hook`·`allocations` 뿐이다
 * (금액·기간 필드는 엔진 계산이 아니라 큐레이션 문구라 **노출 금지**).
 */
export const buildAllocationSegments = (preset: PortfolioPresetPlaceholder): PresetAllocationSegment[] =>
  preset.allocations.map((allocation, index) => ({
    ticker: allocation.ticker,
    weight: allocation.weight,
    colorVar: CHART_SERIES_VARS[index % CHART_SERIES_VARS.length]
  }));

/** "SCHD 30% · VIG 20% · …" — 막대가 말하지 못하는 것을 전부 말하는 줄. */
export const formatAllocationText = (segments: readonly PresetAllocationSegment[]): string =>
  segments.map((segment) => `${segment.ticker} ${segment.weight}%`).join(' · ');
