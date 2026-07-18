export type CloudSyncIndicatorVariant = 'badge' | 'inline' | 'header';

export type CloudSyncIndicatorProps = {
  /**
   * badge  — 버튼 모서리 상태 점(짧은 라벨은 시각적 숨김, 색만으로 구분하지 않기 위한 텍스트 병기).
   * inline — 패널 헤더 문장(aria-live로 상태 변화를 알림) + 실패 시 재시도 버튼.
   * header — 앱 헤더 액션 줄에 얹는 컴팩트 표시(아이콘 + aria-live). idle은 렌더하지 않고, 실패
   *          상태에서만 라벨과 재시도 버튼을 노출해 "저장 실패"가 로그인 사용자에게 반드시 보이게 한다.
   */
  variant: CloudSyncIndicatorVariant;
  /** inline·header·실패 상태에서만 쓰인다 — 마지막 payload를 다시 클라우드로 밀어넣는다. */
  onRetry?: () => void;
};
