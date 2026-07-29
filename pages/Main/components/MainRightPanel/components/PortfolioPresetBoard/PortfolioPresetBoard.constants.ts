// per-icon named import(트리셰이킹) → 추천 포트폴리오 카드의 이모지를 lucide 아이콘으로 교체.
import {
  Banknote,
  Building2,
  CalendarDays,
  Cpu,
  Crown,
  Globe,
  Landmark,
  Layers,
  PiggyBank,
  Scale,
  Shield,
  Sprout,
  TrendingUp,
  type LucideIcon
} from 'lucide-react';

export const PORTFOLIO_PRESET_PLACEHOLDERS = [
  {
    id: 'warren-buffett-style',
    title: '워렌 버핏 스타일',
    hook: '우량 기업 중심의 장기 복리 전략',
    coreType: 'SCHD, VIG, PG, KO, JNJ, ABBV',
    style: '안정형',
    target: '장기 보유 투자자',
    allocations: [
      { ticker: 'SCHD', weight: 30 },
      { ticker: 'VIG', weight: 20 },
      { ticker: 'PG', weight: 15 },
      { ticker: 'KO', weight: 15 },
      { ticker: 'JNJ', weight: 10 },
      { ticker: 'ABBV', weight: 10 }
    ],
    monthlyInvestment: '100만원',
    targetInvestment: '2억',
    investmentPeriod: '12~15년',
    expectedMonthlyDividend: '약 40~50만원',
    monthlyContributionValue: 1_000_000,
    durationYearsValue: 13,
    targetMonthlyDividendValue: 450_000
  },
  {
    id: 'cashflow-now',
    title: '당장 현금흐름',
    hook: '매달 배당 받는 월 인컴 전략',
    coreType: 'JEPI, JEPQ, QYLD, O, ENB',
    style: '인컴형',
    target: '은퇴자 / 세컨드 인컴',
    allocations: [
      { ticker: 'JEPI', weight: 30 },
      { ticker: 'JEPQ', weight: 20 },
      { ticker: 'QYLD', weight: 15 },
      { ticker: 'O', weight: 20 },
      { ticker: 'ENB', weight: 15 }
    ],
    monthlyInvestment: '200만원',
    targetInvestment: '2억',
    investmentPeriod: '6~8년',
    expectedMonthlyDividend: '약 110~130만원',
    monthlyContributionValue: 2_000_000,
    durationYearsValue: 7,
    targetMonthlyDividendValue: 1_200_000
  },
  {
    id: 'stable-dividend-growth',
    title: '안정적 배당성장',
    hook: '꾸준히 배당이 증가하는 ETF 중심',
    coreType: 'SCHD, DGRO, DGRW, NOBL',
    style: '성장+안정',
    target: '초중급 투자자',
    allocations: [
      { ticker: 'SCHD', weight: 40 },
      { ticker: 'DGRO', weight: 25 },
      { ticker: 'DGRW', weight: 20 },
      { ticker: 'NOBL', weight: 15 }
    ],
    monthlyInvestment: '150만원',
    targetInvestment: '3억',
    investmentPeriod: '12년',
    expectedMonthlyDividend: '약 70~90만원',
    monthlyContributionValue: 1_500_000,
    durationYearsValue: 12,
    targetMonthlyDividendValue: 800_000
  },
  {
    id: 'global-dividend-diversified',
    title: '글로벌 배당 분산',
    hook: '미국 + 해외 배당 ETF 분산',
    coreType: 'SCHD, VIGI, SCHY, VNQI, VYMI',
    style: '분산형',
    target: '환율 리스크 분산 원하는 투자자',
    allocations: [
      { ticker: 'SCHD', weight: 35 },
      { ticker: 'VIGI', weight: 20 },
      { ticker: 'SCHY', weight: 20 },
      { ticker: 'VNQI', weight: 15 },
      { ticker: 'VYMI', weight: 10 }
    ],
    monthlyInvestment: '120만원',
    targetInvestment: '2.5억',
    investmentPeriod: '12년',
    expectedMonthlyDividend: '약 60~75만원',
    monthlyContributionValue: 1_200_000,
    durationYearsValue: 12,
    targetMonthlyDividendValue: 675_000
  },
  {
    id: 'reit-monthly-rent-strategy',
    title: '월세 리츠 전략',
    hook: '부동산 중심 현금흐름 전략',
    coreType: 'O, VICI, SCHH, VNQI, JEPI',
    style: '인컴+리츠',
    target: '부동산 선호 투자자',
    allocations: [
      { ticker: 'O', weight: 35 },
      { ticker: 'VICI', weight: 20 },
      { ticker: 'SCHH', weight: 20 },
      { ticker: 'VNQI', weight: 15 },
      { ticker: 'JEPI', weight: 10 }
    ],
    monthlyInvestment: '180만원',
    targetInvestment: '2억',
    investmentPeriod: '8~10년',
    expectedMonthlyDividend: '약 90~110만원',
    monthlyContributionValue: 1_800_000,
    durationYearsValue: 9,
    targetMonthlyDividendValue: 1_000_000
  },
  {
    id: 'growth-income-balance',
    title: '성장 + 인컴 밸런스',
    hook: '배당과 자본 성장을 동시에',
    coreType: 'SCHD, DGRW, DIVO, VYM, JEPI',
    style: '균형형',
    target: '장기 복리 추구',
    allocations: [
      { ticker: 'SCHD', weight: 35 },
      { ticker: 'DGRW', weight: 20 },
      { ticker: 'DIVO', weight: 20 },
      { ticker: 'VYM', weight: 15 },
      { ticker: 'JEPI', weight: 10 }
    ],
    monthlyInvestment: '150만원',
    targetInvestment: '3억',
    investmentPeriod: '10~12년',
    expectedMonthlyDividend: '약 100만원',
    monthlyContributionValue: 1_500_000,
    durationYearsValue: 11,
    targetMonthlyDividendValue: 1_000_000
  },
  {
    id: 'high-growth-dividend-challenger',
    title: '고성장 배당 챌린저',
    hook: '배당 성장률 높은 종목 중심',
    coreType: 'RDVY, SDVY, LOW, ABBV, SCHD',
    style: '공격형',
    target: '수익 극대화 지향',
    allocations: [
      { ticker: 'RDVY', weight: 30 },
      { ticker: 'SDVY', weight: 25 },
      { ticker: 'LOW', weight: 15 },
      { ticker: 'ABBV', weight: 15 },
      { ticker: 'SCHD', weight: 15 }
    ],
    monthlyInvestment: '130만원',
    targetInvestment: '4억',
    investmentPeriod: '15년',
    expectedMonthlyDividend: '약 120만원',
    monthlyContributionValue: 1_300_000,
    durationYearsValue: 15,
    targetMonthlyDividendValue: 1_200_000
  },
  {
    id: 'retirement-prep',
    title: '은퇴 준비형',
    hook: '은퇴 10년 전 리스크 완화 전략',
    coreType: 'SCHD, JEPI, DGRO, VYM, O',
    style: '점진적 안정',
    target: '은퇴 준비자',
    allocations: [
      { ticker: 'SCHD', weight: 30 },
      { ticker: 'JEPI', weight: 25 },
      { ticker: 'DGRO', weight: 20 },
      { ticker: 'VYM', weight: 15 },
      { ticker: 'O', weight: 10 }
    ],
    monthlyInvestment: '200만원',
    targetInvestment: '3억',
    investmentPeriod: '8~10년',
    expectedMonthlyDividend: '약 110만원',
    monthlyContributionValue: 2_000_000,
    durationYearsValue: 9,
    targetMonthlyDividendValue: 1_100_000
  },
  {
    id: 'dividend-aristocrats-collection',
    title: '배당 귀족 컬렉션',
    hook: '25년 이상 배당 증가 기업 중심',
    coreType: 'NOBL, PG, KO, JNJ, ABBV, LOW',
    style: '초안정형',
    target: '변동성 싫어하는 투자자',
    allocations: [
      { ticker: 'NOBL', weight: 35 },
      { ticker: 'PG', weight: 15 },
      { ticker: 'KO', weight: 15 },
      { ticker: 'JNJ', weight: 15 },
      { ticker: 'ABBV', weight: 10 },
      { ticker: 'LOW', weight: 10 }
    ],
    monthlyInvestment: '100만원',
    targetInvestment: '2억',
    investmentPeriod: '15년',
    expectedMonthlyDividend: '약 45만원',
    monthlyContributionValue: 1_000_000,
    durationYearsValue: 15,
    targetMonthlyDividendValue: 450_000
  },
  {
    id: 'defensive-dividend-etf',
    title: '방어형 배당 ETF',
    hook: '변동성 낮은 고배당 ETF 중심',
    coreType: 'HDV, VYM, SCHD, DGRO',
    style: '방어형',
    target: '보수적 투자자',
    allocations: [
      { ticker: 'HDV', weight: 30 },
      { ticker: 'VYM', weight: 25 },
      { ticker: 'SCHD', weight: 25 },
      { ticker: 'DGRO', weight: 20 }
    ],
    monthlyInvestment: '120만원',
    targetInvestment: '2.5억',
    investmentPeriod: '12년',
    expectedMonthlyDividend: '약 70만원',
    monthlyContributionValue: 1_200_000,
    durationYearsValue: 12,
    targetMonthlyDividendValue: 700_000
  },
  {
    id: 'monthly-dividend-addict',
    title: '월배당 중독자',
    hook: '올 월배당 ETF 구성',
    coreType: 'JEPI, JEPQ, DIVO, IDVO, QDVO, O',
    style: '월 인컴 극대화',
    target: '심리적 현금흐름 선호',
    allocations: [
      { ticker: 'JEPI', weight: 25 },
      { ticker: 'JEPQ', weight: 20 },
      { ticker: 'DIVO', weight: 15 },
      { ticker: 'IDVO', weight: 15 },
      { ticker: 'QDVO', weight: 10 },
      { ticker: 'O', weight: 15 }
    ],
    monthlyInvestment: '250만원',
    targetInvestment: '2억',
    investmentPeriod: '5~7년',
    expectedMonthlyDividend: '약 130~150만원',
    monthlyContributionValue: 2_500_000,
    durationYearsValue: 6,
    targetMonthlyDividendValue: 1_400_000
  },
  {
    id: 'smart-diversification-360',
    title: '올인원 배당 전략',
    hook: '모든 자산군 혼합 입문형',
    coreType: 'SCHD, VYM, JEPI, VIGI, VNQI, DIVO',
    style: '올인원',
    target: '입문자',
    allocations: [
      { ticker: 'SCHD', weight: 30 },
      { ticker: 'VYM', weight: 15 },
      { ticker: 'JEPI', weight: 15 },
      { ticker: 'VIGI', weight: 15 },
      { ticker: 'VNQI', weight: 10 },
      { ticker: 'DIVO', weight: 15 }
    ],
    monthlyInvestment: '150만원',
    targetInvestment: '3억',
    investmentPeriod: '12년',
    expectedMonthlyDividend: '약 90~110만원',
    monthlyContributionValue: 1_500_000,
    durationYearsValue: 12,
    targetMonthlyDividendValue: 1_000_000
  },
  {
    id: 'ai-infra-dividend-growth',
    title: 'AI 인프라 성장형',
    hook: 'AI 반도체, 전력, 데이터센터 인프라 중심',
    coreType: 'SMH, VRT, ETN, NVDA, AVGO, CEG',
    style: '성장형',
    target: 'AI 장기 구조 성장 선호 투자자',
    allocations: [
      { ticker: 'SMH', weight: 25 },
      { ticker: 'VRT', weight: 15 },
      { ticker: 'ETN', weight: 15 },
      { ticker: 'NVDA', weight: 15 },
      { ticker: 'AVGO', weight: 15 },
      { ticker: 'CEG', weight: 15 }
    ],
    monthlyInvestment: '200만원',
    targetInvestment: '3억',
    investmentPeriod: '10~12년',
    expectedMonthlyDividend: '약 55~75만원',
    monthlyContributionValue: 2_000_000,
    durationYearsValue: 11,
    targetMonthlyDividendValue: 650_000
  }
] as const;

