import type { TickerContent } from './TickerContent.types';

/**
 * DHS(위즈덤트리 미국 고배당 ETF) SEO 랜딩 콘텐츠 — DLN·DON·DES와 같은 위즈덤트리 배당금 가중
 * 방법론이지만, 대상 종목군을 "배당률이 높은" 종목으로 좁혔다는 점이 다르다(고배당 카테고리).
 *
 * 숫자 출처:
 * - 계산 6필드는 `shared/constants/presets`(`US_HIGH_DIVIDEND_ETFS.DHS`)에서 그대로 온다.
 * - 상장일(2006년 6월 16일)·총보수(0.38%)·추종지수(WisdomTree U.S. High Dividend Index)는
 *   위즈덤트리 공식 정보·복수 소스로 2026년 8월 교차 확인.
 */
export const DHS_TICKER_CONTENT: TickerContent = {
  ticker: 'DHS',
  slug: 'dhs',
  categoryIds: ['high-dividend'],
  metaTitle: 'DHS 배당률·운용보수·구성 총정리 — 위즈덤트리 미국 고배당 ETF',
  metaDescription:
    'DHS(위즈덤트리 미국 고배당 ETF)의 배당률·운용보수 0.38%·배당금 가중 방식을 정리했습니다. 배당률 상위 종목을 배당금 크기로 담는 고배당 ETF가 궁금하다면 여기서 확인하세요.',
  heroTagline: '배당률 상위 종목을, 시가총액이 아니라 배당금 크기로 줄 세워 담는 고배당 ETF',
  sections: [
    {
      id: 'overview',
      navLabel: '개요',
      heading: 'DHS, 무엇을 추종하는 ETF인가',
      paragraphs: [
        'DHS(위즈덤트리 미국 고배당 ETF, {{englishName}})는 2006년 6월 16일 상장한 ETF로, WisdomTree U.S. High Dividend Index를 추종합니다. DLN·DON·DES가 "대형·중형·소형" 구간으로 나뉜다면, DHS는 시가총액 구간이 아니라 배당률 자체가 높은 종목군을 대상으로 합니다.',
        '위즈덤트리 특유의 배당금 가중 방법론은 여기서도 동일합니다. 시가총액이 아니라 각 기업이 실제로 지급한 배당금 총액을 기준으로 지수 내 비중을 정합니다.',
        '{{koreanName}}는 이 시뮬레이터의 계산 프리셋에서 배당률 {{dividendYield}}, 연 배당성장률(가정) {{dividendGrowth}}, {{frequencyLabel}} 지급을 기준으로 합니다.'
      ],
      stat: {
        label: '추종 지수',
        value: 'WisdomTree U.S. High Dividend Index',
        caption: '배당률 상위 종목군을 배당금 총액 기준으로 가중하는 지수'
      }
    },
    {
      id: 'dividend-yield',
      navLabel: '배당률',
      heading: '배당률 {{dividendYield}}, 고배당을 명시적으로 겨냥한 설계',
      paragraphs: [
        'DHS의 배당률은 {{dividendYield}} 안팎으로, 같은 위즈덤트리 계열의 대형주 펀드 DLN보다 높게 형성됩니다. 지수 자체가 배당률 상위 종목을 대상으로 하기 때문입니다.',
        '고배당 종목군은 배당성장 종목군보다 성장 프리미엄이 낮게 반영되는 경향이 있어, 배당률이 구조적으로 높게 나타납니다. 다만 배당률이 높다는 것이 배당의 지속가능성까지 보장하지는 않습니다.',
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
      heading: '지금의 배당률에 무게를 둔 설계, 성장은 부차적',
      paragraphs: [
        '이 시뮬레이터의 계산 프리셋은 DHS의 연 배당성장률(가정)을 {{dividendGrowth}}, 기대 총수익률을 {{expectedTotalReturn}}로 둡니다. DLN·DON·DES 같은 배당성장 계열보다 성장률 가정이 낮게 잡혀 있습니다.',
        '지수 설계 자체가 배당률을 우선하다 보니, 배당을 빠르게 늘리는 성장주보다는 이미 높은 배당률을 유지하는 성숙 기업 비중이 커지는 경향이 있습니다. 배당금 가중 방식이라 배당을 늘린 기업의 비중이 커지는 것은 동일하지만, 애초에 편입 기준 자체가 "지금 배당률이 높은가"에 맞춰져 있다는 점이 다릅니다.',
        '고배당 지수는 배당 삭감이 일어나면 그 종목이 지수에서 빠르게 편출되도록 설계되는 경우가 많습니다. 다만 편출 전까지의 주가 하락은 투자자가 그대로 안게 됩니다.'
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
      heading: '총보수 0.38% — 자매 펀드와 같은 수준',
      paragraphs: [
        'DHS의 총보수는 0.38%로, DON·DES와 같은 수준이며 DLN(0.28%)보다는 높습니다. 위즈덤트리의 배당금 가중 방법론을 유지하는 데 드는 리밸런싱 비용이 반영된 결과입니다.',
        'HDV(아이셰어즈, 0.08%)나 VYM(뱅가드, 0.06%) 같은 다른 고배당 ETF와 비교하면 보수가 상당히 높은 편입니다. 방법론의 차이(배당금 가중 vs 시가총액 가중)가 비용 구조의 차이로도 이어집니다.',
        '장기 재투자 시 이 보수 차이는 매년 조용히 복리로 누적됩니다. 같은 고배당 카테고리 안에서 저비용 대안과 함께 비교해 보시는 것을 권합니다.'
      ],
      stat: {
        label: '운용보수(총보수)',
        value: '0.38%',
        caption: '위즈덤트리 공식 정보·복수 소스 교차 확인(2026년 8월 기준)'
      }
    },
    {
      id: 'selection-criteria',
      navLabel: '구성 기준',
      heading: '배당률 상위 종목을 배당금으로 다시 줄 세운다',
      paragraphs: [
        'DHS가 추종하는 지수는 배당을 지급하는 미국 상장 기업 중 배당률이 상대적으로 높은 종목군을 후보로 삼습니다. 최소 시가총액·유동성 기준도 함께 적용됩니다.',
        '후보 안에서 비중은 시가총액이 아니라 각 기업이 지난 1년간 실제로 지급한 배당금 총액으로 정해집니다. 배당률로 대상을 고르고, 배당금 크기로 비중을 정하는 2단계 구조입니다.',
        '이 방식은 특정 섹터(금융·에너지·유틸리티 등 전통적 고배당 업종)로 쏠릴 여지가 있습니다. SCHD처럼 재무 건전성을 별도로 스크리닝하지 않는다는 점도 함께 고려해야 합니다.'
      ]
    },
    {
      id: 'who-and-tradeoffs',
      navLabel: '적합성·트레이드오프',
      heading: '어떤 투자자에게 맞고, 무엇을 포기하는가',
      paragraphs: [
        'DHS는 이런 투자자에게 맞습니다. 지금 당장의 높은 배당률을 원하는 사람, 위즈덤트리의 배당금 가중 방법론을 신뢰하는 사람, DLN·DON·DES와 함께 같은 방법론의 배당 스펙트럼을 갖추고 싶은 사람입니다.',
        '포기하는 것도 있습니다. 첫째, 총보수 0.38%는 HDV·VYM 같은 경쟁 고배당 ETF보다 높습니다. 둘째, 재무 건전성 스크리닝이 없어 배당 삭감 위험이 있는 종목이 섞여 있을 수 있습니다. 셋째, 배당성장 계열보다 주가 상승 여력이 상대적으로 제한적일 수 있습니다.',
        '더 낮은 보수의 고배당 ETF를 원한다면 HDV·VYM·SPYD, 배당 성장 쪽으로 무게를 옮기고 싶다면 DLN·SCHD와 함께 비교해 보세요.'
      ]
    }
  ],
  faqs: [
    {
      question: 'DHS 배당률은 얼마인가요?',
      answer:
        '이 시뮬레이터가 쓰는 계산 프리셋 기준 DHS의 명목 배당률(세전)은 {{dividendYield}}입니다. 지수 자체가 배당률 상위 종목을 대상으로 해 같은 위즈덤트리 계열의 대형주 펀드 DLN보다 높게 형성됩니다.'
    },
    {
      question: 'DHS는 어떤 지수를 추종하나요?',
      answer:
        'WisdomTree U.S. High Dividend Index를 추종합니다. 배당률이 높은 종목군을 대상으로, 시가총액이 아니라 배당금 총액 기준으로 비중을 정하는 배당가중 지수입니다.'
    },
    {
      question: 'DHS 운용보수(총보수)는 얼마인가요?',
      answer: '0.38%입니다. HDV(0.08%)·VYM(0.06%) 같은 다른 고배당 ETF보다 높은 수준입니다.'
    },
    {
      question: 'DHS와 DLN은 무엇이 다른가요?',
      answer:
        '방법론(배당금 가중)은 같지만 편입 기준이 다릅니다. DLN은 대형주 전반을 담고, DHS는 배당률이 높은 종목만 골라 담습니다. 그래서 DHS의 배당률이 대체로 더 높습니다.'
    },
    {
      question: 'DHS 배당은 얼마나 자주 지급되나요?',
      answer: 'DHS는 {{frequencyLabel}} 지급됩니다. 정확한 배당락일·지급일은 매 분기 공지에 따라 달라질 수 있습니다.'
    },
    {
      question: 'DHS는 언제 상장했나요?',
      answer: 'DLN·DON·DES와 같은 날인 2006년 6월 16일 상장했습니다.'
    },
    {
      question: 'DHS 배당에 붙는 세금은 어떻게 계산하나요?',
      answer:
        '배당소득세는 거주 국가와 계좌 종류에 따라 달라지며 이 페이지가 대신 알려드릴 수 없습니다. 이 시뮬레이터에서는 세율을 직접 입력해 세후 배당을 계산해 볼 수 있습니다.'
    }
  ],
  reference: {
    trackedIndex: 'WisdomTree U.S. High Dividend Index',
    inceptionYear: 2006,
    expenseRatioPercent: 0.38,
    paymentMonthsNote: '연 4회 분기 지급',
    asOfNote:
      '상장일(2006년 6월 16일)·총보수(0.38%)·추종지수(WisdomTree U.S. High Dividend Index)는 위즈덤트리 공식 정보와 복수 소스로 2026년 8월 교차 확인한 사실입니다. 보유종목수·섹터 비중·정확한 배당 CAGR은 신뢰할 단일 현재값을 확인하지 못해 이 페이지에서는 다루지 않았습니다. 배당률·배당성장률·기대수익률 등 계산에 쓰이는 값은 이 페이지가 아니라 시뮬레이터 계산 프리셋을 그대로 따릅니다.'
  },
  relatedTickers: [
    { ticker: 'HDV', relationLabel: '더 낮은 보수의 고배당 ETF를 원한다면' },
    { ticker: 'VYM', relationLabel: '뱅가드의 넓은 고배당 분산을 원한다면' },
    { ticker: 'DLN', relationLabel: '같은 방법론을 배당성장 대형주로 담고 싶다면' },
    { ticker: 'SPYD', relationLabel: '더 높은 배당률의 S&P 500 고배당을 원한다면' }
  ],
  // 위즈덤트리(WisdomTree) 정체성 — 고배당 강조를 위해 자매 펀드보다 진한 올리브그린. 장식 전용.
  accent: {
    from: '#2b3d1a',
    to: '#a3c247',
    textLight: '#3f5624',
    textDark: '#c3dd7d'
  },
  disclaimer:
    '이 페이지는 정보 제공을 목적으로 하며 투자 자문이 아닙니다. 배당률·주가·운용보수·세금 등은 시장 상황과 정책에 따라 변동될 수 있으며, 과거 성과가 미래 수익을 보장하지 않습니다. 배당률이 높다는 사실이 그 배당의 지속가능성을 보장하지는 않습니다. 투자 판단과 그 결과에 대한 책임은 투자자 본인에게 있습니다.',
  contentUpdatedAt: '2026-08-06'
};
