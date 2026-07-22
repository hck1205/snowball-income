import { useEffect, useRef, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Button, RangeSlider } from '@/components/common';
import type { Frequency } from '@/shared/types';
import type { PresetFilterDrawerProps, PresetFilterState } from './PresetFilterPanel.types';
import {
  DIVIDEND_YIELD_CAP,
  EXPECTED_TOTAL_RETURN_CAP,
  FREQUENCY_OPTIONS,
  createInitialFilterState,
  formatDividendUpper,
  formatReturnUpper
} from './PresetFilterPanel.utils';
import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  EmptyNote,
  Field,
  FieldLabel,
  FooterInfoRow,
  FrequencyChip,
  FrequencyRow,
  ResetButton,
  ResultCount,
  Scrim
} from './PresetFilterPanel.styled';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 모달 우측 슬라이드 드로어. 셸(ModalShell)의 absolute 형제로 마운트돼 패널 스크롤과 무관하게 핀된다.
 *
 * 접근성(이 컴포넌트가 소유):
 * - `role="dialog" aria-modal aria-label` + 열릴 때 닫기 버튼으로 포커스 이동 + Tab 트랩.
 * - ESC 는 여기서 삼켜 `onClose` 만 부르고 **native stopPropagation** 으로 TickerModal 의 window
 *   keydown(모달 닫기)까지 전파를 끊는다 — 이게 없으면 ESC 한 번에 모달까지 닫힌다.
 * - 포커스 복귀(트리거로)는 상위 뷰가 소유한다(닫힐 때 드로어가 언마운트되므로).
 */
export default function PresetFilterDrawer({
  open,
  drawerId,
  filter,
  ranges,
  onChange,
  resultCount,
  onClose
}: PresetFilterDrawerProps) {
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // 열릴 때 닫기 버튼으로 포커스 이동(첫 포커서블).
  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const patch = (next: Partial<PresetFilterState>) => onChange({ ...filter, ...next });

  const toggleFrequency = (frequency: Frequency) => {
    const has = filter.frequencies.includes(frequency);
    patch({
      frequencies: has
        ? filter.frequencies.filter((value) => value !== frequency)
        : [...filter.frequencies, frequency]
    });
  };

  const reset = () => onChange(createInitialFilterState(ranges));

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      // window(모달) keydown 까지 native 전파를 끊어 ESC 한 번에 모달이 닫히는 걸 막는다.
      event.nativeEvent.stopPropagation();
      onClose();
      return;
    }

    if (event.key !== 'Tab') return;
    const root = drawerRef.current;
    if (!root) return;
    const focusables = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <Scrim onClick={onClose} />
      <Drawer
        ref={drawerRef}
        id={drawerId}
        role="dialog"
        aria-modal="true"
        aria-label="프리셋 필터"
        onKeyDown={onKeyDown}
      >
        <DrawerHeader>
          <DrawerTitle>필터</DrawerTitle>
          <DrawerCloseButton ref={closeButtonRef} type="button" aria-label="필터 닫기" onClick={onClose}>
            <X size={18} aria-hidden focusable={false} />
          </DrawerCloseButton>
        </DrawerHeader>

        <DrawerBody>
          <RangeSlider
            label="배당률"
            min={0}
            max={DIVIDEND_YIELD_CAP}
            step={0.5}
            valueMin={filter.dyMin}
            valueMax={filter.dyMax}
            onChange={(dyMin, dyMax) => patch({ dyMin, dyMax })}
            formatValue={formatDividendUpper}
          />

          <Field>
            <FieldLabel id={`${drawerId}-frequency`}>지급 주기</FieldLabel>
            <FrequencyRow role="group" aria-labelledby={`${drawerId}-frequency`}>
              {FREQUENCY_OPTIONS.map((option) => {
                const active = filter.frequencies.includes(option.value);
                return (
                  <FrequencyChip
                    key={option.value}
                    type="button"
                    active={active}
                    aria-pressed={active}
                    onClick={() => toggleFrequency(option.value)}
                  >
                    {option.label}
                  </FrequencyChip>
                );
              })}
            </FrequencyRow>
          </Field>

          <RangeSlider
            label="현재 주가"
            unit="$"
            min={ranges.priceMin}
            max={ranges.priceMax}
            step={1}
            valueMin={filter.priceMin}
            valueMax={filter.priceMax}
            onChange={(priceMin, priceMax) => patch({ priceMin, priceMax })}
          />

          <RangeSlider
            label="기대총수익률"
            min={0}
            max={EXPECTED_TOTAL_RETURN_CAP}
            step={0.5}
            valueMin={filter.etrMin}
            valueMax={filter.etrMax}
            onChange={(etrMin, etrMax) => patch({ etrMin, etrMax })}
            formatValue={formatReturnUpper}
          />
        </DrawerBody>

        <DrawerFooter>
          <FooterInfoRow>
            {resultCount > 0 ? (
              <ResultCount aria-live="polite">결과 {resultCount}개</ResultCount>
            ) : (
              <EmptyNote aria-live="polite">
                조건에 맞는 티커가 없어요. 필터를 완화하거나 초기화해 주세요.
              </EmptyNote>
            )}
            <ResetButton type="button" onClick={reset}>
              필터 초기화
            </ResetButton>
          </FooterInfoRow>
          <Button variant="primary" fullWidth type="button" onClick={onClose}>
            {resultCount > 0 ? `결과 ${resultCount}개 보기` : '닫기'}
          </Button>
        </DrawerFooter>
      </Drawer>
    </>
  );
}
