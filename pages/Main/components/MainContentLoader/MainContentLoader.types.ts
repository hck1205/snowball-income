/**
 * `plain`  — 스피너 한 개. 형태를 미리 알 수 없는 자리(설정 패널)에 쓴다.
 * `result` — **결과 그리드 모양의 스켈레톤**. 곧 올 화면(요약 카드 → 차트 → 표)을 미리 그려
 *            "무엇이 오는지"를 기다리는 동안 말해 준다. 회전하는 원은 그 말을 못 한다.
 */
export type MainContentLoaderVariant = 'plain' | 'result';

export type MainContentLoaderProps = {
  /** 로딩 상태를 읽어줄 접근성/시각 라벨. */
  label?: string;
  /**
   * 로더가 차지할 최소 높이. 하이드레이션 후 실제 콘텐츠(입력 폼·결과 카드)로 교체될 때
   * 레이아웃 시프트를 줄이려고 대략적인 패널 높이를 미리 예약한다.
   */
  minHeight?: string;
  /** 기다리는 동안 무엇을 보여줄지. 기본 `plain`. */
  variant?: MainContentLoaderVariant;
};
