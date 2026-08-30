import {
  ArrowRight,
  Building2,
  Coins,
  Globe,
  Landmark,
  Layers,
  LayoutGrid,
  LineChart,
  TrendingUp,
  type LucideIcon
} from 'lucide-react';
import { Fragment, useCallback, useMemo, type CSSProperties } from 'react';
import { PageFooter, PickCardGrid } from '@/components/common';
import { SIMULATOR_PATH } from '@/shared/constants/routes';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { useScrollSpy } from '@/shared/hooks';
import { ICON } from '@/shared/styles';
import type { ResolvedRelatedTicker, ResolvedSection, TickerDetailViewProps } from './TickerDetailPage.types';
import { useInView } from './hooks';
import { prefersReducedMotion } from './TickerDetailPage.utils';
import {
  AccentScope,
  Appendix,
  AppendixHead,
  AppendixHeading,
  AppendixNote,
  AsOfNote,
  Breadcrumb,
  BulletList,
  Content,
  CtaRow,
  Disclaimer,
  DisclaimerText,
  FaqAnswer,
  FaqIndex,
  FaqItem,
  FaqList,
  FaqSummary,
  Hero,
  HeroBody,
  HeroCap,
  HeroCapGlyph,
  HeroCapMeta,
  HeroMain,
  HeroMetric,
  HeroMetricCaption,
  HeroMetricLabel,
  HeroMetricLead,
  HeroMetricRow,
  HeroMetricRowLabel,
  HeroMetricRowValue,
  HeroMetricRows,
  HeroMetricValue,
  HeroReveal,
  HeroTagline,
  HoldingBar,
  HoldingBarFill,
  HoldingName,
  HoldingRank,
  HoldingSymbol,
  HoldingWeight,
  HoldingWeightValue,
  HoldingsTable,
  Layout,
  Lead,
  Paragraph,
  PrimaryCta,
  RELATED_MIN_WIDTH,
  RelatedEmpty,
  RelatedEmptyText,
  RelatedKorean,
  RelatedPendingBadge,
  RelatedPickCard,
  RelatedRelation,
  RelatedScope,
  RelatedStaticCard,
  RelatedSymbol,
  SecondaryCta,
  SectionEyebrow,
  SectionHead,
  SectionHeading,
  Section,
  SectorRank,
  SectorRankItem,
  SectorRankLabel,
  SectorRankNumber,
  SourceLine,
  SpecLabel,
  SpecRow,
  SpecTable,
  SpecValue,
  StatBand,
  StatBandBody,
  StatBandCaption,
  StatBandLabel,
  StatBandValue,
  TickerBadge,
  TickerEnglishName,
  TickerNames,
  TickerSymbol,
  TocAside,
  TocButton,
  TocCount,
  TocCta,
  TocDivider,
  TocDot,
  TocHead,
  TocIndex,
  TocLabel,
  TocList,
  UpdatedAt
} from './styled';

/**
 * 카테고리 → 글리프.
 *
 * 🔴 **색이 유일한 채널이 되지 않게 하는 장치다.** 히어로 캡과 관련 티커 카드의 레일이 색을 쓰는데,
 * 회색조로 인쇄하거나 색각이상 환경에서 그 색은 사라진다. 모양은 남는다.
 * 키는 `TICKER_CATEGORY_LABEL` 의 키다 — 빠뜨려도 아래 폴백으로 조용히 그려진다(화면이 깨지지 않는다).
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

const glyphFor = (categoryId: string | undefined): LucideIcon =>
  (categoryId ? CATEGORY_GLYPH[categoryId] : undefined) ?? LayoutGrid;

/**
 * 관련 티커의 색을 카드 스코프에 얹는다 — 허브 카드·상세 히어로와 **같은 변수 이름**이라
 * 같은 티커가 세 지면에서 같은 색으로 읽힌다. 액센트가 없는 티커는 `assignSeries` 가 이 묶음
 * 안에서 겹치지 않게 배정한 색(`--tk-related-series`)으로 떨어진다.
 */
const relatedVars = (related: ResolvedRelatedTicker): CSSProperties =>
  ({
    '--tk-related-series': related.seriesVar,
    ...(related.accent
      ? {
          '--tk-from': related.accent.from,
          '--tk-text-light': related.accent.textLight,
          '--tk-text-dark': related.accent.textDark
        }
      : {})
  }) as CSSProperties;

/**
 * 뷰포트 진입 시 등장하는 한 장(章). useInView 로 각자 관찰한다(reduced-motion 이면 즉시 표시).
 *
 * 장 머리는 **번호 + 라벨 + 헤어라인**이다 — 목차의 번호와 같은 값이라, 문서 어디에 있는지가
 * 좌측 레일을 보지 않아도 본문 안에서 읽힌다.
 */
