import { memo } from 'react';
import { Settings } from 'lucide-react';
import { SIMULATOR_COPY } from '@/shared/constants';
import type { SettingsEntryButtonProps } from './SettingsEntryButton.types';
import { SettingsEntry, SettingsEntryLabel } from './SettingsEntryButton.styled';

/**
 * 설정 드로어를 여는 **유일한 버튼 컴포넌트**. 자리(variant)마다 크기·톤·라벨만 다르고
 * `aria-controls`/`aria-expanded` 계약은 셋이 공유한다 — 세 곳에 손으로 복제하면 한 곳이
 * 조용히 계약을 잃는다(그게 이 컴포넌트가 존재하는 이유다).
 */
function SettingsEntryButtonComponent({ variant, drawerId, isOpen, onOpen, dataTour }: SettingsEntryButtonProps) {
  const shared = {
    'aria-controls': drawerId,
    'aria-expanded': isOpen,
    'data-tour': dataTour,
    onClick: onOpen
  };

  if (variant === 'header') {
    return (
      <SettingsEntry
        {...shared}
        variant="secondary"
        size="sm"
        /* 좁은 폭에서 라벨이 시각적으로 접히므로 접근명을 명시해 고정한다. */
        aria-label={SIMULATOR_COPY.settingsOpen}
        startIcon={<Settings size={16} strokeWidth={1.8} aria-hidden focusable={false} />}
      >
        <SettingsEntryLabel>{SIMULATOR_COPY.settingsOpen}</SettingsEntryLabel>
      </SettingsEntry>
    );
  }

  if (variant === 'hero') {
    return (
      <SettingsEntry
        {...shared}
        variant="primary"
        startIcon={<Settings size={16} strokeWidth={1.8} aria-hidden focusable={false} />}
      >
        {SIMULATOR_COPY.settingsTitle}
      </SettingsEntry>
    );
  }

  return (
    <SettingsEntry {...shared} variant="ghost" size="sm">
      {SIMULATOR_COPY.editCondition}
    </SettingsEntry>
  );
}

const SettingsEntryButton = memo(SettingsEntryButtonComponent);

export default SettingsEntryButton;
