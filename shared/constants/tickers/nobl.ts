import type { TickerContent } from './TickerContent.types';

/**
 * NOBL(프로셰어즈 S&P 500 배당귀족 ETF) SEO 랜딩 콘텐츠 — `schd.ts` 템플릿을 그대로 따른다.
 *
 * 숫자 출처:
 * - 계산 6필드는 `shared/constants/presets`(`US_DIVIDEND_GROWTH_ETFS.NOBL`)에서 그대로 온다.
 * - `reference`의 정적 사실(추종지수, 운용보수 0.35%, 상장일 2013-10-09, 보유종목수 69종, 분기 지급)은
 *   프로셰어즈 공식 상품 페이지(proshares.com/our-etfs/strategic/nobl, 2026-08-02 조회)로 확인.
 *   같은 페이지에서 "25년 이상 매년 배당을 늘려 온 기업", "기준을 충족하는 종목이 40개 미만이면 증배
 *   이력이 더 짧은 기업을 편입할 수 있다", "특별배당은 산입하지 않으며 배당을 줄이거나 없앤 기업은
 *   지수에서 제외될 수 있다"도 함께 확인했다.
 * - 지수의 동일가중 방식·분기 리밸런싱·연 1회(1월) 유니버스 재심사는 S&P 다우존스 인다이시즈의
 *   배당귀족 지수 방법론 문서 기준으로 2026-08-02 확인한 사실이다.
 * - 보유종목수(69종)는 조회 시점 값이라 지수 재편에 따라 달라진다 — `asOfNote`에 고지했다.
 * - `topSectors`는 이번 조사에서 신뢰할 단일 현재값을 확인하지 못해 **의도적으로 비웠다**
 *   (동일가중이라 섹터 순서가 재편마다 뒤집히기 쉽다). 채우려면 발행사 공식 팩트시트를 근거로 할 것.
 * - `topHoldings`는 프로셰어즈 공식 보유 종목 표(2026-08-02 조회, 기준일 2026-07-31)의 상위 20종이다.
 *   동일가중이라 1위 1.66%와 20위 1.49%의 차이가 0.17%p뿐이다 — "무엇을 가장 많이 담았나"라는 질문
 *   자체가 이 ETF에서는 의미가 작다는 사실을 목록이 직접 보여준다.
 */
