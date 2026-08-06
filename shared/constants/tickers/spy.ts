import type { TickerContent } from './TickerContent.types';

/**
 * SPY(SPDR S&P 500 ETF 트러스트) SEO 랜딩 콘텐츠.
 *
 * 숫자 출처:
 * - 계산 6필드는 `shared/constants/presets`(`CORE_INDEX_ETFS.SPY`)에서 그대로 온다.
 * - 상장일 1993년 1월 22일(미국 최초의 상장지수펀드)·운용보수 0.0945%(약 0.09%)·추종지수
 *   S&P 500 지수는 스테이트 스트리트(SSGA) 공식 상품 페이지로 2026년 8월 확인.
 * - SPY는 신탁형(UIT, Unit Investment Trust) 구조를 유지하고 있어 VOO·IVV(개방형 펀드)보다
 *   운용보수가 소폭 높다.
 */
export const SPY_TICKER_CONTENT: TickerContent = {
  ticker: 'SPY',
  slug: 'spy',
  categoryIds: ['core-index'],
  metaTitle: 'SPY 배당률·운용보수·S&P 500 지수 총정리 — 최초의 미국 ETF',
  metaDescription:
    'SPY(SPDR S&P 500 ETF 트러스트)의 배당률·운용보수 0.0945%·1993년 상장 이력을 정리했습니다. 세계 최초의 상장지수펀드가 궁금하다면 여기서 확인하세요.',
  heroTagline: '1993년, 상장지수펀드라는 개념 자체를 처음 만든 상품',
  sections: [
    {
      id: 'overview',
      navLabel: '개요',
      heading: 'SPY, 무엇을 추종하는 ETF인가',
      paragraphs: [
        'SPY(SPDR S&P 500 ETF 트러스트, {{englishName}})는 S&P 500 지수를 추종하는 ETF입니다. 1993년 1월 22일 상장한 SPY는 미국에서 최초로 만들어진 상장지수펀드(ETF)로 기록돼 있습니다.',
        'VOO·IVV와 추종하는 지수는 동일합니다. 다만 SPY는 여전히 신탁형(UIT, Unit Investment Trust) 구조를 유지하고 있는데, 이는 나중에 만들어진 개방형 ETF 구조와 법적 성격이 다릅니다 — 배당 재투자 방식이나 증권 대여 수익 활용에서 개방형 상품보다 유연성이 떨어집니다.',
        '{{koreanName}}는 이 시뮬레이터의 계산 프리셋에서 배당률 {{dividendYield}}, 연 배당성장률(가정) {{dividendGrowth}}, {{frequencyLabel}} 지급으로 잡혀 있습니다.'
      ],
      stat: {
        label: '상장일',
        value: '1993년 1월 22일',
        caption: '미국 최초의 상장지수펀드(ETF)'
      }
    },
    {
      id: 'dividend-yield',
      navLabel: '배당률',
      heading: '배당률 {{dividendYield}}, VOO·IVV와 사실상 동일',
      paragraphs: [
        'SPY의 배당률은 {{dividendYield}} 안팎으로, 같은 S&P 500을 추종하는 VOO·IVV와 사실상 같은 수준입니다. 추종 지수가 동일하니 배당률도 큰 차이가 나지 않는 것이 당연합니다.',
        '세 상품의 실질적인 차이는 배당률이 아니라 구조와 비용, 유동성에 있습니다. SPY는 하루 거래대금이 가장 큰 ETF 중 하나로, 기관 투자자·단기 트레이더가 특히 선호합니다.',
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
        '이 시뮬레이터의 계산 프리셋은 SPY의 연 배당성장률(가정)을 {{dividendGrowth}}로, 기대 총수익률을 {{expectedTotalReturn}}로 두며, 이는 VOO·IVV와 동일합니다. 같은 지수를 추종하는 만큼 장기 성장 가정도 동일하게 취급합니다.',
        'SPY는 개별 종목을 고르지 않기 때문에 어느 한 기업의 배당 정책 변화가 지수 전체를 크게 흔들지 않습니다. S&P 500에 속한 500종 전체의 평균적인 이익·배당 흐름이 반영됩니다.',
        '이 가정 역시 과거 실적의 반복이 아니라 미래에 대한 전망이며, 실제 성장률은 경기 국면에 따라 달라질 수 있습니다.'
      ]
    },
    {
      id: 'expense-ratio',
      navLabel: '운용보수',
      heading: '운용보수 0.0945% — VOO·IVV보다 소폭 높은 이유',
      paragraphs: [
        'SPY의 운용보수(총보수)는 0.0945%(약 0.09%)로, VOO·IVV의 0.03%보다 세 배가량 높습니다. 이 차이는 신탁형(UIT) 구조를 유지하는 SPY와 개방형 펀드 구조인 VOO·IVV의 법적 형태 차이에서 옵니다.',
        'UIT 구조는 배당금을 즉시 재투자하지 못하고 현금으로 보유했다가 분기별로 지급하는 등 개방형 ETF보다 유연성이 떨어지지만, 오랜 역사와 압도적인 유동성이라는 강점을 갖고 있습니다.',
        '100만 원 기준으로 보면 SPY는 연 약 945원, VOO·IVV는 약 300원의 보수가 발생합니다. 장기 재투자 관점에서는 작지 않은 차이지만, SPY의 유동성이 특히 중요한 투자자에게는 그만한 값어치가 있다고 여겨지기도 합니다.'
      ],
      stat: {
        label: '운용보수(총보수)',
        value: '0.0945%',
        caption: '2026년 기준 재확인 — VOO·IVV(0.03%)보다 높음'
      }
    },
    {
      id: 'selection-criteria',
      navLabel: '구성 기준',
      heading: 'S&P 500 지수 — VOO·IVV와 동일한 구성',
      paragraphs: [
        'SPY가 추종하는 S&P 500 지수는 미국 대형주 중에서 시가총액·유동성·수익성 기준을 통과한 약 500종으로 구성됩니다. S&P 다우존스 인덱스 위원회가 정기적으로 재검토하며, 기준 미달 기업은 다른 종목으로 교체됩니다.',
        '시가총액 가중 방식이라 초대형주 소수의 비중이 지수 전체에서 큰 부분을 차지합니다. VOO·IVV와 담는 종목·비중이 사실상 동일합니다.',
        '이 페이지는 상위 보유 종목의 정확한 비중을 다루지 않습니다 — 분기마다 시가총액 순위가 바뀌는 값이라 신뢰할 단일 현재값을 확인하지 못했기 때문입니다.'
      ]
    },
    {
      id: 'who-and-tradeoffs',
      navLabel: '적합성·트레이드오프',
      heading: '어떤 투자자에게 맞고, 무엇을 포기하는가',
      paragraphs: [
        'SPY는 이런 투자자에게 잘 맞습니다. S&P 500에 대한 압도적인 유동성과 옵션 시장 접근성이 필요한 사람, 단기 트레이딩이나 헤지 목적으로 매매 스프레드가 가장 좁은 상품을 원하는 사람입니다.',
        '순수하게 장기 보유·재투자가 목적이라면 트레이드오프가 있습니다. 운용보수가 VOO·IVV보다 세 배가량 높아, 장기간 재투자할 경우 그 차이가 복리로 누적됩니다. 신탁형 구조라 개방형 ETF보다 배당 처리 방식의 유연성도 떨어집니다.',
        '장기 보유·비용 최소화가 목적이라면 같은 지수를 더 낮은 보수로 추종하는 VOO·IVV를 함께 비교해 보시기 바랍니다.'
      ]
    }
  ],
  faqs: [
    {
      question: 'SPY 배당률은 얼마인가요?',
      answer: '이 시뮬레이터가 쓰는 계산 프리셋 기준 SPY의 명목 배당률(세전)은 {{dividendYield}}입니다. 같은 S&P 500을 추종하는 VOO·IVV와 사실상 동일한 수준입니다.'
    },
    {
      question: 'SPY는 언제 상장했나요?',
      answer: '1993년 1월 22일 상장했습니다. 미국에서 최초로 만들어진 상장지수펀드(ETF)로 기록돼 있습니다.'
    },
    {
      question: 'SPY 운용보수는 얼마인가요?',
      answer: '0.0945%(약 0.09%)로, VOO·IVV의 0.03%보다 세 배가량 높습니다. 신탁형(UIT) 구조를 유지하는 데 따른 차이입니다.'
    },
    {
      question: 'SPY와 VOO, IVV는 무엇이 다른가요?',
      answer:
        '셋 다 S&P 500을 추종합니다. SPY는 신탁형(UIT) 구조라 보수가 조금 더 높은 대신 유동성이 가장 큽니다. VOO·IVV는 개방형 펀드 구조로 보수가 0.03%로 더 낮습니다.'
    },
    {
      question: 'SPY 배당은 얼마나 자주 지급되나요?',
      answer: 'SPY는 {{frequencyLabel}} 지급합니다. 정확한 기준일·지급일은 매 분기 공지에 따라 달라질 수 있습니다.'
    },
    {
      question: 'SPY는 어떤 지수를 추종하나요?',
      answer: 'S&P 500 지수를 추종합니다. 미국 대형주 약 500종을 시가총액 가중 방식으로 담습니다.'
    },
    {
      question: 'SPY 배당에 붙는 세금은 어떻게 계산하나요?',
      answer: '배당소득세는 거주 국가와 계좌 종류에 따라 달라져 이 페이지가 대신 알려드릴 수 없습니다. 이 시뮬레이터에서는 세율을 직접 입력해 세후 배당을 계산해 볼 수 있습니다.'
    }
  ],
  reference: {
    trackedIndex: 'S&P 500 지수',
    inceptionYear: 1993,
    expenseRatioPercent: 0.0945,
    holdingsCountApprox: 500,
    paymentMonthsNote: '연 4회 분기 지급',
    asOfNote:
      '상장일(1993년 1월 22일)·운용보수(0.0945%)·추종지수(S&P 500 지수)는 스테이트 스트리트(SSGA) 공식 상품 페이지로 2026년 8월 확인한 사실입니다. SPY는 신탁형(UIT) 구조를 유지하고 있어 개방형 펀드인 VOO·IVV보다 운용보수가 높습니다. 상위 보유 종목 비중은 분기마다 바뀌어 이 페이지에서는 다루지 않았습니다. 배당률·배당성장률·기대수익률 등 계산에 쓰이는 값은 이 페이지가 아니라 시뮬레이터 계산 프리셋을 그대로 따릅니다.'
  },
  relatedTickers: [
    { ticker: 'VOO', relationLabel: '더 낮은 운용보수로 같은 지수를 담고 싶다면' },
    { ticker: 'IVV', relationLabel: '개방형 구조의 다른 발행사 상품과 비교한다면' },
    { ticker: 'DIA', relationLabel: '더 적은 종목 수로 미국 대표 우량주만 담고 싶다면' },
    { ticker: 'SCHD', relationLabel: '자본 성장 대신 배당성장에 무게를 두고 싶다면' }
  ],
  // 스테이트 스트리트(SPDR) 정체성 — 딥 네이비 앵커 → 스틸 블루. 장식 전용(대비는 textLight/Dark로 확보).
  accent: {
    from: '#0d1f3d',
    to: '#4488d0',
    textLight: '#123a66',
    textDark: '#8cbdef'
  },
  disclaimer:
    '이 페이지는 정보 제공을 목적으로 하며 투자 자문이 아닙니다. 배당률·주가·운용보수·세금 등은 시장 상황과 정책에 따라 변동될 수 있으며, 과거 성과가 미래 수익을 보장하지 않습니다. 투자 판단과 그 결과에 대한 책임은 투자자 본인에게 있습니다.',
  contentUpdatedAt: '2026-08-06'
};