function DetailSection({ section, index }: { section: ResolvedSection; index: string }) {
  const [ref, revealed] = useInView<HTMLElement>();
  const [lead, ...rest] = section.paragraphs;

  return (
    <Section id={section.id} ref={ref} $revealed={revealed} tabIndex={-1} aria-labelledby={`${section.id}-heading`}>
      <SectionHead>
        <SectionEyebrow>
          <span>{index}</span>
          <span>{section.navLabel}</span>
        </SectionEyebrow>
        <SectionHeading id={`${section.id}-heading`}>{section.heading}</SectionHeading>
      </SectionHead>

      {lead ? <Lead>{lead}</Lead> : null}
      {rest.map((paragraph, order) => (
        <Paragraph key={order}>{paragraph}</Paragraph>
      ))}

      {section.bullets && section.bullets.length > 0 ? (
        <BulletList>
          {section.bullets.map((bullet, order) => (
            <li key={order}>{bullet}</li>
          ))}
        </BulletList>
      ) : null}

      {section.stat ? (
        <StatBand>
          <StatBandValue>{section.stat.value}</StatBandValue>
          <StatBandBody>
            <StatBandLabel>{section.stat.label}</StatBandLabel>
            {section.stat.caption ? <StatBandCaption>{section.stat.caption}</StatBandCaption> : null}
          </StatBandBody>
        </StatBand>
      ) : null}
    </Section>
  );
}

