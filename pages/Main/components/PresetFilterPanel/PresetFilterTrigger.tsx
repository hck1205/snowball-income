import { forwardRef } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import type { PresetFilterTriggerProps } from './PresetFilterPanel.types';
import { Badge, PresetFilterTriggerButton } from './PresetFilterPanel.styled';

/**
 * 검색 입력 우측에 겹쳐 앉는 필터 트리거. 앱 전체에서 `aria-expanded` 를 가진
 * 유일한 버튼이라(드로어 내부 어떤 버튼에도 aria-expanded 금지) 테스트가 상태로 지목한다.
 * 닫을 때 포커스를 여기로 되돌리기 위해 ref 를 노출한다.
 */
const PresetFilterTrigger = forwardRef<HTMLButtonElement, PresetFilterTriggerProps>(
  ({ isOpen, activeCount, drawerId, onToggle }, ref) => {
    const isActive = activeCount > 0;
    return (
      <PresetFilterTriggerButton
        ref={ref}
        type="button"
        isActive={isActive}
        isOpen={isOpen}
        aria-label={isActive ? `필터, ${activeCount}개 적용 중` : '필터'}
        aria-expanded={isOpen}
        aria-controls={drawerId}
        aria-haspopup="dialog"
        onClick={onToggle}
      >
        <SlidersHorizontal size={16} aria-hidden focusable={false} />
        {isActive ? <Badge aria-label={`활성 필터 ${activeCount}개`}>{activeCount}</Badge> : null}
      </PresetFilterTriggerButton>
    );
  }
);

PresetFilterTrigger.displayName = 'PresetFilterTrigger';

export default PresetFilterTrigger;