export const NOBL_TICKER_CONTENT: TickerContent = {
  ticker: 'NOBL',
  slug: 'nobl',
  categoryIds: ['dividend-growth'],
  metaTitle: 'NOBL 배당률·배당귀족 지수·운용보수 총정리 — 프로셰어즈 S&P 500 배당귀족 ETF',
  metaDescription:
    'NOBL(프로셰어즈 S&P 500 배당귀족 ETF)의 배당률·운용보수·25년 연속 증배 편입 기준과 동일가중 방식을 정리했습니다. 배당을 오래 늘려 온 기업만 담는 방식이 궁금하다면 여기서 확인하세요.',
  heroTagline: '25년 넘게 매년 배당을 늘려 온 S&P 500 기업만, 크기와 무관하게 같은 비중으로 담는 ETF',
  sections: [
    {
      id: 'overview',
      navLabel: '개요',
      heading: 'NOBL, 무엇을 추종하는 ETF인가',
      paragraphs: [
        'NOBL(프로셰어즈 S&P 500 배당귀족 ETF, {{englishName}})은 S&P 500 배당귀족 지수(S&P 500 Dividend Aristocrats Index)를 그대로 따라가는 패시브 ETF입니다. 편입 조건이 한 문장으로 요약됩니다 — S&P 500 구성 종목 가운데 최소 25년 연속으로 매년 배당을 늘려 온 기업만 담습니다.',
        '25년이라는 기준은 두 번의 경기 침체와 여러 차례의 시장 급락을 지나오는 동안 배당을 한 해도 줄이지 않았다는 뜻입니다. 배당률이 높은 기업을 고르는 지수가 아니라, 배당을 계속 늘려 온 이력 자체를 자격 요건으로 삼는 지수입니다. 특별배당은 이 이력에 산입하지 않고, 배당을 줄이거나 없앤 기업은 지수에서 빠집니다.',
        '{{koreanName}}는 2013년 10월 상장했고, 이 시뮬레이터가 참조하는 계산 프리셋은 배당률 {{dividendYield}}, 연 배당성장률(가정) {{dividendGrowth}}, {{frequencyLabel}} 지급을 기준으로 합니다.'
      ],
      stat: {
        label: '추종 지수',
        value: 'S&P 500 배당귀족 지수',
        caption: '25년 이상 연속 증배한 S&P 500 기업으로 구성 — 조회 시점 69종'
      }
    },
    {
      id: 'dividend-yield',
      navLabel: '배당률',
      heading: '배당률 {{dividendYield}}가 낮아 보이는 이유',
      paragraphs: [
        'NOBL의 배당률은 {{dividendYield}} 안팎입니다. 배당을 25년 넘게 늘려 온 기업만 모았다고 하면 배당률도 높을 것 같지만, 실제로는 고배당 ETF보다 낮게 나오는 경우가 많습니다. 편입 기준에 배당률이 아예 들어 있지 않기 때문입니다.',
        '오히려 배당을 오래 늘려 온 기업일수록 주가가 함께 올라 배당률이 낮아지는 일이 흔합니다. 배당률은 주당 배당금을 주가로 나눈 값이라, 배당금이 늘어도 주가가 더 빨리 오르면 숫자는 내려갑니다. 이 지수가 보는 것은 그 분자(배당금)가 몇 년째 늘고 있는가입니다.',
        '배당률은 주가와 함께 매일 움직이는 값이라, 이 페이지가 보여주는 숫자는 작성 시점 기준이며 계속 달라집니다. 내 조건(투입 금액·기간·세율)에서 이 배당률이 실제로 어떤 현금흐름으로 이어지는지는 시뮬레이터에서 직접 계산해 보세요.'
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
      heading: '25년이라는 문턱이 만드는 것',
      paragraphs: [
        '이 시뮬레이터의 계산 프리셋은 NOBL의 연 배당성장률(가정)을 {{dividendGrowth}}로 두고, 기대 총수익률을 {{expectedTotalReturn}}로 봅니다. 배당을 재투자하면 이듬해 배당은 늘어난 주당 배당금과 늘어난 보유 수량이 함께 곱해져 계산되므로, 같은 성장률이라도 재투자 기간이 길어질수록 배당 총액이 커지는 속도가 빨라집니다.',
        '이 지수의 특징은 성장률의 크기가 아니라 성장의 연속성에 있습니다. 한 해에 배당을 크게 올린 기업보다, 25년 동안 한 번도 거르지 않은 기업을 골라내는 규칙이기 때문입니다. 자격을 잃은 기업은 지수에서 빠지고 새로 25년을 채운 기업이 들어오므로, 구성 종목은 시간이 지나며 조금씩 교체됩니다.',
        '다만 이 성장률은 과거 실적의 단순 반복이 아니라 향후 배당·주가 흐름에 대한 가정입니다. 25년 연속 증배 이력이 26년째를 보장하지는 않으며, 실제로 배당을 동결하거나 줄여 지수에서 제외되는 기업도 매년 나옵니다.'
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
      heading: '패시브치고는 높은 0.35%를 어떻게 볼 것인가',
      paragraphs: [
        'NOBL의 운용보수(총보수)는 0.35%입니다. 같은 배당성장 계열인 SCHD(0.06%)·VIG(0.04%)와 비교하면 다섯 배 이상 높고, 이 시뮬레이터가 다루는 패시브 배당 ETF 가운데 높은 편에 속합니다.',
        '보수는 매년 조용히 수익률에서 빠져나갑니다. 100만 원 기준으로 연 3,500원 수준이라 당장은 작아 보이지만, 배당을 재투자하며 수십 년을 운용하면 그 차이가 매년 누적됩니다 — 보수가 낮을수록 재투자되는 원금이 그만큼 더 온전히 남습니다.',
        '그래서 NOBL을 볼 때는 이 보수 차이를 상쇄할 만큼 "25년 연속 증배"라는 편입 규칙이 나에게 가치가 있는지를 먼저 따져 보는 편이 낫습니다. 같은 배당성장 카테고리 안에서도 지수 규칙과 보수가 상품마다 크게 다릅니다.'
      ],
      stat: {
        label: '운용보수(총보수)',
        value: '0.35%',
        caption: '프로셰어즈 공식 상품 페이지 기준(2026-08-02 확인)'
      }
    },
    {
      id: 'selection-criteria',
      navLabel: '구성 기준',
      heading: '동일가중 — 대형주 쏠림을 규칙으로 막는다',
      paragraphs: [
        'NOBL이 추종하는 지수는 편입된 기업을 시가총액이 아니라 동일가중으로 담습니다. 시가총액 수조 달러의 기업과 그보다 훨씬 작은 기업이 같은 비중을 갖는다는 뜻입니다. 그리고 분기마다 비중을 다시 같게 맞추고, 어떤 기업이 자격을 유지하는지는 매년 1월에 다시 심사합니다.',
        '동일가중은 소수 대형주의 성과가 지수 전체를 좌우하는 일을 규칙으로 막아 줍니다. 반대로 그 대형주가 강하게 오르는 구간에서는 시가총액 가중 지수보다 뒤처지기 쉽습니다. 어느 쪽이 유리한지는 시기에 따라 갈립니다.',
        '편입 자격을 갖춘 종목이 40개 미만으로 줄어들면, 지수는 증배 이력이 더 짧은 기업까지 포함해 종목 수를 채울 수 있습니다. 25년이라는 문턱이 어떤 상황에서도 절대적으로 유지되는 것은 아니라는 뜻이라, 규칙의 예외 조항까지 함께 알아 두는 편이 정확합니다.'
      ]
    },
    {
      id: 'who-and-tradeoffs',
      navLabel: '적합성·트레이드오프',
      heading: '어떤 투자자에게 맞고, 무엇을 포기하는가',
      paragraphs: [
        'NOBL은 이런 투자자에게 잘 맞습니다. 배당의 크기보다 끊기지 않는 이력을 우선하는 사람, 소수 대형주에 쏠리지 않는 구성을 원하는 사람, 종목 선정을 명확하고 검증 가능한 한 줄 규칙(25년 연속 증배)에 맡기고 싶은 사람입니다.',
        '반대로 짚어야 할 트레이드오프가 셋 있습니다. 첫째, 배당률 {{dividendYield}} 안팎은 고배당 ETF나 옵션인컴 계열보다 낮습니다. 둘째, 운용보수 0.35%는 같은 카테고리의 대형 ETF보다 높습니다. 셋째, 25년 문턱을 넘은 기업은 대체로 성숙 단계의 산업에 몰려 있어, 기술주 중심의 강한 성장장에서는 상대적으로 뒤처질 수 있습니다.',
        'NOBL은 배당이 끊기지 않는다는 점에 무게를 둔 상품이지, 지금 가장 높은 현금흐름이나 가장 빠른 주가 상승을 노리는 상품이 아닙니다. 목적에 따라 SCHD·VIG 같은 배당성장 계열, SDY 같은 중소형 포함 증배 계열, HDV·VYM 같은 고배당 계열과 함께 비교해 보세요.'
      ]
    }
  ],
  faqs: [
    {
      question: 'NOBL 배당률은 얼마인가요?',
      answer:
        '이 시뮬레이터가 쓰는 계산 프리셋 기준 NOBL의 명목 배당률(세전)은 {{dividendYield}}입니다. 편입 기준에 배당률이 들어 있지 않아 고배당 ETF보다 낮게 나오는 편이며, 주가가 움직이면 이 숫자도 함께 달라집니다. 내 조건에서의 실제 현금흐름은 시뮬레이터에서 직접 계산해 보세요.'
    },
    {
      question: 'NOBL 배당은 얼마나 자주 지급되나요?',
      answer: 'NOBL은 {{frequencyLabel}} 지급됩니다. 정확한 배당락일과 지급일은 매 분기 공지에 따라 달라질 수 있습니다.'
    },
    {
      question: '배당귀족(Dividend Aristocrats)이 무슨 뜻인가요?',
      answer:
        'S&P 500 구성 종목 가운데 최소 25년 연속으로 매년 배당을 늘려 온 기업을 가리키는 지수 용어입니다. 특별배당은 이 이력에 산입하지 않으며, 배당을 줄이거나 없앤 기업은 지수에서 제외됩니다.'
    },
    {
      question: 'NOBL 운용보수(총보수)는 얼마인가요?',
      answer:
        '0.35%입니다(프로셰어즈 공식 상품 페이지, 2026-08-02 확인). SCHD·VIG 같은 대형 배당성장 ETF보다 높은 수준이라, 장기 보유 시 누적되는 비용 차이를 함께 고려할 필요가 있습니다.'
    },
    {
      question: 'NOBL은 몇 종목을 담고 있나요?',
      answer:
        '조회 시점 기준 69종입니다. 매년 1월에 편입 자격을 다시 심사하므로 종목 수는 재편마다 달라지며, 자격을 갖춘 종목이 40개 미만이 되면 증배 이력이 더 짧은 기업까지 포함할 수 있습니다.'
    },
    {
      question: 'NOBL vs SCHD, 무엇이 다른가요?',
      answer:
        'NOBL은 25년 연속 증배라는 이력 하나를 자격 요건으로 삼고 동일가중으로 담습니다. SCHD는 10년 이상 배당 지급을 전제로 현금흐름 대비 부채·자기자본이익률·배당률·5년 배당성장률을 종합한 점수로 고르고 시가총액 기반으로 비중을 둡니다. 보수도 0.35%와 0.06%로 차이가 큽니다.'
    },
    {
      question: 'NOBL은 왜 동일가중인가요?',
      answer:
        '소수 대형주가 지수 성과를 좌우하지 않도록 하기 위해서입니다. 분기마다 비중을 다시 같게 맞춥니다. 대형주가 강하게 오르는 구간에서는 시가총액 가중 지수보다 뒤처질 수 있다는 점이 그 대가입니다.'
    },
    {
      question: 'NOBL 배당에 붙는 세금은 어떻게 계산하나요?',
      answer:
        '배당소득세는 거주 국가와 계좌 종류에 따라 달라지며 이 페이지가 대신 알려드릴 수 없습니다. 이 시뮬레이터에서는 세율을 직접 입력해 세후 배당을 계산해 볼 수 있습니다.'
    }
  ],
  reference: {
    trackedIndex: 'S&P 500 배당귀족 지수(S&P 500 Dividend Aristocrats Index)',
    inceptionYear: 2013,
    expenseRatioPercent: 0.35,
    holdingsCountApprox: 69,
    paymentMonthsNote: '연 4회 분기 지급',
    topHoldings: {
      holdings: [
        { symbol: 'ROP', name: 'ROPER TECHNOLOGIES INC', weightPercent: 1.66 },
        { symbol: 'ERIE', name: 'ERIE INDEMNITY COMPANY-CL A', weightPercent: 1.64 },
        { symbol: 'ADP', name: 'AUTOMATIC DATA PROCESSING', weightPercent: 1.57 },
        { symbol: 'NUE', name: 'NUCOR CORP', weightPercent: 1.56 },
        { symbol: 'BF/B', name: 'BROWN-FORMAN CORP-CLASS B', weightPercent: 1.55 },
        { symbol: 'IBM', name: 'INTL BUSINESS MACHINES CORP', weightPercent: 1.55 },
        { symbol: 'BDX', name: 'BECTON DICKINSON AND CO', weightPercent: 1.54 },
        { symbol: 'BRO', name: 'BROWN & BROWN INC', weightPercent: 1.54 },
        { symbol: 'FDS', name: 'FACTSET RESEARCH SYSTEMS INC', weightPercent: 1.53 },
        { symbol: 'EMR', name: 'EMERSON ELECTRIC CO', weightPercent: 1.53 },
        { symbol: 'KO', name: 'COCA-COLA CO/THE', weightPercent: 1.52 },
        { symbol: 'SHW', name: 'SHERWIN-WILLIAMS CO/THE', weightPercent: 1.52 },
        { symbol: 'SWK', name: 'STANLEY BLACK & DECKER INC', weightPercent: 1.51 },
        { symbol: 'FAST', name: 'FASTENAL CO', weightPercent: 1.5 },
        { symbol: 'ABT', name: 'ABBOTT LABORATORIES', weightPercent: 1.5 },
        { symbol: 'TGT', name: 'TARGET CORP', weightPercent: 1.5 },
        { symbol: 'ITW', name: 'ILLINOIS TOOL WORKS', weightPercent: 1.5 },
        { symbol: 'BEN', name: 'FRANKLIN RESOURCES INC', weightPercent: 1.49 },
        { symbol: 'CAH', name: 'CARDINAL HEALTH INC', weightPercent: 1.49 },
        { symbol: 'MDT', name: 'MEDTRONIC PLC', weightPercent: 1.49 }
      ],
      coveredWeightPercent: 30.69,
      asOfDate: '2026-07-31',
      sourceLabel: '프로셰어즈 공식 보유 종목 표',
      sourceUrl: 'https://www.proshares.com/our-etfs/strategic/nobl'
    },
    asOfNote:
      '추종지수·운용보수(0.35%)·상장일(2013년 10월 9일)·보유종목수(69종)·분기 지급·편입 규칙(25년 이상 연속 증배, 특별배당 미산입, 자격 종목 40개 미만 시 예외 편입)은 프로셰어즈 공식 상품 페이지(proshares.com, 2026-08-02 조회)로 확인한 사실입니다. 동일가중 방식·분기 리밸런싱·연 1회(1월) 유니버스 재심사는 S&P 다우존스 인다이시즈의 배당귀족 지수 방법론 기준으로 같은 날 확인했습니다. 보유종목수는 지수 재편에 따라 달라지는 값이라 근사치로 보아야 합니다. 상위 섹터는 동일가중이라 순서가 자주 뒤집혀 이 페이지에서는 다루지 않았습니다. 대표 보유 종목과 비중은 프로셰어즈 공식 보유 종목 표(2026년 7월 31일 기준)에서 옮긴 값이며, 동일가중이라 순위가 시세만으로도 쉽게 뒤바뀝니다. 배당률·배당성장률·기대수익률 등 계산에 쓰이는 값은 이 페이지가 아니라 시뮬레이터 계산 프리셋을 그대로 따릅니다.'
  },
  relatedTickers: [
    { ticker: 'SCHD', relationLabel: '재무건전성 점수까지 더한 배당성장을 원한다면' },
    { ticker: 'VIG', relationLabel: '더 낮은 보수로 대형주 증배 이력을 담고 싶다면' },
    { ticker: 'SDY', relationLabel: '중소형주까지 포함한 20년 증배 이력을 원한다면' },
    { ticker: 'HDV', relationLabel: '지금 더 높은 배당률을 원한다면' }
  ],
  // 배당귀족(Aristocrats) 정체성 — 딥 로열 퍼플 → 라벤더. 장식 전용(대비는 textLight/Dark로 확보).
  accent: {
    from: '#3d2a66',
    to: '#8f74d6',
    textLight: '#4d3585',
    textDark: '#b6a0ea'
  },
  disclaimer:
    '이 페이지는 정보 제공을 목적으로 하며 투자 자문이 아닙니다. 배당률·주가·운용보수·세금 등은 시장 상황과 정책에 따라 변동될 수 있으며, 과거 성과가 미래 수익을 보장하지 않습니다. 투자 판단과 그 결과에 대한 책임은 투자자 본인에게 있습니다.',
  contentUpdatedAt: '2026-08-02'
};
