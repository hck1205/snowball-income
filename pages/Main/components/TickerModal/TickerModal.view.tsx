import { FrequencySelect, InputField } from '@/components';
import type { PresetTickerKey } from '@/shared/constants';
import type { Frequency } from '@/shared/types';
import {
  FormGrid,
  InlineField,
  InlineFieldHeader,
  InlineSelect,
  ModalActions,
  ModalBackdrop,
  ModalBody,
  ModalPanel,
  ModalTitle,
  PrimaryButton,
  SecondaryButton
} from '@/pages/Main/Main.shared.styled';
import type { TickerModalViewProps } from './TickerModal.types';

export default function TickerModalView({
  isOpen,
  mode,
  selectedPreset,
  presetTickers,
  tickerDraft,
  onBackdropClick,
  onSelectPreset,
  onChangeDraft,
  onDelete,
  onClose,
  onSave
}: TickerModalViewProps) {
  if (!isOpen) return null;

  return (
    <ModalBackdrop role="dialog" aria-modal="true" aria-label="티커 생성" onClick={onBackdropClick}>
      <ModalPanel>
        <ModalTitle>{mode === 'edit' ? '티커 설정 수정' : '티커 생성'}</ModalTitle>
        <ModalBody>
          {mode === 'edit'
            ? '값을 수정하면 해당 티커 설정이 업데이트됩니다.'
            : '아래 값을 저장하면 좌측 목록에 티커가 추가됩니다.'}
        </ModalBody>
        <InlineField htmlFor="ticker-preset">
          <InlineFieldHeader>프리셋 티커</InlineFieldHeader>
          <InlineSelect
            id="ticker-preset"
            aria-label="프리셋 티커"
            value={selectedPreset}
            onChange={(event) => {
              const nextPreset = event.target.value as 'custom' | PresetTickerKey;
              onSelectPreset(nextPreset);
            }}
          >
            <option value="custom">직접 입력</option>
            {Object.keys(presetTickers).map((ticker) => (
              <option key={ticker} value={ticker}>
                {ticker}
              </option>
            ))}
          </InlineSelect>
        </InlineField>
        <FormGrid>
          <InputField
            label="티커"
            value={tickerDraft.ticker}
            onChange={(event) => onChangeDraft((prev) => ({ ...prev, ticker: event.target.value }))}
          />
          <InputField
            label="현재 주가"
            type="number"
            min={0}
            value={tickerDraft.initialPrice}
            onChange={(event) => onChangeDraft((prev) => ({ ...prev, initialPrice: Number(event.target.value) }))}
          />
          <InputField
            label="배당률"
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={tickerDraft.dividendYield}
            onChange={(event) => onChangeDraft((prev) => ({ ...prev, dividendYield: Number(event.target.value) }))}
          />
          <InputField
            label="배당 성장률"
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={tickerDraft.dividendGrowth}
            onChange={(event) => onChangeDraft((prev) => ({ ...prev, dividendGrowth: Number(event.target.value) }))}
          />
          <InputField
            label="주가 성장률"
            type="number"
            min={-100}
            max={100}
            step={0.1}
            value={tickerDraft.priceGrowth}
            onChange={(event) => onChangeDraft((prev) => ({ ...prev, priceGrowth: Number(event.target.value) }))}
          />
          <FrequencySelect
            label="배당 지급 주기"
            value={tickerDraft.frequency}
            onChange={(event) => onChangeDraft((prev) => ({ ...prev, frequency: event.target.value as Frequency }))}
          />
        </FormGrid>
        <ModalActions>
          {mode === 'edit' ? (
            <SecondaryButton type="button" onClick={onDelete}>
              티커 삭제
            </SecondaryButton>
          ) : null}
          <SecondaryButton type="button" onClick={onClose}>
            취소
          </SecondaryButton>
          <PrimaryButton type="button" onClick={onSave}>
            {mode === 'edit' ? '저장' : '생성'}
          </PrimaryButton>
        </ModalActions>
      </ModalPanel>
    </ModalBackdrop>
  );
}
