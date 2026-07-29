import { memo, useCallback } from 'react';
import { Banner } from '@/components';
import { CompactSummaryHelpButton } from '@/components/common';
import { useSetActiveHelpWrite } from '@/jotai';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { FINANCIAL_INCOME_TAX_THRESHOLD } from '@/shared/constants';
import type { FinancialIncomeNoticeProps } from './FinancialIncomeNotice.types';
import { toManWon } from './FinancialIncomeNotice.utils';

/**
 * 금융소득종합과세 안내. 구 결과 카드 **안**에 있던 배너를 결과 그리드의 자기 칸으로 승격했다 —
 * 입력한 세율이 실제와 달라질 수 있다는 경고는 요약 숫자의 부속이 아니라 전체 결과에 걸리는 사실이다.
 */
function FinancialIncomeNoticeComponent({ thresholdYear }: FinancialIncomeNoticeProps) {
  const setActiveHelp = useSetActiveHelpWrite();
  const openFinancialIncomeTaxHelp = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'open_help_simulation_financial_income_tax',
      placement: 'simulation_result'
    });
    setActiveHelp('simulationFinancialIncomeTax');
  }, [setActiveHelp]);

  return (
    <Banner tone="warning" role="note" aria-label="금융소득종합과세 안내">
      {/* 도움말 버튼을 문단 안에 둔다 — Banner 본문은 grid라서 형제로 두면 아래로 떨어진다. */}
      <p>
        {`이 시나리오는 ${thresholdYear}년차에 세전 연 배당이 ${toManWon(FINANCIAL_INCOME_TAX_THRESHOLD)}을 넘습니다. ` +
          '금융소득종합과세 대상이 되어 실제 세율이 입력한 값보다 높아질 수 있습니다. '}
        <CompactSummaryHelpButton type="button" aria-label="금융소득종합과세 설명" onClick={openFinancialIncomeTaxHelp}>
          ?
        </CompactSummaryHelpButton>
      </p>
    </Banner>
  );
}

const FinancialIncomeNotice = memo(FinancialIncomeNoticeComponent);

export default FinancialIncomeNotice;
