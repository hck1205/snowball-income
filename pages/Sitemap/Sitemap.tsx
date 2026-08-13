import { Map, Shield, ScrollText } from 'lucide-react';
import { PageFooter, PageHero } from '@/components/common';
import {
  CALENDAR_GROUP_ITEMS,
  COMMUNITY_GROUP_ITEMS,
  DIVIDEND_LIST_GROUP_ITEMS,
  MARKET_GROUP_ITEMS,
  PERSONAL_GROUP_ITEMS,
  PORTFOLIO_GROUP_ITEMS,
  TICKER_GROUP_ITEMS
} from '@/components/PrimaryNav';
import { TickerPageShell } from '@/pages/Ticker/components';
import { useDocumentMeta } from '@/pages/Ticker/hooks';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { isGoogleSheetsEnabled } from '@/shared/lib/googleSheets';
import { isCommunityEnabled } from '@/shared/lib/supabase';
import { ICON } from '@/shared/styles';
import { PageStack, Section, SectionTitle, SitemapGrid, SitemapLink, SitemapLinkList } from './Sitemap.styled';

/**
 * `/sitemap` — 사람이 훑는 사이트 색인.
 *
 * ## 🔴 섹션은 **전역 nav 와 같은 정본**에서 나온다
 * 목적지 배열(`@/components/PrimaryNav` 의 `*_GROUP_ITEMS`)과 묶음 이름(`COMMUNITY_COPY.nav`)을 그대로
 * 재사용한다. 두 곳이 각자 목록을 들면 nav 에 화면을 더할 때 이 페이지가 조용히 뒤처진다 —
 * 그래서 배열을 복제하지 않고 참조한다. env 플래그(가계부·커뮤니티) 필터도 nav 와 **같은 규칙**이다:
 * 라우트가 존재하지 않는 배포에서 죽은 링크를 그리지 않는다.
 *
 * ⚠ 이 페이지는 XML 사이트맵(`sitemap.xml`, 크롤러용)과 **다른 것**이다. 이쪽은 사람이 클릭하는
 *   지면이고, 저쪽은 크롤러가 읽는 목록이다. 둘 다 있어도 중복이 아니라 청중이 다르다.
 */

const nav = COMMUNITY_COPY.nav;

const COPY = {
  meta: {
    title: '사이트맵 - Hungry Hippo',
    description:
      'Hungry Hippo 의 모든 화면을 한곳에 모았습니다. 배당 시뮬레이터·외부 포트폴리오·시장 통계·배당 캘린더·배당 종목 목록·커뮤니티·종목 탐색으로 바로 이동할 수 있습니다.'
  },
  title: '사이트맵',
  lede: 'Hungry Hippo 의 모든 화면을 한곳에 모았습니다. 원하는 곳으로 바로 이동하세요.',
  policiesTitle: '정책'
} as const;

type SitemapItem = { to: string; label: string; Icon: typeof Map };
type SitemapSection = { label: string; items: readonly SitemapItem[] };

/** nav 묶음(+ 정책)을 순서대로. 개인·외부 묶음은 nav 와 같은 env 필터를 통과한 것만 남긴다. */
const SECTIONS: readonly SitemapSection[] = [
  { label: nav.personalGroup, items: PERSONAL_GROUP_ITEMS.filter((item) => !item.sheetsOnly || isGoogleSheetsEnabled) },
  { label: nav.portfolioGroup, items: PORTFOLIO_GROUP_ITEMS.filter((item) => !item.communityOnly || isCommunityEnabled) },
  { label: nav.marketGroup, items: MARKET_GROUP_ITEMS },
  { label: nav.calendarGroup, items: CALENDAR_GROUP_ITEMS },
  { label: nav.dividendListGroup, items: DIVIDEND_LIST_GROUP_ITEMS },
  ...(isCommunityEnabled ? [{ label: nav.communityGroup, items: COMMUNITY_GROUP_ITEMS }] : []),
  { label: nav.tickerGroup, items: TICKER_GROUP_ITEMS },
  {
    label: COPY.policiesTitle,
    items: [
      { to: '/privacy', label: '개인정보처리방침', Icon: Shield },
      { to: '/terms', label: '이용약관', Icon: ScrollText }
    ]
  }
];

export default function SitemapPage() {
  useDocumentMeta({ title: COPY.meta.title, description: COPY.meta.description, pathname: '/sitemap' });

  return (
    <TickerPageShell>
      <PageStack>
        <PageHero
          icon={<Map size={20} strokeWidth={ICON.stroke} aria-hidden focusable={false} />}
          title={COPY.title}
          titleAs="h1"
          lede={COPY.lede}
        />

        <SitemapGrid>
          {SECTIONS.map((section, index) => (
            <Section key={section.label} aria-labelledby={`sitemap-section-${index}`}>
              <SectionTitle id={`sitemap-section-${index}`}>{section.label}</SectionTitle>
              <SitemapLinkList>
                {section.items.map((item) => {
                  const Icon = item.Icon;
                  return (
                    <li key={item.to}>
                      <SitemapLink to={item.to}>
                        <Icon size={16} strokeWidth={ICON.stroke} aria-hidden focusable={false} />
                        {item.label}
                      </SitemapLink>
                    </li>
                  );
                })}
              </SitemapLinkList>
            </Section>
          ))}
        </SitemapGrid>

        <PageFooter />
      </PageStack>
    </TickerPageShell>
  );
}
