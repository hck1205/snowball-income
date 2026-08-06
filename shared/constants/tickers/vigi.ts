import type { TickerContent } from './TickerContent.types';

/**
 * VIGI(뱅가드 인터내셔널 배당성장 ETF) SEO 랜딩 콘텐츠 — VIG(미국)의 해외판. "10년 이상"이
 * 아니라 "능력과 의지를 함께 평가"하는 S&P 지수 방법론이 VIG와의 실질적 차이라는 점을 짚는다.
 *
 * 숫자 출처:
 * - 계산 6필드는 `shared/constants/presets`(`INTERNATIONAL_DIVIDEND_ETFS.VIGI`)에서 그대로 온다.
 * - 상장일(2016년 2월 25일)·총보수(0.07%)·추종지수(S&P Global Ex-U.S. Dividend Growers Index)는
 *   뱅가드 공식 정보·복수 소스로 2026년 8월 교차 확인.
 */
export const VIGI_TICKER_CONTENT: TickerContent = {
  ticker: 'VIGI',
  slug: 'vigi',
  categoryIds: ['dividend-growth', 'international'],
  metaTitle: 'VIGI 배당률·운용보수·구성 총정리 — 뱅가드 인터내셔널 배당성장 ETF',
  metaDescription:
    'VIGI(뱅가드 인터내셔널 배당성장 ETF)의 배당률·운용보수 0.07%·해외 배당성장 스크리닝을 정리했습니다. VIG의 해외판, 배당을 늘려온 해외 기업이 궁금하다면 여기서 확인하세요.',
  heroTagline: '미국 밖에서 배당을 꾸준히 늘려온 기업만 골라 담는, 업계 최저 수준 보수의 ETF',
  sections: [
    {
      id: 'overview',
      navLabel: '개요',
      heading: 'VIGI, 무엇을 추종하는 ETF인가',
      paragraphs: [
        'VIGI(뱅가드 인터내셔널 배당성장 ETF, {{englishName}})는 2016년 2월 25일 상장한 ETF로, S&P Global Ex-U.S. Dividend Growers Index를 추종합니다. VIG(미국 배당성장 ETF)의 철학을 미국 밖 시장에 적용한 상품입니다.',
        '지수는 배당을 지급하는 것을 넘어, 그 배당을 늘릴 수 있는 능력과 의지를 함께 평가된 선진국·신흥국 기업을 대상으로 합니다. VIG가 "10년 이상 연속 인상"이라는 이력 기준을 쓰는 것과 달리, 이 지수는 재무 지표 기반의 질적 평가를 함께 씁니다.',
        '{{koreanName}}는 이 시뮬레이터의 계산 프리셋에서 배당률 {{dividendYield}}, 연 배당성장률(가정) {{dividendGrowth}}, {{frequencyLabel}} 지급을 기준으로 합니다.'
      ],
      stat: {
        label: '추종 지수',
        value: 'S&P Global Ex-U.S. Dividend Growers Index',
        caption: '미국을 제외한 선진국·신흥국 중 배당 성장 능력과 의지를 평가해 선별'
      }
    },
    {
      id: 'dividend-yield',
      navLabel: '배당률',
      heading: '배당률 {{dividendYield}}, VIG와 마찬가지로 성장에 무게',
      paragraphs: [
        'VIGI의 배당률은 {{dividendYield}} 안팎입니다. VIG와 같은 철학을 공유해 배당률 자체를 최우선으로 삼지 않고, 배당을 늘릴 수 있는 기업을 우선 선별합니다.',
        '배당률이 지나치게 높은 종목은 오히려 배당 지속이 어렵다는 신호일 수 있어, 지수 설계 단계에서 이런 종목은 걸러지는 경향이 있습니다. VYMI 같은 순수 고배당 해외 ETF보다는 배당률이 낮게 형성됩니다.',
        '배당률은 주가와 환율에 따라 매일 움직이는 값이라, 이 페이지의 숫자는 작성 시점 기준입니다. 내 조건에서의 실제 현금흐름은 시뮬레이터에서 직접 계산해 보세요.'
      ],
      stat: {
        label: '배당률(세전, 명목)',
        value: '{{dividendYield}}',
        caption: '시뮬레이터 계산 프리셋 기준 — 실제 배당률은 주가·환율에 따라 매일 변동합니다'
      }
    },
    {
      id: 'dividend-growth',
      navLabel: '배당성장',
      heading: 'VIG의 해외판, 그러나 나라마다 배당 문화가 다르다',
      paragraphs: [
        '이 시뮬레이터의 계산 프리셋은 VIGI의 연 배당성장률(가정)을 {{dividendGrowth}}, 기대 총수익률을 {{expectedTotalReturn}}로 둡니다. VIG와 비슷한 철학을 공유하지만, 해외 기업이라는 변수가 더해집니다.',
        '미국 기업은 분기 배당을 정기적으로 소폭씩 인상하는 문화가 자리 잡혀 있지만, 유럽·아시아 기업은 연 1회 배당을 재무 실적에 맞춰 큰 폭으로 조정하는 경우가 많습니다. 그래서 "꾸준한 소폭 인상"보다는 "실적에 따른 큰 폭 조정"이 더 흔하게 나타날 수 있습니다.',
        '환율 변동도 실제 수령하는 원화 기준 배당 성장에 영향을 줍니다. 현지 통화 기준 배당이 늘어도 환율이 불리하게 움직이면 체감 성장은 둔화될 수 있습니다.'
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
      heading: '총보수 0.07% — 해외 배당성장 ETF 중 최저 수준',
      paragraphs: [
        'VIGI의 총보수는 0.07%로, VIG(0.06%)와 거의 같은 수준입니다. 해외 종목을 담는 상품임에도 뱅가드 특유의 저비용 운용이 그대로 이어집니다.',
        'IDV(0.50%)·DWX(0.45%) 같은 다른 해외 배당 ETF와 비교하면 보수 격차가 상당히 큽니다. 같은 해외 배당 노출이라도 상품마다 비용 구조가 크게 다르다는 점을 보여줍니다.',
        '장기 재투자 시 이 보수 차이는 매년 조용히 복리로 누적됩니다. 낮은 보수는 특히 배당을 재투자하는 장기 투자자에게 실질적인 차이를 만듭니다.'
      ],
      stat: {
        label: '운용보수(총보수)',
        value: '0.07%',
        caption: '뱅가드 공식 정보·복수 소스 교차 확인(2026년 8월 기준)'
      }
    },
    {
      id: 'selection-criteria',
      navLabel: '구성 기준',
      heading: '배당 성장 능력과 의지를 함께 평가한다',
      paragraphs: [
        'VIGI가 추종하는 지수는 미국을 제외한 선진국·신흥국 기업 중, 배당을 지급하면서 향후에도 늘릴 수 있는 재무적 능력과 실제로 늘릴 의지가 있다고 평가되는 기업을 후보로 삼습니다.',
        '이 평가는 VIG가 참고하는 미국 방법론과 유사한 철학을 공유하지만, 완전히 동일한 기준은 아닙니다. 국가별로 배당 정책과 재무 공시 관행이 달라 평가 방식도 그에 맞춰 조정됩니다.',
        '시가총액 가중 방식으로 비중이 정해지며, 특정 국가나 섹터로 쏠리지 않도록 분산 규칙이 함께 적용됩니다.'
      ]
    },
    {
      id: 'who-and-tradeoffs',
      navLabel: '적합성·트레이드오프',
      heading: '어떤 투자자에게 맞고, 무엇을 포기하는가',
      paragraphs: [
        'VIGI는 이런 투자자에게 맞습니다. 미국 VIG의 철학을 해외로 넓히고 싶은 사람, 지금 당장의 배당률보다 늘어나는 배당을 우선하는 사람, 낮은 보수로 해외 배당성장에 접근하고 싶은 사람입니다.',
        '포기하는 것도 있습니다. 첫째, 지금 당장의 배당률은 VYMI 같은 순수 고배당 해외 ETF보다 낮습니다. 둘째, 해외 기업의 배당 정책이 미국보다 예측하기 어려울 수 있습니다. 셋째, 환율 변동이 실제 수령 배당에 영향을 줍니다.',
        '지금 당장 더 높은 해외 배당을 원한다면 VYMI·SCHY, 미국 시장의 배당성장에 집중하고 싶다면 VIG와 함께 비교해 보세요.'
      ]
    }
  ],
  faqs: [
    {
      question: 'VIGI 배당률은 얼마인가요?',
      answer:
        '이 시뮬레이터가 쓰는 계산 프리셋 기준 VIGI의 명목 배당률(세전)은 {{dividendYield}}입니다. 배당률보다 배당 성장 능력을 우선 선별하는 지수라 순수 고배당 해외 ETF보다 낮은 편입니다.'
    },
    {
      question: 'VIGI는 어떤 지수를 추종하나요?',
      answer:
        'S&P Global Ex-U.S. Dividend Growers Index를 추종합니다. 미국을 제외한 선진국·신흥국 중 배당을 늘릴 능력과 의지가 있다고 평가되는 기업으로 구성됩니다.'
    },
    {
      question: 'VIGI 운용보수(총보수)는 얼마인가요?',
      answer: '0.07%로, 뱅가드의 미국 배당성장 ETF인 VIG(0.06%)와 거의 같은 수준입니다.'
    },
    {
      question: 'VIGI와 VIG는 무엇이 다른가요?',
      answer:
        '비슷한 철학을 공유하지만 VIG는 미국 기업, VIGI는 미국을 제외한 해외 기업을 담습니다. 두 상품을 함께 보유하면 배당성장 전략을 국내외로 분산할 수 있습니다.'
    },
    {
      question: 'VIGI 배당은 얼마나 자주 지급되나요?',
      answer: 'VIGI는 {{frequencyLabel}} 지급됩니다. 정확한 배당락일·지급일은 매 분기 공지에 따라 달라질 수 있습니다.'
    },
    {
      question: 'VIGI와 VYMI는 무엇이 다른가요?',
      answer:
        'VIGI는 배당 성장 능력을 우선 선별해 배당률이 낮은 대신 성장 가정이 높습니다. VYMI는 배당률이 높은 종목을 우선 선별합니다. 같은 뱅가드 해외 배당 ETF 안에서 성장과 소득이라는 다른 목적을 겨냥합니다.'
    },
    {
      question: 'VIGI 배당에 붙는 세금은 어떻게 계산하나요?',
      answer:
        '해외 배당은 원천징수 등 세무 처리가 국가마다 다를 수 있고, 세율은 거주 국가와 계좌 종류에 따라 달라져 이 페이지가 대신 알려드릴 수 없습니다. 이 시뮬레이터에서는 세율을 직접 입력해 세후 배당을 계산해 볼 수 있습니다.'
    }
  ],
  reference: {
    trackedIndex: 'S&P Global Ex-U.S. Dividend Growers Index',
    inceptionYear: 2016,
    expenseRatioPercent: 0.07,
    paymentMonthsNote: '연 4회 분기 지급',
    asOfNote:
      '상장일(2016년 2월 25일)·총보수(0.07%)·추종지수(S&P Global Ex-U.S. Dividend Growers Index)는 뱅가드 공식 정보와 복수 소스로 2026년 8월 교차 확인한 사실입니다. 국가별 비중·보유종목수·정확한 배당 CAGR은 신뢰할 단일 현재값을 확인하지 못해 이 페이지에서는 다루지 않았습니다. 배당률·배당성장률·기대수익률 등 계산에 쓰이는 값은 이 페이지가 아니라 시뮬레이터 계산 프리셋을 그대로 따릅니다.'
  },
  relatedTickers: [
    { ticker: 'VIG', relationLabel: '같은 철학을 미국 시장에 적용한 상품을 원한다면' },
    { ticker: 'VYMI', relationLabel: '지금 당장 더 높은 해외 배당률을 원한다면' },
    { ticker: 'SCHY', relationLabel: '다른 방식의 해외 배당성장 ETF를 비교하고 싶다면' },
    { ticker: 'IDV', relationLabel: '유럽·아시아·캐나다 중심의 고배당 해외 ETF를 원한다면' }
  ],
  // 뱅가드(Vanguard) 정체성 — VIG와 같은 레드 계열, 해외 상품 표시를 위해 톤을 살짝 낮춤. 장식 전용.
  accent: {
    from: '#6b1a28',
    to: '#d9525f',
    textLight: '#821f30',
    textDark: '#eb8b93'
  },
  disclaimer:
    '이 페이지는 정보 제공을 목적으로 하며 투자 자문이 아닙니다. 배당률·주가·운용보수·세금 등은 시장 상황과 정책에 따라 변동될 수 있으며, 과거 성과가 미래 수익을 보장하지 않습니다. 해외 투자는 환율 변동과 각국 정책 차이라는 별도의 위험을 동반합니다. 투자 판단과 그 결과에 대한 책임은 투자자 본인에게 있습니다.',
  contentUpdatedAt: '2026-08-06'
};
