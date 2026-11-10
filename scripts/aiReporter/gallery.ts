import { DIVIDEND_UNIVERSE } from '@/shared/constants/presets';
import { buildScenarioSimSummary, defaultYieldFormValues } from '@/shared/lib/snowball';
import { formatKoreanWon } from '@/shared/utils';
import { renderTable } from './html';
import type { ReporterFacts } from './types';

/**
 * 배당 계산 갤러리(`/community/portfolio`) 글 — AI 리포터가 **포트폴리오 하나**를 소개한다(2026-11-10).
 *
 * 글 = 시뮬레이터 시나리오(payload) + 앱과 같은 엔진으로 구운 결과 요약(sim_summary) + 짧은 소개.
 * 갤러리 카드·상세가 결과 숫자를 sim_summary 로 보여 주므로, 본문(LLM)은 **결과 숫자를 쓰지 않는다** —
 * 왜 이 조합인지, 어떤 사람에게 맞는 구성인지를 말한다(갤러리 글 규칙: 소개 톤, 결과 숫자 미기재).
 * 본문에 쓸 수 있는 숫자는 입력(비중·배당률·성장률·투자 조건)뿐이다(`numbers`).
 *
 * ## 전략 목록은 사람이 고른다
 * 종목 조합과 투자 조건은 아래 `GALLERY_STRATEGIES` 에 고정해 둔다 — 조합을 LLM 이 즉석에서 짜면
 * 근거 없는 포트폴리오가 "AI 추천"처럼 보인다. 종목 수치(배당률·성장률·주가)는 늘 저장소의 최신 시세다.
 * 한 전략은 시세 기준일마다 한 번만 쓴다(factKey 에 기준일이 들어간다).
 */

export type GalleryHolding = { readonly ticker: string; readonly weight: number };

export type GalleryStrategy = {
  readonly id: string;
  /** 글감 — 이 조합의 의도(한 문장). LLM 이 소개의 중심으로 쓴다. */
  readonly concept: string;
  /** 어떤 사람을 위한 구성인지(한 문장). */
  readonly audience: string;
  readonly holdings: readonly GalleryHolding[];
  readonly initialInvestment: number;
  readonly monthlyContribution: number;
  readonly durationYears: number;
  readonly targetMonthlyDividend: number;
};

const MAN = 10_000;

