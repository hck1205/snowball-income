import type { TickerContent } from './TickerContent.types';

/**
 * SDVY(퍼스트트러스트 스몰미드캡 라이징 디비던드 어치버스 ETF) SEO 랜딩 콘텐츠 — 소형·중형주
 * 구간에서 "3년·5년 연속 배당을 늘린" 기업만 골라 동일가중으로 담는 배당성장 ETF.
 *
 * 숫자 출처:
 * - 계산 6필드는 `shared/constants/presets`(`US_DIVIDEND_GROWTH_ETFS.SDVY`)에서 그대로 온다.
 * - 상장일(2017년 11월 1일)·총보수(0.59%)·추종지수(Nasdaq US SMID Cap Rising Dividend Achievers
 *   Index, 지수 자체는 2017년 9월 18일 기준값 1000으로 개시)·보유종목수(약 185종)·섹터 상위
 *   3종(금융·산업재·임의소비재)은 퍼스트트러스트·복수 소스로 2026년 8월 교차 확인.
 */
export const SDVY_TICKER_CONTENT: TickerContent = {
  ticker: 'SDVY',
  slug: 'sdvy',
  categoryIds: ['dividend-growth'],
  metaTitle: 'SDVY 배당률·운용보수·구성 총정리 — 퍼스트트러스트 스몰미드캡 라이징 디비던드 어치버스 ETF',
  metaDescription:
    'SDVY(퍼스트트러스트 스몰미드캡 라이징 디비던드 어치버스 ETF)의 배당률·운용보수 0.59%·동일가중 방식을 정리했습니다. 소형·중형주 중 배당을 꾸준히 늘려온 종목만 담고 싶다면 여기서 확인하세요.',
  heroTagline: '소형·중형주 중 최근 3년·5년 연속 배당을 늘려온 종목만 골라 동일한 비중으로 담는 ETF',
  sections: [
    {
      id: 'overview',
      navLabel: '개요',
      heading: 'SDVY, 무엇을 추종하는 ETF인가',
      paragraphs: [
        'SDVY(퍼스트트러스트 스몰미드캡 라이징 디비던드 어치버스 ETF, {{englishName}})는 2017년 11월 1일 상장한 ETF로, Nasdaq US SMID Cap Rising Dividend Achievers Index를 추종합니다. 이름 그대로 소형·중형주(SMID) 구간에서 배당을 늘려온 기업을 골라 담습니다.',
        '편입 기준은 최근 3년과 5년 각각 연간 배당을 늘렸는지를 함께 봅니다. 대형주 위주의 배당성장 ETF(SCHD·VIG·DGRO 등)와 달리, 아직 시가총액이 크지 않은 배당 성장주에 조기에 접근한다는 점이 다릅니다.',
        '{{koreanName}}는 이 시뮬레이터의 계산 프리셋에서 배당률 {{dividendYield}}, 연 배당성장률(가정) {{dividendGrowth}}, {{frequencyLabel}} 지급을 기준으로 합니다.'
      ],
      stat: {
        label: '추종 지수',
        value: 'Nasdaq US SMID Cap Rising Dividend Achievers Index',
        caption: '최근 3년·5년 연속 배당을 늘린 소형·중형주를 동일가중으로 담는 지수(2017년 9월 개시)'
      }
    },
    {
      id: 'dividend-yield',
      navLabel: '배당률',
      heading: '배당률 {{dividendYield}}, 배당보다 인상 이력을 우선한 설계',
      paragraphs: [
        'SDVY의 배당률은 {{dividendYield}} 안팎으로, 고배당 ETF보다는 낮은 편입니다. 지수 편입 기준 자체가 배당률의 절대적 크기가 아니라 "최근 3년·5년 연속 배당을 늘렸는가"라는 이력을 우선하기 때문입니다.',
        '소형·중형주는 대형주보다 배당 지급 역사가 짧은 기업이 많아, 이 지수는 상대적으로 짧은 기간(3~5년)의 인상 이력만 요구합니다. SCHD(10년 이상)나 NOBL(25년 이상) 같은 대형주 배당성장·배당귀족 지수보다 문턱이 낮은 셈입니다.',
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
      heading: '짧은 이력이라 성장 여력에 기대를 건다',
      paragraphs: [
        '이 시뮬레이터의 계산 프리셋은 SDVY의 연 배당성장률(가정)을 {{dividendGrowth}}, 기대 총수익률을 {{expectedTotalReturn}}로 둡니다. 소형·중형 배당성장 계열답게 이 시뮬레이터가 다루는 배당성장 ETF 중에서도 높은 축의 성장률 가정입니다.',
        '3~5년이라는 상대적으로 짧은 인상 이력 요구 조건은 "이제 막 배당을 늘리기 시작한" 기업을 조기에 포착할 가능성을 열어 줍니다. 다만 그만큼 검증 기간이 짧아, NOBL 같은 25년 이상 이력의 배당귀족보다 예측 가능성은 떨어집니다.',
        '지수는 매년 재구성되며, 조건을 더 이상 충족하지 못하는 종목(배당 동결·삭감)은 편출됩니다. 이 편출 구조가 "배당을 계속 늘리는 종목군"을 유지하는 장치이지만, 편출 전까지의 주가 흐름은 투자자가 그대로 안게 됩니다.'
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
      heading: '총보수 0.59% — 소형·중형주 액티브 성격의 대가',
      paragraphs: [
        'SDVY의 총보수는 0.59%로, 이 시뮬레이터가 다루는 대형주 배당성장 ETF(SCHD 0.06%, VIG 0.06%, DGRO 0.08%)보다 눈에 띄게 높습니다.',
        '소형·중형주 구간의 리서치·리밸런싱 비용과, 동일가중 방식을 유지하는 데 드는 매매 비용이 반영된 결과로 볼 수 있습니다. 동일가중은 시가총액 가중과 달리 매 재구성마다 모든 종목의 비중을 다시 맞춰야 해 거래가 더 자주 발생합니다.',
        '이 보수 차이는 장기 재투자 시 매년 조용히 복리로 누적됩니다. 소형·중형 배당성장 노출이 목적이라면 이 보수를 감수할 가치가 있는지 스스로 판단해 보시기 바랍니다.'
      ],
      stat: {
        label: '운용보수(총보수)',
        value: '0.59%',
        caption: '퍼스트트러스트 공식 정보·복수 소스 교차 확인(2026년 8월 기준)'
      }
    },
    {
      id: 'selection-criteria',
      navLabel: '구성 기준',
      heading: '3년·5년 연속 배당 인상 + 동일가중',
      paragraphs: [
        'SDVY가 추종하는 지수는 미국 소형·중형주 중 최근 3년과 5년 각각 연간 배당을 늘려온 종목을 후보로 삼습니다. 여기에 배당성향·유동성 등 재무 기준도 함께 적용됩니다.',
        '비중을 정하는 방식은 동일가중입니다. 시가총액이나 배당금 크기와 무관하게 편입된 각 종목이 거의 같은 비중을 차지합니다. 특정 대형 종목 하나에 비중이 쏠리는 것을 막는 대신, 소형주 하나의 실적 악화도 지수 전체에 비슷한 크기로 반영됩니다.',
        '2026년 8월 기준 보유종목은 약 185종이며, 금융·산업재·임의소비재 섹터 비중이 상대적으로 높은 것으로 확인됩니다. 연 1회 재구성 때마다 조건을 충족하지 못하는 종목은 빠지고 새 종목이 들어옵니다.'
      ]
    },
    {
      id: 'who-and-tradeoffs',
      navLabel: '적합성·트레이드오프',
      heading: '어떤 투자자에게 맞고, 무엇을 포기하는가',
      paragraphs: [
        'SDVY는 이런 투자자에게 맞습니다. 대형주 배당성장 ETF만으로는 부족한 소형·중형주 배당 성장 노출을 원하는 사람, 동일가중 방식으로 특정 종목 쏠림을 피하고 싶은 사람, 배당보다 인상 이력의 초기 신호를 중시하는 사람입니다.',
        '포기하는 것도 있습니다. 첫째, 총보수 0.59%는 대형주 배당성장 ETF보다 훨씬 높습니다. 둘째, 3~5년이라는 짧은 인상 이력 요구는 SCHD·NOBL보다 검증 기간이 짧습니다. 셋째, 소형·중형주라 대형주보다 주가·배당 변동성이 큽니다.',
        '더 낮은 보수의 대형주 배당성장을 원한다면 SCHD·VIG·DGRO, 검증된 장기 이력을 우선한다면 NOBL과 함께 비교해 보세요.'
      ]
    }
  ],
  faqs: [
    {
      question: 'SDVY 배당률은 얼마인가요?',
      answer:
        '이 시뮬레이터가 쓰는 계산 프리셋 기준 SDVY의 명목 배당률(세전)은 {{dividendYield}}입니다. 배당의 절대적 크기가 아니라 최근 3년·5년 연속 인상 이력을 편입 기준으로 삼는 지수라 고배당 ETF보다는 낮은 편입니다.'
    },
    {
      question: 'SDVY는 어떤 지수를 추종하나요?',
      answer:
        'Nasdaq US SMID Cap Rising Dividend Achievers Index를 추종합니다. 미국 소형·중형주 중 최근 3년·5년 연속 배당을 늘린 종목을 동일가중으로 담는 지수입니다.'
    },
    {
      question: 'SDVY 운용보수(총보수)는 얼마인가요?',
      answer: '0.59%입니다. SCHD(0.06%)·VIG(0.06%) 같은 대형주 배당성장 ETF보다 훨씬 높은 수준입니다.'
    },
    {
      question: 'SDVY는 몇 종목을 담고 있나요?',
      answer: '2026년 8월 기준 약 185종을 동일가중으로 담고 있습니다. 매년 재구성 시 조건을 충족하지 못하는 종목은 편출됩니다.'
    },
    {
      question: 'SDVY 배당은 얼마나 자주 지급되나요?',
      answer: 'SDVY는 {{frequencyLabel}} 지급됩니다. 정확한 배당락일·지급일은 매 분기 공지에 따라 달라질 수 있습니다.'
    },
    {
      question: 'SDVY와 SCHD는 무엇이 다른가요?',
      answer:
        'SCHD는 대형주 중 10년 이상 배당을 지급하고 재무 건전성이 높은 종목을 담습니다. SDVY는 소형·중형주 중 최근 3년·5년 연속 배당을 늘린 종목을 동일가중으로 담습니다. 시가총액 구간과 검증 기간, 보수 모두 다릅니다.'
    },
    {
      question: 'SDVY 배당에 붙는 세금은 어떻게 계산하나요?',
      answer:
        '배당소득세는 거주 국가와 계좌 종류에 따라 달라지며 이 페이지가 대신 알려드릴 수 없습니다. 이 시뮬레이터에서는 세율을 직접 입력해 세후 배당을 계산해 볼 수 있습니다.'
    }
  ],
  reference: {
    trackedIndex: 'Nasdaq US SMID Cap Rising Dividend Achievers Index',
    inceptionYear: 2017,
    expenseRatioPercent: 0.59,
    holdingsCountApprox: 185,
    paymentMonthsNote: '연 4회 분기 지급',
    topSectors: ['금융', '산업재', '임의소비재'],
    asOfNote:
      '상장일(2017년 11월 1일)·총보수(0.59%)·추종지수(Nasdaq US SMID Cap Rising Dividend Achievers Index, 지수 자체는 2017년 9월 18일 기준값 1000으로 개시)·보유종목수(약 185종)·상위 섹터(금융·산업재·임의소비재)는 퍼스트트러스트 공식 정보와 복수 소스로 2026년 8월 교차 확인한 사실입니다. 정확한 배당 CAGR은 신뢰할 단일 현재값을 확인하지 못해 이 페이지에서는 다루지 않았습니다. 배당률·배당성장률·기대수익률 등 계산에 쓰이는 값은 이 페이지가 아니라 시뮬레이터 계산 프리셋을 그대로 따릅니다.'
  },
  relatedTickers: [
    { ticker: 'RDVY', relationLabel: '대형·중형주 위주의 배당 인상 이력을 원한다면' },
    { ticker: 'SCHD', relationLabel: '더 낮은 보수의 대형주 배당성장을 원한다면' },
    { ticker: 'DES', relationLabel: '소형주를 배당금 가중 방식으로 담고 싶다면' },
    { ticker: 'NOBL', relationLabel: '25년 이상 검증된 장기 배당 인상 이력을 원한다면' }
  ],
  // 퍼스트트러스트(First Trust) 정체성 — 딥 네이비 앵커 → 스카이블루. 장식 전용.
  accent: {
    from: '#0d2a4a',
    to: '#4a90c9',
    textLight: '#164070',
    textDark: '#7fb8e3'
  },
  disclaimer:
    '이 페이지는 정보 제공을 목적으로 하며 투자 자문이 아닙니다. 배당률·주가·운용보수·세금 등은 시장 상황과 정책에 따라 변동될 수 있으며, 과거 성과가 미래 수익을 보장하지 않습니다. 소형·중형주는 대형주보다 주가·배당 변동성이 큰 경향이 있습니다. 투자 판단과 그 결과에 대한 책임은 투자자 본인에게 있습니다.',
  contentUpdatedAt: '2026-08-06'
};
