import type { CardProps } from './Card.types';
import { resolveCardTitle } from './Card.utils';
import { CardContainer, CardHeader, CardSubtitle, CardTitle, CardTitleGroup } from './Card.styled';

export default function Card({
  title,
  titleRight,
  titleRightInline,
  subtitle,
  elevation = 1,
  dataTour,
  children
}: CardProps) {
  const resolvedTitle = resolveCardTitle(title);
  const showHeader = Boolean(resolvedTitle || titleRight);

  return (
    <CardContainer elevation={elevation} data-tour={dataTour}>
      {showHeader ? (
        <CardHeader inlineTitleRight={titleRightInline}>
          {resolvedTitle ? (
            <CardTitleGroup>
              <CardTitle>{resolvedTitle}</CardTitle>
              {subtitle ? <CardSubtitle>{subtitle}</CardSubtitle> : null}
            </CardTitleGroup>
          ) : (
            // 제목 없이 titleRight만 있는 경우, space-between 정렬을 유지하기 위한 자리지킴이.
            <span />
          )}
          {titleRight}
        </CardHeader>
      ) : null}
      {children}
    </CardContainer>
  );
}