export const GALLERY_STRATEGIES: readonly GalleryStrategy[] = [
  {
    id: 'dividend-growth-trio',
    concept: '배당 성장 ETF 세 개를 섞어 한 종목의 방법론에 기대지 않는 구성',
    audience: '20년 이상 적립하며 배당이 자라는 것을 기다릴 수 있는 사람',
    holdings: [
      { ticker: 'SCHD', weight: 40 },
      { ticker: 'DGRO', weight: 30 },
      { ticker: 'VIG', weight: 30 }
    ],
    initialInvestment: 2000 * MAN,
    monthlyContribution: 100 * MAN,
    durationYears: 20,
    targetMonthlyDividend: 150 * MAN
  },
  {
    id: 'income-barbell',
    concept: '지금 받는 배당(커버드콜)과 자라는 배당(배당 성장)을 반씩 나눈 바벨 구성',
    audience: '당장의 현금흐름과 10년 뒤의 배당을 둘 다 놓치고 싶지 않은 사람',
    holdings: [
      { ticker: 'SCHD', weight: 50 },
      { ticker: 'JEPI', weight: 50 }
    ],
    initialInvestment: 5000 * MAN,
    monthlyContribution: 100 * MAN,
    durationYears: 15,
    targetMonthlyDividend: 200 * MAN
  },
  {
    id: 'monthly-paycheck',
    concept: '세 종목 모두 매달 배당을 주는 월급형 구성',
    audience: '목돈을 넣고 추가 적립 없이 매달 생활비를 받으려는 은퇴 직전·직후의 사람',
    holdings: [
      { ticker: 'O', weight: 30 },
      { ticker: 'JEPI', weight: 40 },
      { ticker: 'DIVO', weight: 30 }
    ],
    initialInvestment: 30000 * MAN,
    monthlyContribution: 0,
    durationYears: 10,
    targetMonthlyDividend: 150 * MAN
  },
  {
    id: 'consumer-aristocrats',
    concept: '수십 년 배당을 늘려 온 생활소비재·헬스케어 대형주 네 개를 같은 비중으로',
    audience: 'ETF 대신 이름을 아는 회사를 직접 들고 싶은 장기 투자자',
    holdings: [
      { ticker: 'KO', weight: 25 },
      { ticker: 'PG', weight: 25 },
      { ticker: 'JNJ', weight: 25 },
      { ticker: 'PEP', weight: 25 }
    ],
    initialInvestment: 3000 * MAN,
    monthlyContribution: 50 * MAN,
    durationYears: 25,
    targetMonthlyDividend: 100 * MAN
  },
  {
    id: 'high-yield-core',
    concept: '고배당 ETF 세 개로 배당률과 분산을 함께 잡는 구성',
    audience: '배당률은 높게, 개별 종목 위험은 낮게 가져가고 싶은 사람',
    holdings: [
      { ticker: 'VYM', weight: 40 },
      { ticker: 'HDV', weight: 30 },
      { ticker: 'SPYD', weight: 30 }
    ],
    initialInvestment: 10000 * MAN,
    monthlyContribution: 100 * MAN,
    durationYears: 15,
    targetMonthlyDividend: 200 * MAN
  },
  {
    id: 'first-paycheck-schd',
    concept: '초기 투자금 없이 월급에서 매달 떼어 한 종목에만 쌓는 가장 단순한 시작',
    audience: '사회초년생처럼 목돈은 없고 시간이 많은 사람',
    holdings: [{ ticker: 'SCHD', weight: 100 }],
    initialInvestment: 0,
    monthlyContribution: 50 * MAN,
    durationYears: 30,
    targetMonthlyDividend: 100 * MAN
  },
  {
    id: 'global-dividend',
    concept: '미국 배당주에 해외 배당 ETF를 섞어 한 나라에 몰리지 않게 한 구성',
    audience: '미국 비중이 너무 높은 것이 걱정되는 사람',
    holdings: [
      { ticker: 'SCHD', weight: 50 },
      { ticker: 'VYMI', weight: 30 },
      { ticker: 'SCHY', weight: 20 }
    ],
    initialInvestment: 3000 * MAN,
    monthlyContribution: 70 * MAN,
    durationYears: 20,
    targetMonthlyDividend: 120 * MAN
  },
  {
    id: 'tech-dividend-growth',
    concept: '배당률은 낮지만 배당을 빠르게 늘려 온 기술주에 배당 성장 ETF를 받친 구성',
    audience: '지금 배당보다 20년 뒤 배당의 크기가 중요한 사람',
    holdings: [
      { ticker: 'MSFT', weight: 20 },
      { ticker: 'AVGO', weight: 20 },
      { ticker: 'TXN', weight: 20 },
      { ticker: 'SCHD', weight: 40 }
    ],
    initialInvestment: 2000 * MAN,
    monthlyContribution: 80 * MAN,
    durationYears: 25,
    targetMonthlyDividend: 150 * MAN
  },
  {
    id: 'reit-blend',
    concept: '부동산 배당(리츠)을 배당 성장 ETF와 섞어 월 현금흐름과 성장을 같이 노리는 구성',
    audience: '부동산에서 나오는 임대 수익 같은 배당을 일부 갖고 싶은 사람',
    holdings: [
      { ticker: 'O', weight: 35 },
      { ticker: 'VNQ', weight: 25 },
      { ticker: 'SCHD', weight: 40 }
    ],
    initialInvestment: 5000 * MAN,
    monthlyContribution: 50 * MAN,
    durationYears: 20,
    targetMonthlyDividend: 150 * MAN
  },
  {
    id: 'energy-and-staples',
    concept: '에너지 대형주와 필수소비재를 섞어 경기와 물가에 덜 흔들리는 배당을 노리는 구성',
    audience: '배당 지급 이력이 긴 개별 대형주를 업종별로 나눠 들고 싶은 사람',
    holdings: [
      { ticker: 'XOM', weight: 25 },
      { ticker: 'CVX', weight: 25 },
      { ticker: 'KO', weight: 25 },
      { ticker: 'PEP', weight: 25 }
    ],
    initialInvestment: 5000 * MAN,
    monthlyContribution: 50 * MAN,
    durationYears: 20,
    targetMonthlyDividend: 150 * MAN
  }
];

