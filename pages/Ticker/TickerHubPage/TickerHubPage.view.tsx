import {
  ArrowRight,
  Building2,
  Coins,
  Globe,
  Landmark,
  Layers,
  LayoutGrid,
  Library,
  LineChart,
  Scale,
  TrendingUp,
  type LucideIcon
} from 'lucide-react';
import type { CSSProperties } from 'react';
import { PageFooter, PickCardGrid } from '@/components/common';
import { ICON } from '@/shared/styles';
import type { HubTickerCard, TickerHubViewProps } from './TickerHubPage.types';
import { summarizeTickerHub } from './TickerHubPage.utils';
import {
  CARD_MIN_WIDTH,
  CapLabel,
  CardBody,
  CardNames,
  CardScope,
  CardStat,
  CardStatLabel,
  CardStatRow,
  CardStatValue,
  CardSymbol,
  CardTagline,
  CategoryCount,
  CategoryGlyph,
  CategoryHeading,
  CategoryNav,
  CategoryNavLink,
  CategorySection,
  ChipGlyph,
  CompareLink,
  EmptyState,
  HubEyebrow,
  HubHero,
  HubLede,
  HubMeta,
  HubMetaDot,
  HubMetaValue,
  HubPickCard,
  HubTitle
} from './TickerHubPage.styled';

/**
 * 카테고리 → 글리프.
 *
 * 🔴 **색이 유일한 채널이 되지 않게 하는 장치다.** 카드 캡과 섹션 제목이 카테고리 색을 쓰는데,
 * 회색조로 인쇄하거나 색각이상 환경에서 그 색은 사라진다. 모양은 남는다.
 *
 * 키는 `TICKER_CATEGORY_LABEL` 의 키(=섹션 id)다. 카테고리를 추가하면 여기 한 줄이 늘고,
 * 빠뜨려도 아래 폴백으로 조용히 그려진다(화면이 깨지지 않는다).
 */
const CATEGORY_GLYPH: Record<string, LucideIcon> = {
  'dividend-growth': TrendingUp,
  'high-dividend': Coins,
  'covered-call': Layers,
  reit: Building2,
  international: Globe,
  'core-index': LineChart,
  'dividend-stock': Landmark
};

const glyphFor = (categoryId: string): LucideIcon => CATEGORY_GLYPH[categoryId] ?? LayoutGrid;

/**
 * 티커 액센트를 카드 스코프에 **원시 변수**로 얹는다 — 상세 페이지의 `AccentScope` 와 같은 변수명이라
 * 두 화면에서 같은 티커가 같은 색으로 읽힌다. 테마 분기·틴트 파생은 전부 스타일이 한다.
 *
 * `--tk-fallback` 은 액센트가 **없는** 티커의 색이다(`assignSeries` 배정 결과). 종전 폴백이었던
 * "그 섹션의 카테고리 색"과 달리 같은 격자 안에서 서로 겹치지 않는다.
 */
const accentVars = (card: HubTickerCard): CSSProperties =>
  ({
    '--tk-fallback': card.seriesVar,
    ...(card.accent
      ? {
          '--tk-from': card.accent.from,
          '--tk-to': card.accent.to,
          '--tk-text-light': card.accent.textLight,
          '--tk-text-dark': card.accent.textDark
        }
      : {})
  }) as CSSProperties;

