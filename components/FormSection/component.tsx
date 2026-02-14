import type { FormSectionProps } from './component.types';
import { normalizeSectionTitle } from './component.utils';
import { Section, SectionTitle } from './component.styled';

export default function FormSection({ title, children }: FormSectionProps) {
  return (
    <Section>
      <SectionTitle>{normalizeSectionTitle(title)}</SectionTitle>
      {children}
    </Section>
  );
}
