import type { PortfolioSimulationPrefill } from '@/shared/constants';

export type PortfolioPrefillRequestProps = {
  /**
   * 검증을 통과한 프리필(초기 투자금 + 비중)을 시뮬레이터에 커밋한다.
   *
   * 커밋은 반드시 **기존 경로**(시나리오 탭 API + `setTickerProfiles`류 + `setField`)로만 한다 —
   * 사용자가 손으로 조작한 것과 같은 경로여야 자동저장·클라우드 동기화·계측이 그대로 따라온다.
   * **하이드레이션이 끝난 뒤에만** 불려야 하므로 이 컴포넌트의 마운트 위치가 계약의 일부다
   * (`TargetFocusRequest` 주석 참고 — `MainRightPanel` 밖으로 올리지 말 것).
   */
  onApplyPrefill: (prefill: PortfolioSimulationPrefill) => void;
};