export default function TickerHubView({ viewModel }: TickerHubViewProps) {
  const { categories } = viewModel;
  const { tickerCount, categoryCount } = summarizeTickerHub(viewModel);

  return (
    <>
      <HubHero>
        <HubEyebrow>
          <ChipGlyph aria-hidden>
            <Library size={ICON.sm} strokeWidth={ICON.stroke} />
          </ChipGlyph>
          ETF 라이브러리
        </HubEyebrow>
        <HubTitle>배당 ETF·종목 티커 정리</HubTitle>
        <HubLede>
          배당률·배당성장·운용보수·구성 기준을 티커별로 정리했습니다. 관심 있는 티커를 골라 자세히 보고, 바로 시뮬레이터로 가져가
          내 조건에서 계산해 보세요.
        </HubLede>
        <HubMeta>
          <span>
            <HubMetaValue>{tickerCount}</HubMetaValue>종 수록
          </span>
          <HubMetaDot aria-hidden>·</HubMetaDot>
          <span>
            <HubMetaValue>{categoryCount}</HubMetaValue>개 카테고리
          </span>
        </HubMeta>
        {categories.length > 0 ? (
          <CategoryNav aria-label="카테고리 바로가기">
            {categories.map((category) => (
              /* 🔴 해시 앵커다 — 아래 CategorySection 의 id 와 짝이고, 그 섹션의 scroll-margin-top 이
                 고정 헤더를 피한다. 라우터 Link 로 바꾸지 마라(해시 라우팅 자제 규칙과 별개로,
                 같은 문서 안 이동이라 브라우저 기본 동작이 옳다). */
              <CategoryNavLink key={category.id} href={`#${category.id}`}>
                {category.label}
              </CategoryNavLink>
            ))}
          </CategoryNav>
        ) : null}
        {/* 🔴 nav **밖** 형제다 — 안에 넣으면 카테고리 칩의 3색 순환(nth-of-type)이 어긋난다. */}
        <CompareLink to="/ticker/compare">
          <ChipGlyph aria-hidden>
            <Scale size={ICON.md} strokeWidth={ICON.stroke} />
          </ChipGlyph>
          종목 비교하기
          <ChipGlyph aria-hidden>
            <ArrowRight size={ICON.md} strokeWidth={ICON.stroke} />
          </ChipGlyph>
        </CompareLink>
      </HubHero>

      {categories.length === 0 ? (
        <EmptyState>아직 정리된 티커 콘텐츠가 없습니다. 곧 추가됩니다.</EmptyState>
      ) : (
        categories.map((category) => {
          const Glyph = glyphFor(category.id);

          return (
            <CategorySection key={category.id} id={category.id} aria-labelledby={`${category.id}-heading`}>
              <CategoryHeading id={`${category.id}-heading`}>
                <CategoryGlyph aria-hidden>
                  <Glyph size={ICON.xl} strokeWidth={ICON.stroke} />
                </CategoryGlyph>
                {category.label}
                <CategoryCount>{category.tickers.length}종</CategoryCount>
              </CategoryHeading>

              {/*
               * 🔴 `cluster` 를 빼지 마라. 아래 카드의 컬러 캡은 tintscan 이 **면으로 세는** 크기라,
               * 표식(data-tint-cluster="pick-grid")이 없으면 카드 장수만큼 면이 잡혀 이 라우트의
               * 예산(화면당 2면)이 즉시 터진다. 값은 부품이 고정한다(라우트당 한 값만 허용).
               */}
              <PickCardGrid as="ul" cluster minColumnWidth={CARD_MIN_WIDTH}>
                {category.tickers.map((ticker) => (
                  <CardScope key={ticker.ticker} style={accentVars(ticker)}>
                    {/* 격자 셀(li)은 바깥 CardScope 다 — 카드 자신은 article 로 남는다(li 안의 li 금지). */}
                    <HubPickCard
                      titleAs="h3"
                      to={`/ticker/${ticker.slug}`}
                      title={<CardSymbol>{ticker.ticker}</CardSymbol>}
                      subtitle={
                        <CardNames>
                          {ticker.koreanName} · {ticker.englishName}
                        </CardNames>
                      }
                      cap={{
                        kind: 'tint',
                        axis: 'scoped',
                        /* 면은 전 카드 공유(클러스터가 1면으로 접는 조건), 잉크만 티커별이다. */
                        scopedVar: '--tk-cap-fill',
                        scopedInkVar: '--tk-text',
                        height: 'sm',
                        glyph: <Glyph size={ICON.xl} strokeWidth={ICON.stroke} />,
                        label: <CapLabel>{category.label}</CapLabel>
                      }}
                    >
                      <CardBody>
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
                      </CardBody>
                    </HubPickCard>
                  </CardScope>
                ))}
              </PickCardGrid>
            </CategorySection>
          );
        })
      )}

      {/* 다른 화면과 같은 자리·같은 모양의 공용 푸터(2026-07-31). 이 화면에는 자기 각주가 없어
          사이트 공통 고지만 나간다 — 카드 숫자의 근거는 각 티커 상세가 자기 문장으로 말한다.
          ⚠ 크롤러가 읽는 HTML 은 `server/handlers/TickerHtml` 이 따로 만든다(이 컴포넌트와 무관). */}
      <PageFooter />
    </>
  );
}
