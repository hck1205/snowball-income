import { memo } from 'react';
import type { ScenarioTabsRowProps } from './ScenarioTabsRow.types';
import { TabsRowRoot } from './ScenarioTabsRow.styled';

/**
 * 결과 그리드 **위**의 컨트롤 줄 — 지금은 시나리오 탭 스트립만 담는다.
 *
 * 한때 여기에 "간략히" 토글과 "이미지 저장" 버튼이 함께 있었다. 둘 다 탭 스트립과 **가로를
 * 나눠 쓰는** 자리라 좁은 폭에서 이 줄이 가장 먼저 눌렸고(390px 에서 탭이 ~169px 로 압축),
 * 2026-07-29 에 각자 더 맞는 곳으로 옮겼다:
 *
 *  - "간략히" → **결과 요약 카드 우측 상단**(`ResultSummaryCard` 의 `densityToggle`).
 *    이 토글이 바꾸는 숫자가 가장 크게 보이는 카드라 조작과 결과가 한눈에 들어온다.
 *  - "이미지 저장" → **히어로 제목 줄**(`SimulatorHero` 의 `titleAction`).
 *
 * 이 래퍼는 배치와 밑줄만 소유한다 — 상태도 계측도 갖지 않는다.
 */
function ScenarioTabsRowComponent({ children }: ScenarioTabsRowProps) {
  return <TabsRowRoot>{children}</TabsRowRoot>;
}

const ScenarioTabsRow = memo(ScenarioTabsRowComponent);

export default ScenarioTabsRow;
