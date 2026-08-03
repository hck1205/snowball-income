import type { ReactNode } from 'react';

export type FeedEmptyProps = {
  title: string;
  subtitle?: string;
  /** 빈 상태의 유일한 출구. 제목과 **같은 부모** 안에 서므로 화면 안에서 함께 읽힌다. */
  action?: ReactNode;
  /** 마스코트 대신 세울 아이콘. 생략하면 브랜드 글리프가 선다(브랜드 면에만 허용). */
  mark?: ReactNode;
};

export type FeedErrorProps = {
  title: string;
  body: string;
  retryLabel: string;
  onRetry: () => void;
};

export type FeedTailProps = {
  /** 다음 페이지 요청 중. */
  isLoadingMore: boolean;
  /** 더 불러오기 실패 — 그 자리에서 다시 시도한다. */
  loadMoreError: boolean;
  /** 마지막 페이지. 종료 표시로 목록을 닫는다. */
  reachedEnd: boolean;
  loadingLabel: string;
  endLabel: string;
  errorLabel: string;
  retryLabel: string;
  onRetry: () => void;
};

export type FeedSkeletonProps = {
  /** 몇 장을 깔 것인가. 첫 화면을 대략 채우는 수. */
  count?: number;
};
