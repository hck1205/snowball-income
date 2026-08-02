import type { TickerContent } from './TickerContent.types';

/**
 * SDY(SPDR S&P 배당 ETF) SEO 랜딩 콘텐츠 — `schd.ts` 템플릿을 그대로 따른다.
 *
 * 숫자 출처:
 * - 계산 6필드는 `shared/constants/presets`(`US_HIGH_DIVIDEND_ETFS.SDY`)에서 그대로 온다.
 * - `reference`의 정적 사실(추종지수, 총보수 0.35%, 상장일 2005-11-08, 보유종목수 155종, 분기 지급,
 *   "20년 이상 연속 증배 + 배당수익률 가중" 지수 규칙)은 스테이트스트리트(SSGA) 공식 상품 페이지
 *   (ssga.com/us/en/intermediary/etfs/spdr-sp-dividend-etf-sdy, 2026-08-02 조회)로 확인.
 * - 지급월(3·6·9·12월)은 `shared/constants/marketData` 스냅샷의 `payoutMonths`가 **실지급월(`pay`)**
 *   로 기록된 값이다(2026-07-29 기준). 추정('ex')이 아니라 실측이라 그대로 적었다.
 * - 보유종목수(155종)는 조회 시점 값이라 연 1회 재편·분기 리밸런싱에 따라 달라진다.
 * - `topSectors`는 배당수익률 가중이라 비중 순서가 자주 바뀌어 **의도적으로 비웠다**.
 * - `topHoldings`는 SSGA 공식 일일 보유 종목 파일(holdings-daily-us-en-sdy.xlsx, 2026-08-02 내려받음,
 *   기준일 2026-07-30)의 상위 20종이다. 배당수익률 가중이라 최상위도 2%대에 머문다 — 이 낮은 집중도
 *   자체가 이 ETF의 성질이라 목록으로 보여줄 값이 있다고 판단했다.
 * - `relatedTickers`의 DVY는 이 레포에 아직 콘텐츠 페이지가 없다 — 링크가 아니라 텍스트로만 남는 것이
 *   의도된 동작이다(`server/handlers/TickerHtml`의 게이팅).
 */
