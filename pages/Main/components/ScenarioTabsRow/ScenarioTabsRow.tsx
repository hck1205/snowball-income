import { memo, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { ToggleField } from '@/components';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import type { ScenarioTabsRowProps } from './ScenarioTabsRow.types';
import { CompactToggleSlot, RowActions, TabsRowRoot } from './ScenarioTabsRow.styled';

/**
 * 결과 그리드 **위**의 컨트롤 줄. 시나리오 전환(탭)과 결과 밀도(간략히)는 둘 다 "그리드 전체에
 * 걸리는 조작"이라 개별 카드가 아니라 여기 모인다 — 구 결과 카드 헤더에 있던 토글의 새 집이다.
 */
function ScenarioTabsRowComponent({
  children,
  showCompactToggle,
  isResultCompact,
  onToggleCompact,
  captureAction
}: ScenarioTabsRowProps) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      trackEvent(ANALYTICS_EVENT.TOGGLE_CHANGED, {
        field_name: 'isResultCompact',
        value: event.target.checked
      });
      onToggleCompact(event.target.checked);
    },
    [onToggleCompact]
  );

  return (
    <TabsRowRoot>
      {children}
      {/* 캡처 버튼도 "결과가 있을 때"만 의미가 있다 — 토글과 같은 조건으로 함께 서고 함께 사라진다. */}
      {showCompactToggle ? (
        <RowActions>
          {captureAction}
          <CompactToggleSlot>
            <ToggleField
              label="간략히"
              accessibleName="결과 간략히 보기"
              checked={isResultCompact}
              onChange={handleChange}
            />
          </CompactToggleSlot>
        </RowActions>
      ) : null}
    </TabsRowRoot>
  );
}

const ScenarioTabsRow = memo(ScenarioTabsRowComponent);

export default ScenarioTabsRow;
