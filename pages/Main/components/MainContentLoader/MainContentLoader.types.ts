export type MainContentLoaderProps = {
  /** 로딩 상태를 읽어줄 접근성/시각 라벨. */
  label?: string;
  /**
   * 로더가 차지할 최소 높이. 하이드레이션 후 실제 콘텐츠(입력 폼·결과 카드)로 교체될 때
   * 레이아웃 시프트를 줄이려고 대략적인 패널 높이를 미리 예약한다.
   */
  minHeight?: string;
};
