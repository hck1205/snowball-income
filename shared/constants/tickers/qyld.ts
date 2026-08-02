import type { TickerContent } from './TickerContent.types';

/**
 * QYLD(글로벌 X 나스닥 100 커버드콜 ETF) SEO 랜딩 콘텐츠 — `schd.ts` 템플릿을 따르되,
 * `jepi.ts`·`jepq.ts`와 같이 배당성장 서사가 아니라 "높은 월 분배 vs 상단 제한·원금 잠식"
 * 트레이드오프를 정직하게 다룬다.
 *
 * 숫자 출처:
 * - 계산 6필드는 `shared/constants/presets`(`OPTION_INCOME_ETFS.QYLD`)에서 그대로 온다.
 *   ⚠ 이 프리셋의 기대 총수익률(7%)이 분배율보다 낮아, 파생되는 `dividendGrowth`가 **음수**로
 *   렌더된다. 이는 버그가 아니라 "분배의 일부가 주가에서 나온다"는 모델의 정직한 표현이며,
 *   이 페이지의 핵심 메시지이기도 하다 — 본문이 그 의미를 그대로 설명한다.
 * - `reference`의 정적 사실(추종지수, 총보수 0.60%, 상장일 2013-12-11, 보유종목수 104종, 월 분배)은
 *   글로벌 X 공식 상품 페이지(globalxetfs.com/funds/qyld, 2026-08-02 조회)로 확인.
 *   같은 페이지에서 "나스닥 100 지수 구성 종목을 매수하고 같은 지수에 대한 콜옵션을 매도한다",
 *   "커버드콜 매도는 기초자산의 상승 잠재력을 제한할 수 있다", "12년 연속 월 분배"도 함께 확인했다.
 * - 옵션 행사가격이 기초지수 대비 어느 정도인지는 조회 시점(2026-07-31) 포지션 한 건으로만 확인돼
 *   `reference` 필드로 구조화하지 않고 본문에도 특정 수치를 적지 않았다.
 * - `topSectors`는 나스닥 100 구성을 그대로 따라가 개별 값을 확인·고정할 실익이 없어 비웠다.
 * - `topHoldings`는 글로벌 X 공식 전체 보유 종목 파일(qyld_full-holdings_20260731.csv, 2026-08-02 내려받음)의
 *   주식 라인 상위 20종이다. 같은 파일에 함께 실린 **숏 나스닥 100 콜옵션(-1.74%)·현금(0.10%)·
 *   기타 채권채무(-0.04%)는 주식이 아니라 제외**했다 — 옵션 라인을 주식과 한 차트에 섞으면
 *   "이 ETF가 옵션이라는 종목을 담고 있다"는 오해를 만든다(`excludedNote`가 그 사실을 데이터로 말한다).
 */
