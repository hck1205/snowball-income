import { useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { CalendarDays, CalendarRange, Landmark, Sun } from 'lucide-react';
import { PageHero, PickCard, PickCardGrid } from '@/components/common';
import { TickerPageShell } from '@/pages/Ticker/components';
import { useDocumentMeta } from '@/pages/Ticker/hooks';
import { toCalendarDate } from '@/shared/constants/marketCalendar';
import {
  MARKET_FOMC_GUIDE_PATH,
  MARKET_HOLIDAY_GUIDE_YEARS,
  MARKET_WEEK_GUIDE_PATH,
  marketHolidayGuidePath,
  parseMarketHolidayGuideYear
} from '@/shared/constants/routes';
import { buildFomcGuide, buildHolidayGuide, buildWeekGuide, weekGuideCoverage, type WeekGuideRow } from '@/shared/lib/marketGuide';
import { MARKET_GUIDE_COPY } from '../copy';
import {
  Badge,
  DateBlock,
  DateDay,
  DateMonth,
  DateWeekday,
  DayCount,
  DayGroup,
  DayHead,
  Emphasis,
  EventLabel,
  EventRow,
  EventTime,
  Footnotes,
  GuideStack,
  List,
  Note,
  RelatedSection,
  Row,
  RowMain,
  RowSide,
  RowSub,
  RowTitle,
  SectionTitle,
  SideValue
} from './MarketGuidePage.styled';
import type { MarketGuidePageProps } from './MarketGuidePage.types';

const copy = MARKET_GUIDE_COPY;
const US_CALENDAR_PATH = '/market/us-calendar';
const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** `2026-11-26` → 11월 · 26 · 목 (날짜 블록 세 줄). */
const dateParts = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  const weekday = WEEKDAY_KO[new Date(y!, m! - 1, d!).getDay()]!;
  return { month: `${m}월`, day: String(d), weekday };
};

function DateBadge({ date }: { readonly date: string }) {
  const parts = dateParts(date);
  return (
    <DateBlock aria-hidden>
      <DateMonth>{parts.month}</DateMonth>
      <DateDay>{parts.day}</DateDay>
      <DateWeekday>{parts.weekday}</DateWeekday>
    </DateBlock>
  );
}

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
 * 검색어 하나에 지면 하나다(`shared/lib/marketGuide` 머리말). 숫자는 정적 셸과 같은 함수에서 온다.
 * 2026-11-12: 공용 표 대신 정렬된 목록(날짜 블록 · 내용 · 오른쪽 값)으로 — 폭마다 같은 열에 같은 정보.
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
        {guide === 'holidays' && year ? <HolidaysSection year={year} today={today} /> : null}
        {guide === 'fomc' ? <FomcSection today={today} /> : null}
        {guide === 'week' ? <WeekSection today={today} /> : null}

        <RelatedSection aria-labelledby="market-guide-related">
          <SectionTitle id="market-guide-related">{copy.related}</SectionTitle>
          <PickCardGrid as="ul" minColumnWidth="240px">
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

function HolidaysSection({ year, today }: { readonly year: number; readonly today: Date }) {
  const rows = useMemo(() => buildHolidayGuide(year), [year]);
  const todayKey = toCalendarDate(today);
  const nextDate = rows.find((row) => row.date >= todayKey)?.date;
  return (
    <>
      <PageHero title={copy.holidays.heroTitle(year)} titleAs="h1" lede={copy.holidays.lede(year)} icon={<Sun aria-hidden />} />
      <List aria-label={copy.holidays.tableCaption(year)}>
        {rows.map((row) => {
          const state = row.date === nextDate ? 'next' : row.date < todayKey ? 'past' : 'normal';
          return (
            <Row key={`${row.date}-${row.kind}`} state={state}>
              <DateBadge date={row.date} />
              <RowMain>
                <RowTitle>{row.name}</RowTitle>
                {/* 조기 폐장의 마감 시각은 **제목 아래 줄**에 — 오른쪽 열에 두면 좁은 폭에서 제목이 한 글자씩 꺾였다. */}
                <RowSub>
                  {row.kind === 'holiday' ? row.dateLabel : `${row.dateLabel} · ${row.note.replace(/^미국 13:00 조기 마감 /, '13:00 마감 ')}`}
                </RowSub>
              </RowMain>
              <RowSide>
                {state === 'next' ? <Badge tone="brand">다음 휴장</Badge> : null}
                {row.kind === 'holiday' ? <Badge tone="warn">종일 휴장</Badge> : <Badge tone="alt">조기 폐장</Badge>}
              </RowSide>
            </Row>
          );
        })}
      </List>
      <Footnotes>
        <Note>{copy.holidays.source}</Note>
      </Footnotes>
    </>
  );
}

