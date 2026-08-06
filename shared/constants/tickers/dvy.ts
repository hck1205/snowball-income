import type { TickerContent } from './TickerContent.types';

/**
 * DVY(아이셰어즈 셀렉트 배당 ETF) SEO 랜딩 콘텐츠 — 2003년 상장한 미국에서 가장 오래된 배당
 * ETF 중 하나. 5년 배당성장·배당성향 등 지속가능성 스크리닝을 갖춘 고배당 ETF라는 점을 SCHD와
 * 대비해 설명한다.
 *
 * 숫자 출처:
 * - 계산 6필드는 `shared/constants/presets`(`US_HIGH_DIVIDEND_ETFS.DVY`)에서 그대로 온다.
 * - 상장일(2003년 11월 3일)·총보수(0.38%)·추종지수(Dow Jones U.S. Select Dividend Index)·
 *   보유종목수(약 100종)·섹터 상위(금융·유틸리티·필수소비재)는 iShares 공식 팩트시트·
 *   복수 소스로 2026년 8월 교차 확인.
 */
export const DVY_TICKER_CONTENT: TickerContent = {
  ticker: 'DVY',
  slug: 'dvy',
  categoryIds: ['high-dividend'],
  metaTitle: 'DVY 배당률·운용보수·구성 총정리 — 아이셰어즈 셀렉트 배당 ETF',
  metaDescription:
    'DVY(아이셰어즈 셀렉트 배당 ETF)의 배당률·운용보수 0.38%·5년 배당성장 스크리닝을 정리했습니다. 2003년부터 이어온 미국 최초 배당 ETF 중 하나가 궁금하다면 여기서 확인하세요.',
  heroTagline: '2003년부터 이어온, 미국에서 가장 오래된 배당 ETF 중 하나',
  sections: [
    {
      id: 'overview',
      navLabel: '개요',
      heading: 'DVY, 무엇을 추종하는 ETF인가',
      paragraphs: [
        'DVY(아이셰어즈 셀렉트 배당 ETF, {{englishName}})는 2003년 11월 3일 상장한 ETF로, Dow Jones U.S. Select Dividend Index를 추종합니다. 미국 배당 ETF 시장 초창기부터 존재해 온 상품입니다.',
        '지수는 배당을 지급하는 미국 기업 중 5년 배당성장, 배당성향, 평균 거래대금 등 여러 조건을 통과한 약 100종을 선별합니다. 단순히 배당률이 높은 종목만 모으는 것이 아니라 지속가능성을 함께 봅니다.',
        '{{koreanName}}는 이 시뮬레이터의 계산 프리셋에서 배당률 {{dividendYield}}, 연 배당성장률(가정) {{dividendGrowth}}, {{frequencyLabel}} 지급을 기준으로 합니다.'
      ],
      stat: {
        label: '추종 지수',
        value: 'Dow Jones U.S. Select Dividend Index',
        caption: '5년 배당성장·배당성향 등 지속가능성 기준을 통과한 약 100종으로 구성'
      }
    },
    {
      id: 'dividend-yield',
      navLabel: '배당률',
      heading: '배당률 {{dividendYield}}, 금융·유틸리티 비중이 만드는 숫자',
      paragraphs: [
        'DVY의 배당률은 {{dividendYield}} 안팎입니다. 지수 스크리닝 특성상 금융·유틸리티·필수소비재 섹터 비중이 상대적으로 높게 형성되는데, 이 업종들은 전통적으로 배당률이 높은 편입니다.',
        '20년 넘게 운용되며 여러 경기 사이클을 거친 상품이라, 지수의 지속가능성 스크리닝(5년 배당성장·배당성향)이 어떻게 작동해 왔는지 참고할 만한 이력이 쌓여 있습니다.',
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
      heading: '지속가능성 스크리닝이 있지만, 성장 속도는 완만하다',
      paragraphs: [
        '이 시뮬레이터의 계산 프리셋은 DVY의 연 배당성장률(가정)을 {{dividendGrowth}}, 기대 총수익률을 {{expectedTotalReturn}}로 둡니다. 지수가 5년 배당성장 조건을 요구하지만, 배당률 자체를 우선하는 설계라 성장 속도는 SCHD·VIG 같은 배당성장 계열보다 완만합니다.',
        '지수는 매년 재구성되며 배당성향이 지나치게 높아지거나 배당성장 조건을 충족하지 못하는 종목은 편출됩니다. 이 스크리닝이 오래 운용된 만큼 검증된 장치이지만, 배당 삭감 위험을 완전히 없애지는 못합니다.',
        '금융·유틸리티 비중이 높은 구조라 금리 환경에 따라 배당 인상 속도가 달라질 수 있다는 점도 함께 고려해야 합니다.'
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
      heading: '총보수 0.38% — 20년 넘은 상품 치고는 높은 편',
      paragraphs: [
        'DVY의 총보수는 0.38%입니다. 2003년 상장 당시 기준으로는 낮은 편이었지만, SCHD(0.06%)·VYM(0.06%)·HDV(0.08%) 같은 최근 저비용 경쟁 상품과 비교하면 상당히 높은 수준입니다.',
        'ETF 업계 전반의 보수 인하 경쟁 속에서 DVY의 보수는 상장 이후 크게 낮아지지 않았습니다. 오래된 상품이라 순자산 규모는 크지만, 비용 측면에서는 후발 주자에게 자리를 내준 상태입니다.',
        '장기 재투자 시 이 보수 차이는 매년 조용히 복리로 누적됩니다. 같은 고배당 카테고리 안에서 저비용 대안과 함께 비교해 보시는 것을 권합니다.'
      ],
      stat: {
        label: '운용보수(총보수)',
        value: '0.38%',
        caption: 'iShares 공식 팩트시트·복수 소스 교차 확인(2026년 8월 기준)'
      }
    },
    {
      id: 'selection-criteria',
      navLabel: '구성 기준',
      heading: '5년 배당성장 + 배당성향 스크리닝, 그리고 금융·유틸리티 쏠림',
      paragraphs: [
        'DVY가 추종하는 지수는 최소 5년간 배당을 지급해 온 미국 기업 중, 5년 배당성장률과 배당성향이 일정 기준을 통과하고 평균 거래대금 조건을 만족하는 종목을 후보로 삼습니다.',
        '통과한 종목들은 배당률을 기준으로 순위를 매겨 상위 약 100종을 담습니다. 이 방식이 결과적으로 금융·유틸리티·필수소비재처럼 전통적으로 배당률이 높은 섹터에 비중이 쏠리는 결과로 이어집니다.',
        '연 1회 재구성되며, 이 과정에서 배당성장 조건을 더 이상 충족하지 못하는 종목은 편출됩니다. 섹터 쏠림 자체는 지수 설계상 구조적인 특성이라 재구성으로도 크게 달라지지 않습니다.'
      ]
    },
    {
      id: 'who-and-tradeoffs',
      navLabel: '적합성·트레이드오프',
      heading: '어떤 투자자에게 맞고, 무엇을 포기하는가',
      paragraphs: [
        'DVY는 이런 투자자에게 맞습니다. 오래 운용되며 검증된 지속가능성 스크리닝을 가진 고배당 ETF를 원하는 사람, 금융·유틸리티 비중이 높은 배당 포트폴리오를 원하는 사람, SCHD와는 다른 스크리닝 기준을 비교해 보고 싶은 사람입니다.',
        '포기하는 것도 있습니다. 첫째, 총보수 0.38%는 최근의 저비용 고배당 ETF보다 훨씬 높습니다. 둘째, 금융·유틸리티 쏠림이 커 섹터 분산이 제한적입니다. 셋째, 배당성장 속도는 SCHD·VIG보다 완만합니다.',
        '더 낮은 보수와 넓은 섹터 분산을 원한다면 HDV·VYM, 재무 건전성 스크리닝을 우선한다면 SCHD와 함께 비교해 보세요.'
      ]
    }
  ],
  faqs: [
    {
      question: 'DVY 배당률은 얼마인가요?',
      answer:
        '이 시뮬레이터가 쓰는 계산 프리셋 기준 DVY의 명목 배당률(세전)은 {{dividendYield}}입니다. 금융·유틸리티 비중이 높은 지수 구성이 배경입니다.'
    },
    {
      question: 'DVY는 어떤 지수를 추종하나요?',
      answer:
        'Dow Jones U.S. Select Dividend Index를 추종합니다. 5년 배당성장·배당성향 등 지속가능성 조건을 통과한 약 100종을 배당률 순으로 담는 지수입니다.'
    },
    {
      question: 'DVY 운용보수(총보수)는 얼마인가요?',
      answer: '0.38%입니다. SCHD(0.06%)·VYM(0.06%) 같은 최근 저비용 고배당 ETF보다 높은 수준입니다.'
    },
    {
      question: 'DVY는 언제 상장했나요?',
      answer: '2003년 11월 3일 상장했습니다. 미국에서 가장 오래된 배당 ETF 중 하나입니다.'
    },
    {
      question: 'DVY 배당은 얼마나 자주 지급되나요?',
      answer: 'DVY는 {{frequencyLabel}} 지급됩니다. 정확한 배당락일·지급일은 매 분기 공지에 따라 달라질 수 있습니다.'
    },
    {
      question: 'DVY와 SCHD는 무엇이 다른가요?',
      answer:
        'DVY는 5년 배당성장·배당성향 스크리닝을 통과한 종목을 배당률 순으로 담아 금융·유틸리티 비중이 높습니다. SCHD는 10년 이상 배당 지급 기업 중 재무 건전성 점수로 상위 종목만 담아 배당률은 낮지만 성장률 가정이 더 높습니다.'
    },
    {
      question: 'DVY 배당에 붙는 세금은 어떻게 계산하나요?',
      answer:
        '배당소득세는 거주 국가와 계좌 종류에 따라 달라지며 이 페이지가 대신 알려드릴 수 없습니다. 이 시뮬레이터에서는 세율을 직접 입력해 세후 배당을 계산해 볼 수 있습니다.'
    }
  ],
  reference: {
    trackedIndex: 'Dow Jones U.S. Select Dividend Index',
    inceptionYear: 2003,
    expenseRatioPercent: 0.38,
    holdingsCountApprox: 100,
    paymentMonthsNote: '연 4회 분기 지급',
    topSectors: ['금융', '유틸리티', '필수소비재'],
    asOfNote:
      '상장일(2003년 11월 3일)·총보수(0.38%)·추종지수(Dow Jones U.S. Select Dividend Index)·보유종목수(약 100종)·상위 섹터(금융·유틸리티·필수소비재)는 iShares 공식 팩트시트와 복수 소스로 2026년 8월 교차 확인한 사실입니다. 정확한 배당 CAGR은 신뢰할 단일 현재값을 확인하지 못해 이 페이지에서는 다루지 않았습니다. 배당률·배당성장률·기대수익률 등 계산에 쓰이는 값은 이 페이지가 아니라 시뮬레이터 계산 프리셋을 그대로 따릅니다.'
  },
  relatedTickers: [
    { ticker: 'HDV', relationLabel: '더 낮은 보수의 고배당 ETF를 원한다면' },
    { ticker: 'VYM', relationLabel: '더 넓은 섹터 분산의 고배당 ETF를 원한다면' },
    { ticker: 'SCHD', relationLabel: '재무 건전성 스크리닝과 배당성장을 우선한다면' },
    { ticker: 'SPYD', relationLabel: 'S&P 500 안에서 더 높은 배당률을 원한다면' }
  ],
  // 아이셰어즈(iShares/BlackRock) 정체성 — 딥 옵시디언 앵커 → 시그니처 옐로. 장식 전용.
  accent: {
    from: '#1a1a1a',
    to: '#f2c94c',
    textLight: '#5c4a0a',
    textDark: '#f2d879'
  },
  disclaimer:
    '이 페이지는 정보 제공을 목적으로 하며 투자 자문이 아닙니다. 배당률·주가·운용보수·세금 등은 시장 상황과 정책에 따라 변동될 수 있으며, 과거 성과가 미래 수익을 보장하지 않습니다. 투자 판단과 그 결과에 대한 책임은 투자자 본인에게 있습니다.',
  contentUpdatedAt: '2026-08-06'
};
