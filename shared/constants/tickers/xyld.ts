import type { TickerContent } from './TickerContent.types';

/**
 * XYLD(글로벌 X S&P 500 커버드콜 ETF) SEO 랜딩 콘텐츠 — `qyld.ts`와 같은 각도(높은 월 분배 vs
 * 상단 제한·원금 변동)를 유지하되, 기초 지수가 S&P 500이라는 차이에서 오는 성질을 중심에 둔다.
 *
 * 숫자 출처:
 * - 계산 6필드는 `shared/constants/presets`(`OPTION_INCOME_ETFS.XYLD`)에서 그대로 온다.
 *   ⚠ QYLD와 마찬가지로 기대 총수익률이 분배율보다 낮아 파생 `dividendGrowth`가 **음수**로 렌더된다.
 * - `reference`의 정적 사실(추종지수, 총보수 0.60%, 상장일 2013-06-21, 보유종목수 505종, 월 분배)은
 *   글로벌 X 공식 상품 페이지(globalxetfs.com/funds/xyld, 2026-08-02 조회)로 확인.
 * - `topSectors`는 S&P 500 구성을 그대로 따라가 개별 값을 확인·고정할 실익이 없어 비웠다.
 * - `topHoldings`는 글로벌 X 공식 전체 보유 종목 파일(xyld_full-holdings_20260731.csv, 2026-08-02 내려받음)의
 *   주식 라인 상위 20종이다. 같은 파일의 **숏 S&P 500 콜옵션(-1.29%)·현금(0.13%)은 주식이 아니라
 *   제외**했다(qyld.ts와 같은 규칙 — `excludedNote`가 그 사실을 데이터로 말한다).
 */
