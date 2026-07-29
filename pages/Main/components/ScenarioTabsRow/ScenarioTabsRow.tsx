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
  onToggleCompact
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
      {/* 결과 밀도 토글은 "결과가 있을 때"만 의미가 있다.
          (이미지 저장 버튼은 2026-07-29 에 히어로의 "투자 설정" 우측으로 옮겼다 — `SimulatorHero`) */}
      {showCompactToggle ? (
        <RowActions>
          <CompactToggleSlot>
            {/* 두 줄 표기 — 이 줄은 탭 스트립과 가로를 나눠 쓰는 자리라 폭이 가장 먼저 모자란다.
                라벨을 위로 올리면 `라벨 + gap + 스위치` 대신 둘 중 넓은 쪽 폭만 쓴다. */}
            <ToggleField
              label="간략히"
              accessibleName="결과 간략히 보기"
              stacked
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