type UniverseEntry = {
  readonly ticker: string;
  readonly name: string;
  readonly initialPrice: number;
  readonly dividendYield: number;
  readonly dividendGrowth: number;
  readonly expectedTotalReturn: number;
  readonly frequency: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
};

const universe = DIVIDEND_UNIVERSE as unknown as Readonly<Record<string, UniverseEntry>>;

const FREQUENCY_KO = { monthly: '매월', quarterly: '분기', semiannual: '반기', annual: '연 1회' } as const;

const pct = (value: number): string => `${Number(value.toFixed(2))}%`;

/** 투자 시작일 — 시세 기준일이 속한 달의 1일. 같은 키로 언제 다시 만들어도 같은 날짜가 나온다. */
const startDateOf = (asOf: string): string => (/^\d{4}-\d{2}/.test(asOf) ? `${asOf.slice(0, 7)}-01` : defaultYieldFormValues.investmentStartDate);

/** 전략 → 시나리오 payload(`{ portfolio, investmentSettings }`) — 앱이 갤러리에 올리는 것과 같은 모양. */
export const buildStrategyPayload = (strategy: GalleryStrategy, asOf: string) => {
  const profiles = strategy.holdings.map((holding) => {
    const entry = universe[holding.ticker];
    if (!entry) throw new Error(`갤러리 전략 ${strategy.id}: 시뮬레이터가 모르는 종목 ${holding.ticker}`);
    return {
      id: holding.ticker.toLowerCase(),
      ticker: entry.ticker,
      name: entry.name,
      initialPrice: entry.initialPrice,
      dividendYield: entry.dividendYield,
      dividendGrowth: entry.dividendGrowth,
      expectedTotalReturn: entry.expectedTotalReturn,
      frequency: entry.frequency
    };
  });

  return {
    portfolio: {
      tickerProfiles: profiles,
      includedTickerIds: profiles.map((profile) => profile.id),
      weightByTickerId: Object.fromEntries(strategy.holdings.map((holding) => [holding.ticker.toLowerCase(), holding.weight])),
      fixedByTickerId: {},
      selectedTickerId: null,
      reinvestPercentByTickerId: {},
      reinvestTargetByTickerId: {}
    },
    investmentSettings: {
      initialInvestment: strategy.initialInvestment,
      monthlyContribution: strategy.monthlyContribution,
      targetMonthlyDividend: strategy.targetMonthlyDividend,
      investmentStartDate: startDateOf(asOf),
      durationYears: strategy.durationYears,
      reinvestDividends: true,
      reinvestDividendPercent: 100,
      reinvestTiming: defaultYieldFormValues.reinvestTiming,
      dpsGrowthMode: defaultYieldFormValues.dpsGrowthMode,
      showQuickEstimate: false,
      showSplitGraphs: false,
      isResultCompact: false,
      isYearlyAreaFillOn: true,
      showPortfolioDividendCenter: true,
      visibleYearlySeries: {
        totalContribution: true,
        assetValue: true,
        annualDividend: false,
        monthlyDividend: false,
        cumulativeDividend: false
      }
    }
  };
};

