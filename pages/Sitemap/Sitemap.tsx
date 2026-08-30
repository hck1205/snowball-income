import { BookOpen, Map, Shield, ScrollText } from 'lucide-react';
import { PageFooter, PageHero } from '@/components/common';
import { buildNavTree } from '@/components/PrimaryNav';
import type { NavGroup } from '@/components/PrimaryNav';
import { TickerPageShell } from '@/pages/Ticker/components';
import { useDocumentMeta } from '@/pages/Ticker/hooks';
import { ICON } from '@/shared/styles';
import { ABOUT_PATH } from '@/shared/constants/routes';
import { PageStack, Section, SectionTitle, SitemapGrid, SitemapLink, SitemapLinkList } from './Sitemap.styled';

/**
 * `/sitemap` — 사람이 훑는 사이트 색인.
 *
 * ## 🔴 섹션은 **전역 nav 와 같은 정본**에서 나온다
 * `@/components/PrimaryNav` 의 `buildNavTree()` 를 그대로 쓴다 — nav 한 칸이 여기 한 장이다.
 * 두 곳이 각자 목록을 들면 nav 에 화면을 더할 때 이 페이지가 조용히 뒤처진다. env 플래그
 * (가계부·커뮤니티) 필터도 그 함수 안에 있어 nav 와 **같은 규칙**이다: 라우트가 존재하지 않는
 * 배포에서 죽은 링크를 그리지 않는다.
 *
 * ⚠ 이 페이지는 XML 사이트맵(`sitemap.xml`, 크롤러용)과 **다른 것**이다. 이쪽은 사람이 클릭하는
 *   지면이고, 저쪽은 크롤러가 읽는 목록이다. 둘 다 있어도 중복이 아니라 청중이 다르다.
 */

const COPY = {
  meta: {
    /*
     * 🔴 **접미(`- Hungry Hippo`)를 여기 적지 마라.** `useDocumentMeta` 가 `withSiteTitleSuffix` 로
     * 붙인다 — 콘텐츠가 직접 적으면 `사이트맵 - Hungry Hippo - Hungry Hippo` 가 된다.
     * 2026-08-14 에 이 파일이 실제로 그 상태였다(전 화면 중 유일). 아래 테스트가 다시 못 하게 잠근다.
     */
    title: '사이트맵',
    description:
      'Hungry Hippo 의 모든 화면을 한곳에 모았습니다. 배당 시뮬레이터·외부 포트폴리오·시장 통계·배당 캘린더·배당 종목 목록·커뮤니티·종목 비교로 바로 이동할 수 있습니다.'
  },
  title: '사이트맵',
  lede: 'Hungry Hippo 의 모든 화면을 한곳에 모았습니다. 원하는 곳으로 바로 이동하세요.',
  policiesTitle: '정책',
  aboutTitle: '소개',
  aboutLabel: '배당 알아보기'
} as const;

/**
 * 안내문(`/about`)도 nav 에 없다 — 헤더 메뉴는 "무엇을 하는 화면"으로 묶여 있는데 이것은 읽는
 * 지면이라 어느 칸에도 자연스럽게 앉지 않는다. 다만 이 페이지의 일은 "모든 화면을 한곳에" 이므로
 * 빠지면 안 된다(2026-08-27 에 `/` 에서 갈라져 나왔다).
 */
const ABOUT_SECTION: NavGroup = {
  label: COPY.aboutTitle,
  items: [{ to: ABOUT_PATH, label: COPY.aboutLabel, Icon: BookOpen }]
};

/** 정책 두 장은 nav 에 없다 — 이 페이지에만 있는 꼬리다. */
const POLICY_SECTION: NavGroup = {
  label: COPY.policiesTitle,
  items: [
    { to: '/privacy', label: '개인정보처리방침', Icon: Shield },
    { to: '/terms', label: '이용약관', Icon: ScrollText }
  ]
};

export default function SitemapPage() {
  useDocumentMeta({ title: COPY.meta.title, description: COPY.meta.description, pathname: '/sitemap' });

  /* 🔴 렌더 안에서 부른다 — env 플래그를 호출 시점에 읽어야 꺼진 배포의 동작이 테스트로 잡힌다. */
  const sections: readonly NavGroup[] = [...buildNavTree(), ABOUT_SECTION, POLICY_SECTION];

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
          {sections.map((section, index) => (
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