export const QYLD_TICKER_CONTENT: TickerContent = {
  ticker: 'QYLD',
  slug: 'qyld',
  categoryIds: ['covered-call'],
  metaTitle: 'QYLD 분배율·커버드콜 구조·운용보수 총정리 — 글로벌 X 나스닥 100 커버드콜 ETF',
  metaDescription:
    'QYLD(글로벌 X 나스닥 100 커버드콜 ETF)의 분배율·커버드콜 전략·운용보수와 상승 여력 제한·원금 변동을 정리했습니다. 높은 월 분배의 대가가 무엇인지 확인하고 싶다면 여기서 확인하세요.',
  heroTagline: '나스닥 100의 상승 여력을 팔아 매월 현금으로 바꾸는, 분배율이 가장 눈에 띄는 ETF',
  sections: [
    {
      id: 'overview',
      navLabel: '개요',
      heading: 'QYLD, 무엇을 하는 ETF인가',
      paragraphs: [
        'QYLD(글로벌 X 나스닥 100 커버드콜 ETF, {{englishName}})는 Cboe 나스닥-100 바이라이트 V2 지수(Cboe Nasdaq-100 BuyWrite V2 Index)를 추종합니다. 하는 일은 단순합니다 — 나스닥 100 지수 구성 종목을 사서 보유하고, 같은 지수에 대한 콜옵션을 팔아 그 프리미엄을 받습니다.',
        '콜옵션을 판다는 것은 "지수가 어느 선 위로 오르면 그 위의 상승분은 옵션을 산 쪽이 가져간다"는 계약을 맺고 대가를 먼저 받는 것입니다. 그래서 이 상품은 상승장에서 나스닥 100 자체보다 뒤처지고, 대신 옆걸음이나 완만한 하락 구간에서는 프리미엄만큼의 완충을 얻습니다.',
        '{{koreanName}}는 2013년 12월 상장했고, 이 시뮬레이터가 참조하는 계산 프리셋은 분배율 {{dividendYield}}, 연 배당성장률(가정) {{dividendGrowth}}, {{frequencyLabel}} 지급을 기준으로 합니다. 성장률 가정이 음수라는 점 자체가 이 상품을 읽는 열쇠입니다 — 다음 섹션에서 그 뜻을 설명합니다.'
      ],
      stat: {
        label: '추종 지수',
        value: 'Cboe 나스닥-100 바이라이트 V2 지수',
        caption: '나스닥 100 보유 + 같은 지수 콜옵션 매도 — 조회 시점 104종 보유'
      }
    },
    {
      id: 'dividend-yield',
      navLabel: '분배율',
      heading: '분배율 {{dividendYield}}, 배당이 아니라 옵션 프리미엄',
      paragraphs: [
        'QYLD의 분배율은 {{dividendYield}} 안팎으로, 이 시뮬레이터가 다루는 어떤 배당 ETF보다도 높습니다. 다만 이 숫자의 성격이 전혀 다릅니다 — 기업이 이익을 나눠주는 배당이 아니라, 대부분이 콜옵션을 팔아 받은 프리미엄에서 나옵니다.',
        '옵션 프리미엄은 시장 변동성이 클수록 커집니다. 그래서 이 분배율은 시장이 불안할수록 높아지고 잔잔할수록 낮아지는 경향이 있으며, 배당성장 ETF의 배당률처럼 완만하게 움직이지 않습니다. 매월 분배금 자체가 달마다 다릅니다.',
        '무엇보다 분배율이 높다는 사실만으로 총수익이 높다고 볼 수는 없습니다. 분배는 총수익의 배분 방식이지 총수익 자체가 아니며, 상승분을 옵션 매수자에게 넘긴 만큼 주가 쪽에서 잃는 부분이 있습니다. 내 조건에서의 실제 현금흐름은 시뮬레이터에서 직접 계산해 보세요.'
      ],
      stat: {
        label: '분배율(세전, 명목)',
        value: '{{dividendYield}}',
        caption: '시뮬레이터 계산 프리셋 기준 — 옵션 프리미엄 비중이 커 변동성에 따라 크게 달라집니다'
      }
    },
    {
      id: 'dividend-growth',
      navLabel: '분배 구조',
      heading: '배당성장률 가정이 음수라는 것의 뜻',
      paragraphs: [
        '이 시뮬레이터는 기대 총수익률에서 분배율을 뺀 값을 연 배당성장률(가정)로 씁니다. QYLD는 분배율 {{dividendYield}}가 기대 총수익률 {{expectedTotalReturn}}보다 높기 때문에, 이 가정치가 {{dividendGrowth}}로 음수가 됩니다.',
        '음수가 뜻하는 바는 분명합니다 — 매월 받는 분배금의 일부가 주가(순자산가치)에서 나온다고 보는 모델입니다. 실제로 이 유형의 상품은 상승장에서 오른 만큼 따라 오르지 못하는 반면 하락은 그대로 받으므로, 오랜 기간을 놓고 보면 기준가격이 낮아지는 흐름이 나타날 수 있습니다.',
        '그래서 이 상품에서 재투자는 배당성장 ETF와 의미가 다릅니다. 늘어나는 것은 주당 분배금이 아니라 보유 수량 쪽에 가깝고, 기준가격이 내려가면 같은 수량이 만드는 금액도 함께 줄어듭니다. 시뮬레이터에서 이 가정을 바꿔 볼 수 있으니, 낙관·비관 시나리오를 각각 넣어 비교해 보세요.'
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
      heading: '총보수 0.60% — 이 시뮬레이터에서 가장 높은 축',
      paragraphs: [
        'QYLD의 총보수는 0.60%입니다. 이 시뮬레이터가 다루는 배당 ETF 가운데 가장 높은 축으로, SCHD(0.06%)의 열 배이고 같은 옵션인컴 계열인 JEPI·JEPQ(각 0.35%)보다도 높습니다.',
        '보수는 매년 조용히 수익률에서 빠져나갑니다. 분배율이 두 자릿수라 0.60%가 작아 보일 수 있지만, 분배는 총수익의 배분일 뿐이므로 보수는 분배가 아니라 총수익에서 차감된다고 보는 편이 정확합니다.',
        '매월 옵션 포지션을 새로 구성하고 지수를 복제해야 하는 운용 방식이 비용의 배경입니다. 같은 커버드콜 계열 안에서도 상품마다 보수가 크게 다르므로, 전략만 보지 말고 비용도 함께 비교하는 편이 낫습니다.'
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
      heading: '종목을 고르지 않는다 — 나스닥 100을 그대로 담는다',
      paragraphs: [
        'QYLD는 배당주를 선별하지 않습니다. 나스닥 100 지수의 구성 종목을 그대로 보유하므로, 담기는 기업은 배당 이력이 아니라 나스닥 시장의 시가총액과 상장 기준으로 정해집니다. 조회 시점 기준 보유는 104종입니다.',
        '기초 종목 상당수는 배당을 거의 주지 않거나 아예 주지 않는 기술 기업입니다. 그러니 이 상품의 두 자릿수 분배율은 기초 종목의 배당에서 오는 것이 거의 아니며, 옵션 매도 프리미엄이 사실상 전부라고 보아야 합니다.',
        '옵션은 개별 종목이 아니라 지수 전체를 대상으로 하고, 만기가 짧아 주기적으로 새로 설정됩니다. 조회 시점(2026년 7월 31일) 공시 기준으로 매도한 콜옵션의 명목 규모가 펀드 순자산과 비슷한 수준이었는데, 그만큼 상승 구간에서 상단이 제한되는 폭도 크다는 뜻입니다.'
      ]
    },
    {
      id: 'who-and-tradeoffs',
      navLabel: '적합성·트레이드오프',
      heading: '무엇을 얻고, 무엇을 내주는가',
      paragraphs: [
        'QYLD는 이런 투자자에게 잘 맞습니다. 매월 들어오는 현금 자체가 목적인 사람, 주가 상승보다 지금의 분배 규모를 우선하는 사람, 나스닥 100의 변동성을 현금흐름으로 바꾸는 구조를 이해하고 받아들이는 사람입니다.',
        '내주는 것도 분명합니다. 첫째, 강한 상승장에서는 나스닥 100 자체에 크게 뒤처집니다 — 오른 만큼 따라가지 못하는 것이 설계입니다. 둘째, 하락은 대체로 그대로 받습니다. 프리미엄이 완충이 되기는 하지만 하락을 막아 주지는 않습니다. 셋째, 이 두 성질이 겹쳐 오랜 기간 기준가격이 낮아지는 흐름이 나타날 수 있고, 그 경우 분배금 자체도 함께 줄어듭니다. 넷째, 총보수 0.60%는 이 페이지에서 가장 높은 축입니다.',
        'QYLD는 배당을 불려 가는 상품이 아니라 지금의 변동성을 현금으로 바꾸는 상품입니다. 같은 구조를 S&P 500에 적용한 것을 원하면 XYLD, 배당주를 고른 뒤 일부에만 옵션을 쓰는 절충형을 원하면 JEPI·DIVO, 배당성장 여력을 남기고 싶으면 SCHD와 함께 비교해 보세요.'
      ]
    }
  ],
  faqs: [
    {
      question: 'QYLD 분배율은 얼마인가요?',
      answer:
        '이 시뮬레이터가 쓰는 계산 프리셋 기준 QYLD의 명목 분배율(세전)은 {{dividendYield}}입니다. 대부분이 옵션 프리미엄에서 나와 시장 변동성에 따라 크게 달라지며, 매월 분배금 금액도 달마다 다릅니다. 내 조건에서의 실제 현금흐름은 시뮬레이터에서 직접 계산해 보세요.'
    },
    {
      question: 'QYLD 배당은 얼마나 자주 지급되나요?',
      answer:
        'QYLD는 {{frequencyLabel}} 지급됩니다. 글로벌 X 공식 상품 페이지 기준으로 12년 연속 월 분배를 이어 오고 있으나, 매월 금액은 옵션 프리미엄 규모에 따라 달라집니다.'
    },
    {
      question: 'QYLD는 왜 배당성장률 가정이 음수인가요?',
      answer:
        '이 시뮬레이터는 기대 총수익률에서 분배율을 뺀 값을 배당성장률 가정으로 씁니다. QYLD는 분배율이 기대 총수익률보다 높아 그 차이가 음수가 되며, 이는 분배금의 일부가 주가(순자산가치)에서 나온다고 보는 모델입니다.'
    },
    {
      question: 'QYLD 운용보수(총보수)는 얼마인가요?',
      answer:
        '0.60%입니다(글로벌 X 공식 상품 페이지, 2026-08-02 확인). 이 시뮬레이터가 다루는 배당 ETF 가운데 가장 높은 축이며, JEPI·JEPQ(각 0.35%)보다도 높습니다.'
    },
    {
      question: 'QYLD는 나스닥 100(QQQ)과 무엇이 다른가요?',
      answer:
        '보유 종목은 사실상 같지만 QYLD는 그 위에 콜옵션 매도를 얹습니다. 그래서 상승장에서는 상승분 상당 부분을 옵션 매수자에게 넘겨 QQQ에 뒤처지고, 대신 매월 분배금을 받습니다. 하락은 대체로 그대로 반영됩니다.'
    },
    {
      question: 'QYLD는 원금 손실 위험이 있나요?',
      answer:
        '있습니다. 분배율이 높다고 원금이 보장되지 않으며, 시장 하락기에는 기준가격이 함께 내려갑니다. 상승은 제한되고 하락은 반영되는 구조라 오랜 기간 기준가격이 낮아지는 흐름이 나타날 수 있습니다.'
    },
    {
      question: 'QYLD와 XYLD는 무엇이 다른가요?',
      answer:
        '전략은 같고 기초 지수만 다릅니다. QYLD는 나스닥 100, XYLD는 S&P 500을 기초로 커버드콜을 씁니다. 나스닥 100 쪽이 변동성이 커 프리미엄과 분배율이 대체로 더 높게 나타나는 대신, 상승장에서 포기하는 폭도 더 큽니다. 총보수는 둘 다 0.60%입니다.'
    },
    {
      question: 'QYLD 분배금에 붙는 세금은 어떻게 계산하나요?',
      answer:
        '배당소득세는 거주 국가와 계좌 종류에 따라 달라지고, 분배금의 구성(배당·옵션프리미엄·자본환급)에 따라 세무 처리가 달라질 수 있어 이 페이지가 대신 알려드릴 수 없습니다. 이 시뮬레이터에서는 세율을 직접 입력해 세후 분배금을 계산해 볼 수 있습니다.'
    }
  ],
  reference: {
    trackedIndex: 'Cboe 나스닥-100 바이라이트 V2 지수(Cboe Nasdaq-100 BuyWrite V2 Index)',
    inceptionYear: 2013,
    expenseRatioPercent: 0.6,
    holdingsCountApprox: 104,
    paymentMonthsNote: '매월 지급(월배당) — 매월 옵션 프리미엄 규모에 따라 금액이 달라집니다',
    topHoldings: {
      holdings: [
        { symbol: 'NVDA', name: 'NVIDIA CORP', weightPercent: 8.2 },
        { symbol: 'AAPL', name: 'APPLE INC', weightPercent: 7.65 },
        { symbol: 'MSFT', name: 'MICROSOFT CORP', weightPercent: 5.82 },
        { symbol: 'AMZN', name: 'AMAZON.COM INC', weightPercent: 4.93 },
        { symbol: 'MU', name: 'MICRON TECHNOLOGY INC', weightPercent: 4.32 },
        { symbol: 'AMD', name: 'ADVANCED MICRO DEVICES', weightPercent: 3.62 },
        { symbol: 'GOOGL', name: 'ALPHABET INC-CL A', weightPercent: 3.5 },
        { symbol: 'GOOG', name: 'ALPHABET INC-CL C', weightPercent: 3.28 },
        { symbol: 'AVGO', name: 'BROADCOM INC', weightPercent: 3.11 },
        { symbol: 'META', name: 'META PLATFORMS INC', weightPercent: 2.78 },
        { symbol: 'TSLA', name: 'TESLA INC', weightPercent: 2.62 },
        { symbol: 'WMT', name: 'WALMART INC', weightPercent: 2.53 },
        { symbol: 'CSCO', name: 'CISCO SYSTEMS INC', weightPercent: 2.13 },
        { symbol: 'INTC', name: 'INTEL CORP', weightPercent: 2.11 },
        { symbol: 'COST', name: 'COSTCO WHOLESALE CORP', weightPercent: 1.97 },
        { symbol: 'AMAT', name: 'APPLIED MATERIALS INC', weightPercent: 1.88 },
        { symbol: 'LRCX', name: 'LAM RESEARCH CORP', weightPercent: 1.71 },
        { symbol: 'NFLX', name: 'NETFLIX INC', weightPercent: 1.41 },
        { symbol: 'PLTR', name: 'PALANTIR TECHNOLOGIES INC-A', weightPercent: 1.32 },
        { symbol: 'PANW', name: 'PALO ALTO NETWORKS INC', weightPercent: 1.26 }
      ],
      coveredWeightPercent: 66.15,
      asOfDate: '2026-07-31',
      sourceLabel: '글로벌 X 공식 전체 보유 종목 파일(qyld_full-holdings_20260731.csv)',
      sourceUrl: 'https://www.globalxetfs.com/funds/qyld/',
      excludedNote:
        '주식 보유분만 담았습니다. 같은 파일에 함께 실린 숏 나스닥 100 콜옵션(-1.74%)·현금(0.10%)·기타 채권채무(-0.04%)는 주식이 아니어서 제외했습니다.'
    },
    asOfNote:
      '추종지수·총보수(0.60%)·상장일(2013년 12월 11일)·보유종목수(104종)·월 분배·전략 설명(나스닥 100 구성 종목 보유 + 같은 지수 콜옵션 매도, 커버드콜 매도가 상승 잠재력을 제한할 수 있음, 12년 연속 월 분배)은 글로벌 X 공식 상품 페이지(globalxetfs.com, 2026-08-02 조회)로 확인한 사실입니다. 옵션 행사가격이 기초지수 대비 어느 정도인지는 조회 시점(2026년 7월 31일) 포지션 한 건으로만 확인돼 이 페이지에서는 수치로 다루지 않았습니다. 상위 섹터는 나스닥 100 구성을 그대로 따라가 별도로 다루지 않았습니다. 대표 보유 종목과 비중은 글로벌 X 공식 전체 보유 종목 파일(2026년 7월 31일 기준)에서 옮긴 값이며, 나스닥 100 구성 변경과 일간 시세에 따라 계속 달라집니다. 분배율·배당성장률(음수 가정)·기대수익률 등 계산에 쓰이는 값은 이 페이지가 아니라 시뮬레이터 계산 프리셋을 그대로 따릅니다.'
  },
  relatedTickers: [
    { ticker: 'XYLD', relationLabel: 'S&P 500 기초의 같은 구조를 원한다면' },
    { ticker: 'JEPQ', relationLabel: '나스닥 기반의 액티브 옵션인컴을 원한다면' },
    { ticker: 'DIVO', relationLabel: '배당주 위에 선별적으로 옵션을 쓰는 절충형을 원한다면' },
    { ticker: 'SCHD', relationLabel: '배당성장 여력을 남겨두고 싶다면' }
  ],
  // 글로벌 X 커버드콜 계열 정체성 — 딥 올리브 → 라임. JEPI/JEPQ(브론즈)와 구분되는 계열. 장식 전용.
  accent: {
    from: '#2e3d1f',
    to: '#8fbf4a',
    textLight: '#40571f',
    textDark: '#b6dd7d'
  },
  disclaimer:
    '이 페이지는 정보 제공을 목적으로 하며 투자 자문이 아닙니다. 분배율·주가·운용보수·세금 등은 시장 상황과 정책에 따라 변동될 수 있고, 옵션 프리미엄 비중이 큰 분배금은 특히 변동성이 클 수 있습니다. 과거 성과가 미래 수익을 보장하지 않으며, 원금 손실이 발생할 수 있습니다. 투자 판단과 그 결과에 대한 책임은 투자자 본인에게 있습니다.',
  contentUpdatedAt: '2026-08-02'
};
