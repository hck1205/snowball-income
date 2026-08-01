import type { SimulationOutput } from '@/shared/types';
import type { ResultAmountFormatter } from '@/pages/Main/utils';
import { targetYearLabel } from '@/pages/Main/utils';
import type { DrawerResultStripItem } from './DrawerResultStrip.types';

type BuildParams = {
  simulation: SimulationOutput;
  /** 간편 추정 모드인가. 결과 카드와 **같은 분기**를 써야 두 표면의 숫자가 갈리지 않는다. */
  showQuickEstimate: boolean;
  targetMonthlyDividend: number;
  /** 결과 카드가 쓰는 그 포맷터(표시 통화 인식). 여기서 새로 만들지 않는다. */
  formatAmount: ResultAmountFormatter;
  isCompact: boolean;
};

/**
 * 드로어 상단 스트립의 세 값 — **결과 요약 카드에서 그대로 뽑아 온다**(새 계산·새 포맷터 없음).
 *
 * - 최종 자산 : 카드의 hero 와 같은 값(`quickEstimate.endValue` / `summary.finalAssetValue`)
 * - 월배당    : 카드의 월배당 타일과 같은 값
 * - 목표 도달 : 카드의 목표 타일과 같은 값. 목표가 0이면 '미설정'
 *
 * ⚠ 목표 도달 연도는 간편 추정에도 정밀 엔진의 `summary` 를 쓴다 — `quickEstimate` 에는 그 값이
 *   아예 없고, 앱의 다른 표면(차트 목표선·내 포트폴리오)도 모두 `summary` 를 본다.
 */
export const buildDrawerResultStripItems = ({
  simulation,
  showQuickEstimate,
  targetMonthlyDividend,
  formatAmount,
  isCompact
}: BuildParams): DrawerResultStripItem[] => {
  const { summary, quickEstimate } = simulation;

  return [
    {
      label: showQuickEstimate ? '최종 자산(추정)' : '최종 자산',
      value: formatAmount(showQuickEstimate ? quickEstimate.endValue : summary.finalAssetValue, isCompact)
    },
    {
      label: showQuickEstimate ? '월배당(추정)' : '월배당',
      value: formatAmount(
        showQuickEstimate ? quickEstimate.monthlyDividendApprox : summary.finalMonthlyAverageDividend,
        isCompact
      )
    },
    {
      label: '목표 도달',
      value: targetMonthlyDividend > 0 ? targetYearLabel(summary.targetMonthDividendReachedYear) : '미설정'
    }
  ];
};
