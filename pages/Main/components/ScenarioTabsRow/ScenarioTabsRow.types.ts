import type { ReactNode } from 'react';

export type ScenarioTabsRowProps = {
  /** 시나리오 탭 스트립. 이 래퍼는 배치와 밑줄만 소유한다. */
  children: ReactNode;
  /** 결과가 없으면 "간략히"는 조작할 대상이 없다 → 렌더하지 않는다. */
  showCompactToggle: boolean;
  isResultCompact: boolean;
  onToggleCompact: (checked: boolean) => void;
};
