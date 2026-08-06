import type { TickerContent } from './TickerContent.types';

/**
 * DIA(SPDR 다우존스 산업평균 ETF) SEO 랜딩 콘텐츠.
 *
 * 숫자 출처:
 * - 계산 6필드는 `shared/constants/presets`(`CORE_INDEX_ETFS.DIA`)에서 그대로 온다.
 * - 상장일 1998년 1월 14일·운용보수 0.16%·추종지수(다우존스 산업평균지수, 30종)는
 *   스테이트 스트리트(SSGA) 공식 상품 페이지로 2026년 8월 확인.
 */
export const DIA_TICKER_CONTENT: TickerContent = {
  ticker: 'DIA',
  slug: 'dia',
  categoryIds: ['core-index'],
  metaTitle: 'DIA 배당률·운용보수·다우존스 30종 총정리 — SPDR 다우존스 산업평균 ETF',
  metaDescription:
    'DIA(SPDR 다우존스 산업평균 ETF)의 배당률·운용보수 0.16%·다우존스 30종 구성을 정리했습니다. 미국 대표 우량주 30종에 집중 투자하는 방법을 확인하세요.',
  heroTagline: '미국을 대표하는 우량 기업 단 30종으로 압축한, 가장 오래된 지수의 ETF',
  sections: [
    {
      id: 'overview',
      navLabel: '개요',
      heading: 'DIA, 무엇을 추종하는 ETF인가',
      paragraphs: [
        'DIA(SPDR 다우존스 산업평균 ETF, {{englishName}})는 다우존스 산업평균지수(DJIA)를 추종하는 ETF입니다. 1896년 처음 만들어진 이 지수는 미국에서 가장 오래된 주가지수이며, DIA는 1998년 1월 14일 상장했습니다.',
        'S&P 500이 약 500종, 나스닥 100이 100종을 담는 것과 달리, 다우존스 산업평균지수는 단 30종으로 구성됩니다. 시가총액이 아니라 주가 자체를 가중치로 삼는 독특한 방식(주가 가중)을 씁니다.',
        '{{koreanName}}는 이 시뮬레이터의 계산 프리셋에서 배당률 {{dividendYield}}, 연 배당성장률(가정) {{dividendGrowth}}, {{frequencyLabel}} 지급으로 잡혀 있습니다.'
      ],
      stat: {
        label: '추종 지수',
        value: '다우존스 산업평균지수(DJIA)',
        caption: '미국 대표 우량주 30종, 주가 가중 방식(시가총액 가중이 아님)'
      }
    },
    {
      id: 'dividend-yield',
      navLabel: '배당률',
      heading: '배당률 {{dividendYield}}, 우량주 집중이 만드는 값',
      paragraphs: [
        'DIA의 배당률은 {{dividendYield}} 안팎으로, VOO보다 높은 편입니다. 다우존스 30종은 성숙한 대형 우량주 위주로 구성돼 있어 배당을 지급하는 비율이 S&P 500 전체보다 높습니다.',
        '다만 30종이라는 좁은 구성 때문에 특정 종목의 배당 정책 변화가 지수 전체에 미치는 영향이 S&P 500보다 큽니다.',
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
      heading: '배당성장률 가정은, 대표 우량주 30종의 성장 가정',
      paragraphs: [
        '이 시뮬레이터의 계산 프리셋은 DIA의 연 배당성장률(가정)을 {{dividendGrowth}}로, 기대 총수익률을 {{expectedTotalReturn}}로 두며, VT와 동일한 값을 씁니다. 성숙한 대형 우량주 중심 구성의 안정적이지만 상대적으로 완만한 성장 전망을 반영한 것입니다.',
        'DIA는 30종만 담기 때문에, 어느 한 종목의 실적이나 배당 정책 변화가 지수 전체 흐름에 미치는 영향이 큽니다.',
        '이 가정 역시 과거 실적의 반복이 아니라 전망이며, 구성 종목의 실적에 따라 실제 성과는 달라질 수 있습니다.'
      ]
    },
    {
      id: 'expense-ratio',
      navLabel: '운용보수',
      heading: '운용보수 0.16%, S&P 500 상품보다 높은 이유',
      paragraphs: [
        'DIA의 운용보수(총보수)는 0.16%로, VOO·IVV(0.03%)보다 높습니다. DIA도 SPY와 마찬가지로 신탁형(UIT, Unit Investment Trust) 구조를 유지하고 있어 구조적으로 개방형 펀드보다 비용이 높습니다.',
        '30종만 담는 좁은 지수라는 특성상 상품 자체의 운용 복잡도가 낮은데도 보수가 상대적으로 높은 편이라, 장기 재투자 목적이라면 이 차이를 감안할 필요가 있습니다.'
      ],
      stat: {
        label: '운용보수(총보수)',
        value: '0.16%',
        caption: '2026년 기준 재확인 — VOO·IVV(0.03%)보다 높음'
      }
    },
    {
      id: 'selection-criteria',
      navLabel: '구성 기준',
      heading: '시가총액이 아니라, 주가 자체로 가중치를 정한다',
      paragraphs: [
        '다우존스 산업평균지수는 다른 주요 지수와 달리 시가총액이 아니라 개별 종목의 주가 자체로 가중치를 정하는 "주가 가중" 방식을 씁니다. 주가가 높은 종목일수록 지수에 미치는 영향이 커지고, 회사 규모(시가총액)와는 직접 비례하지 않습니다.',
        '30종의 구성 종목은 다우존스 지수 위원회가 미국 경제를 대표할 만한 우량 기업을 선정해 정기적으로 교체합니다. 정보기술 기업 비중이 S&P 500보다는 낮게 형성되는 경향이 있습니다.',
        '30종이라는 좁은 구성 때문에 정확한 상위 종목 비중은 종목 교체와 주가 변동에 따라 자주 바뀌는 값이라 이 페이지에서는 다루지 않습니다.'
      ]
    },
    {
      id: 'who-and-tradeoffs',
      navLabel: '적합성·트레이드오프',
      heading: '어떤 투자자에게 맞고, 무엇을 포기하는가',
      paragraphs: [
        'DIA는 이런 투자자에게 잘 맞습니다. 미국을 대표하는 소수의 우량 기업에 집중 투자하고 싶은 사람, 오랜 역사를 가진 지수의 안정성을 선호하는 사람, 뉴스에서 자주 언급되는 "다우지수"를 직접 담고 싶은 사람입니다.',
        '트레이드오프도 분명합니다. 첫째, 30종뿐이라 S&P 500·전체시장 ETF보다 분산 효과가 떨어집니다. 둘째, 주가 가중 방식이라 회사 규모와 지수 영향력이 비례하지 않는 독특한 구조입니다. 셋째, 운용보수가 S&P 500 상품보다 높습니다.',
        '더 넓은 분산을 원한다면 VOO·VTI, 지금 더 높은 배당률을 원한다면 SCHD·VYM과 함께 비교해 보시기 바랍니다.'
      ]
    }
  ],
  faqs: [
    {
      question: 'DIA 배당률은 얼마인가요?',
      answer: '이 시뮬레이터가 쓰는 계산 프리셋 기준 DIA의 명목 배당률(세전)은 {{dividendYield}}입니다. 우량주 30종 집중 구성이라 VOO보다 높은 편입니다.'
    },
    {
      question: 'DIA는 어떤 지수를 추종하나요?',
      answer: '다우존스 산업평균지수(DJIA)를 추종합니다. 미국 대표 우량주 30종을 주가 가중 방식으로 담습니다.'
    },
    {
      question: 'DIA 운용보수는 얼마인가요?',
      answer: '0.16%로, VOO·IVV(0.03%)보다 높습니다. 신탁형(UIT) 구조를 유지하는 데 따른 차이입니다.'
    },
    {
      question: 'DIA는 언제 상장했나요?',
      answer: '1998년 1월 14일 상장했습니다.'
    },
    {
      question: 'DIA 배당은 얼마나 자주 지급되나요?',
      answer: 'DIA는 {{frequencyLabel}} 지급합니다. 정확한 기준일·지급일은 매 분기 공지에 따라 달라질 수 있습니다.'
    },
    {
      question: 'DIA와 SPY는 무엇이 다른가요?',
      answer:
        'DIA는 다우존스 30종을 주가 가중 방식으로, SPY는 S&P 500 약 500종을 시가총액 가중 방식으로 담습니다. 종목 수와 가중 방식 모두 다릅니다.'
    },
    {
      question: 'DIA 배당에 붙는 세금은 어떻게 계산하나요?',
      answer: '배당소득세는 거주 국가와 계좌 종류에 따라 달라져 이 페이지가 대신 알려드릴 수 없습니다. 이 시뮬레이터에서는 세율을 직접 입력해 세후 배당을 계산해 볼 수 있습니다.'
    }
  ],
  reference: {
    trackedIndex: '다우존스 산업평균지수(Dow Jones Industrial Average, DJIA)',
    inceptionYear: 1998,
    expenseRatioPercent: 0.16,
    holdingsCountApprox: 30,
    paymentMonthsNote: '연 4회 분기 지급',
    asOfNote:
      '상장일(1998년 1월 14일)·운용보수(0.16%)·추종지수(다우존스 산업평균지수)는 스테이트 스트리트(SSGA) 공식 상품 페이지로 2026년 8월 확인한 사실입니다. 상위 종목 비중은 종목 교체·주가 변동에 따라 자주 바뀌어 이 페이지에서는 다루지 않았습니다. 배당률·배당성장률·기대수익률 등 계산에 쓰이는 값은 이 페이지가 아니라 시뮬레이터 계산 프리셋을 그대로 따릅니다.'
  },
  relatedTickers: [
    { ticker: 'SPY', relationLabel: '더 넓은 500종 분산을 원한다면' },
    { ticker: 'VOO', relationLabel: '더 낮은 비용으로 대형주 전체를 담고 싶다면' },
    { ticker: 'SCHD', relationLabel: '배당성장에 무게를 둔 다른 방식의 우량주 선별을 원한다면' },
    { ticker: 'JNJ', relationLabel: '다우존스 구성 종목 중 하나를 개별로 더 보고 싶다면' }
  ],
  // 스테이트 스트리트(SPDR) 정체성 — SPY와 같은 계열의 딥 네이비. 장식 전용(대비는 textLight/Dark로 확보).
  accent: {
    from: '#0a1f3d',
    to: '#3a6fa8',
    textLight: '#123a63',
    textDark: '#8ab8e8'
  },
  disclaimer:
    '이 페이지는 정보 제공을 목적으로 하며 투자 자문이 아닙니다. 배당률·주가·운용보수·세금 등은 시장 상황과 정책에 따라 변동될 수 있으며, 과거 성과가 미래 수익을 보장하지 않습니다. 투자 판단과 그 결과에 대한 책임은 투자자 본인에게 있습니다.',
  contentUpdatedAt: '2026-08-06'
};
