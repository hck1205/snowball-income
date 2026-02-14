import type { CardProps } from './component.types';
import { resolveCardTitle } from './component.utils';
import { CardContainer, CardTitle } from './component.styled';

export default function Card({ title, children }: CardProps) {
  const resolvedTitle = resolveCardTitle(title);

  return (
    <CardContainer>
      {resolvedTitle ? <CardTitle>{resolvedTitle}</CardTitle> : null}
      {children}
    </CardContainer>
  );
}
