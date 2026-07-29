import { TARGET_MONTHLY_DIVIDEND_INPUT_ID } from '@/shared/constants';
import { scrollIntoViewSafely } from '@/shared/utils';
import { computeAnnualGrowthRate } from '@/pages/Main/utils';
import type { PostInvestmentDividendProjectionRow } from '@/pages/Main/utils';

/*
 * 구 `isConfigDrawerLayout()`(`(max-width: 960px)` 판정)은 삭제했다 — 설정 패널이 **전 해상도에서
 * 드로어**가 되면서 항상 true 여야 하는 함수가 됐고, 남겨두면 넓은 화면에서 목표 포커스 요청이
 * 드로어를 열지 않아 입력이 화면에 없는 상태로 포커스만 시도한다.
 */

/**
 * 목표 월배당 입력으로 스크롤 + 포커스를 옮긴다.
 *
 * 스크롤만으로는 키보드 포커스가 따라가지 않으므로 `focus`까지 한다(`preventScroll`로 두 번 튀지 않게).
 * jsdom에는 `scrollIntoView`가 없어 옵셔널 가드가 필수다. 필드를 못 찾으면 조용히 아무것도 안 한다
 * (드로어 애니메이션 중이거나 id가 바뀐 경우) — 호출부에서 rAF로 한 프레임 미룬 뒤에 부른다.
 */
export const focusTargetMonthlyDividendInput = (): void => {
  const field = typeof document === 'undefined' ? null : document.getElementById(TARGET_MONTHLY_DIVIDEND_INPUT_ID);
  if (!field) return;

  scrollIntoViewSafely(field, { block: 'center' });
  field.focus?.({ preventScroll: true });
};

/**
 * "투자 종료 후 추정" 패널의 제목. 연평균 성장률을 못 구하면(행이 부족) **괄호 안 수치를 빼고**
 * 제목만 낸다 — 숫자를 지어내지 않는다.
 */
export const buildPostInvestmentChartTitle = (
  rows: PostInvestmentDividendProjectionRow[],
  isAssetView: boolean
): string => {
  const subject = isAssetView ? '자산가치 추정' : '월배당 성장 추정';
  const rate = isAssetView
    ? computeAnnualGrowthRate(rows, (row) => row.assetValue)
    : computeAnnualGrowthRate(rows, (row) => row.annualDividend);

  if (rate === null) return `투자 종료 후 ${subject} (추가 납입 없음)`;

  return `투자 종료 후 ${subject} (추가 납입 없음, 연 ${rate >= 0 ? '+' : ''}${(rate * 100).toFixed(2)}%)`;
};
