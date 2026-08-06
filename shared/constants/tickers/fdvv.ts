import type { TickerContent } from './TickerContent.types';

/**
 * FDVV(피델리티 고배당 ETF) SEO 랜딩 콘텐츠 — 대형·중형주 중 배당 성장 여력을 함께 스크리닝하는
 * 고배당 ETF. 업계 최저 수준 보수(0.15%)가 이 페이지의 핵심 차별점이다.
 *
 * 숫자 출처:
 * - 계산 6필드는 `shared/constants/presets`(`US_HIGH_DIVIDEND_ETFS.FDVV`)에서 그대로 온다.
 * - 상장일(2016년 9월 12일)·총보수(0.15%)·추종지수(Fidelity High Dividend Index)·
 *   보유종목수(약 112종)는 stockanalysis.com·복수 소스로 2026년 8월 교차 확인.
 */
export const FDVV_TICKER_CONTENT: TickerContent = {
  ticker: 'FDVV',
  slug: 'fdvv',
  categoryIds: ['high-dividend'],
  metaTitle: 'FDVV 배당률·운용보수·구성 총정리 — 피델리티 고배당 ETF',
  metaDescription:
    'FDVV(피델리티 고배당 ETF)의 배당률·운용보수 0.15%·배당 성장 여력 스크리닝을 정리했습니다. 낮은 보수로 고배당과 성장 가능성을 함께 담고 싶다면 여기서 확인하세요.',
  heroTagline: '지금의 배당률과 앞으로 늘어날 여력을 함께 보는, 업계 최저 수준 보수의 고배당 ETF',
  sections: [
    {
      id: 'overview',
      navLabel: '개요',
      heading: 'FDVV, 무엇을 추종하는 ETF인가',
      paragraphs: [
        'FDVV(피델리티 고배당 ETF, {{englishName}})는 2016년 9월 12일 상장한 ETF로, Fidelity High Dividend Index를 추종합니다. 배당을 지급하는 미국 대형·중형주 중 배당률과 함께 향후 배당 성장 여력까지 함께 스크리닝합니다.',
        '단순히 지금 배당률이 높은 종목만 모으는 것이 아니라, 배당을 계속 지급하고 늘려갈 것으로 기대되는 기업을 함께 고려한다는 점이 지수 설계의 핵심입니다.',
        '{{koreanName}}는 이 시뮬레이터의 계산 프리셋에서 배당률 {{dividendYield}}, 연 배당성장률(가정) {{dividendGrowth}}, {{frequencyLabel}} 지급을 기준으로 합니다.'
      ],
      stat: {
        label: '추종 지수',
        value: 'Fidelity High Dividend Index',
        caption: '배당률과 함께 향후 배당 지속·성장 가능성을 스크리닝하는 지수'
      }
    },
    {
      id: 'dividend-yield',
      navLabel: '배당률',
      heading: '배당률 {{dividendYield}}, 지속가능성을 함께 본 결과',
      paragraphs: [
        'FDVV의 배당률은 {{dividendYield}} 안팎입니다. 지수가 배당률뿐 아니라 향후 배당을 계속 지급·성장시킬 것으로 기대되는 기업을 함께 스크리닝하기 때문에, 극단적으로 배당률만 높은 종목보다는 균형 잡힌 수준으로 형성되는 경향이 있습니다.',
        '이 균형은 SPYD처럼 배당률 자체를 최우선으로 삼는 지수와 대비됩니다. FDVV는 "지금 배당이 많은가"와 "앞으로도 배당을 유지·성장시킬 수 있는가"를 함께 판단하려는 설계입니다.',
        '배당률은 주가에 따라 매일 움직이는 값이라, 이 페이지의 숫자는 작성 시점 기준입니다. 내 조건에서의 실제 현금흐름은 시뮬레이터에서 직접 계산해 보세요.'
      ],
      stat: {
        label: '배당률(세전, 명목)',
        value: '{{dividendYield}}',
        caption: '시뮬레이터 계산 프리셋 기준 — 실제 배당률은 주가에 따라 매일 변동합니다'
      }
    },
    {
      id: 'dividend-growth',
      navLabel: '배당성장',
      heading: '고배당과 성장 여력을 동시에 겨냥한 절충안',
      paragraphs: [
        '이 시뮬레이터의 계산 프리셋은 FDVV의 연 배당성장률(가정)을 {{dividendGrowth}}, 기대 총수익률을 {{expectedTotalReturn}}로 둡니다. 순수 고배당 ETF보다는 성장률 가정이 조금 높게, 순수 배당성장 ETF보다는 배당률이 조금 높게 잡히는 절충적 위치입니다.',
        '지수가 배당 성장 여력을 함께 스크리닝한다는 점은 SCHD의 재무 건전성 접근과 방향이 비슷하지만, FDVV는 여전히 배당률 자체도 편입 기준에 포함한다는 점에서 순수 배당성장 ETF와는 다릅니다.',
        '이 절충이 항상 최선의 결과로 이어진다는 보장은 없습니다. 배당률과 성장 여력 두 기준을 동시에 만족시키려다 어느 한쪽에서도 최상위권은 아닌 종목들이 섞일 수 있습니다.'
      ],
      stat: {
        label: '연 배당성장률(계산 가정)',
        value: '{{dividendGrowth}}',
        caption: '기대 총수익 {{expectedTotalReturn}}에서 배당률을 뺀 시뮬레이터의 가정치입니다'
      }
    },
    {
      id: 'expense-ratio',
      navLabel: '운용보수',
      heading: '총보수 0.15% — 이 시뮬레이터의 고배당 ETF 중 최저 수준',
      paragraphs: [
        'FDVV의 총보수는 0.15%로, 이 시뮬레이터가 다루는 고배당 ETF 가운데 SCHD·VYM(0.06%)보다는 높지만 DVY(0.38%)·SPYD(0.07%)와 비교해도 경쟁력 있는 낮은 수준입니다.',
        '피델리티는 자체 지수를 만들어 운용함으로써 지수 라이선스 비용을 절감하고, 그 절감분을 낮은 보수로 투자자에게 돌려주는 전략을 씁니다. FDVV도 이 전략의 연장선에 있습니다.',
        '보수가 낮을수록 배당을 재투자할 때 원금이 더 온전히 남는다는 점에서, 장기 투자자에게는 이 낮은 보수가 실질적인 차이를 만듭니다.'
      ],
      stat: {
        label: '운용보수(총보수)',
        value: '0.15%',
        caption: 'stockanalysis.com·복수 소스 교차 확인(2026년 8월 기준)'
      }
    },
    {
      id: 'selection-criteria',
      navLabel: '구성 기준',
      heading: '배당률과 성장 여력을 함께 채점한다',
      paragraphs: [
        'FDVV가 추종하는 지수는 미국 대형·중형주 중 배당을 지급하는 기업을 대상으로, 배당률과 함께 배당 지속·성장 가능성을 나타내는 재무 지표를 함께 채점해 상위 종목을 담습니다.',
        '2026년 8월 기준 약 112종을 담고 있으며, 이는 SCHD(약 100종)와 비슷한 수준이지만 HDV(약 75종)보다는 많습니다. 특정 소수 종목에 대한 의존도가 상대적으로 낮은 편입니다.',
        '연 1회 이상 재구성되며, 배당률·성장 여력 두 기준을 더 이상 만족하지 못하는 종목은 편출됩니다.'
      ]
    },
    {
      id: 'who-and-tradeoffs',
      navLabel: '적합성·트레이드오프',
      heading: '어떤 투자자에게 맞고, 무엇을 포기하는가',
      paragraphs: [
        'FDVV는 이런 투자자에게 맞습니다. 낮은 보수로 고배당과 성장 여력을 함께 담고 싶은 사람, 순수 고배당도 순수 배당성장도 아닌 절충된 접근을 원하는 사람, 단일 지수 제공사(피델리티)의 자체 지수 전략을 신뢰하는 사람입니다.',
        '포기하는 것도 있습니다. 첫째, 순수 고배당 ETF(SPYD)보다 배당률이 낮습니다. 둘째, 순수 배당성장 ETF(SCHD)보다 성장률 가정이 낮습니다. 셋째, 절충안이라 어느 한쪽 기준에서도 최상위권은 아닐 수 있습니다.',
        '지금 당장의 배당률을 최우선으로 한다면 SPYD, 배당성장에 무게를 둔다면 SCHD·VIG와 함께 비교해 보세요.'
      ]
    }
  ],
  faqs: [
    {
      question: 'FDVV 배당률은 얼마인가요?',
      answer:
        '이 시뮬레이터가 쓰는 계산 프리셋 기준 FDVV의 명목 배당률(세전)은 {{dividendYield}}입니다. 배당률과 배당 성장 여력을 함께 스크리닝하는 지수라 극단적인 고배당보다는 균형 잡힌 수준으로 형성됩니다.'
    },
    {
      question: 'FDVV는 어떤 지수를 추종하나요?',
      answer:
        'Fidelity High Dividend Index를 추종합니다. 배당률과 함께 향후 배당 지속·성장 가능성을 나타내는 재무 지표를 함께 채점해 종목을 선별하는 피델리티 자체 지수입니다.'
    },
    {
      question: 'FDVV 운용보수(총보수)는 얼마인가요?',
      answer: '0.15%로, 이 시뮬레이터가 다루는 고배당 ETF 가운데서도 경쟁력 있는 낮은 수준입니다.'
    },
    {
      question: 'FDVV는 몇 종목을 담고 있나요?',
      answer: '2026년 8월 기준 약 112종을 담고 있습니다. 연 1회 이상 재구성됩니다.'
    },
    {
      question: 'FDVV 배당은 얼마나 자주 지급되나요?',
      answer: 'FDVV는 {{frequencyLabel}} 지급됩니다. 정확한 배당락일·지급일은 매 분기 공지에 따라 달라질 수 있습니다.'
    },
    {
      question: 'FDVV와 SCHD는 무엇이 다른가요?',
      answer:
        'SCHD는 재무 건전성 점수로 종목을 걸러내 배당률은 낮지만 성장률 가정이 높습니다. FDVV는 배당률 자체도 편입 기준에 포함해 배당률이 조금 더 높은 대신 성장률 가정은 조금 낮습니다.'
    },
    {
      question: 'FDVV 배당에 붙는 세금은 어떻게 계산하나요?',
      answer:
        '배당소득세는 거주 국가와 계좌 종류에 따라 달라지며 이 페이지가 대신 알려드릴 수 없습니다. 이 시뮬레이터에서는 세율을 직접 입력해 세후 배당을 계산해 볼 수 있습니다.'
    }
  ],
  reference: {
    trackedIndex: 'Fidelity High Dividend Index',
    inceptionYear: 2016,
    expenseRatioPercent: 0.15,
    holdingsCountApprox: 112,
    paymentMonthsNote: '연 4회 분기 지급',
    asOfNote:
      '상장일(2016년 9월 12일)·총보수(0.15%)·추종지수(Fidelity High Dividend Index)·보유종목수(약 112종)는 stockanalysis.com과 복수 소스로 2026년 8월 교차 확인한 사실입니다. 섹터 비중·정확한 배당 CAGR은 신뢰할 단일 현재값을 확인하지 못해 이 페이지에서는 다루지 않았습니다. 배당률·배당성장률·기대수익률 등 계산에 쓰이는 값은 이 페이지가 아니라 시뮬레이터 계산 프리셋을 그대로 따릅니다.'
  },
  relatedTickers: [
    { ticker: 'SPYD', relationLabel: '지금 당장의 더 높은 배당률을 원한다면' },
    { ticker: 'SCHD', relationLabel: '배당성장에 더 무게를 둔 대안을 원한다면' },
    { ticker: 'HDV', relationLabel: '더 소수 종목에 집중한 고배당 ETF를 원한다면' },
    { ticker: 'VYM', relationLabel: '더 넓은 분산의 고배당 ETF를 원한다면' }
  ],
  // 피델리티(Fidelity) 정체성 — 시그니처 그린. 장식 전용.
  accent: {
    from: '#0a3d1f',
    to: '#3aa855',
    textLight: '#0f5c2e',
    textDark: '#6fcf82'
  },
  disclaimer:
    '이 페이지는 정보 제공을 목적으로 하며 투자 자문이 아닙니다. 배당률·주가·운용보수·세금 등은 시장 상황과 정책에 따라 변동될 수 있으며, 과거 성과가 미래 수익을 보장하지 않습니다. 투자 판단과 그 결과에 대한 책임은 투자자 본인에게 있습니다.',
  contentUpdatedAt: '2026-08-06'
};
