import type { UseNewsResult } from './hooks';

export type CommunityNewsViewModel = UseNewsResult & {
  /** 링크 공유 화면으로. 비로그인이면 로그인 유도 모달을 연다(컨테이너가 판단). */
  onWrite: () => void;
};

export type CommunityNewsViewProps = { viewModel: CommunityNewsViewModel };
