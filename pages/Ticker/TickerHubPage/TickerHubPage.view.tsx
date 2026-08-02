import type { CSSProperties } from 'react';
import { PageFooter } from '@/components/common';
import type { HubTickerCard, TickerHubViewProps } from './TickerHubPage.types';
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
  CompareLink,
  CategorySection,
  EmptyState,
  HubHero,
  HubLede,
  HubTitle,
  TickerCard
} from './TickerHubPage.styled';

/**
 * 티커 액센트를 카드에 원시 변수로 얹는다 — 상세 페이지의 `AccentScope` 와 **같은 변수명**이라
 * 두 화면에서 같은 티커가 같은 색으로 읽힌다. 파생(테마 대응)은 스타일이 한다.
 * 액센트가 없는 티커는 `undefined` → 카드는 카테고리 색으로 폴백한다.
 */
const accentVars = (accent: HubTickerCard['accent']): CSSProperties | undefined =>
  accent
    ? ({
        '--tk-from': accent.from,
        '--tk-to': accent.to,
        '--tk-text-light': accent.textLight,
        '--tk-text-dark': accent.textDark
      } as CSSProperties)
    : undefined;

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
        {/* 🔴 nav **밖** 형제다 — 안에 넣으면 카테고리 칩의 3색 순환(nth-of-type)이 어긋난다. */}
        <CompareLink to="/ticker/compare">종목 비교하기</CompareLink>
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
                <TickerCard key={ticker.ticker} to={`/ticker/${ticker.slug}`} style={accentVars(ticker.accent)}>
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
                    {/* 값이 없는 티커는 스탯 자체를 뺀다 — 빈 값·'-'·0% 로 자리를 채우지 않는다. */}
                    {ticker.expenseRatio ? (
                      <CardStat>
                        <CardStatLabel>운용보수</CardStatLabel>
                        <CardStatValue>{ticker.expenseRatio}</CardStatValue>
                      </CardStat>
                    ) : null}
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

      {/* 다른 화면과 같은 자리·같은 모양의 공용 푸터(2026-07-31). 이 화면에는 자기 각주가 없어
          사이트 공통 고지만 나간다 — 카드 숫자의 근거는 각 티커 상세가 자기 문장으로 말한다.
          ⚠ 크롤러가 읽는 HTML 은 `server/handlers/TickerHtml` 이 따로 만든다(이 컴포넌트와 무관). */}
      <PageFooter />
    </>
  );
}
