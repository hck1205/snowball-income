import { prefersReducedMotion as sharedPrefersReducedMotion } from '@/shared/utils';
import {
  findTickerContentBySlug,
  renderTickerContentTemplate,
  resolveTickerEngineFacts,
  TICKER_CATEGORY_LABEL,
  type TickerContent,
  type TickerContentStat,
  type TickerReferenceFacts
} from '@/shared/constants/tickers';
import { assignSeries } from '@/shared/lib/tickerSeries';
import type {
  ReferenceFactLine,
  ResolvedCategory,
  ResolvedRelatedTicker,
  ResolvedSection,
  ResolvedStat,
  ResolvedTopHoldings,
  TickerDetailViewModel,
  TocEntry
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

/** 비중 표기 — 서버 렌더러(`formatWeight`)와 같은 규칙(소수 둘째 자리까지, 꼬리 0 제거). */
const formatWeight = (value: number): string => `${Number(value.toFixed(2))}%`;

/**
 * 상위 보유 종목을 표시 모델로 옮긴다. 막대 길이는 **최대 비중을 100 으로 정규화한 상대 길이**다 —
 * 절대 비중을 그대로 폭으로 쓰면 3%짜리 막대가 사실상 보이지 않아 순위 비교가 안 된다.
 * 🔴 숫자 자체(`weightDisplay`)는 공시값 그대로다. 정규화하는 것은 막대 폭뿐이다.
 */
const resolveTopHoldings = (reference: TickerReferenceFacts): ResolvedTopHoldings | undefined => {
  const source = reference.topHoldings;
  if (!source || source.holdings.length === 0) return undefined;

  const maxWeight = Math.max(...source.holdings.map((holding) => holding.weightPercent));

  return {
    count: source.holdings.length,
    coveredWeightDisplay: formatWeight(source.coveredWeightPercent),
    asOfDate: source.asOfDate,
    sourceLabel: source.sourceLabel,
    sourceUrl: source.sourceUrl,
    excludedNote: source.excludedNote,
    holdings: source.holdings.map((holding, index) => ({
      rank: index + 1,
      symbol: holding.symbol,
      name: holding.name,
      weightDisplay: formatWeight(holding.weightPercent),
      barPercent: maxWeight > 0 ? Math.round((holding.weightPercent / maxWeight) * 100) : 0
    }))
  };
};

/** 두 자리 장 번호(`01`…). 10장을 넘겨도 자리수가 늘 뿐 규칙은 같다. */
const chapterIndex = (order: number): string => String(order + 1).padStart(2, '0');

/**
 * `TickerContent`(토큰 원문) + 프리셋 엔진 값 → 뷰가 그대로 그리는 완성 모델.
 *
 * 모든 문자열은 여기서 `renderTickerContentTemplate` 로 한 번에 치환된다. 엔진 숫자를 어디에도
 * 하드코딩하지 않고, 히어로 지표(배당률/성장률/기대수익/주기)도 `resolveTickerEngineFacts` 에서 파생한다.
 *
 * 🔴 목차(`toc`)는 **실제로 렌더되는 블록만** 담는다. 뷰의 조건부 렌더와 이 목록이 갈리면
 * 스크롤스파이가 존재하지 않는 앵커를 관찰하고, 사용자는 눌러도 아무 데도 가지 않는 항목을 본다.
 * 그래서 "부록이 렌더되는가"의 판정을 여기 한 곳에 둔다.
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

  /*
   * 관련 티커 색은 **이 카드 묶음 안에서** 배정한다(허브가 카테고리 격자 단위로 배정하는 것과 같은
   * 논리) — 한 줄에 같은 색이 둘 서는 일이 없다. 액센트가 있는 티커는 자기 액센트가 이긴다.
   */
  const relatedSeries = assignSeries(content.relatedTickers.map((related) => related.ticker));

  const relatedTickers: ResolvedRelatedTicker[] = content.relatedTickers.map((related) => {
    const relatedFacts = resolveTickerEngineFacts(related.ticker);
    const slug = related.ticker.toLowerCase();
    // 서버 렌더러(renderRelatedTickers)와 동일하게, 콘텐츠 페이지가 있는 티커만 링크로 건다.
    const relatedContent = findTickerContentBySlug(slug);
    return {
      ticker: related.ticker,
      slug,
      koreanName: relatedFacts.koreanName,
      relationLabel: related.relationLabel,
      hasContent: relatedContent !== undefined,
      accent: relatedContent?.accent,
      seriesVar: relatedSeries.get(related.ticker) ?? '',
      categoryId: relatedContent?.categoryIds[0]
    };
  });

  const categories: ResolvedCategory[] = content.categoryIds.map((id) => ({
    id,
    label: TICKER_CATEGORY_LABEL[id]
  }));

  const topHoldings = resolveTopHoldings(reference);
  const hasReferencePanel = referenceFacts.length > 0 || (reference.topSectors?.length ?? 0) > 0;

  /* 목차 = 본문 장 + 실제로 렌더되는 부록. 아래 조건은 뷰의 조건부 렌더와 1:1 로 맞물린다. */
  const toc: TocEntry[] = [
    ...sections.map((section, order) => ({
      id: section.id,
      navLabel: section.navLabel,
      kind: 'chapter' as const,
      index: chapterIndex(order)
    })),
    ...(topHoldings ? [{ id: 'top-holdings', navLabel: '보유 종목', kind: 'appendix' as const }] : []),
    ...(hasReferencePanel ? [{ id: 'reference', navLabel: '참고 지표', kind: 'appendix' as const }] : []),
    ...(content.faqs.length > 0 ? [{ id: 'faq', navLabel: '자주 묻는 질문', kind: 'appendix' as const }] : []),
    /* 관련 티커 블록은 목록이 비어도 "허브로 돌아가기" 빈 상태로 항상 선다 — 그래서 조건이 없다. */
    { id: 'related', navLabel: '다음에 볼 티커', kind: 'appendix' as const }
  ];

  return {
    ticker: content.ticker,
    slug: content.slug,
    koreanName: facts.koreanName,
    englishName: facts.englishName,
    heroTagline: render(content.heroTagline),
    categories,
    heroStats,
    sections,
    toc,
    faqs: content.faqs.map((faq) => ({ question: render(faq.question), answer: render(faq.answer) })),
    referenceFacts,
    referenceSectors: reference.topSectors,
    referenceAsOfNote: reference.asOfNote,
    topHoldings,
    relatedTickers,
    accent: content.accent,
    disclaimer: content.disclaimer,
    contentUpdatedAt: content.contentUpdatedAt,
    metaTitle: content.metaTitle,
    metaDescription: content.metaDescription
  };
};

/**
 * 공용 구현(`@/shared/utils`)에 위임한다 — 이름은 유지한다(뷰·`useInView` 가 이 경로로 쓰고 있다).
 */
export const prefersReducedMotion = sharedPrefersReducedMotion;
