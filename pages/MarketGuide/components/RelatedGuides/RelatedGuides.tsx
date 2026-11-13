import { CalendarDays, CalendarRange, Landmark, Sun } from 'lucide-react';
import { PickCard, PickCardGrid } from '@/components/common';
import { MARKET_GUIDE_COPY } from '../../copy';
import { RelatedSection, SectionTitle } from './RelatedGuides.styled';
import { relatedGuidesFor, type RelatedGuideIcon } from './RelatedGuides.utils';

const GLYPH: Record<RelatedGuideIcon, JSX.Element> = {
  week: <CalendarRange aria-hidden />,
  fomc: <Landmark aria-hidden />,
  holidays: <Sun aria-hidden />,
  calendar: <CalendarDays aria-hidden />
};

export type RelatedGuidesProps = {
  /** 지금 지면의 경로 — 목록에서 뺀다. */
  readonly currentPath: string;
};

/** 안내 지면 아래의 "다른 일정" 카드 — 지면끼리 서로 잇는 내부 링크(색인용). */
export default function RelatedGuides({ currentPath }: RelatedGuidesProps) {
  return (
    <RelatedSection aria-labelledby="market-guide-related">
      <SectionTitle id="market-guide-related">{MARKET_GUIDE_COPY.related}</SectionTitle>
      <PickCardGrid as="ul" minColumnWidth="240px">
        {relatedGuidesFor(currentPath).map((item) => (
          <PickCard
            key={item.to}
            as="li"
            titleAs="h3"
            title={item.title}
            to={item.to}
            cap={{ kind: 'rail', axis: 'brand', glyph: GLYPH[item.icon], glyphInline: true }}
          >
            {item.description}
          </PickCard>
        ))}
      </PickCardGrid>
    </RelatedSection>
  );
}
