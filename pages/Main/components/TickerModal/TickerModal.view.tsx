import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FrequencySelect, InputField } from '@/components';
import type { PresetTickerKey } from '@/shared/constants';
import { getTickerDisplayName } from '@/shared/utils';
import type { Frequency } from '@/shared/types';
import {
  FormGrid,
  InlineField,
  InlineFieldHeader,
  ModalActions,
  ModalBackdrop,
  ModalBody,
  ModalPanel,
  ModalTitle,
  PresetDropdownButton,
  PresetDropdownMenu,
  PresetDropdownOption,
  PresetDropdownWrap,
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
  onHelpExpectedTotalReturn,
  onDelete,
  onClose,
  onSave
}: TickerModalViewProps) {
  const modalRoot = typeof document !== 'undefined' ? document.body : null;
  const [isPresetOpen, setIsPresetOpen] = useState(false);
  const presetDropdownRef = useRef<HTMLDivElement | null>(null);
  const presetKeys = Object.keys(presetTickers) as PresetTickerKey[];
  const selectedPresetLabel =
    selectedPreset === 'custom'
      ? '직접 입력'
      : getTickerDisplayName(presetTickers[selectedPreset].ticker, presetTickers[selectedPreset].name);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isPresetOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!presetDropdownRef.current) return;
      if (presetDropdownRef.current.contains(event.target as Node)) return;
      setIsPresetOpen(false);
    };

    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, [isPresetOpen]);

  if (!isOpen) return null;
  if (!modalRoot) return null;

  return createPortal(
    <ModalBackdrop role="dialog" aria-modal="true" aria-label="티커 생성" onClick={onBackdropClick}>
      <ModalPanel>
        <ModalTitle>{mode === 'edit' ? '티커 설정 수정' : '티커 생성'}</ModalTitle>
        <ModalBody>
          {mode === 'edit'
            ? '값을 수정하면 해당 티커 설정이 업데이트됩니다.'
            : '아래 값을 저장하면 좌측 목록에 티커가 추가됩니다.'}
        </ModalBody>
        <InlineField>
          <InlineFieldHeader>프리셋 티커</InlineFieldHeader>
          <PresetDropdownWrap ref={presetDropdownRef}>
            <PresetDropdownButton
              type="button"
              aria-label="프리셋 티커"
              aria-haspopup="listbox"
              aria-expanded={isPresetOpen}
              onClick={() => setIsPresetOpen((prev) => !prev)}
            >
              {selectedPresetLabel}
            </PresetDropdownButton>
            {isPresetOpen ? (
              <PresetDropdownMenu role="listbox" aria-label="프리셋 티커 목록">
                <PresetDropdownOption
                  type="button"
                  role="option"
                  selected={selectedPreset === 'custom'}
                  aria-selected={selectedPreset === 'custom'}
                  onClick={() => {
                    onSelectPreset('custom');
                    setIsPresetOpen(false);
                  }}
                >
                  직접 입력
                </PresetDropdownOption>
                {presetKeys.map((presetKey) => (
                  <PresetDropdownOption
                    key={presetKey}
                    type="button"
                    role="option"
                    selected={selectedPreset === presetKey}
                    aria-selected={selectedPreset === presetKey}
                    onClick={() => {
                      onSelectPreset(presetKey);
                      setIsPresetOpen(false);
                    }}
                  >
                    {getTickerDisplayName(presetTickers[presetKey].ticker, presetTickers[presetKey].name)}
                  </PresetDropdownOption>
                ))}
              </PresetDropdownMenu>
            ) : null}
          </PresetDropdownWrap>
        </InlineField>
        <FormGrid>
          <InputField
            label="티커"
            value={tickerDraft.ticker}
            onChange={(event) => onChangeDraft((prev) => ({ ...prev, ticker: event.target.value, name: '' }))}
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
            label="기대 총수익율 (CAGR)"
            helpAriaLabel="CAGR 설명 열기"
            onHelpClick={onHelpExpectedTotalReturn}
            type="number"
            min={-100}
            max={100}
            step={0.1}
            value={tickerDraft.expectedTotalReturn}
            onChange={(event) => onChangeDraft((prev) => ({ ...prev, expectedTotalReturn: Number(event.target.value) }))}
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
    </ModalBackdrop>,
    modalRoot
  );
}
