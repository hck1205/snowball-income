import { useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { CalendarDays, CalendarRange, Landmark, Sun } from 'lucide-react';
import { DataTable, PageHero, PickCard, PickCardGrid } from '@/components/common';
import { TickerPageShell } from '@/pages/Ticker/components';
import { useDocumentMeta } from '@/pages/Ticker/hooks';
import {
  MARKET_FOMC_GUIDE_PATH,
  MARKET_HOLIDAY_GUIDE_YEARS,
  MARKET_WEEK_GUIDE_PATH,
  marketHolidayGuidePath,
  parseMarketHolidayGuideYear
} from '@/shared/constants/routes';
import {
  buildFomcGuide,
  buildHolidayGuide,
  buildWeekGuide,
  weekGuideCoverage,
  type FomcGuideRow,
  type HolidayGuideRow,
  type WeekGuideRow
} from '@/shared/lib/marketGuide';
import { MARKET_GUIDE_COPY } from '../copy';
import { Emphasis, GuideStack, Note, RelatedSection, SectionTitle } from './MarketGuidePage.styled';
import type { MarketGuidePageProps } from './MarketGuidePage.types';

const copy = MARKET_GUIDE_COPY;
const US_CALENDAR_PATH = '/market/us-calendar';

type RelatedItem = { readonly to: string; readonly title: string; readonly description: string; readonly glyph: JSX.Element };

const relatedFor = (current: string): RelatedItem[] =>
  [
    { to: MARKET_WEEK_GUIDE_PATH, ...copy.relatedLinks.week, glyph: <CalendarRange aria-hidden /> },
    { to: MARKET_FOMC_GUIDE_PATH, ...copy.relatedLinks.fomc, glyph: <Landmark aria-hidden /> },
    ...MARKET_HOLIDAY_GUIDE_YEARS.map((year) => ({
      to: marketHolidayGuidePath(year),
      ...copy.relatedLinks.holidays(year),
      glyph: <Sun aria-hidden />
    })),
    { to: US_CALENDAR_PATH, ...copy.relatedLinks.calendar, glyph: <CalendarDays aria-hidden /> }
  ].filter((item) => item.to !== current);

/**
 * 미국 증시 **안내 지면**(2026-11-11) — 연도별 휴장일 · FOMC 일정 · 이번 주 일정.
 *
 * 검색어 하나에 지면 하나다(`shared/lib/marketGuide` 머리말). 화면은 표 하나와 관련 지면 카드뿐이다 —
 * 검색으로 온 사람은 날짜 하나를 확인하러 왔다. 숫자는 정적 셸과 같은 함수에서 온다.
 */
export default function MarketGuidePage({ guide }: MarketGuidePageProps) {
  const { year: yearSegment } = useParams<{ year?: string }>();
  const year = guide === 'holidays' ? parseMarketHolidayGuideYear(yearSegment) : null;
  const today = useMemo(() => new Date(), []);

  const currentPath =
    guide === 'holidays' && year ? marketHolidayGuidePath(year) : guide === 'fomc' ? MARKET_FOMC_GUIDE_PATH : MARKET_WEEK_GUIDE_PATH;
  const meta =
    guide === 'holidays'
      ? year
        ? { title: copy.holidays.title(year), description: copy.holidays.description(year) }
        : { title: '', description: '' } // 목록 밖 연도 — 곧 돌려보낸다(빈 제목 = 메타를 건드리지 않음)
      : guide === 'fomc'
        ? { title: copy.fomc.title, description: copy.fomc.description }
        : { title: copy.week.title, description: copy.week.description };
  useDocumentMeta({ ...meta, pathname: currentPath });

  if (guide === 'holidays' && !year) return <Navigate to={marketHolidayGuidePath(MARKET_HOLIDAY_GUIDE_YEARS[0])} replace />;

  return (
    <TickerPageShell>
      <GuideStack>
        {guide === 'holidays' && year ? <HolidaysSection year={year} /> : null}
        {guide === 'fomc' ? <FomcSection today={today} /> : null}
        {guide === 'week' ? <WeekSection today={today} /> : null}

        <RelatedSection aria-labelledby="market-guide-related">
          <SectionTitle id="market-guide-related">{copy.related}</SectionTitle>
          <PickCardGrid as="ul" minColumnWidth="200px">
            {relatedFor(currentPath).map((item) => (
              <PickCard
                key={item.to}
                as="li"
                titleAs="h3"
                title={item.title}
                to={item.to}
                cap={{ kind: 'rail', axis: 'brand', glyph: item.glyph, glyphInline: true }}
              >
                {item.description}
              </PickCard>
            ))}
          </PickCardGrid>
        </RelatedSection>
      </GuideStack>
    </TickerPageShell>
  );
}

function HolidaysSection({ year }: { readonly year: number }) {
  const rows = useMemo(() => buildHolidayGuide(year), [year]);
  return (
    <>
      <PageHero title={copy.holidays.heroTitle(year)} titleAs="h1" lede={copy.holidays.lede(year)} icon={<Sun aria-hidden />} />
      <DataTable<HolidayGuideRow>
        rows={rows}
        columns={[
          { key: 'date', header: '날짜', render: (row) => row.dateLabel },
          { key: 'name', header: '휴장 사유', render: (row) => row.name },
          {
            key: 'note',
            header: '거래',
            render: (row) => (row.kind === 'holiday' ? <Emphasis>{row.note}</Emphasis> : row.note)
          }
        ]}
      />
      <Note>{copy.holidays.source}</Note>
    </>
  );
}

function FomcSection({ today }: { readonly today: Date }) {
  const rows = useMemo(() => buildFomcGuide(today), [today]);
  return (
    <>
      <PageHero title={copy.fomc.heroTitle} titleAs="h1" lede={copy.fomc.lede} icon={<Landmark aria-hidden />} />
      <DataTable<FomcGuideRow>
        rows={rows}
        columns={[
          { key: 'meeting', header: '회의', render: (row) => (row.past ? `${row.meetingLabel} (지남)` : row.meetingLabel) },
          { key: 'kst', header: '결정 발표 (한국시간)', render: (row) => row.kstLabel },
          { key: 'sep', header: '점도표', render: (row) => (row.withProjections ? <Emphasis>발표</Emphasis> : '—') }
        ]}
      />
      <Note>{copy.fomc.projectionsNote}</Note>
      <Note>{copy.fomc.nextYearNote}</Note>
      <Note>{copy.fomc.source}</Note>
    </>
  );
}

function WeekSection({ today }: { readonly today: Date }) {
  const rows = useMemo(() => buildWeekGuide(today), [today]);
  const coverage = useMemo(() => weekGuideCoverage(today), [today]);
  return (
    <>
      <PageHero title={copy.week.heroTitle} titleAs="h1" lede={copy.week.lede} icon={<CalendarRange aria-hidden />} />
      {rows.length > 0 ? (
        <DataTable<WeekGuideRow>
          rows={rows}
          columns={[
            { key: 'date', header: '날짜', render: (row) => row.dateLabel, mergeKey: (row) => row.date },
            { key: 'kind', header: '구분', render: (row) => row.kind },
            { key: 'label', header: '일정', render: (row) => (row.major ? <Emphasis>{row.label}</Emphasis> : row.label) },
            { key: 'kst', header: '한국시간', render: (row) => row.kstLabel }
          ]}
        />
      ) : (
        <Note>{copy.week.empty}</Note>
      )}
      {coverage.covered ? null : <Note>{copy.week.stale(coverage.generatedAt)}</Note>}
      <Note>{copy.week.source}</Note>
    </>
  );
}
