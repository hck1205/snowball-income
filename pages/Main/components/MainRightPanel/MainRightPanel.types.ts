export type MainRightPanelProps = {
  /**
   * 설정 드로어 패널의 id. 조건 스트립의 "조건 수정" 버튼이 `aria-controls` 로 맺는다 —
   * 버튼과 패널이 다른 서브트리라 공통 조상(`Main.view`)의 `useId` 값을 받아 내려온다.
   */
  configDrawerId: string;
};
