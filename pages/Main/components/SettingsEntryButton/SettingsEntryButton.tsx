import { memo } from 'react';
import { Settings } from 'lucide-react';
import { SIMULATOR_COPY } from '@/shared/constants';
// 마커 상수만 — `interaction` 배럴은 html2canvas 를 정적으로 끌고 오지 않는다(동적 import 뿐).
import { CAPTURE_EXCLUDE_ATTRIBUTE } from '@/pages/Main/hooks/interaction';
import type { SettingsEntryButtonProps } from './SettingsEntryButton.types';
import { SettingsEntry } from './SettingsEntryButton.styled';

/**
 * 설정 드로어를 여는 **유일한 버튼 컴포넌트**. 자리(variant)마다 크기·톤·라벨만 다르고
 * `aria-controls`/`aria-expanded` 계약은 둘이 공유한다 — 두 곳에 손으로 복제하면 한 곳이
 * 조용히 계약을 잃는다(그게 이 컴포넌트가 존재하는 이유다).
 */
function SettingsEntryButtonComponent({
  variant,
  drawerId,
  isOpen,
  onOpen,
  dataTour,
  iconOnly
}: SettingsEntryButtonProps) {
  const shared = {
    'aria-controls': drawerId,
    'aria-expanded': isOpen,
    'data-tour': dataTour,
    onClick: onOpen
  };

  if (variant === 'hero') {
    /*
     * 고정된 상태의 축약형 — 톱니만 남는다. **같은 버튼 하나**이고(요소 교체가 아니라 자식 교체),
     * `aria-label` 로 접근성 이름을 그대로 들고 간다: 라벨과 이름이 같은 상수를 쓰므로 축약 여부와
     * 무관하게 스크린리더·테스트가 찾는 이름("투자 설정")이 변하지 않는다.
     */
    if (iconOnly) {
      return (
        <SettingsEntry {...shared} variant="primary" iconOnly aria-label={SIMULATOR_COPY.settingsTitle}>
          <Settings size={16} strokeWidth={1.8} aria-hidden focusable={false} />
        </SettingsEntry>
      );
    }

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
    /*
     * inline 변형은 결과 요약 카드 안(조건 스트립)에 산다 — 결과를 **이미지로 저장**할 때는
     * 빠져야 한다. 저장된 그림 속 "조건 수정" 버튼은 누를 수 없는 미끼가 된다.
     */
    <SettingsEntry {...shared} {...{ [CAPTURE_EXCLUDE_ATTRIBUTE]: '' }} variant="ghost" size="sm">
      {SIMULATOR_COPY.editCondition}
    </SettingsEntry>
  );
}

const SettingsEntryButton = memo(SettingsEntryButtonComponent);

export default SettingsEntryButton;
