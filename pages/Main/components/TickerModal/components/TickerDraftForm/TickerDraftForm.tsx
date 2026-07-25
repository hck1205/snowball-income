import { FrequencySelect, InputField } from '@/components';
import type { Frequency } from '@/shared/types';
import { ModalCompactFormGrid } from '@/pages/Main/Main.shared.styled';
// 부모 배럴(../../index.ts)을 경유하면 TickerModal ↔ 하위 컴포넌트 순환이 된다 — 상대 경로로 직접 가져온다.
import { FieldWithCaption, ModalCaption } from '../../TickerModal.styled';
import { parseNumericInputOrNaN, withDerivedTotalReturn } from '../../TickerModal.utils';
import type { TickerDraftFormProps } from './TickerDraftForm.types';

/**
 * "직접 입력" 탭의 편집 가능한 티커 폼.
 * TickerModal 본체에서 뷰 조각만 분리했다 — 드래프트 갱신 로직은 부모 핸들러 그대로다.
 */
function TickerDraftForm({
  tickerDraft,
  isCreateCustomInput,
  derivedTotalReturn,
  totalReturnCaption,
  onChangeDraft,
  onHelpExpectedTotalReturn
}: TickerDraftFormProps) {
  return (
    <>
      <InputField
        label="티커"
        value={tickerDraft.ticker}
        placeholder="예: SCHD"
        onChange={(event) => onChangeDraft((prev) => ({ ...prev, ticker: event.target.value, name: '' }))}
      />
      <ModalCompactFormGrid>
        <InputField
          label="현재 주가"
          prefix="$"
          type="number"
          min={0}
          value={isCreateCustomInput && Number.isNaN(tickerDraft.initialPrice) ? '' : tickerDraft.initialPrice}
          placeholder="예: 100"
          onChange={(event) =>
            onChangeDraft((prev) => ({
              ...prev,
              initialPrice: parseNumericInputOrNaN(event.target.value)
            }))
          }
        />
        <InputField
          label="배당률"
          suffix="%"
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={isCreateCustomInput && Number.isNaN(tickerDraft.dividendYield) ? '' : tickerDraft.dividendYield}
          placeholder="예: 3.5"
          onChange={(event) =>
            onChangeDraft((prev) =>
              withDerivedTotalReturn({
                ...prev,
                dividendYield: parseNumericInputOrNaN(event.target.value)
              })
            )
          }
        />
        <InputField
          label="배당 성장률"
          suffix="%"
          type="number"
          min={-100}
          max={100}
          step={0.1}
          value={isCreateCustomInput && Number.isNaN(tickerDraft.dividendGrowth) ? '' : tickerDraft.dividendGrowth}
          placeholder="예: 7 (음수 가능)"
          onChange={(event) =>
            onChangeDraft((prev) =>
              withDerivedTotalReturn({
                ...prev,
                dividendGrowth: parseNumericInputOrNaN(event.target.value)
              })
            )
          }
        />
        <FieldWithCaption>
          <InputField
            label="기대 총수익율 (CAGR)"
            suffix="%"
            helpAriaLabel="CAGR 설명 열기"
            onHelpClick={onHelpExpectedTotalReturn}
            type="number"
            value={Number.isNaN(derivedTotalReturn) ? '' : derivedTotalReturn}
            disabled
            onChange={() => undefined}
          />
          {totalReturnCaption ? <ModalCaption>{totalReturnCaption}</ModalCaption> : null}
        </FieldWithCaption>
        <FrequencySelect
          label="배당 지급 주기"
          value={tickerDraft.frequency}
          onChange={(event) => onChangeDraft((prev) => ({ ...prev, frequency: event.target.value as Frequency }))}
        />
      </ModalCompactFormGrid>
    </>
  );
}

export default TickerDraftForm;