export default function TickerDetailView({ viewModel }: TickerDetailViewProps) {
  /*
   * 🔴 useMemo 가 필요하다 — 이 배열이 매 렌더 새 참조면 useScrollSpy 의 effect 가 매 렌더
   * IntersectionObserver 를 버리고 다시 만든다(스크롤 중 활성 표시가 튄다).
   */
  const tocIds = useMemo(() => viewModel.toc.map((item) => item.id), [viewModel.toc]);
  const activeId = useScrollSpy(tocIds);

  /**
   * 🔴 **이 지면이 검색 유입의 착지점이다.** 2026-08-30 감사 전까지 여기 두 CTA 에는 계측이
   * 하나도 없어서, 티커 페이지 수십 개가 실제로 앱 사용으로 이어지는지 잴 방법이 없었다 —
   * 페이지뷰는 늘어도 그게 성과인지 알 수 없었다는 뜻이다.
   *
   * ⚠ 티커 심볼은 파라미터로 싣지 않는다. `page_location` 이 이미 어느 티커인지 말한다
   *   (중복 파라미터는 값공간만 넓힌다). 가르는 것은 **지면 안 위치**(slot)뿐이고, 그 차이가
   *   "본문을 읽고 눌렀나(hero), 훑다가 눌렀나(toc)"다.
   */
  const trackToSimulator = useCallback((slot: 'hero' | 'toc') => {
    trackEvent(ANALYTICS_EVENT.CONTENT_TO_SIMULATOR, { surface: 'ticker', slot });
  }, []);

  const onNavClick = useCallback((id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    if (typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    }
    // 키보드 사용자를 위해 포커스도 섹션으로 옮긴다(스크롤만으로는 포커스가 따라가지 않는다).
    target.focus({ preventScroll: true });
  }, []);

  const accentVars = viewModel.accent
    ? ({
        '--tk-from': viewModel.accent.from,
        '--tk-to': viewModel.accent.to,
        '--tk-text-light': viewModel.accent.textLight,
        '--tk-text-dark': viewModel.accent.textDark
      } as CSSProperties)
    : undefined;

  const [primaryStat, ...supportingStats] = viewModel.heroStats;
  const HeroGlyph = glyphFor(viewModel.categories[0]?.id);
  const { topHoldings, referenceSectors } = viewModel;
  const hasReferencePanel = viewModel.referenceFacts.length > 0 || (referenceSectors?.length ?? 0) > 0;

  return (
    <AccentScope data-accent={viewModel.accent ? 'true' : undefined} style={accentVars}>
      {/* 🔴 히어로 **밖**이다 — 첫 줄이 경로가 아니라 티커여야 한다(styled 의 Breadcrumb 주석). */}
      <Breadcrumb aria-label="위치">
        <a href="/ticker/all">티커 전체</a>
        <span aria-hidden="true">/</span>
        <span>{viewModel.ticker}</span>
      </Breadcrumb>

      <Hero>
        {/* 허브 카드의 컬러 캡과 같은 축 — 카드를 눌러 들어온 사람이 같은 색을 다시 만난다. */}
        <HeroCap>
          <HeroCapGlyph aria-hidden>
            <HeroGlyph size={ICON.md} strokeWidth={ICON.stroke} />
          </HeroCapGlyph>
          {viewModel.categories.length > 0
            ? viewModel.categories.map((category) => category.label).join(' · ')
            : 'ETF·종목 소개'}
          <HeroCapMeta>본문 {viewModel.sections.length}장</HeroCapMeta>
        </HeroCap>

        <HeroBody>
          <HeroMain>
            <HeroReveal $delay={0}>
              <TickerBadge>
                <TickerSymbol>{viewModel.ticker}</TickerSymbol>
                <TickerNames>
                  {viewModel.koreanName}
                  <TickerEnglishName> · {viewModel.englishName}</TickerEnglishName>
                </TickerNames>
              </TickerBadge>
            </HeroReveal>
            <HeroReveal $delay={90}>
              <HeroTagline>{viewModel.heroTagline}</HeroTagline>
            </HeroReveal>
            <HeroReveal $delay={180}>
              <CtaRowSlot ticker={viewModel.ticker} onToSimulator={() => trackToSimulator('hero')} />
            </HeroReveal>
          </HeroMain>

          {/*
            히어로 지표판 — 4칸 동일 격자를 **주역 하나 + 보조 셋**으로 갈랐다.
            배당 소개 페이지에서 먼저 읽혀야 할 숫자는 하나뿐이고, 넷을 같은 크기로 늘어놓으면 그 하나가 사라진다.
          */}
          {primaryStat ? (
            <HeroMetric>
              <HeroMetricLead>
                <HeroMetricLabel>{primaryStat.label}</HeroMetricLabel>
                <HeroMetricValue>{primaryStat.value}</HeroMetricValue>
                {primaryStat.caption ? <HeroMetricCaption>{primaryStat.caption}</HeroMetricCaption> : null}
              </HeroMetricLead>
              {supportingStats.length > 0 ? (
                <HeroMetricRows>
                  {supportingStats.map((stat) => (
                    <HeroMetricRow key={stat.label}>
                      <HeroMetricRowLabel>{stat.label}</HeroMetricRowLabel>
                      <HeroMetricRowValue>{stat.value}</HeroMetricRowValue>
                    </HeroMetricRow>
                  ))}
                </HeroMetricRows>
              ) : null}
            </HeroMetric>
          ) : null}
        </HeroBody>
      </Hero>

      <Layout>
        <TocAside aria-label="이 페이지 목차">
          <TocHead>
            목차
            <TocCount>{viewModel.sections.length}장</TocCount>
          </TocHead>
          <TocList>
            {viewModel.toc.map((item, order) => {
              const active = activeId === item.id;
              const previous = viewModel.toc[order - 1];
              const startsAppendix = item.kind === 'appendix' && previous?.kind === 'chapter';

              return (
                <Fragment key={item.id}>
                  {startsAppendix ? <TocDivider aria-hidden /> : null}
                  <li>
                    <TocButton
                      type="button"
                      $active={active}
                      aria-current={active ? 'true' : undefined}
                      onClick={() => onNavClick(item.id)}
                    >
                      {/* 🔴 번호는 aria-hidden 이다 — 접근 가능한 이름은 라벨 하나여야 한다
                          ("01 개요"로 읽히면 목록 훑기가 느려지고, 기존 계약도 라벨 단독이다). */}
                      {item.index ? (
                        <TocIndex $active={active} aria-hidden>
                          {item.index}
                        </TocIndex>
                      ) : (
                        <TocDot $active={active} aria-hidden />
                      )}
                      <TocLabel>{item.navLabel}</TocLabel>
                    </TocButton>
                  </li>
                </Fragment>
              );
            })}
          </TocList>
          {/* 긴 문서 어디에서도 다음 행동이 한 화면 안에 있게 하는 상시 진입점(데스크톱). */}
          <TocCta to={SIMULATOR_PATH} onClick={() => trackToSimulator('toc')}>
            시뮬레이터로 계산
            <ArrowRight size={ICON.sm} strokeWidth={ICON.stroke} aria-hidden />
          </TocCta>
        </TocAside>

        <Content>
          {viewModel.sections.map((section, order) => (
            <DetailSection key={section.id} section={section} index={String(order + 1).padStart(2, '0')} />
          ))}

          {/*
            상위 보유 종목 — 종전에는 크롤러가 읽는 서버 HTML(renderTopHoldings)에만 있고 화면에는
            없었다. 합계가 100%가 아니라는 사실을 tfoot 합계 행이 숫자로 직접 말한다.
          */}
          {topHoldings ? (
            <Appendix id="top-holdings" tabIndex={-1} aria-labelledby="top-holdings-heading">
              <AppendixHead>
                <AppendixHeading id="top-holdings-heading">상위 보유 종목</AppendixHeading>
                <AppendixNote>
                  비중이 큰 상위 {topHoldings.count}종입니다. 이 {topHoldings.count}종을 모두 더한 비중은{' '}
                  {topHoldings.coveredWeightDisplay}이며, 나머지 보유 종목은 이 표에 들어 있지 않습니다.
                </AppendixNote>
                {topHoldings.excludedNote ? <AppendixNote>{topHoldings.excludedNote}</AppendixNote> : null}
              </AppendixHead>

              <HoldingsTable>
                <caption>
                  상위 보유 종목 {topHoldings.count}종 (기준일 {topHoldings.asOfDate})
                </caption>
                <thead>
                  <tr>
                    <th scope="col">순위</th>
                    <th scope="col">티커</th>
                    <th scope="col">종목명</th>
                    <th scope="col">비중</th>
                  </tr>
                </thead>
                <tbody>
                  {topHoldings.holdings.map((holding) => (
                    <tr key={holding.symbol}>
                      <HoldingRank>{holding.rank}</HoldingRank>
                      <HoldingSymbol>{holding.symbol}</HoldingSymbol>
                      <HoldingName>{holding.name}</HoldingName>
                      <HoldingWeight>
                        <HoldingWeightValue>{holding.weightDisplay}</HoldingWeightValue>
                        {/* 막대는 표현 보조라 스크린리더에서 숨긴다 — 값은 바로 위 숫자가 말한다. */}
                        <HoldingBar aria-hidden>
                          <HoldingBarFill $percent={holding.barPercent} />
                        </HoldingBar>
                      </HoldingWeight>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3}>상위 {topHoldings.count}종 합계</td>
                    <td>{topHoldings.coveredWeightDisplay}</td>
                  </tr>
                </tfoot>
              </HoldingsTable>

              <SourceLine>
                출처:{' '}
                <a href={topHoldings.sourceUrl} rel="nofollow noopener" target="_blank">
                  {topHoldings.sourceLabel}
                </a>{' '}
                · 기준일 {topHoldings.asOfDate}. 구성과 비중은 리밸런싱과 시세에 따라 계속 달라집니다.
              </SourceLine>
            </Appendix>
          ) : null}

          {hasReferencePanel ? (
            <Appendix id="reference" tabIndex={-1} aria-labelledby="reference-heading">
              <AppendixHead>
                <AppendixHeading id="reference-heading">참고 지표</AppendixHeading>
              </AppendixHead>

              {viewModel.referenceFacts.length > 0 ? (
                <SpecTable>
                  {viewModel.referenceFacts.map((fact) => (
                    <SpecRow key={fact.label}>
                      <SpecLabel>{fact.label}</SpecLabel>
                      <SpecValue>{fact.value}</SpecValue>
                    </SpecRow>
                  ))}
                </SpecTable>
              ) : null}

              {referenceSectors && referenceSectors.length > 0 ? (
                <div>
                  <SectorRankLabel id="sector-rank-label">섹터 비중(큰 순)</SectorRankLabel>
                  <SectorRank aria-labelledby="sector-rank-label">
                    {referenceSectors.map((sector, order) => (
                      <SectorRankItem key={sector}>
                        <SectorRankNumber aria-hidden>{order + 1}</SectorRankNumber>
                        {sector}
                      </SectorRankItem>
                    ))}
                  </SectorRank>
                </div>
              ) : null}

              <AsOfNote>{viewModel.referenceAsOfNote}</AsOfNote>
            </Appendix>
          ) : null}

          {viewModel.faqs.length > 0 ? (
            <Appendix id="faq" tabIndex={-1} aria-labelledby="faq-heading">
              <AppendixHead>
                <AppendixHeading id="faq-heading">자주 묻는 질문</AppendixHeading>
              </AppendixHead>
              <FaqList>
                {viewModel.faqs.map((faq, order) => (
                  <FaqItem key={faq.question}>
                    <FaqSummary>
                      <FaqIndex aria-hidden>Q{order + 1}</FaqIndex>
                      <span>{faq.question}</span>
                    </FaqSummary>
                    <FaqAnswer>{faq.answer}</FaqAnswer>
                  </FaqItem>
                ))}
              </FaqList>
            </Appendix>
          ) : null}

          {/* 관련 티커 블록은 **항상** 선다 — 목록이 비면 허브로 돌아가는 목적지 카드가 그 자리를 대신한다. */}
          <Appendix id="related" tabIndex={-1} aria-labelledby="related-heading">
            <AppendixHead>
              <AppendixHeading id="related-heading">다음에 볼 티커</AppendixHeading>
              <AppendixNote>같은 조건을 다른 방식으로 푸는 티커들입니다. 비교하면 선택 기준이 또렷해집니다.</AppendixNote>
            </AppendixHead>

            {viewModel.relatedTickers.length > 0 ? (
              <PickCardGrid as="ul" minColumnWidth={RELATED_MIN_WIDTH}>
                {viewModel.relatedTickers.map((related) => {
                  const Glyph = glyphFor(related.categoryId);
                  const cap = {
                    kind: 'rail' as const,
                    axis: 'scoped' as const,
                    scopedVar: '--tk-solid',
                    scopedInkVar: '--tk-text',
                    glyph: <Glyph size={ICON.md} strokeWidth={ICON.stroke} />
                  };

                  return (
                    <RelatedScope key={related.ticker} style={relatedVars(related)}>
                      {related.hasContent ? (
                        <RelatedPickCard
                          titleAs="h3"
                          to={`/ticker/${related.slug}`}
                          title={<RelatedSymbol>{related.ticker}</RelatedSymbol>}
                          subtitle={<RelatedKorean>{related.koreanName}</RelatedKorean>}
                          cap={cap}
                        >
                          <RelatedRelation>{related.relationLabel}</RelatedRelation>
                        </RelatedPickCard>
                      ) : (
                        /* 콘텐츠 페이지가 없는 티커는 데드엔드 링크 대신 비링크 카드(서버 렌더러와 일치). */
                        <RelatedStaticCard
                          titleAs="h3"
                          title={<RelatedSymbol>{related.ticker}</RelatedSymbol>}
                          subtitle={<RelatedKorean>{related.koreanName}</RelatedKorean>}
                          titleRight={<RelatedPendingBadge>소개 준비 중</RelatedPendingBadge>}
                          cap={cap}
                        >
                          <RelatedRelation>{related.relationLabel}</RelatedRelation>
                        </RelatedStaticCard>
                      )}
                    </RelatedScope>
                  );
                })}
              </PickCardGrid>
            ) : (
              <RelatedEmpty>
                <RelatedEmptyText>
                  이 티커와 함께 볼 종목은 아직 정리하지 않았습니다. 전체 목록에서 관심 있는 티커를 골라 보세요.
                </RelatedEmptyText>
                <SecondaryCta to="/ticker/all">티커 목록 보기</SecondaryCta>
              </RelatedEmpty>
            )}
          </Appendix>

          <Disclaimer aria-label="투자 고지">
            <DisclaimerText>{viewModel.disclaimer}</DisclaimerText>
            <UpdatedAtLine contentUpdatedAt={viewModel.contentUpdatedAt} />
          </Disclaimer>
        </Content>
      </Layout>

      {/* 다른 화면과 같은 자리·같은 모양의 공용 푸터 — 법무 2링크는 이 지면의 유일한 상시 진입점이다.
          ⚠ 크롤러가 읽는 HTML 은 server/handlers/TickerHtml 이 따로 만든다(이 컴포넌트와 무관). */}
      <PageFooter />
    </AccentScope>
  );
}

/**
 * CTA 두 개.
 *
 * 🔴 `to={SIMULATOR_PATH}` 가 **상수 참조 그대로** 남아야 한다(경로 리터럴로 바꾸지 마라) —
 * `test/seo/machineReadableSurfaces.test.ts` 가 서버 렌더 HTML 과 이 뷰가 **같은 상수**를 가리키는지
 * 소스 문자열로 대조한다(한쪽만 바뀌면 크롤러만 엉뚱한 곳으로 간다).
 */
function CtaRowSlot({ ticker, onToSimulator }: { ticker: string; onToSimulator: () => void }) {
  return (
    <CtaRow>
      <PrimaryCta to={SIMULATOR_PATH} onClick={onToSimulator}>
        {ticker}로 계산해 보기
        <ArrowRight size={ICON.md} strokeWidth={ICON.stroke} aria-hidden />
      </PrimaryCta>
      <SecondaryCta to="/ticker/all">다른 티커 보기</SecondaryCta>
    </CtaRow>
  );
}

function UpdatedAtLine({ contentUpdatedAt }: { contentUpdatedAt: string }) {
  return <UpdatedAt>콘텐츠 작성·검증 시점: {contentUpdatedAt}</UpdatedAt>;
}
