import { AccountTypeSelect, FrequencySelect, InputField } from '@/components';
import { DEFAULT_ACCOUNT_TYPE, isIsaSelectableFor, type AccountType } from '@/shared/constants/tax';
import type { Frequency } from '@/shared/types';
import { ModalCompactFormGrid } from '@/pages/Main/Main.shared.styled';
// 부모 배럴(../../index.ts)을 경유하면 TickerModal ↔ 하위 컴포넌트 순환이 된다 — 상대 경로로 직접 가져온다.
import { FieldWithCaption, ModalCaption } from '../../TickerModal.styled';
import { buildFrequencyMismatchHint, parseNumericInputOrNaN, withDerivedTotalReturn } from '../../TickerModal.utils';
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
        {/* 모순 고지는 **편집 가능한 이 폼에만** 붙인다 — 프리셋 미리보기(PresetTickerPreview)는
            읽기 전용이고 큐레이션된 데이터라 사용자가 만들 수 있는 조합이 아니다. */}
        {/*
          🔴 계좌 유형은 **국내 상장 종목에만** ISA 를 연다(`isIsaSelectableFor`). 국내 ISA 는 국내
             상장 상품만 편입하므로, 미국 상장 종목에 ISA 를 고를 수 있게 두면 현실에 없는 조합으로
             계산된 숫자가 나온다. 그래서 선택지 자체를 안 준다(비활성이 아니라 부재).
          ⚠ ISA 는 세율을 낮추는 게 아니라 **과세 시점을 종료 시점으로 옮긴다** — 지급 때 떼지 않아
            재투자 원금이 커지고, 미뤄 둔 세금은 결과 카드의 정산세로 나타난다.
        */}
        <AccountTypeSelect
          label="계좌 유형"
          value={tickerDraft.accountType ?? DEFAULT_ACCOUNT_TYPE}
          isaSelectable={isIsaSelectableFor(tickerDraft.ticker)}
          hint={
            isIsaSelectableFor(tickerDraft.ticker)
              ? 'ISA 는 지급 때 세금을 떼지 않고 종료 시점에 한 번 정산합니다.'
              : 'ISA 는 국내 상장 종목에만 담을 수 있습니다.'
          }
          onChange={(event) =>
            onChangeDraft((prev) => ({ ...prev, accountType: event.target.value as AccountType }))
          }
        />
        <FrequencySelect
          label="배당 지급 주기"
          value={tickerDraft.frequency}
          hint={buildFrequencyMismatchHint(tickerDraft)}
          onChange={(event) => onChangeDraft((prev) => ({ ...prev, frequency: event.target.value as Frequency }))}
        />
      </ModalCompactFormGrid>
    </>
  );
}

export default TickerDraftForm;
