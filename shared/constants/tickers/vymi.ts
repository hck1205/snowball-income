import type { TickerContent } from './TickerContent.types';

/**
 * VYMI(뱅가드 인터내셔널 고배당 수익 ETF) SEO 랜딩 콘텐츠 — VYM(미국)의 해외판. 리츠를 지수에서
 * 제외한다는 점이 VNQI와의 역할 분담을 명확히 한다.
 *
 * 숫자 출처:
 * - 계산 6필드는 `shared/constants/presets`(`INTERNATIONAL_DIVIDEND_ETFS.VYMI`)에서 그대로 온다.
 * - 상장일(2016년 2월 25일)·총보수(0.07%)·추종지수(FTSE All-World ex US High Dividend Yield
 *   Index, 리츠 제외)는 뱅가드 공식 정보·복수 소스로 2026년 8월 교차 확인.
 */
export const VYMI_TICKER_CONTENT: TickerContent = {
  ticker: 'VYMI',
  slug: 'vymi',
  categoryIds: ['high-dividend', 'international'],
  metaTitle: 'VYMI 배당률·운용보수·구성 총정리 — 뱅가드 인터내셔널 고배당 수익 ETF',
  metaDescription:
    'VYMI(뱅가드 인터내셔널 고배당 수익 ETF)의 배당률·운용보수 0.07%·리츠 제외 구성을 정리했습니다. VYM의 해외판, 지금 당장 높은 해외 배당이 궁금하다면 여기서 확인하세요.',
  heroTagline: '미국 밖에서 배당률이 평균보다 높은 기업을 폭넓게 담는, 업계 최저 수준 보수의 ETF',
  sections: [
    {
      id: 'overview',
      navLabel: '개요',
      heading: 'VYMI, 무엇을 추종하는 ETF인가',
      paragraphs: [
        'VYMI(뱅가드 인터내셔널 고배당 수익 ETF, {{englishName}})는 2016년 2월 25일 상장한 ETF로, FTSE All-World ex US High Dividend Yield Index를 추종합니다. VYM(미국 고배당 ETF)의 해외판에 해당합니다.',
        '지수는 미국을 제외한 선진국·신흥국의 대형·중형주 중 배당률이 평균 이상으로 예상되는 기업을 폭넓게 담습니다. 리츠는 세제 혜택 구조가 일반 기업과 달라 지수에서 의도적으로 제외됩니다.',
        '{{koreanName}}는 이 시뮬레이터의 계산 프리셋에서 배당률 {{dividendYield}}, 연 배당성장률(가정) {{dividendGrowth}}, {{frequencyLabel}} 지급을 기준으로 합니다.'
      ],
      stat: {
        label: '추종 지수',
        value: 'FTSE All-World ex US High Dividend Yield Index',
        caption: '미국을 제외한 선진국·신흥국의 배당률 상위 기업(리츠 제외)으로 구성'
      }
    },
    {
      id: 'dividend-yield',
      navLabel: '배당률',
      heading: '배당률 {{dividendYield}}, 유럽·아시아 배당 문화가 만드는 숫자',
      paragraphs: [
        'VYMI의 배당률은 {{dividendYield}} 안팎으로, 자매 펀드 VIGI보다 대체로 높게 형성됩니다. 지수 자체가 배당률이 평균 이상인 기업을 대상으로 하기 때문입니다.',
        '유럽 기업들은 미국 기업보다 배당성향(이익 중 배당으로 지급하는 비율)이 높은 경향이 있어, 같은 이익 수준이라도 배당률이 더 높게 나타나는 경우가 많습니다. VYMI의 상대적으로 높은 배당률은 이런 지역별 배당 문화 차이를 반영합니다.',
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
      heading: '배당률을 우선한 설계, 성장은 나라별 실적에 좌우된다',
      paragraphs: [
        '이 시뮬레이터의 계산 프리셋은 VYMI의 연 배당성장률(가정)을 {{dividendGrowth}}, 기대 총수익률을 {{expectedTotalReturn}}로 둡니다. 배당률을 우선하는 지수 설계라 자매 펀드 VIGI보다 성장률 가정은 낮게 잡혀 있습니다.',
        '유럽·아시아 기업의 배당은 연 1회 재무 실적에 맞춰 조정되는 경우가 많아, 미국 기업의 분기별 소폭 인상 문화와는 다르게 움직입니다. 실적이 좋은 해에는 배당이 크게 늘 수 있지만, 실적이 나쁜 해에는 배당이 크게 줄거나 생략될 수도 있습니다.',
        '환율 변동도 실제 수령하는 원화 기준 배당에 영향을 줍니다. 여러 나라의 통화가 섞여 있어 VNQI와 마찬가지로 환헤지가 되지 않은 상품이라는 점을 유의해야 합니다.'
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
      heading: '총보수 0.07% — 해외 고배당 ETF 중 최저 수준',
      paragraphs: [
        'VYMI의 총보수는 0.07%로, VYM(0.06%)과 거의 같은 수준입니다. IDV(0.50%)·DWX(0.45%) 같은 다른 해외 고배당 ETF와 비교하면 보수 격차가 상당히 큽니다.',
        '뱅가드의 저비용 운용 전략이 국내외를 가리지 않고 일관되게 적용된 결과입니다. 같은 해외 고배당 노출이라도 상품마다 비용 구조가 크게 다르다는 점을 보여줍니다.',
        '장기 재투자 시 이 보수 차이는 매년 조용히 복리로 누적됩니다. 낮은 보수는 배당을 재투자하는 장기 투자자에게 특히 실질적인 차이를 만듭니다.'
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
      heading: '리츠를 뺀, 배당률 평균 이상의 해외 기업',
      paragraphs: [
        'VYMI가 추종하는 지수는 미국을 제외한 선진국·신흥국의 대형·중형주 중 향후 12개월 배당률이 평균 이상으로 예상되는 기업을 후보로 삼습니다.',
        '리츠는 세제상 배당 성격이 일반 기업과 달라(과세소득 대부분을 의무적으로 배당) 지수에서 의도적으로 제외됩니다. 해외 리츠에 노출되고 싶다면 VNQI를 별도로 담아야 합니다.',
        '시가총액 가중 방식으로 비중이 정해지며, 유럽·아시아·캐나다 등 여러 지역의 대형주가 섞여 있습니다.'
      ]
    },
    {
      id: 'who-and-tradeoffs',
      navLabel: '적합성·트레이드오프',
      heading: '어떤 투자자에게 맞고, 무엇을 포기하는가',
      paragraphs: [
        'VYMI는 이런 투자자에게 맞습니다. 미국 VYM의 철학을 해외로 넓히고 싶은 사람, 지금 당장 높은 해외 배당률을 원하는 사람, 낮은 보수로 해외 고배당에 접근하고 싶은 사람입니다.',
        '포기하는 것도 있습니다. 첫째, 배당 성장 속도는 VIGI보다 완만합니다. 둘째, 해외 기업의 배당은 연 1회 실적에 좌우돼 미국보다 변동성이 클 수 있습니다. 셋째, 환율 변동이 실제 수령 배당에 영향을 줍니다. 넷째, 리츠는 제외돼 있어 해외 부동산 노출은 없습니다.',
        '배당 성장에 무게를 두고 싶다면 VIGI, 해외 부동산까지 담고 싶다면 VNQI와 함께 비교해 보세요.'
      ]
    }
  ],
  faqs: [
    {
      question: 'VYMI 배당률은 얼마인가요?',
      answer:
        '이 시뮬레이터가 쓰는 계산 프리셋 기준 VYMI의 명목 배당률(세전)은 {{dividendYield}}입니다. 유럽·아시아 기업의 높은 배당성향 문화가 반영된 값입니다.'
    },
    {
      question: 'VYMI는 어떤 지수를 추종하나요?',
      answer:
        'FTSE All-World ex US High Dividend Yield Index를 추종합니다. 미국을 제외한 선진국·신흥국 중 배당률이 평균 이상으로 예상되는 기업을 리츠를 제외하고 담습니다.'
    },
    {
      question: 'VYMI 운용보수(총보수)는 얼마인가요?',
      answer: '0.07%로, 뱅가드의 미국 고배당 ETF인 VYM(0.06%)과 거의 같은 수준입니다.'
    },
    {
      question: 'VYMI와 VYM은 무엇이 다른가요?',
      answer:
        '비슷한 철학을 공유하지만 VYM은 미국 기업, VYMI는 미국을 제외한 해외 기업을 담습니다. 두 상품을 함께 보유하면 고배당 전략을 국내외로 분산할 수 있습니다.'
    },
    {
      question: 'VYMI는 왜 리츠를 담지 않나요?',
      answer:
        '리츠는 과세소득 대부분을 의무적으로 배당해야 하는 세제 구조라 일반 기업과 배당 성격이 다릅니다. 지수는 이 차이를 이유로 리츠를 의도적으로 제외했습니다.'
    },
    {
      question: 'VYMI 배당은 얼마나 자주 지급되나요?',
      answer: 'VYMI는 {{frequencyLabel}} 지급됩니다. 정확한 배당락일·지급일은 매 분기 공지에 따라 달라질 수 있습니다.'
    },
    {
      question: 'VYMI 배당에 붙는 세금은 어떻게 계산하나요?',
      answer:
        '해외 배당은 원천징수 등 세무 처리가 국가마다 다를 수 있고, 세율은 거주 국가와 계좌 종류에 따라 달라져 이 페이지가 대신 알려드릴 수 없습니다. 이 시뮬레이터에서는 세율을 직접 입력해 세후 배당을 계산해 볼 수 있습니다.'
    }
  ],
  reference: {
    trackedIndex: 'FTSE All-World ex US High Dividend Yield Index',
    inceptionYear: 2016,
    expenseRatioPercent: 0.07,
    paymentMonthsNote: '연 4회 분기 지급',
    asOfNote:
      '상장일(2016년 2월 25일)·총보수(0.07%)·추종지수(FTSE All-World ex US High Dividend Yield Index, 리츠 제외)는 뱅가드 공식 정보와 복수 소스로 2026년 8월 교차 확인한 사실입니다. 국가별 비중·보유종목수·정확한 배당 CAGR은 신뢰할 단일 현재값을 확인하지 못해 이 페이지에서는 다루지 않았습니다. 배당률·배당성장률·기대수익률 등 계산에 쓰이는 값은 이 페이지가 아니라 시뮬레이터 계산 프리셋을 그대로 따릅니다.'
  },
  relatedTickers: [
    { ticker: 'VYM', relationLabel: '같은 철학을 미국 시장에 적용한 상품을 원한다면' },
    { ticker: 'VIGI', relationLabel: '배당 성장에 더 무게를 둔 해외 ETF를 원한다면' },
    { ticker: 'VNQI', relationLabel: '해외 부동산(리츠)에도 노출되고 싶다면' },
    { ticker: 'IDV', relationLabel: '유럽·아시아·캐나다 중심의 다른 고배당 해외 ETF를 비교하고 싶다면' }
  ],
  // 뱅가드(Vanguard) 정체성 — VYM과 같은 레드 계열, 해외 상품 표시를 위해 톤을 살짝 낮춤. 장식 전용.
  accent: {
    from: '#4a1520',
    to: '#c25868',
    textLight: '#6b1c2c',
    textDark: '#e0929c'
  },
  disclaimer:
    '이 페이지는 정보 제공을 목적으로 하며 투자 자문이 아닙니다. 배당률·주가·운용보수·세금 등은 시장 상황과 정책에 따라 변동될 수 있으며, 과거 성과가 미래 수익을 보장하지 않습니다. 해외 투자는 환율 변동과 각국 정책 차이라는 별도의 위험을 동반합니다. 투자 판단과 그 결과에 대한 책임은 투자자 본인에게 있습니다.',
  contentUpdatedAt: '2026-08-06'
};
