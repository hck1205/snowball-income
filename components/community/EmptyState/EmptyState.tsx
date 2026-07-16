import type { ReactNode } from 'react';
import { EmptyIcon, EmptyRoot, EmptySubtitle, EmptyTitle } from './EmptyState.styled';

export type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

/**
 * 빈 상태 / 검색 무결과 / 404를 공통으로 그리는 중앙 정렬 카드.
 * (에러는 `Banner tone="danger"`를 쓴다 — role=alert 구분)
 */
export default function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <EmptyRoot>
      {icon ? <EmptyIcon aria-hidden="true">{icon}</EmptyIcon> : null}
      <EmptyTitle>{title}</EmptyTitle>
      {subtitle ? <EmptySubtitle>{subtitle}</EmptySubtitle> : null}
      {action}
    </EmptyRoot>
  );
}
