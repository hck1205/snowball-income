import { useMemo } from 'react';
import { Sun } from 'lucide-react';
import { PageHero } from '@/components/common';
import { toCalendarDate } from '@/shared/constants/marketCalendar';
import { buildHolidayGuide } from '@/shared/lib/marketGuide';
import { MARKET_GUIDE_COPY } from '../../copy';
import { DateBadge } from '../DateBadge';
import { Badge, Footnotes, List, Note, Row, RowMain, RowSide, RowSub, RowTitle } from '../GuideList';
import { buildHolidayRowViews } from './HolidaysSection.utils';

const copy = MARKET_GUIDE_COPY.holidays;

export type HolidaysSectionProps = {
  readonly year: number;
  readonly today: Date;
};

/** `/market/us-holidays/:year` — 그 해의 휴장일 · 조기 폐장일. */
export default function HolidaysSection({ year, today }: HolidaysSectionProps) {
  const rows = useMemo(() => buildHolidayRowViews(buildHolidayGuide(year), toCalendarDate(today)), [year, today]);
  return (
    <>
      <PageHero title={copy.heroTitle(year)} titleAs="h1" lede={copy.lede(year)} icon={<Sun aria-hidden />} />
      <List aria-label={copy.tableCaption(year)}>
        {rows.map((row) => (
          <Row key={row.key} state={row.state}>
            <DateBadge date={row.date} />
            <RowMain>
              <RowTitle>{row.title}</RowTitle>
              <RowSub>{row.sub}</RowSub>
            </RowMain>
            <RowSide>
              {row.state === 'next' ? <Badge tone="brand">다음 휴장</Badge> : null}
              {row.kind === 'holiday' ? <Badge tone="warn">종일 휴장</Badge> : <Badge tone="alt">조기 폐장</Badge>}
            </RowSide>
          </Row>
        ))}
      </List>
      <Footnotes>
        <Note>{copy.source}</Note>
      </Footnotes>
    </>
  );
}