/** 한 전략의 갤러리 글 재료. 종목이 시세 데이터에서 빠졌거나 계산이 안 되면 null. */
export const buildGalleryPortfolioFacts = (strategyId: string, asOf: string): ReporterFacts | null => {
  const strategy = GALLERY_STRATEGIES.find((item) => item.id === strategyId);
  if (!strategy || strategy.holdings.some((holding) => !universe[holding.ticker])) return null;

  const payload = buildStrategyPayload(strategy, asOf);
  const simSummary = buildScenarioSimSummary(payload);
  if (!simSummary) return null;

  const totalWeight = strategy.holdings.reduce((sum, holding) => sum + holding.weight, 0);
  const rows = strategy.holdings.map((holding) => ({ holding, entry: universe[holding.ticker]! }));
  const weighted = (pick: (entry: UniverseEntry) => number) =>
    rows.reduce((sum, row) => sum + pick(row.entry) * row.holding.weight, 0) / totalWeight;
  const avgYield = weighted((entry) => entry.dividendYield);
  const avgGrowth = weighted((entry) => entry.dividendGrowth);
  const won = (value: number) => (value === 0 ? '0원' : formatKoreanWon(value));

  const tablesHtml =
    (rows.length >= 2
      ? renderTable({
          caption: '종목 비중',
          chart: 'bar',
          head: ['종목', '비중'],
          rows: rows.map(({ holding }) => [holding.ticker, `${holding.weight}%`])
        })
      : '') +
    renderTable({
      caption: '종목 정보',
      head: ['종목', '배당률', '배당 성장', '지급'],
      rows: rows.map(({ entry }) => [entry.ticker, pct(entry.dividendYield), pct(entry.dividendGrowth), FREQUENCY_KO[entry.frequency]])
    }) +
    renderTable({
      caption: '투자 조건',
      head: ['항목', '값'],
      rows: [
        ['초기 투자금', won(strategy.initialInvestment)],
        ['월 적립', won(strategy.monthlyContribution)],
        ['기간', `${strategy.durationYears}년`],
        ['목표 월 배당(세후)', won(strategy.targetMonthlyDividend)],
        ['배당 재투자', '100%']
      ]
    });

  const tickers = rows.map(({ entry }) => entry.ticker).join(' · ');
  return {
    topic: 'gallery-portfolio',
    factKey: `gallery-portfolio:${strategy.id}:${asOf}`,
    asOf,
    sourceNote: `종목 수치는 ${asOf} 시세 기준. 결과는 시뮬레이터 계산이며 배당률·성장률이 그대로라는 가정의 예시`,
    numbers: [
      ...rows.flatMap(({ holding, entry }) => [`${holding.weight}%`, pct(entry.dividendYield), pct(entry.dividendGrowth)]),
      pct(avgYield),
      pct(avgGrowth),
      won(strategy.initialInvestment),
      won(strategy.monthlyContribution),
      won(strategy.targetMonthlyDividend),
      `${strategy.durationYears}년`,
      `${rows.length}개`,
      '100%'
    ],
    highlights: [
      `구성: ${tickers} — ${strategy.concept}`,
      `이런 사람을 위한 구성: ${strategy.audience}`,
      `비중을 반영한 평균 배당률 ${pct(avgYield)}, 평균 배당 성장 ${pct(avgGrowth)}`,
      `초기 ${won(strategy.initialInvestment)}, 월 ${won(strategy.monthlyContribution)} 적립, ${strategy.durationYears}년, 배당 100% 재투자`
    ],
    tablesHtml,
    links: [],
    category: null,
    attachment: { kind: 'portfolio', payload, simSummary }
  };
};

/** 아직 다루지 않은(이번 시세 기준일에) 다음 전략. 다 썼으면 가장 오래전에 쓴 것부터 다시. */
export const pickNextGalleryStrategy = (usedFactKeys: readonly string[], asOf: string): string => {
  const usedIds = usedFactKeys.filter((key) => key.startsWith('gallery-portfolio:')).map((key) => key.split(':')[1]);
  const fresh = GALLERY_STRATEGIES.find((strategy) => !usedFactKeys.includes(`gallery-portfolio:${strategy.id}:${asOf}`) && !usedIds.includes(strategy.id));
  if (fresh) return fresh.id;
  // 전부 한 번씩 썼다 — 마지막으로 쓴 지 가장 오래된 것부터 다시(시세 기준일이 바뀌면 키가 새롭다).
  const lastUse = new Map<string, number>();
  usedIds.forEach((id, index) => id && lastUse.set(id, index));
  return [...GALLERY_STRATEGIES].sort((a, b) => (lastUse.get(a.id) ?? -1) - (lastUse.get(b.id) ?? -1))[0]!.id;
};