export const XYLD_TICKER_CONTENT: TickerContent = {
  ticker: 'XYLD',
  slug: 'xyld',
  categoryIds: ['covered-call'],
  metaTitle: 'XYLD 분배율·커버드콜 구조·운용보수 총정리 — 글로벌 X S&P 500 커버드콜 ETF',
  metaDescription:
    'XYLD(글로벌 X S&P 500 커버드콜 ETF)의 분배율·커버드콜 전략·운용보수와 상승 여력 제한·원금 변동을 정리했습니다. S&P 500 기반 월 분배 구조가 궁금하다면 여기서 확인하세요.',
  heroTagline: 'S&P 500 500여 종을 그대로 담고, 그 위의 상승 여력을 매월 현금으로 바꾸는 ETF',
  sections: [
    {
      id: 'overview',
      navLabel: '개요',
      heading: 'XYLD, 무엇을 하는 ETF인가',
      paragraphs: [
        'XYLD(글로벌 X S&P 500 커버드콜 ETF, {{englishName}})는 Cboe S&P 500 바이라이트 지수(Cboe S&P 500 BuyWrite Index)를 추종합니다. S&P 500 구성 종목을 보유하면서 같은 지수에 대한 콜옵션을 팔고, 그 프리미엄을 매월 분배금의 재원으로 씁니다.',
        '구조는 같은 운용사의 QYLD와 동일하고 기초 지수만 다릅니다. 나스닥 100보다 업종 구성이 넓고 변동성이 상대적으로 낮은 S&P 500을 기초로 하기 때문에, 받는 옵션 프리미엄도 대체로 더 완만합니다 — 분배율이 낮아지는 대신 상승장에서 포기하는 폭도 그만큼 줄어듭니다.',
        '{{koreanName}}는 2013년 6월 상장했고, 이 시뮬레이터가 참조하는 계산 프리셋은 분배율 {{dividendYield}}, 연 배당성장률(가정) {{dividendGrowth}}, {{frequencyLabel}} 지급을 기준으로 합니다.'
      ],
      stat: {
        label: '추종 지수',
        value: 'Cboe S&P 500 바이라이트 지수',
        caption: 'S&P 500 보유 + 같은 지수 콜옵션 매도 — 조회 시점 505종 보유'
      }
    },
    {
      id: 'dividend-yield',
      navLabel: '분배율',
      heading: '분배율 {{dividendYield}}의 두 재원',
      paragraphs: [
        'XYLD의 분배율은 {{dividendYield}} 안팎입니다. 재원은 두 가지인데, 하나는 보유 중인 S&P 500 종목이 주는 배당이고 다른 하나는 콜옵션을 팔아 받는 프리미엄입니다. 비중은 프리미엄 쪽이 압도적으로 큽니다.',
        '이 구성 때문에 XYLD의 분배율은 배당성장 ETF의 배당률처럼 완만하게 움직이지 않습니다. 시장 변동성이 커지면 프리미엄이 커져 분배도 늘고, 시장이 잔잔해지면 함께 줄어듭니다. 매월 금액이 달라지는 것이 정상입니다.',
        '분배율이 높다는 사실만으로 총수익이 높다고 볼 수는 없습니다. 분배는 총수익을 어떻게 나눠 받느냐의 문제이고, 상승분을 옵션 매수자에게 넘긴 만큼 주가 쪽에서 잃는 부분이 있습니다. 내 조건에서의 실제 현금흐름은 시뮬레이터에서 직접 계산해 보세요.'
      ],
      stat: {
        label: '분배율(세전, 명목)',
        value: '{{dividendYield}}',
        caption: '시뮬레이터 계산 프리셋 기준 — 대부분이 옵션 프리미엄이라 변동성에 따라 달라집니다'
      }
    },
    {
      id: 'dividend-growth',
      navLabel: '분배 구조',
      heading: '배당성장률 가정이 음수라는 것의 뜻',
      paragraphs: [
        '이 시뮬레이터는 기대 총수익률에서 분배율을 뺀 값을 연 배당성장률(가정)로 씁니다. XYLD는 분배율 {{dividendYield}}가 기대 총수익률 {{expectedTotalReturn}}보다 높아, 이 가정치가 {{dividendGrowth}}로 음수가 됩니다.',
        '이는 매월 받는 분배금의 일부가 주가(순자산가치)에서 나온다고 보는 모델입니다. 상승은 옵션 매도로 제한되고 하락은 대체로 그대로 반영되는 구조라, 오랜 기간을 놓고 보면 기준가격이 낮아지는 흐름이 나타날 수 있기 때문입니다.',
        '따라서 이 상품의 재투자는 늘어나는 주당 분배금이 아니라 늘어나는 보유 수량 쪽에 가깝습니다. 시뮬레이터에서 이 가정을 직접 바꿔 볼 수 있으니, 기준가격이 유지되는 경우와 낮아지는 경우를 각각 넣어 비교해 보세요.'
      ],
      stat: {
        label: '연 배당성장률(계산 가정)',
        value: '{{dividendGrowth}}',
        caption: '기대 총수익 {{expectedTotalReturn}}에서 분배율을 뺀 값 — 음수는 분배의 일부가 기준가격에서 나온다는 가정입니다'
      }
    },
    {
      id: 'expense-ratio',
      navLabel: '운용보수',
      heading: '총보수 0.60% — 기초 지수는 저렴해도 전략은 그렇지 않다',
      paragraphs: [
        'XYLD의 총보수는 0.60%입니다. 같은 S&P 500을 그냥 담는 지수 ETF의 보수가 0.03~0.09% 수준인 것과 비교하면 열 배 안팎이며, 이 시뮬레이터가 다루는 배당 ETF 가운데 가장 높은 축입니다.',
        '차이는 지수 복제가 아니라 옵션 운용에서 옵니다. 매월 옵션 포지션을 새로 설정하고 관리해야 하므로 단순 지수 추종보다 비용 구조가 무겁습니다.',
        '보수는 분배금이 아니라 총수익에서 차감된다고 보는 편이 정확합니다. 분배율이 두 자릿수라 0.60%가 상대적으로 작아 보이지만, 장기 보유에서는 이 비용이 매년 누적됩니다.'
      ],
      stat: {
        label: '운용보수(총보수)',
        value: '0.60%',
        caption: '글로벌 X 공식 상품 페이지 기준(2026-08-02 확인)'
      }
    },
    {
      id: 'selection-criteria',
      navLabel: '구성 방식',
      heading: '500여 종을 그대로 담고, 지수 단위로 옵션을 판다',
      paragraphs: [
        'XYLD는 배당주를 선별하지 않습니다. S&P 500 구성 종목을 그대로 보유하므로 조회 시점 기준 505종을 담고 있으며, 이는 커버드콜 계열 가운데 가장 넓은 분산입니다. 개별 종목 하나가 전체에 미치는 영향은 그만큼 작습니다.',
        '옵션은 개별 종목이 아니라 지수 전체를 대상으로 매도합니다. 개별 종목별로 콜을 파는 방식과 달리, 지수 단위 매도는 포트폴리오 전체의 상승분에 상한이 걸리는 형태입니다.',
        '기초가 S&P 500이라 헬스케어·금융·필수소비재 같은 배당 지급 업종의 비중이 나스닥 100 기반 상품보다 큽니다. 그래서 분배금 중 실제 배당이 차지하는 몫도 상대적으로 조금 더 크지만, 여전히 옵션 프리미엄이 주된 재원이라는 점은 같습니다.'
      ]
    },
    {
      id: 'who-and-tradeoffs',
      navLabel: '적합성·트레이드오프',
      heading: '무엇을 얻고, 무엇을 내주는가',
      paragraphs: [
        'XYLD는 이런 투자자에게 잘 맞습니다. 매월 현금흐름이 목적이면서 기초 자산은 가능한 한 넓게 분산하고 싶은 사람, 나스닥 100 기반 상품보다 변동성을 낮추고 싶은 사람, 상승 여력을 일부 내주는 구조를 이해하고 받아들이는 사람입니다.',
        '내주는 것도 분명합니다. 첫째, 강한 상승장에서는 S&P 500 자체에 뒤처집니다. 둘째, 하락은 대체로 그대로 받습니다 — 프리미엄이 완충은 되지만 방어막은 아닙니다. 셋째, 이 둘이 겹쳐 오랜 기간 기준가격이 낮아지면 분배금 자체도 함께 줄어듭니다. 넷째, 총보수 0.60%는 이 페이지에서 가장 높은 축입니다.',
        'XYLD는 배당을 늘려 가는 상품이 아니라 지금의 변동성을 현금으로 바꾸는 상품입니다. 같은 구조의 더 공격적인 버전을 원하면 QYLD, 액티브 운용으로 상단 제한을 조절하는 절충형을 원하면 JEPI, 배당성장 여력을 남기고 싶으면 SCHD와 함께 비교해 보세요.'
      ]
    }
  ],
  faqs: [
    {
      question: 'XYLD 분배율은 얼마인가요?',
      answer:
        '이 시뮬레이터가 쓰는 계산 프리셋 기준 XYLD의 명목 분배율(세전)은 {{dividendYield}}입니다. 대부분이 옵션 프리미엄에서 나와 시장 변동성에 따라 달라지고, 매월 금액도 달마다 다릅니다. 내 조건에서의 실제 현금흐름은 시뮬레이터에서 직접 계산해 보세요.'
    },
    {
      question: 'XYLD 배당은 얼마나 자주 지급되나요?',
      answer: 'XYLD는 {{frequencyLabel}} 지급됩니다. 매월 금액은 그달의 옵션 프리미엄 규모에 따라 달라집니다.'
    },
    {
      question: 'XYLD와 QYLD는 무엇이 다른가요?',
      answer:
        '전략은 같고 기초 지수만 다릅니다. XYLD는 S&P 500, QYLD는 나스닥 100을 기초로 커버드콜을 씁니다. S&P 500 쪽이 업종 분산이 넓고 변동성이 낮아 분배율이 대체로 더 낮은 대신, 상승장에서 포기하는 폭도 작습니다. 총보수는 둘 다 0.60%입니다.'
    },
    {
      question: 'XYLD 운용보수(총보수)는 얼마인가요?',
      answer:
        '0.60%입니다(글로벌 X 공식 상품 페이지, 2026-08-02 확인). 같은 S&P 500을 단순 추종하는 지수 ETF보다 열 배 안팎 높은 수준입니다.'
    },
    {
      question: 'XYLD는 왜 배당성장률 가정이 음수인가요?',
      answer:
        '이 시뮬레이터는 기대 총수익률에서 분배율을 뺀 값을 배당성장률 가정으로 씁니다. XYLD는 분배율이 기대 총수익률보다 높아 그 차이가 음수가 되며, 이는 분배금의 일부가 기준가격에서 나온다고 보는 모델입니다.'
    },
    {
      question: 'XYLD는 몇 종목을 담고 있나요?',
      answer:
        '조회 시점 기준 505종입니다. S&P 500 구성 종목을 그대로 담기 때문에 커버드콜 계열 가운데 분산이 가장 넓은 편입니다.'
    },
    {
      question: 'XYLD는 원금 손실 위험이 있나요?',
      answer:
        '있습니다. 분배율이 높다고 원금이 보장되지 않으며, 시장 하락기에는 기준가격이 함께 내려갑니다. 상승은 제한되고 하락은 반영되는 구조라 장기간 기준가격이 낮아지는 흐름이 나타날 수 있습니다.'
    },
    {
      question: 'XYLD 분배금에 붙는 세금은 어떻게 계산하나요?',
      answer:
        '배당소득세는 거주 국가와 계좌 종류에 따라 달라지고, 분배금의 구성(배당·옵션프리미엄·자본환급)에 따라 세무 처리가 달라질 수 있어 이 페이지가 대신 알려드릴 수 없습니다. 이 시뮬레이터에서는 세율을 직접 입력해 세후 분배금을 계산해 볼 수 있습니다.'
    }
  ],
  reference: {
    trackedIndex: 'Cboe S&P 500 바이라이트 지수(Cboe S&P 500 BuyWrite Index)',
    inceptionYear: 2013,
    expenseRatioPercent: 0.6,
    holdingsCountApprox: 505,
    paymentMonthsNote: '매월 지급(월배당) — 매월 옵션 프리미엄 규모에 따라 금액이 달라집니다',
    topHoldings: {
      holdings: [
        { symbol: 'NVDA', name: 'NVIDIA CORP', weightPercent: 7.64 },
        { symbol: 'AAPL', name: 'APPLE INC', weightPercent: 7.13 },
        { symbol: 'MSFT', name: 'MICROSOFT CORP', weightPercent: 5.42 },
        { symbol: 'AMZN', name: 'AMAZON.COM INC', weightPercent: 4.18 },
        { symbol: 'GOOGL', name: 'ALPHABET INC-CL A', weightPercent: 3.28 },
        { symbol: 'AVGO', name: 'BROADCOM INC', weightPercent: 2.9 },
        { symbol: 'GOOG', name: 'ALPHABET INC-CL C', weightPercent: 2.65 },
        { symbol: 'META', name: 'META PLATFORMS INC', weightPercent: 1.92 },
        { symbol: 'JPM', name: 'JPMORGAN CHASE & CO', weightPercent: 1.48 },
        { symbol: 'BRK/B', name: 'BERKSHIRE HATHAWAY INC-CL B', weightPercent: 1.47 },
        { symbol: 'MU', name: 'MICRON TECHNOLOGY INC', weightPercent: 1.46 },
        { symbol: 'LLY', name: 'ELI LILLY & CO', weightPercent: 1.43 },
        { symbol: 'TSLA', name: 'TESLA INC', weightPercent: 1.38 },
        { symbol: 'AMD', name: 'ADVANCED MICRO DEVICES', weightPercent: 1.22 },
        { symbol: 'XOM', name: 'EXXONMOBIL HOLDINGS CORP', weightPercent: 1.01 },
        { symbol: 'JNJ', name: 'JOHNSON & JOHNSON', weightPercent: 0.97 },
        { symbol: 'V', name: 'VISA INC-CLASS A SHARES', weightPercent: 0.95 },
        { symbol: 'WMT', name: 'WALMART INC', weightPercent: 0.77 },
        { symbol: 'MA', name: 'MASTERCARD INC - A', weightPercent: 0.72 },
        { symbol: 'CSCO', name: 'CISCO SYSTEMS INC', weightPercent: 0.72 }
      ],
      coveredWeightPercent: 48.7,
      asOfDate: '2026-07-31',
      sourceLabel: '글로벌 X 공식 전체 보유 종목 파일(xyld_full-holdings_20260731.csv)',
      sourceUrl: 'https://www.globalxetfs.com/funds/xyld/',
      excludedNote:
        '주식 보유분만 담았습니다. 같은 파일에 함께 실린 숏 S&P 500 콜옵션(-1.29%)·현금(0.13%)은 주식이 아니어서 제외했습니다.'
    },
    asOfNote:
      '추종지수·총보수(0.60%)·상장일(2013년 6월 21일)·보유종목수(505종)·월 분배는 글로벌 X 공식 상품 페이지(globalxetfs.com, 2026-08-02 조회)로 확인한 사실입니다. 보유종목수는 S&P 500 구성 변경에 따라 달라지는 값이라 근사치로 보아야 합니다. 상위 섹터는 S&P 500 구성을 그대로 따라가 이 페이지에서는 다루지 않았습니다. 대표 보유 종목과 비중은 글로벌 X 공식 전체 보유 종목 파일(2026년 7월 31일 기준)에서 옮긴 값이며, S&P 500 구성 변경과 일간 시세에 따라 계속 달라집니다. 분배율·배당성장률(음수 가정)·기대수익률 등 계산에 쓰이는 값은 이 페이지가 아니라 시뮬레이터 계산 프리셋을 그대로 따릅니다.'
  },
  relatedTickers: [
    { ticker: 'QYLD', relationLabel: '나스닥 100 기초의 더 높은 분배를 원한다면' },
    { ticker: 'JEPI', relationLabel: '액티브 운용의 절충형 옵션인컴을 원한다면' },
    { ticker: 'DIVO', relationLabel: '배당주 위에 선별적으로 옵션을 쓰는 구조를 원한다면' },
    { ticker: 'VYM', relationLabel: '옵션 없이 순수 고배당으로 가고 싶다면' }
  ],
  // 글로벌 X 커버드콜 계열 변주 — 딥 올리브브라운 → 머스터드. QYLD(라임)와 같은 계열 내 구분. 장식 전용.
  accent: {
    from: '#3d3a17',
    to: '#b0a53c',
    textLight: '#5c5620',
    textDark: '#d6cc72'
  },
  disclaimer:
    '이 페이지는 정보 제공을 목적으로 하며 투자 자문이 아닙니다. 분배율·주가·운용보수·세금 등은 시장 상황과 정책에 따라 변동될 수 있고, 옵션 프리미엄 비중이 큰 분배금은 특히 변동성이 클 수 있습니다. 과거 성과가 미래 수익을 보장하지 않으며, 원금 손실이 발생할 수 있습니다. 투자 판단과 그 결과에 대한 책임은 투자자 본인에게 있습니다.',
  contentUpdatedAt: '2026-08-02'
};
