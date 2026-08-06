import type { TickerContent } from './TickerContent.types';

/**
 * IDV(아이셰어즈 인터내셔널 셀렉트 배당 ETF) SEO 랜딩 콘텐츠 — 유럽·아시아·캐나다(EPAC) 지역에
 * 집중된 고배당 ETF. VYMI보다 지역이 좁고 보수가 높은 대신, 100종으로 압축된 구성이라는 차이를
 * 짚는다.
 *
 * 숫자 출처:
 * - 계산 6필드는 `shared/constants/presets`(`INTERNATIONAL_DIVIDEND_ETFS.IDV`)에서 그대로 온다.
 * - 상장일(2007년 6월 11일)·총보수(0.50%)·추종지수(Dow Jones EPAC Select Dividend Index,
 *   유럽·태평양·아시아·캐나다 지역 약 100종)는 iShares 공식 정보·복수 소스로 2026년 8월 교차 확인.
 */
export const IDV_TICKER_CONTENT: TickerContent = {
  ticker: 'IDV',
  slug: 'idv',
  categoryIds: ['high-dividend', 'international'],
  metaTitle: 'IDV 배당률·운용보수·구성 총정리 — 아이셰어즈 인터내셔널 셀렉트 배당 ETF',
  metaDescription:
    'IDV(아이셰어즈 인터내셔널 셀렉트 배당 ETF)의 배당률·운용보수 0.50%·유럽·아시아·캐나다 고배당 구성을 정리했습니다. 2007년부터 이어온 지역 집중형 해외 고배당 ETF가 궁금하다면 여기서 확인하세요.',
  heroTagline: '유럽·태평양·아시아·캐나다(EPAC) 고배당주 100종을 압축해서 담는 ETF',
  sections: [
    {
      id: 'overview',
      navLabel: '개요',
      heading: 'IDV, 무엇을 추종하는 ETF인가',
      paragraphs: [
        'IDV(아이셰어즈 인터내셔널 셀렉트 배당 ETF, {{englishName}})는 2007년 6월 11일 상장한 ETF로, Dow Jones EPAC Select Dividend Index를 추종합니다. EPAC은 유럽(Europe)·태평양(Pacific)·아시아(Asia)·캐나다(Canada)를 뜻합니다.',
        'VYMI(뱅가드, 신흥국 포함 전 세계)와 달리 IDV는 선진국 위주의 EPAC 지역에 집중하고, 신흥국 비중이 상대적으로 낮습니다. 지역을 좁히는 대신 배당률 상위 약 100종만 골라 담는 압축된 구성입니다.',
        '{{koreanName}}는 이 시뮬레이터의 계산 프리셋에서 배당률 {{dividendYield}}, 연 배당성장률(가정) {{dividendGrowth}}, {{frequencyLabel}} 지급을 기준으로 합니다.'
      ],
      stat: {
        label: '추종 지수',
        value: 'Dow Jones EPAC Select Dividend Index',
        caption: '유럽·태평양·아시아·캐나다 지역의 고배당주 약 100종으로 구성'
      }
    },
    {
      id: 'dividend-yield',
      navLabel: '배당률',
      heading: '배당률 {{dividendYield}}, 선진국 고배당주에 집중한 결과',
      paragraphs: [
        'IDV의 배당률은 {{dividendYield}} 안팎으로, 이 시뮬레이터가 다루는 해외 배당 ETF 중에서도 높은 축에 속합니다. 유럽 은행·에너지·통신주처럼 전통적으로 배당률이 높은 섹터·지역에 집중된 결과입니다.',
        '지역을 EPAC으로 좁히고 배당률 상위 100종만 담는 방식이라, VYMI보다 더 명확하게 "고배당"을 겨냥한 설계입니다. 다만 그만큼 신흥국의 성장 잠재력이나 지역 분산은 상대적으로 제한적입니다.',
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
      heading: '배당률을 우선한 설계, 지역별 편중이 변동성을 키운다',
      paragraphs: [
        '이 시뮬레이터의 계산 프리셋은 IDV의 연 배당성장률(가정)을 {{dividendGrowth}}, 기대 총수익률을 {{expectedTotalReturn}}로 둡니다. 배당률을 우선하는 지수 설계라 VIGI 같은 배당성장 계열보다 성장률 가정이 낮습니다.',
        '유럽·아시아 대형 배당주는 연 1회 실적에 맞춰 배당을 크게 조정하는 경우가 많고, 특히 은행·에너지처럼 경기 민감 섹터 비중이 높으면 경기 사이클에 따라 배당이 크게 오르내릴 수 있습니다.',
        '환율 변동도 실제 수령하는 원화 기준 배당에 영향을 줍니다. 유로·엔·파운드 등 여러 통화가 섞여 있어 환헤지가 되지 않은 상품이라는 점을 유의해야 합니다.'
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
      heading: '총보수 0.50% — VYMI·VIGI보다 높은 수준',
      paragraphs: [
        'IDV의 총보수는 0.50%로, 같은 해외 배당 카테고리의 VYMI·VIGI(각 0.07%)보다 훨씬 높습니다. 2007년 상장 당시의 보수 구조가 이후 크게 낮아지지 않은 채 유지되고 있습니다.',
        '아이셰어즈의 다른 해외 상품들과 비교해도 상대적으로 높은 편에 속합니다. 100종으로 압축된 액티브에 가까운 스크리닝 비용이 반영된 결과로 볼 수 있습니다.',
        '장기 재투자 시 이 보수 차이는 매년 조용히 복리로 누적됩니다. 같은 해외 고배당 카테고리 안에서 저비용 대안(VYMI)과 함께 비교해 보시는 것을 권합니다.'
      ],
      stat: {
        label: '운용보수(총보수)',
        value: '0.50%',
        caption: 'iShares 공식 정보·복수 소스 교차 확인(2026년 8월 기준)'
      }
    },
    {
      id: 'selection-criteria',
      navLabel: '구성 기준',
      heading: 'EPAC 지역의 고배당주 100종으로 압축',
      paragraphs: [
        'IDV가 추종하는 지수는 유럽·태평양·아시아·캐나다 지역에 상장된 기업 중 배당률이 높은 종목을 선별해 약 100종을 담습니다. 신흥국은 원칙적으로 포함되지 않습니다.',
        '비중은 배당률에 가중치를 둔 방식으로 정해지며, 특정 국가·섹터에 비중이 쏠릴 수 있어 별도의 상한 규칙이 함께 적용됩니다.',
        '연 1회 재구성되며, 배당률 기준을 더 이상 충족하지 못하는 종목은 편출됩니다.'
      ]
    },
    {
      id: 'who-and-tradeoffs',
      navLabel: '적합성·트레이드오프',
      heading: '어떤 투자자에게 맞고, 무엇을 포기하는가',
      paragraphs: [
        'IDV는 이런 투자자에게 맞습니다. 신흥국보다 선진국 위주의 해외 고배당에 집중하고 싶은 사람, 100종으로 압축된 포트폴리오를 선호하는 사람, VYMI와는 다른 지역·방법론의 해외 고배당 ETF를 비교해 보고 싶은 사람입니다.',
        '포기하는 것도 있습니다. 첫째, 총보수 0.50%는 VYMI(0.07%)보다 훨씬 높습니다. 둘째, 신흥국 성장 잠재력에는 노출되지 않습니다. 셋째, 유럽·아시아 대형 배당주 집중 구조라 지역·섹터 쏠림이 있습니다.',
        '더 낮은 보수와 넓은 지역 분산을 원한다면 VYMI, 배당 성장에 무게를 두고 싶다면 VIGI와 함께 비교해 보세요.'
      ]
    }
  ],
  faqs: [
    {
      question: 'IDV 배당률은 얼마인가요?',
      answer:
        '이 시뮬레이터가 쓰는 계산 프리셋 기준 IDV의 명목 배당률(세전)은 {{dividendYield}}입니다. 유럽·아시아·캐나다 지역의 고배당주 100종만 압축해서 담아 형성되는 값입니다.'
    },
    {
      question: 'IDV는 어떤 지수를 추종하나요?',
      answer:
        'Dow Jones EPAC Select Dividend Index를 추종합니다. 유럽·태평양·아시아·캐나다 지역의 고배당주 약 100종으로 구성됩니다.'
    },
    {
      question: 'IDV 운용보수(총보수)는 얼마인가요?',
      answer: '0.50%입니다. 같은 해외 배당 카테고리의 VYMI·VIGI(각 0.07%)보다 훨씬 높은 수준입니다.'
    },
    {
      question: 'IDV와 VYMI는 무엇이 다른가요?',
      answer:
        'IDV는 신흥국을 제외한 EPAC(유럽·태평양·아시아·캐나다) 지역 고배당주 100종에 집중하고, VYMI는 신흥국을 포함한 전 세계로 더 넓게 분산합니다. 보수도 IDV(0.50%)가 VYMI(0.07%)보다 훨씬 높습니다.'
    },
    {
      question: 'IDV는 몇 종목을 담고 있나요?',
      answer: '약 100종입니다. 연 1회 재구성되며 배당률 기준을 충족하지 못하는 종목은 편출됩니다.'
    },
    {
      question: 'IDV 배당은 얼마나 자주 지급되나요?',
      answer: 'IDV는 {{frequencyLabel}} 지급됩니다. 정확한 배당락일·지급일은 매 분기 공지에 따라 달라질 수 있습니다.'
    },
    {
      question: 'IDV 배당에 붙는 세금은 어떻게 계산하나요?',
      answer:
        '해외 배당은 원천징수 등 세무 처리가 국가마다 다를 수 있고, 세율은 거주 국가와 계좌 종류에 따라 달라져 이 페이지가 대신 알려드릴 수 없습니다. 이 시뮬레이터에서는 세율을 직접 입력해 세후 배당을 계산해 볼 수 있습니다.'
    }
  ],
  reference: {
    trackedIndex: 'Dow Jones EPAC Select Dividend Index',
    inceptionYear: 2007,
    expenseRatioPercent: 0.5,
    holdingsCountApprox: 100,
    paymentMonthsNote: '연 4회 분기 지급',
    asOfNote:
      '상장일(2007년 6월 11일)·총보수(0.50%)·추종지수(Dow Jones EPAC Select Dividend Index)·보유종목수(약 100종)는 iShares 공식 정보와 복수 소스로 2026년 8월 교차 확인한 사실입니다. 국가별 비중·정확한 배당 CAGR은 신뢰할 단일 현재값을 확인하지 못해 이 페이지에서는 다루지 않았습니다. 배당률·배당성장률·기대수익률 등 계산에 쓰이는 값은 이 페이지가 아니라 시뮬레이터 계산 프리셋을 그대로 따릅니다.'
  },
  relatedTickers: [
    { ticker: 'VYMI', relationLabel: '더 낮은 보수의 넓은 해외 고배당 ETF를 원한다면' },
    { ticker: 'DWX', relationLabel: '신흥국까지 포함한 다른 방식의 해외 고배당을 비교하고 싶다면' },
    { ticker: 'VIGI', relationLabel: '배당 성장에 더 무게를 둔 해외 ETF를 원한다면' },
    { ticker: 'SCHY', relationLabel: '해외 배당성장 쪽에 무게를 두고 싶다면' }
  ],
  // 아이셰어즈(iShares/BlackRock) 정체성 — DVY와 같은 계열, 해외 상품 표시를 위해 톤을 조정. 장식 전용.
  accent: {
    from: '#241a05',
    to: '#e0a83c',
    textLight: '#5c4410',
    textDark: '#f0cd82'
  },
  disclaimer:
    '이 페이지는 정보 제공을 목적으로 하며 투자 자문이 아닙니다. 배당률·주가·운용보수·세금 등은 시장 상황과 정책에 따라 변동될 수 있으며, 과거 성과가 미래 수익을 보장하지 않습니다. 해외 투자는 환율 변동과 각국 정책 차이라는 별도의 위험을 동반합니다. 투자 판단과 그 결과에 대한 책임은 투자자 본인에게 있습니다.',
  contentUpdatedAt: '2026-08-06'
};