export const SDY_TICKER_CONTENT: TickerContent = {
  ticker: 'SDY',
  slug: 'sdy',
  categoryIds: ['dividend-growth', 'high-dividend'],
  metaTitle: 'SDY 배당률·20년 증배 기준·운용보수 총정리 — SPDR S&P 배당 ETF',
  metaDescription:
    'SDY(SPDR S&P 배당 ETF)의 배당률·운용보수·20년 연속 증배 편입 기준과 배당수익률 가중 방식을 정리했습니다. 증배 이력과 현재 배당률을 함께 보고 싶다면 여기서 확인하세요.',
  heroTagline: '20년 이상 배당을 늘려 온 기업만 고른 뒤, 배당률이 높은 순으로 더 크게 담는 ETF',
  sections: [
    {
      id: 'overview',
      navLabel: '개요',
      heading: 'SDY, 무엇을 추종하는 ETF인가',
      paragraphs: [
        'SDY(SPDR S&P 배당 ETF, {{englishName}})는 S&P 고배당 배당귀족 지수(S&P High Yield Dividend Aristocrats Index)를 추종하는 패시브 ETF입니다. 이 지수는 최소 20년 연속으로 매년 배당을 늘려 온 기업을 골라내고, 그 안에서 배당수익률이 높은 종목에 더 큰 비중을 둡니다.',
        'NOBL이 참조하는 배당귀족 지수가 S&P 500(대형주) 안에서만 25년 문턱을 적용하는 것과 달리, SDY의 모집단은 대형·중형·소형을 아우르는 더 넓은 미국 주식 지수입니다. 그래서 대형주 일색이 아니라 중형주·소형주까지 섞이고, 종목 수도 더 많습니다.',
        '{{koreanName}}는 2005년 11월 상장했고, 이 시뮬레이터가 참조하는 계산 프리셋은 배당률 {{dividendYield}}, 연 배당성장률(가정) {{dividendGrowth}}, {{frequencyLabel}} 지급을 기준으로 합니다.'
      ],
      stat: {
        label: '추종 지수',
        value: 'S&P 고배당 배당귀족 지수',
        caption: '20년 이상 연속 증배 + 배당수익률 가중 — 조회 시점 155종'
      }
    },
    {
      id: 'dividend-yield',
      navLabel: '배당률',
      heading: '배당률 {{dividendYield}}, 가중 방식이 만드는 차이',
      paragraphs: [
        'SDY의 배당률은 {{dividendYield}} 안팎입니다. 편입 조건은 증배 이력이지만, 편입된 뒤의 비중은 배당수익률로 정해집니다 — 배당률이 높은 종목이 자동으로 더 큰 자리를 차지한다는 뜻입니다.',
        '이 방식은 같은 증배 계열인 NOBL(동일가중)이나 SCHD(시가총액 기반)와 결과를 다르게 만듭니다. 배당률이 높다는 것은 주가가 상대적으로 눌려 있다는 신호이기도 해서, 배당수익률 가중은 값이 싸진 종목의 비중을 늘리는 쪽으로 작동하는 경향이 있습니다. 그 판단이 항상 맞는 것은 아니라는 점도 함께 알아 두는 편이 정확합니다.',
        '배당률은 주가와 함께 매일 움직이는 값이라, 이 페이지가 보여주는 숫자는 작성 시점 기준입니다. 내 조건에서 이 배당률이 어떤 현금흐름으로 이어지는지는 시뮬레이터에서 직접 계산해 보세요.'
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
      heading: '20년 문턱과, 재투자가 만드는 복리',
      paragraphs: [
        '이 시뮬레이터의 계산 프리셋은 SDY의 연 배당성장률(가정)을 {{dividendGrowth}}로 두고, 기대 총수익률을 {{expectedTotalReturn}}로 봅니다. 배당을 재투자하면 이듬해 배당은 늘어난 주당 배당금과 늘어난 보유 수량이 함께 곱해져 계산되므로, 재투자 기간이 길수록 배당 총액이 커지는 속도가 빨라집니다.',
        '20년이라는 문턱은 25년보다 낮지만, 모집단이 대형주로 한정되지 않아 성숙한 대기업과 함께 꾸준히 배당을 늘려 온 중형·소형 기업이 들어옵니다. 규모가 작은 기업이 섞이면 배당 인상 여력이 큰 대신 실적 변동성도 커진다는 점이 함께 따라옵니다.',
        '이 성장률은 과거의 반복이 아니라 향후 흐름에 대한 가정입니다. 20년 연속 증배 이력이 21년째를 보장하지는 않고, 배당을 동결하거나 줄여 지수에서 빠지는 기업도 매년 나옵니다.'
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
      heading: '총보수 0.35%가 장기에 남기는 차이',
      paragraphs: [
        'SDY의 총보수는 0.35%입니다. 같은 미국 배당 계열에서 SCHD(0.06%)·VYM(0.04%)·SPYD(0.07%)와 비교하면 여러 배 높은 수준이고, 규칙이 비슷한 NOBL(0.35%)과는 같습니다.',
        '보수는 매년 조용히 수익률에서 빠져나갑니다. 100만 원 기준으로 연 3,500원 수준이지만, 배당을 재투자하며 수십 년을 운용하면 그만큼 재투자되는 원금이 매년 줄어드는 것과 같은 효과가 누적됩니다.',
        '보수가 높다고 나쁜 상품이라는 뜻은 아닙니다. 20년 증배 이력 + 배당수익률 가중이라는 조합은 대형 저보수 ETF가 제공하지 않는 구성이므로, 그 조합이 나에게 필요한지를 비용과 함께 저울질하는 편이 낫습니다.'
      ],
      stat: {
        label: '운용보수(총보수)',
        value: '0.35%',
        caption: 'SSGA 공식 상품 페이지 기준(2026-08-02 확인)'
      }
    },
    {
      id: 'selection-criteria',
      navLabel: '구성 기준',
      heading: '넓은 모집단 + 배당률 가중, 그리고 그 한계',
      paragraphs: [
        'SDY의 편입 절차는 두 단계입니다. 먼저 미국 주식 지수 구성 종목 가운데 20년 이상 매년 배당을 늘려 온 기업만 남기고, 그다음 남은 종목을 배당수익률 기준으로 가중합니다. 조회 시점 기준 155종으로, NOBL(69종)보다 두 배 이상 많습니다.',
        '종목 수가 많다는 것은 한 기업의 배당 삭감이 전체에 미치는 충격이 작다는 뜻입니다. 동시에 배당률 가중이라 배당률이 높은 소수 종목·소수 섹터에 비중이 몰릴 수 있어, 종목 수가 곧 분산이라고 단정하기는 어렵습니다.',
        '지수는 정해진 주기로 자격을 다시 심사하고 비중을 조정합니다. 그 과정에서 배당을 동결한 기업이 빠지고 새로 20년을 채운 기업이 들어오므로, 구성은 시간이 지나며 조금씩 바뀝니다.'
      ]
    },
    {
      id: 'who-and-tradeoffs',
      navLabel: '적합성·트레이드오프',
      heading: '어떤 투자자에게 맞고, 무엇을 포기하는가',
      paragraphs: [
        'SDY는 이런 투자자에게 잘 맞습니다. 증배 이력이라는 자격 요건은 지키되 지금의 배당률도 어느 정도 챙기고 싶은 사람, 대형주에만 한정되지 않은 배당 종목군을 원하는 사람, 종목 수가 많은 쪽을 선호하는 사람입니다.',
        '트레이드오프도 분명합니다. 첫째, 총보수 0.35%는 대형 저보수 배당 ETF의 여러 배입니다. 둘째, 배당수익률 가중은 배당률이 높아진 종목의 비중을 늘리는 쪽으로 작동해, 그 종목이 배당을 줄이면 손실이 상대적으로 크게 반영될 수 있습니다. 셋째, 중형·소형주가 섞여 있어 시장 하락기의 변동성이 대형주 전용 지수보다 클 수 있습니다.',
        '결국 SDY는 "오래 늘려 왔고, 지금도 어느 정도 준다"는 두 조건을 한 상품에서 절충한 선택지입니다. 이력의 길이를 더 중시하면 NOBL, 보수와 재무 스크리닝을 중시하면 SCHD, 지금의 배당률을 더 중시하면 VYM·DVY와 함께 비교해 보세요.'
      ]
    }
  ],
  faqs: [
    {
      question: 'SDY 배당률은 얼마인가요?',
      answer:
        '이 시뮬레이터가 쓰는 계산 프리셋 기준 SDY의 명목 배당률(세전)은 {{dividendYield}}입니다. 배당수익률로 비중을 두는 지수라 순수 증배 지수보다 배당률이 높게 나오는 편이며, 주가가 움직이면 이 숫자도 함께 달라집니다. 내 조건에서의 실제 현금흐름은 시뮬레이터에서 직접 계산해 보세요.'
    },
    {
      question: 'SDY 배당은 얼마나 자주 지급되나요?',
      answer:
        'SDY는 {{frequencyLabel}} 지급되며, 최근 스냅샷 기준 3월·6월·9월·12월에 지급이 이뤄졌습니다. 정확한 날짜는 매 분기 공지에 따라 달라질 수 있습니다.'
    },
    {
      question: 'SDY와 NOBL은 무엇이 다른가요?',
      answer:
        '증배 문턱이 SDY는 20년, NOBL은 25년입니다. 모집단도 달라서 SDY는 대형·중형·소형을 아우르고 NOBL은 S&P 500 안에서만 고릅니다. 가중 방식은 SDY가 배당수익률 가중, NOBL이 동일가중입니다. 총보수는 둘 다 0.35%입니다.'
    },
    {
      question: 'SDY 운용보수(총보수)는 얼마인가요?',
      answer: '0.35%입니다(SSGA 공식 상품 페이지, 2026-08-02 확인). 대형 저보수 배당 ETF보다 여러 배 높은 수준입니다.'
    },
    {
      question: 'SDY는 몇 종목을 담고 있나요?',
      answer:
        '조회 시점 기준 155종입니다. 지수가 정해진 주기로 자격을 다시 심사하므로 종목 수는 재편마다 달라집니다.'
    },
    {
      question: '배당수익률 가중이 왜 중요한가요?',
      answer:
        '편입된 종목 중 배당률이 높은 쪽에 더 큰 비중이 가기 때문입니다. 값이 눌린 종목의 비중을 늘리는 방향으로 작동하는 반면, 그 종목이 배당을 줄이면 영향이 상대적으로 크게 나타날 수 있습니다.'
    },
    {
      question: 'SDY는 고배당 ETF인가요?',
      answer:
        '고배당만을 목표로 하는 상품은 아닙니다. 20년 연속 증배라는 자격을 먼저 통과해야 하고, 그 안에서 배당률로 비중을 두는 구조라 순수 고배당 ETF와 순수 증배 ETF의 중간에 가깝습니다.'
    },
    {
      question: 'SDY 배당에 붙는 세금은 어떻게 계산하나요?',
      answer:
        '배당소득세는 거주 국가와 계좌 종류에 따라 달라지며 이 페이지가 대신 알려드릴 수 없습니다. 이 시뮬레이터에서는 세율을 직접 입력해 세후 배당을 계산해 볼 수 있습니다.'
    }
  ],
  reference: {
    trackedIndex: 'S&P 고배당 배당귀족 지수(S&P High Yield Dividend Aristocrats Index)',
    inceptionYear: 2005,
    expenseRatioPercent: 0.35,
    holdingsCountApprox: 155,
    paymentMonthsNote: '3월·6월·9월·12월, 연 4회 분기 지급',
    topHoldings: {
      holdings: [
        { symbol: 'VZ', name: 'VERIZON COMMUNICATIONS INC', weightPercent: 2.29 },
        { symbol: 'O', name: 'REALTY INCOME CORP', weightPercent: 2.17 },
        { symbol: 'ADP', name: 'AUTOMATIC DATA PROCESSING', weightPercent: 1.78 },
        { symbol: 'KVUE', name: 'KENVUE INC', weightPercent: 1.74 },
        { symbol: 'KMB', name: 'KIMBERLY CLARK CORP', weightPercent: 1.72 },
        { symbol: 'TGT', name: 'TARGET CORP', weightPercent: 1.68 },
        { symbol: 'ABBV', name: 'ABBVIE INC', weightPercent: 1.63 },
        { symbol: 'EIX', name: 'EDISON INTERNATIONAL', weightPercent: 1.5 },
        { symbol: 'CVX', name: 'CHEVRON CORP', weightPercent: 1.45 },
        { symbol: 'TXN', name: 'TEXAS INSTRUMENTS INC', weightPercent: 1.42 },
        { symbol: 'SYY', name: 'SYSCO CORP', weightPercent: 1.4 },
        { symbol: 'MDT', name: 'MEDTRONIC PLC', weightPercent: 1.4 },
        { symbol: 'ES', name: 'EVERSOURCE ENERGY', weightPercent: 1.36 },
        { symbol: 'PEP', name: 'PEPSICO INC', weightPercent: 1.35 },
        { symbol: 'ADM', name: 'ARCHER DANIELS MIDLAND CO', weightPercent: 1.35 },
        { symbol: 'KO', name: 'COCA COLA CO/THE', weightPercent: 1.35 },
        { symbol: 'WEC', name: 'WEC ENERGY GROUP INC', weightPercent: 1.3 },
        { symbol: 'ED', name: 'CONSOLIDATED EDISON INC', weightPercent: 1.3 },
        { symbol: 'SO', name: 'SOUTHERN CO/THE', weightPercent: 1.28 },
        { symbol: 'QCOM', name: 'QUALCOMM INC', weightPercent: 1.26 }
      ],
      coveredWeightPercent: 30.73,
      asOfDate: '2026-07-30',
      sourceLabel: '스테이트스트리트(SPDR) 공식 일일 보유 종목 파일',
      sourceUrl: 'https://www.ssga.com/us/en/intermediary/funds/spdr-sp-dividend-etf-sdy'
    },
    asOfNote:
      '추종지수·총보수(0.35%)·상장일(2005년 11월 8일)·보유종목수(155종)·분기 지급·지수 규칙(20년 이상 연속 증배 후 배당수익률 가중)은 스테이트스트리트(SSGA) 공식 상품 페이지(ssga.com, 2026-08-02 조회)로 확인한 사실입니다. 지급월(3·6·9·12월)은 이 앱의 시장데이터 스냅샷(2026-07-29 기준)에 실지급월로 기록된 값입니다. 보유종목수는 지수 재편에 따라 달라지는 값이라 근사치로 보아야 합니다. 상위 섹터는 배당수익률 가중이라 순서가 자주 바뀌어 이 페이지에서는 다루지 않았습니다. 대표 보유 종목과 비중은 SSGA 공식 일일 보유 종목 파일(2026년 7월 30일 기준)에서 옮긴 값이며, 재편·리밸런싱과 일간 시세에 따라 계속 달라집니다. 배당률·배당성장률·기대수익률 등 계산에 쓰이는 값은 이 페이지가 아니라 시뮬레이터 계산 프리셋을 그대로 따릅니다.'
  },
  relatedTickers: [
    { ticker: 'NOBL', relationLabel: '25년 문턱과 동일가중을 원한다면' },
    { ticker: 'SCHD', relationLabel: '더 낮은 보수와 재무건전성 스크리닝을 원한다면' },
    { ticker: 'VYM', relationLabel: '더 넓게 분산된 고배당을 원한다면' },
    { ticker: 'DVY', relationLabel: '배당률 자체를 우선한 셀렉트 배당을 원한다면' }
  ],
  // SPDR 계열 정체성 변주 — 딥 플럼 → 오키드. SPYD(마룬→골드)와 겹치지 않게 자주 계열로 분리. 장식 전용.
  accent: {
    from: '#4a1c47',
    to: '#b256a8',
    textLight: '#6b2566',
    textDark: '#d894cf'
  },
  disclaimer:
    '이 페이지는 정보 제공을 목적으로 하며 투자 자문이 아닙니다. 배당률·주가·운용보수·세금 등은 시장 상황과 정책에 따라 변동될 수 있으며, 과거 성과가 미래 수익을 보장하지 않습니다. 투자 판단과 그 결과에 대한 책임은 투자자 본인에게 있습니다.',
  contentUpdatedAt: '2026-08-02'
};
