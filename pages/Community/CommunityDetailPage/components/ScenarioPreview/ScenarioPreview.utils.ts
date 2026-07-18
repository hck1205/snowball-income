import type { EChartsOption } from 'echarts';
import type { ScenarioPayload } from '@/shared/lib/supabase';
import { getTickerDisplayName } from '@/shared/utils';
import {
  buildAllocationPieOption,
  buildNormalizedAllocation,
  getIncludedProfiles,
  type NormalizedAllocationItem
} from '@/pages/Main/utils';

/**
 * 첨부 payload → 티커별 **정규화 비중**(파이·aria 공용). 시뮬레이터와 **같은 함수**를 쓴다
 * (`getIncludedProfiles` + `buildNormalizedAllocation`, pages/Main/utils): 포함 티커만·원래 순서·
 * 음수 0클램프·합 0이면 균등. 상세 미리보기가 시뮬레이터와 다른 비중을 그리면 그건 버그다.
 */
export const buildPreviewNormalizedAllocation = (payload: ScenarioPayload): NormalizedAllocationItem[] => {
  const { portfolio } = payload;
  const included = getIncludedProfiles(portfolio.tickerProfiles, portfolio.includedTickerIds);
  return buildNormalizedAllocation(included, portfolio.weightByTickerId);
};

/**
 * 비중 도넛 옵션 — 시뮬레이터 `PortfolioComposition`의 `allocationPieOption`을 만드는 **그 빌더**를
 * 그대로 재사용해 동일한 비주얼(조각 색 = 프리셋 시리즈, 외곽 라벨, 슬라이스 경계, 중앙 월배당)을 낸다.
 * 요약(finalMonthlyDividend)이 있으면 중앙에 세후 월평균 배당을 표시하고, 없으면 중앙 표시를 끈다.
 */
export const buildPreviewPieOption = (
  normalizedAllocation: NormalizedAllocationItem[],
  finalMonthlyDividend: number | null
): EChartsOption | null =>
  buildAllocationPieOption({
    normalizedAllocation,
    showPortfolioDividendCenter: finalMonthlyDividend !== null,
    finalMonthlyAverageDividend: finalMonthlyDividend ?? 0
  });

/**
 * 파이 aria-label 본문 — "슈드 40%, JEPI 30%, …"(정수 %). 색만으로 말하지 않기 위한 텍스트 대안.
 * 접두어("포트폴리오 비중")는 호출부가 copy로 붙인다(카피 단일 원천 유지).
 */
export const buildAllocationSummaryText = (items: NormalizedAllocationItem[]): string =>
  items
    .map((item) => `${getTickerDisplayName(item.profile.ticker, item.profile.name)} ${Math.round(item.weight * 100)}%`)
    .join(', ');
