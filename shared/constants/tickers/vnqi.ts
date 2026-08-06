import type { TickerContent } from './TickerContent.types';

/**
 * VNQI(뱅가드 글로벌(미국 제외) 부동산 ETF) SEO 랜딩 콘텐츠 — VNQ의 해외판. 미국을 뺀 전 세계
 * 리츠를 담는다는 점, 국가별 리츠 제도·세제 차이라는 추가 변수를 정직하게 짚는다.
 *
 * 숫자 출처:
 * - 계산 6필드는 `shared/constants/presets`(`REIT_ETFS.VNQI`)에서 그대로 온다.
 * - 상장일(2010년 11월 1일)·총보수(0.12%)·추종지수(S&P Global ex-U.S. Property Index)는
 *   뱅가드 공식 정보·복수 소스로 2026년 8월 교차 확인.
 */
export const VNQI_TICKER_CONTENT: TickerContent = {
  ticker: 'VNQI',
  slug: 'vnqi',
  categoryIds: ['reit', 'international'],
  metaTitle: 'VNQI 배당률·운용보수·구성 총정리 — 뱅가드 글로벌(미국 제외) 부동산 ETF',
  metaDescription:
    'VNQI(뱅가드 글로벌(미국 제외) 부동산 ETF)의 배당률·운용보수 0.12%·전 세계 리츠 구성을 정리했습니다. 미국 리츠에서 한 걸음 더 나아가 해외 부동산으로 분산하고 싶다면 여기서 확인하세요.',
  heroTagline: '미국을 뺀 전 세계 선진국·신흥국 리츠를 한 종목으로 담는 ETF',
  sections: [
    {
      id: 'overview',
      navLabel: '개요',
      heading: 'VNQI, 무엇을 추종하는 ETF인가',
      paragraphs: [
        'VNQI(뱅가드 글로벌(미국 제외) 부동산 ETF, {{englishName}})는 2010년 11월 1일 상장한 ETF로, S&P Global ex-U.S. Property Index를 추종합니다. 이름 그대로 미국을 뺀 전 세계 선진국·신흥국의 리츠와 부동산 관리·개발 회사를 담습니다.',
        'VNQ(미국 리츠)와는 상호 보완 관계에 가깝습니다. 미국 리츠 포트폴리오를 이미 갖추고 있다면, VNQI로 일본·영국·호주·홍콩 등 다른 나라의 부동산 시장으로 분산을 넓힐 수 있습니다.',
        '{{koreanName}}는 이 시뮬레이터의 계산 프리셋에서 배당률 {{dividendYield}}, 연 배당성장률(가정) {{dividendGrowth}}, {{frequencyLabel}} 지급을 기준으로 합니다.'
      ],
      stat: {
        label: '추종 지수',
        value: 'S&P Global ex-U.S. Property Index',
        caption: '미국을 제외한 선진국·신흥국의 리츠·부동산 관리개발 회사로 구성'
      }
    },
    {
      id: 'dividend-yield',
      navLabel: '배당률',
      heading: '배당률 {{dividendYield}}, 국가마다 다른 리츠 제도가 만드는 숫자',
      paragraphs: [
        'VNQI의 배당률은 {{dividendYield}} 안팎입니다. 리츠는 과세소득 대부분을 배당해야 하는 구조가 많은 나라에 공통으로 있어, VNQ와 비슷하게 일반 주식 ETF보다 배당률이 높게 형성되는 경향이 있습니다.',
        '다만 나라마다 리츠 관련 세제와 배당 정책이 다릅니다. 일부 국가는 배당보다 자사주 매입을 선호하거나, 리츠가 아닌 부동산 관리·개발 회사가 지수에 섞여 있어 미국 리츠만큼 배당이 예측 가능하지 않을 수 있습니다.',
        '배당률은 주가와 환율에 따라 매일 움직이는 값이라, 이 페이지의 숫자는 작성 시점 기준입니다. 내 조건에서의 실제 현금흐름은 시뮬레이터에서 직접 계산해 보세요.'
      ],
      stat: {
        label: '배당률(세전, 명목)',
        value: '{{dividendYield}}',
        caption: '시뮬레이터 계산 프리셋 기준 — 실제 배당률은 주가·환율·각국 배당 정책에 따라 달라집니다'
      }
    },
    {
      id: 'dividend-growth',
      navLabel: '배당성장',
      heading: '한 나라가 아니라 여러 나라의 부동산 사이클이 섞인다',
      paragraphs: [
        '이 시뮬레이터의 계산 프리셋은 VNQI의 연 배당성장률(가정)을 {{dividendGrowth}}, 기대 총수익률을 {{expectedTotalReturn}}로 둡니다. 이 성장률은 과거 실적의 재현이 아니라 향후 흐름에 대한 가정입니다.',
        'VNQ가 미국 한 나라의 부동산 사이클에 노출된다면, VNQI는 여러 나라의 부동산 사이클이 동시에 섞입니다. 어떤 나라는 금리를 올리는 국면에, 어떤 나라는 내리는 국면에 있을 수 있어 배당 흐름이 VNQ보다 더 복잡하게 움직일 수 있습니다.',
        '환율 변동도 실제 수령하는 원화 기준 배당에 영향을 줍니다. 현지 통화 기준 배당이 늘어도 환율이 불리하게 움직이면 원화 환산 배당은 줄어들 수 있습니다.'
      ],
      stat: {
        label: '연 배당성장률(계산 가정)',
        value: '{{dividendGrowth}}',
        caption: '기대 총수익 {{expectedTotalReturn}}에서 배당률을 뺀 값 — 관측치가 아니라 큐레이터의 가정입니다'
      }
    },
    {
      id: 'expense-ratio',
      navLabel: '운용보수',
      heading: '총보수 0.12% — 해외 부동산 노출로는 낮은 편',
      paragraphs: [
        'VNQI의 총보수는 0.12%로, 미국 국내 리츠 ETF인 VNQ(0.13%)와 비슷한 수준입니다. 해외 여러 나라의 부동산 시장을 한 번에 담는 상품으로는 낮은 편에 속합니다.',
        '개별 국가의 리츠를 직접 사려면 각국 증권 계좌 개설, 현지 세금 처리, 환전 등 여러 절차가 필요합니다. VNQI는 이 복잡함을 한 종목 매수로 대체합니다.',
        '보수는 매년 총수익에서 조용히 빠져나갑니다. 장기 재투자 시 이 차이가 복리로 누적된다는 점은 다른 ETF와 동일합니다.'
      ],
      stat: {
        label: '운용보수(총보수)',
        value: '0.12%',
        caption: '뱅가드 공식 정보·복수 소스 교차 확인(2026년 8월 기준)'
      }
    },
    {
      id: 'selection-criteria',
      navLabel: '구성 기준',
      heading: '미국을 뺀 전 세계 리츠·부동산 관리개발 회사',
      paragraphs: [
        'VNQI가 추종하는 지수는 미국을 제외한 선진국·신흥국에 상장된 리츠와, 부동산을 관리·개발하는 회사(REMDs)를 함께 담습니다. 일본·영국·호주·홍콩·캐나다 등이 주요 비중을 차지하는 것으로 알려져 있습니다.',
        '시가총액 가중 방식으로 비중이 정해지며, 개별 국가·개별 종목의 시가총액이 클수록 지수 내 비중도 커집니다.',
        '신흥국 부동산 시장이 포함된 만큼, 선진국 위주로만 구성된 리츠 ETF보다 정치·경제적 불확실성에 더 노출될 수 있습니다.'
      ]
    },
    {
      id: 'who-and-tradeoffs',
      navLabel: '적합성·트레이드오프',
      heading: '어떤 투자자에게 맞고, 무엇을 포기하는가',
      paragraphs: [
        'VNQI는 이런 투자자에게 맞습니다. 이미 미국 리츠(VNQ·SCHH)를 보유하고 해외 부동산으로 분산을 넓히고 싶은 사람, 여러 나라의 증권 계좌를 직접 개설하지 않고 해외 리츠에 접근하고 싶은 사람, 부동산 자산군 전체를 지역까지 분산하려는 사람입니다.',
        '포기하는 것도 있습니다. 첫째, 환율 변동이 실제 수령 배당에 영향을 줍니다. 둘째, 여러 나라의 리츠 제도·세제가 섞여 배당 흐름을 예측하기가 미국 리츠보다 어렵습니다. 셋째, 신흥국 비중이 있어 정치·경제적 불확실성에 더 노출됩니다.',
        '미국 리츠에 집중하고 싶다면 VNQ·SCHH, 부동산 대신 넓은 해외 배당주로 분산하고 싶다면 VYMI·SCHY와 함께 비교해 보세요.'
      ]
    }
  ],
  faqs: [
    {
      question: 'VNQI 배당률은 얼마인가요?',
      answer:
        '이 시뮬레이터가 쓰는 계산 프리셋 기준 VNQI의 명목 배당률(세전)은 {{dividendYield}}입니다. 여러 나라의 리츠 배당 정책과 환율이 함께 반영되는 값입니다.'
    },
    {
      question: 'VNQI는 어떤 지수를 추종하나요?',
      answer:
        'S&P Global ex-U.S. Property Index를 추종합니다. 미국을 제외한 선진국·신흥국의 리츠와 부동산 관리·개발 회사로 구성됩니다.'
    },
    {
      question: 'VNQI 운용보수(총보수)는 얼마인가요?',
      answer: '0.12%입니다. 미국 국내 리츠 ETF인 VNQ(0.13%)와 비슷한 수준으로, 해외 부동산 노출로는 낮은 편입니다.'
    },
    {
      question: 'VNQI와 VNQ는 무엇이 다른가요?',
      answer:
        'VNQ는 미국 리츠만, VNQI는 미국을 제외한 전 세계 리츠를 담습니다. 두 상품을 함께 보유하면 미국과 해외 부동산 시장을 함께 분산해서 담을 수 있습니다.'
    },
    {
      question: 'VNQI 배당은 얼마나 자주 지급되나요?',
      answer: 'VNQI는 {{frequencyLabel}} 지급됩니다. 정확한 배당락일·지급일은 매 분기 공지에 따라 달라질 수 있습니다.'
    },
    {
      question: 'VNQI는 안전한 상품인가요?',
      answer:
        '이 페이지가 안전 여부를 판정할 수는 없습니다. 다만 여러 나라의 부동산 시장·환율·정치 상황이 함께 얽혀 미국 국내 리츠 ETF보다 변수가 많다는 점은 분명히 짚어 둡니다.'
    },
    {
      question: 'VNQI 배당에 붙는 세금은 어떻게 계산하나요?',
      answer:
        '해외 리츠 배당은 원천징수 등 세무 처리가 국가마다 다를 수 있고, 세율은 거주 국가와 계좌 종류에 따라 달라져 이 페이지가 대신 알려드릴 수 없습니다. 이 시뮬레이터에서는 세율을 직접 입력해 세후 배당을 계산해 볼 수 있습니다.'
    }
  ],
  reference: {
    trackedIndex: 'S&P Global ex-U.S. Property Index',
    inceptionYear: 2010,
    expenseRatioPercent: 0.12,
    paymentMonthsNote: '연 4회 분기 지급',
    asOfNote:
      '상장일(2010년 11월 1일)·총보수(0.12%)·추종지수(S&P Global ex-U.S. Property Index)는 뱅가드 공식 정보와 복수 소스로 2026년 8월 교차 확인한 사실입니다. 국가별 비중·보유종목수·정확한 배당 CAGR은 신뢰할 단일 현재값을 확인하지 못해 이 페이지에서는 다루지 않았습니다. 배당률·배당성장률·기대수익률 등 계산에 쓰이는 값은 이 페이지가 아니라 시뮬레이터 계산 프리셋을 그대로 따릅니다.'
  },
  relatedTickers: [
    { ticker: 'VNQ', relationLabel: '미국 리츠에 집중하고 싶다면' },
    { ticker: 'SCHH', relationLabel: '더 낮은 보수의 미국 리츠 ETF를 원한다면' },
    { ticker: 'VYMI', relationLabel: '부동산 대신 넓은 해외 고배당으로 분산하고 싶다면' },
    { ticker: 'SCHY', relationLabel: '해외 배당성장 쪽에 무게를 두고 싶다면' }
  ],
  // 뱅가드(Vanguard) 정체성 — VYM·VIG와 같은 레드 계열이되 부동산다운 톤 다운. 장식 전용.
  accent: {
    from: '#4a1f26',
    to: '#c26f7a',
    textLight: '#6b2c34',
    textDark: '#e0a8ae'
  },
  disclaimer:
    '이 페이지는 정보 제공을 목적으로 하며 투자 자문이 아닙니다. 배당률·주가·운용보수·세금 등은 시장 상황과 정책에 따라 변동될 수 있으며, 과거 성과가 미래 수익을 보장하지 않습니다. 해외 투자는 환율 변동과 각국 정책 차이라는 별도의 위험을 동반합니다. 투자 판단과 그 결과에 대한 책임은 투자자 본인에게 있습니다.',
  contentUpdatedAt: '2026-08-06'
};