function FomcSection({ today }: { readonly today: Date }) {
  const rows = useMemo(() => buildFomcGuide(today), [today]);
  const next = rows.find((row) => !row.past)?.decisionDate;
  return (
    <>
      <PageHero title={copy.fomc.heroTitle} titleAs="h1" lede={copy.fomc.lede} icon={<Landmark aria-hidden />} />
      <List aria-label={copy.fomc.tableCaption}>
        {rows.map((row) => {
          const state = row.decisionDate === next ? 'next' : row.past ? 'past' : 'normal';
          return (
            <Row key={row.decisionDate} state={state}>
              <DateBadge date={row.decisionDate} />
              <RowMain>
                <RowTitle>{row.withProjections ? 'FOMC 금리 결정 · 점도표' : 'FOMC 금리 결정'}</RowTitle>
                <RowSub>회의 {row.meetingLabel.replace(/\s*\([^)]*\)/g, '')}</RowSub>
              </RowMain>
              <RowSide>
                {state === 'next' ? <Badge tone="brand">다음 회의</Badge> : state === 'past' ? <Badge tone="muted">지남</Badge> : null}
                <SideValue>{row.kstLabel}</SideValue>
                <RowSub>한국시간</RowSub>
              </RowSide>
            </Row>
          );
        })}
      </List>
      <Footnotes>
        <Note>{copy.fomc.projectionsNote}</Note>
        <Note>{copy.fomc.nextYearNote}</Note>
        <Note>{copy.fomc.source}</Note>
      </Footnotes>
    </>
  );
}

const KIND_TONE: Record<WeekGuideRow['kind'], 'brand' | 'alt' | 'muted' | 'warn'> = {
  휴장: 'warn',
  '조기 폐장': 'warn',
  FOMC: 'brand',
  지표: 'alt',
  실적: 'muted'
};

function WeekSection({ today }: { readonly today: Date }) {
  const rows = useMemo(() => buildWeekGuide(today), [today]);
  const coverage = useMemo(() => weekGuideCoverage(today), [today]);
  const days = useMemo(() => {
    const groups = new Map<string, WeekGuideRow[]>();
    for (const row of rows) groups.set(row.date, [...(groups.get(row.date) ?? []), row]);
    return [...groups.entries()];
  }, [rows]);

  return (
    <>
      <PageHero title={copy.week.heroTitle} titleAs="h1" lede={copy.week.lede} icon={<CalendarRange aria-hidden />} />
      {days.length === 0 ? <Note>{copy.week.empty}</Note> : null}
      {days.map(([date, items]) => (
        <DayGroup key={date} aria-labelledby={`day-${date}`}>
          <DayHead id={`day-${date}`}>
            {items[0]!.dateLabel}
            <DayCount>{items.length}건</DayCount>
          </DayHead>
          <List>
            {items.map((item) => (
              <EventRow key={`${item.kind}-${item.label}`}>
                <EventTime>{item.kstLabel}</EventTime>
                <Badge tone={KIND_TONE[item.kind]}>{item.kind}</Badge>
                <EventLabel>{item.major ? <Emphasis>{item.label}</Emphasis> : item.label}</EventLabel>
              </EventRow>
            ))}
          </List>
        </DayGroup>
      ))}
      <Footnotes>
        {coverage.covered ? null : <Note>{copy.week.stale(coverage.generatedAt)}</Note>}
        <Note>{copy.week.source}</Note>
      </Footnotes>
    </>
  );
}
