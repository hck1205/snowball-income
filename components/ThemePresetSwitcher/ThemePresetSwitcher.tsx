import { memo, useCallback, useEffect, useId, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';
// per-icon named import(트리셰이킹) — 엔트리에는 Palette/Check 두 아이콘만 실린다(CommunityNavLink와 동일 패턴).
import { Check, Palette } from 'lucide-react';
import { PALETTE_PRESET_IDS } from '@/shared/constants';
import type { PalettePresetId } from '@/shared/constants';
import { THEME_PRESETS } from '@/shared/styles';
import { usePalettePresetAtomValue, useSetPalettePresetWrite } from '@/jotai';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { Button } from '@/components/common';
import type { ThemePresetSwitcherProps } from './ThemePresetSwitcher.types';
import {
  CheckSlot,
  DrawerInlineSlot,
  HeaderPopoverRoot,
  OptionButton,
  OptionLabel,
  Popover,
  RadioGroupBox,
  SwatchDot,
  SwatchStack,
  TriggerIconWrap,
  TriggerSwatchDot
} from './ThemePresetSwitcher.styled';

/**
 * 테마 프리셋 스위처.
 *
 * - 선택 = 즉시 적용. 별도 미리보기/확정 단계가 없다 — 즉시 전환(CSS 변수 갈아끼움)이 곧 미리보기다.
 *   실제 반영(html[data-palette]·localStorage·차트 리빌드)은 atom 계층이 담당하므로
 *   이 컴포넌트는 `palettePresetAtom`만 읽고 쓴다(DOM 조작 없음).
 * - radiogroup + roving tabindex: 선택 항목만 tabIndex=0, ↑↓←→로 포커스 이동,
 *   Space/Enter(버튼 네이티브 클릭)로 선택.
 * - 스와치 hex는 레지스트리의 고정 대표색이라 토큰이 아닌 style prop으로 주입한다.
 */

/**
 * 포커스 이동 + 스크롤 추적. 팝오버가 스크롤 컨테이너라(8종, 스펙 §3) 포커스된 옵션이
 * 잘려 보이지 않게 한다. jsdom에는 scrollIntoView가 없으므로 옵셔널 호출로 가드한다.
 */
const focusOption = (el: HTMLButtonElement | null | undefined) => {
  el?.focus();
  el?.scrollIntoView?.({ block: 'nearest' });
};

function PresetRadioGroup({ columns = 1 }: { columns?: 1 | 2 }) {
  const palette = usePalettePresetAtomValue();
  const setPalette = useSetPalettePresetWrite();
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const select = useCallback(
    (id: PalettePresetId) => {
      if (id === palette) return;
      setPalette(id);
      trackEvent(ANALYTICS_EVENT.THEME_PRESET_CHANGED, { preset_id: id });
    },
    [palette, setPalette]
  );

  /** 스펙 §7.2: 화살표는 포커스만 옮기고(순환), 선택은 Space/Enter(네이티브 클릭)가 한다. */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const direction =
        event.key === 'ArrowDown' || event.key === 'ArrowRight'
          ? 1
          : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
            ? -1
            : 0;
      if (direction === 0) return;

      event.preventDefault();
      const focusedIndex = optionRefs.current.findIndex((el) => el === document.activeElement);
      const baseIndex = focusedIndex >= 0 ? focusedIndex : PALETTE_PRESET_IDS.indexOf(palette);
      const nextIndex = (baseIndex + direction + PALETTE_PRESET_IDS.length) % PALETTE_PRESET_IDS.length;
      focusOption(optionRefs.current[nextIndex]);
    },
    [palette]
  );

  return (
    <RadioGroupBox role="radiogroup" aria-label="테마 프리셋" columns={columns} onKeyDown={handleKeyDown}>
      {PALETTE_PRESET_IDS.map((id, index) => {
        const preset = THEME_PRESETS[id];
        const selected = id === palette;

        return (
          <OptionButton
            key={id}
            ref={(el) => {
              optionRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => select(id)}
          >
            <SwatchStack aria-hidden="true">
              {/* key는 위치 기반 — 스와치는 고정 3칸 튜플이라 재배열이 없고, 같은 hex가 중복될 수 있다. */}
              {preset.swatch.map((hex, swatchIndex) => (
                <SwatchDot key={swatchIndex} style={{ backgroundColor: hex }} />
              ))}
            </SwatchStack>
            <OptionLabel>{preset.label}</OptionLabel>
            {/* 선택 표시는 색만이 아니라 ✓ 형태로도 전달한다. 상태 자체는 aria-checked가 말한다. */}
            <CheckSlot aria-hidden="true">
              {selected ? <Check strokeWidth={2.4} focusable={false} /> : null}
            </CheckSlot>
          </OptionButton>
        );
      })}
    </RadioGroupBox>
  );
}

