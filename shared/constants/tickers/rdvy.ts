import type { TickerContent } from './TickerContent.types';

/**
 * RDVY(퍼스트트러스트 라이징 디비던드 어치버스 ETF) SEO 랜딩 콘텐츠 — `schd.ts` 템플릿을 그대로 따른다.
 *
 * 숫자 출처:
 * - 계산 6필드는 `shared/constants/presets`(`US_DIVIDEND_GROWTH_ETFS.RDVY`)에서 그대로 온다.
 * - `reference`의 정적 사실(추종지수, 총보수 0.47%[2026-02-02 기준], 상장일 2014-01-06,
 *   보유종목수 71종[2026-07-31 기준, 현금 제외], 분기 지급)과 지수 스크리닝 4종
 *   (3년·5년 전 대비 배당 증가, 3년 전 대비 EPS 증가, 현금/부채 50% 초과, 배당성향 65% 이하),
 *   4개 서브포트폴리오를 3·6·9·12월에 하나씩 돌아가며 재구성하는 스태거드 리밸런싱 구조는
 *   퍼스트트러스트 공식 상품 페이지(ftportfolios.com, 2026-08-02 조회)로 확인.
 * - `topSectors`는 분기마다 서브포트폴리오가 통째로 교체돼 신뢰할 단일 현재값을 확인하지 못해
 *   **의도적으로 비웠다**.
 * - `topHoldings`는 퍼스트트러스트 공식 보유 종목 표(2026-08-02 조회, 기준일 2026-07-31)의 상위 20종이다.
 *   ⚠ 스태거드 리밸런싱 때문에 이 목록은 **분기마다 4분의 1씩 통째로 교체**된다 — 다른 ETF보다 빨리
 *   낡는다는 뜻이라 `asOfDate`를 특히 눈여겨봐야 한다.
 * - ⚠ 이 종목은 배당률이 이 페이지의 다른 배당 ETF보다 뚜렷하게 낮다 — 본문은 그 사실을 숨기지 않고
 *   "지금의 현금흐름이 아니라 인상 여력을 사는 상품"이라는 각도로 정직하게 다룬다.
 */
