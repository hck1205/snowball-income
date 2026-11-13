import { useMemo } from 'react';
import { CalendarRange } from 'lucide-react';
import { PageHero } from '@/components/common';
import { buildWeekGuide, weekGuideCoverage } from '@/shared/lib/marketGuide';
import { MARKET_GUIDE_COPY } from '../../copy';
import { Badge, Footnotes, List, Note } from '../GuideList';
import { DayCount, DayGroup, DayHead, Emphasis, EventLabel, EventRow, EventTime } from './WeekSection.styled';
import { groupWeekRowsByDate, WEEK_KIND_TONE } from './WeekSection.utils';

const copy = MARKET_GUIDE_COPY.week;

export type WeekSectionProps = {
  readonly today: Date;
};

/** `/market/this-week` — 오늘부터 7일의 휴장 · FOMC · 지표 · 실적을 날짜별로. */
export default function WeekSection({ today }: WeekSectionProps) {
  const days = useMemo(() => groupWeekRowsByDate(buildWeekGuide(today)), [today]);
  const coverage = useMemo(() => weekGuideCoverage(today), [today]);

  return (
    <>
      <PageHero title={copy.heroTitle} titleAs="h1" lede={copy.lede} icon={<CalendarRange aria-hidden />} />
      {days.length === 0 ? <Note>{copy.empty}</Note> : null}
      {days.map((day) => (
        <DayGroup key={day.date} aria-labelledby={`day-${day.date}`}>
          <DayHead id={`day-${day.date}`}>
            {day.dateLabel}
            <DayCount>{day.items.length}건</DayCount>
          </DayHead>
          <List>
            {day.items.map((item) => (
              <EventRow key={`${item.kind}-${item.label}`}>
                <EventTime>{item.kstLabel}</EventTime>
                <Badge tone={WEEK_KIND_TONE[item.kind]}>{item.kind}</Badge>
                <EventLabel>{item.major ? <Emphasis>{item.label}</Emphasis> : item.label}</EventLabel>
              </EventRow>
            ))}
          </List>
        </DayGroup>
      ))}
      <Footnotes>
        {coverage.covered ? null : <Note>{copy.stale(coverage.generatedAt)}</Note>}
        <Note>{copy.source}</Note>
      </Footnotes>
    </>
  );
}
