import type { CardProps } from './Card.types';
import { resolveCardTitle } from './Card.utils';
import { CardContainer, CardHeader, CardTitle } from './Card.styled';

export default function Card({ title, titleRight, children }: CardProps) {
  const resolvedTitle = resolveCardTitle(title);
  const showHeader = Boolean(resolvedTitle || titleRight);

  return (
    <CardContainer>
      {showHeader ? (
        <CardHeader>
          {resolvedTitle ? <CardTitle>{resolvedTitle}</CardTitle> : <span />}
          {titleRight}
        </CardHeader>
      ) : null}
      {children}
    </CardContainer>
  );
}
