import { useCallback, type CSSProperties } from 'react';
import type { ResolvedSection, TickerDetailViewProps } from './TickerDetailPage.types';
import { useInView, useScrollSpy } from './hooks';
import { prefersReducedMotion } from './TickerDetailPage.utils';
import {
  AccentScope,
  AsOfNote,
  Breadcrumb,
  BulletList,
  Content,
  CtaRow,
  Disclaimer,
  DisclaimerText,
  FactGrid,
  FactLabel,
  FactRow,
  FactValue,
  FaqAnswer,
  FaqItem,
  FaqList,
  FaqSummary,
  Hero,
  HeroHead,
  HeroStat,
  HeroStatCaption,
  HeroStatGrid,
  HeroStatLabel,
  HeroStatValue,
  HeroTagline,
  Layout,
  Panel,
  PanelHeading,
  Paragraph,
  HeroReveal,
  RelatedCard,
  RelatedGrid,
  RelatedKorean,
  RelatedRelation,
  RelatedStatic,
  RelatedTicker,
  Section,
  SectionHeading,
  SecondaryCta,
  SectorChip,
  SectorRow,
  StatHighlight,
  StatHighlightCaption,
  StatHighlightLabel,
  StatHighlightValue,
  TickerBadge,
  TickerNames,
  TickerSymbol,
  TocAside,
  TocButton,
  TocList,
  TocTitle,
  UpdatedAt
} from './TickerDetailPage.styled';

/** 뷰포트 진입 시 등장하는 한 섹션. useInView 로 각자 관찰한다(reduced-motion 이면 즉시 표시). */
function DetailSection({ section }: { section: ResolvedSection }) {
  const [ref, revealed] = useInView<HTMLElement>();

  return (
    <Section id={section.id} ref={ref} $revealed={revealed} tabIndex={-1} aria-labelledby={`${section.id}-heading`}>
      <SectionHeading id={`${section.id}-heading`}>{section.heading}</SectionHeading>
      {section.paragraphs.map((paragraph, index) => (
        <Paragraph key={index}>{paragraph}</Paragraph>
      ))}
      {section.bullets && section.bullets.length > 0 ? (
        <BulletList>
          {section.bullets.map((bullet, index) => (
            <li key={index}>{bullet}</li>
          ))}
        </BulletList>
      ) : null}
      {section.stat ? (
        <StatHighlight>
          <StatHighlightValue>{section.stat.value}</StatHighlightValue>
          <StatHighlightLabel>{section.stat.label}</StatHighlightLabel>
          {section.stat.caption ? <StatHighlightCaption>{section.stat.caption}</StatHighlightCaption> : null}
        </StatHighlight>
      ) : null}
    </Section>
  );
}

