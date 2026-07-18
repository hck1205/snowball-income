export type MainLeftPanelProps = {
  /**
   * IndexedDB 하이드레이션 완료 여부를 상위(Main.view)로 올린다.
   *
   * 하이드레이션 트리거(usePortfolioPersistence의 hydrate effect)와 클라우드 동기화는
   * 이 컴포넌트 안에 사는데, 우패널 결과도 같은 atom 하이드레이션에 깜빡인다. 우패널을
   * 게이트하려면 신호가 위로 올라가야 하므로 콜백으로 끌어올려 좌·우를 함께 홀딩한다.
   * (전역 atom 신설 대신 pages/Main 로컬 신호로 처리 — 클라우드/영속 트랙과 충돌 방지.)
   */
  onHydratedChange: (hydrated: boolean) => void;
  /**
   * 클라우드 저장 재시도 함수를 상위(Main.view)에 등록한다 — 헤더의 CloudSyncIndicator가 호출한다.
   * usePortfolioPersistence(retryCloudSave)는 리렌더 회귀 방지를 위해 이 컴포넌트가 계속 소유하므로,
   * 훅을 hoist하는 대신 안정적인 register 콜백으로 함수 참조만 위로 넘긴다(ref 대입, setState 아님).
   */
  onRegisterRetryCloudSave: (retry: (() => void) | null) => void;
};
