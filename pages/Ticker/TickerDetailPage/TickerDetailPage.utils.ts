import {
  findTickerContentBySlug,
  renderTickerContentTemplate,
  resolveTickerEngineFacts,
  type TickerContent,
  type TickerContentStat
} from '@/shared/constants/tickers';
import type {
  ReferenceFactLine,
  ResolvedSection,
  ResolvedStat,
  TickerDetailViewModel
} from './TickerDetailPage.types';

const renderStat = (
  stat: TickerContentStat | undefined,
  render: (text: string) => string
): ResolvedStat | undefined => {
  if (!stat) return undefined;
  return {
    label: render(stat.label),
    value: render(stat.value),
    caption: stat.caption ? render(stat.caption) : undefined
  };
};

/**
 * `TickerContent`(토큰 원문) + 프리셋 엔진 값 → 뷰가 그대로 그리는 완성 모델.
 *
 * 모든 문자열은 여기서 `renderTickerContentTemplate` 로 한 번에 치환된다. 엔진 숫자를 어디에도
 * 하드코딩하지 않고, 히어로 지표(배당률/성장률/기대수익/주기)도 `resolveTickerEngineFacts` 에서 파생한다.
 */
export const buildTickerDetailViewModel = (content: TickerContent): TickerDetailViewModel => {
  const facts = resolveTickerEngineFacts(content.ticker);
  const render = (text: string) => renderTickerContentTemplate(text, facts);

  const heroStats: ResolvedStat[] = [
    { label: '배당률(세전, 명목)', value: facts.dividendYieldDisplay, caption: '주가에 따라 매일 변동' },
    { label: '연 배당성장률(계산 가정)', value: facts.dividendGrowthDisplay, caption: '기대 총수익 − 배당률' },
    { label: '기대 총수익률(가정)', value: facts.expectedTotalReturnDisplay, caption: '가격성장 + 배당' },
    { label: '배당 지급 주기', value: facts.frequencyLabel, caption: '지급 시점에 재투자 가정' }
  ];

  const sections: ResolvedSection[] = content.sections.map((section) => ({
    id: section.id,
    navLabel: render(section.navLabel),
    heading: render(section.heading),
    paragraphs: section.paragraphs.map(render),
    bullets: section.bullets?.map(render),
    stat: renderStat(section.stat, render)
  }));

  const { reference } = content;
  const referenceFacts: ReferenceFactLine[] = [];
  if (reference.trackedIndex) referenceFacts.push({ label: '추종 지수', value: reference.trackedIndex });
  if (reference.inceptionYear) referenceFacts.push({ label: '상장 연도', value: `${reference.inceptionYear}년` });
  if (reference.expenseRatioPercent !== undefined) {
    referenceFacts.push({ label: '운용보수(총보수)', value: `${reference.expenseRatioPercent}%` });
  }
  if (reference.holdingsCountApprox) {
    referenceFacts.push({ label: '보유 종목 수', value: `약 ${reference.holdingsCountApprox}종` });
  }
  if (reference.paymentMonthsNote) referenceFacts.push({ label: '지급 스케줄', value: reference.paymentMonthsNote });
  if (reference.consecutiveGrowthYearsApprox) {
    referenceFacts.push({ label: '연속 배당성장', value: `약 ${reference.consecutiveGrowthYearsApprox}년` });
  }
  if (reference.historicalDividendCagrPercent !== undefined) {
    referenceFacts.push({ label: '과거 배당성장 CAGR(근사)', value: `약 ${reference.historicalDividendCagrPercent}%대` });
  }

  const relatedTickers = content.relatedTickers.map((related) => {
    const relatedFacts = resolveTickerEngineFacts(related.ticker);
    const slug = related.ticker.toLowerCase();
    return {
      ticker: related.ticker,
      slug,
      koreanName: relatedFacts.koreanName,
      relationLabel: related.relationLabel,
      // 서버 렌더러(renderRelatedTickers)와 동일하게, 콘텐츠 페이지가 있는 티커만 링크로 건다.
      hasContent: findTickerContentBySlug(slug) !== undefined
    };
  });

  return {
    ticker: content.ticker,
    slug: content.slug,
    koreanName: facts.koreanName,
    englishName: facts.englishName,
    heroTagline: render(content.heroTagline),
    heroStats,
    sections,
    toc: sections.map((section) => ({ id: section.id, navLabel: section.navLabel })),
    faqs: content.faqs.map((faq) => ({ question: render(faq.question), answer: render(faq.answer) })),
    referenceFacts,
    referenceSectors: reference.topSectors,
    referenceAsOfNote: reference.asOfNote,
    relatedTickers,
    accent: content.accent,
    disclaimer: content.disclaimer,
    contentUpdatedAt: content.contentUpdatedAt,
    metaTitle: content.metaTitle,
    metaDescription: content.metaDescription
  };
};

/** matchMedia 가 없거나(SSR/구형) reduce 선호가 아니면 false. */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};
