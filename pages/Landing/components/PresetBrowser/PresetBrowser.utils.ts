import { CHART_SERIES_VARS } from '@/shared/styles';
import type { PickCardCap } from '@/components/common';
import type { PortfolioPresetPlaceholder } from '@/shared/constants/portfolioPresets';
import type { PresetAllocationSegment, PresetGroupTone } from './PresetBrowser.types';

/**
 * 묶음 톤 → **레일 캡의 색 축**.
 *
 * 🔴 랜딩은 **레일 캡만** 쓴다(`kind: 'rail'`, 6px). 틴트 캡(48~88px)은 `tintscan` 이 면으로 세는데
 * 이 화면의 면 예산은 2개로 확정돼 있고 히어로와 마무리 패널이 이미 그 둘이다. 6px 은 스캐너의
 * 높이 하한(8px)에 못 미쳐 세어지지 않는다 — 즉 **여기서는 색을 예산 없이 쓸 수 있다.**
 *
 * `neutral`(특화 묶음)만 `scoped` 인 이유: `PickCapAxis` 에는 중립 축이 없다. 없는 축을
 * 억지로 accent 로 접으면 "특화"가 "균형"과 같은 색이 되어 **색이 거짓말을 한다**. 대신 호출부가
 * 중립 변수를 직접 준다(글자색까지 함께 줘야 캡 글리프가 중립 텍스트로 떨어지지 않는다).
 *
 * ⚠ 값은 CSS 변수 **이름**이다(`shared/styles/semantic.ts` 의 `borderStrong`·`textSecondary`).
 *   `color.*` 를 넘기면 `var(var(--…))` 가 되어 조용히 색이 사라진다.
 */
export const PRESET_CAP_AXIS = {
  identity: { axis: 'identity' },
  accent: { axis: 'accent' },
  accentAlt: { axis: 'accentAlt' },
  neutral: { axis: 'scoped', scopedVar: '--sb-border-strong', scopedInkVar: '--sb-text-secondary' }
} as const satisfies Record<PresetGroupTone, Pick<PickCardCap, 'axis' | 'scopedVar' | 'scopedInkVar'>>;

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
