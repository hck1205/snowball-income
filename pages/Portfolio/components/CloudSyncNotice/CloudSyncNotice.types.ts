import type { PortfolioCloudStatus } from '../../hooks';

export type CloudSyncNoticeProps = {
  status: PortfolioCloudStatus;
  /** 커뮤니티(로그인) 자체가 꺼진 배포에서는 유도할 곳이 없으므로 아무 것도 그리지 않는다. */
  canSignIn: boolean;
  /** "클라우드 것으로 맞췄다" 안내를 닫는다. */
  onDismissApplied: () => void;
};
