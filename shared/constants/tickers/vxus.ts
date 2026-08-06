import type { TickerContent } from './TickerContent.types';

/**
 * VXUS(뱅가드 토탈 국제 주식 ETF) SEO 랜딩 콘텐츠.
 *
 * 숫자 출처:
 * - 계산 6필드는 `shared/constants/presets`(`CORE_INDEX_ETFS.VXUS`)에서 그대로 온다.
 * - 운용보수 0.05%·상장일 2011년 1월 26일·추종지수(FTSE 글로벌 올캡 익스 US 지수)는
 *   뱅가드 공식 상품 페이지로 2026년 8월 확인.
 */
export const VXUS_TICKER_CONTENT: TickerContent = {
  ticker: 'VXUS',
  slug: 'vxus',
  categoryIds: ['core-index', 'international'],
  metaTitle: 'VXUS 배당률·운용보수·추종지수 총정리 — 뱅가드 토탈 국제 주식 ETF',
  metaDescription:
    'VXUS(뱅가드 토탈 국제 주식 ETF)의 배당률·운용보수 0.05%·미국을 뺀 전 세계 주식시장 구성을 정리했습니다. 미국 집중을 낮추는 국제 분산을 확인하세요.',
  heroTagline: '미국을 뺀 전 세계 선진국·신흥국 주식시장을, 한 종목으로',
  sections: [
    {
      id: 'overview',
      navLabel: '개요',
      heading: 'VXUS, 무엇을 추종하는 ETF인가',
      paragraphs: [
        'VXUS(뱅가드 토탈 국제 주식 ETF, {{englishName}})는 FTSE 글로벌 올캡 익스 US 지수를 추종합니다. 이름 그대로 미국을 뺀 전 세계 선진국·신흥국 주식시장을 시가총액 가중 방식으로 담는 상품으로, 2011년 1월 26일 상장했습니다.',
        'VT가 미국을 포함한 전 세계를 담는다면, VXUS는 미국을 의도적으로 제외합니다. VOO·VTI 같은 미국 자산과 조합해 미국 비중을 스스로 정하고 싶은 투자자가 주로 씁니다.',
        '{{koreanName}}는 이 시뮬레이터의 계산 프리셋에서 배당률 {{dividendYield}}, 연 배당성장률(가정) {{dividendGrowth}}, {{frequencyLabel}} 지급으로 잡혀 있습니다.'
      ],
      stat: {
        label: '추종 지수',
        value: 'FTSE 글로벌 올캡 익스 US 지수',
        caption: '미국을 제외한 선진국·신흥국 주식 전체, 시가총액 가중 방식'
      }
    },
    {
      id: 'dividend-yield',
      navLabel: '배당률',
      heading: '배당률 {{dividendYield}}, VOO보다 높은 이유',
      paragraphs: [
        'VXUS의 배당률은 {{dividendYield}} 안팎으로, VOO보다 뚜렷하게 높습니다. 유럽·일본을 비롯한 여러 선진국 시장은 미국보다 배당 성향이 높은 기업이 많은 편이라, 미국을 뺀 국제 시장을 모으면 배당률이 자연히 올라갑니다.',
        '다만 VXUS의 목적은 배당 극대화가 아니라 미국 밖 시장 전체에 대한 노출입니다. 배당률은 그 구조에서 자연히 따라오는 결과에 가깝습니다.',
        '배당률은 주가와 함께 매일 움직이므로 이 페이지의 값은 작성 시점 기준입니다. 내 조건에서 이 배당률이 만드는 현금흐름은 시뮬레이터에서 직접 계산해 보시기 바랍니다.'
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
      heading: '배당성장률 가정은, 미국 밖 시장 평균의 성장 가정',
      paragraphs: [
        '이 시뮬레이터의 계산 프리셋은 VXUS의 연 배당성장률(가정)을 {{dividendGrowth}}로, 기대 총수익률을 {{expectedTotalReturn}}로 둡니다. VOO보다 낮게 책정된 이 가정은 유럽·일본 등 성숙 경제권이 섞인 국제 시장의 성장 전망이 미국 시장보다 보수적으로 잡힌 결과입니다.',
        'VXUS는 유럽·아시아태평양·신흥국 등 여러 지역의 시장 흐름이 섞여 반영되므로, 어느 한 지역의 경기 침체가 지수 전체를 크게 흔들지는 않습니다.',
        '이 가정 역시 과거 실적의 반복이 아니라 전망이며, 지역별 경기·환율·통화 정책에 따라 실제 성과는 달라질 수 있습니다.'
      ]
    },
    {
      id: 'expense-ratio',
      navLabel: '운용보수',
      heading: '운용보수 0.05%, 국제 분산 치고는 낮은 비용',
      paragraphs: [
        'VXUS의 운용보수(총보수)는 0.05%입니다. VOO(0.03%)보다는 높지만, 수천 개 국제 종목을 한 상품에 담는 비용치고는 낮은 수준입니다.',
        '국제 주식 투자는 통화 환전·현지 세금 처리 등 미국 국내 투자보다 운용 비용이 더 들어가는데, VXUS는 이런 복잡성을 낮은 보수로 흡수합니다.'
      ],
      stat: {
        label: '운용보수(총보수)',
        value: '0.05%',
        caption: '2026년 기준 재확인'
      }
    },
    {
      id: 'selection-criteria',
      navLabel: '구성 기준',
      heading: '선진국과 신흥국, 시가총액이 비중을 정한다',
      paragraphs: [
        'VXUS는 FTSE 글로벌 올캡 익스 US 지수를 추종하며, 미국을 제외한 전 세계 대형·중형·소형주를 시가총액 가중 방식으로 담습니다. 유럽·일본 등 선진국 비중이 신흥국보다 큰 경향이 있습니다.',
        '개별 국가의 비중을 인위적으로 배분하지 않고, 그 나라 상장 주식 시가총액이 클수록 지수 내 비중도 커집니다. 정확한 국가별·지역별 비중은 계속 바뀌는 값이라 이 페이지에서는 다루지 않습니다.',
        'VXUS는 선진국과 신흥국을 한 상품에 함께 담는데, 신흥국만 따로 떼어 더 높은 비중으로 담고 싶다면 별도의 신흥국 전용 ETF를 조합하는 방법도 있습니다.'
      ]
    },
    {
      id: 'who-and-tradeoffs',
      navLabel: '적합성·트레이드오프',
      heading: '어떤 투자자에게 맞고, 무엇을 포기하는가',
      paragraphs: [
        'VXUS는 이런 투자자에게 잘 맞습니다. VOO·VTI 같은 미국 자산에 이미 투자하고 있고 미국 비중을 스스로 조정하고 싶은 사람, 미국 시장 집중 위험을 낮추고 싶은 사람, 국제 분산을 한 종목으로 완성하고 싶은 사람입니다.',
        '트레이드오프도 있습니다. 첫째, 환율 변동이 원화 환산 수익률에 직접 영향을 줍니다. 둘째, 미국 시장보다 최근 수년간 상대적으로 저조한 성과를 보인 기간이 있었습니다. 셋째, VT 한 종목으로 전 세계를 담는 것보다 VOO와의 비중 조정이라는 추가 관리가 필요합니다.',
        '미국을 포함한 전 세계를 한 종목으로 원한다면 VT, 배당성장에 무게를 둔 국제 자산을 원한다면 SCHY·VIGI와 함께 비교해 보시기 바랍니다.'
      ]
    }
  ],
  faqs: [
    {
      question: 'VXUS 배당률은 얼마인가요?',
      answer: '이 시뮬레이터가 쓰는 계산 프리셋 기준 VXUS의 명목 배당률(세전)은 {{dividendYield}}입니다. 미국을 뺀 국제 시장을 담아 VOO보다 배당률이 높은 편입니다.'
    },
    {
      question: 'VXUS는 어떤 지수를 추종하나요?',
      answer: 'FTSE 글로벌 올캡 익스 US 지수를 추종합니다. 미국을 제외한 선진국·신흥국 주식 전체를 시가총액 가중 방식으로 담습니다.'
    },
    {
      question: 'VXUS 운용보수는 얼마인가요?',
      answer: '0.05%입니다. VOO(0.03%)보다는 높지만 국제 분산 상품치고는 낮은 수준입니다.'
    },
    {
      question: 'VXUS는 언제 상장했나요?',
      answer: '2011년 1월 26일 상장했습니다.'
    },
    {
      question: 'VXUS 배당은 얼마나 자주 지급되나요?',
      answer: 'VXUS는 {{frequencyLabel}} 지급합니다. 정확한 기준일·지급일은 매 분기 공지에 따라 달라질 수 있습니다.'
    },
    {
      question: 'VXUS와 VT는 무엇이 다른가요?',
      answer:
        'VT는 미국을 포함한 전 세계를 한 종목으로 담고, VXUS는 미국을 제외합니다. VOO 같은 미국 자산을 이미 갖고 있고 국제 비중을 직접 조정하고 싶다면 VXUS, 한 종목으로 끝내고 싶다면 VT가 더 맞습니다.'
    },
    {
      question: 'VXUS 배당에 붙는 세금은 어떻게 계산하나요?',
      answer: '배당소득세는 거주 국가와 계좌 종류에 따라 달라져 이 페이지가 대신 알려드릴 수 없습니다. 이 시뮬레이터에서는 세율을 직접 입력해 세후 배당을 계산해 볼 수 있습니다.'
    }
  ],
  reference: {
    trackedIndex: 'FTSE 글로벌 올캡 익스 US 지수(FTSE Global All Cap ex US Index)',
    inceptionYear: 2011,
    expenseRatioPercent: 0.05,
    paymentMonthsNote: '연 4회 분기 지급',
    asOfNote:
      '운용보수(0.05%)·상장일(2011년 1월 26일)·추종지수(FTSE 글로벌 올캡 익스 US 지수)는 뱅가드 공식 상품 페이지로 2026년 8월 확인한 사실입니다. 보유종목수·국가별 비중은 계속 바뀌어 이 페이지에서는 다루지 않았습니다. 배당률·배당성장률·기대수익률 등 계산에 쓰이는 값은 이 페이지가 아니라 시뮬레이터 계산 프리셋을 그대로 따릅니다.'
  },
  relatedTickers: [
    { ticker: 'VT', relationLabel: '미국까지 포함해 한 종목으로 끝내고 싶다면' },
    { ticker: 'VOO', relationLabel: '이 상품과 함께 미국 비중을 직접 조정하고 싶다면' },
    { ticker: 'SCHY', relationLabel: '국제 시장에서 배당성장에 무게를 두고 싶다면' },
    { ticker: 'VYMI', relationLabel: '국제 시장에서 더 높은 배당률을 원한다면' }
  ],
  // 뱅가드(Vanguard) 정체성 — VT보다 한 단계 더 옅은 버건디(국제 전용 뉘앙스). 장식 전용.
  accent: {
    from: '#33121c',
    to: '#77293e',
    textLight: '#4f1524',
    textDark: '#c98494'
  },
  disclaimer:
    '이 페이지는 정보 제공을 목적으로 하며 투자 자문이 아닙니다. 배당률·주가·운용보수·세금 등은 시장 상황과 정책에 따라 변동될 수 있으며, 과거 성과가 미래 수익을 보장하지 않습니다. 투자 판단과 그 결과에 대한 책임은 투자자 본인에게 있습니다.',
  contentUpdatedAt: '2026-08-06'
};