function HeaderPopoverSwitcher() {
  const palette = usePalettePresetAtomValue();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  /** 열리면 선택된 라디오로 포커스 이동(+스크롤 추적) → 화살표 키가 즉시 동작하고, 스크롤 팝오버에서도 선택 항목이 보인다. */
  useEffect(() => {
    if (!isOpen) return;
    focusOption(rootRef.current?.querySelector<HTMLButtonElement>('[role="radio"][aria-checked="true"]'));
  }, [isOpen]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  /** 포커스 트랩은 두지 않는다(모달이 아닌 팝오버) — Tab이 밖으로 나가면 그냥 닫는다. */
  const handleBlur = useCallback((event: FocusEvent<HTMLDivElement>) => {
    if (event.relatedTarget && rootRef.current?.contains(event.relatedTarget as Node)) return;
    setIsOpen(false);
  }, []);

  const currentLabel = THEME_PRESETS[palette].label;

  return (
    <HeaderPopoverRoot ref={rootRef} onKeyDown={handleKeyDown} onBlur={handleBlur}>
      <Button
        ref={triggerRef}
        // 헤더 형제(커뮤니티·튜토리얼)와 같은 secondary 스타일의 네모 아이콘 버튼(iconOnly=정사각). 라벨이 없는
        // 팔레트 트리거라 아이콘만 두고, 크기는 형제와 동일한 sm 으로 맞춘다(맨 우측 정렬).
        variant="secondary"
        size="sm"
        iconOnly
        aria-label={`테마 프리셋 선택 (현재: ${currentLabel})`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={isOpen ? popoverId : undefined}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <TriggerIconWrap>
          <Palette size={16} strokeWidth={1.8} aria-hidden focusable={false} />
          {/* 현재 프리셋의 시그니처 색 점 — 상태 암시용 장식. 상태 자체는 aria-label이 말한다. */}
          <TriggerSwatchDot aria-hidden="true" style={{ backgroundColor: THEME_PRESETS[palette].swatch[1] }} />
        </TriggerIconWrap>
      </Button>
      {isOpen ? (
        <Popover id={popoverId}>
          <PresetRadioGroup />
        </Popover>
      ) : null}
    </HeaderPopoverRoot>
  );
}

function ThemePresetSwitcherComponent({ variant = 'popover' }: ThemePresetSwitcherProps) {
  if (variant === 'inline') {
    return (
      <DrawerInlineSlot>
        {/* 드로어는 2열 그리드(공간 절약, 스펙 §3) — 순회는 여전히 DOM 순서 선형. */}
        <PresetRadioGroup columns={2} />
      </DrawerInlineSlot>
    );
  }

  if (variant === 'menu') {
    // 프로필 드롭다운 안 인라인 노출 — 팝오버/드로어 래퍼 없이 radiogroup만.
    // 여백·스크롤은 호출부(AuthControl ThemePanel)가 소유한다.
    return <PresetRadioGroup />;
  }

  return <HeaderPopoverSwitcher />;
}

const ThemePresetSwitcher = memo(ThemePresetSwitcherComponent);

export default ThemePresetSwitcher;