/** 카드 한 장(프리셋 정의) — 부모(MainRightPanel)의 `pendingPreset` 상태·적용 콜백이 이 타입을 쓴다. */
export type PortfolioPresetPlaceholder = (typeof PORTFOLIO_PRESET_PLACEHOLDERS)[number];

/**
 * 프리셋 카드 아이콘 — 예전의 이모지(🧓/💸/…)를 성향에 맞는 lucide 아이콘으로 대체한다.
 * 제목 문자열에서 이모지는 제거했으므로(위 데이터), 카드·시나리오 탭 이름 모두 깔끔한 텍스트 + 이 아이콘으로 보인다.
 *
 * 선택 기준: 프리셋의 **전략 성격**을 18px에서도 즉시 읽히는 한 글리프로 — 중복 없이 13개.
 * 클리셰(🚀 로켓, 안락의자)나 작게 그리면 뭉개지는 복합 글리프(CalendarHeart)는 피한다.
 */
export const PRESET_ICON_BY_ID: Record<string, LucideIcon> = {
  'warren-buffett-style': Landmark, // 우량 기관·가치투자의 전당
  'cashflow-now': Banknote, // 당장 손에 쥐는 현금
  'stable-dividend-growth': Sprout, // 꾸준히 자라는 배당
  'global-dividend-diversified': Globe, // 미국 + 해외 분산
  'reit-monthly-rent-strategy': Building2, // 부동산(리츠)
  'growth-income-balance': Scale, // 성장·인컴의 균형
  'high-growth-dividend-challenger': TrendingUp, // 높은 배당 성장률 = 우상향
  'retirement-prep': PiggyBank, // 은퇴 대비 적립
  'dividend-aristocrats-collection': Crown, // 배당 귀족
  'defensive-dividend-etf': Shield, // 방어형
  'monthly-dividend-addict': CalendarDays, // 매달 들어오는 배당
  'smart-diversification-360': Layers, // 모든 자산군을 한 층씩 — 올인원
  'ai-infra-dividend-growth': Cpu // AI 반도체·인프라
};

/** 앱 공용 아이콘 언어와 동일한 라인 두께(CommunityIcons·설정 드로어 인라인 SVG와 같은 1.8). */
export const PRESET_ICON_STROKE = 1.8;

/** id 매핑이 없을 때의 안전 기본 아이콘 (기존 `?? Landmark` 폴백과 동일). */
export const PRESET_ICON_FALLBACK: LucideIcon = Landmark;
