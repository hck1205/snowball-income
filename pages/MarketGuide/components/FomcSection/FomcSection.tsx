import { useMemo } from 'react';
import { Landmark } from 'lucide-react';
import { PageHero } from '@/components/common';
import { buildFomcGuide } from '@/shared/lib/marketGuide';
import { MARKET_GUIDE_COPY } from '../../copy';
import { DateBadge } from '../DateBadge';
import { Badge, Footnotes, List, Note, Row, RowMain, RowSide, RowSub, RowTitle, SideValue } from '../GuideList';
import { buildFomcRowViews } from './FomcSection.utils';

const copy = MARKET_GUIDE_COPY.fomc;

export type FomcSectionProps = {
  readonly today: Date;
};

/** `/market/fomc` — 공시된 FOMC 회의와 성명 발표 한국시각. */
export default function FomcSection({ today }: FomcSectionProps) {
  const rows = useMemo(() => buildFomcRowViews(buildFomcGuide(today)), [today]);
  return (
    <>
      <PageHero title={copy.heroTitle} titleAs="h1" lede={copy.lede} icon={<Landmark aria-hidden />} />
      <List aria-label={copy.tableCaption}>
        {rows.map((row) => (
          <Row key={row.key} state={row.state}>
            <DateBadge date={row.date} />
            <RowMain>
              <RowTitle>{row.title}</RowTitle>
              <RowSub>{row.meeting}</RowSub>
            </RowMain>
            <RowSide>
              {row.state === 'next' ? <Badge tone="brand">다음 회의</Badge> : row.state === 'past' ? <Badge tone="muted">지남</Badge> : null}
              <SideValue>{row.kstLabel}</SideValue>
              <RowSub>한국시간</RowSub>
            </RowSide>
          </Row>
        ))}
      </List>
      <Footnotes>
        <Note>{copy.projectionsNote}</Note>
        <Note>{copy.nextYearNote}</Note>
        <Note>{copy.source}</Note>
      </Footnotes>
    </>
  );
}
