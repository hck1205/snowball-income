import { FrequencySelect, InputField } from '@/components';
import { FormGrid, ModalCompactFormGrid } from '@/pages/Main/Main.shared.styled';
// 부모 배럴(../../index.ts)을 경유하면 TickerModal ↔ 하위 컴포넌트 순환이 된다 — 상대 경로로 직접 가져온다.
import { FieldWithCaption, ModalCaption } from '../../TickerModal.styled';
import type { PresetTickerPreviewProps } from './PresetTickerPreview.types';

/**
 * "프리셋" 탭 하단 — 선택한 프리셋의 값을 읽기 전용으로 보여주는 요약 폼.
 * TickerModal 본체에서 뷰 조각만 분리했다 — 모든 필드는 disabled 그대로다.
 */
function PresetTickerPreview({
  tickerDraft,
  displayName,
  derivedTotalReturn,
  totalReturnCaption,
  onHelpExpectedTotalReturn
}: PresetTickerPreviewProps) {
  return (
    <>
      <FormGrid>
        <InputField label="티커" value={tickerDraft.ticker} disabled onChange={() => undefined} />
        {/* 🔴 저장되는 값(`tickerDraft.name`)이 아니라 표시용 이름이다 — 근거는 types 의 주석. */}
        <InputField label="이름" value={displayName} disabled onChange={() => undefined} />
      </FormGrid>
      <ModalCompactFormGrid>
        <InputField label="현재 주가" prefix="$" type="number" min={0} value={tickerDraft.initialPrice} disabled onChange={() => undefined} />
        <InputField
          label="배당률"
          suffix="%"
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={tickerDraft.dividendYield}
          disabled
          onChange={() => undefined}
        />
        <InputField
          label="배당 성장률"
          suffix="%"
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={tickerDraft.dividendGrowth}
          disabled
          onChange={() => undefined}
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
          disabled
          onChange={() => undefined}
        />
      </ModalCompactFormGrid>
    </>
  );
}

export default PresetTickerPreview;