export default function TickerDetailView({ viewModel }: TickerDetailViewProps) {
  const activeId = useScrollSpy(viewModel.toc.map((item) => item.id));

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

  return (
    <AccentScope data-accent={viewModel.accent ? 'true' : undefined} style={accentVars}>
      <Hero>
        <Breadcrumb aria-label="위치">
          <a href="/ticker/all">티커 전체</a>
          <span aria-hidden="true">/</span>
          <span>{viewModel.ticker}</span>
        </Breadcrumb>
        <HeroReveal $delay={0}>
          <HeroHead>
            <TickerBadge>
              <TickerSymbol>{viewModel.ticker}</TickerSymbol>
              <TickerNames>
                {viewModel.koreanName} · {viewModel.englishName}
              </TickerNames>
            </TickerBadge>
            <HeroTagline>{viewModel.heroTagline}</HeroTagline>
          </HeroHead>
        </HeroReveal>
        {/* 스탯 카드는 HeroReveal 로 감싸지 않고 각자 --card-i 순서대로 stagger 마운트한다. */}
        <HeroStatGrid>
          {viewModel.heroStats.map((stat, index) => (
            <HeroStat key={stat.label} style={{ '--card-i': index } as CSSProperties}>
              <HeroStatLabel>{stat.label}</HeroStatLabel>
              <HeroStatValue>{stat.value}</HeroStatValue>
              {stat.caption ? <HeroStatCaption>{stat.caption}</HeroStatCaption> : null}
            </HeroStat>
          ))}
        </HeroStatGrid>
        <HeroReveal $delay={520}>
          <CtaRow>
            <SecondaryCta to="/ticker/all">다른 티커 보기</SecondaryCta>
          </CtaRow>
        </HeroReveal>
      </Hero>

      <Layout>
        <TocAside aria-label="이 페이지 목차">
          <TocTitle>목차</TocTitle>
          <TocList>
            {viewModel.toc.map((item) => (
              <li key={item.id}>
                <TocButton
                  type="button"
                  $active={activeId === item.id}
                  aria-current={activeId === item.id ? 'true' : undefined}
                  onClick={() => onNavClick(item.id)}
                >
                  {item.navLabel}
                </TocButton>
              </li>
            ))}
          </TocList>
        </TocAside>

        <Content>
          {viewModel.sections.map((section) => (
            <DetailSection key={section.id} section={section} />
          ))}

          {viewModel.referenceFacts.length > 0 || viewModel.referenceSectors ? (
            <Panel aria-labelledby="reference-heading">
              <PanelHeading id="reference-heading">참고 지표</PanelHeading>
              {viewModel.referenceFacts.length > 0 ? (
                <FactGrid>
                  {viewModel.referenceFacts.map((fact) => (
                    <FactRow key={fact.label}>
                      <FactLabel>{fact.label}</FactLabel>
                      <FactValue>{fact.value}</FactValue>
                    </FactRow>
                  ))}
                </FactGrid>
              ) : null}
              {viewModel.referenceSectors && viewModel.referenceSectors.length > 0 ? (
                <SectorRow aria-label="대표 섹터 비중 순서">
                  <FactLabel as="span">섹터 비중(큰 순)</FactLabel>
                  {viewModel.referenceSectors.map((sector) => (
                    <SectorChip key={sector}>{sector}</SectorChip>
                  ))}
                </SectorRow>
              ) : null}
              <AsOfNote>{viewModel.referenceAsOfNote}</AsOfNote>
            </Panel>
          ) : null}

          {viewModel.faqs.length > 0 ? (
            <Panel aria-labelledby="faq-heading">
              <PanelHeading id="faq-heading">자주 묻는 질문</PanelHeading>
              <FaqList>
                {viewModel.faqs.map((faq) => (
                  <FaqItem key={faq.question}>
                    <FaqSummary>{faq.question}</FaqSummary>
                    <FaqAnswer>{faq.answer}</FaqAnswer>
                  </FaqItem>
                ))}
              </FaqList>
            </Panel>
          ) : null}

          {viewModel.relatedTickers.length > 0 ? (
            <Panel aria-labelledby="related-heading">
              <PanelHeading id="related-heading">함께 비교하면 좋은 티커</PanelHeading>
              <RelatedGrid>
                {viewModel.relatedTickers.map((related) =>
                  related.hasContent ? (
                    <RelatedCard key={related.ticker} to={`/ticker/${related.slug}`}>
                      <RelatedTicker>{related.ticker}</RelatedTicker>
                      <RelatedKorean>{related.koreanName}</RelatedKorean>
                      <RelatedRelation>{related.relationLabel}</RelatedRelation>
                    </RelatedCard>
                  ) : (
                    // 콘텐츠 페이지가 없는 티커는 데드엔드 링크 대신 비링크 텍스트(서버 렌더러와 일치).
                    <RelatedStatic key={related.ticker}>
                      <RelatedTicker>{related.ticker}</RelatedTicker>
                      <RelatedKorean>{related.koreanName}</RelatedKorean>
                      <RelatedRelation as="span">{related.relationLabel}</RelatedRelation>
                    </RelatedStatic>
                  )
                )}
              </RelatedGrid>
            </Panel>
          ) : null}

          <Disclaimer>
            <DisclaimerText>{viewModel.disclaimer}</DisclaimerText>
            <UpdatedAt>콘텐츠 작성·검증 시점: {viewModel.contentUpdatedAt}</UpdatedAt>
          </Disclaimer>
        </Content>
      </Layout>
    </AccentScope>
  );
}
