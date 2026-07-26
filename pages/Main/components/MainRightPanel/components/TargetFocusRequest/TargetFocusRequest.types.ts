export type TargetFocusRequestProps = {
  /**
   * 실려 온 목표 월배당(원, 검증 통과분)을 폼에 커밋한다 — 보통 `setField('targetMonthlyDividend', v)`.
   * **하이드레이션이 끝난 뒤에만** 불려야 하므로 이 컴포넌트의 마운트 위치가 계약의 일부다
   * (TargetFocusRequest.tsx 주석 참고).
   */
  onApplyTarget: (won: number) => void;
  /**
   * 목표 월배당 입력을 화면에 띄우고 포커스를 옮긴다(드로어 폭이면 드로어를 먼저 연다).
   * 계측은 **여기서 하지 않는다** — 사용자가 이 화면에서 버튼을 누른 게 아니라 다른 화면의 CTA가
   * 이미 계측된 채로 넘어온 것이라, 여기서 또 쏘면 CTA 클릭이 두 번 집계된다.
   * (값 커밋 쪽은 `setField`가 `investment_setting_changed`를 자동 발화한다 — 별개 지표.)
   */
  onFocusTarget: () => void;
};
