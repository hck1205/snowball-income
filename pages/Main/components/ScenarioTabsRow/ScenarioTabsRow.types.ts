import type { ReactNode } from 'react';

export type ScenarioTabsRowProps = {
  /** 시나리오 탭 스트립. 이 래퍼는 배치와 밑줄만 소유한다. */
  children: ReactNode;
  /** 결과가 없으면 "간략히"는 조작할 대상이 없다 → 렌더하지 않는다. */
  showCompactToggle: boolean;
  isResultCompact: boolean;
  onToggleCompact: (checked: boolean) => void;
  /**
   * "간략히" **왼쪽**에 서는 액션 슬롯(이미지 저장). 노드로 받는 이유: 이 줄은 배치만 소유하고
   * 캡처 상태·계측은 그 부품이 갖는다(여기서 훅을 부르면 탭 줄이 캡처 상태마다 리렌더된다).
   */
  captureAction?: ReactNode;
};
