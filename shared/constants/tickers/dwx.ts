import type { TickerContent } from './TickerContent.types';

/**
 * DWX(SPDR S&P 인터내셔널 디비던드 ETF) SEO 랜딩 콘텐츠 — S&P 인덱스 방법론으로 신흥국까지
 * 포함해 배당률 상위 100종을 뽑는 해외 고배당 ETF. IDV(EPAC, 신흥국 제외)와의 지역 차이를
 * 명확히 짚는다.
 *
 * 숫자 출처:
 * - 계산 6필드는 `shared/constants/presets`(`INTERNATIONAL_DIVIDEND_ETFS.DWX`)에서 그대로 온다.
 * - 상장일(2008년 2월 12일)·총보수(0.45%)·추종지수(S&P International Dividend Opportunities
 *   Index)·보유종목수(약 100종)는 State Street 공식 정보·복수 소스로 2026년 8월 교차 확인.
 */
export const DWX_TICKER_CONTENT: TickerContent = {
  ticker: 'DWX',
  slug: 'dwx',
  categoryIds: ['high-dividend', 'international'],
  metaTitle: 'DWX 배당률·운용보수·구성 총정리 — SPDR S&P 인터내셔널 디비던드 ETF',
  metaDescription:
    'DWX(SPDR S&P 인터내셔널 디비던드 ETF)의 배당률·운용보수 0.45%·신흥국 포함 해외 고배당 구성을 정리했습니다. S&P 방법론의 해외 고배당 100종이 궁금하다면 여기서 확인하세요.',
  heroTagline: '선진국과 신흥국을 가리지 않고, 배당률이 높은 해외 기업 100종을 담는 ETF',
  sections: [
    {
      id: 'overview',
      navLabel: '개요',
      heading: 'DWX, 무엇을 추종하는 ETF인가',
      paragraphs: [
        'DWX(SPDR S&P 인터내셔널 디비던드 ETF, {{englishName}})는 2008년 2월 12일 상장한 ETF로, S&P International Dividend Opportunities Index를 추종합니다. State Street(SPDR)의 해외 고배당 라인업입니다.',
        'IDV(아이셰어즈)가 유럽·태평양·아시아·캐나다(EPAC) 선진국 위주로 지역을 한정하는 것과 달리, DWX는 신흥국을 포함한 더 넓은 범위에서 배당률 상위 약 100종을 뽑습니다.',
        '{{koreanName}}는 이 시뮬레이터의 계산 프리셋에서 배당률 {{dividendYield}}, 연 배당성장률(가정) {{dividendGrowth}}, {{frequencyLabel}} 지급을 기준으로 합니다.'
      ],
      stat: {
        label: '추종 지수',
        value: 'S&P International Dividend Opportunities Index',
        caption: '신흥국을 포함해 배당률이 높은 해외 기업 약 100종으로 구성'
      }
    },
    {
      id: 'dividend-yield',
      navLabel: '배당률',
      heading: '배당률 {{dividendYield}}, 신흥국 고배당주가 더해진 결과',
      paragraphs: [
        'DWX의 배당률은 {{dividendYield}} 안팎입니다. 신흥국 고배당주까지 편입 대상에 포함되면서, 선진국에 한정된 상품보다 배당률이 더 높게 형성되는 경향이 있습니다.',
        '신흥국 기업은 배당률이 높은 경우가 많지만, 그만큼 통화 변동성과 정치·경제적 불확실성도 함께 커집니다. DWX의 상대적으로 높은 배당률은 이런 위험을 일부 반영한 결과이기도 합니다.',
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
      heading: '배당률을 우선한 설계, 신흥국 변수까지 더해진다',
      paragraphs: [
        '이 시뮬레이터의 계산 프리셋은 DWX의 연 배당성장률(가정)을 {{dividendGrowth}}, 기대 총수익률을 {{expectedTotalReturn}}로 둡니다. 배당률을 우선하는 지수 설계라 성장률 가정은 낮은 편입니다.',
        '신흥국 기업의 배당은 선진국보다 실적·통화·정책 변수에 더 민감하게 반응하는 경향이 있습니다. 어떤 해는 배당이 크게 늘 수 있지만, 통화 위기나 정치적 불확실성이 커지면 배당이 갑자기 삭감될 수도 있습니다.',
        '환율 변동도 실제 수령하는 원화 기준 배당에 영향을 줍니다. 신흥국 통화는 선진국 통화보다 변동성이 큰 경향이 있어, 배당 자체가 늘어도 환율 때문에 체감 성장이 상쇄될 수 있습니다.'
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
      heading: '총보수 0.45% — IDV보다는 낮지만 여전히 높은 편',
      paragraphs: [
        'DWX의 총보수는 0.45%로, IDV(0.50%)보다는 조금 낮지만 VYMI·VIGI(각 0.07%)와 비교하면 여전히 높은 수준입니다.',
        '신흥국을 포함한 지수를 유지·관리하는 비용과 State Street의 운용 비용이 반영된 결과로 볼 수 있습니다. 신흥국 시장은 선진국보다 거래·정산 인프라가 상대적으로 덜 발달돼 있어 관리 비용이 더 들 수 있습니다.',
        '장기 재투자 시 이 보수 차이는 매년 조용히 복리로 누적됩니다. 같은 해외 고배당 카테고리 안에서 저비용 대안(VYMI)과 함께 비교해 보시는 것을 권합니다.'
      ],
      stat: {
        label: '운용보수(총보수)',
        value: '0.45%',
        caption: 'State Street 공식 정보·복수 소스 교차 확인(2026년 8월 기준)'
      }
    },
    {
      id: 'selection-criteria',
      navLabel: '구성 기준',
      heading: '선진국·신흥국을 가리지 않고, 배당률 상위 100종',
      paragraphs: [
        'DWX가 추종하는 지수는 미국을 제외한 전 세계(선진국+신흥국) 상장 기업 중 배당률이 높은 종목을 선별해 약 100종을 담습니다. 최소 시가총액·유동성 기준도 함께 적용됩니다.',
        '비중은 배당률에 가중치를 둔 방식으로 정해지며, 신흥국 비중이 IDV보다 상대적으로 높게 형성될 수 있습니다.',
        '연 1회 재구성되며, 배당률 기준을 더 이상 충족하지 못하는 종목은 편출됩니다.'
      ]
    },
    {
      id: 'who-and-tradeoffs',
      navLabel: '적합성·트레이드오프',
      heading: '어떤 투자자에게 맞고, 무엇을 포기하는가',
      paragraphs: [
        'DWX는 이런 투자자에게 맞습니다. 신흥국까지 포함한 더 높은 해외 배당률을 원하는 사람, IDV(선진국 한정)와는 다른 지역 범위의 해외 고배당 ETF를 비교해 보고 싶은 사람, S&P 방법론의 배당 스크리닝을 신뢰하는 사람입니다.',
        '포기하는 것도 있습니다. 첫째, 총보수 0.45%는 VYMI(0.07%)보다 훨씬 높습니다. 둘째, 신흥국 통화·정치 변수가 배당 예측 가능성을 낮춥니다. 셋째, 100종으로 압축돼 있어 VYMI보다 개별 종목 영향력이 큽니다.',
        '더 낮은 보수와 안정적인 선진국 위주 분산을 원한다면 VYMI·IDV, 배당 성장에 무게를 두고 싶다면 VIGI와 함께 비교해 보세요.'
      ]
    }
  ],
  faqs: [
    {
      question: 'DWX 배당률은 얼마인가요?',
      answer:
        '이 시뮬레이터가 쓰는 계산 프리셋 기준 DWX의 명목 배당률(세전)은 {{dividendYield}}입니다. 신흥국 고배당주가 포함돼 IDV 같은 선진국 한정 상품보다 높게 형성되는 경향이 있습니다.'
    },
    {
      question: 'DWX는 어떤 지수를 추종하나요?',
      answer:
        'S&P International Dividend Opportunities Index를 추종합니다. 미국을 제외한 전 세계(선진국+신흥국) 중 배당률이 높은 종목 약 100종으로 구성됩니다.'
    },
    {
      question: 'DWX 운용보수(총보수)는 얼마인가요?',
      answer: '0.45%입니다. IDV(0.50%)보다는 조금 낮지만 VYMI(0.07%)보다는 훨씬 높은 수준입니다.'
    },
    {
      question: 'DWX와 IDV는 무엇이 다른가요?',
      answer:
        'IDV는 유럽·태평양·아시아·캐나다(EPAC) 선진국 위주로 지역을 한정하지만, DWX는 신흥국을 포함한 더 넓은 범위에서 배당률 상위 종목을 담습니다. 그만큼 DWX의 배당률이 대체로 더 높은 편입니다.'
    },
    {
      question: 'DWX는 몇 종목을 담고 있나요?',
      answer: '약 100종입니다. 연 1회 재구성되며 배당률 기준을 충족하지 못하는 종목은 편출됩니다.'
    },
    {
      question: 'DWX 배당은 얼마나 자주 지급되나요?',
      answer: 'DWX는 {{frequencyLabel}} 지급됩니다. 정확한 배당락일·지급일은 매 분기 공지에 따라 달라질 수 있습니다.'
    },
    {
      question: 'DWX 배당에 붙는 세금은 어떻게 계산하나요?',
      answer:
        '해외 배당은 원천징수 등 세무 처리가 국가마다 다를 수 있고, 세율은 거주 국가와 계좌 종류에 따라 달라져 이 페이지가 대신 알려드릴 수 없습니다. 이 시뮬레이터에서는 세율을 직접 입력해 세후 배당을 계산해 볼 수 있습니다.'
    }
  ],
  reference: {
    trackedIndex: 'S&P International Dividend Opportunities Index',
    inceptionYear: 2008,
    expenseRatioPercent: 0.45,
    holdingsCountApprox: 100,
    paymentMonthsNote: '연 4회 분기 지급',
    asOfNote:
      '상장일(2008년 2월 12일)·총보수(0.45%)·추종지수(S&P International Dividend Opportunities Index)·보유종목수(약 100종)는 State Street 공식 정보와 복수 소스로 2026년 8월 교차 확인한 사실입니다. 국가별 비중·정확한 배당 CAGR은 신뢰할 단일 현재값을 확인하지 못해 이 페이지에서는 다루지 않았습니다. 배당률·배당성장률·기대수익률 등 계산에 쓰이는 값은 이 페이지가 아니라 시뮬레이터 계산 프리셋을 그대로 따릅니다.'
  },
  relatedTickers: [
    { ticker: 'IDV', relationLabel: '신흥국을 제외한 선진국 위주 해외 고배당을 원한다면' },
    { ticker: 'VYMI', relationLabel: '더 낮은 보수의 넓은 해외 고배당 ETF를 원한다면' },
    { ticker: 'VIGI', relationLabel: '배당 성장에 더 무게를 둔 해외 ETF를 원한다면' },
    { ticker: 'SCHY', relationLabel: '해외 배당성장 쪽에 무게를 두고 싶다면' }
  ],
  // SPDR(State Street) 정체성 — 딥 네이비 앵커 → 골든옐로. 장식 전용.
  accent: {
    from: '#12203d',
    to: '#d9a63c',
    textLight: '#1c3157',
    textDark: '#eecb7f'
  },
  disclaimer:
    '이 페이지는 정보 제공을 목적으로 하며 투자 자문이 아닙니다. 배당률·주가·운용보수·세금 등은 시장 상황과 정책에 따라 변동될 수 있으며, 과거 성과가 미래 수익을 보장하지 않습니다. 신흥국 투자는 선진국보다 통화·정치적 불확실성이 큰 경향이 있습니다. 투자 판단과 그 결과에 대한 책임은 투자자 본인에게 있습니다.',
  contentUpdatedAt: '2026-08-06'
};
