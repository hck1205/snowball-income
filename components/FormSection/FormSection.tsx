import type { FormSectionProps } from './FormSection.types';
import { normalizeSectionTitle } from './FormSection.utils';
import { Section, SectionTitle } from './FormSection.styled';

export default function FormSection({ title, children }: FormSectionProps) {
  return (
    <Section>
      <SectionTitle>{normalizeSectionTitle(title)}</SectionTitle>
      {children}
    </Section>
  );
}
