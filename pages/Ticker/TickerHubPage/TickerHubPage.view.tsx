import type { TickerHubViewProps } from './TickerHubPage.types';
import {
  CardGrid,
  CardHead,
  CardKorean,
  CardStat,
  CardStatLabel,
  CardStatRow,
  CardStatValue,
  CardTagline,
  CardTicker,
  CategoryCount,
  CategoryHeading,
  CategoryNav,
  CategoryNavLink,
  CategorySection,
  EmptyState,
  HubHero,
  HubLede,
  HubTitle,
  TickerCard
} from './TickerHubPage.styled';

export default function TickerHubView({ viewModel }: TickerHubViewProps) {
  const { categories } = viewModel;

  return (
    <>
      <HubHero>
        <HubTitle>배당 ETF·종목 티커 정리</HubTitle>
        <HubLede>
          배당률·배당성장·운용보수·구성 기준을 티커별로 정리했습니다. 관심 있는 티커를 골라 자세히 보고, 바로 시뮬레이터로 가져가
          내 조건에서 계산해 보세요.
        </HubLede>
        {categories.length > 0 ? (
          <CategoryNav aria-label="카테고리 바로가기">
            {categories.map((category) => (
              <CategoryNavLink key={category.id} href={`#${category.id}`}>
                {category.label}
              </CategoryNavLink>
            ))}
          </CategoryNav>
        ) : null}
      </HubHero>

      {categories.length === 0 ? (
        <EmptyState>아직 정리된 티커 콘텐츠가 없습니다. 곧 추가됩니다.</EmptyState>
      ) : (
        categories.map((category) => (
          <CategorySection key={category.id} id={category.id} aria-labelledby={`${category.id}-heading`}>
            <CategoryHeading id={`${category.id}-heading`}>
              {category.label}
              <CategoryCount>{category.tickers.length}종</CategoryCount>
            </CategoryHeading>
            <CardGrid>
              {category.tickers.map((ticker) => (
                <TickerCard key={ticker.ticker} to={`/ticker/${ticker.slug}`}>
                  <CardHead>
                    <CardTicker>{ticker.ticker}</CardTicker>
                    <CardKorean>
                      {ticker.koreanName} · {ticker.englishName}
                    </CardKorean>
                  </CardHead>
                  <CardTagline>{ticker.tagline}</CardTagline>
                  <CardStatRow>
                    <CardStat>
                      <CardStatLabel>배당률</CardStatLabel>
                      <CardStatValue>{ticker.dividendYield}</CardStatValue>
                    </CardStat>
                    <CardStat>
                      <CardStatLabel>지급</CardStatLabel>
                      <CardStatValue>{ticker.frequencyLabel}</CardStatValue>
                    </CardStat>
                  </CardStatRow>
                </TickerCard>
              ))}
            </CardGrid>
          </CategorySection>
        ))
      )}
    </>
  );
}