export const RDVY_TICKER_CONTENT: TickerContent = {
  ticker: 'RDVY',
  slug: 'rdvy',
  categoryIds: ['dividend-growth'],
  metaTitle: 'RDVY 배당률·선별 기준·운용보수 총정리 — 퍼스트트러스트 라이징 디비던드 어치버스 ETF',
  metaDescription:
    'RDVY(퍼스트트러스트 라이징 디비던드 어치버스 ETF)의 배당률·운용보수·배당 인상 여력 스크리닝(현금/부채, 배당성향, 이익 성장)을 정리했습니다. 지금의 배당보다 인상 여력을 보고 싶다면 여기서 확인하세요.',
  heroTagline: '이미 많이 주는 기업이 아니라, 앞으로 더 줄 여력이 남아 있는 기업을 고르는 ETF',
  sections: [
    {
      id: 'overview',
      navLabel: '개요',
      heading: 'RDVY, 무엇을 추종하는 ETF인가',
      paragraphs: [
        'RDVY(퍼스트트러스트 라이징 디비던드 어치버스 ETF, {{englishName}})는 나스닥 US 라이징 디비던드 어치버스 지수(Nasdaq US Rising Dividend Achievers Index)를 추종하는 패시브 ETF입니다. 이름 그대로 "배당을 늘리고 있는" 기업을 고르는데, 과거 이력만 보는 것이 아니라 앞으로 더 늘릴 수 있는 재무 여력까지 함께 봅니다.',
        '지수의 스크리닝은 네 가지입니다. 최근 12개월 배당이 3년 전·5년 전 같은 기간보다 많을 것, 최근 회계연도 주당순이익이 3년 전보다 많을 것, 현금이 부채의 50%를 넘을 것, 배당성향이 65% 이하일 것. 앞의 둘이 지금까지 늘려 왔는가를 보고, 뒤의 둘이 앞으로도 늘릴 여력이 있는가를 봅니다.',
        '{{koreanName}}는 2014년 1월 상장했고, 이 시뮬레이터가 참조하는 계산 프리셋은 배당률 {{dividendYield}}, 연 배당성장률(가정) {{dividendGrowth}}, {{frequencyLabel}} 지급을 기준으로 합니다.'
      ],
      stat: {
        label: '추종 지수',
        value: '나스닥 US 라이징 디비던드 어치버스 지수',
        caption: '배당 증가 이력 + 이익 성장 + 현금/부채 50% 초과 + 배당성향 65% 이하'
      }
    },
    {
      id: 'dividend-yield',
      navLabel: '배당률',
      heading: '배당률 {{dividendYield}} — 낮은 것이 설계의 결과다',
      paragraphs: [
        'RDVY의 배당률은 {{dividendYield}} 안팎으로, 이 페이지에서 다루는 다른 배당 ETF보다 낮은 편입니다. 이는 이 상품이 잘못 만들어졌다는 신호가 아니라 지수 설계의 직접적인 결과입니다.',
        '배당성향 65% 이하라는 조건이 그 이유입니다. 배당성향은 벌어들인 이익 중 배당으로 나간 비율인데, 이 상한이 있으면 이익 대부분을 배당으로 내보내는 고배당 기업은 애초에 편입되지 않습니다. 남는 것은 아직 배당으로 덜 나간, 그래서 더 늘릴 여지가 남아 있는 기업입니다.',
        '즉 이 상품에서 낮은 배당률은 "지금 받는 현금이 적다"는 뜻이면서 동시에 "인상 여력이 남아 있다"는 뜻입니다. 지금 당장의 현금흐름이 목적이라면 다른 카테고리가 맞고, 시간이 지나며 늘어나는 배당이 목적이라면 이 설계가 의미를 갖습니다. 내 조건에서의 실제 현금흐름은 시뮬레이터에서 직접 계산해 보세요.'
      ],
      stat: {
        label: '배당률(세전, 명목)',
        value: '{{dividendYield}}',
        caption: '시뮬레이터 계산 프리셋 기준 — 배당성향 상한 때문에 고배당 계열보다 낮게 나옵니다'
      }
    },
    {
      id: 'dividend-growth',
      navLabel: '배당성장',
      heading: '인상 여력을 사는 대신, 지금을 양보한다',
      paragraphs: [
        '이 시뮬레이터의 계산 프리셋은 RDVY의 연 배당성장률(가정)을 {{dividendGrowth}}로 두고, 기대 총수익률을 {{expectedTotalReturn}}로 봅니다. 배당률이 낮은 만큼 기대 총수익률 대부분이 주가 상승 쪽에 배정된 가정입니다.',
        '배당을 재투자하면 이듬해 배당은 늘어난 주당 배당금과 늘어난 보유 수량이 함께 곱해져 계산됩니다. 시작 배당률이 낮으면 초기에 재투자되는 금액 자체가 작아 체감이 느리지만, 인상률이 높게 유지되면 시간이 지날수록 격차가 좁혀지는 구조입니다 — 어느 쪽이 유리한지는 보유 기간에 따라 갈립니다.',
        '이 성장률은 과거의 반복이 아니라 가정입니다. 현금/부채 비율과 배당성향 조건을 통과했다는 것은 인상 여력이 있다는 뜻이지 인상을 약속한다는 뜻이 아니며, 실제 인상 폭은 매년 이사회 결정과 실적에 따라 달라집니다.'
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
      heading: '총보수 0.47% — 이 페이지에서 높은 축',
      paragraphs: [
        'RDVY의 총보수는 0.47%입니다(2026년 2월 2일 기준). 이 시뮬레이터가 다루는 패시브 배당 ETF 가운데 높은 축으로, SCHD(0.06%)의 여덟 배에 가깝고 NOBL·SDY(각 0.35%)보다도 높습니다.',
        '보수는 매년 조용히 수익률에서 빠져나갑니다. 배당률이 낮은 상품에서는 이 비용이 상대적으로 더 무겁게 느껴질 수 있습니다 — 받는 배당의 상당 부분이 보수로 상쇄되는 구간이 생기기 때문입니다.',
        '분기마다 서브포트폴리오를 하나씩 통째로 재구성하는 운용 방식이 비용의 배경 중 하나입니다. 규칙 기반 패시브 상품이지만 회전율이 낮지 않은 구조라는 점을 함께 감안하는 편이 정확합니다.'
      ],
      stat: {
        label: '운용보수(총보수)',
        value: '0.47%',
        caption: '퍼스트트러스트 공식 상품 페이지 기준(2026-02-02 기준값, 2026-08-02 확인)'
      }
    },
    {
      id: 'selection-criteria',
      navLabel: '구성 기준',
      heading: '분기마다 4분의 1씩 새로 짜는 구조',
      paragraphs: [
        '지수는 조건을 통과한 종목 가운데 5년간의 배당 증가 금액·현재 배당수익률·배당성향을 결합한 순위로 최대 50종을 뽑고, 그중 최소 33종은 대형주로 채웁니다. 조회 시점 기준 실제 보유는 71종(현금 제외)입니다.',
        '독특한 것은 리밸런싱 방식입니다. 지수는 네 개의 서브포트폴리오로 나뉘어 있고, 3월·6월·9월·12월에 하나씩 돌아가며 재구성·동일가중됩니다. 연 1회 기준으로는 네 서브포트폴리오가 각각 전체의 25% 비중을 갖도록 맞춥니다.',
        '이 구조는 한 시점의 시장 상황이 포트폴리오 전체를 결정하지 않게 분산하는 효과가 있습니다. 대신 어떤 종목은 편입 후 최대 1년 가까이 재심사를 받지 않을 수 있어, 조건이 나빠진 종목이 한동안 남아 있을 여지도 함께 생깁니다.'
      ]
    },
    {
      id: 'who-and-tradeoffs',
      navLabel: '적합성·트레이드오프',
      heading: '어떤 투자자에게 맞고, 무엇을 포기하는가',
      paragraphs: [
        'RDVY는 이런 투자자에게 잘 맞습니다. 지금 받는 배당보다 앞으로 늘어날 여력을 우선하는 사람, 배당 이력뿐 아니라 재무 여력(현금/부채, 배당성향)까지 규칙으로 걸러 주기를 원하는 사람, 보유 기간을 길게 잡을 수 있는 사람입니다.',
        '트레이드오프도 분명합니다. 첫째, 배당률이 낮아 당장의 현금흐름은 작습니다. 둘째, 총보수 0.47%는 이 카테고리에서 높은 축입니다. 셋째, 최대 50종을 뽑는 집중형 구성이라 대형 배당 ETF(수백 종)보다 개별 종목의 영향이 큽니다. 넷째, 분기마다 서브포트폴리오가 통째로 교체돼 구성이 자주 바뀝니다.',
        'RDVY는 지금의 배당액이 아니라 인상 여력을 사는 쪽에 가까운 상품입니다. 지금의 현금흐름이 필요하면 VYM·HDV 같은 고배당 계열, 이력의 길이를 우선하면 NOBL·SDY, 보수와 분산을 우선하면 SCHD·DGRO와 함께 비교해 보세요.'
      ]
    }
  ],
  faqs: [
    {
      question: 'RDVY 배당률은 얼마인가요?',
      answer:
        '이 시뮬레이터가 쓰는 계산 프리셋 기준 RDVY의 명목 배당률(세전)은 {{dividendYield}}입니다. 지수가 배당성향 65% 이하인 기업만 담기 때문에 고배당 ETF보다 낮게 나오는 것이 설계상 자연스러운 결과입니다. 내 조건에서의 실제 현금흐름은 시뮬레이터에서 직접 계산해 보세요.'
    },
    {
      question: 'RDVY 배당은 얼마나 자주 지급되나요?',
      answer: 'RDVY는 {{frequencyLabel}} 지급됩니다. 정확한 배당락일과 지급일은 매 분기 공지에 따라 달라질 수 있습니다.'
    },
    {
      question: 'RDVY는 어떤 기준으로 종목을 고르나요?',
      answer:
        '최근 12개월 배당이 3년 전·5년 전보다 많을 것, 최근 회계연도 주당순이익이 3년 전보다 많을 것, 현금이 부채의 50%를 넘을 것, 배당성향이 65% 이하일 것 — 이 네 조건을 통과한 종목 가운데 순위 상위 최대 50종을 담습니다.'
    },
    {
      question: 'RDVY 운용보수(총보수)는 얼마인가요?',
      answer:
        '0.47%입니다(퍼스트트러스트 공식 상품 페이지의 2026년 2월 2일 기준값, 2026-08-02 확인). 이 시뮬레이터가 다루는 패시브 배당 ETF 가운데 높은 축입니다.'
    },
    {
      question: 'RDVY는 왜 배당률이 낮은가요?',
      answer:
        '지수가 배당성향 65% 이하라는 상한을 두기 때문입니다. 이익 대부분을 배당으로 내보내는 고배당 기업은 이 조건에서 걸러지고, 아직 배당으로 덜 나간 기업만 남습니다. 낮은 배당률은 인상 여력이 남아 있다는 뜻이기도 합니다.'
    },
    {
      question: 'RDVY는 몇 종목을 담고 있나요?',
      answer:
        '조회 시점 기준 71종입니다(현금 제외). 지수는 최대 50종을 선정하되 네 개 서브포트폴리오가 분기마다 하나씩 재구성되는 구조라, 실제 보유 종목 수는 선정 수와 다를 수 있습니다.'
    },
    {
      question: 'RDVY와 SCHD는 무엇이 다른가요?',
      answer:
        'SCHD는 10년 이상 배당 지급 이력과 재무 건전성 종합 점수로 약 100종을 담고 보수가 0.06%입니다. RDVY는 배당 인상 여력(현금/부채, 배당성향)에 초점을 맞춰 최대 50종만 담고 보수가 0.47%입니다. 배당률은 SCHD 쪽이 높고, 구성 집중도는 RDVY 쪽이 높습니다.'
    },
    {
      question: 'RDVY 배당에 붙는 세금은 어떻게 계산하나요?',
      answer:
        '배당소득세는 거주 국가와 계좌 종류에 따라 달라지며 이 페이지가 대신 알려드릴 수 없습니다. 이 시뮬레이터에서는 세율을 직접 입력해 세후 배당을 계산해 볼 수 있습니다.'
    }
  ],
  reference: {
    trackedIndex: '나스닥 US 라이징 디비던드 어치버스 지수(Nasdaq US Rising Dividend Achievers Index)',
    inceptionYear: 2014,
    expenseRatioPercent: 0.47,
    holdingsCountApprox: 71,
    paymentMonthsNote: '연 4회 분기 지급',
    topHoldings: {
      holdings: [
        { symbol: 'AMAT', name: 'Applied Materials, Inc.', weightPercent: 3.29 },
        { symbol: 'LRCX', name: 'Lam Research Corporation', weightPercent: 2.99 },
        { symbol: 'KLAC', name: 'KLA Corporation', weightPercent: 2.51 },
        { symbol: 'ROST', name: 'Ross Stores, Inc.', weightPercent: 2.37 },
        { symbol: 'GEV', name: 'GE Vernova Inc.', weightPercent: 2.36 },
        { symbol: 'BNY', name: 'The Bank of New York Mellon Corporation', weightPercent: 2.32 },
        { symbol: 'TRV', name: 'The Travelers Companies, Inc.', weightPercent: 2.27 },
        { symbol: 'ALL', name: 'The Allstate Corporation', weightPercent: 2.23 },
        { symbol: 'BAC', name: 'Bank of America Corporation', weightPercent: 2.13 },
        { symbol: 'GOOGL', name: 'Alphabet Inc. (Class A)', weightPercent: 2.11 },
        { symbol: 'MLI', name: 'Mueller Industries, Inc.', weightPercent: 2.08 },
        { symbol: 'WSM', name: 'Williams-Sonoma, Inc.', weightPercent: 2.08 },
        { symbol: 'GE', name: 'GE Aerospace', weightPercent: 2.05 },
        { symbol: 'JPM', name: 'JPMorgan Chase & Co.', weightPercent: 2.05 },
        { symbol: 'SNA', name: 'Snap-on Incorporated', weightPercent: 2.04 },
        { symbol: 'CB', name: 'Chubb Limited', weightPercent: 2.03 },
        { symbol: 'ADP', name: 'Automatic Data Processing, Inc.', weightPercent: 1.94 },
        { symbol: 'V', name: 'Visa Inc. (Class A)', weightPercent: 1.94 },
        { symbol: 'BKR', name: 'Baker Hughes Company (Class A)', weightPercent: 1.93 },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', weightPercent: 1.92 }
      ],
      coveredWeightPercent: 44.64,
      asOfDate: '2026-07-31',
      sourceLabel: '퍼스트트러스트 공식 보유 종목 표',
      sourceUrl: 'https://www.ftportfolios.com/Retail/Etf/EtfHoldings.aspx?Ticker=RDVY'
    },
    asOfNote:
      '추종지수·총보수(0.47%, 2026년 2월 2일 기준값)·상장일(2014년 1월 6일)·보유종목수(71종, 2026년 7월 31일 기준 현금 제외)·분기 지급·지수 스크리닝 4종(3년·5년 전 대비 배당 증가, 3년 전 대비 주당순이익 증가, 현금/부채 50% 초과, 배당성향 65% 이하)·최대 50종 선정 및 4개 서브포트폴리오 스태거드 리밸런싱(3·6·9·12월)은 퍼스트트러스트 공식 상품 페이지(ftportfolios.com, 2026-08-02 조회)로 확인한 사실입니다. 보유종목수는 분기 재구성에 따라 달라지는 값이라 근사치로 보아야 합니다. 상위 섹터는 서브포트폴리오가 분기마다 통째로 교체돼 이 페이지에서는 다루지 않았습니다. 대표 보유 종목과 비중은 퍼스트트러스트 공식 보유 종목 표(2026년 7월 31일 기준)에서 옮긴 값이며, 스태거드 리밸런싱으로 분기마다 4분의 1씩 교체되므로 다른 ETF보다 빨리 낡습니다. 배당률·배당성장률·기대수익률 등 계산에 쓰이는 값은 이 페이지가 아니라 시뮬레이터 계산 프리셋을 그대로 따릅니다.'
  },
  relatedTickers: [
    { ticker: 'DGRW', relationLabel: '수익성 가중의 배당성장을 원한다면' },
    { ticker: 'SCHD', relationLabel: '더 낮은 보수와 더 높은 배당률을 원한다면' },
    { ticker: 'NOBL', relationLabel: '증배 이력의 길이를 우선한다면' },
    { ticker: 'VIG', relationLabel: '더 넓게 분산된 대형주 배당성장을 원한다면' }
  ],
  // 퍼스트트러스트 정체성 — 딥 인디고 → 코발트. 장식 전용(대비는 textLight/Dark로 확보).
  accent: {
    from: '#1f2a63',
    to: '#6478d6',
    textLight: '#2b3a8c',
    textDark: '#98a8ec'
  },
  disclaimer:
    '이 페이지는 정보 제공을 목적으로 하며 투자 자문이 아닙니다. 배당률·주가·운용보수·세금 등은 시장 상황과 정책에 따라 변동될 수 있으며, 과거 성과가 미래 수익을 보장하지 않습니다. 투자 판단과 그 결과에 대한 책임은 투자자 본인에게 있습니다.',
  contentUpdatedAt: '2026-08-02'
};
