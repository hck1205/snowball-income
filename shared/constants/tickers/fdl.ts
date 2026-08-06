import type { TickerContent } from './TickerContent.types';

/**
 * FDL(퍼스트트러스트 모닝스타 디비던드 리더스 인덱스 펀드) SEO 랜딩 콘텐츠 — 모닝스타가 정의하는
 * "배당 리더" 100종을 배당금 가중으로 담는 고배당 ETF.
 *
 * 숫자 출처:
 * - 계산 6필드는 `shared/constants/presets`(`US_HIGH_DIVIDEND_ETFS.FDL`)에서 그대로 온다.
 * - 상장일(2006년 3월 9일)·총보수(0.43%)·추종지수(Morningstar Dividend Leaders Index)·
 *   보유종목수(약 100종)는 퍼스트트러스트·복수 소스로 2026년 8월 교차 확인.
 */
export const FDL_TICKER_CONTENT: TickerContent = {
  ticker: 'FDL',
  slug: 'fdl',
  categoryIds: ['high-dividend'],
  metaTitle: 'FDL 배당률·운용보수·구성 총정리 — 퍼스트트러스트 모닝스타 디비던드 리더스 인덱스 펀드',
  metaDescription:
    'FDL(퍼스트트러스트 모닝스타 디비던드 리더스 인덱스 펀드)의 배당률·운용보수 0.43%·모닝스타 배당 리더 선정 기준을 정리했습니다. 배당 지속성을 검증한 고배당 100종이 궁금하다면 여기서 확인하세요.',
  heroTagline: '모닝스타가 배당을 유지할 수 있다고 판단한 고배당 100종을 담는 ETF',
  sections: [
    {
      id: 'overview',
      navLabel: '개요',
      heading: 'FDL, 무엇을 추종하는 ETF인가',
      paragraphs: [
        'FDL(퍼스트트러스트 모닝스타 디비던드 리더스 인덱스 펀드, {{englishName}})는 2006년 3월 9일 상장한 ETF로, Morningstar Dividend Leaders Index를 추종합니다. 이름 그대로 모닝스타가 "배당 리더"로 선정한 종목 100종을 담습니다.',
        '모닝스타는 배당률뿐 아니라 배당을 계속 지급할 수 있는 재무 여력(배당 지속 가능성 점수)까지 함께 평가해 이 종목군을 정합니다. 배당 정보 제공사가 직접 만든 지수라는 점이 이 상품의 정체성입니다.',
        '{{koreanName}}는 이 시뮬레이터의 계산 프리셋에서 배당률 {{dividendYield}}, 연 배당성장률(가정) {{dividendGrowth}}, {{frequencyLabel}} 지급을 기준으로 합니다.'
      ],
      stat: {
        label: '추종 지수',
        value: 'Morningstar Dividend Leaders Index',
        caption: '배당률과 지속가능성을 함께 평가해 선정한 상위 100종으로 구성'
      }
    },
    {
      id: 'dividend-yield',
      navLabel: '배당률',
      heading: '배당률 {{dividendYield}}, 지속성 검증을 거친 고배당',
      paragraphs: [
        'FDL의 배당률은 {{dividendYield}} 안팎입니다. 지수가 배당률이 높은 100종을 대상으로 하되, 모닝스타의 재무 건전성·배당 지속 가능성 평가를 함께 거쳤다는 점이 순수 배당률 순위 방식과의 차이입니다.',
        '이 평가는 배당을 지급할 수 없을 만큼 재무가 취약한 기업(배당 함정, dividend trap)을 걸러내려는 목적입니다. 다만 어떤 스크리닝도 미래의 배당 삭감을 완전히 막지는 못합니다.',
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
      heading: '지속 가능성 검증, 그러나 배당률 우선 설계는 동일',
      paragraphs: [
        '이 시뮬레이터의 계산 프리셋은 FDL의 연 배당성장률(가정)을 {{dividendGrowth}}, 기대 총수익률을 {{expectedTotalReturn}}로 둡니다. 지수가 지속 가능성을 평가하지만 편입 기준의 중심은 여전히 배당률이라, 성장률 가정은 낮은 편입니다.',
        '모닝스타의 지속 가능성 평가는 "이 기업이 지금 수준의 배당을 계속 낼 수 있는가"에 가깝지, "앞으로 배당을 크게 늘릴 것인가"를 예측하는 도구는 아닙니다. 그래서 배당 유지에는 도움이 되지만 배당 성장 속도 자체를 끌어올리지는 않습니다.',
        '연 1회 재구성되며, 재무 여력이 악화된 종목은 편출됩니다. 이 편출이 지수의 평균 배당 지속성을 유지하는 장치입니다.'
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
      heading: '총보수 0.43% — 모닝스타 지수 라이선스 비용 포함',
      paragraphs: [
        'FDL의 총보수는 0.43%입니다. SCHD·VYM 같은 저비용 상품보다 높은 수준으로, 모닝스타 지수 라이선스 비용과 퍼스트트러스트의 운용 비용이 함께 반영된 결과로 볼 수 있습니다.',
        '2006년 상장 이후 보수가 크게 조정되지 않은 채 유지되고 있어, 이후 등장한 저비용 경쟁 상품들과 비교하면 격차가 벌어진 상태입니다.',
        '장기 재투자 시 이 보수 차이는 매년 조용히 복리로 누적됩니다. 같은 고배당 카테고리 안에서 저비용 대안과 함께 비교해 보시는 것을 권합니다.'
      ],
      stat: {
        label: '운용보수(총보수)',
        value: '0.43%',
        caption: '퍼스트트러스트 공식 정보·복수 소스 교차 확인(2026년 8월 기준)'
      }
    },
    {
      id: 'selection-criteria',
      navLabel: '구성 기준',
      heading: '모닝스타의 배당 지속성 평가 + 배당률 상위 100종',
      paragraphs: [
        'FDL이 추종하는 지수는 모닝스타의 재무 건전성 데이터베이스를 활용해 배당을 지급하는 미국 기업 중 재무적으로 배당을 유지할 여력이 있다고 평가되는 종목을 후보로 삼습니다.',
        '후보 안에서 배당률을 기준으로 순위를 매겨 상위 100종을 담고, 비중은 배당금 규모에 가중치를 둔 방식으로 정해집니다.',
        '연 1회 재구성되며, 지속 가능성 평가가 낮아진 종목은 배당률이 여전히 높더라도 편출될 수 있습니다. 이 점이 순수 배당률 순위 방식과의 실질적 차이입니다.'
      ]
    },
    {
      id: 'who-and-tradeoffs',
      navLabel: '적합성·트레이드오프',
      heading: '어떤 투자자에게 맞고, 무엇을 포기하는가',
      paragraphs: [
        'FDL은 이런 투자자에게 맞습니다. 배당률뿐 아니라 지속 가능성 평가를 함께 거친 고배당 상품을 원하는 사람, 모닝스타라는 독립 리서치 기관의 평가 방식을 신뢰하는 사람, DVY·PEY 같은 다른 방식의 스크리닝 고배당 ETF와 비교해 보고 싶은 사람입니다.',
        '포기하는 것도 있습니다. 첫째, 총보수 0.43%는 저비용 고배당 ETF보다 높습니다. 둘째, 지속 가능성 평가가 미래의 배당 삭감을 완전히 막아주지는 못합니다. 셋째, 배당률 우선 설계라 성장률 가정은 낮은 편입니다.',
        '더 낮은 보수의 고배당 ETF를 원한다면 SCHD·VYM·HDV, 다른 지속가능성 스크리닝을 비교하고 싶다면 DVY와 함께 보세요.'
      ]
    }
  ],
  faqs: [
    {
      question: 'FDL 배당률은 얼마인가요?',
      answer:
        '이 시뮬레이터가 쓰는 계산 프리셋 기준 FDL의 명목 배당률(세전)은 {{dividendYield}}입니다. 모닝스타의 배당 지속성 평가를 거친 고배당 100종을 담아 형성되는 값입니다.'
    },
    {
      question: 'FDL은 어떤 지수를 추종하나요?',
      answer:
        'Morningstar Dividend Leaders Index를 추종합니다. 모닝스타가 배당률과 재무적 배당 지속 가능성을 함께 평가해 선정한 상위 100종으로 구성됩니다.'
    },
    {
      question: 'FDL 운용보수(총보수)는 얼마인가요?',
      answer: '0.43%입니다. SCHD(0.06%)·VYM(0.06%) 같은 저비용 고배당 ETF보다 높은 수준입니다.'
    },
    {
      question: 'FDL은 몇 종목을 담고 있나요?',
      answer: '약 100종을 담고 있습니다. 연 1회 재구성되며 지속 가능성 평가가 낮아진 종목은 편출됩니다.'
    },
    {
      question: 'FDL 배당은 얼마나 자주 지급되나요?',
      answer: 'FDL은 {{frequencyLabel}} 지급됩니다. 정확한 배당락일·지급일은 매 분기 공지에 따라 달라질 수 있습니다.'
    },
    {
      question: 'FDL과 DVY는 무엇이 다른가요?',
      answer:
        '둘 다 배당률과 지속가능성을 함께 보는 고배당 ETF지만, FDL은 모닝스타의 재무 건전성 평가를, DVY는 5년 배당성장·배당성향 기준을 각각 다르게 씁니다. 담는 종목과 섹터 구성도 달라집니다.'
    },
    {
      question: 'FDL 배당에 붙는 세금은 어떻게 계산하나요?',
      answer:
        '배당소득세는 거주 국가와 계좌 종류에 따라 달라지며 이 페이지가 대신 알려드릴 수 없습니다. 이 시뮬레이터에서는 세율을 직접 입력해 세후 배당을 계산해 볼 수 있습니다.'
    }
  ],
  reference: {
    trackedIndex: 'Morningstar Dividend Leaders Index',
    inceptionYear: 2006,
    expenseRatioPercent: 0.43,
    holdingsCountApprox: 100,
    paymentMonthsNote: '연 4회 분기 지급',
    asOfNote:
      '상장일(2006년 3월 9일)·총보수(0.43%)·추종지수(Morningstar Dividend Leaders Index)·보유종목수(약 100종)는 퍼스트트러스트 공식 정보와 복수 소스로 2026년 8월 교차 확인한 사실입니다. 섹터 비중·정확한 배당 CAGR은 신뢰할 단일 현재값을 확인하지 못해 이 페이지에서는 다루지 않았습니다. 배당률·배당성장률·기대수익률 등 계산에 쓰이는 값은 이 페이지가 아니라 시뮬레이터 계산 프리셋을 그대로 따릅니다.'
  },
  relatedTickers: [
    { ticker: 'DVY', relationLabel: '다른 방식의 지속가능성 스크리닝 고배당 ETF를 비교하고 싶다면' },
    { ticker: 'SCHD', relationLabel: '더 낮은 보수의 재무 건전성 스크리닝을 원한다면' },
    { ticker: 'VYM', relationLabel: '더 넓은 분산의 고배당 ETF를 원한다면' },
    { ticker: 'PEY', relationLabel: '더 압축된 고배당 포트폴리오를 원한다면' }
  ],
  // 퍼스트트러스트(First Trust) 정체성 — DVY보다 톤을 낮춘 슬레이트블루. 장식 전용.
  accent: {
    from: '#1a2f4a',
    to: '#5c8fc9',
    textLight: '#26426b',
    textDark: '#94bce3'
  },
  disclaimer:
    '이 페이지는 정보 제공을 목적으로 하며 투자 자문이 아닙니다. 배당률·주가·운용보수·세금 등은 시장 상황과 정책에 따라 변동될 수 있으며, 과거 성과가 미래 수익을 보장하지 않습니다. 재무 건전성 평가가 미래의 배당 삭감을 완전히 막아주지는 못합니다. 투자 판단과 그 결과에 대한 책임은 투자자 본인에게 있습니다.',
  contentUpdatedAt: '2026-08-06'
};
