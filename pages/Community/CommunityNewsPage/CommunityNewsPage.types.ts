import type { UseNewsResult } from './hooks';

export type CommunityNewsViewModel = UseNewsResult & {
  /**
   * 이 사용자가 링크를 공유(작성)할 수 있는가 — 컨테이너가 `canWriteCommunityNews` 로 판정한다.
   * false 면 뷰가 공유 진입점(머리 면 버튼·빈 상태 CTA)을 **그리지 않는다**.
   * ⚠ 로그인 여부와는 다른 축이다. 비로그인은 눌러서 로그인 유도 모달을 여는 것이 정상 흐름이고,
   *   이 값은 "로그인해도 못 쓴다"를 뜻한다(2026-08-08 운영자 전용 결정).
   */
  canWrite: boolean;
  /** 링크 공유 화면으로. 비로그인이면 로그인 유도 모달을 연다(컨테이너가 판단). */
  onWrite: () => void;
};

export type CommunityNewsViewProps = { viewModel: CommunityNewsViewModel };
