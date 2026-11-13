import { useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { TickerPageShell } from '@/pages/Ticker/components';
import { useDocumentMeta } from '@/pages/Ticker/hooks';
import { MARKET_HOLIDAY_GUIDE_YEARS, marketHolidayGuidePath, parseMarketHolidayGuideYear } from '@/shared/constants/routes';
import { FomcSection, HolidaysSection, RelatedGuides, WeekSection } from '../components';
import { GuideStack } from './MarketGuidePage.styled';
import type { MarketGuidePageProps } from './MarketGuidePage.types';
import { guideMeta, guidePath } from './MarketGuidePage.utils';

/**
 * 미국 증시 **안내 지면**(2026-11-11) — 연도별 휴장일 · FOMC 일정 · 이번 주 일정.
 *
 * 검색어 하나에 지면 하나다(`shared/lib/marketGuide` 머리말). 숫자는 정적 셸과 같은 함수에서 온다.
 * 2026-11-12: 공용 표 대신 정렬된 목록(날짜 블록 · 내용 · 오른쪽 값)으로 — 폭마다 같은 열에 같은 정보.
 * 2026-11-13: 이 파일은 지면 고르기 · 메타 · 조립만 갖는다 — 지면별 화면은 `../components`.
 */
export default function MarketGuidePage({ guide }: MarketGuidePageProps) {
  const { year: yearSegment } = useParams<{ year?: string }>();
  const year = guide === 'holidays' ? parseMarketHolidayGuideYear(yearSegment) : null;
  const today = useMemo(() => new Date(), []);
  const currentPath = guidePath(guide, year);
  useDocumentMeta({ ...guideMeta(guide, year), pathname: currentPath });

  if (guide === 'holidays' && !year) return <Navigate to={marketHolidayGuidePath(MARKET_HOLIDAY_GUIDE_YEARS[0])} replace />;

  return (
    <TickerPageShell>
      <GuideStack>
        {guide === 'holidays' && year ? <HolidaysSection year={year} today={today} /> : null}
        {guide === 'fomc' ? <FomcSection today={today} /> : null}
        {guide === 'week' ? <WeekSection today={today} /> : null}
        <RelatedGuides currentPath={currentPath} />
      </GuideStack>
    </TickerPageShell>
  );
}
