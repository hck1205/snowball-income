import type { TickerContent } from './TickerContent.types';

/**
 * IVV(아이셰어즈 코어 S&P 500 ETF) SEO 랜딩 콘텐츠.
 *
 * 숫자 출처:
 * - 계산 6필드는 `shared/constants/presets`(`CORE_INDEX_ETFS.IVV`)에서 그대로 온다.
 * - 운용보수 0.03%·상장일 2000년 5월 15일·추종지수 S&P 500 지수는 블랙록(iShares) 공식
 *   상품 페이지로 2026년 8월 확인.
 */
export const IVV_TICKER_CONTENT: TickerContent = {
  ticker: 'IVV',
  slug: 'ivv',
  categoryIds: ['core-index'],
  metaTitle: 'IVV 배당률·운용보수·추종지수 총정리 — 아이셰어즈 코어 S&P 500 ETF',
  metaDescription:
    'IVV(아이셰어즈 코어 S&P 500 ETF)의 배당률·운용보수 0.03%·추종지수를 정리했습니다. 블랙록이 운용하는 S&P 500 ETF의 기본값을 여기서 확인하세요.',
  heroTagline: 'VOO·SPY와 같은 지수를, 블랙록의 아이셰어즈 브랜드로 담는 방법',
  sections: [
    {
      id: 'overview',
      navLabel: '개요',
      heading: 'IVV, 무엇을 추종하는 ETF인가',
      paragraphs: [
        'IVV(아이셰어즈 코어 S&P 500 ETF, {{englishName}})는 블랙록의 아이셰어즈(iShares) 브랜드로 운용되는 S&P 500 추종 ETF입니다. 2000년 5월 15일 상장했고, VOO·SPY와 함께 S&P 500을 추종하는 3대 상품으로 꼽힙니다.',
        '세 상품 모두 같은 지수를 추종하기 때문에 성과 차이는 거의 없습니다. 실질적인 선택 기준은 발행사에 대한 선호, 운용보수, 유동성 정도입니다.',
        '{{koreanName}}는 이 시뮬레이터의 계산 프리셋에서 배당률 {{dividendYield}}, 연 배당성장률(가정) {{dividendGrowth}}, {{frequencyLabel}} 지급으로 잡혀 있습니다.'
      ],
      stat: {
        label: '추종 지수',
        value: 'S&P 500 지수',
        caption: '미국 대형주 약 500종, 시가총액 가중 방식'
      }
    },
    {
      id: 'dividend-yield',
      navLabel: '배당률',
      heading: '배당률 {{dividendYield}}, VOO·SPY와 사실상 동일',
      paragraphs: [
        'IVV의 배당률은 {{dividendYield}} 안팎으로, 같은 S&P 500을 추종하는 VOO·SPY와 사실상 같은 수준입니다.',
        '배당률만으로 세 상품 중 하나를 고를 이유는 크지 않습니다. 담는 종목과 비중이 동일하기 때문입니다.',
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
      heading: '배당성장률 가정은 미국 대형주 시장 전체의 성장 가정',
      paragraphs: [
        '이 시뮬레이터의 계산 프리셋은 IVV의 연 배당성장률(가정)을 {{dividendGrowth}}로, 기대 총수익률을 {{expectedTotalReturn}}로 두며, VOO·SPY와 동일합니다.',
        'IVV는 개별 종목을 고르지 않기 때문에 어느 한 기업의 배당 정책 변화가 지수 전체를 크게 흔들지 않습니다. S&P 500에 속한 500종 전체의 평균적인 이익·배당 흐름이 반영됩니다.',
        '이 가정 역시 과거 실적의 반복이 아니라 미래에 대한 전망이며, 실제 성장률은 경기 국면에 따라 달라질 수 있습니다.'
      ]
    },
    {
      id: 'expense-ratio',
      navLabel: '운용보수',
      heading: '운용보수 0.03%, VOO와 동률의 최저 수준',
      paragraphs: [
        'IVV의 운용보수(총보수)는 0.03%로, VOO와 동률입니다. SPY(0.0945%)보다는 세 배가량 낮은 수준입니다.',
        '보수는 매년 조용히 수익률에서 빠져나가므로, 낮은 보수는 장기 재투자 운용에서 실질적인 우위가 됩니다. IVV·VOO 사이에서는 보수 차이가 없어, 순자산 규모나 발행사 선호로 고르는 경우가 많습니다.'
      ],
      stat: {
        label: '운용보수(총보수)',
        value: '0.03%',
        caption: '상장 이후 유지된 수준(2026년 기준 재확인) — VOO와 동률'
      }
    },
    {
      id: 'selection-criteria',
      navLabel: '구성 기준',
      heading: 'S&P 500 지수 — VOO·SPY와 동일한 구성',
      paragraphs: [
        'IVV가 추종하는 S&P 500 지수는 미국 대형주 중에서 시가총액·유동성·수익성 기준을 통과한 약 500종으로 구성됩니다. S&P 다우존스 인덱스 위원회가 정기적으로 재검토하며, 기준 미달 기업은 다른 종목으로 교체됩니다.',
        '시가총액 가중 방식이라 초대형주 소수의 비중이 지수 전체에서 큰 부분을 차지합니다. 담는 종목과 비중은 VOO·SPY와 사실상 동일합니다.',
        '이 페이지는 상위 보유 종목의 정확한 비중을 다루지 않습니다 — 분기마다 시가총액 순위가 바뀌는 값이라 신뢰할 단일 현재값을 확인하지 못했기 때문입니다.'
      ]
    },
    {
      id: 'who-and-tradeoffs',
      navLabel: '적합성·트레이드오프',
      heading: '어떤 투자자에게 맞고, 무엇을 포기하는가',
      paragraphs: [
        'IVV는 이런 투자자에게 잘 맞습니다. S&P 500에 낮은 비용으로 노출되고 싶은 사람, 블랙록·아이셰어즈 브랜드를 선호하는 사람, VOO와 큰 차이 없이 선택지를 넓히고 싶은 사람입니다.',
        '트레이드오프는 VOO와 동일합니다. 배당률이 낮아 현금흐름 목적과는 결이 다르고, 미국 대형주에만 집중돼 국제 분산은 별도로 챙겨야 합니다.',
        '지금 더 높은 배당률이 목적이라면 SCHD·VYM, 국제 분산까지 원한다면 VT·VXUS와 함께 비교해 보시기 바랍니다.'
      ]
    }
  ],
  faqs: [
    {
      question: 'IVV 배당률은 얼마인가요?',
      answer: '이 시뮬레이터가 쓰는 계산 프리셋 기준 IVV의 명목 배당률(세전)은 {{dividendYield}}입니다. 같은 S&P 500을 추종하는 VOO·SPY와 사실상 동일한 수준입니다.'
    },
    {
      question: 'IVV는 언제 상장했나요?',
      answer: '2000년 5월 15일 상장했습니다.'
    },
    {
      question: 'IVV 운용보수는 얼마인가요?',
      answer: '0.03%로, VOO와 동률이며 SPY(0.0945%)보다 낮습니다.'
    },
    {
      question: 'IVV와 VOO, SPY는 무엇이 다른가요?',
      answer:
        '셋 다 S&P 500을 추종합니다. IVV·VOO는 운용보수가 0.03%로 동일하고, SPY는 신탁형(UIT) 구조라 보수가 조금 더 높은 대신 유동성이 가장 큽니다.'
    },
    {
      question: 'IVV 배당은 얼마나 자주 지급되나요?',
      answer: 'IVV는 {{frequencyLabel}} 지급합니다. 정확한 기준일·지급일은 매 분기 공지에 따라 달라질 수 있습니다.'
    },
    {
      question: 'IVV는 어떤 지수를 추종하나요?',
      answer: 'S&P 500 지수를 추종합니다. 미국 대형주 약 500종을 시가총액 가중 방식으로 담습니다.'
    },
    {
      question: 'IVV 배당에 붙는 세금은 어떻게 계산하나요?',
      answer: '배당소득세는 거주 국가와 계좌 종류에 따라 달라져 이 페이지가 대신 알려드릴 수 없습니다. 이 시뮬레이터에서는 세율을 직접 입력해 세후 배당을 계산해 볼 수 있습니다.'
    }
  ],
  reference: {
    trackedIndex: 'S&P 500 지수',
    inceptionYear: 2000,
    expenseRatioPercent: 0.03,
    holdingsCountApprox: 500,
    paymentMonthsNote: '연 4회 분기 지급',
    asOfNote:
      '운용보수(0.03%)·상장일(2000년 5월 15일)·추종지수(S&P 500 지수)는 블랙록(iShares) 공식 상품 페이지로 2026년 8월 확인한 사실입니다. 상위 보유 종목 비중은 분기마다 바뀌어 이 페이지에서는 다루지 않았습니다. 배당률·배당성장률·기대수익률 등 계산에 쓰이는 값은 이 페이지가 아니라 시뮬레이터 계산 프리셋을 그대로 따릅니다.'
  },
  relatedTickers: [
    { ticker: 'VOO', relationLabel: '뱅가드 브랜드의 동일한 지수 상품과 비교한다면' },
    { ticker: 'SPY', relationLabel: '유동성이 가장 큰 상품과 비교한다면' },
    { ticker: 'VTI', relationLabel: '대형주뿐 아니라 중소형주까지 담고 싶다면' },
    { ticker: 'SCHD', relationLabel: '자본 성장 대신 배당성장에 무게를 두고 싶다면' }
  ],
  // 블랙록(iShares) 정체성 — 딥 틸 앵커 → 브라이트 틸. 장식 전용(대비는 textLight/Dark로 확보).
  accent: {
    from: '#0a2b28',
    to: '#2bb0a0',
    textLight: '#0d4a44',
    textDark: '#6ee0d2'
  },
  disclaimer:
    '이 페이지는 정보 제공을 목적으로 하며 투자 자문이 아닙니다. 배당률·주가·운용보수·세금 등은 시장 상황과 정책에 따라 변동될 수 있으며, 과거 성과가 미래 수익을 보장하지 않습니다. 투자 판단과 그 결과에 대한 책임은 투자자 본인에게 있습니다.',
  contentUpdatedAt: '2026-08-06'
};
