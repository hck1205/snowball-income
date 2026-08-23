import { memo } from 'react';
import {
  AllocationHoldingAmount,
  AllocationHoldingDivider,
  AllocationHoldingDividend,
  AllocationHoldingField,
  AllocationHoldingRow,
  AllocationSrOnly,
  QuantityInput
} from '@/components/common';
import { ALLOCATION_COPY } from '@/shared/constants';
import { ALLOCATION_SHARES_DECIMALS, toSharesDisplayValue } from './HoldingRow.utils';
import type { HoldingRowProps } from './HoldingRow.types';

/**
 * 비중 줄 **바로 아래**에서 같은 배분을 "몇 주 · 얼마 · 월 얼마"로 읽는 줄.
 *
 * 수량만 입력이고 나머지는 그 결과다 — 금액은 이미 총 투자금과 슬라이더 두 경로로 조절되므로
 * 세 번째 입력을 두지 않는다.
 *
 * 부모(`PortfolioComposition`)에서 떼어낸 이유는 관심사다: 저쪽은 비중 조절(슬라이더·고정·힌트)을
 * 맡고, 이 줄은 주식 수를 맡는다. 한 파일에 있을 때 350줄이었고 두 흐름이 한 map 안에서 얽혀 있었다.
 */
function HoldingRowComponent({
  profileId,
  displayName,
  shares,
  amount,
  monthlyDividend,
  draftValue,
  formatAmount,
  noticeId,
  onChange,
  onBlur
}: HoldingRowProps) {
  /* 🔴 `null` 은 0주가 아니라 **낼 수 없다**(환율 미조회). 잠그되 사유를 반드시 함께 준다. */
  const isLocked = shares === null;

  return (
    <AllocationHoldingRow>
      <AllocationHoldingField>
        <QuantityInput
          size="sm"
          decimals={ALLOCATION_SHARES_DECIMALS}
          value={draftValue ?? toSharesDisplayValue(shares)}
          ariaLabel={ALLOCATION_COPY.sharesInputAria(displayName)}
          disabled={isLocked}
          describedById={isLocked ? noticeId : undefined}
          onChange={(next) => onChange(profileId, next)}
          onBlur={() => onBlur(profileId)}
        />
      </AllocationHoldingField>
      <AllocationHoldingAmount>
        <AllocationSrOnly>{ALLOCATION_COPY.holdingAmountSrLabel}</AllocationSrOnly>
        {formatAmount(amount)}
      </AllocationHoldingAmount>
      <AllocationHoldingDivider aria-hidden>·</AllocationHoldingDivider>
      <AllocationHoldingDividend>
        <AllocationSrOnly>{ALLOCATION_COPY.holdingDividendSrLabel}</AllocationSrOnly>
        {`${ALLOCATION_COPY.holdingDividendPrefix} ${formatAmount(monthlyDividend)}`}
      </AllocationHoldingDividend>
    </AllocationHoldingRow>
  );
}

const HoldingRow = memo(HoldingRowComponent);

export default HoldingRow;
